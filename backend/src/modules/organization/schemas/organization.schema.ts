import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ trim: true })
  about: string;

  @Prop({ trim: true })
  productInfo: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ trim: true })
  industry?: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  ownerId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
