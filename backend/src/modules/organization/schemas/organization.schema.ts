import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

export enum OrgTone {
  PROFESSIONAL = 'professional',
  FRIENDLY     = 'friendly',
  FORMAL       = 'formal',
  CASUAL       = 'casual',
  EMPATHETIC   = 'empathetic',
}

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  /** What the company does — elevator pitch */
  @Prop({ trim: true })
  about: string;

  /** Products and services offered */
  @Prop({ trim: true })
  productInfo: string;

  /** Who the company serves */
  @Prop({ trim: true })
  targetAudience?: string;

  /** Industry / vertical */
  @Prop({ trim: true })
  industry?: string;

  /** What the business wants to achieve via AI calls */
  @Prop({ trim: true })
  businessGoals?: string;

  /** Specific support or compliance instructions */
  @Prop({ trim: true })
  supportInstructions?: string;

  /** Default communication tone for agents in this org */
  @Prop({ type: String, enum: Object.values(OrgTone), default: OrgTone.PROFESSIONAL })
  tone?: OrgTone;

  /** Company website */
  @Prop({ trim: true })
  website?: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  ownerId: string;

  @Prop({ default: true })
  isActive: boolean;

  // Telephony Configuration
  @Prop({ trim: true })
  telephonyProviderName?: string;

  @Prop({ trim: true })
  telephonyAccountId?: string;
  
  @Prop({ trim: true })
  telephonyAuthToken?: string;

  @Prop({ trim: true })
  telephonyNumberId?: string;

  @Prop({ trim: true })
  telephonyPhoneNumber?: string;

  @Prop({ type: Object })
  telephonyMetadata?: Record<string, any>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
