import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type IntegrationDocument = Integration & Document;

export enum IntegrationType {
  SHOPIFY = 'shopify',
  HUBSPOT = 'hubspot',
  GOOGLE_CALENDAR = 'google_calendar',
  WOOCOMMERCE = 'woocommerce',
  SALESFORCE = 'salesforce',
  ZOHO = 'zoho',
  CUSTOM = 'custom',
}

export enum AuthType {
  API_KEY = 'api_key',
  BEARER = 'bearer',
  BASIC = 'basic',
  OAUTH2 = 'oauth2',
  NONE = 'none',
}

@Schema({ timestamps: true })
export class Integration {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, trim: true })
  name: string; // "My Shopify Store"

  @Prop({ type: String, enum: Object.values(IntegrationType), default: IntegrationType.CUSTOM })
  type: IntegrationType;

  @Prop({ required: true, trim: true })
  baseUrl: string;

  @Prop({ type: String, enum: Object.values(AuthType), default: AuthType.API_KEY })
  authType: AuthType;

  // Encrypted credentials stored as single JSON string
  @Prop({ trim: true })
  encryptedCredentials?: string; // AES-256 encrypted JSON

  // Custom headers (non-sensitive)
  @Prop({ type: Object })
  headers?: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastTestedAt?: Date;

  @Prop({ type: String, enum: ['success', 'failed', 'untested'], default: 'untested' })
  lastTestStatus?: string;

  @Prop({ trim: true })
  lastTestError?: string;

  // Built-in config template fields (for Shopify, HubSpot etc)
  @Prop({ trim: true })
  shopDomain?: string; // For Shopify: 'mystore.myshopify.com'

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
