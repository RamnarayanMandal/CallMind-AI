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
  EN = 'en',
  HI = 'hi',
  HINGLISH = 'hinglish',
  BN = 'bn',
  TA = 'ta',
  TE = 'te',
  MR = 'mr',
  GU = 'gu',
  KN = 'kn',
  ML = 'ml',
  PA = 'pa',
  UR = 'ur',
  OR = 'or',
  AS = 'as',
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

  // Tool enablement — list of tool names this agent can call
  @Prop({ type: [String], default: [] })
  enabledTools: string[];

  // Personality
  @Prop({ trim: true })
  welcomeMessage?: string; // First thing agent says

  @Prop({ trim: true })
  persona?: string; // "You are Priya, a helpful support agent for..."

  @Prop({ trim: true })
  fallbackMessage?: string; // When agent doesn't know

  // Business goal
  @Prop({ trim: true, enum: ['support', 'sales', 'appointment', 'followup', 'general'], default: 'general' })
  businessGoal?: string;

  // Behavior flags
  @Prop({ default: true })
  enableHumanEscalation: boolean;

  @Prop({ default: true })
  enableLeadCapture: boolean;

  @Prop({ default: true })
  enableCallTranscript: boolean;

  @Prop({ default: 600 })
  maxCallDurationSeconds?: number;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: String, ref: 'User', required: true })
  createdBy: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
