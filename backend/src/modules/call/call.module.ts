import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallController } from './call.controller';
import { CallService, CallRepository, CALL_QUEUE } from './call.service';
import { Call, CallSchema } from './schemas/call.schema';
import { ConfigService } from '@nestjs/config';

import { BullModule } from '@nestjs/bull';
import { CallProcessor } from './call.processor';
import { CustomerModule } from '../customer/customer.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    BullModule.registerQueue({
      name: CALL_QUEUE,
    }),
    CustomerModule,
    SubscriptionModule,
    OrganizationModule,
  ],
  controllers: [CallController],
  providers: [
    CallService,
    CallRepository,
    CallProcessor,
  ],
  exports: [CallService],
})
export class CallModule { }
