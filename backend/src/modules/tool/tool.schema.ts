import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ToolDocument = Tool & Document;

@Schema({ timestamps: true })
export class Tool {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, trim: true })
  name: string; // 'get_order_status' — used by LLM

  @Prop({ required: true, trim: true })
  displayName: string; // 'Get Order Status' — shown in UI

  @Prop({ required: true, trim: true })
  description: string; // Used in LLM function schema

  @Prop({ trim: true, default: 'general' })
  category: string; // 'ecommerce' | 'crm' | 'appointment' | 'support' | 'general'

  // LLM function call JSON schema for parameters
  @Prop({ type: Object, required: true })
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };

  // Integration to call
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Integration' })
  integrationId?: string;

  // API endpoint template e.g. '/orders/{orderId}'
  @Prop({ trim: true })
  endpoint?: string;

  @Prop({ type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' })
  method?: string;

  // Map LLM parameter names to API parameter names
  @Prop({ type: Object, default: {} })
  parameterMapping: Record<string, string>;

  // JSONPath to extract from API response (e.g. 'data.order.status')
  @Prop({ trim: true })
  responseMapping?: string;

  // Template for human-readable response. Uses {field} substitution
  @Prop({ trim: true })
  responseTemplate?: string; // e.g. 'Your order {orderId} status is: {status}'

  @Prop({ default: false })
  isBuiltIn: boolean; // Platform-provided tools

  @Prop({ default: true })
  isActive: boolean;
}

export const ToolSchema = SchemaFactory.createForClass(Tool);
ToolSchema.index({ organizationId: 1, name: 1 }, { unique: true });
