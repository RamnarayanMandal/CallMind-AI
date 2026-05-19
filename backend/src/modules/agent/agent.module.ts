import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentController } from './agent.controller';
import { AgentService, AgentRepository } from './agent.service';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { OrganizationModule } from '../organization/organization.module';
import { PromptBuilderService } from '../../services/prompt-builder.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Agent.name, schema: AgentSchema }]),
    forwardRef(() => OrganizationModule),
  ],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository, PromptBuilderService],
  exports: [AgentService, PromptBuilderService],
})
export class AgentModule {}
