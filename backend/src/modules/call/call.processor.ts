import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CallService, CALL_QUEUE } from './call.service';

@Processor(CALL_QUEUE)
export class CallProcessor {
  private readonly logger = new Logger(CallProcessor.name);

  constructor(private readonly callService: CallService) {}

  @Process('execute')
  async handleExecute(job: Job<{ callId: string }>) {
    const { callId } = job.data;
    this.logger.log(`Processing call execution for ID: ${callId}`);

    try {
      // The actual work is still in CallService but now it's called by a worker
      await this.callService.processExecution(callId);
      this.logger.log(`Successfully processed call: ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to process call ${callId}: ${error.message}`);
      // Bull will retry automatically if we throw
      throw error;
    }
  }
}
