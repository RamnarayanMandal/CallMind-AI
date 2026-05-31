import { Controller, Post, Body, Headers, Logger, Param, Req } from '@nestjs/common';
import { CallService } from '../call/call.service';
import { ConfigService } from '@nestjs/config';
import { CallStatus } from '../call/schemas/call.schema';
import { TelephonyProviderFactory } from '@providers/telephony/telephony.factory';

@Controller('telephony')
export class TelephonyWebhookController {
  private readonly logger = new Logger(TelephonyWebhookController.name);

  constructor(
    private readonly callService: CallService,
    private readonly configService: ConfigService,
    private readonly telephonyFactory: TelephonyProviderFactory,
  ) {}

  // Backwards compatible webhook (defaulting to telnyx or twilio if previously used)
  @Post('webhook')
  async handleLegacyWebhook(@Body() body: any, @Headers() headers: any) {
    return this.processProviderWebhook('telnyx', body, headers);
  }

  @Post('webhook/:providerName')
  async handleProviderWebhook(
    @Param('providerName') providerName: string,
    @Body() body: any, 
    @Headers() headers: any
  ) {
    return this.processProviderWebhook(providerName, body, headers);
  }

  private async processProviderWebhook(providerName: string, body: any, headers: any) {
    const provider = this.telephonyFactory.getProvider(providerName);
    
    // Process the webhook to get standardized event
    const event = await provider.processWebhook(body, headers['x-signature']); 

    this.logger.log(`Received ${providerName} webhook: ${event.type} for call ${event.callSid}`);

    if (!event.callSid) return { status: 'ignored' };
    
    const call = await this.callService.findByCallSid(event.callSid);
    
    // Fallback: Check if metadata contains callId (used by legacy telnyx integration)
    let callId = call?._id?.toString();
    if (!callId && body.data?.payload?.client_state) {
      try {
        const metadata = JSON.parse(Buffer.from(body.data.payload.client_state, 'base64').toString());
        callId = metadata.callId;
      } catch (e) {
        // ignore
      }
    }

    if (!callId) {
      this.logger.warn(`No call found for sid: ${event.callSid}`);
      return { status: 'ignored' };
    }

    switch (event.type) {
      case 'call.initiated':
        await this.callService.updateStatus(callId, CallStatus.PENDING);
        break;
      case 'call.answered':
        await this.callService.updateStatus(callId, CallStatus.IN_PROGRESS);
        break;
      case 'call.hangup':
        await this.callService.updateStatus(callId, CallStatus.COMPLETED);
        break;
      case 'call.failed':
        await this.callService.updateStatus(callId, CallStatus.FAILED);
        break;
      case 'call.machine_detected':
        // Machine detection logic
        break;
    }
    return { status: 'success' };
  }
}
