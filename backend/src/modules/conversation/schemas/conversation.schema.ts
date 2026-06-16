import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export interface TranscriptEntry {
  role: 'agent' | 'customer';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface ActionLogEntry {
  action: string;
  success: boolean;
  data?: Record<string, any>;
  timestamp: Date;
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

  // Sentiment analysis result
  @Prop({ type: String, enum: ['positive', 'negative', 'neutral', 'mixed'], default: 'neutral' })
  sentiment?: string;

  // AI actions log (email sent, lead saved, callback scheduled, etc.)
  @Prop({
    type: [
      {
        action: { type: String },
        success: { type: Boolean },
        data: { type: Object },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  actionLog: ActionLogEntry[];

  // Customer intent extracted from conversation
  @Prop({ trim: true })
  customerIntent?: string;

  // Lead qualification status
  @Prop({ type: String, enum: ['hot', 'warm', 'cold', 'closed'], default: null })
  leadStatus?: string;

  // Denormalized call date for quick access
  @Prop({ type: Date })
  callDate?: Date;

  // Latency tracking (ms)
  @Prop({ type: Number })
  avgSttLatencyMs?: number;

  @Prop({ type: Number })
  avgLlmLatencyMs?: number;

  @Prop({ type: Number })
  avgTtsLatencyMs?: number;

  @Prop({ type: Number })
  avgTotalLatencyMs?: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ organizationId: 1, createdAt: -1 });

