import {
  Controller, Post, Body, Headers, Param,
  Logger, Res, Get,
} from '@nestjs/common';
import { Response } from 'express';
import { VobizLiveCallService } from './vobiz-live-call.service';
import { CallService } from '../call/call.service';
import { CallStatus } from '../call/schemas/call.schema';
import { SubscriptionService } from '../subscription/subscription.service';

/**
 * Dedicated Vobiz (PlivoXML) voice controller.
 *
 * Vobiz is Plivo-compatible — every "answer" response MUST return
 * PlivoXML (Content-Type: application/xml), NOT JSON.
 *
 * Endpoints:
 *   POST /api/v1/telephony/vobiz/answer     ← called when user picks up
 *   POST /api/v1/telephony/vobiz/recording  ← called with recording URL after user speaks
 *   POST /api/v1/telephony/vobiz/events     ← call lifecycle events (hangup, etc.)
 *   GET  /api/v1/telephony/vobiz/health     ← reachability check
 */
@Controller('telephony/vobiz')
export class VobizCallController {
  private readonly logger = new Logger(VobizCallController.name);

  constructor(
    private readonly liveCallService: VobizLiveCallService,
    private readonly callService: CallService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ── Health check (reachability verification) ──────────────────────────────
  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'vobiz-webhook', timestamp: new Date().toISOString() };
  }

  // ── CALL ANSWERED — Vobiz hits this when user picks up ───────────────────
  // Must return PlivoXML. If we return anything else, Vobiz hangs up.
  @Post('answer')
  async handleAnswer(@Body() body: any, @Res() res: Response) {
    const callUuid = body.CallUUID || body.call_uuid || 'unknown';
    const from     = body.From     || body.from     || '';
    const to       = body.To       || body.to       || '';

    this.logger.log(`[CALL_ANSWERED] CallUUID=${callUuid} From=${from} To=${to}`);
    this.logger.log(`[WEBHOOK_RECEIVED] event=answer payload=${JSON.stringify(body)}`);

    try {
      const xml = await this.liveCallService.handleCallAnswered(body);
      this.logger.log(`[XML_RESPONSE_SENT] CallUUID=${callUuid} length=${xml.length}`);
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    } catch (error) {
      this.logger.error(`[ANSWER_ERROR] CallUUID=${callUuid}: ${error.message}`, error.stack);
      // Even on error — return valid XML to keep the call alive briefly
      const fallbackXml = this.buildHangupXml('Namaste! Abhi ek technical issue hai. Kripya thodi der baad call karein.');
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(fallbackXml);
    }
  }

  // ── RECORDING RECEIVED — user just finished speaking ─────────────────────
  // Vobiz posts the recording URL here. We: STT → LLM → TTS → PlivoXML loop.
  @Post('recording')
  async handleRecording(@Body() body: any, @Res() res: Response) {
    const callUuid      = body.CallUUID      || body.call_uuid || 'unknown';
    const recordingUrl  = body.RecordUrl  || body.record_url || body.RecordingUrl || body.recording_url || '';
    const duration      = body.RecordingDuration || '?';

    this.logger.log(`[RECORDING_RECEIVED] CallUUID=${callUuid} url=${recordingUrl} duration=${duration}s`);

    try {
      // Save recording URL to Call document
      if (recordingUrl && callUuid !== 'unknown') {
        try {
          await this.callService.updateRecordingUrl(callUuid, recordingUrl, Number(duration));
          this.logger.log(`[RECORDING_SAVED] CallUUID=${callUuid} url=${recordingUrl.substring(0, 60)}...`);
        } catch (saveErr) {
          this.logger.warn(`[RECORDING_SAVE_ERROR] Could not save recording URL: ${saveErr.message}`);
        }
      }

      const xml = await this.liveCallService.handleRecording(body);
      this.logger.log(`[AUDIO_STREAM_STARTED] CallUUID=${callUuid} — playing AI response`);
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    } catch (error) {
      this.logger.error(`[RECORDING_ERROR] CallUUID=${callUuid}: ${error.message}`, error.stack);
      // Keep call alive with a graceful retry message
      const retryXml = this.buildRecordXml('Maafi chahti hoon, main sahi se sun nahi payi. Kripya dobara bolein.');
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(retryXml);
    }
  }

  // ── CALL LIFECYCLE EVENTS — hangup, failed, etc. ─────────────────────────
  @Post('events')
  async handleEvents(@Body() body: any) {
    const callUuid   = body.CallUUID || body.call_uuid || '';
    const event      = body.Event    || body.event     || '';
    const hangupCause = body.HangupCause || body.hangup_cause || '';

    this.logger.log(`[CALL_EVENT] type=${event} CallUUID=${callUuid} hangupCause=${hangupCause}`);
    this.logger.log(`[WEBHOOK_RECEIVED] event=${event} payload=${JSON.stringify(body)}`);

    if (!callUuid) return { status: 'ignored' };

    try {
      const call = await this.callService.findByCallSid(callUuid);
      if (!call) {
        this.logger.warn(`[CALL_EVENT] No call found for sid=${callUuid}`);
        return { status: 'ignored' };
      }

      const callId = call._id.toString();

      switch (event) {
        case 'Initiate':
        case 'queued':
          this.logger.log(`[CALL_INITIATED] callId=${callId}`);
          await this.callService.updateStatus(callId, CallStatus.PENDING);
          break;

        case 'StartApp':
        case 'in-progress':
        case 'answered':
          this.logger.log(`[CALL_CONNECTED] callId=${callId}`);
          await this.callService.updateStatus(callId, CallStatus.IN_PROGRESS);
          break;

        case 'Hangup':
        case 'completed':
          this.logger.log(`[CALL_DISCONNECTED] callId=${callId} reason=${hangupCause}`);
          await this.callService.updateStatus(callId, CallStatus.COMPLETED);
          // Save recording URL from hangup payload if present
          const hangupRecordingUrl = body.RecordingUrl || body.recording_url || '';
          if (hangupRecordingUrl) {
            await this.callService.updateRecordingUrl(callUuid, hangupRecordingUrl, Number(body.BillDuration || body.Duration || 0));
          }
          // Increment subscription minutes used
          const durationMinutes = Math.ceil((Number(body.BillDuration || body.Duration || 0)) / 60);
          if (durationMinutes > 0) {
            await this.subscriptionService.incrementMinutesUsed(call.organizationId, durationMinutes);
          }
          await this.liveCallService.finalizeCall(callUuid, callId);
          break;

        case 'failed':
        case 'busy':
        case 'no-answer':
          this.logger.warn(`[CALL_FAILED] callId=${callId} event=${event} reason=${hangupCause}`);
          await this.callService.updateStatus(callId, CallStatus.FAILED, `${event}: ${hangupCause}`);
          break;

        default:
          this.logger.debug(`[CALL_EVENT_UNHANDLED] event=${event} callId=${callId}`);
      }
    } catch (err) {
      this.logger.error(`[CALL_EVENT_ERROR] ${err.message}`);
    }

    return { status: 'ok' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildHangupXml(message: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Speak language="hi-IN">${this.escapeXml(message)}</Speak>\n</Response>`;
  }

  private buildRecordXml(speakFirst?: string): string {
    const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
    const speak = speakFirst
      ? `  <Speak language="hi-IN">${this.escapeXml(speakFirst)}</Speak>\n`
      : '';
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${speak}  <Record action="${baseUrl}/api/v1/telephony/vobiz/recording" maxLength="15" playBeep="false" redirect="true" />\n</Response>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
