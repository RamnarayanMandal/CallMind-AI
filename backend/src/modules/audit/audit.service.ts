import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit.schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Log an audit event
   */
  async log(params: {
    organizationId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
  }): Promise<void> {
    try {
      await this.auditModel.create({
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: params.status || 'success',
      });
    } catch (err) {
      this.logger.error(`Failed to log audit event: ${err.message}`);
    }
  }

  /**
   * Get audit logs for an organization
   */
  async getAuditLogs(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      action?: string;
      resource?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId,
      startDate,
      endDate,
    } = options;

    const filter: any = { organizationId };

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      this.auditModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string) {
    return this.auditModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('organizationId', 'name')
      .lean();
  }
}
