import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import { VobizLiveCallService } from './vobiz-live-call.service';
import { WhisperService } from '../ai/whisper.service';
import { SarvamService } from '../ai/sarvam.service';
import { TtsService } from '../ai/tts.service';
import { RedisService } from '../redis/redis.service';
import { ConversationMemoryService } from '../conversation/conversation-memory.service';
import { ConversationService } from '../conversation/conversation.service';
import { WaveFile } from 'wavefile';

interface StreamSession {
  callUuid: string;
  streamSid: string;
  audioBuffer: Buffer[];
  isSpeaking: boolean;
  silenceFrames: number;
  lastActiveTime: number;
  turnCount: number;
  // Silence re-engagement tracking
  aiSpeaking: boolean;
  postAiSilenceFrames: number;
  reengagementLevel: number;
  lastReengagementTime: number;
  isProcessingUtterance: boolean;
}

@WebSocketGateway({ path: '/api/v1/telephony/vobiz/stream' })
export class VobizStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VobizStreamGateway.name);
  private sessions = new Map<any, StreamSession>();

  // Simple RMS VAD constants
  private readonly SILENCE_THRESHOLD = 0.01; // Adjust based on mu-law/pcm levels
  private readonly MAX_SILENCE_FRAMES = 45; // About ~900ms of silence at 50 packets/sec

  // Silence re-engagement constants
  private readonly POST_AI_SILENCE_FRAMES = 150; // ~3 seconds at 50 packets/sec
  private readonly REENGAGEMENT_COOLDOWN_MS = 5000; // 5s between re-engagements
  private readonly MAX_REENGAGEMENTS = 2; // max times before wrapping up

  // MongoDB backup interval — save transcript every N turns
  private readonly BACKUP_EVERY_N_TURNS = 3;

  constructor(
    private readonly vobizCallService: VobizLiveCallService,
    private readonly whisperService: WhisperService,
    private readonly sarvamService: SarvamService,
    private readonly ttsService: TtsService,
    private readonly redisService: RedisService,
    private readonly conversationMemory: ConversationMemoryService,
    private readonly conversationService: ConversationService,
  ) {}

  handleConnection(client: any, ...args: any[]) {
    this.logger.log('[STREAM_CONNECTED] Client connected to Vobiz Media Stream Gateway');

    client.on('message', async (message: string | Buffer) => {
      try {
        let data: any;
        if (typeof message === 'string') {
          data = JSON.parse(message);
        } else {
          // Sometimes streams are binary, sometimes JSON encoded. Plivo/Twilio usually uses JSON with base64.
          data = JSON.parse(message.toString('utf8'));
        }

        if (data.event === 'start') {
          // Vobiz/Plivo Stream Start
          const callUuid = data.start?.callUuid || data.callUuid;
          const streamSid = data.streamSid || data.start?.streamSid;
          
          this.logger.log(`[STREAM_STARTED] callId=${callUuid} streamSid=${streamSid}`);
          
          this.sessions.set(client, {
            callUuid,
            streamSid,
            audioBuffer: [],
            isSpeaking: false,
            silenceFrames: 0,
            lastActiveTime: Date.now(),
            turnCount: 0,
            aiSpeaking: true,
            postAiSilenceFrames: 0,
            reengagementLevel: 0,
            lastReengagementTime: Date.now(),
            isProcessingUtterance: false,
          });

          // Prepare stream for conversation — Plivo <Speak> handles the greeting
          await this.startConversationStream(client, callUuid, streamSid);

        } else if (data.event === 'media') {
          const session = this.sessions.get(client);
          if (!session) return;

          this.logger.debug(`[CUSTOMER_AUDIO_RECEIVED] callId=${session.callUuid} size=${data.media?.payload?.length || 0}`);

          // data.media.payload is base64 encoded audio (usually mulaw 8000Hz)
          const audioChunk = Buffer.from(data.media.payload, 'base64');
          
          // Simple RMS check for VAD
          const isSilent = this.isSilent(audioChunk);

          if (!isSilent) {
            if (!session.isSpeaking) {
              this.logger.log(`[FIRST_UTTERANCE] callId=${session.callUuid} — customer started speaking`);
            }
            session.isSpeaking = true;
            session.silenceFrames = 0;
            session.postAiSilenceFrames = 0;
            session.reengagementLevel = 0;
            session.lastActiveTime = Date.now();
            session.audioBuffer.push(audioChunk);
          } else {
            if (session.isSpeaking) {
              // Person was speaking, now silent — track for VAD pause
              session.audioBuffer.push(audioChunk);
              session.silenceFrames++;

              if (session.silenceFrames >= this.MAX_SILENCE_FRAMES) {
                if (session.isProcessingUtterance) {
                  this.logger.debug(`[VAD_SKIP] callId=${session.callUuid} — already processing, skipping`);
                  session.audioBuffer = [];
                  session.silenceFrames = 0;
                } else {
                  this.logger.log(`[VAD_PAUSE_DETECTED] callId=${session.callUuid} — processing utterance`);
                  session.isProcessingUtterance = true;
                  session.isSpeaking = false;
                  
                  const finalAudio = Buffer.concat(session.audioBuffer);
                  session.audioBuffer = [];
                  
                  this.processUtterance(client, session.callUuid, session.streamSid, finalAudio);
                }
              }
            } else {
              // Person is silent and not speaking — track post-AI silence for re-engagement
              if (!session.aiSpeaking && !session.isProcessingUtterance) {
                session.postAiSilenceFrames++;
                if (session.postAiSilenceFrames >= this.POST_AI_SILENCE_FRAMES) {
                  const now = Date.now();
                  if (now - session.lastReengagementTime >= this.REENGAGEMENT_COOLDOWN_MS) {
                    session.postAiSilenceFrames = 0;
                    session.lastReengagementTime = now;
                    this.logger.log(`[SILENCE_TIMEOUT] callId=${session.callUuid} level=${session.reengagementLevel}`);
                    this.triggerReengagement(client, session, session.callUuid, session.streamSid);
                  }
                }
              }
            }
          }
        } else if (data.event === 'stop') {
          this.logger.log(`[STREAM_DISCONNECTED] callId=${this.sessions.get(client)?.callUuid}`);
          this.sessions.delete(client);
        }

      } catch (e) {
        this.logger.error(`Error processing stream message: ${e.message}`);
      }
    });
  }

  handleDisconnect(client: any) {
    this.logger.log('[STREAM_DISCONNECTED] Client disconnected from Vobiz Media Stream');
    this.sessions.delete(client);
  }

  /**
   * Prepare the WebSocket stream for conversation.
   * The greeting is played by Plivo via <Speak> in the answer XML concurrently with
   * the WebSocket stream. This method does NOT send duplicate audio — it sets up
   * session state so the stream is ready to receive the customer's first utterance.
   */
  private async startConversationStream(client: any, callUuid: string, streamSid: string): Promise<void> {
    const streamSession = this.sessions.get(client);
    if (!streamSession) {
      this.logger.warn(`[STREAM_NO_SESSION] callId=${callUuid}`);
      return;
    }

    this.logger.log(`[STREAM_READY] callId=${callUuid} streamSid=${streamSid} — stream active, greeting playing via Plivo, listening for customer`);

    streamSession.aiSpeaking = false;
    streamSession.isProcessingUtterance = false;
    streamSession.isSpeaking = false;
    streamSession.silenceFrames = 0;
    streamSession.postAiSilenceFrames = 0;
    streamSession.reengagementLevel = 0;
    streamSession.lastReengagementTime = Date.now();
    streamSession.lastActiveTime = Date.now();
  }

  /**
   * Process a chunk of audio when VAD detects a pause
   */
  private async processUtterance(client: any, callUuid: string, streamSid: string, audioBuffer: Buffer) {
    const startTime = Date.now();
    const streamSession = this.sessions.get(client);
    try {
      this.logger.log(`[UTTERANCE_PROCESSING] callId=${callUuid} audioSize=${audioBuffer.length} bytes`);
      
      const sessionKey = `live_call:${callUuid}`;
      const session = await this.redisService.get<any>(sessionKey);
      if (!session) {
        this.logger.warn(`[SESSION_LOST] callId=${callUuid} — cannot process utterance`);
        return;
      }

      // Load context
      const agentContext  = session.agentContext  || {};
      const systemPrompt  = session.systemPrompt  || 'You are a helpful voice assistant.';
      const orgContext    = session.orgContext    || {};
      const priorHistory  = await this.conversationMemory.getConversationMemory(callUuid);

      // 1. Transcribe (STT)
      this.logger.log(`[STT_STARTED] callId=${callUuid}`);
      const sttStart = Date.now();
      let userText = '';
      try {
        userText = await this.whisperService.transcribeAudio(
          this.addWavHeader(audioBuffer),
          agentContext?.language
        );
      } catch (err) {
        this.logger.error(`[STT_FAILED] callId=${callUuid} error=${err.message}`);
        if (streamSession) streamSession.isProcessingUtterance = false;
        return;
      }

      if (!userText || userText.trim().length < 2) {
        this.logger.debug(`[STT_EMPTY] callId=${callUuid} — no speech detected, sending re-engagement prompt`);
        await this.sendReengagementPrompt(client, streamSession, callUuid, streamSid, 0);
        return;
      }
      const sttLatency = Date.now() - sttStart;
      this.logger.log(`[STT_TRANSCRIPT] callId=${callUuid} text="${userText}" latency=${sttLatency}ms`);

      // 2. Generate LLM stream and synthesize sentences on-the-fly (Streaming LLM & TTS)
      this.logger.log(`[LLM_STARTED] callId=${callUuid} historyTurns=${priorHistory.length}`);
      const llmStartTime = Date.now();
      let sentenceBuffer = '';
      let ttsQueue: Promise<void> = Promise.resolve();
      let totalTtsLatencySum = 0;
      let ttsCount = 0;

      let hasSentAudio = false;

      const onChunk = (chunk: string) => {
        sentenceBuffer += chunk;
        
        // Split by sentence and clause terminators: ., ?, !, \n, Hindi danda (।), and comma (,), semicolon (;), colon (:)
        const sentences = sentenceBuffer.split(/(?<=[.?!।\n,;:])/g);
        sentenceBuffer = sentences.pop() || '';

        for (const sentence of sentences) {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 1) {
            const currentSentence = cleanSentence;
            ttsQueue = ttsQueue.then(async () => {
              if (!hasSentAudio && streamSession) {
                streamSession.aiSpeaking = true;
                hasSentAudio = true;
              }
              try {
                this.logger.log(`[TTS_STARTED] callId=${callUuid} text="${currentSentence.substring(0, 30)}..."`);
                const ttsStart = Date.now();
                const ttsResult = await this.ttsService.synthesize(currentSentence, {
                  language: agentContext?.language || 'hi-IN',
                  gender: agentContext?.gender || 'female',
                });
                const ttsLatency = Date.now() - ttsStart;
                totalTtsLatencySum += ttsLatency;
                ttsCount++;
                this.logger.log(`[TTS_COMPLETED] callId=${callUuid} latency=${ttsLatency}ms`);

                // Convert TTS WAV to raw 8000Hz mu-law
                const wav = new WaveFile(ttsResult.audioBuffer);
                wav.toSampleRate(8000);
                wav.toMuLaw();
                const rawMuLaw = Buffer.from((wav.data as any).samples);

                const payload = {
                  event: 'media',
                  streamSid: streamSid,
                  media: {
                    payload: rawMuLaw.toString('base64')
                  }
                };

                if (client.readyState === 1) { // WebSocket.OPEN
                  client.send(JSON.stringify(payload));
                  this.logger.debug(`[AUDIO_CHUNK_SENT] streamSid=${streamSid} text="${currentSentence.substring(0, 30)}..."`);
                }
              } catch (e) {
                this.logger.error(`[TTS_FAILED] callId=${callUuid} error=${e.message}`);
              }
            });
          }
        }
      };

      this.logger.log(`[AI_RESPONSE_GENERATED] callId=${callUuid} — streaming LLM response`);
      const llmResponse = await this.sarvamService.generateTurnResponseStream(
        userText,
        systemPrompt,
        priorHistory,
        agentContext,
        orgContext,
        onChunk
      );

      // Handle any remaining text in the sentence buffer
      if (sentenceBuffer.trim().length > 0) {
        const remainingSentence = sentenceBuffer.trim();
        ttsQueue = ttsQueue.then(async () => {
          if (!hasSentAudio && streamSession) {
            streamSession.aiSpeaking = true;
            hasSentAudio = true;
          }
          try {
            this.logger.log(`[TTS_STARTED] callId=${callUuid} text="${remainingSentence.substring(0, 30)}..."`);
            const ttsStart = Date.now();
            const ttsResult = await this.ttsService.synthesize(remainingSentence, {
              language: agentContext?.language || 'hi-IN',
              gender: agentContext?.gender || 'female',
            });
            const ttsLatency = Date.now() - ttsStart;
            totalTtsLatencySum += ttsLatency;
            ttsCount++;
            this.logger.log(`[TTS_COMPLETED] callId=${callUuid} latency=${ttsLatency}ms`);

            const wav = new WaveFile(ttsResult.audioBuffer);
            wav.toSampleRate(8000);
            wav.toMuLaw();
            const rawMuLaw = Buffer.from((wav.data as any).samples);

            const payload = {
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: rawMuLaw.toString('base64')
              }
            };

            if (client.readyState === 1) {
              client.send(JSON.stringify(payload));
              this.logger.debug(`[AUDIO_FINAL_CHUNK_SENT] streamSid=${streamSid} text="${remainingSentence.substring(0, 30)}..."`);
            }
          } catch (e) {
            this.logger.error(`[TTS_FAILED] callId=${callUuid} error=${e.message}`);
          }
        });
      }

      // Wait for all TTS playbacks to be dispatched
      await ttsQueue;

      const totalLlmLatency = Date.now() - llmStartTime;
      this.logger.log(`[LLM_COMPLETED] callId=${callUuid} response="${llmResponse.content.substring(0, 80)}" latency=${totalLlmLatency}ms`);

      // 3. Save turn to conversation memory
      await this.conversationMemory.appendMessages(callUuid, [
        { role: 'user', content: userText },
        { role: 'assistant', content: llmResponse.content },
      ]);
      this.logger.log(`[MEMORY_SAVED] callId=${callUuid} turns=${priorHistory.length + 2}`);

      // 4. Save turn latencies in Redis session for average aggregation on call end
      const turnLatencies = {
        stt: sttLatency,
        llm: llmResponse.latencyMs || totalLlmLatency,
        tts: ttsCount > 0 ? Math.round(totalTtsLatencySum / ttsCount) : 0,
        total: Date.now() - startTime,
      };

      const freshSession = await this.redisService.get<any>(sessionKey);
      if (freshSession) {
        const list = freshSession.latencies || [];
        list.push(turnLatencies);
        freshSession.latencies = list;

        // Increment turn count and backup to MongoDB periodically
        freshSession.turnCount = (freshSession.turnCount || 0) + 1;
        if (freshSession.turnCount % this.BACKUP_EVERY_N_TURNS === 0) {
          await this.backupTranscriptToMongoDb(callUuid, freshSession);
        }

        await this.redisService.set(sessionKey, freshSession, 3600);
      }

      this.logger.log(`[UTTERANCE_COMPLETED] callId=${callUuid} totalLatency=${Date.now() - startTime}ms`);

    } catch (error) {
      this.logger.error(`[UTTERANCE_FAILED] callId=${callUuid} error=${error.message}`, error.stack);
    } finally {
      if (streamSession) {
        streamSession.aiSpeaking = false;
        streamSession.isProcessingUtterance = false;
      }
    }
  }

  /**
   * Backup transcript to MongoDB periodically to prevent data loss.
   * This ensures transcript survives Redis failures.
   */
  private async backupTranscriptToMongoDb(callUuid: string, session: any): Promise<void> {
    try {
      const history = await this.conversationMemory.getConversationMemory(callUuid);
      if (history.length === 0) return;

      // Find the call by callUuid (callSid)
      const { CallService } = await import('../call/call.service');
      // We need to find the call ID from the callUuid
      // The session should have the callId stored
      const callId = session.callId;
      if (!callId) {
        this.logger.debug(`[BACKUP] No callId in session for ${callUuid}, skipping backup`);
        return;
      }

      const transcript = history.map(msg => ({
        role: msg.role === 'user' ? 'customer' as const : 'agent' as const,
        content: msg.content,
        timestamp: new Date()
      }));

      await this.conversationService.saveTranscriptAndMetrics(callId, transcript, {
        avgStt: 0,
        avgLlm: 0,
        avgTts: 0,
        avgTotal: 0,
      });

      this.logger.debug(`[BACKUP] Transcript backed up to MongoDB for callId=${callId} (${transcript.length} turns)`);
    } catch (err) {
      this.logger.warn(`[BACKUP_ERROR] Failed to backup transcript: ${err.message}`);
    }
  }

  /**
   * Trigger a re-engagement prompt after the person has been silent for ~3 seconds.
   * Uses a two-tier strategy:
   *   Level 0: Polite re-engagement ("Hello? Are you still there?")
   *   Level 1: Natural follow-up based on conversation stage
   *   Level 2+: Wrap-up prompt
   */
  private async triggerReengagement(client: any, session: StreamSession, callUuid: string, streamSid: string): Promise<void> {
    session.isProcessingUtterance = true;
    session.aiSpeaking = true;
    session.postAiSilenceFrames = 0;

    try {
      const level = session.reengagementLevel;
      const sessionKey = `live_call:${callUuid}`;
      const sessionData = await this.redisService.get<any>(sessionKey);
      const agentContext = sessionData?.agentContext || {};
      const language = agentContext?.language || 'hi-IN';

      let prompt = '';
      if (level === 0) {
        // First silence — polite check-in
        prompt = language === 'hi-IN' || language === 'hinglish'
          ? 'Hello? Kya aap abhi bhi hain?'
          : 'Hello? Are you still there?';
      } else if (level === 1) {
        // Second silence — natural follow-up from conversation stage
        const priorHistory = await this.conversationMemory.getConversationMemory(callUuid);
        if (priorHistory.length > 1) {
          prompt = language === 'hi-IN' || language === 'hinglish'
            ? 'Kya aap kuch aur jaanna chahenge? Main aapki madad ke liye yahaan hoon.'
            : 'Would you like to know anything else? I\'m here to help.';
        } else {
          prompt = language === 'hi-IN' || language === 'hinglish'
            ? 'Kya main aapki kisi aur cheez mein madad kar sakti hoon?'
            : 'Is there anything else I can help you with?';
        }
      } else {
        // Third+ silence — wrap up
        prompt = language === 'hi-IN' || language === 'hinglish'
          ? 'Main aapko baad mein call karti hoon. Dhanyavaad!'
          : 'I will call you back later. Thank you!';
      }

      this.logger.log(`[REENGAGEMENT] callId=${callUuid} level=${level} prompt="${prompt.substring(0, 50)}"`);

      // TTS and send
      const ttsResult = await this.ttsService.synthesize(prompt, {
        language,
        gender: agentContext?.gender || 'female',
      });

      const wav = new WaveFile(ttsResult.audioBuffer);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      const rawMuLaw = Buffer.from((wav.data as any).samples);

      const payload = {
        event: 'media',
        streamSid,
        media: {
          payload: rawMuLaw.toString('base64')
        }
      };

      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }

      // Save to conversation memory as an assistant turn
      await this.conversationMemory.appendMessages(callUuid, [
        { role: 'assistant', content: prompt },
      ]);

      session.reengagementLevel = Math.min(level + 1, this.MAX_REENGAGEMENTS + 1);
      session.lastReengagementTime = Date.now();

    } catch (err) {
      this.logger.error(`[REENGAGEMENT_ERROR] callId=${callUuid} error=${err.message}`);
    } finally {
      session.aiSpeaking = false;
      session.isProcessingUtterance = false;
    }
  }

  /**
   * Send a re-engagement prompt when STT returns empty / no speech detected.
   * Lighter than triggerReengagement — resets silence counters and keeps the call alive.
   */
  private async sendReengagementPrompt(client: any, session: StreamSession | undefined, callUuid: string, streamSid: string, level: number): Promise<void> {
    const streamSession = this.sessions.get(client);
    if (streamSession) {
      streamSession.aiSpeaking = true;
      streamSession.postAiSilenceFrames = 0;
      streamSession.isProcessingUtterance = true;
    }

    try {
      const sessionKey = `live_call:${callUuid}`;
      const sessionData = await this.redisService.get<any>(sessionKey);
      const agentContext = sessionData?.agentContext || {};
      const language = agentContext?.language || 'hi-IN';

      const prompt = language === 'hi-IN' || language === 'hinglish'
        ? 'Kya aapne kuch kaha? Main sun rahi hoon. Kripya phir se bolein.'
        : 'I didn\'t catch that. Could you please repeat?';

      this.logger.log(`[STT_RECOVERY] callId=${callUuid} sending recovery prompt`);

      const ttsResult = await this.ttsService.synthesize(prompt, {
        language,
        gender: agentContext?.gender || 'female',
      });

      const wav = new WaveFile(ttsResult.audioBuffer);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      const rawMuLaw = Buffer.from((wav.data as any).samples);

      const payload = {
        event: 'media',
        streamSid,
        media: {
          payload: rawMuLaw.toString('base64')
        }
      };

      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }

      // Save to memory so the AI knows it sent a recovery prompt
      await this.conversationMemory.appendMessages(callUuid, [
        { role: 'assistant', content: prompt },
      ]);

    } catch (err) {
      this.logger.error(`[STT_RECOVERY_ERROR] callId=${callUuid} error=${err.message}`);
    } finally {
      if (streamSession) {
        streamSession.aiSpeaking = false;
      }
    }
  }

  /**
   * Helper to wrap raw 8000Hz mu-law bytes into a valid WAV buffer so Whisper accepts it.
   */
  private addWavHeader(rawAudio: Buffer): Buffer {
    // 44-byte standard RIFF WAV header for 8000Hz, 1 channel, 8-bit mu-law (format tag 7)
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + rawAudio.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // subchunk1 size
    header.writeUInt16LE(7, 20);  // audio format (7 = mu-law)
    header.writeUInt16LE(1, 22);  // num channels
    header.writeUInt32LE(8000, 24); // sample rate
    header.writeUInt32LE(8000, 28); // byte rate (8000 * 1 * 8 / 8)
    header.writeUInt16LE(1, 32);  // block align
    header.writeUInt16LE(8, 34);  // bits per sample
    header.write('data', 36);
    header.writeUInt32LE(rawAudio.length, 40);

    return Buffer.concat([header, rawAudio]);
  }

  /**
   * Extremely basic RMS volume check for Mu-law audio bytes
   */
  private isSilent(chunk: Buffer): boolean {
    let sumSquares = 0;
    for (let i = 0; i < chunk.length; i++) {
      // Decode mu-law to linear roughly (just for energy estimation)
      const val = this.muLawDecode(chunk[i]);
      sumSquares += (val * val);
    }
    const rms = Math.sqrt(sumSquares / chunk.length) / 32768.0; // Normalize
    return rms < this.SILENCE_THRESHOLD;
  }

  private muLawDecode(muLawByte: number): number {
    muLawByte = ~muLawByte;
    const sign = muLawByte & 0x80;
    const exponent = (muLawByte & 0x70) >> 4;
    const mantissa = muLawByte & 0x0f;
    let sample = (mantissa << 3) + 132;
    sample <<= exponent;
    sample -= 132;
    return sign !== 0 ? -sample : sample;
  }
}
