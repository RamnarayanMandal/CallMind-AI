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

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared base layout wrapper
  // ─────────────────────────────────────────────────────────────────────────────
  private baseLayout(content: string, accentColor = '#5B3FA6'): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${this.companyName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #FDF8F0;
      font-family: 'Nunito', 'Helvetica Neue', Arial, sans-serif;
      color: #1A1A2E;
      padding: 32px 16px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      padding: 24px 0 16px;
    }
    .logo-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      border: 1.5px solid rgba(91,63,166,0.18);
      border-radius: 50px;
      padding: 8px 20px 8px 12px;
      box-shadow: 0 4px 14px rgba(91,63,166,0.10);
    }
    .logo-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, ${accentColor}, #8B6FD4);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .logo-text {
      font-family: 'Caveat', cursive;
      font-size: 22px;
      font-weight: 700;
      color: ${accentColor};
      letter-spacing: 0.02em;
    }

    /* ── Card ── */
    .card {
      background: #FFFDF8;
      border-radius: 24px;
      border: 1.5px solid rgba(0,0,0,0.06);
      box-shadow: 0 6px 28px rgba(0,0,0,0.07);
      padding: 36px 40px;
      margin: 16px 0;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, ${accentColor}, #8B6FD4, #C084FC);
      border-radius: 24px 24px 0 0;
    }

    /* ── Deco band (stars/sparkles) ── */
    .deco-band {
      text-align: center;
      font-size: 18px;
      letter-spacing: 6px;
      margin: 12px 0;
      opacity: 0.55;
    }

    /* ── Section heading ── */
    .section-title {
      font-family: 'Caveat', cursive;
      font-size: 28px;
      font-weight: 700;
      color: #1A1A2E;
      text-align: center;
      margin-bottom: 6px;
      letter-spacing: 0.01em;
    }
    .section-subtitle {
      font-size: 14px;
      color: #7A7A9D;
      text-align: center;
      margin-bottom: 28px;
      line-height: 1.6;
    }

    /* ── OTP Box ── */
    .otp-box {
      background: #F3EEFF;
      border: 2px dashed #C084FC;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-number {
      font-family: 'Caveat', cursive;
      font-size: 52px;
      font-weight: 700;
      letter-spacing: 10px;
      color: ${accentColor};
      display: block;
    }
    .otp-label {
      font-size: 12px;
      color: #7A7A9D;
      margin-top: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ── CTA Button ── */
    .cta-wrap { text-align: center; margin: 28px 0 20px; }
    .cta-btn {
      display: inline-block;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      font-family: 'Nunito', sans-serif;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 36px;
      border-radius: 14px;
      box-shadow: 0 6px 18px rgba(91,63,166,0.30);
      letter-spacing: 0.02em;
    }

    /* ── Info Table ── */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border-radius: 14px;
      overflow: hidden;
    }
    .info-table td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .info-table tr:last-child td { border-bottom: none; }
    .info-table .label-cell {
      width: 28%;
      color: #7A7A9D;
      font-weight: 700;
      background: #F8F5FF;
    }
    .info-table .value-cell {
      color: #1A1A2E;
      background: #FDFBFF;
    }

    /* ── Message Box ── */
    .message-box {
      background: #FFF8E7;
      border-left: 4px solid #FBBF24;
      border-radius: 0 12px 12px 0;
      padding: 16px 20px;
      margin: 16px 0;
      font-size: 14px;
      color: #1A1A2E;
      line-height: 1.7;
    }
    .message-label {
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #92400E;
      margin-bottom: 6px;
    }

    /* ── Sticky Note ── */
    .sticky-note {
      display: inline-block;
      background: #FFF176;
      padding: 10px 14px;
      border-radius: 4px;
      transform: rotate(-2deg);
      box-shadow: 3px 4px 12px rgba(0,0,0,0.10);
      font-family: 'Caveat', cursive;
      font-size: 14px;
      color: #1A1A2E;
      margin: 12px auto;
    }
    .sticky-note-purple {
      background: #E8D5FB;
      transform: rotate(1.5deg);
    }

    /* ── Warning / Info callout ── */
    .callout {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 13px;
      color: #1E40AF;
      margin: 20px 0;
      line-height: 1.6;
    }
    .callout-warn {
      background: #FFF7ED;
      border-color: #FED7AA;
      color: #9A3412;
    }

    /* ── Decorative sparkle row ── */
    .sparkle-row {
      text-align: center;
      margin: 8px 0;
      font-size: 20px;
      opacity: 0.4;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding: 24px 0 8px;
    }
    .footer p {
      font-size: 12px;
      color: #B0ABCA;
      margin: 4px 0;
      line-height: 1.6;
    }
    .footer a { color: #8B6FD4; text-decoration: none; }
    .footer-wave {
      font-family: 'Caveat', cursive;
      font-size: 20px;
      color: #C084FC;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo-pill">
        <span class="logo-icon">🎙️</span>
        <span class="logo-text">CallMind AI</span>
      </div>
    </div>

    <div class="deco-band">✦ ✧ ✦ ✧ ✦</div>

    <!-- Main Card -->
    <div class="card">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-wave">✨ Made with care by ${this.companyName} ✨</div>
      <p>&copy; ${year} ${this.companyName}. All rights reserved.</p>
      <p>You received this email because you have an account with us.</p>
    </div>
  </div>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Email Verification Link
  // ─────────────────────────────────────────────────────────────────────────────
  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;

    const content = `
      <div class="sparkle-row">✉️ 🌟</div>
      <div class="section-title">Verify Your Email</div>
      <div class="section-subtitle">Just one click and you're all set! ✨</div>

      <p style="font-size:15px;color:#475569;line-height:1.7;margin-bottom:16px;">
        Hello there! 👋<br/>
        Welcome aboard <strong>CallMind AI</strong>! We just need to confirm your email address before you dive in.
      </p>

      <div class="cta-wrap">
        <a href="${url}" class="cta-btn">✅ Verify My Email</a>
      </div>

      <div class="callout">
        🔗 Or paste this link in your browser:<br/>
        <span style="word-break:break-all;font-size:12px;">${url}</span>
      </div>

      <div class="callout callout-warn">
        ⏰ This link will expire in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
      </div>

      <div style="text-align:center;margin-top:20px;">
        <span class="sticky-note">You're almost there! 🎉</span>
      </div>
    `;

    await this.sendOrSkip(email, '✅ Verify your email — CallMind AI', this.baseLayout(content));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Verification OTP
  // ─────────────────────────────────────────────────────────────────────────────
  async sendVerificationOtp(email: string, otp: string) {
    const content = `
      <div class="sparkle-row">🔐 ✨</div>
      <div class="section-title">Your Verification Code</div>
      <div class="section-subtitle">Enter this code to confirm your identity.</div>

      <p style="font-size:15px;color:#475569;line-height:1.7;margin-bottom:8px;">
        Hello! 👋<br/>
        Here is your one-time verification code for <strong>CallMind AI</strong>:
      </p>

      <div class="otp-box">
        <span class="otp-number">${otp}</span>
        <div class="otp-label">🔑 One-Time Password</div>
      </div>

      <div class="callout callout-warn">
        ⏰ This code expires in <strong>10 minutes</strong>. Never share this code with anyone — our team will never ask for it.
      </div>

      <div style="text-align:center;margin-top:20px;">
        <span class="sticky-note sticky-note-purple">Keep it secret! 🤫</span>
      </div>
    `;

    await this.sendOrSkip(email, '🔐 Your OTP Code — CallMind AI', this.baseLayout(content));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Contact Notification (to admin)
  // ─────────────────────────────────────────────────────────────────────────────
  async sendContactNotification(
    adminEmail: string,
    contact: { name: string; email: string; phone: string; subject: string; message: string },
  ) {
    const adminUrl = `${process.env.FRONTEND_URL || '#'}/admin/contact-us`;

    const content = `
      <div class="sparkle-row">📬 🌟</div>
      <div class="section-title">New Contact Message</div>
      <div class="section-subtitle">Someone reached out through the website!</div>

      <table class="info-table">
        <tr>
          <td class="label-cell">👤 Name</td>
          <td class="value-cell"><strong>${contact.name}</strong></td>
        </tr>
        <tr>
          <td class="label-cell">📧 Email</td>
          <td class="value-cell">${contact.email}</td>
        </tr>
        <tr>
          <td class="label-cell">📞 Phone</td>
          <td class="value-cell">${contact.phone}</td>
        </tr>
        <tr>
          <td class="label-cell">📌 Subject</td>
          <td class="value-cell"><strong>${contact.subject}</strong></td>
        </tr>
      </table>

      <div class="message-box">
        <div class="message-label">💬 Message</div>
        ${contact.message}
      </div>

      <div class="cta-wrap">
        <a href="${adminUrl}" class="cta-btn">📋 View in Admin Panel</a>
      </div>

      <div style="text-align:center;margin-top:16px;">
        <span class="sticky-note">Don't forget to reply! 📝</span>
      </div>
    `;

    await this.sendOrSkip(
      adminEmail,
      `📬 New Contact: ${contact.subject}`,
      this.baseLayout(content, '#0F766E'),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Forgot Password OTP
  // ─────────────────────────────────────────────────────────────────────────────
  async sendForgotPasswordOtp(email: string, otp: string) {
    const content = `
      <div class="sparkle-row">🔒 ✨</div>
      <div class="section-title">Reset Your Password</div>
      <div class="section-subtitle">Use the code below to set a new password.</div>

      <p style="font-size:15px;color:#475569;line-height:1.7;margin-bottom:8px;">
        Hello! 👋<br/>
        We received a request to reset your <strong>CallMind AI</strong> password. Use this code to complete the process:
      </p>

      <div class="otp-box" style="background:#FFF1F2;border-color:#FDA4AF;">
        <span class="otp-number" style="color:#BE123C;">${otp}</span>
        <div class="otp-label" style="color:#9F1239;">🔑 Password Reset Code</div>
      </div>

      <div class="callout callout-warn">
        ⏰ This code expires in <strong>10 minutes</strong>.
        If you did <strong>not</strong> request a password reset, please ignore this email — your account remains secure.
      </div>

      <div class="callout" style="background:#F0FDF4;border-color:#BBF7D0;color:#166534;">
        🛡️ For your security, never share this code. CallMind AI staff will never ask for it.
      </div>

      <div style="text-align:center;margin-top:20px;">
        <span class="sticky-note" style="background:#FFE4E6;">Stay safe out there! 🔐</span>
      </div>
    `;

    await this.sendOrSkip(
      email,
      '🔒 Reset Your Password — CallMind AI',
      this.baseLayout(content, '#BE123C'),
    );
  }
}