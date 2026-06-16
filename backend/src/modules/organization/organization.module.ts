import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { OrganizationService, OrganizationRepository } from './organization.service';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AgentModule } from '../agent/agent.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AgentModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
