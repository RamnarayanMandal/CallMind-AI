import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Subscription } from '../subscription/schemas/subscription.schema';
import { Agent, AgentDocument } from '../agent/schemas/agent.schema';
import { PlatformConfig, PlatformConfigDocument } from './schemas/platform-config.schema';
import { Organization, OrganizationDocument } from '../organization/schemas/organization.schema';
import { Call, CallDocument } from '../call/schemas/call.schema';
import { Plan } from '../subscription/schemas/plan.schema';
import * as bcrypt from 'bcryptjs';
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
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Call.name) private callModel: Model<CallDocument>,
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
  // Organization Billing
  // ──────────────────────────────────────────────────────────────────────

  async getOrganizations() {
    const orgs = await this.organizationModel.find().lean();
    const subs = await this.subscriptionModel.find().populate('planId').lean();
    const users = await this.userModel.find().select('name email organizationId').lean();
    const subMap = new Map(subs.map(s => [s.organizationId.toString(), s]));

    const results = await Promise.all(orgs.map(async (org: any) => {
      const sub = subMap.get(org._id.toString()) as any;
      const plan = sub?.planId as any;
      const orgUsers = users.filter(u => u.organizationId === org._id.toString());

      // Compute AI + call costs from calls
      const calls = await this.callModel.find({
        organizationId: org._id.toString(),
        status: 'completed',
      }).lean();

      const totalAiTokens = calls.reduce((sum, c) =>
        sum + (c as any).aiInputTokens || 0 + (c as any).aiOutputTokens || 0, 0);
      const totalCallSeconds = calls.reduce((sum, c) => sum + ((c as any).durationSeconds || 0), 0);
      const totalCallMinutes = totalCallSeconds / 60;

      const tokenRate = plan?.aiCostPer1kTokens || 0.002;
      const telephonyRate = plan?.telephonyCostPerMinute || 1.0;

      const aiCost = (totalAiTokens / 1000) * tokenRate;
      const callCost = totalCallMinutes * telephonyRate;

      return {
        _id: org._id,
        name: org.name,
        industry: org.industry || '',
        ownerEmail: orgUsers.find(u => u._id.toString() === org.ownerId)?.email || '',
        usersCount: orgUsers.length,
        planName: plan?.name || 'No Plan',
        minutesUsed: sub?.minutesUsed || 0,
        minutesLimit: plan?.minutesLimit || 0,
        aiCost: Math.round(aiCost * 100) / 100,
        callCost: Math.round(callCost * 100) / 100,
        totalCost: Math.round((aiCost + callCost) * 100) / 100,
        status: sub?.status || 'no_subscription',
        createdAt: org.createdAt,
      };
    }));

    return results;
  }

  async getOrganizationById(orgId: string) {
    const org = await this.organizationModel.findById(orgId).lean() as any;
    if (!org) throw new NotFoundException('Organization not found');

    const owner = await this.userModel.findById(org.ownerId).select('-password -refreshToken -__v').lean();
    const sub = await this.subscriptionModel.findOne({ organizationId: orgId }).populate('planId').lean() as any;
    const plan = sub?.planId as any;

    // Usage trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await this.callModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          calls: { $sum: 1 },
          totalDuration: { $sum: '$durationSeconds' },
          totalAiTokens: { $sum: { $add: ['$aiInputTokens', '$aiOutputTokens'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const tokenRate = plan?.aiCostPer1kTokens || 0.002;
    const telephonyRate = plan?.telephonyCostPerMinute || 1.0;

    const trendData = trends.map(t => ({
      date: t._id,
      calls: t.calls,
      minutes: Math.round((t.totalDuration / 60) * 100) / 100,
      aiCost: Math.round(((t.totalAiTokens / 1000) * tokenRate) * 100) / 100,
      callCost: Math.round(((t.totalDuration / 60) * telephonyRate) * 100) / 100,
    }));

    // Recent calls
    const recentCalls = await this.callModel.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // ── Agent-level usage ─────────────────────────────────────────────
    const agents = await this.agentModel.find({ organizationId: orgId }).lean();

    const agentCallStats = await this.callModel.aggregate([
      { $match: { organizationId: orgId, status: 'completed' } },
      {
        $group: {
          _id: '$agentId',
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$durationSeconds' },
          totalAiTokens: { $sum: { $add: ['$aiInputTokens', '$aiOutputTokens'] } },
        },
      },
    ]);

    const agentStatsMap = new Map(agentCallStats.map(a => [a._id.toString(), a]));
    const agentsWithStats = agents.map((a: any) => {
      const stats = agentStatsMap.get(a._id.toString());
      const totalMinutes = (stats?.totalDuration || 0) / 60;
      const totalTokens = stats?.totalAiTokens || 0;
      return {
        _id: a._id,
        name: a.name,
        gender: a.gender,
        language: a.language,
        isActive: a.isActive,
        createdAt: a.createdAt,
        totalCalls: stats?.totalCalls || 0,
        totalMinutes: Math.round(totalMinutes * 100) / 100,
        aiCost: Math.round(((totalTokens / 1000) * tokenRate) * 100) / 100,
        callCost: Math.round((totalMinutes * telephonyRate) * 100) / 100,
        totalCost: Math.round(((totalTokens / 1000) * tokenRate + totalMinutes * telephonyRate) * 100) / 100,
      };
    });

    // Sort by total calls descending (most used first)
    agentsWithStats.sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      organization: org,
      admin: owner,
      subscription: sub ? {
        id: sub._id,
        planName: plan?.name || 'N/A',
        planPrice: plan?.price || 0,
        status: sub.status,
        minutesUsed: sub.minutesUsed || 0,
        minutesLimit: plan?.minutesLimit || 0,
        aiCostPer1kTokens: tokenRate,
        telephonyCostPerMinute: telephonyRate,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
      } : null,
      usageTrends: trendData,
      agents: agentsWithStats,
      recentCalls: recentCalls.map((c: any) => ({
        _id: c._id,
        phoneNumber: c.phoneNumber,
        status: c.status,
        outcome: c.outcome,
        durationSeconds: c.durationSeconds || 0,
        recordingUrl: c.recordingUrl,
        createdAt: c.createdAt,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Admin's Own Organizations
  // ──────────────────────────────────────────────────────────────────────

  async getMyOrganizations(userId: string) {
    const orgs = await this.organizationModel.find({ ownerId: userId }).lean();
    if (!orgs.length) return [];

    const subs = await this.subscriptionModel.find({
      organizationId: { $in: orgs.map(o => o._id.toString()) },
    }).populate('planId').lean();
    const subMap = new Map(subs.map(s => [s.organizationId.toString(), s]));

    const results = await Promise.all(orgs.map(async (org: any) => {
      const sub = subMap.get(org._id.toString()) as any;
      const plan = sub?.planId as any;

      const calls = await this.callModel.find({
        organizationId: org._id.toString(),
        status: 'completed',
      }).lean();

      const totalAiTokens = calls.reduce((sum, c) =>
        sum + ((c as any).aiInputTokens || 0) + ((c as any).aiOutputTokens || 0), 0);
      const totalCallMinutes = calls.reduce((sum, c) => sum + ((c as any).durationSeconds || 0), 0) / 60;

      const tokenRate = plan?.aiCostPer1kTokens || 0.002;
      const telephonyRate = plan?.telephonyCostPerMinute || 1.0;
      const aiCost = (totalAiTokens / 1000) * tokenRate;
      const callCost = totalCallMinutes * telephonyRate;

      return {
        _id: org._id,
        name: org.name,
        industry: org.industry || '',
        planName: plan?.name || 'No Plan',
        minutesUsed: sub?.minutesUsed || 0,
        minutesLimit: plan?.minutesLimit || 0,
        aiCost: Math.round(aiCost * 100) / 100,
        callCost: Math.round(callCost * 100) / 100,
        totalCost: Math.round((aiCost + callCost) * 100) / 100,
        status: sub?.status || 'no_subscription',
        createdAt: org.createdAt,
      };
    }));

    return results;
  }

  async getMyOrganizationById(userId: string, orgId: string) {
    const org = await this.organizationModel.findOne({ _id: orgId, ownerId: userId }).lean() as any;
    if (!org) throw new NotFoundException('Organization not found');

    return this.getOrganizationById(orgId);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Admin Profile & Password
  // ──────────────────────────────────────────────────────────────────────

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const update: any = {};
    if (data.name) update.name = data.name;
    if (data.email) update.email = data.email;
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-password -refreshToken -__v');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { message: 'Password updated successfully' };
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
