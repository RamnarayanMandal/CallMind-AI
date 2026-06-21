import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type KnowledgeBaseDocument = KnowledgeBase & Document;

export enum KnowledgeBaseType {
  FAQ = 'faq',
  POLICY = 'policy',
  PRODUCT = 'product',
  DOCUMENT = 'document',
  PROCEDURE = 'procedure',
}

export enum KnowledgeSourceType {
  MANUAL = 'manual',
  PDF = 'pdf',
  URL = 'url',
  CSV = 'csv',
}

@Schema({ timestamps: true })
export class KnowledgeBase {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  // Optional: scope KB to a specific agent
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Agent', index: true })
  agentId?: string;

  @Prop({ type: String, enum: Object.values(KnowledgeBaseType), default: KnowledgeBaseType.FAQ })
  type: KnowledgeBaseType;

  @Prop({ required: true, trim: true })
  title: string;

  // FAQ fields
  @Prop({ trim: true })
  question?: string;

  @Prop({ trim: true })
  answer?: string;

  // Policy / Document field
  @Prop({ trim: true })
  content?: string;

  // Metadata
  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ trim: true })
  category?: string; // 'shipping' | 'returns' | 'pricing' | 'products' | 'general'

  @Prop({ default: 1 })
  priority: number; // Higher = shown first in RAG

  @Prop({ type: String, enum: Object.values(KnowledgeSourceType), default: KnowledgeSourceType.MANUAL })
  sourceType: KnowledgeSourceType;

  @Prop({ trim: true })
  sourceUrl?: string;

  @Prop({ trim: true })
  fileName?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [Number], default: [] })
  vector: number[];
}

export const KnowledgeBaseSchema = SchemaFactory.createForClass(KnowledgeBase);

KnowledgeBaseSchema.index({ question: 'text', answer: 'text', content: 'text', tags: 'text', title: 'text' }, {
  weights: { title: 10, question: 8, tags: 5, answer: 3, content: 2 }
});
KnowledgeBaseSchema.index({ organizationId: 1, type: 1, isActive: 1 });
