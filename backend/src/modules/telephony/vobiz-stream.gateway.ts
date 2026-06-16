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
}

@WebSocketGateway({ path: '/api/v1/telephony/vobiz/stream' })
export class VobizStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VobizStreamGateway.name);
  private sessions = new Map<any, StreamSession>();

  // Simple RMS VAD constants
  private readonly SILENCE_THRESHOLD = 0.01; // Adjust based on mu-law/pcm levels
  private readonly MAX_SILENCE_FRAMES = 50; // About ~1 second of silence at 50 packets/sec

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
          });

          // Send greeting audio through WebSocket (keeps call alive)
          await this.sendGreetingAudio(client, callUuid, streamSid);

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
            session.lastActiveTime = Date.now();
            session.audioBuffer.push(audioChunk);
          } else {
            if (session.isSpeaking) {
              session.audioBuffer.push(audioChunk); // Keep some silence for smooth STT
              session.silenceFrames++;

              // User paused for long enough
              if (session.silenceFrames >= this.MAX_SILENCE_FRAMES) {
                this.logger.log(`[VAD_PAUSE_DETECTED] callId=${session.callUuid} — processing utterance`);
                session.isSpeaking = false;
                
                const finalAudio = Buffer.concat(session.audioBuffer);
                session.audioBuffer = []; // Clear for next utterance
                
                // Fire off processing async so we don't block the stream
                this.processUtterance(client, session.callUuid, session.streamSid, finalAudio);
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
   * Send greeting audio through WebSocket after connection is established.
   * This keeps the call alive because the WebSocket remains active.
   */
  private async sendGreetingAudio(client: any, callUuid: string, streamSid: string): Promise<void> {
    try {
      const sessionKey = `live_call:${callUuid}`;
      const session = await this.redisService.get<any>(sessionKey);
      if (!session?.greetingText) {
        this.logger.warn(`[GREETING] No greeting text for callId=${callUuid}`);
        return;
      }

      const agentContext = session.agentContext || {};
      const greetingText = session.greetingText;

      this.logger.log(`[GREETING_STARTED] callId=${callUuid} text="${greetingText.substring(0, 80)}"`);
      const startTime = Date.now();

      // Generate TTS for greeting
      const ttsResult = await this.ttsService.synthesize(greetingText, {
        language: agentContext?.language || 'hi-IN',
        gender: agentContext?.gender || 'female',
      });

      this.logger.log(`[TTS_STARTED] callId=${callUuid} — greeting TTS generated`);

      // Convert to mu-law and send through WebSocket
      const wav = new WaveFile(ttsResult.audioBuffer);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      const rawMuLaw = Buffer.from((wav.data as any).samples);

      // Send in chunks to simulate real-time audio playback
      const chunkSize = 320; // 40ms of audio at 8000Hz
      for (let i = 0; i < rawMuLaw.length; i += chunkSize) {
        const chunk = rawMuLaw.subarray(i, i + chunkSize);
        const payload = {
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: chunk.toString('base64')
          }
        };

        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(payload));
        }
        
        // Small delay to simulate real-time audio playback
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      const latency = Date.now() - startTime;
      this.logger.log(`[GREETING_COMPLETED] callId=${callUuid} latency=${latency}ms — customer can now speak`);

    } catch (err) {
      this.logger.error(`[GREETING_ERROR] Failed to send greeting for callId=${callUuid}: ${err.message}`);
    }
  }

  /**
   * Process a chunk of audio when VAD detects a pause
   */
  private async processUtterance(client: any, callUuid: string, streamSid: string, audioBuffer: Buffer) {
    const startTime = Date.now();
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
        return; // ignore mumbles
      }

      if (!userText || userText.trim().length < 2) {
        this.logger.debug(`[STT_EMPTY] callId=${callUuid} — no speech detected`);
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

      const onChunk = (chunk: string) => {
        sentenceBuffer += chunk;
        
        // Split by sentence terminators: ., ?, !, \n, and Hindi danda (।)
        const sentences = sentenceBuffer.split(/(?<=[.?!।\n])/g);
        sentenceBuffer = sentences.pop() || '';

        for (const sentence of sentences) {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 1) {
            const currentSentence = cleanSentence;
            ttsQueue = ttsQueue.then(async () => {
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
