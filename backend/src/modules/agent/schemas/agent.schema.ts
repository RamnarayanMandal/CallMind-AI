import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

export enum AgentGender { MALE = 'male', FEMALE = 'female' }
export enum AgentTone { PROFESSIONAL = 'professional', FRIENDLY = 'friendly', FORMAL = 'formal', CASUAL = 'casual' }

@Schema({ timestamps: true, collection: 'agents' })
export class Agent {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: Object.values(AgentGender), default: AgentGender.FEMALE })
  gender: AgentGender;

  @Prop({ type: String, enum: Object.values(AgentTone), default: AgentTone.PROFESSIONAL })
  tone: AgentTone;

  @Prop({ default: 'en-IN' })
  language: string;

  @Prop({ trim: true })
  systemPrompt?: string;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: String, ref: 'User', required: true })
  createdBy: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
