import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, unique: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
  planId: string;

  @Prop()
  razorpaySubscriptionId: string;

  @Prop()
  razorpayCustomerId: string;

  @Prop({ enum: ['active', 'past_due', 'canceled', 'trialing'], default: 'trialing' })
  status: string;

  @Prop({ default: 0 })
  minutesUsed: number;

  @Prop()
  currentPeriodStart: Date;

  @Prop()
  currentPeriodEnd: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
