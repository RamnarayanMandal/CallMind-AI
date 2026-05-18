import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TelephonyWebhookController } from './telephony.controller';
import { CallModule } from '../call/call.module';
import { TelephonyProcessor } from './telephony.processor';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TelephonyService } from './telephony.service';

@Module({
  imports: [
    CallModule,
    SubscriptionModule,
    BullModule.registerQueue({
      name: 'telephony-queue',
    }),
  ],
  controllers: [TelephonyWebhookController],
  providers: [TelephonyProcessor, TelephonyService],
  exports: [BullModule, TelephonyService],
})
export class TelephonyModule { }
