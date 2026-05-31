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

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Agent.name, schema: AgentSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
    ]),
  ],
  providers: [AdminService, AdminGateway],
  controllers: [AdminController],
  exports: [AdminService, AdminGateway]
})
export class AdminModule {}
