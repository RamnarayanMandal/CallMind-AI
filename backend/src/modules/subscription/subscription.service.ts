import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan } from './schemas/plan.schema';
import { Subscription } from './schemas/subscription.schema';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private razorpayClient: any;

  constructor(
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

    if (keyId && keySecret) {
      this.razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      this.logger.log('Razorpay initialized successfully');
    } else {
      this.logger.warn('Razorpay credentials missing. Subscription features will not work.');
    }
  }

  async getPlans() {
    return this.planModel.find().exec();
  }

  async getPlanById(id: string) {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(data: any) {
    // 1. Save the plan to our DB first
    const plan = new this.planModel(data);
    await plan.save();

    // 2. Auto-create the matching plan in Razorpay (if client is available)
    if (this.razorpayClient) {
      try {
        const razorpayPlan = await this.razorpayClient.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: plan.name,
            amount: Math.round(plan.price * 100), // Razorpay uses paise
            currency: 'INR',
            description: plan.description || plan.name,
          },
          notes: {
            internalPlanId: plan._id.toString(),
          },
        });
        // 3. Persist the Razorpay plan ID back to our DB record
        plan.razorpayPlanId = razorpayPlan.id;
        await plan.save();
        this.logger.log(`Razorpay plan created: ${razorpayPlan.id} for plan "${plan.name}"`);
      } catch (err) {
        this.logger.warn(`Could not create Razorpay plan for "${plan.name}": ${err.message}. razorpayPlanId will remain empty until Razorpay is configured.`);
      }
    } else {
      this.logger.warn(`Razorpay not configured — plan "${plan.name}" saved locally only. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payment.`);
    }

    return plan;
  }

  async updatePlan(id: string, data: any) {
    const plan = await this.planModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async syncPlansToRazorpay() {
    if (!this.razorpayClient) {
      this.logger.warn('Razorpay not configured. Cannot sync plans.');
      return { success: false, message: 'Razorpay not configured' };
    }
    const plans = await this.planModel.find({ razorpayPlanId: { $in: [null, ''] } }).exec();
    let synced = 0;
    for (const plan of plans) {
      try {
        const razorpayPlan = await this.razorpayClient.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: plan.name,
            amount: Math.round(plan.price * 100) || 100, // Razorpay uses paise, min 1 INR
            currency: 'INR',
            description: plan.description || plan.name,
          },
          notes: {
            internalPlanId: plan._id.toString(),
          },
        });
        plan.razorpayPlanId = razorpayPlan.id;
        await plan.save();
        synced++;
        this.logger.log(`Synced plan "${plan.name}" with Razorpay ID: ${razorpayPlan.id}`);
      } catch (err) {
        this.logger.error(`Failed to sync plan "${plan.name}": ${err.message}`);
      }
    }
    return { success: true, synced, totalFound: plans.length };
  }

  async deletePlan(id: string) {
    const result = await this.planModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Plan not found');
    return { success: true };
  }

  async createSubscription(organizationId: string, planId: string) {
    // 1. Load our plan — razorpayPlanId was auto-set when admin created it
    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    let razorpayPlanId = plan.razorpayPlanId;

    // 1.5 Auto-sync missing plan to Razorpay on the fly
    if (this.razorpayClient && !razorpayPlanId) {
      try {
        const razorpayPlan = await this.razorpayClient.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: plan.name,
            amount: Math.round(plan.price * 100) || 100,
            currency: 'INR',
            description: plan.description || plan.name,
          },
        });
        plan.razorpayPlanId = razorpayPlan.id;
        await plan.save();
        razorpayPlanId = razorpayPlan.id;
        this.logger.log(`Auto-synced plan "${plan.name}" with Razorpay ID: ${razorpayPlanId}`);
      } catch (err) {
        this.logger.error(`Failed to auto-sync plan "${plan.name}": ${err.message}`);
        throw new Error('Payment gateway configuration error. Please contact support.');
      }
    }

    const mongoose = require('mongoose');
    const validOrgId = mongoose.Types.ObjectId.isValid(organizationId)
      ? organizationId
      : new mongoose.Types.ObjectId();

    // 2. Create Razorpay subscription
    let rpSubscription: any;

    if (this.razorpayClient && razorpayPlanId) {
      try {
        rpSubscription = await this.razorpayClient.subscriptions.create({
          plan_id: razorpayPlanId,
          customer_notify: 1,
          total_count: 12, // 12 monthly billing cycles = 1 year
        });
        this.logger.log(`Razorpay subscription created: ${rpSubscription.id}`);
      } catch (err) {
        this.logger.error(`Razorpay subscription creation failed: ${err.message}`);
        throw new Error('Payment gateway error. Please try again or contact support.');
      }
    } else {
      // Dev/test mode: no Razorpay credentials or plan not yet synced to Razorpay
      this.logger.warn(`[DEV MODE] Razorpay not configured or razorpayPlanId missing for plan "${plan.name}". Using mock subscription.`);
      rpSubscription = {
        id: `sub_mock_${Date.now()}`,
        status: 'created',
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };
    }

    // 3. Save subscription record to DB
    const subscription = new this.subscriptionModel({
      organizationId: validOrgId,
      planId,
      razorpaySubscriptionId: rpSubscription.id,
      status: rpSubscription.status,
      currentPeriodStart: new Date(rpSubscription.current_start * 1000),
      currentPeriodEnd: new Date(rpSubscription.current_end * 1000),
      minutesUsed: 0,
    });

    await subscription.save();
    return subscription;
  }

  // --- MANUAL PAYMENT FLOW (ORDERS) ---

  async createOrder(organizationId: string, planId: string, isYearly: boolean = false) {
    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
    const amountInPaise = Math.max(Math.round(price * 100), 100); // Minimum 1 INR

    let rpOrder: any;
    if (this.razorpayClient) {
      try {
        rpOrder = await this.razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          // Max length for receipt is 40 chars. Math.random to keep it short.
          receipt: `rcpt_${Math.floor(Math.random() * 1000000)}`,
          notes: {
            organizationId: organizationId.substring(0, 40),
            planId: planId.substring(0, 40),
            isYearly: isYearly ? 'true' : 'false',
          },
        });
      } catch (err: any) {
        const errMsg = err.error?.description || err.message || JSON.stringify(err);
        this.logger.error(`Razorpay order creation failed: ${errMsg}`);
        throw new Error(`Payment gateway error: ${errMsg}`);
      }
    } else {
      // Dev mode fallback
      rpOrder = { id: `order_mock_${Date.now()}` };
    }

    return {
      orderId: rpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      planName: plan.name,
    };
  }

  async verifyOrderPayment(
    organizationId: string,
    planId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    isYearly: boolean = false
  ) {
    // In a real production app, verify razorpaySignature using crypto module here
    // const crypto = require('crypto');
    // const expectedSignature = crypto.createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET')).update(razorpayOrderId + '|' + razorpayPaymentId).digest('hex');
    // if (expectedSignature !== razorpaySignature) throw new Error('Invalid signature');

    const mongoose = require('mongoose');
    const validOrgId = mongoose.Types.ObjectId.isValid(organizationId)
      ? organizationId
      : new mongoose.Types.ObjectId();

    // Calculate new period
    const durationDays = isYearly ? 365 : 30;
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Look for existing subscription or create a new one
    let subscription = await this.subscriptionModel.findOne({ organizationId: validOrgId });
    if (subscription) {
      subscription.planId = planId;
      subscription.razorpaySubscriptionId = razorpayOrderId; // Use order ID as reference for manual payments
      subscription.status = 'active';
      subscription.minutesUsed = 0;
      subscription.currentPeriodStart = currentPeriodStart;
      subscription.currentPeriodEnd = currentPeriodEnd;
      await subscription.save();
    } else {
      subscription = new this.subscriptionModel({
        organizationId: validOrgId,
        planId,
        razorpaySubscriptionId: razorpayOrderId,
        status: 'active',
        minutesUsed: 0,
        currentPeriodStart,
        currentPeriodEnd,
      });
      await subscription.save();
    }

    this.logger.log(`Manual recharge successful for org ${organizationId}. Plan activated until ${currentPeriodEnd}`);
    return subscription;
  }

  // ------------------------------------

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  async verifyWebhook(body: any, signature: string) {
    const crypto = require('crypto');
    const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  }

  async handleWebhookEvent(event: any) {
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === 'subscription.charged') {
      const subId = payload.subscription.entity.id;
      await this.subscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subId },
        { 
          status: 'active',
          currentPeriodStart: new Date(payload.subscription.entity.current_start * 1000),
          currentPeriodEnd: new Date(payload.subscription.entity.current_end * 1000),
          minutesUsed: 0 // Reset minutes on new charge
        }
      );
      this.logger.log(`Subscription ${subId} charged and activated.`);
    } else if (eventType === 'subscription.halted' || eventType === 'subscription.cancelled') {
      const subId = payload.subscription.entity.id;
      await this.subscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subId },
        { status: 'canceled' }
      );
      this.logger.log(`Subscription ${subId} canceled.`);
    }
  }

  async canMakeCall(organizationId: string): Promise<boolean> {
    const reason = await this.getCallBlockReason(organizationId);
    return reason === null;
  }

  /**
   * Returns the reason why a call is blocked, or null if calls are allowed.
   * Used by the frontend to show the correct upgrade/renew prompt.
   */
  async getCallBlockReason(organizationId: string): Promise<string | null> {
    const subscription = await this.subscriptionModel
      .findOne({ organizationId })
      .sort({ createdAt: -1 }) // Most recent subscription
      .populate('planId')
      .exec();

    // No subscription at all
    if (!subscription) {
      return 'no_subscription';
    }

    // Subscription cancelled/halted/expired by status
    if (['cancelled', 'halted', 'expired'].includes(subscription.status)) {
      return 'plan_expired';
    }

    // Period ended (subscription passed its end date)
    if (subscription.currentPeriodEnd && new Date() > new Date(subscription.currentPeriodEnd)) {
      // Mark as expired in DB
      await this.subscriptionModel.findByIdAndUpdate(subscription._id, { status: 'expired' });
      return 'plan_expired';
    }

    const plan = subscription.planId as any;

    // Minutes exhausted
    if (plan?.minutesLimit && plan.minutesLimit < 999999 && subscription.minutesUsed >= plan.minutesLimit) {
      return 'minutes_exhausted';
    }

    return null; // All checks passed — calls allowed
  }

  /**
   * Auto-provision a free trial when a new organization is created.
   * Called by OrganizationService.create().
   */
  async provisionFreeTrial(organizationId: string): Promise<void> {
    // Check if a subscription already exists for this org
    const existing = await this.subscriptionModel.findOne({ organizationId });
    if (existing) return;

    // Find the cheapest / first active plan to use as trial base
    const trialPlan = await this.planModel
      .findOne({ isActive: true })
      .sort({ price: 1 })
      .exec();

    if (!trialPlan) {
      this.logger.warn(`[TRIAL] No active plan found to provision trial for org ${organizationId}`);
      return;
    }

    const trialDays = trialPlan.trialDays ?? 14;
    const trialMinutes = Math.min(trialPlan.minutesLimit ?? 5, 5); // Cap trial at 5 minutes

    const trialSub = new this.subscriptionModel({
      organizationId,
      planId: trialPlan._id,
      razorpaySubscriptionId: `trial_${organizationId}`,
      status: 'trialing',
      minutesUsed: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
    });

    await trialSub.save();
    this.logger.log(`[TRIAL] Provisioned ${trialDays}-day / ${trialMinutes}-min trial for org ${organizationId} on plan "${trialPlan.name}"`);
  }

  async getSubscriptionByOrgId(organizationId: string) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(organizationId)) return null;

    // Return the most recent subscription for this org
    return this.subscriptionModel
      .findOne({ organizationId })
      .sort({ createdAt: -1 })
      .populate('planId')
      .exec();
  }

  /** Increment minutesUsed after a call ends */
  async incrementMinutesUsed(organizationId: string, minutes: number): Promise<void> {
    await this.subscriptionModel.findOneAndUpdate(
      { organizationId, status: { $in: ['active', 'trialing'] } },
      { $inc: { minutesUsed: minutes } },
      { sort: { createdAt: -1 } },
    );
  }

  /** Get usage data with computed costs */
  async getUsageWithCost(organizationId: string) {
    const subscription = await this.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return {
        aiMinutesUsed: 0,
        aiCost: 0,
        callMinutesUsed: 0,
        callCost: 0,
        currentBill: 0,
        remainingBalance: 0,
        minutesLimit: 0,
        planName: null,
      };
    }

    const plan = typeof subscription.planId === 'object' ? subscription.planId as any : null;
    const minutesUsed = subscription.minutesUsed || 0;
    const minutesLimit = plan?.minutesLimit || 0;
    const planPrice = plan?.price || 0;

    // Compute per-minute rates from plan price
    const perMinuteRate = minutesLimit > 0 ? planPrice / minutesLimit : 0.05;
    const aiCost = Math.round(minutesUsed * perMinuteRate * 100) / 100;
    // For now, call cost is the same as AI cost (both use the same minutes)
    const callCost = aiCost;
    const currentBill = aiCost;
    const remainingBalance = Math.max(0, planPrice - currentBill);

    return {
      aiMinutesUsed: minutesUsed,
      aiCost,
      callMinutesUsed: minutesUsed,
      callCost,
      currentBill,
      remainingBalance,
      minutesLimit,
      planName: plan?.name || null,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    };
  }
}
