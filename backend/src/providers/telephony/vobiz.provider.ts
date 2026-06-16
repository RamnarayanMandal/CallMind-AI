import { Injectable, Logger } from '@nestjs/common';
import { ITelephonyProvider, CallOptions, CallResult, ProviderCredentials, StandardTelephonyEvent } from './telephony.interface';

// Vobiz API base: https://api.vobiz.ai/api/v1
// Auth: X-Auth-ID + X-Auth-Token headers (NOT Basic auth)
// Docs: https://docs.vobiz.ai

const VOBIZ_BASE = 'https://api.vobiz.ai/api/v1';

@Injectable()
export class VobizProvider implements ITelephonyProvider {
  name = 'vobiz';
  private readonly logger = new Logger(VobizProvider.name);

  /** Build auth headers for every Vobiz request */
  private buildHeaders(accountId: string, authToken: string): Record<string, string> {
    return {
      'X-Auth-ID': accountId,
      'X-Auth-Token': authToken,
      'Content-Type': 'application/json',
    };
  }

  /** Resolve credentials — explicit creds > hardcoded defaults */
  private resolveCredentials(credentials?: ProviderCredentials) {
    const accountId = credentials?.accountId || process.env.VOBIZ_AUTH_ID || 'MA_OUHW1CN9';
    const authToken  = credentials?.authToken  || process.env.VOBIZ_AUTH_TOKEN || 'Qq0wglDvseS3TYNDGuNvEl6O7ZX5Z6W1e0CzTPYbgnTNnyAuxN39WqgXGf0WEwtT';
    const fromNumber = (credentials?.metadata?.fromNumber as string) || process.env.VOBIZ_FROM_NUMBER || '+911171366938';
    return { accountId, authToken, fromNumber };
  }

  /** Normalise a phone number to E.164 format */
  private toE164(number: string): string {
    const cleaned = number.replace(/\s+/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  }

  // ── Initiate Outbound Call ──────────────────────────────────────────────────
  async initiateCall(options: CallOptions, credentials?: ProviderCredentials): Promise<CallResult> {
    const { accountId, authToken, fromNumber } = this.resolveCredentials(credentials);

    const to   = this.toE164(options.to);
    const from = options.from ? this.toE164(options.from) : fromNumber;

    this.logger.log(`Initiating Vobiz call from ${from} to ${to}`);

    // Endpoint: POST /api/v1/Account/{auth_id}/Call/
    const url = `${VOBIZ_BASE}/Account/${accountId}/Call/`;

    // CRITICAL: answer_url must return PlivoXML — use dedicated XML endpoint.
    // hangup_url handles status events only — can return JSON.
    const answerUrl  = `${process.env.BASE_URL || 'https://your-domain.com'}/api/v1/telephony/vobiz/answer`;
    const hangupUrl  = `${process.env.BASE_URL || 'https://your-domain.com'}/api/v1/telephony/vobiz/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(accountId, authToken),
      body: JSON.stringify({
        from,
        to,
        answer_url:    answerUrl,
        answer_method: 'POST',
        hangup_url:    hangupUrl,
        hangup_method: 'POST',
        record:        'true',
        record_direction: 'both'
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Vobiz call failed [${response.status}]: ${errorBody}`);
      throw new Error(`Vobiz API error: ${response.statusText}`);
    }

    const data = await response.json();

    this.logger.log(`Vobiz call initiated successfully: ${data.request_uuid || data.call_uuid}`);

    return {
      callSid: data.request_uuid || data.call_uuid || `vobiz-${Date.now()}`,
      status: 'initiated',
      provider: this.name,
    };
  }

  // ── End / Hangup Call ──────────────────────────────────────────────────────
  async endCall(callSid: string, credentials?: ProviderCredentials): Promise<void> {
    const { accountId, authToken } = this.resolveCredentials(credentials);

    // Endpoint: DELETE /api/v1/Account/{auth_id}/Call/{call_uuid}/
    const url = `${VOBIZ_BASE}/Account/${accountId}/Call/${callSid}/`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.buildHeaders(accountId, authToken),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.warn(`Vobiz endCall failed [${response.status}]: ${errorBody}`);
    }
  }

  // ── Get Call Status ────────────────────────────────────────────────────────
  async getCallStatus(callSid: string, credentials?: ProviderCredentials): Promise<string> {
    const { accountId, authToken } = this.resolveCredentials(credentials);

    // Endpoint: GET /api/v1/Account/{auth_id}/Call/{call_uuid}/
    const url = `${VOBIZ_BASE}/Account/${accountId}/Call/${callSid}/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(accountId, authToken),
    });

    if (response.ok) {
      const data = await response.json();
      return data.call_status || 'unknown';
    }

    this.logger.warn(`Vobiz getCallStatus failed [${response.status}]`);
    return 'unknown';
  }

  // ── Process Incoming Webhook ───────────────────────────────────────────────
  async processWebhook(payload: any, signature?: string, credentials?: ProviderCredentials): Promise<StandardTelephonyEvent> {
    let type: StandardTelephonyEvent['type'] = 'unknown';

    // Vobiz/Plivo-style events
    const eventType = payload.Event || payload.event || payload.CallStatus;

    if      (eventType === 'StartApp'    || eventType === 'in-progress')  type = 'call.answered';
    else if (eventType === 'Hangup'      || eventType === 'completed')    type = 'call.hangup';
    else if (eventType === 'Initiate'    || eventType === 'queued')       type = 'call.initiated';
    else if (eventType === 'failed'      || eventType === 'busy')         type = 'call.failed';
    else if (eventType === 'MachineDetection' && payload.Machine === 'true') type = 'call.machine_detected';

    return {
      type,
      callSid: payload.CallUUID || payload.request_uuid || payload.call_uuid || '',
      provider: this.name,
      rawPayload: payload,
    };
  }
}
