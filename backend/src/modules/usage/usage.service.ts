import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usage, UsageDocument } from './schemas/usage.schema';
import { Subscription } from '../subscription/schemas/subscription.schema';
import { Plan } from '../subscription/schemas/plan.schema';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    @InjectModel(Usage.name) private readonly usageModel: Model<UsageDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}

  /**
   * Get the cost rates for an organization based on their current plan
   */
  async getOrganizationRates(organizationId: string) {
    try {
      const subscription = await this.subscriptionModel
        .findOne({ organizationId, status: { $in: ['active', 'trialing'] } })
        .populate('planId')
        .lean();

      if (!subscription?.planId) {
        // Default rates if no subscription
        return {
          aiCostPer1kTokens: 0.002,
          sttCostPerMinute: 0.5,
          ttsCostPerCharacter: 0.01,
          telephonyCostPerMinute: 1.0,
          minutesLimit: 0,
          aiTokensLimit: 0,
          storageLimitMB: 0,
        };
      }

      const plan = subscription.planId as any;
      return {
        aiCostPer1kTokens: plan.aiCostPer1kTokens || 0.002,
        sttCostPerMinute: plan.sttCostPerMinute || 0.5,
        ttsCostPerCharacter: plan.ttsCostPerCharacter || 0.01,
        telephonyCostPerMinute: plan.telephonyCostPerMinute || 1.0,
        minutesLimit: plan.minutesLimit || 0,
        aiTokensLimit: plan.aiTokensLimit || 0,
        storageLimitMB: plan.storageLimitMB || 0,
      };
    } catch (err) {
      this.logger.warn(`Failed to get rates for org ${organizationId}: ${err.message}`);
      return {
        aiCostPer1kTokens: 0.002,
        sttCostPerMinute: 0.5,
        ttsCostPerCharacter: 0.01,
        telephonyCostPerMinute: 1.0,
        minutesLimit: 0,
        aiTokensLimit: 0,
        storageLimitMB: 0,
      };
    }
  }

  /**
   * Track AI usage for an organization in a given period
   */
  async trackAiUsage(
    organizationId: string,
    inputTokens: number,
    outputTokens: number,
    model: string,
    cost?: number,
  ): Promise<void> {
    const period = this.getCurrentPeriod();
    
    // Calculate cost from rates if not provided
    if (cost === undefined) {
      const rates = await this.getOrganizationRates(organizationId);
      const totalTokens = inputTokens + outputTokens;
      cost = (totalTokens / 1000) * rates.aiCostPer1kTokens;
    }

    await this.updateUsage(organizationId, period, {
      $inc: {
        aiInputTokens: inputTokens,
        aiOutputTokens: outputTokens,
        aiCost: cost,
        totalCost: cost,
      },
      $set: { aiModel: model },
    });
  }

  /**
   * Track voice usage (STT/TTS) for an organization
   */
  async trackVoiceUsage(
    organizationId: string,
    sttMinutes: number,
    ttsCharacters: number,
    ttsCost?: number,
  ): Promise<void> {
    const period = this.getCurrentPeriod();
    
    // Calculate costs from rates if not provided
    const rates = await this.getOrganizationRates(organizationId);
    const sttCost = sttMinutes * rates.sttCostPerMinute;
    const calculatedTtsCost = ttsCharacters * rates.ttsCostPerCharacter;
    const finalTtsCost = ttsCost ?? calculatedTtsCost;

    await this.updateUsage(organizationId, period, {
      $inc: {
        sttMinutes: sttMinutes,
        ttsCharacters: ttsCharacters,
        ttsCost: finalTtsCost,
        totalCost: sttCost + finalTtsCost,
      },
    });
  }

  /**
   * Track telephony usage for an organization
   */
  async trackTelephonyUsage(
    organizationId: string,
    callMinutes: number,
    incomingMinutes: number,
    outgoingMinutes: number,
    costPerMinute?: number,
  ): Promise<void> {
    const period = this.getCurrentPeriod();
    
    // Get rate from plan if not provided
    const rates = await this.getOrganizationRates(organizationId);
    const rate = costPerMinute ?? rates.telephonyCostPerMinute;
    const telephonyCost = callMinutes * rate;

    await this.updateUsage(organizationId, period, {
      $inc: {
        callMinutes: callMinutes,
        incomingMinutes: incomingMinutes,
        outgoingMinutes: outgoingMinutes,
        telephonyCost: telephonyCost,
        totalCost: telephonyCost,
      },
      $set: { costPerMinute: rate },
    });
  }

  /**
   * Track recording usage
   */
  async trackRecordingUsage(
    organizationId: string,
    storageBytes: number,
  ): Promise<void> {
    const period = this.getCurrentPeriod();
    await this.updateUsage(organizationId, period, {
      $inc: {
        recordingsCount: 1,
        storageBytes: storageBytes,
      },
    });
  }

  /**
   * Get usage summary for an organization in a given period
   */
  async getUsageSummary(organizationId: string, period?: string): Promise<any> {
    const targetPeriod = period || this.getCurrentPeriod();
    const usage = await this.usageModel.findOne({
      organizationId,
      period: targetPeriod,
    }).lean();

    const rates = await this.getOrganizationRates(organizationId);

    return {
      ...(usage || {
        organizationId,
        period: targetPeriod,
        aiInputTokens: 0,
        aiOutputTokens: 0,
        aiModel: '',
        aiCost: 0,
        sttMinutes: 0,
        ttsCharacters: 0,
        ttsCost: 0,
        callMinutes: 0,
        incomingMinutes: 0,
        outgoingMinutes: 0,
        costPerMinute: 0,
        telephonyCost: 0,
        totalCost: 0,
        recordingsCount: 0,
        storageBytes: 0,
      }),
      rates,
    };
  }

  /**
   * Get usage trends for an organization over multiple periods
   */
  async getUsageTrends(organizationId: string, days: number = 30) {
    const periods: string[] = [];
    const now = new Date();
    for (let i = 0; i < days; i += 7) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      periods.push(this.getPeriodFromDate(date));
    }

    const usage = await this.usageModel.find({
      organizationId,
      period: { $in: periods },
    }).sort({ period: 1 }).lean();

    return usage;
  }

  /**
   * Get usage breakdown by category
   */
  async getUsageBreakdown(organizationId: string, period?: string): Promise<any> {
    const summary = await this.getUsageSummary(organizationId, period);
    const rates = summary.rates;
    
    return {
      ai: {
        inputTokens: summary.aiInputTokens,
        outputTokens: summary.aiOutputTokens,
        model: summary.aiModel,
        cost: summary.aiCost,
        rate: rates.aiCostPer1kTokens,
      },
      voice: {
        sttMinutes: summary.sttMinutes,
        ttsCharacters: summary.ttsCharacters,
        cost: summary.ttsCost,
        sttRate: rates.sttCostPerMinute,
        ttsRate: rates.ttsCostPerCharacter,
      },
      telephony: {
        callMinutes: summary.callMinutes,
        incomingMinutes: summary.incomingMinutes,
        outgoingMinutes: summary.outgoingMinutes,
        costPerMinute: summary.costPerMinute || rates.telephonyCostPerMinute,
        cost: summary.telephonyCost,
      },
      recording: {
        count: summary.recordingsCount,
        storageBytes: summary.storageBytes,
      },
      total: summary.totalCost,
    };
  }

  /**
   * Get current month usage for an organization
   */
  async getCurrentMonthUsage(organizationId: string) {
    const period = this.getCurrentPeriod();
    return this.getUsageSummary(organizationId, period);
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private async updateUsage(organizationId: string, period: string, update: any) {
    try {
      await this.usageModel.findOneAndUpdate(
        { organizationId, period },
        update,
        { upsert: true, new: true },
      );
    } catch (err) {
      this.logger.error(`Failed to update usage: ${err.message}`);
    }
  }

  private getCurrentPeriod(): string {
    return this.getPeriodFromDate(new Date());
  }

  private getPeriodFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
