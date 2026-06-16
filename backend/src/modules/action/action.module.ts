import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionService } from './action.service';
import { Customer, CustomerSchema } from '../customer/schemas/customer.schema';
import { Conversation, ConversationSchema } from '../conversation/schemas/conversation.schema';
import { Organization, OrganizationSchema } from '../organization/schemas/organization.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    MailModule,
  ],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
