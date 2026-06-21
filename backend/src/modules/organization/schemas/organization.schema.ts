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

  // Extended Contact
  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phoneNumber?: string;

  @Prop({ trim: true })
  address?: string;

  // Industry
  @Prop({ trim: true })
  industryCategory?: string; // Sub-category e.g. 'fashion', 'electronics'

  // Business hours
  @Prop({ trim: true })
  workingHours?: string; // "Mon-Sat 9AM-6PM IST"

  @Prop({ trim: true })
  supportHours?: string;

  // Escalation / Human Handoff
  @Prop({ trim: true })
  escalationNumber?: string;

  @Prop({ trim: true })
  escalationEmail?: string;

  // Branding
  @Prop({ trim: true })
  logoUrl?: string;

  @Prop({ trim: true })
  tagline?: string;

  @Prop({ type: Object })
  brandColors?: { primary?: string; secondary?: string };

  // Agent defaults
  @Prop({ trim: true })
  defaultLanguage?: string; // 'hi-IN' | 'en-IN' | 'hinglish'

  @Prop({ trim: true })
  defaultWelcomeMessage?: string;

  // Products as structured array
  @Prop({ type: [String], default: [] })
  productsAndServices?: string[];

  // Policies
  @Prop({ trim: true })
  returnPolicy?: string;

  @Prop({ trim: true })
  shippingPolicy?: string;

  @Prop({ trim: true })
  refundPolicy?: string;

  @Prop({ trim: true })
  pricingInfo?: string;

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
