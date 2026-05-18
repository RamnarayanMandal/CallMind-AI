import { Injectable, Logger } from '@nestjs/common';
import { ITelephonyProvider, CallOptions, CallResult } from './telephony.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockTelephonyProvider implements ITelephonyProvider {
  private readonly logger = new Logger(MockTelephonyProvider.name);
  private readonly activeCalls = new Map<string, string>();

  async initiateCall(options: CallOptions): Promise<CallResult> {
    const callSid = `MOCK-${uuidv4()}`;
    this.activeCalls.set(callSid, 'in-progress');
    this.logger.log(`[MOCK] Initiating call to ${options.to}, SID: ${callSid}`);

    return {
      callSid,
      status: 'in-progress',
      provider: 'mock',
    };
  }

  async endCall(callSid: string): Promise<void> {
    this.activeCalls.set(callSid, 'completed');
    this.logger.log(`[MOCK] Ending call SID: ${callSid}`);
  }

  async getCallStatus(callSid: string): Promise<string> {
    return this.activeCalls.get(callSid) || 'unknown';
  }
}
