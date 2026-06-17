import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhisperService } from '../ai/whisper.service';
import { SarvamService } from '../ai/sarvam.service';
import { TtsService } from '../ai/tts.service';
import { ConversationMemoryService } from '../conversation/conversation-memory.service';
import { ConversationService } from '../conversation/conversation.service';
import { AgentService } from '../agent/agent.service';
import { OrganizationService } from '../organization/organization.service';
import { RedisService } from '../redis/redis.service';
import { OrgContextCacheService } from '../redis/org-context-cache.service';
import { CallService } from '../call/call.service';
import { CallStateMachine, CallState, CallStateMachineService } from './call-state-machine.service';
import { FillerDetectorService } from './filler-detector.service';
import { isFallbackResponse } from '../../constants';

@Injectable()
export class VobizLiveCallService {
  private readonly logger  = new Logger(VobizLiveCallService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly whisperService: WhisperService,
    private readonly sarvamService: SarvamService,
    private readonly ttsService: TtsService,
    private readonly conversationMemory: ConversationMemoryService,
    private readonly conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly organizationService: OrganizationService,
    private readonly callService: CallService,
    private readonly redisService: RedisService,
    private readonly orgCacheService: OrgContextCacheService,
    private readonly configService: ConfigService,
    // ── Phase 3: new deps ───────────────────────────────────────────────────
    private readonly stateMachineService: CallStateMachineService,
    private readonly fillerDetector: FillerDetectorService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'https://your-domain.com';
  }

