import { Controller, Get, Post, Put, Delete, Param, Body, Headers, HttpCode, BadRequestException, Logger, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Post('plans/sync')
  async syncPlans() {
    return this.subscriptionService.syncPlansToRazorpay();
  }

  @Get('plans/:id')
  async getPlanById(@Param('id') id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  @Post('plans')
  async createPlan(@Body() body: any) {
    return this.subscriptionService.createPlan(body);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.subscriptionService.updatePlan(id, body);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  @Get('current')
  async getCurrentSubscription(@Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }
    return this.subscriptionService.getSubscriptionByOrgId(organizationId);
  }

  @Get('call-status')
  async getCallStatus(@Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }
    const blockReason = await this.subscriptionService.getCallBlockReason(organizationId);
    return {
      canCall: blockReason === null,
      blockReason, // null | 'no_subscription' | 'plan_expired' | 'minutes_exhausted'
    };
  }

  @Get('usage')
  async getUsage(@Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }
    return this.subscriptionService.getUsageWithCost(organizationId);
  }

  @Post('create')
  async createSubscription(@Body() body: { organizationId: string; planId: string }) {
    if (!body.organizationId || !body.planId) {
      throw new BadRequestException('organizationId and planId are required');
    }
    return this.subscriptionService.createSubscription(body.organizationId, body.planId);
  }

  @Post('create-order')
  async createOrder(@Body() body: { organizationId: string; planId: string; isYearly?: boolean }) {
    if (!body.organizationId || !body.planId) {
      throw new BadRequestException('organizationId and planId are required');
    }
    return this.subscriptionService.createOrder(body.organizationId, body.planId, body.isYearly);
  }

  @Post('verify-order')
  async verifyOrderPayment(@Body() body: { 
    organizationId: string; 
    planId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    isYearly?: boolean;
  }) {
    return this.subscriptionService.verifyOrderPayment(
      body.organizationId, 
      body.planId, 
      body.razorpayOrderId, 
      body.razorpayPaymentId, 
      body.razorpaySignature,
      body.isYearly
    );
  }

  @Post('webhook/razorpay')
  @HttpCode(200)
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    this.logger.log(`Received Razorpay webhook: ${body.event}`);

    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature');
    }

    const isValid = await this.subscriptionService.verifyWebhook(body, signature);
    
    if (!isValid) {
      this.logger.error('Invalid Razorpay signature detected');
      throw new BadRequestException('Invalid signature');
    }

    try {
      await this.subscriptionService.handleWebhookEvent(body);
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      // Return 200 anyway so Razorpay doesn't keep retrying excessively if it's our internal logic error
      return { status: 'error', message: 'Internal processing failed' };
    }
  }
}
