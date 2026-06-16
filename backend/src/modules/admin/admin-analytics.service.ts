import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call, CallDocument } from '../call/schemas/call.schema';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<CallDocument>,
  ) {}

  /**
   * System-wide overview for super-admin dashboard
   */
  async getSystemOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCalls, completedCalls, failedCalls, callTrend, topOrgs] = await Promise.all([
      this.callModel.countDocuments(),
      this.callModel.countDocuments({ status: 'completed' }),
      this.callModel.countDocuments({ status: 'failed' }),
      this.getSystemCallTrend(thirtyDaysAgo),
      this.getTopOrganizations(),
    ]);

    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      successRate,
      callTrend,
      topOrgs,
      period: '30d',
    };
  }

  /**
   * Per-organization usage breakdown
   */
  async getOrgUsageBreakdown() {
    return this.callModel.aggregate([
      {
        $group: {
          _id: '$organizationId',
          totalCalls: { $sum: 1 },
          completedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          failedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          totalMinutes: {
            $sum: { $divide: [{ $ifNull: ['$durationSeconds', 0] }, 60] },
          },
          lastCall: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'organizations',
          let: { orgId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$orgId'] },
                    { $eq: [{ $toString: '$_id' }, '$$orgId'] },
                  ],
                },
              },
            },
            { $project: { name: 1, email: 1 } },
          ],
          as: 'org',
        },
      },
      { $unwind: { path: '$org', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          organizationId: '$_id',
          orgName: { $ifNull: ['$org.name', 'Unknown Org'] },
          totalCalls: 1,
          completedCalls: 1,
          failedCalls: 1,
          totalMinutes: { $round: ['$totalMinutes', 1] },
          successRate: {
            $cond: [
              { $eq: ['$totalCalls', 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ['$completedCalls', '$totalCalls'] }, 100] },
                  1,
                ],
              },
            ],
          },
          lastCall: 1,
        },
      },
      { $sort: { totalCalls: -1 } },
      { $limit: 50 },
    ]);
  }

  /**
   * Daily call volume trend for the last N days
   */
  async getCallTrendByOrg(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.callModel.aggregate([
      { $match: { organizationId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async getSystemCallTrend(since: Date) {
    return this.callModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private async getTopOrganizations() {
    return this.callModel.aggregate([
      {
        $group: {
          _id: '$organizationId',
          totalCalls: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'organizations',
          let: { orgId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$orgId'] },
              },
            },
            { $project: { name: 1 } },
          ],
          as: 'org',
        },
      },
      { $unwind: { path: '$org', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          orgName: { $ifNull: ['$org.name', 'Unknown'] },
          totalCalls: 1,
        },
      },
      { $sort: { totalCalls: -1 } },
      { $limit: 10 },
    ]);
  }
}
