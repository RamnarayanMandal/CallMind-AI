import { Controller, Post, Body, Headers, Logger, Req } from '@nestjs/common';
import { CallService } from '../call/call.service';
import { ConfigService } from '@nestjs/config';
import { CallStatus } from '../call/schemas/call.schema';

@Controller('telephony')
export class TelephonyWebhookController {
  private readonly logger = new Logger(TelephonyWebhookController.name);

  constructor(
    private readonly callService: CallService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;
    const clientState = body.data?.payload?.client_state;

    this.logger.log(`Received Telnyx webhook: ${eventType} for call ${callControlId}`);

    if (!callControlId) return { status: 'ignored' };

    // Decode metadata from client_state
    let metadata: any = {};
    if (clientState) {
      try {
        metadata = JSON.parse(Buffer.from(clientState, 'base64').toString());
      } catch (e) {
        this.logger.error(`Failed to decode client_state: ${e.message}`);
      }
    }

    const callId = metadata.callId;

    switch (eventType) {
      case 'call.initiated':
        this.logger.log(`Call initiated: ${callControlId}`);
        if (callId) await this.callService.updateStatus(callId, CallStatus.PENDING);
        break;

      case 'call.answered':
        this.logger.log(`Call answered: ${callControlId}`);
        if (callId) await this.callService.updateStatus(callId, CallStatus.IN_PROGRESS);
        break;

      case 'call.hangup':
        this.logger.log(`Call hangup: ${callControlId}`);
        if (callId) await this.callService.updateStatus(callId, CallStatus.COMPLETED);
        break;

      case 'call.machine.detection.ended':
        const result = body.data.payload.analysis;
        this.logger.log(`Machine detection ended: ${result} for ${callControlId}`);
        if (result === 'machine' && callId) {
            // Handle voicemail detection if needed
        }
        break;

      case 'call.failed':
        this.logger.error(`Call failed: ${callControlId}`);
        if (callId) await this.callService.updateStatus(callId, CallStatus.FAILED, body.data.payload.failure_reason);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${eventType}`);
    }

    return { status: 'success' };
  }
}
