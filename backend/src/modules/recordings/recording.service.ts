import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call, CallDocument } from '../call/schemas/call.schema';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<CallDocument>,
  ) {}

  /**
   * Get recordings for an organization with filtering
   */
  async getRecordings(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const filter: any = {
      organizationId,
      recordingUrl: { $exists: true, $ne: null },
    };

    if (status) {
      filter.recordingStatus = status;
    }

    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { callSid: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.callModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customerId', 'name phone')
        .lean(),
      this.callModel.countDocuments(filter),
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
   * Get a single recording by ID
   */
  async getRecordingById(id: string) {
    const call = await this.callModel
      .findById(id)
      .populate('customerId', 'name phone email')
      .populate('agentId', 'name language')
      .lean();

    if (!call || !call.recordingUrl) {
      throw new NotFoundException('Recording not found');
    }

    return call;
  }

  /**
   * Delete a recording
   */
  async deleteRecording(id: string) {
    const call = await this.callModel.findById(id);
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Clear recording fields
    await this.callModel.findByIdAndUpdate(id, {
      $unset: {
        recordingUrl: 1,
        recordingDuration: 1,
        recordingStatus: 1,
        storageBytes: 1,
      },
    });

    this.logger.log(`Recording deleted for call ${id}`);
    return { success: true };
  }

  /**
   * Get storage analytics for an organization
   */
  async getStorageAnalytics(organizationId: string) {
    const result = await this.callModel.aggregate([
      {
        $match: {
          organizationId,
          recordingUrl: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalRecordings: { $sum: 1 },
          totalStorageBytes: { $sum: { $ifNull: ['$storageBytes', 0] } },
          totalDurationSeconds: { $sum: { $ifNull: ['$recordingDuration', 0] } },
          avgDurationSeconds: { $avg: { $ifNull: ['$recordingDuration', 0] } },
        },
      },
    ]);

    const stats = result[0] || {
      totalRecordings: 0,
      totalStorageBytes: 0,
      totalDurationSeconds: 0,
      avgDurationSeconds: 0,
    };

    // Get status breakdown
    const statusBreakdown = await this.callModel.aggregate([
      {
        $match: {
          organizationId,
          recordingUrl: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$recordingStatus', 'unknown'] },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalRecordings: stats.totalRecordings,
      totalStorageBytes: stats.totalStorageBytes,
      totalStorageMB: Math.round(stats.totalStorageBytes / (1024 * 1024) * 100) / 100,
      totalDurationMinutes: Math.round(stats.totalDurationSeconds / 60 * 100) / 100,
      avgDurationSeconds: Math.round(stats.avgDurationSeconds),
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Search recordings
   */
  async searchRecordings(organizationId: string, query: string) {
    return this.callModel
      .find({
        organizationId,
        recordingUrl: { $exists: true, $ne: null },
        $or: [
          { phoneNumber: { $regex: query, $options: 'i' } },
          { callSid: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name phone')
      .lean();
  }
}
