export interface CallOptions {
  to: string;
  from?: string;
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

export interface CallResult {
  callSid: string;
  status: string;
  provider: string;
}

export interface ITelephonyProvider {
  initiateCall(options: CallOptions): Promise<CallResult>;
  endCall(callSid: string): Promise<void>;
  getCallStatus(callSid: string): Promise<string>;
}

export const TELEPHONY_PROVIDER = 'TELEPHONY_PROVIDER';
