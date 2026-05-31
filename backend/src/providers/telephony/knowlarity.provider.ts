import { Injectable, Logger } from '@nestjs/common';
import { ITelephonyProvider, CallOptions, CallResult, ProviderCredentials, StandardTelephonyEvent } from './telephony.interface';

@Injectable()
export class KnowlarityProvider implements ITelephonyProvider {
  name = 'knowlarity';
  private readonly logger = new Logger(KnowlarityProvider.name);

  async initiateCall(options: CallOptions, credentials?: ProviderCredentials): Promise<CallResult> {
    if (!credentials || !credentials.accountId || !credentials.authToken) {
      throw new Error('Knowlarity credentials are required to initiate a call');
    }

    let to = options.to;
    if (to.length === 10) to = `+91${to}`;
    else if (!to.startsWith('+')) to = `+${to}`;

    const from = options.from || '+911171366938';

    this.logger.log(`Initiating Knowlarity call from ${from} to ${to}`);

    // Knowlarity REST API endpoint example (Plivo-like core since they are often unified or similar if using Exotel/Plivo/Knowlarity)
    const url = `https://kpi.knowlarity.com/Basic/v1/account/call/makecall`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': credentials.authToken, // Or Basic auth
        'x-api-key': credentials.accountId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        k_number: from,
        agent_number: to,
        // Depending on Knowlarity's specific webhook requirements
        callback_url: options.webhookUrl || 'https://your-domain.com/telephony/webhook/knowlarity',
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Knowlarity call failed: ${errorText}`);
      throw new Error(`Knowlarity API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      callSid: data.call_id || data.uuid || `knowlarity-${Date.now()}`,
      status: 'initiated',
      provider: this.name,
    };
  }

  async endCall(callSid: string, credentials?: ProviderCredentials): Promise<void> {
    // Knowlarity end call implementation
    this.logger.log(`End call requested for Knowlarity: ${callSid}`);
  }

  async getCallStatus(callSid: string, credentials?: ProviderCredentials): Promise<string> {
    return 'unknown';
  }

  async processWebhook(payload: any, signature?: string, credentials?: ProviderCredentials): Promise<StandardTelephonyEvent> {
    let type: StandardTelephonyEvent['type'] = 'unknown';
    const status = payload.status || payload.call_status;

    if (status === 'answered' || status === 'in-progress') type = 'call.answered';
    else if (status === 'completed' || status === 'hangup') type = 'call.hangup';
    else if (status === 'failed' || status === 'busy') type = 'call.failed';

    return {
      type,
      callSid: payload.call_id || payload.uuid || '',
      provider: this.name,
      rawPayload: payload,
    };
  }
}
