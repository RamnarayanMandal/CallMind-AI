import {
  Controller, Post, Body, Logger, Res, Get,
} from '@nestjs/common';
import { Response } from 'express';
import { VobizLiveCallService } from './vobiz-live-call.service';
import { CallService } from '../call/call.service';
import { CallStatus } from '../call/schemas/call.schema';
import { SubscriptionService } from '../subscription/subscription.service';
import { CallStateMachineService, CallState } from './call-state-machine.service';

/**
 * Dedicated Vobiz (PlivoXML) voice controller.
 *
 * Endpoints:
 *   POST /api/v1/telephony/vobiz/answer     ← called when user picks up
 *   POST /api/v1/telephony/vobiz/recording  ← recording URL after user speaks
 *   POST /api/v1/telephony/vobiz/events     ← call lifecycle events
 *   GET  /api/v1/telephony/vobiz/health     ← reachability check
 */
@Controller('telephony/vobiz')
export class VobizCallController {
  private readonly logger = new Logger(VobizCallController.name);

  constructor(
    private readonly liveCallService: VobizLiveCallService,
    private readonly callService: CallService,
    private readonly subscriptionService: SubscriptionService,
    // ── Phase 3: state machine ───────────────────────────────────────────────
    private readonly stateMachineService: CallStateMachineService,
  ) {}

  // ── Health ────────────────────────────────────────────────────────────────
  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'vobiz-webhook', timestamp: new Date().toISOString() };
  }

  // ── CALL ANSWERED ─────────────────────────────────────────────────────────
  @Post('answer')
  async handleAnswer(@Body() body: any, @Res() res: Response) {
    const callUuid = body.CallUUID || body.call_uuid || 'unknown';
    const from     = body.From     || body.from      || '';
    const to       = body.To       || body.to        || '';

    this.logger.log(`[CALL_ANSWERED] CallUUID=${callUuid} From=${from} To=${to}`);
    this.logger.log(`[WEBHOOK_RECEIVED] event=answer payload=${JSON.stringify(body)}`);

    // Phase 3: create state machine early so handleCallAnswered can use it
    this.stateMachineService.create(callUuid);

    try {
      const xml = await this.liveCallService.handleCallAnswered(body);
      this.logger.log(`[XML_RESPONSE_SENT] CallUUID=${callUuid} length=${xml.length}`);
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    } catch (error) {
      this.logger.error(`[ANSWER_ERROR] CallUUID=${callUuid}: ${error.message}`, error.stack);
      const fallbackXml = this.buildHangupXml(
        'Namaste! Abhi ek technical issue hai. Kripya thodi der baad call karein.',
      );
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(fallbackXml);
    }
  }

  // ── RECORDING RECEIVED ────────────────────────────────────────────────────
  @Post('recording')
  async handleRecording(@Body() body: any, @Res() res: Response) {
    const callUuid     = body.CallUUID     || body.call_uuid || 'unknown';
    const recordingUrl = body.RecordUrl    || body.record_url || body.RecordingUrl || body.recording_url || '';
    const duration     = body.RecordingDuration || '?';

    this.logger.log(
      `[RECORDING_RECEIVED] CallUUID=${callUuid} url=${recordingUrl} duration=${duration}s`,
    );

    try {
      if (recordingUrl && callUuid !== 'unknown') {
        try {
          await this.callService.updateRecordingUrl(callUuid, recordingUrl, Number(duration));
          this.logger.log(
            `[RECORDING_SAVED] CallUUID=${callUuid} url=${recordingUrl.substring(0, 60)}...`,
          );
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
      // Phase 4: use service's buildRecordXml via liveCallService — but we need XML here
      // so we keep a minimal local helper only for error recovery
      const retryXml = this.buildRecordXmlFallback(
        'Maafi chahti hoon, main sahi se sun nahi payi. Kripya dobara bolein.',
      );
      res.set('Content-Type', 'application/xml');
      return res.status(200).send(retryXml);
    }
  }

  // ── CALL LIFECYCLE EVENTS ─────────────────────────────────────────────────
  @Post('events')
  async handleEvents(@Body() body: any) {
    const callUuid    = body.CallUUID    || body.call_uuid    || '';
    const event       = body.Event       || body.event        || '';
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
        case 'completed': {
          this.logger.log(`[CALL_DISCONNECTED] callId=${callId} reason=${hangupCause}`);

          // ── Phase 3: abort in-flight LLM + wait for pending tasks ──────────
          const sm = this.stateMachineService.get(callUuid);
          if (sm) {
            sm.abort();                          // fires AbortSignal, sets TERMINATED
            sm.incrementTasks();                 // count finalize as a task

            // Don't await here — let status update proceed immediately
            (async () => {
              try {
                await this.liveCallService.finalizeCall(callUuid, callId);
              } finally {
                sm.decrementTasks();
                await sm.waitForAllTasks();
                this.stateMachineService.delete(callUuid);   // clean up registry
              }
            })();
          } else {
            // No SM (edge case) — still finalize
            await this.liveCallService.finalizeCall(callUuid, callId);
          }

          await this.callService.updateStatus(callId, CallStatus.COMPLETED);

          const hangupRecordingUrl = body.RecordingUrl || body.recording_url || '';
          if (hangupRecordingUrl) {
            await this.callService.updateRecordingUrl(
              callUuid, hangupRecordingUrl,
              Number(body.BillDuration || body.Duration || 0),
            );
          }

          const durationMinutes = Math.ceil(
            Number(body.BillDuration || body.Duration || 0) / 60,
          );
          if (durationMinutes > 0) {
            await this.subscriptionService.incrementMinutesUsed(
              call.organizationId, durationMinutes,
            );
          }
          break;
        }

        case 'failed':
        case 'busy':
        case 'no-answer': {
          this.logger.warn(`[CALL_FAILED] callId=${callId} event=${event} reason=${hangupCause}`);
          // Also abort SM on failure
          const sm = this.stateMachineService.get(callUuid);
          if (sm) {
            sm.abort();
            this.stateMachineService.delete(callUuid);
          }
          await this.callService.updateStatus(callId, CallStatus.FAILED, `${event}: ${hangupCause}`);
          break;
        }

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
    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
      `  <Speak language="hi-IN">${this.escapeXml(message)}</Speak>\n` +
      `</Response>`
    );
  }

  /**
   * Phase 4: Minimal fallback-only record XML — used ONLY in catch blocks.
   * Normal flow always goes through liveCallService.handleRecording()
   * which delegates to the service's own buildRecordXml().
   */
  private buildRecordXmlFallback(speakFirst?: string): string {
    const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
    const speak   = speakFirst
      ? `  <Speak language="hi-IN">${this.escapeXml(speakFirst)}</Speak>\n`
      : '';
    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${speak}` +
      `  <Record action="${baseUrl}/api/v1/telephony/vobiz/recording"` +
      ` maxLength="8" silenceTimeout="1.5" playBeep="false" redirect="true" />\n` +
      `</Response>`
    );
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