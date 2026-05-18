import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CallService, CALL_QUEUE } from '../call/call.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly callService: CallService,
    @InjectQueue(CALL_QUEUE) private readonly callQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingCalls() {
    const pendingCalls = await this.callService.findPendingScheduled();

    if (!pendingCalls.length) return;

    this.logger.log(`Queuing ${pendingCalls.length} scheduled call(s)`);

    for (const call of pendingCalls) {
      await this.callQueue.add(
        'execute',
        { callId: (call as any)._id.toString() },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
    }
  }
}
