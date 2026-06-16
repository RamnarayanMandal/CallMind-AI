import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Plan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number; // monthly price in INR

  @Prop({ default: 0 })
  yearlyPrice: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: 0 })
  minutesLimit: number; // total AI call minutes per billing period

  @Prop({ default: 1 })
  agentLimit: number; // max AI agents

  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  razorpayPlanId: string; // auto-set by SubscriptionService.createPlan()

  @Prop({ default: 14 })
  trialDays: number;

  // ── Cost Rates (per unit) ────────────────────────────────────────────────
  @Prop({ default: 0.002 })
  aiCostPer1kTokens: number; // Cost per 1000 AI tokens (input/output)

  @Prop({ default: 0.5 })
  sttCostPerMinute: number; // Cost per minute of Speech-to-Text

  @Prop({ default: 0.01 })
  ttsCostPerCharacter: number; // Cost per character of Text-to-Speech

  @Prop({ default: 1.0 })
  telephonyCostPerMinute: number; // Cost per minute of telephony calls

  // ── Limits ───────────────────────────────────────────────────────────────
  @Prop({ default: 100000 })
  aiTokensLimit: number; // Max AI tokens per billing period

  @Prop({ default: 1000 })
  storageLimitMB: number; // Max storage in MB for recordings
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
