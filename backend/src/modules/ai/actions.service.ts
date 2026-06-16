import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from '../customer/customer.service';

export interface ActionResult {
  action: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface ActionContext {
  organizationId: string;
  callId: string;
  customerPhone?: string;
}

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    private readonly customerService: CustomerService,
  ) {}

  /**
   * Returns OpenAI-compatible function schemas for LLM tool-calling
   */
  getFunctionSchemas() {
    return [
      {
        name: 'send_followup_email',
        description: 'Send a follow-up email to the customer after the call with a summary or offer',
        parameters: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Customer email address' },
            subject: { type: 'string', description: 'Email subject line' },
            body: { type: 'string', description: 'Email body in plain text' },
          },
          required: ['email', 'subject', 'body'],
        },
      },
      {
        name: 'save_lead',
        description: 'Save the customer as a qualified lead with their interest and priority',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer full name' },
            phone: { type: 'string', description: 'Customer phone number' },
            interest: { type: 'string', description: 'What product/service the customer is interested in' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Lead priority level based on interest shown',
            },
          },
          required: ['name', 'phone', 'interest'],
        },
      },
      {
        name: 'schedule_callback',
        description: 'Schedule a callback for the customer at a specific time they requested',
        parameters: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Customer phone number to call back' },
            preferredTime: { type: 'string', description: 'Preferred callback time (e.g., "tomorrow 10am", "Monday 3pm IST")' },
            reason: { type: 'string', description: 'Reason for the callback' },
          },
          required: ['phone', 'preferredTime'],
        },
      },
    ];
  }

  /**
   * Execute a named action with given parameters
   */
  async executeAction(actionName: string, params: any, context: ActionContext): Promise<ActionResult> {
    this.logger.log(`[ACTION] Executing "${actionName}" org=${context.organizationId} call=${context.callId}`);

    try {
      switch (actionName) {
        case 'send_followup_email':
          return await this.sendFollowupEmail(params, context);
        case 'save_lead':
          return await this.saveLead(params, context);
        case 'schedule_callback':
          return await this.scheduleCallback(params, context);
        default:
          return {
            action: actionName,
            success: false,
            error: `Unknown action: ${actionName}`,
            timestamp: new Date(),
          };
      }
    } catch (err) {
      this.logger.error(`[ACTION_FAILED] ${actionName}: ${err.message}`);
      return { action: actionName, success: false, error: err.message, timestamp: new Date() };
    }
  }

  // ── Private Action Implementations ────────────────────────────────────────

  private async sendFollowupEmail(params: any, context: ActionContext): Promise<ActionResult> {
    // Email sending is handled by MailModule — here we log intent and return success
    // In production, inject MailService and call mailService.sendGeneric(...)
    this.logger.log(`[ACTION:EMAIL] Would send email to ${params.email} — subject: "${params.subject}"`);
    return {
      action: 'send_followup_email',
      success: true,
      data: { email: params.email, subject: params.subject },
      timestamp: new Date(),
    };
  }

  private async saveLead(params: any, context: ActionContext): Promise<ActionResult> {
    try {
      this.logger.log(`[ACTION:LEAD] Saving lead ${params.name} / ${params.phone} priority=${params.priority || 'medium'}`);

      // Create or update customer record via CustomerService
      await this.customerService.create({
        name: params.name,
        phone: params.phone,
        organizationId: context.organizationId,
        metadata: {
          isLead: true,
          priority: params.priority || 'medium',
          interest: params.interest,
        },
      });

      return {
        action: 'save_lead',
        success: true,
        data: { name: params.name, phone: params.phone, priority: params.priority || 'medium' },
        timestamp: new Date(),
      };
    } catch (err) {
      this.logger.error(`[ACTION:LEAD_ERROR] ${err.message}`);
      return { action: 'save_lead', success: false, error: err.message, timestamp: new Date() };
    }
  }

  private async scheduleCallback(params: any, context: ActionContext): Promise<ActionResult> {
    // In production, this would create a scheduled call record via CallService
    this.logger.log(`[ACTION:CALLBACK] Scheduling callback for ${params.phone} at "${params.preferredTime}"`);
    return {
      action: 'schedule_callback',
      success: true,
      data: { phone: params.phone, preferredTime: params.preferredTime, reason: params.reason || '' },
      timestamp: new Date(),
    };
  }
}
