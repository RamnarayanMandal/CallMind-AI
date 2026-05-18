import { Module } from '@nestjs/common';
import { DemoGateway } from './demo.gateway';
import { DemoService } from './demo.service';
import { AiModule } from '../ai/ai.module';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AiModule, AgentModule],
  providers: [DemoGateway, DemoService],
})
export class DemoModule { }
