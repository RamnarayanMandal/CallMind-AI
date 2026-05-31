import { Injectable, Logger } from '@nestjs/common';
import { ITelephonyProvider, CallOptions, CallResult, ProviderCredentials, StandardTelephonyEvent } from './telephony.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockTelephonyProvider implements ITelephonyProvider {
  name = 'mock';
  private readonly logger = new Logger(MockTelephonyProvider.name);
  private readonly activeCalls = new Map<string, string>();

  async initiateCall(options: CallOptions, credentials?: ProviderCredentials): Promise<CallResult> {
    const callSid = `MOCK-${uuidv4()}`;
    this.activeCalls.set(callSid, 'in-progress');
    this.logger.log(`[MOCK] Initiating call to ${options.to}, SID: ${callSid}`);

    return {
      callSid,
      status: 'in-progress',
      provider: 'mock',
    };
  }

  async endCall(callSid: string, credentials?: ProviderCredentials): Promise<void> {
    this.activeCalls.set(callSid, 'completed');
    this.logger.log(`[MOCK] Ending call SID: ${callSid}`);
  }

  async getCallStatus(callSid: string, credentials?: ProviderCredentials): Promise<string> {
    return this.activeCalls.get(callSid) || 'unknown';
  }

  async processWebhook(payload: any, signature?: string, credentials?: ProviderCredentials): Promise<StandardTelephonyEvent> {
    return {
      type: payload.type || 'unknown',
      callSid: payload.callSid || '',
      provider: this.name,
      rawPayload: payload,
    };
  }
}
