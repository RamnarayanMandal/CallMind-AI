import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Call, CallSchema } from '../call/schemas/call.schema';
import { Conversation, ConversationSchema } from '../conversation/schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Call.name, schema: CallSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
