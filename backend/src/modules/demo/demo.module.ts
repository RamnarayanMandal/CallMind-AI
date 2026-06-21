import { Module } from '@nestjs/common';
import { DemoGateway } from './demo.gateway';
import { DemoService } from './demo.service';
import { AiModule } from '../ai/ai.module';
import { AgentModule } from '../agent/agent.module';
import { OrganizationModule } from '../organization/organization.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { ConversationModule } from '../conversation/conversation.module';
import { ToolModule } from '../tool/tool.module';

@Module({
  imports: [AiModule, AgentModule, OrganizationModule, KnowledgeBaseModule, ConversationModule, ToolModule],
  providers: [DemoGateway, DemoService],
})
export class DemoModule { }
