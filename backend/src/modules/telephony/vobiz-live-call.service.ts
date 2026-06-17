import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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

/**
 * VobizLiveCallService — The AI pipeline bridge for live Vobiz telephone calls.
 *
 * Flow:
 *   handleCallAnswered() → Generate greeting → Return PlivoXML <Speak> + <Record>
 *   handleRecording()    → STT → LLM → TTS → Return PlivoXML <Speak> + <Record>
 *   finalizeCall()       → Save conversation summary
 */
@Injectable()
export class VobizLiveCallService {
  private readonly logger = new Logger(VobizLiveCallService.name);
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
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'https://your-domain.com';
  }

  // ── CALL ANSWERED — Build greeting + record instruction ────────────────────
  async handleCallAnswered(body: any): Promise<string> {
    const callUuid = body.CallUUID || body.call_uuid || '';
    const sessionKey = `live_call:${callUuid}`;
    const startTime = Date.now();

    this.logger.log(`[AI_SESSION_STARTED] callId=${callUuid} timestamp=${new Date().toISOString()}`);

    // 1. Load call record to get agent info
    let agentContext: any = {};
    let orgContext: any   = {};
    let systemPrompt      = 'You are a helpful voice assistant. Speak naturally and concisely in Hindi/Hinglish.';
    let introText         = 'Namaste! Main aapki kaise madad kar sakti hoon?';

    try {
      const call = await this.callService.findByCallSid(callUuid);
      if (call) {
        // Initialize conversation record in MongoDB
        try {
          await this.conversationService.startConversation(call._id.toString(), call.organizationId.toString());
          this.logger.log(`[CONVERSATION_STARTED] Created MongoDB conversation record for callId=${call._id}`);
        } catch (convErr) {
          this.logger.error(`[CONVERSATION_START_ERROR] Failed to start conversation: ${convErr.message}`);
        }

        if (call.agentId) {
          const agentId = call.agentId.toString();
          const contextLoadStart = Date.now();
          const cachedProfile = await this.orgCacheService.getCachedProfileByAgentId(agentId);
          this.logger.log(`[LATENCY] Context loaded in ${Date.now() - contextLoadStart}ms`);

          if (cachedProfile) {
            agentContext = cachedProfile.agentContext;
            orgContext   = cachedProfile.orgContext;
            systemPrompt = cachedProfile.systemPrompt;

            this.logger.log(`[AI_SESSION_STARTED] agent=${agentContext?.name} org=${orgContext?.name}`);

            // Generate greeting from template (instant, no LLM call)
            introText = this.sarvamService.generateIntroFromTemplate(agentContext, orgContext);
            this.logger.log(`[GREETING_GENERATED] intro="${introText.substring(0, 80)}" (0ms - template)`);
          } else {
            // Cache miss — load agent from MongoDB and build profile
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

                // Generate greeting from template (instant, no LLM call)
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

    // 2. Initialize session in Redis (store greeting text for WebSocket to send)
    await this.redisService.set(sessionKey, {
      callUuid,
      systemPrompt,
      agentContext,
      orgContext,
      greetingText: introText,
    }, 3600);

    // 3. Clear old memory for this call
    await this.conversationMemory.clearMemory(callUuid);

    // 4. Log total latency
    const totalLatency = Date.now() - startTime;
    this.logger.log(`[LATENCY] Call answered → XML ready: ${totalLatency}ms`);
    this.logger.log(`[XML_RESPONSE_SENT] <Speak> + <Record> response (recording-based conversation)`);
    this.logger.log(`[GREETING_IN_XML] text="${introText.substring(0, 80)}" — played by Plivo via <Speak>`);
    return this.buildRecordXml(introText);
  }

  // ── RECORDING RECEIVED — STT → LLM → TTS → next Record ────────────────────
  async handleRecording(body: any): Promise<string> {
    const callUuid     = body.CallUUID     || body.call_uuid     || '';
    const recordingUrl = body.RecordUrl || body.record_url || body.RecordingUrl || body.recording_url || '';
    const duration     = parseFloat(body.RecordingDuration || body.recording_duration || '0');
    const sessionKey   = `live_call:${callUuid}`;

    // Skip very short recordings (silence / false trigger)
    if (duration < 0.5) {
      this.logger.warn(`[STT_SKIPPED] callId=${callUuid} duration=${duration}s — too short, re-recording`);
      return this.buildRecordXml();
    }

    // 1. Download recording
    // Need org context for auth headers
    const session = await this.redisService.get<any>(sessionKey);
    const orgContext = session?.orgContext || {};
    const systemPrompt  = session?.systemPrompt  || 'You are a helpful voice assistant.';
    const agentContext  = session?.agentContext  || {};

    const turnStart = Date.now();
    this.logger.log(`[STT_STARTED] callId=${callUuid} url=${recordingUrl}`);
    let audioBuffer: Buffer;
    try {
      audioBuffer = await this.downloadAudio(recordingUrl, orgContext);
      this.logger.log(`[STT_AUDIO_FETCHED] callId=${callUuid} size=${audioBuffer.length} bytes download=${Date.now()-turnStart}ms`);
    } catch (err) {
      this.logger.error(`[STT_DOWNLOAD_ERROR] ${err.message}`);
      return this.buildRecordXml('Maafi chahti hoon, audio nahi mila. Kripya dobara bolein.');
    }

    // 2. Speech-to-Text
    const sttStart = Date.now();
    let userText = '';
    try {
      userText = await this.whisperService.transcribeAudio(audioBuffer);
      this.logger.log(`[STT_COMPLETED] callId=${callUuid} transcript="${userText}" stt=${Date.now()-sttStart}ms`);
    } catch (err) {
      this.logger.error(`[STT_ERROR] ${err.message}`);
      return this.buildRecordXml('Maafi chahti hoon, main sun nahi payi. Kripya dobara bolein.');
    }

    if (!userText || userText.trim().length < 2) {
      this.logger.warn(`[STT_EMPTY] callId=${callUuid} — no speech detected`);
      return this.buildRecordXml('Kya aapne kuch kaha? Main sun rahi hoon.');
    }

    // 3. Load session context (Already loaded above)
    // 4. Load conversation memory
    const priorHistory = await this.conversationMemory.getConversationMemory(callUuid);

    // 5. LLM response
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
      );
      this.logger.log(`[LLM_RESPONSE] callId=${callUuid} text="${aiText.substring(0, 80)}" llm=${Date.now()-llmStart}ms`);
    } catch (err) {
      this.logger.error(`[LLM_ERROR] ${err.message}`);
      aiText = 'Ji zaroor, main samajh gayi. Kya aap thoda aur bata sakte hain?';
    }

    // 6. Save turn to memory
    await this.conversationMemory.appendMessages(callUuid, [
      { role: 'user',      content: userText },
      { role: 'assistant', content: aiText   },
    ]);

    // 7. Return PlivoXML: Speak AI response + record next turn
    const totalTurn = Date.now() - turnStart;
    this.logger.log(`[TURN_COMPLETED] callId=${callUuid} total=${totalTurn}ms`);
    return this.buildRecordXml(aiText);
  }

  // ── CALL FINALIZATION ──────────────────────────────────────────────────────
  async finalizeCall(callUuid: string, callId: string): Promise<void> {
    this.logger.log(`[CALL_DISCONNECTED] callId=${callId} callUuid=${callUuid}`);
    try {
      // 1. Fetch transcript from Redis memory
      const history = await this.conversationMemory.getConversationMemory(callUuid);
      const transcript = history.map(msg => ({
        role: msg.role === 'user' ? 'customer' as const : 'agent' as const,
        content: msg.content,
        timestamp: new Date()
      }));

      // 2. Fetch latencies from Redis session
      const sessionKey = `live_call:${callUuid}`;
      const session = await this.redisService.get<any>(sessionKey);
      
      let avgStt = 0;
      let avgLlm = 0;
      let avgTts = 0;
      let avgTotal = 0;

      if (session?.latencies && session.latencies.length > 0) {
        const count = session.latencies.length;
        let sumStt = 0, sumLlm = 0, sumTts = 0, sumTotal = 0;
        for (const l of session.latencies) {
          sumStt += l.stt || 0;
          sumLlm += l.llm || 0;
          sumTts += l.tts || 0;
          sumTotal += l.total || 0;
        }
        avgStt = Math.round(sumStt / count);
        avgLlm = Math.round(sumLlm / count);
        avgTts = Math.round(sumTts / count);
        avgTotal = Math.round(sumTotal / count);
      }

      // 3. Save transcript & average turn latencies in MongoDB
      this.logger.log(`[CONVERSATION_SAVING] Saving ${transcript.length} turns to MongoDB for callId=${callId}`);
      await this.conversationService.saveTranscriptAndMetrics(callId, transcript, {
        avgStt,
        avgLlm,
        avgTts,
        avgTotal
      });

      // 4. Summarize and classify outcome using LLM
      this.logger.log(`[CONVERSATION_FINALIZING] Triggering sales analysis for callId=${callId}`);
      await this.conversationService.finalizeConversation(callId);

      // 5. Clean up memory and session
      await this.conversationMemory.clearMemory(callUuid);
      await this.redisService.del(sessionKey);
      this.logger.log(`[SESSION_CLEANED] callId=${callId}`);
    } catch (err) {
      this.logger.warn(`[FINALIZE_ERROR] ${err.message}`);
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  /**
   * Download audio from a URL and return as Buffer.
   * Vobiz recording URLs are temporary and expire, so we fetch immediately.
   */
  private async downloadAudio(url: string, orgContext?: any): Promise<Buffer> {
    const accountId = orgContext?.telephonyAccountId || process.env.VOBIZ_AUTH_ID || 'MA_OUHW1CN9';
    const authToken = orgContext?.telephonyAuthToken || process.env.VOBIZ_AUTH_TOKEN || 'Qq0wglDvseS3TYNDGuNvEl6O7ZX5Z6W1e0CzTPYbgnTNnyAuxN39WqgXGf0WEwtT';

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 6000,
      headers: {
        'User-Agent': 'CallMind-AI/1.0',
        'X-Auth-ID': accountId,
        'X-Auth-Token': authToken,
      },
    });
    return Buffer.from(response.data);
  }

  /**
   * Build a PlivoXML response that:
   * 1. Optionally speaks a message
   * 2. Records the next user utterance (up to 15 seconds)
   */
  private buildRecordXml(speakText?: string): string {
    const recordUrl = `${this.baseUrl}/api/v1/telephony/vobiz/recording`;
    const speak = speakText
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
