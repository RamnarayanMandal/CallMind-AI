import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../customer/schemas/customer.schema';
import { Conversation, ConversationDocument } from '../conversation/schemas/conversation.schema';
import { Organization, OrganizationDocument } from '../organization/schemas/organization.schema';
import { MailService } from '../mail/mail.service';

export interface ActionResult {
  action: string;
  success: boolean;
  data?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; normalized?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false };
    }
    return { valid: true, normalized: email.toLowerCase().trim() };
  }

  /**
   * Save or update a lead (customer record)
   */
  async saveLead(
    organizationId: string,
    data: { name?: string; email?: string; phone?: string; company?: string; notes?: string },
  ): Promise<ActionResult> {
    try {
      // Phone is required in Customer schema
      if (!data.phone) {
        return {
          action: 'lead_save_failed',
          success: false,
          data: { error: 'Phone number is required to save a lead' },
          timestamp: new Date(),
        };
      }

      const existing = await this.customerModel.findOne({ organizationId, phone: data.phone });

      if (existing) {
        // Update existing customer
        const updated = await this.customerModel.findByIdAndUpdate(
          existing._id,
          { $set: { ...data, organizationId } },
          { new: true },
        );
        return {
          action: 'lead_updated',
          success: true,
          data: { customerId: updated._id.toString(), phone: data.phone, name: data.name },
          timestamp: new Date(),
        };
      }

      // Create new customer
      const customer = new this.customerModel({
        organizationId,
        name: data.name || 'Unknown Lead',
        phone: data.phone,
        email: data.email || '',
        company: data.company || '',
        isActive: true,
      });
      await customer.save();

      return {
        action: 'lead_created',
        success: true,
        data: { customerId: customer._id.toString(), phone: data.phone, name: data.name },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to save lead: ${error.message}`);
      return {
        action: 'lead_save_failed',
        success: false,
        data: { error: error.message },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send demo email to customer
   */
  async sendDemoEmail(
    organizationId: string,
    customerEmail: string,
    customerName: string,
  ): Promise<ActionResult> {
    try {
      const org = await this.orgModel.findById(organizationId).lean();
      if (!org) {
        throw new Error('Organization not found');
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const orgName = org.name || 'Our Company';

      await this.mailService['transporter'].sendMail({
        from: `"${orgName}" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Demo Request - ${orgName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Thank you for your interest, ${customerName}!</h2>
            <p style="color: #475569; font-size: 16px;">
              We're excited to show you how ${orgName} can help your business.
            </p>
            <p style="color: #475569; font-size: 16px;">
              Here's what you can expect:
            </p>
            <ul style="color: #475569; font-size: 16px;">
              <li>Personalized demo tailored to your needs</li>
              <li>Live walkthrough of key features</li>
              <li>Q&A session with our team</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Schedule Your Demo
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              If you have any questions, feel free to reply to this email.
            </p>
            <hr style="border: none; border-top: #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              &copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.
            </p>
          </div>
        `,
      });

      return {
        action: 'demo_email_sent',
        success: true,
        data: { email: customerEmail, name: customerName },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send demo email: ${error.message}`);
      return {
        action: 'demo_email_failed',
        success: false,
        data: { error: error.message },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Share organization website link with customer
   */
  async shareWebsiteLink(
    organizationId: string,
    customerEmail: string,
    customerName: string,
  ): Promise<ActionResult> {
    try {
      const org = await this.orgModel.findById(organizationId).lean();
      if (!org) {
        throw new Error('Organization not found');
      }

      const website = org.website || `${process.env.FRONTEND_URL}`;
      const orgName = org.name || 'Our Company';

      await this.mailService['transporter'].sendMail({
        from: `"${orgName}" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Learn More About ${orgName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Hello ${customerName}!</h2>
            <p style="color: #475569; font-size: 16px;">
              As discussed, here's the link to learn more about ${orgName}:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${website}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Visit Our Website
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Feel free to explore and let us know if you have any questions!
            </p>
          </div>
        `,
      });

      return {
        action: 'website_shared',
        success: true,
        data: { email: customerEmail, website },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to share website: ${error.message}`);
      return {
        action: 'website_share_failed',
        success: false,
        data: { error: error.message },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Log action to conversation's actionLog
   */
  async logAction(callId: string, result: ActionResult): Promise<void> {
    try {
      await this.conversationModel.findOneAndUpdate(
        { callId },
        { $push: { actionLog: result } },
      );
    } catch (error) {
      this.logger.error(`Failed to log action for callId=${callId}: ${error.message}`);
    }
  }

  /**
   * Execute an action based on the AI's request
   */
  async executeAction(
    callId: string,
    organizationId: string,
    actionType: string,
    params: Record<string, any>,
  ): Promise<ActionResult> {
    let result: ActionResult;

    switch (actionType) {
      case 'validate_email':
        const validation = this.validateEmail(params.email);
        result = {
          action: 'email_validated',
          success: validation.valid,
          data: { email: params.email, normalized: validation.normalized, valid: validation.valid },
          timestamp: new Date(),
        };
        break;

      case 'save_lead':
        result = await this.saveLead(organizationId, params);
        break;

      case 'send_demo_email':
        result = await this.sendDemoEmail(organizationId, params.email, params.name);
        break;

      case 'share_website':
        result = await this.shareWebsiteLink(organizationId, params.email, params.name);
        break;

      default:
        result = {
          action: 'unknown_action',
          success: false,
          data: { actionType, message: `Unknown action type: ${actionType}` },
          timestamp: new Date(),
        };
    }

    // Log to conversation
    await this.logAction(callId, result);

    return result;
  }
}
