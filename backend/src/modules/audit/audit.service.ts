import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(action: string, userId: string, email: string, ip: string, metadata: any = {}) {
    await this.auditLogModel.create({
      action,
      userId,
      userEmail: email,
      ip,
      metadata,
    });
  }

  async getLogs(userId?: string) {
    const query = userId ? { userId } : {};
    return this.auditLogModel.find(query).sort({ createdAt: -1 }).limit(100).exec();
  }
}
