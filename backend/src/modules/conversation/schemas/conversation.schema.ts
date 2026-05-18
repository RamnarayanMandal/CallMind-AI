import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export interface TranscriptEntry {
  role: 'agent' | 'customer';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: String, ref: 'Call', required: true, unique: true, index: true })
  callId: string;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: Array, default: [] })
  transcript: TranscriptEntry[];

  @Prop({ trim: true })
  summary?: string;

  @Prop({ trim: true })
  keyInsights?: string;

  @Prop({
    type: String,
    enum: ['interested', 'not-interested', 'follow-up', 'no-answer', 'unknown'],
    default: 'unknown',
  })
  outcome: string;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ default: 0 })
  totalTurns: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ organizationId: 1, createdAt: -1 });
