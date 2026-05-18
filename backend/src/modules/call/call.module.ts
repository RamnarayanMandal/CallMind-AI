import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallController } from './call.controller';
import { CallService, CallRepository, CALL_QUEUE } from './call.service';
import { Call, CallSchema } from './schemas/call.schema';
import { ConfigService } from '@nestjs/config';
import { MockTelephonyProvider } from '@providers/telephony/mock-telephony.provider';
import { TwilioTelephonyProvider } from '@providers/telephony/twilio.provider';
import { TelnyxTelephonyProvider } from '@providers/telephony/telnyx.provider';
import { TELEPHONY_PROVIDER } from '@providers/telephony/telephony.interface';

import { BullModule } from '@nestjs/bull';
import { CallProcessor } from './call.processor';
import { CustomerModule } from '../customer/customer.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    BullModule.registerQueue({
      name: CALL_QUEUE,
    }),
    CustomerModule,
    SubscriptionModule,
  ],
  controllers: [CallController],
  providers: [
    CallService,
    CallRepository,
    CallProcessor,
    TelnyxTelephonyProvider,
    TwilioTelephonyProvider,
    MockTelephonyProvider,
    {
      provide: TELEPHONY_PROVIDER,
      useFactory: (config: ConfigService, twilio: TwilioTelephonyProvider, telnyx: TelnyxTelephonyProvider, mock: MockTelephonyProvider) => {
        const provider = config.get('telephony.provider');
        if (provider === 'telnyx') return telnyx;
        if (provider === 'twilio') return twilio;
        return mock;
      },
      inject: [ConfigService, TwilioTelephonyProvider, TelnyxTelephonyProvider, MockTelephonyProvider],
    },
  ],
  exports: [CallService],
})
export class CallModule { }
