import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService, BullModule.registerQueue({ name: 'mail-queue' })],
})
export class MailModule {}
