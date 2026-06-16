import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Subscription, SubscriptionSchema } from '../subscription/schemas/subscription.schema';
import { Agent, AgentSchema } from '../agent/schemas/agent.schema';
import { AdminGateway } from './admin.gateway';
import { AuthModule } from '../auth/auth.module';
import { PlatformConfig, PlatformConfigSchema } from './schemas/platform-config.schema';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { Call, CallSchema } from '../call/schemas/call.schema';
import { Organization, OrganizationSchema } from '../organization/schemas/organization.schema';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    AuthModule,
    OrganizationModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Agent.name, schema: AgentSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: Call.name, schema: CallSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [AdminService, AdminGateway, AdminAnalyticsService],
  controllers: [AdminController, AdminAnalyticsController],
  exports: [AdminService, AdminGateway, AdminAnalyticsService]
})
export class AdminModule {}
