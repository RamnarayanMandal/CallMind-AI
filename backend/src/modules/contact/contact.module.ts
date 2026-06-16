import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Call, CallSchema } from '../call/schemas/call.schema';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';
import { CALL_QUEUE } from '../call/call.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: User.name, schema: UserSchema },
      { name: Call.name, schema: CallSchema },
    ]),
    BullModule.registerQueue({ name: CALL_QUEUE }),
    NotificationModule,
    MailModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
