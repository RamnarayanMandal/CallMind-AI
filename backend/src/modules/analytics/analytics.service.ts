import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call, CallDocument } from '../call/schemas/call.schema';
import { Conversation, ConversationDocument } from '../conversation/schemas/conversation.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<CallDocument>,
    @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
  ) {}

  async getDashboardStats(organizationId: string) {
    const [callStats, outcomeStats, dailyTrend, topTopics] = await Promise.all([
      this.getCallStats(organizationId),
      this.getOutcomeStats(organizationId),
      this.getDailyCallTrend(organizationId),
      this.getTopTopics(organizationId),
    ]);

    return { callStats, outcomeStats, dailyTrend, topTopics };
  }

  private async getCallStats(organizationId: string) {
    const result = await this.callModel.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgDuration: { $avg: '$durationSeconds' },
        },
      },
    ]);
    return result[0] || { total: 0, completed: 0, failed: 0, avgDuration: 0 };
  }

  private async getOutcomeStats(organizationId: string) {
    return this.callModel.aggregate([
      { $match: { organizationId, status: 'completed' } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  private async getDailyCallTrend(organizationId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.callModel.aggregate([
      { $match: { organizationId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private async getTopTopics(organizationId: string) {
    return this.convModel.aggregate([
      { $match: { organizationId } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
  }
}
