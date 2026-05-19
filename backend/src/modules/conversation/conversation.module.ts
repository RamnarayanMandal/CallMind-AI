import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationController } from './conversation.controller';
import { ConversationService, ConversationRepository } from './conversation.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { SarvamLlmProvider } from '@providers/llm/sarvam-llm.provider';
import { LLM_PROVIDER } from '@providers/llm/llm.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
  ],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationRepository,
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
