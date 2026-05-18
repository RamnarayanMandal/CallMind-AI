import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Plan extends Document {
  @Prop({ required: true })
  name: string; // Starter, Growth, Business

  @Prop({ required: true })
  priceInr: number;

  @Prop({ required: true })
  razorpayPlanId: string;

  @Prop({ required: true })
  includedMinutes: number; // e.g. 500

  @Prop({ required: true })
  maxAgents: number; // e.g. 1, 5, -1 (unlimited)
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
