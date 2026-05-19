import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { OrganizationService, OrganizationRepository } from './organization.service';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AgentModule),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
