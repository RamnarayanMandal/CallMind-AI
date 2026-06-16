import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationController } from './conversation.controller';
import { ConversationService, ConversationRepository } from './conversation.service';
import { ConversationMemoryService } from './conversation-memory.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { SarvamLlmProvider } from '@providers/llm/sarvam-llm.provider';
import { LLM_PROVIDER } from '@providers/llm/llm.interface';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    ActionModule,
  ],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationRepository,
    ConversationMemoryService,
  ],
  exports: [ConversationService, ConversationMemoryService],
})
export class ConversationModule {}
