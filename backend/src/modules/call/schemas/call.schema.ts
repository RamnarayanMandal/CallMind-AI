import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CallDocument = Call & Document;

export enum CallStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NO_ANSWER = 'no-answer',
  CANCELLED = 'cancelled',
}

export enum CallOutcome {
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not-interested',
  FOLLOW_UP = 'follow-up',
  NO_ANSWER = 'no-answer',
  UNKNOWN = 'unknown',
}

@Schema({ timestamps: true, collection: 'calls' })
export class Call {
  @Prop({ type: String, ref: 'Customer', required: true, index: true })
  customerId: string;

  @Prop({ type: String, ref: 'Agent', required: true })
  agentId: string;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: String, enum: Object.values(CallStatus), default: CallStatus.PENDING, index: true })
  status: CallStatus;

  @Prop({ type: String, enum: Object.values(CallOutcome), default: CallOutcome.UNKNOWN })
  outcome: CallOutcome;

  @Prop({ trim: true })
  callSid?: string;

  @Prop({ trim: true })
  telephonyProvider?: string;

  @Prop({ trim: true })
  phoneNumber: string;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: 0 })
  durationSeconds: number;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop({ default: 0 })
  retryCount: number;
}

export const CallSchema = SchemaFactory.createForClass(Call);
CallSchema.index({ organizationId: 1, status: 1 });
CallSchema.index({ organizationId: 1, createdAt: -1 });
CallSchema.index({ scheduledAt: 1, status: 1 });
