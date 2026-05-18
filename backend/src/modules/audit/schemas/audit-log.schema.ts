import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  userEmail: string;

  @Prop()
  ip: string;

  @Prop({ type: Object })
  metadata: any;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
