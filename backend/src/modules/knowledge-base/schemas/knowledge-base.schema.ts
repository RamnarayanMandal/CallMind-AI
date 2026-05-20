import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type KnowledgeBaseDocument = KnowledgeBase & Document;

@Schema({ timestamps: true })
export class KnowledgeBase {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Number], default: [] })
  vector: number[]; // Optional field if we configure a vector search index later
}

export const KnowledgeBaseSchema = SchemaFactory.createForClass(KnowledgeBase);

// Compound text index for fast keyword/phrase matches
KnowledgeBaseSchema.index({ question: 'text', answer: 'text', tags: 'text' });
