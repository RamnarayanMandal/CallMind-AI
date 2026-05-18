import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { CallService } from '../call/call.service';
import { SubscriptionService } from '../subscription/subscription.service';

import { ConfigService } from '@nestjs/config';

@Processor('telephony-queue')
export class TelephonyProcessor {
  private readonly logger = new Logger(TelephonyProcessor.name);

  constructor(
    private readonly callService: CallService,
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Process('initiate-call')
  async handleInitiateCall(job: Job) {
    this.logger.debug(`Processing call initiation for job ${job.id}`);
    const { organizationId, agentId, customerPhone } = job.data;

    // Check if organization has active subscription & minutes
    try {
      // Logic for minute deduction/checking would go here
      // For now, we simulate executing the outbound call logic
      const provider = this.configService.get<string>('telephony.provider', 'twilio');
      this.logger.log(`Initiating ${provider} outbound call to ${customerPhone} for Agent ${agentId}`);
      
      // Assume a successful integration happens here
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      this.logger.log(`Call successfully dispatched to ${provider} for ${customerPhone}`);
      
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  @Process('bulk-campaign')
  async handleBulkCampaign(job: Job) {
    this.logger.debug(`Processing bulk campaign job ${job.id}`);
    const { campaignId, leads } = job.data;
    
    this.logger.log(`Campaign ${campaignId} scheduling ${leads.length} calls`);
    
    // Distribute calls back into the queue
    for (const lead of leads) {
      // In reality, inject the actual queue here and .add('initiate-call', {...lead})
      this.logger.debug(`Queuing lead: ${lead.phone}`);
    }
  }
}
