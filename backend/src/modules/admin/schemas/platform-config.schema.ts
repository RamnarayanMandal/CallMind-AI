import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformConfigDocument = PlatformConfig & Document;

@Schema({ timestamps: true, collection: 'platform_configs' })
export class PlatformConfig {
  /** Singleton key — always 'global' */
  @Prop({ required: true, unique: true, default: 'global' })
  key: string;

  /** Active telephony provider name */
  @Prop({ trim: true, default: 'vobiz' })
  defaultTelephonyProvider: string;

  /** Default provider account ID / Auth ID */
  @Prop({ trim: true })
  telephonyAccountId?: string;

  /** Default provider auth token */
  @Prop({ trim: true })
  telephonyAuthToken?: string;

  /** Default outbound caller number */
  @Prop({ trim: true })
  telephonyFromNumber?: string;

  /** Any additional provider-specific metadata */
  @Prop({ type: Object })
  telephonyMetadata?: Record<string, any>;
}

export const PlatformConfigSchema = SchemaFactory.createForClass(PlatformConfig);
