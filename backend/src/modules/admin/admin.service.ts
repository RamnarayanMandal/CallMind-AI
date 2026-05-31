import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Subscription } from '../subscription/schemas/subscription.schema';
import { Agent, AgentDocument } from '../agent/schemas/agent.schema';
import { PlatformConfig, PlatformConfigDocument } from './schemas/platform-config.schema';
import { UpdateTelephonyConfigDto } from './dto/telephony-config.dto';

type SubscriptionDocument = Subscription & Document;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    @InjectModel(PlatformConfig.name) private platformConfigModel: Model<PlatformConfigDocument>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalAgents, activeSubscriptions] = await Promise.all([
      this.userModel.countDocuments(),
      this.agentModel.countDocuments(),
      this.subscriptionModel.countDocuments({ status: 'active' }),
    ]);

    return {
      totalUsers,
      totalAgents,
      activeSubscriptions,
      systemHealth: 'Healthy',
    };
  }

  async getAnalytics() {
    const subStats = await this.subscriptionModel.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalMinutesUsed: { $sum: '$minutesUsed' } } }
    ]);

    const userGrowth = await this.userModel.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    return {
      totalMinutesUsed: subStats[0]?.totalMinutesUsed || 0,
      userGrowth: userGrowth.map(u => ({ date: u._id, users: u.count }))
    };
  }

  async getUsers() {
    return this.userModel.find().select('-password -__v').exec();
  }

  async getSubscriptions() {
    return this.subscriptionModel.find().populate('planId').exec();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Global Telephony Provider Configuration
  // ──────────────────────────────────────────────────────────────────────

  async getTelephonyConfig() {
    // Upsert the singleton document if it doesn't exist yet
    const config = await this.platformConfigModel.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { key: 'global', defaultTelephonyProvider: 'vobiz' } },
      { upsert: true, new: true }
    );
    return {
      defaultTelephonyProvider: config.defaultTelephonyProvider,
      telephonyAccountId: config.telephonyAccountId,
      // Never expose authToken in plain text — mask it
      telephonyAuthToken: config.telephonyAuthToken
        ? `${config.telephonyAuthToken.slice(0, 6)}${'*'.repeat(Math.max(0, config.telephonyAuthToken.length - 10))}${config.telephonyAuthToken.slice(-4)}`
        : undefined,
      telephonyFromNumber: config.telephonyFromNumber,
      telephonyMetadata: config.telephonyMetadata,
      hasCredentials: !!config.telephonyAccountId && !!config.telephonyAuthToken,
    };
  }

  async updateTelephonyConfig(dto: UpdateTelephonyConfigDto) {
    const update: Partial<PlatformConfig> = {
      defaultTelephonyProvider: dto.defaultTelephonyProvider,
    };

    if (dto.telephonyAccountId !== undefined) update.telephonyAccountId = dto.telephonyAccountId;
    if (dto.telephonyAuthToken !== undefined) update.telephonyAuthToken = dto.telephonyAuthToken;
    if (dto.telephonyFromNumber !== undefined) update.telephonyFromNumber = dto.telephonyFromNumber;
    if (dto.telephonyMetadata !== undefined) update.telephonyMetadata = dto.telephonyMetadata;

    await this.platformConfigModel.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { upsert: true, new: true }
    );

    this.logger.log(`Global telephony provider updated to: ${dto.defaultTelephonyProvider}`);

    return { success: true, message: `Telephony provider updated to ${dto.defaultTelephonyProvider}` };
  }

  /** Used by other services to get the global provider credentials */
  async getGlobalTelephonyCredentials() {
    const config = await this.platformConfigModel.findOne({ key: 'global' });
    if (!config) return null;
    return {
      providerName: config.defaultTelephonyProvider,
      accountId: config.telephonyAccountId,
      authToken: config.telephonyAuthToken,
      fromNumber: config.telephonyFromNumber,
      metadata: config.telephonyMetadata,
    };
  }
}
