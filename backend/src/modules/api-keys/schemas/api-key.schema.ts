import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true, collection: 'api_keys' })
export class ApiKey {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  hash: string;

  @Prop({ type: [String], default: [] })
  permissions: string[]; // ['read', 'write', 'delete', 'admin']

  @Prop({ default: 1000 })
  rateLimit: number; // requests per minute

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
ApiKeySchema.index({ organizationId: 1 });
ApiKeySchema.index({ key: 1 }, { unique: true });
