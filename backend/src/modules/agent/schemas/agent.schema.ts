import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

export enum AgentGender { MALE = 'male', FEMALE = 'female' }
export enum AgentTone {
  PROFESSIONAL = 'professional',
  FRIENDLY     = 'friendly',
  FORMAL       = 'formal',
  CASUAL       = 'casual',
  EMPATHETIC   = 'empathetic',
}
export enum AgentLanguage {
  EN_US = 'en-US',
  EN_IN = 'en-IN',
  HI_IN = 'hi-IN',
  HINGLISH = 'hinglish',
  ES_ES = 'es-ES',
}

@Schema({ timestamps: true, collection: 'agents' })
export class Agent {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: Object.values(AgentGender), default: AgentGender.FEMALE })
  gender: AgentGender;

  @Prop({ type: String, enum: Object.values(AgentTone), default: AgentTone.PROFESSIONAL })
  tone: AgentTone;

  @Prop({ default: 'hi-IN' })
  language: string;

  /**
   * Optional custom instructions provided by the user at agent creation.
   * These are APPENDED to the auto-generated system prompt.
   */
  @Prop({ trim: true })
  customInstructions?: string;

  /**
   * Auto-generated system prompt built by PromptBuilderService
   * using the organization's context + agent personality settings.
   * Regenerated every time the agent or org is updated.
   */
  @Prop({ trim: true })
  generatedSystemPrompt?: string;

  /**
   * Legacy / manual override field — kept for backward compatibility.
   * If set, overrides generatedSystemPrompt entirely.
   */
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
