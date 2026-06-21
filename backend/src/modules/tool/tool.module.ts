import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tool, ToolSchema } from './tool.schema';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { IntegrationModule } from '../integration/integration.module';
import { AiModule } from '../ai/ai.module';
import { ActionModule } from '../action/action.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tool.name, schema: ToolSchema }]),
    IntegrationModule,
    AiModule,
    ActionModule,
    CustomerModule,
  ],
  controllers: [ToolController],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
