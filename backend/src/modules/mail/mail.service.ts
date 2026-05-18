import { google } from 'googleapis';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private auth: any;
  private readonly companyName = process.env.SMTP_FROM_NAME || 'CallMind AI';
  private transporter: nodemailer.Transporter;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn('Missing Google OAuth2 credentials in environment variables');
    }

    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.SMTP_USER,
        clientId,
        clientSecret,
        refreshToken,
      },
    });

    this.logger.log(`EmailService initialized for: ${process.env.SMTP_USER}`);
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;

    await this.transporter.sendMail({
      from: `"${this.companyName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${url}">${url}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendVerificationOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"${this.companyName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `
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
      `,
    });
  }

  async sendForgotPasswordOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"${this.companyName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password - OTP Code',
      html: `
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
      `,
    });
  }
}
