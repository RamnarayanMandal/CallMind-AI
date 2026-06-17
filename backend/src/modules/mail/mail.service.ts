import { google } from 'googleapis';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private auth: any;
  private readonly companyName = process.env.SMTP_FROM_NAME || 'CallMind AI';
  private gmail: any;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn('Missing Google OAuth2 credentials. Emails will be skipped.');
      return;
    }

    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    this.logger.log(`EmailService initialized for: ${process.env.SMTP_USER}`);
  }

  private async sendOrSkip(to: string, subject: string, html: string) {
    if (!this.gmail) {
      this.logger.warn('Gmail API not configured — skipping email');
      return;
    }

    const from = `"${this.companyName}" <${process.env.SMTP_USER}>`;
    const raw = this.buildRawEmail(from, to, subject, html);

    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }

  private buildRawEmail(from: string, to: string, subject: string, html: string): string {
    const lines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
    ];
    const email = lines.join('\r\n');
    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    const html = `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${url}">${url}</a>
      <p>This link will expire in 24 hours.</p>
    `;
    await this.sendOrSkip(email, 'Verify your email address', html);
  }

  async sendVerificationOtp(email: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
        <h2 style="color: #0f172a; text-align: center;">Verify Your Email</h2>
        <p style="color: #475569; font-size: 16px;">Hello,</p>
        <p style="color: #475569; font-size: 16px;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
      </div>
    `;
    await this.sendOrSkip(email, 'Your OTP Verification Code', html);
  }

  async sendContactNotification(adminEmail: string, contact: { name: string; email: string; phone: string; subject: string; message: string }) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a;">New Contact Message</h2>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;color:#475569;font-weight:600;">Name</td><td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;">${contact.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;color:#475569;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;">${contact.email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;color:#475569;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;">${contact.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;color:#475569;font-weight:600;">Subject</td><td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;">${contact.subject}</td></tr>
        </table>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="color:#475569;font-weight:600;margin:0 0 8px;">Message:</p>
          <p style="color:#0f172a;margin:0;">${contact.message}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;">View in admin panel: ${process.env.FRONTEND_URL || '#'}/admin/contact-us</p>
      </div>
    `;
    await this.sendOrSkip(adminEmail, `New Contact: ${contact.subject}`, html);
  }

  async sendForgotPasswordOtp(email: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
        <h2 style="color: #0f172a; text-align: center;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 16px;">Hello,</p>
        <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the reset process:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ef4444;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email; your password will remain secure.</p>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
      </div>
    `;
    await this.sendOrSkip(email, 'Reset Your Password - OTP Code', html);
  }
}
