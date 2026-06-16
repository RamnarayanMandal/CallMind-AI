import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TelephonyWebhookController } from './telephony.controller';
import { VobizCallController } from './vobiz-call.controller';
import { VobizLiveCallService } from './vobiz-live-call.service';
import { CallModule } from '../call/call.module';
import { TelephonyProcessor } from './telephony.processor';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TelephonyService } from './telephony.service';
import { VobizStreamGateway } from './vobiz-stream.gateway';
import { AiModule } from '../ai/ai.module';
import { ConversationModule } from '../conversation/conversation.module';
import { AgentModule } from '../agent/agent.module';
import { RedisModule } from '../redis/redis.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    CallModule,
    SubscriptionModule,
    AiModule,
    ConversationModule,
    AgentModule,
    RedisModule,
    OrganizationModule,
    BullModule.registerQueue({
      name: 'telephony-queue',
    }),
  ],
  controllers: [TelephonyWebhookController, VobizCallController],
  providers: [TelephonyProcessor, TelephonyService, VobizLiveCallService, VobizStreamGateway],
  exports: [BullModule, TelephonyService],
})
export class TelephonyModule { }
