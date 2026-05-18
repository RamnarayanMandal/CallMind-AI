import { Controller, Post, Body, Headers, HttpCode, BadRequestException, Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create')
  async createSubscription(@Body() body: { planId: string, organizationId: string }) {
    // In a real app, organizationId comes from the authenticated user context (JWT req.user)
    // For this implementation, we assume it's passed or mocked.
    try {
      const subscription = await this.subscriptionService.createSubscription(
        body.organizationId || 'mock-org-id', 
        body.planId
      );
      return subscription;
    } catch (error) {
      throw new BadRequestException('Failed to initialize subscription');
    }
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
