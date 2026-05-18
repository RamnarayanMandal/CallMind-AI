import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SchedulerService } from './scheduler.service';
import { CallModule } from '../call/call.module';
import { CALL_QUEUE } from '../call/call.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: CALL_QUEUE }),
    CallModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
