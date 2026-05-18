import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITelephonyProvider, CallOptions, CallResult } from './telephony.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Telnyx = require('telnyx');

@Injectable()
export class TelnyxTelephonyProvider implements ITelephonyProvider {
  private readonly client: any;
  private readonly logger = new Logger(TelnyxTelephonyProvider.name);
  private readonly fromNumber: string;
  private readonly connectionId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('telephony.telnyx.apiKey');
    this.fromNumber = this.configService.get<string>('telephony.telnyx.phoneNumber');
    this.connectionId = this.configService.get<string>('telephony.telnyx.connectionId');
    
    this.client = Telnyx(apiKey);
  }

  async initiateCall(options: CallOptions): Promise<CallResult> {
    try {
      let to = options.to;
      
      // Basic E.164 formatting
      if (to.length === 10) {
        to = `+91${to}`;
      } else if (!to.startsWith('+')) {
        to = `+${to}`;
      }

      this.logger.log(`Initiating Telnyx call to ${to} from ${this.fromNumber}`);
      
      const baseUrl = this.configService.get<string>('BASE_URL');
      const webhookUrl = `${baseUrl}/api/v1/telephony/webhook`;
      this.logger.debug(`Using webhook URL: ${webhookUrl}`);

      const response = await this.client.calls.dial({
        to,
        from: this.fromNumber,
        connection_id: this.connectionId,
        webhook_url: webhookUrl,
        webhook_url_method: 'POST',
        // Store metadata in client_state (base64 encoded)
        client_state: Buffer.from(JSON.stringify(options.metadata || {})).toString('base64'),
      });

      const call = response.data;
      this.logger.log(`Telnyx call created successfully. Call Control ID: ${call.call_control_id}, Status: ${call.state}`);

      return {
        callSid: call.call_control_id,
        status: call.state || 'initiated',
        provider: 'telnyx',
      };
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.raw && error.raw.errors && error.raw.errors.length > 0) {
        const detail = error.raw.errors[0].detail;
        if (detail) {
          errorMessage = detail;
        }
        this.logger.error(`Telnyx Errors: ${JSON.stringify(error.raw.errors)}`);
      }
      
      this.logger.error(`Telnyx call failed: ${errorMessage}`);
      this.logger.debug(error.stack);
      
      // Create a clean error object for the service to catch
      const cleanError = new Error(errorMessage);
      (cleanError as any).raw = error.raw;
      throw cleanError;
    }
  }

  async endCall(callSid: string): Promise<void> {
    try {
      await this.client.calls.actions.hangup(callSid);
    } catch (error) {
      this.logger.error(`Failed to end Telnyx call ${callSid}: ${error.message}`);
    }
  }

  async getCallStatus(callSid: string): Promise<string> {
    try {
      const response = await this.client.calls.retrieveStatus(callSid);
      return response.data.state;
    } catch (error) {
      this.logger.error(`Failed to get Telnyx call status ${callSid}: ${error.message}`);
      return 'unknown';
    }
  }
}