  // ── CALL ANSWERED ─────────────────────────────────────────────────────────
  async handleCallAnswered(body: any): Promise<string> {
    const callUuid   = body.CallUUID || body.call_uuid || '';
    const sessionKey = `live_call:${callUuid}`;
    const startTime  = Date.now();

    this.logger.log(`[AI_SESSION_STARTED] callId=${callUuid} timestamp=${new Date().toISOString()}`);

    // Phase 3: create + transition state machine
    const sm = this.stateMachineService.getOrCreate(callUuid);
    sm.transition(CallState.LISTENING);

    let agentContext: any = {};
    let orgContext: any   = {};
    let systemPrompt      = 'You are a helpful voice assistant. Speak naturally and concisely in Hindi/Hinglish.';
    let introText         = 'Namaste! Main aapki kaise madad kar sakti hoon?';

    try {
      const call = await this.callService.findByCallSid(callUuid);
      if (call) {
        try {
          await this.conversationService.startConversation(
            call._id.toString(),
            call.organizationId.toString(),
          );
          this.logger.log(`[CONVERSATION_STARTED] Created MongoDB conversation record for callId=${call._id}`);
        } catch (convErr) {
          this.logger.error(`[CONVERSATION_START_ERROR] Failed to start conversation: ${convErr.message}`);
        }

        if (call.agentId) {
          const agentId          = call.agentId.toString();
          const contextLoadStart = Date.now();
          const cachedProfile    = await this.orgCacheService.getCachedProfileByAgentId(agentId);
          this.logger.log(`[LATENCY] Context loaded in ${Date.now() - contextLoadStart}ms`);

          if (cachedProfile) {
            agentContext = cachedProfile.agentContext;
            orgContext   = cachedProfile.orgContext;
            systemPrompt = cachedProfile.systemPrompt;
            this.logger.log(`[AI_SESSION_STARTED] agent=${agentContext?.name} org=${orgContext?.name}`);
            introText = this.sarvamService.generateIntroFromTemplate(agentContext, orgContext);
            this.logger.log(`[GREETING_GENERATED] intro="${introText.substring(0, 80)}" (0ms - template)`);
          } else {
            this.logger.log(`[CACHE_MISS] Loading agent ${agentId} from MongoDB`);
            try {
              const agent = await this.agentService.findOne(agentId);
              if (agent) {
                agentContext = agent;
                let org: any = {};
                if (agent.organizationId) {
                  org = await this.organizationService.findById(agent.organizationId);
                }
                orgContext = org;

                const profile = await this.orgCacheService.buildAndCacheProfile(
                  agentContext.organizationId || 'default',
                  agentId,
                  orgContext,
                  agentContext,
                );
                systemPrompt = profile.systemPrompt;
                this.logger.log(`[AI_SESSION_STARTED] agent=${agentContext?.name} (loaded from DB)`);
                introText = this.sarvamService.generateIntroFromTemplate(agentContext, orgContext);
                this.logger.log(`[GREETING_GENERATED] intro="${introText.substring(0, 80)}" (0ms - template)`);
              }
            } catch (err) {
              this.logger.warn(`[AGENT_LOAD_ERROR] Failed to load agent ${agentId}: ${err.message}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`[SESSION_LOAD_ERROR] ${err.message} — using defaults`);
    }

    await this.redisService.set(
      sessionKey,
      { callUuid, systemPrompt, agentContext, orgContext, greetingText: introText },
      3600,
    );

    await this.conversationMemory.clearMemory(callUuid);

    const totalLatency = Date.now() - startTime;
    this.logger.log(`[LATENCY] Call answered → XML ready: ${totalLatency}ms`);
    this.logger.log(`[XML_RESPONSE_SENT] <Speak> + <Record> response (recording-based conversation)`);
    this.logger.log(`[GREETING_IN_XML] text="${introText.substring(0, 80)}" — played by Plivo via <Speak>`);

    return this.buildRecordXml(introText);
  }

  // ── RECORDING RECEIVED — STT → filler check → LLM → next Record ──────────
  async handleRecording(body: any): Promise<string> {
    const callUuid     = body.CallUUID     || body.call_uuid     || '';
    const recordingUrl = body.RecordUrl || body.record_url || body.RecordingUrl || body.recording_url || '';
    const duration     = parseFloat(body.RecordingDuration || body.recording_duration || '0');
    const sessionKey   = `live_call:${callUuid}`;

    // ── Phase 3: guard — is call still alive? ────────────────────────────────
    const sm = this.stateMachineService.get(callUuid);
    if (!sm) {
      this.logger.warn(`[SM_MISSING] No state machine for ${callUuid} — call may have ended`);
      return this.buildRecordXml();
    }

    try {
      sm.ensureAlive();
    } catch {
      this.logger.warn(`[SM_TERMINATED] Recording arrived after hangup for ${callUuid} — discarding`);
      return this.buildRecordXml();
    }

    // ── Skip very short recordings ────────────────────────────────────────────
    if (duration < 0.5) {
      this.logger.warn(`[STT_SKIPPED] callId=${callUuid} duration=${duration}s — too short, re-recording`);
      sm.transition(CallState.LISTENING);
      return this.buildRecordXml();
    }

    // ── Transition: LISTENING → PROCESSING ───────────────────────────────────
    try {
      sm.transition(CallState.PROCESSING);
    } catch (err) {
      this.logger.warn(`[SM_TRANSITION_FAILED] ${err.message} — skipping turn`);
      return this.buildRecordXml();
    }

    const session      = await this.redisService.get<any>(sessionKey);
    const orgContext   = session?.orgContext   || {};
    const systemPrompt = session?.systemPrompt || 'You are a helpful voice assistant.';
    const agentContext = session?.agentContext || {};
    const language     = agentContext?.language || 'hi-IN';

    const turnStart = Date.now();
    this.logger.log(`[STT_STARTED] callId=${callUuid} url=${recordingUrl}`);

    // ── 1. Download audio ─────────────────────────────────────────────────────
    let audioBuffer: Buffer;
    try {
      audioBuffer = await this.downloadAudio(recordingUrl, orgContext);
      this.logger.log(
        `[STT_AUDIO_FETCHED] callId=${callUuid} size=${audioBuffer.length} bytes download=${Date.now() - turnStart}ms`,
      );
    } catch (err) {
      this.logger.error(`[STT_DOWNLOAD_ERROR] ${err.message}`);
      sm.transition(CallState.LISTENING);
      return this.buildRecordXml('Maafi chahti hoon, audio nahi mila. Kripya dobara bolein.');
    }

    // ── 2. STT ────────────────────────────────────────────────────────────────
    const sttStart = Date.now();
    let userText   = '';
    try {
      userText = await this.whisperService.transcribeAudio(audioBuffer);
      this.logger.log(
        `[STT_COMPLETED] callId=${callUuid} transcript="${userText}" stt=${Date.now() - sttStart}ms`,
      );
    } catch (err) {
      this.logger.error(`[STT_ERROR] ${err.message}`);
      sm.transition(CallState.LISTENING);
      return this.buildRecordXml('Maafi chahti hoon, main sun nahi payi. Kripya dobara bolein.');
    }

    // ── 3. Empty transcript guard ─────────────────────────────────────────────
    if (!userText || userText.trim().length < 2) {
      this.logger.warn(`[STT_EMPTY] callId=${callUuid} — no speech detected`);
      sm.transition(CallState.LISTENING);
      return this.buildRecordXml('Kya aapne kuch kaha? Main sun rahi hoon.');
    }

    // ── 4. Phase 3: Filler / backchannel guard ────────────────────────────────
    if (this.fillerDetector.isFiller(userText)) {
      this.logger.log(`[FILLER_DETECTED] callId=${callUuid} transcript="${userText}" — short-circuit`);
      const backchannelText = this.fillerDetector.getBackchannelResponse(language);
      sm.transition(CallState.SPEAKING);
      sm.transition(CallState.LISTENING);
      return this.buildRecordXml(backchannelText);
    }

    // ── 5. Check alive before LLM ─────────────────────────────────────────────
    try {
      sm.ensureAlive();
    } catch {
      this.logger.warn(`[SM_TERMINATED] Call hung up before LLM for ${callUuid}`);
      return this.buildRecordXml();
    }

    // ── 6. Load conversation memory ───────────────────────────────────────────
    const priorHistory = await this.conversationMemory.getConversationMemory(callUuid);

    // ── 7. LLM — pass abort signal ────────────────────────────────────────────
    const llmStart = Date.now();
    this.logger.log(`[LLM_STARTED] callId=${callUuid} historyTurns=${priorHistory.length}`);
    let aiText = '';
    try {
      aiText = await this.sarvamService.generateTurnResponse(
        userText,
        systemPrompt,
        priorHistory,
        agentContext,
        orgContext,
        undefined,   // ragContext
        undefined,   // turnGuide
        sm.signal,   // ← Phase 2: abort signal
      );
      this.logger.log(
        `[LLM_RESPONSE] callId=${callUuid} text="${aiText.substring(0, 80)}" llm=${Date.now() - llmStart}ms`,
      );
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        this.logger.log(`[LLM_ABORTED] callId=${callUuid} — call ended during LLM`);
        return this.buildRecordXml();
      }
      this.logger.error(`[LLM_ERROR] ${err.message}`);
      aiText = 'Ji zaroor, main samajh gayi. Kya aap thoda aur bata sakte hain?';
    }

    // ── 8. Empty AI response fallback ─────────────────────────────────────────
    if (!aiText || aiText.trim().length < 2) {
      this.logger.warn(`[LLM_EMPTY] callId=${callUuid} — AI returned empty response, using fallback`);
      aiText =
        language === 'hi-IN' || language === 'hinglish'
          ? 'Ji, aap jo bol rahe the woh main samajh gayi. Kya aur kuch batana chahenge?'
          : 'I understand. Could you please elaborate a bit more?';
    }

    // ── 9. Save turn to memory (skip if fallback — prevents generic echo loop) ──
    if (isFallbackResponse(aiText)) {
      this.logger.log(
        `[MEMORY_SKIP] callId=${callUuid} reason="fallback_response" ` +
        `text="${aiText.substring(0, 60)}"`,
      );
    } else {
      await this.conversationMemory.appendMessages(callUuid, [
        { role: 'user',      content: userText },
        { role: 'assistant', content: aiText   },
      ]);
      this.logger.log(
        `[MEMORY_WRITE] callId=${callUuid} userLen=${userText.length} ` +
        `aiLen=${aiText.length} totalTurns=${priorHistory.length / 2 + 1}`,
      );
    }

    // ── 10. Transition: PROCESSING → SPEAKING → LISTENING ────────────────────
    sm.transition(CallState.SPEAKING);
    sm.transition(CallState.LISTENING);

    const totalTurn = Date.now() - turnStart;
    this.logger.log(`[TURN_COMPLETED] callId=${callUuid} total=${totalTurn}ms`);

    return this.buildRecordXml(aiText);
  }

  // ── CALL FINALIZATION ──────────────────────────────────────────────────────
  async finalizeCall(callUuid: string, callId: string): Promise<void> {
    this.logger.log(`[CALL_DISCONNECTED] callId=${callId} callUuid=${callUuid}`);
    try {
      const history    = await this.conversationMemory.getConversationMemory(callUuid);
      const transcript = history.map(msg => ({
        role:      msg.role === 'user' ? 'customer' as const : 'agent' as const,
        content:   msg.content,
        timestamp: new Date(),
      }));

      const sessionKey = `live_call:${callUuid}`;
      const session    = await this.redisService.get<any>(sessionKey);

      let avgStt = 0, avgLlm = 0, avgTts = 0, avgTotal = 0;
      if (session?.latencies?.length > 0) {
        const count = session.latencies.length;
        let sumStt = 0, sumLlm = 0, sumTts = 0, sumTotal = 0;
        for (const l of session.latencies) {
          sumStt   += l.stt   || 0;
          sumLlm   += l.llm   || 0;
          sumTts   += l.tts   || 0;
          sumTotal += l.total || 0;
        }
        avgStt   = Math.round(sumStt   / count);
        avgLlm   = Math.round(sumLlm   / count);
        avgTts   = Math.round(sumTts   / count);
        avgTotal = Math.round(sumTotal / count);
      }

      this.logger.log(`[CONVERSATION_SAVING] Saving ${transcript.length} turns to MongoDB for callId=${callId}`);
      await this.conversationService.saveTranscriptAndMetrics(callId, transcript, {
        avgStt, avgLlm, avgTts, avgTotal,
      });

      this.logger.log(`[CONVERSATION_FINALIZING] Triggering sales analysis for callId=${callId}`);
      await this.conversationService.finalizeConversation(callId);

      await this.conversationMemory.clearMemory(callUuid);
      await this.redisService.del(sessionKey);
      this.logger.log(`[SESSION_CLEANED] callId=${callId}`);
    } catch (err) {
      this.logger.warn(`[FINALIZE_ERROR] ${err.message}`);
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  private async downloadAudio(url: string, orgContext?: any): Promise<Buffer> {
    const accountId = orgContext?.telephonyAccountId || process.env.VOBIZ_AUTH_ID   || 'MA_OUHW1CN9';
    const authToken = orgContext?.telephonyAuthToken || process.env.VOBIZ_AUTH_TOKEN || '';

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 6000,
      headers: {
        'User-Agent':   'CallMind-AI/1.0',
        'X-Auth-ID':    accountId,
        'X-Auth-Token': authToken,
      },
    });
    return Buffer.from(response.data);
  }

  private buildRecordXml(speakText?: string): string {
    const recordUrl = `${this.baseUrl}/api/v1/telephony/vobiz/recording`;
    const speak     = speakText
      ? `  <Speak language="hi-IN">${this.escapeXml(speakText)}</Speak>\n`
      : '';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      speak,
      `  <Record`,
      `    action="${recordUrl}"`,
      `    method="POST"`,
      `    maxLength="8"`,
      `    silenceTimeout="1.5"`,
      `    playBeep="false"`,
      `    redirect="true"`,
      `    recordSession="false"`,
      `  />`,
      '</Response>',
    ].join('\n');
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