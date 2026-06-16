import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Call, CallDocument, CallStatus, CallOutcome } from './schemas/call.schema';
import { CreateCallDto, UpdateCallOutcomeDto } from './dto/call.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { TelephonyProviderFactory } from '@providers/telephony/telephony.factory';
import { ProviderCredentials } from '@providers/telephony/telephony.interface';
import { ILlmProvider, LLM_PROVIDER } from '@providers/llm/llm.interface';
import { buildPaginationMeta, buildSkip, PaginatedResult, PaginationOptions } from '@common/utils/pagination.util';

export const CALL_QUEUE = 'call';

@Injectable()
export class CallRepository extends BaseRepository<CallDocument> {
  constructor(@InjectModel(Call.name) model: Model<CallDocument>) {
    super(model);
  }

  async findPaginated(
    filter: FilterQuery<CallDocument>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<CallDocument>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = buildSkip(page, limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as any;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customerId agentId')
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { data: data as any, meta: buildPaginationMeta(total, page, limit) };
  }

  async findPendingScheduled(): Promise<CallDocument[]> {
    return this.model
      .find({
        status: CallStatus.PENDING,
        scheduledAt: { $lte: new Date() },
      })
      .populate('customerId agentId')
      .lean() as any;
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CustomerService } from '../customer/customer.service';
import { SubscriptionService } from '../subscription/subscription.service';

import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class CallService {
  constructor(
    private readonly repo: CallRepository,
    private readonly customerService: CustomerService,
    private readonly subscriptionService: SubscriptionService,
    private readonly organizationService: OrganizationService,
    private readonly telephonyFactory: TelephonyProviderFactory,
    @InjectQueue(CALL_QUEUE) private readonly callQueue: Queue,
  ) {}

  async create(dto: CreateCallDto): Promise<CallDocument> {
    return this.repo.create({ ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined });
  }

  async findAll(organizationId: string, pagination: PaginationDto, search?: string, status?: CallStatus) {
    const filter: any = { organizationId };

    if (status) {
      filter.status = status;
    }

    if (search) {
      const customerIds = await this.customerService.findIdsBySearch(organizationId, search);
      filter.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { customerId: { $in: customerIds } },
        { outcome: { $regex: search, $options: 'i' } },
      ];
    }

    return this.repo.findPaginated(filter, pagination);
  }

  async findOne(id: string): Promise<CallDocument> {
    const call = await this.repo['model'].findById(id).populate('customerId agentId').lean();
    if (!call) throw new NotFoundException('Call not found');
    return call as any;
  }

  async findByCallSid(callSid: string): Promise<CallDocument> {
    const call = await this.repo.findOne({ callSid });
    return call;
  }

  async updateRecordingUrl(callSid: string, url: string, duration?: number): Promise<void> {
    const update: any = { recordingUrl: url };
    if (duration) update.recordingDuration = duration;
    await this.repo['model'].findOneAndUpdate({ callSid }, update);
  }

  async updateOutcome(id: string, dto: UpdateCallOutcomeDto) {
    return this.repo.updateById(id, { outcome: dto.outcome });
  }

  async executeCall(callId: string): Promise<void> {
    const call = await this.findOne(callId);
    
    // Check subscription limits before making a call
    const canCall = await this.subscriptionService.canMakeCall(call.organizationId);
    if (!canCall) {
      await this.repo.updateById(callId, {
        status: CallStatus.FAILED,
        errorMessage: 'Subscription limit reached or inactive plan',
      });
      throw new Error('Subscription limit reached');
    }

    // Just enqueue the job and return immediately
    await this.callQueue.add('execute', { callId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });
  }

  async processExecution(callId: string): Promise<void> {
    const call = await this.findOne(callId);

    await this.repo.updateById(callId, {
      status: CallStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    try {
      const org = await this.organizationService.findById(call.organizationId);
      if (!org) throw new Error('Organization not found');

      const providerName = org.telephonyProviderName || 'vobiz';
      const provider = this.telephonyFactory.getProvider(providerName);

      let credentials: ProviderCredentials | undefined;
      if (org.telephonyAccountId && org.telephonyAuthToken) {
        credentials = {
          accountId: org.telephonyAccountId,
          authToken: org.telephonyAuthToken,
          metadata: org.telephonyMetadata,
        };
      }

      const result = await provider.initiateCall({
        to: call.phoneNumber,
        from: org.telephonyPhoneNumber,
        metadata: { callId, agentId: call.agentId },
      }, credentials);

      await this.repo.updateById(callId, { callSid: result.callSid, provider: providerName });
    } catch (err) {
      await this.repo.updateById(callId, {
        status: CallStatus.FAILED,
        errorMessage: err.message,
        endedAt: new Date(),
      });
      throw err; // Re-throw to trigger Bull retry
    }
  }

  async completeCall(callId: string, outcome: CallOutcome, durationSeconds: number) {
    return this.repo.updateById(callId, {
      status: CallStatus.COMPLETED,
      outcome,
      durationSeconds,
      endedAt: new Date(),
    });
  }

  async updateStatus(callId: string, status: CallStatus, errorMessage?: string) {
    const update: any = { status };
    if (errorMessage) update.errorMessage = errorMessage;
    if (status === CallStatus.COMPLETED || status === CallStatus.FAILED) {
      update.endedAt = new Date();
    }
    return this.repo.updateById(callId, update);
  }

  async findPendingScheduled(): Promise<CallDocument[]> {
    return this.repo.findPendingScheduled();
  }

  async getCallStats(organizationId: string) {
    return this.repo['model'].aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}
