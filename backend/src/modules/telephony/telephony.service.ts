import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger(TelephonyService.name);

  constructor(
    @InjectQueue('telephony-queue') private readonly telephonyQueue: Queue
  ) {}

  async queueBulkCampaign(campaignId: string, leads: any[]) {
    this.logger.log(`Dispatching ${leads.length} calls to the telephony queue for campaign ${campaignId}`);
    
    // Add the parent job that handles scheduling
    await this.telephonyQueue.add('bulk-campaign', {
      campaignId,
      leads
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    });

    return { status: 'queued', count: leads.length };
  }

  async queueSingleCall(organizationId: string, agentId: string, customerPhone: string) {
    this.logger.log(`Queueing single call to ${customerPhone}`);
    
    await this.telephonyQueue.add('initiate-call', {
      organizationId,
      agentId,
      customerPhone
    }, {
      priority: 1 // Higher priority for single manual calls
    });

    return { status: 'queued' };
  }
}
