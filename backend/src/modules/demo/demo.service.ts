import { Injectable, Logger } from '@nestjs/common';
import { WhisperService } from '../ai/whisper.service';
import { SarvamService } from '../ai/sarvam.service';
import { TtsService } from '../ai/tts.service';
import { AgentService } from '../agent/agent.service';
import { OrganizationService } from '../organization/organization.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';
import { ConfigService } from '@nestjs/config';

interface DemoSession {
  agentId: string;
  agentContext: any;
  orgContext: any;
  audioBuffer: Buffer[];
  isProcessing: boolean;
  startTime: number;
  systemPrompt: string;
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
    private readonly orgService: OrganizationService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly configService: ConfigService,
  ) { }

  async initializeSession(clientId: string, agentId: string, emit: (event: string, payload: any) => void) {
    let agentContext: any = {};
    let orgContext: any = {};
    let systemPrompt = 'You are a helpful customer support representative.';
    let introPrompt = 'Hello, how can I help you today?';

    try {
      const agent = await this.agentService.findOne(agentId);
      agentContext = agent;
      if (agent.organizationId) {
        const org = await this.orgService.findById(agent.organizationId);
        if (org) {
          orgContext = org;
        }
      }

      // Build the prompts dynamically using prompt builder
      const built = this.promptBuilder.build(
        {
          name: orgContext.name || 'our company',
          about: orgContext.about || '',
          productInfo: orgContext.productInfo || '',
          targetAudience: orgContext.targetAudience || '',
          industry: orgContext.industry || '',
          businessGoals: orgContext.businessGoals || '',
          supportInstructions: orgContext.supportInstructions || '',
          tone: orgContext.tone || 'professional',
          website: orgContext.website || '',
        },
        {
          name: agentContext.name || 'Assistant',
          gender: agentContext.gender || 'female',
          tone: agentContext.tone || 'professional',
          language: agentContext.language || 'hi-IN',
          customInstructions: agentContext.customInstructions || '',
        }
      );

      systemPrompt = agentContext.systemPrompt || agentContext.generatedSystemPrompt || built.systemPrompt;
      introPrompt = built.introPrompt;

    } catch (e) {
      this.logger.warn(`Could not load full context for agent ${agentId}: ${e.message}`);
    }

    this.sessions.set(clientId, {
      agentId,
      agentContext,
      orgContext,
      audioBuffer: [],
      isProcessing: false,
      startTime: Date.now(),
      systemPrompt,
    });

    try {
      this.logger.log(`Generating intro for agent ${agentId} using organization-aware prompt`);
      emit('processing-status', { status: 'thinking' });

      // Pass the fully dynamic intro prompt to LLM to speak in natural tone
      const aiResponseText = await this.sarvamService.generateResponse(introPrompt, agentContext, true, orgContext);
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
      const timeoutMsg = session.agentContext?.language === 'hi-IN' || session.agentContext?.language === 'hinglish'
        ? "Aapka demo session complete ho gaya hai. Dhanyavaad! Your demo session has expired. Thank you!"
        : "Your demo session has expired. Thank you for calling!";

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

      // Generate turn-specific conversation guide
      const turnGuide = this.promptBuilder.buildConversationGuide(
        {
          name: session.orgContext?.name || 'our company',
          about: session.orgContext?.about || '',
        },
        {
          name: session.agentContext?.name || 'Assistant',
          language: session.agentContext?.language || 'hi-IN',
          tone: session.agentContext?.tone || 'friendly',
        }
      );

      const strictPrompt = `
${session.systemPrompt}

${turnGuide}

User said: "${text}"

Generate response now:`;

      const aiResponseText = await this.sarvamService.generateResponse(strictPrompt, session.agentContext, false, session.orgContext);
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
