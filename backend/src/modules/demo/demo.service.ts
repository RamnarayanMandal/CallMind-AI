import { Injectable, Logger } from '@nestjs/common';
import { WhisperService } from '../ai/whisper.service';
import { SarvamService } from '../ai/sarvam.service';
import { TtsService } from '../ai/tts.service';
import { AgentService } from '../agent/agent.service';
import { ConfigService } from '@nestjs/config';

interface DemoSession {
  agentId: string;
  agentContext: any;
  audioBuffer: Buffer[];
  isProcessing: boolean;
  startTime: number;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private sessions: Map<string, DemoSession> = new Map();

  constructor(
    private readonly whisperService: WhisperService,
    private readonly sarvamService: SarvamService,
    private readonly ttsService: TtsService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
  ) { }

  async initializeSession(clientId: string, agentId: string, emit: (event: string, payload: any) => void) {
    let agentContext: any = {};
    try {
      const agent = await this.agentService.findOne(agentId);
      agentContext = agent;
    } catch (e) {
      this.logger.warn(`Could not find agent ${agentId}, using default context.`);
    }

    this.sessions.set(clientId, {
      agentId,
      agentContext,
      audioBuffer: [],
      isProcessing: false,
      startTime: Date.now(),
    });

    try {
      this.logger.log(`Generating intro for agent ${agentId}`);
      emit('processing-status', { status: 'thinking' });

      // STRICT INTRO PROMPT
      const introPrompt = `You are a professional company representative starting a voice call.
Introduce yourself as ${agentContext?.name || 'the assistant'}.
Based on your system prompt: "${agentContext?.systemPrompt || 'You are a helpful assistant.'}"
Generate a brief, friendly opening greeting explaining who you are and asking how you can help.
CRITICAL RULES:
- NEVER mention AI providers (Sarvam AI, OpenAI, etc).
- Speak strictly in the language: ${agentContext?.language || 'en-US'}.
- Tone must be: ${agentContext?.tone || 'professional'}.
- Provide the exact words you will speak, nothing else.`;

      const aiResponseText = await this.sarvamService.generateResponse(introPrompt, agentContext, true);
      emit('transcript', { role: 'agent', text: aiResponseText });

      emit('processing-status', { status: 'speaking' });
      const audioResponse = await this.ttsService.generateSpeech(aiResponseText);

      emit('audio-response', audioResponse);
      emit('processing-status', { status: 'idle' });
    } catch (error) {
      this.logger.error('Error generating intro', error);
      emit('processing-status', { status: 'idle' });
      emit('error', { message: 'Failed to generate introduction.' });
    }
  }

  async processAudioStream(clientId: string, audioChunk: Buffer, emit: (event: string, payload: any) => void) {
    const session = this.sessions.get(clientId);
    if (!session) return;

    // Demo Timer Logic
    const maxDurationMins = this.configService.get<number>('DEMO_MAX_DURATION_MINUTES', 3);
    const elapsedMs = Date.now() - session.startTime;
    if (elapsedMs > maxDurationMins * 60 * 1000) {
      this.logger.warn(`Demo session timeout for client ${clientId}`);
      const timeoutMsg = "Aapka demo session complete ho gaya hai. Dhanyavaad! Your demo session has expired. Thank you!";
      emit('transcript', { role: 'agent', text: timeoutMsg });
      emit('processing-status', { status: 'speaking' });
      try {
        const audioResponse = await this.ttsService.generateSpeech(timeoutMsg);
        emit('audio-response', audioResponse);
      } catch (e) { }
      emit('processing-status', { status: 'idle' });
      emit('demo-stopped', { reason: 'timeout' });
      this.cleanupSession(clientId);
      return;
    }

    session.audioBuffer.push(audioChunk);
    if (session.isProcessing) return;
    session.isProcessing = true;

    try {
      const fullBuffer = Buffer.concat(session.audioBuffer);
      session.audioBuffer = [];

      emit('processing-status', { status: 'listening' });
      const text = await this.whisperService.transcribeAudio(fullBuffer);

      if (!text || text.trim() === '') {
        session.isProcessing = false;
        return;
      }

      emit('transcript', { role: 'user', text });

      emit('processing-status', { status: 'thinking' });

      // STRICT CONVERSATION PROMPT
      const strictPrompt = `User said: "${text}"
Your Identity: ${session.agentContext?.name || 'Assistant'}
Your Context: ${session.agentContext?.systemPrompt || 'Helpful assistant'}
CRITICAL RULES:
- NEVER break character.
- NEVER mention you are an AI from OpenAI, Sarvam, or any system.
- If the user asks unrelated questions, politely redirect them back to the business services.
- Keep the response conversational, short, and natural for voice.
Generate your response now:`;

      const aiResponseText = await this.sarvamService.generateResponse(strictPrompt, session.agentContext);
      emit('transcript', { role: 'agent', text: aiResponseText });

      emit('processing-status', { status: 'speaking' });
      const audioResponse = await this.ttsService.generateSpeech(aiResponseText);

      emit('audio-response', audioResponse);
      emit('processing-status', { status: 'idle' });

    } catch (error) {
      this.logger.error('Error in audio pipeline', error);
      emit('error', { message: 'Pipeline error occurred.' });
    } finally {
      if (this.sessions.has(clientId)) {
        session.isProcessing = false;
      }
    }
  }

  cleanupSession(clientId: string) {
    this.sessions.delete(clientId);
  }
}
