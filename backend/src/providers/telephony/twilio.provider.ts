import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITelephonyProvider, CallOptions, CallResult, ProviderCredentials, StandardTelephonyEvent } from './telephony.interface';
import * as twilio from 'twilio';

@Injectable()
export class TwilioTelephonyProvider implements ITelephonyProvider {
  name = 'twilio';
  private readonly client: twilio.Twilio;
  private readonly logger = new Logger(TwilioTelephonyProvider.name);
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('telephony.twilio.accountSid');
    const authToken = this.configService.get<string>('telephony.twilio.authToken');
    this.fromNumber = this.configService.get<string>('telephony.twilio.phoneNumber');
    
    this.client = twilio(accountSid, authToken);
  }

  private getClient(credentials?: ProviderCredentials): twilio.Twilio {
    if (credentials?.accountId && credentials?.authToken) {
      return twilio(credentials.accountId, credentials.authToken);
    }
    return this.client;
  }

  async initiateCall(options: CallOptions, credentials?: ProviderCredentials): Promise<CallResult> {
  try {
    const client = this.getClient(credentials);
    let to = options.to;

    if (to.length === 10) {
      to = `+91${to}`;
    } else if (!to.startsWith('+')) {
      to = `+${to}`;
    }

    this.logger.log(`Initiating Twilio call to ${to}`);

    const call = await client.calls.create({
      from: options.from || this.fromNumber,
      to,
      url: options.webhookUrl || 'https://your-domain.com/telephony/webhook/twilio',
    });

    return {
      callSid: call.sid,
      status: call.status,
      provider: 'twilio',
    };

  } catch (error) {
    this.logger.error(`Twilio call failed: ${error.message}`);
    throw error;
  }
}

  async endCall(callSid: string, credentials?: ProviderCredentials): Promise<void> {
    const client = this.getClient(credentials);
    await client.calls(callSid).update({ status: 'completed' });
  }

  async getCallStatus(callSid: string, credentials?: ProviderCredentials): Promise<string> {
    const client = this.getClient(credentials);
    const call = await client.calls(callSid).fetch();
    return call.status;
  }

  async processWebhook(payload: any, signature?: string, credentials?: ProviderCredentials): Promise<StandardTelephonyEvent> {
    let type: StandardTelephonyEvent['type'] = 'unknown';
    const status = payload.CallStatus;

    if (status === 'ringing' || status === 'in-progress') type = 'call.answered';
    else if (status === 'completed') type = 'call.hangup';
    else if (status === 'failed' || status === 'busy' || status === 'no-answer') type = 'call.failed';
    else if (payload.AnsweredBy === 'machine_start') type = 'call.machine_detected';

    return {
      type,
      callSid: payload.CallSid || '',
      provider: this.name,
      rawPayload: payload,
    };
  }
}
