import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactDocument = Contact & Document;

export enum ContactStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true, collection: 'contacts' })
export class Contact {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: Object.values(ContactStatus), default: ContactStatus.NEW })
  status: ContactStatus;

  @Prop({ type: String, ref: 'Agent', default: null })
  assignedAgentId?: string;

  @Prop({ type: String, ref: 'Call', default: null })
  callId?: string;

  @Prop()
  response?: string;

  @Prop()
  respondedAt?: Date;

  @Prop()
  notes?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ status: 1 });
