import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { CallService, CALL_QUEUE } from '../call/call.service';

@Processor(CALL_QUEUE)
export class CallProcessor {
  private readonly logger = new Logger(CallProcessor.name);

  constructor(private readonly callService: CallService) {}

  @Process('execute-call')
  async handleCallExecution(job: Job<{ callId: string }>) {
    const { callId } = job.data;
    this.logger.log(`Processing call: ${callId}`);
    try {
      await this.callService.executeCall(callId);
      this.logger.log(`Call ${callId} executed successfully`);
    } catch (err) {
      this.logger.error(`Call ${callId} failed: ${err.message}`);
      throw err; // re-throw for Bull retry
    }
  }
}
