import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, type: string, title: string, message: string, data?: Record<string, any>) {
    const notification = await this.notificationModel.create({ userId, type, title, message, data });
    this.notificationGateway.sendToUser(userId, 'notification:new', notification);
    return notification;
  }

  async createForAllAdmins(adminUserIds: string[], type: string, title: string, message: string, data?: Record<string, any>) {
    const notifications = await this.notificationModel.insertMany(
      adminUserIds.map(userId => ({ userId, type, title, message, data }))
    );
    for (const notif of notifications) {
      this.notificationGateway.sendToUser(notif.userId, 'notification:new', notif);
    }
    return notifications;
  }

  async findByUser(userId: string, query: { page?: number; limit?: number; type?: string; read?: boolean }) {
    const { page = 1, limit = 20, type, read } = query;
    const filter: any = { userId };
    if (type) filter.type = type;
    if (read !== undefined) filter.read = read;

    const [data, total] = await Promise.all([
      this.notificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      notifications: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({ userId, read: false });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
    return { success: true };
  }
}
