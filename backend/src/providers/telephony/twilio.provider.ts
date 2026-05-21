import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITelephonyProvider, CallOptions, CallResult } from './telephony.interface';
import * as twilio from 'twilio';

@Injectable()
export class TwilioTelephonyProvider implements ITelephonyProvider {
  private readonly client: twilio.Twilio;
  private readonly logger = new Logger(TwilioTelephonyProvider.name);
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('telephony.twilio.accountSid');
    const authToken = this.configService.get<string>('telephony.twilio.authToken');
    this.fromNumber = this.configService.get<string>('telephony.twilio.phoneNumber');
    
    this.client = twilio(accountSid, authToken);
  }

  async initiateCall(options: CallOptions): Promise<CallResult> {
  try {

    let to = options.to;

    if (to.length === 10) {
      to = `+91${to}`;
    } else if (!to.startsWith('+')) {
      to = `+${to}`;
    }

    this.logger.log(`Initiating Twilio call to ${to}`);

    const call = await this.client.calls.create({
      from: this.fromNumber,
      to,
      url: 'https://your-domain.com/twilio/voice',
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

  async endCall(callSid: string): Promise<void> {
    await this.client.calls(callSid).update({ status: 'completed' });
  }

  async getCallStatus(callSid: string): Promise<string> {
    const call = await this.client.calls(callSid).fetch();
    return call.status;
  }
}
