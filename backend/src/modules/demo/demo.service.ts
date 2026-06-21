import { Injectable, Logger } from '@nestjs/common';
import { WhisperService } from '../ai/whisper.service';
import { SarvamService } from '../ai/sarvam.service';
import { TtsService } from '../ai/tts.service';
import { AgentService } from '../agent/agent.service';
import { OrganizationService } from '../organization/organization.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { OrgContextCacheService } from '../redis/org-context-cache.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { TranscriptSanitizerService } from '../ai/transcript-sanitizer.service';
import { ResponseCompletenessValidatorService } from '../ai/response-completeness-validator.service';
import { ConversationOrchestratorService } from '../ai/conversation-orchestrator.service';
import { ConversationMemoryService } from '../conversation/conversation-memory.service';
import { LlmMessage } from '@providers/ai/ai.provider';
import { ToolService } from '../tool/tool.service';

export interface DemoSession {
  agentId: string;
  agentContext: any;
  orgContext: any;
  systemPrompt: string;
  /**
   * Conversation history: strictly alternating [user, assistant, user, assistant, ...]
   * NEVER contains system messages.
   * NEVER starts with assistant.
   * NEVER has consecutive duplicate roles.
   */
  history: LlmMessage[];
  isProcessing: boolean;
  startTime: number;

