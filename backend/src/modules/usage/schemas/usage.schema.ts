import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UsageDocument = Usage & Document;

@Schema({ timestamps: true, collection: 'usage' })
export class Usage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, index: true })
  period: string; // '2024-01' format

  // ── AI Usage ───────────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  aiInputTokens: number;

  @Prop({ default: 0 })
  aiOutputTokens: number;

  @Prop({ trim: true, default: '' })
  aiModel: string;

  @Prop({ default: 0 })
  aiCost: number;

  // ── Voice Usage ────────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  sttMinutes: number;

  @Prop({ default: 0 })
  ttsCharacters: number;

  @Prop({ default: 0 })
  ttsCost: number;

  // ── Telephony Usage ────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  callMinutes: number;

  @Prop({ default: 0 })
  incomingMinutes: number;

  @Prop({ default: 0 })
  outgoingMinutes: number;

  @Prop({ default: 0 })
  costPerMinute: number;

  @Prop({ default: 0 })
  telephonyCost: number;

  // ── Total ──────────────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  totalCost: number;

  // ── Recording Usage ────────────────────────────────────────────────────────
  @Prop({ default: 0 })
  recordingsCount: number;

  @Prop({ default: 0 })
  storageBytes: number;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);
UsageSchema.index({ organizationId: 1, period: 1 }, { unique: true });
