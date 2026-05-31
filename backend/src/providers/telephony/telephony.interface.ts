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

export interface StandardTelephonyEvent {
  type: 'call.initiated' | 'call.answered' | 'call.hangup' | 'call.failed' | 'call.machine_detected' | 'unknown';
  callSid: string;
  metadata?: Record<string, any>;
  rawPayload: any;
  provider: string;
}

export interface ProviderCredentials {
  accountId: string;
  authToken: string;
  metadata?: Record<string, any>;
}

export interface ITelephonyProvider {
  name: string;
  initiateCall(options: CallOptions, credentials?: ProviderCredentials): Promise<CallResult>;
  endCall(callSid: string, credentials?: ProviderCredentials): Promise<void>;
  getCallStatus(callSid: string, credentials?: ProviderCredentials): Promise<string>;
  
  purchaseNumber?(areaCode: string, credentials?: ProviderCredentials): Promise<string>;
  releaseNumber?(phoneNumber: string, credentials?: ProviderCredentials): Promise<void>;
  transferCall?(callSid: string, transferTo: string, credentials?: ProviderCredentials): Promise<void>;
  recordCall?(callSid: string, action: 'start' | 'stop', credentials?: ProviderCredentials): Promise<void>;
  lookupNumber?(phoneNumber: string, credentials?: ProviderCredentials): Promise<any>;
  
  processWebhook(payload: any, signature?: string, credentials?: ProviderCredentials): Promise<StandardTelephonyEvent>;
}

export const TELEPHONY_PROVIDER = 'TELEPHONY_PROVIDER';