  // Orchestrator Stage & Lead Metadata fields stored in Redis
  intent?: string;
  stage?: string;
  lastFollowUp?: string;
  leadStatus?: string;
  summary?: string;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly whisperService: WhisperService,
    private readonly sarvamService: SarvamService,
    private readonly ttsService: TtsService,
    private readonly agentService: AgentService,
    private readonly orgService: OrganizationService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly orgCacheService: OrgContextCacheService,
    private readonly kbService: KnowledgeBaseService,
    private readonly transcriptSanitizer: TranscriptSanitizerService,
    private readonly completenessValidator: ResponseCompletenessValidatorService,
    private readonly orchestrator: ConversationOrchestratorService,
    private readonly conversationMemory: ConversationMemoryService,
    private readonly toolService: ToolService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  //  SESSION INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  async initializeSession(
    clientId: string,
    agentId: string,
    emit: (event: string, payload: any) => void,
  ) {
    let agentContext: any = {};
    let orgContext: any = {};
    let systemPrompt = 'You are a helpful customer support representative.';
    let introPrompt = 'Hello, how can I help you today?';

    try {
      // 1. Try Redis org cache (24h TTL — avoids MongoDB on every call start)
      const cachedProfile = await this.orgCacheService.getCachedProfileByAgentId(agentId);
      if (cachedProfile) {
        agentContext = cachedProfile.agentContext;
        orgContext   = cachedProfile.orgContext;
        systemPrompt = cachedProfile.systemPrompt;
        introPrompt  = cachedProfile.introPrompt;
        this.logger.log(`[${clientId}] Profile cache HIT for agent ${agentId}`);
      } else {
        // 2. Cache miss — load from MongoDB and compile
        const agent = await this.agentService.findOne(agentId);
        agentContext = agent;
        if (agent.organizationId) {
          const org = await this.orgService.findById(agent.organizationId);
          if (org) orgContext = org;
        }

        const profile = await this.orgCacheService.buildAndCacheProfile(
          agentContext.organizationId || 'default',
          agentId,
          orgContext,
          agentContext,
        );
        systemPrompt = profile.systemPrompt;
        introPrompt  = profile.introPrompt;
        this.logger.log(`[${clientId}] Compiled and cached profile for agent ${agentId}`);
      }
    } catch (e) {
      this.logger.warn(`[${clientId}] Profile load failed for agent ${agentId}: ${e.message}`);
    }

    // ── Inject tool schemas into system prompt ────────────────────────────
    const enabledTools: string[] = agentContext?.enabledTools || [];
    if (enabledTools.length > 0) {
      const orgId = agentContext?.organizationId?.toString() || orgContext?._id?.toString();
      if (orgId) {
        try {
          const schemas = await this.toolService.getFunctionSchemas(orgId, enabledTools);
          if (schemas.length > 0 && !systemPrompt.includes('## AVAILABLE TOOLS')) {
            systemPrompt += `\n\n## AVAILABLE TOOLS\nYou have access to the following tools. Call them when the user asks something you can answer with real data.
CRITICAL: To call a tool, you MUST output exactly this format on its own line:
[TOOL_CALL: tool_name {"parameter": "value"}]
For example: [TOOL_CALL: search_products {"query": "apple"}]
Do NOT output anything else when calling a tool.

Available tools:
${JSON.stringify(schemas, null, 2)}`;
            this.logger.log(`[${clientId}] Injected ${schemas.length} tool schemas into system prompt`);
          }
        } catch (err) {
          this.logger.warn(`[${clientId}] Failed to load tool schemas: ${err.message}`);
        }
      }
    }

    // 3. Initialize session with EMPTY history — history starts only after first real user turn
    const sessionKey = `call:${clientId}`;
    const newSession: DemoSession = {
      agentId,
      agentContext,
      orgContext,
      systemPrompt,
      history: [],        // ← EMPTY: intro is NOT stored in conversation history
      isProcessing: false,
      startTime: Date.now(),
      // Seed default Orchestrator Stages
      intent: 'unknown',
      stage: 'intro',
      leadStatus: 'unknown',
      summary: 'New conversation initiated.',
      lastFollowUp: 'Aap kis tarah ka business run karte hain, aur main aapki support calling automate karne mein kaise help kar sakti hoon?',
    };

    await this.redisService.set(sessionKey, newSession, 3600);
    await this.conversationMemory.clearMemory(clientId);

    // 4. Generate intro greeting
    try {
      emit('processing-status', { status: 'thinking' });

      const introText = this.sarvamService.generateIntroFromTemplate(
        agentContext,
        orgContext,
      );

      emit('transcript', { role: 'agent', text: introText });
      emit('processing-status', { status: 'speaking' });

      const audioResponse = await this.ttsService.generateSpeech(introText, {
        language: agentContext?.language || 'hi-IN',
        gender: agentContext?.gender || 'female',
      });
      emit('audio-response', audioResponse);
      emit('processing-status', { status: 'idle' });
    } catch (error) {
      this.logger.error(`[${clientId}] Intro generation error: ${error.message}`);
      emit('processing-status', { status: 'idle' });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  AUDIO PROCESSING
  // ─────────────────────────────────────────────────────────────────────────────

  async processAudioStream(
    clientId: string,
    audioChunk: Buffer,
    emit: (event: string, payload: any) => void,
  ) {
    const sessionKey = `call:${clientId}`;
    const session = await this.redisService.get<DemoSession>(sessionKey);
    if (!session) {
      this.logger.warn(`[${clientId}] No session found — ignoring audio chunk`);
      return;
    }

    // ── Demo timer guard ────────────────────────────────────────────────────
    const maxDurationMins = this.configService.get<number>('DEMO_MAX_DURATION_MINUTES', 5);
    if (Date.now() - session.startTime > maxDurationMins * 60 * 1000) {
      await this.handleTimeout(clientId, session, emit);
      return;
    }

    // ── Deduplication guard ─────────────────────────────────────────────────
    if (session.isProcessing) {
      this.logger.warn(`[${clientId}] Duplicate audio chunk while processing — skipped`);
      return;
    }

    // Mark processing — prevent concurrent overlaps
    session.isProcessing = true;
    await this.redisService.set(sessionKey, session, 3600);

    try {
      // ── STT ────────────────────────────────────────────────────────────────
      emit('processing-status', { status: 'listening' });
      const rawTranscript = await this.whisperService.transcribeAudio(audioChunk);

      // Clean transcript before it enters the AI pipeline
      const userText = this.transcriptSanitizer.sanitize(rawTranscript);

      if (!userText) {
        this.logger.debug(`[${clientId}] Empty transcript after sanitization — skipping turn`);
        return;
      }

      emit('transcript', { role: 'user', text: userText });
      emit('processing-status', { status: 'thinking' });

      // ── Sales Stage Orchestrator ───────────────────────────────────────────
      const orchestratorResult = this.orchestrator.orchestrate(userText, {
        intent: session.intent,
        stage: session.stage,
        lastFollowUp: session.lastFollowUp,
        leadStatus: session.leadStatus as any,
        summary: session.summary,
      });

      // Update active orchestrator stage in session context
      session.intent = orchestratorResult.newState.intent;
      session.stage = orchestratorResult.newState.stage;
      session.leadStatus = orchestratorResult.newState.leadStatus;
      session.summary = orchestratorResult.newState.summary;
      session.lastFollowUp = orchestratorResult.newState.lastFollowUp;

      // ── RAG lookup ─────────────────────────────────────────────────────────
      let ragContext: string | undefined;
      const orgId = session.orgContext?._id?.toString() || session.orgContext?.id;
      if (orgId) {
        try {
          const matchedFaqs = await this.kbService.search(orgId, userText, 2);
          if (matchedFaqs?.length > 0) {
            ragContext = matchedFaqs
              .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
              .join('\n\n');
            this.logger.debug(`[${clientId}] RAG: ${matchedFaqs.length} FAQ match(es) for "${userText}"`);
          }
        } catch (err) {
          this.logger.warn(`[${clientId}] RAG lookup error: ${err.message}`);
        }
      }

      // Compile current stage guidelines into dynamic turn guide instructions
      const turnGuide = `
${orchestratorResult.directives}

CRITICAL: Keep your response short and conversational (max 2 sentences). Sound naturally human. Do NOT repeat marketing slogans or intros.`;

      // Get persistent memory
      const conversationMemory = await this.conversationMemory.getConversationMemory(clientId);

      // ── AI generation ──────────────────────────────────────────────────────
      const rawAiResponseText = await this.sarvamService.generateTurnResponse(
        userText,
        session.systemPrompt,
        conversationMemory,     // ← prior turns from persistent memory
        session.agentContext,
        session.orgContext,
        ragContext,
        turnGuide,
      );

      // ── Intercept Tool Calls ────────────────────────────────────────────────
      let finalAiResponseText = rawAiResponseText;
      const toolCallMatch = rawAiResponseText.match(/\[TOOL_CALL:\s*([^\s\]]+)\s+(.*?)\]/is);
      if (toolCallMatch) {
        const toolName = toolCallMatch[1].trim();
        try {
          const toolArgs = JSON.parse(toolCallMatch[2].trim());
          this.logger.debug(`[${clientId}] Intercepted tool call: ${toolName} with args: ${JSON.stringify(toolArgs)}`);
          
          const orgId = session.orgContext?._id?.toString() || session.orgContext?.id;
          const result = await this.toolService.execute(toolName, toolArgs, orgId);
          
          if (result.success) {
            finalAiResponseText = result.humanReadable;
            this.logger.log(`[${clientId}] Tool ${toolName} executed successfully. Human readable: ${finalAiResponseText}`);
            // Also append the actual data to memory in case the LLM needs to reference it next turn!
            await this.conversationMemory.appendMessages(clientId, [
              { role: 'system', content: `[Tool ${toolName} Result]: ${JSON.stringify(result.data)}` }
            ]);
          } else {
            finalAiResponseText = result.humanReadable || 'Sorry, I could not fetch that information.';
            this.logger.warn(`[${clientId}] Tool ${toolName} failed: ${result.error}`);
          }
        } catch (e) {
          this.logger.error(`[${clientId}] Failed to parse/execute tool call args for ${toolName}: ${e.message}`);
          finalAiResponseText = "Main abhi ye check nahi kar pa rahi hoon. Kripya thodi der baad try karein.";
        }
      }

      // Clean up any remaining tool tags if they leaked
      finalAiResponseText = finalAiResponseText.replace(/\[TOOL_CALL:.*?\]/gis, '').trim();
      if (!finalAiResponseText) {
        finalAiResponseText = "Maine aapki request process kar li hai.";
      }

      // ── Response Completeness Validation & HEAL Sequence ───────────────────
      // Guarantees response never ends cut off, and seamlessly attaches contextual follow-ups!
      const healedResponseText = this.completenessValidator.validateAndHeal(
        finalAiResponseText,
        orchestratorResult.suggestedFollowUp,
      );

      // ── Update history atomically ──────────────────────────────────────────
      // Re-fetch session in case another write happened during AI generation
      const freshSession = await this.redisService.get<DemoSession>(sessionKey);
      if (freshSession) {
        // Update updated orchestrator state onto fresh session object
        freshSession.intent = session.intent;
        freshSession.stage = session.stage;
        freshSession.leadStatus = session.leadStatus;
        freshSession.summary = session.summary;
        freshSession.lastFollowUp = session.lastFollowUp;

        // Append BOTH turns together to standard memory — guarantees alternation
        await this.conversationMemory.appendMessages(clientId, [
          { role: 'user', content: userText },
          { role: 'assistant', content: healedResponseText },
        ]);

        freshSession.isProcessing = false;
        await this.redisService.set(sessionKey, freshSession, 3600);
      }

      // ── Emit response ──────────────────────────────────────────────────────
      emit('transcript', { role: 'agent', text: healedResponseText });
      emit('processing-status', { status: 'speaking' });

      const audioResponse = await this.ttsService.generateSpeech(healedResponseText, {
        language: session.agentContext?.language || 'hi-IN',
        gender: session.agentContext?.gender || 'female',
      });
      emit('audio-response', audioResponse);
      emit('processing-status', { status: 'idle' });

    } catch (error) {
      this.logger.error(`[${clientId}] Audio pipeline error: ${error.message}`, error.stack);
      emit('error', { message: 'Pipeline error occurred.' });
    } finally {
      // Always release the processing lock
      const lockSession = await this.redisService.get<DemoSession>(sessionKey);
      if (lockSession && lockSession.isProcessing) {
        lockSession.isProcessing = false;
        await this.redisService.set(sessionKey, lockSession, 3600);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────

  async cleanupSession(clientId: string) {
    await this.redisService.del(`call:${clientId}`);
    await this.conversationMemory.clearMemory(clientId);
    this.logger.log(`[${clientId}] Session cleaned up`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async handleTimeout(
    clientId: string,
    session: DemoSession,
    emit: (event: string, payload: any) => void,
  ) {
    this.logger.warn(`[${clientId}] Demo session timed out`);
    const lang = session.agentContext?.language;
    const timeoutMsg =
      lang === 'hi-IN' || lang === 'hinglish'
        ? 'Aapka muft demo seema paar ho gayi hai. AI voice calling ka upyog jaari rakhne ke liye kripya apne subscription ko upgrade karein!'
        : 'Your free demo limit has been reached. Please upgrade your subscription to continue using AI voice calling.';

    emit('transcript', { role: 'agent', text: timeoutMsg });
    emit('processing-status', { status: 'speaking' });
    try {
      const audio = await this.ttsService.generateSpeech(timeoutMsg, {
        language: session.agentContext?.language || 'hi-IN',
        gender: session.agentContext?.gender || 'female',
      });
      emit('audio-response', audio);
    } catch {}
    emit('processing-status', { status: 'idle' });
    emit('demo-stopped', { reason: 'timeout' });
    await this.cleanupSession(clientId);
  }
}
