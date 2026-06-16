import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Contact, ContactDocument, ContactStatus } from './schemas/contact.schema';
import { CreateContactDto } from './dto/contact.dto';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';
import { User } from '../auth/schemas/user.schema';
import { Call, CallStatus } from '../call/schemas/call.schema';
import { CALL_QUEUE } from '../call/call.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(Call.name) private callModel: Model<any>,
    @InjectQueue(CALL_QUEUE) private callQueue: Queue,
    @InjectQueue('mail-queue') private mailQueue: Queue,
    private notificationService: NotificationService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateContactDto) {
    const contact = await this.contactModel.create(dto);

    // Notify all admins
    try {
      const admins = await this.userModel.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).lean();
      const adminIds = admins.map((a: any) => a._id.toString());
      const adminEmails = admins.map((a: any) => a.email).filter(Boolean);

      await this.notificationService.createForAllAdmins(
        adminIds,
        'contact_submission',
        'New Contact Message',
        `${dto.name} sent a message: ${dto.subject}`,
        { contactId: contact._id.toString() },
      );

      // Enqueue job for sending email notification to the user's requested email: ramnarayan847230@gmail.com
      await this.mailQueue.add(
        'send-contact-email',
        {
          to: 'ramnarayan847230@gmail.com',
          contact: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            subject: dto.subject,
            message: dto.message,
          },
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );

      // Enqueue jobs for other admins instead of sending them synchronously
      for (const email of adminEmails) {
        // Skip if it is already ramnarayan847230@gmail.com to avoid double emails
        if (email === 'ramnarayan847230@gmail.com') continue;

        await this.mailQueue.add(
          'send-contact-email',
          {
            to: email,
            contact: {
              name: dto.name,
              email: dto.email,
              phone: dto.phone,
              subject: dto.subject,
              message: dto.message,
            },
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
          },
        );
      }
    } catch (err) {
      this.logger.error('Failed to notify admins', (err as Error).message);
    }

    return contact;
  }

  async findAll(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.contactModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('assignedAgentId')
        .lean(),
      this.contactModel.countDocuments(filter),
    ]);

    return {
      contacts: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findById(id: string) {
    const contact = await this.contactModel.findById(id)
      .populate('assignedAgentId')
      .populate('callId')
      .lean();
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async assignAgent(id: string, agentId: string) {
    const contact = await this.contactModel.findByIdAndUpdate(
      id,
      { $set: { assignedAgentId: agentId, status: ContactStatus.CONTACTED } },
      { new: true },
    ).populate('assignedAgentId');
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async updateResponse(id: string, response: string) {
    const contact = await this.contactModel.findByIdAndUpdate(
      id,
      { $set: { response, respondedAt: new Date(), status: ContactStatus.RESOLVED } },
      { new: true },
    );
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async triggerCall(id: string, agentId: string) {
    const contact = await this.contactModel.findById(id);
    if (!contact) throw new NotFoundException('Contact not found');

    // Create a system admin user as customer fallback
    const call = await this.callModel.create({
      customerId: contact.name,
      agentId,
      organizationId: 'system',
      phoneNumber: contact.phone,
      status: CallStatus.PENDING,
    });

    await this.contactModel.findByIdAndUpdate(id, {
      $set: { assignedAgentId: agentId, callId: call._id.toString(), status: ContactStatus.CONTACTED },
    });

    // Enqueue for processing within 24 hours
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.callQueue.add(
      'execute',
      { callId: call._id.toString() },
      { delay: 24 * 60 * 60 * 1000, attempts: 3 },
    );

    return { callId: call._id, scheduledAt };
  }
}
