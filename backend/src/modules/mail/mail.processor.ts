import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from './mail.service';

@Processor('mail-queue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send-contact-email')
  async handleSendContactEmail(
    job: Job<{
      to: string;
      contact: {
        name: string;
        email: string;
        phone: string;
        subject: string;
        message: string;
      };
    }>,
  ) {
    const { to, contact } = job.data;
    this.logger.log(`Processing send-contact-email job for: ${to}`);

    try {
      await this.mailService.sendContactNotification(to, contact);
      this.logger.log(`Successfully sent contact notification email to: ${to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send contact notification email to: ${to}. Error: ${err.message}`,
        err.stack,
      );
      throw err; // Re-throw to trigger Bull's retry mechanism
    }
  }
}
