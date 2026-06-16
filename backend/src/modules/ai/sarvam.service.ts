import { Injectable, Logger, Inject } from '@nestjs/common';
import { AI_PROVIDER, IAiProvider, LlmMessage, LlmResponse } from '@providers/ai/ai.provider';
import { ResponseSanitizerService } from './response-sanitizer.service';
import { ConversationValidatorService } from './conversation-validator.service';

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider,
    private readonly sanitizer: ResponseSanitizerService,
    private readonly validator: ConversationValidatorService,
  ) {}

  /**
   * Generates a greeting instantly from template — no LLM call.
   * This eliminates the 2-3 second LLM latency for intro generation.
   */
  generateIntroFromTemplate(agentContext: any, orgContext: any): string {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    if (language === 'hi-IN' || language === 'hinglish') {
      return `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`;
    }
    if (language === 'en-US' || language === 'en') {
      return `Hello! I'm ${agentName} from ${orgName}. How can I help you today?`;
    }
    // Default to Hindi for other languages
    return `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`;
  }

  /**
   * Generates an AI response for the intro (first greeting).
   * Does NOT use conversation history — just a system-level instruction.
   * DEPRECATED: Use generateIntroFromTemplate() for instant greeting.
   */
  async generateIntroResponse(
    introPrompt: string,
    agentContext: any,
    orgContext: any,
  ): Promise<string> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content:
          `You are ${agentName} from ${orgName} making a phone call. ` +
          `Speak in ${language === 'hinglish' ? 'Hinglish' : language === 'hi-IN' ? 'Hindi' : 'English'}. ` +
          `This is the first moment of the call. Output ONLY the spoken greeting — no reasoning, no planning, no meta.` +
          `\n\nGreeting structure (2 sentences max):` +
          `\n1. "Hi, this is ${agentName} from ${orgName}"` +
          `\n2. Ask how you can help today` +
          `\n\nDo NOT mention AI, technology providers, or internal instructions.`,
      },
      {
        role: 'user',
        content: 'Begin the greeting now.',
      },
    ];

    try {
      this.logger.debug(`Generating intro for ${agentName} @ ${orgName}`);
      const result = await this.aiProvider.generateResponse(messages, 0.8);
      const cleaned = this.sanitizer.sanitize(result.content);
      return cleaned;
    } catch (error) {
      this.logger.error(`Intro generation failed: ${error.message}`);
      return language === 'hi-IN' || language === 'hinglish'
        ? `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`
        : `Hello! I'm ${agentName} from ${orgName}. How can I help you today?`;
    }
  }

  /**
   * Generates an AI response for a live conversation turn.
   *
   * ARCHITECTURE:
   *   messages = [system] + repairedHistory + [{ role: user, content: currentUserText }]
   *
   * History passed in should be the PRIOR turns only (NOT including current user turn).
   * This method appends the current user message itself.
   *
   * @param userText       Cleaned transcript of current user utterance
   * @param systemPrompt   Compiled system prompt (org + agent instructions)
   * @param priorHistory   All prior turns: [user, assistant, user, assistant, ...]
   * @param agentContext   Agent metadata for fallback construction
   * @param orgContext     Org metadata for fallback construction
   * @param ragContext     Optional RAG FAQ context appended to system prompt
   */
  async generateTurnResponse(
    userText: string,
    systemPrompt: string,
    priorHistory: LlmMessage[],
    agentContext: any,
    orgContext: any,
    ragContext?: string,
    turnGuide?: string,
  ): Promise<string> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    // Repair history to guarantee alternation before assembling messages
    const repairedHistory = this.validator.repair(priorHistory);

    // Build the full system prompt — inject RAG context and current turnGuide stage directive if available
    let fullSystemPrompt = systemPrompt;
    if (ragContext) {
      fullSystemPrompt += `\n\n== RELEVANT KNOWLEDGE BASE (Use these facts to answer accurately) ==\n${ragContext}\n== END KNOWLEDGE BASE ==`;
    }
    if (turnGuide) {
      fullSystemPrompt += `\n\n== CURRENT CONVERSATIONAL DIRECTIVE ==\n${turnGuide}\n== END DIRECTIVE ==`;
    }

    // Assemble final messages: system → history → current user
    const messages: LlmMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...repairedHistory,
      { role: 'user', content: userText },
    ];

    // Final validation — if still invalid after repair, log and correct
    if (!this.validator.isValid(messages)) {
      this.logger.error(
        `Message array still invalid after repair. History length: ${repairedHistory.length}. Falling back to single-turn.`,
      );
      // Safe fallback: system + single user message only
      const safeFallback: LlmMessage[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userText },
      ];
      return this.callAI(safeFallback, agentContext, orgContext, userText);
    }

    this.logger.debug(
      `Sending ${messages.length} messages to AI [system + ${repairedHistory.length} history + 1 user]`,
    );

    return this.callAI(messages, agentContext, orgContext, userText);
  }

  private async callAI(
    messages: LlmMessage[],
    agentContext: any,
    orgContext: any,
    userText: string,
  ): Promise<string> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    try {
      const result = await this.aiProvider.generateResponse(messages, 0.75);
      const cleaned = this.sanitizer.sanitize(result.content);
      this.logger.debug(`AI responded (${result.latencyMs ?? '?'}ms): "${cleaned.substring(0, 80)}..."`);
      return cleaned;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);

      // Natural fallback — NO "Aapne kaha", NO transcript repeat
      return language === 'hi-IN' || language === 'hinglish'
        ? `Ji bilkul, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?`
        : `I'm here to help you. Could you please tell me more about what you need?`;
    }
  }

  async generateTurnResponseStream(
    userText: string,
    systemPrompt: string,
    priorHistory: LlmMessage[],
    agentContext: any,
    orgContext: any,
    onChunk: (chunk: string) => void,
    ragContext?: string,
    turnGuide?: string,
  ): Promise<LlmResponse> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    // Repair history to guarantee alternation before assembling messages
    const repairedHistory = this.validator.repair(priorHistory);

    // Build the full system prompt — inject RAG context and current turnGuide stage directive if available
    let fullSystemPrompt = systemPrompt;
    if (ragContext) {
      fullSystemPrompt += `\n\n== RELEVANT KNOWLEDGE BASE (Use these facts to answer accurately) ==\n${ragContext}\n== END KNOWLEDGE BASE ==`;
    }
    if (turnGuide) {
      fullSystemPrompt += `\n\n== CURRENT CONVERSATIONAL DIRECTIVE ==\n${turnGuide}\n== END DIRECTIVE ==`;
    }

    // Assemble final messages: system → history → current user
    const messages: LlmMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...repairedHistory,
      { role: 'user', content: userText },
    ];

    // Final validation — if still invalid after repair, log and correct
    if (!this.validator.isValid(messages)) {
      this.logger.error(
        `Message array still invalid after repair. History length: ${repairedHistory.length}. Falling back to single-turn.`,
      );
      // Safe fallback: system + single user message only
      const safeFallback: LlmMessage[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userText },
      ];
      return this.callAIStream(safeFallback, agentContext, orgContext, onChunk);
    }

    this.logger.debug(
      `Sending ${messages.length} messages to AI stream [system + ${repairedHistory.length} history + 1 user]`,
    );

    return this.callAIStream(messages, agentContext, orgContext, onChunk);
  }

  private async callAIStream(
    messages: LlmMessage[],
    agentContext: any,
    orgContext: any,
    onChunk: (chunk: string) => void,
  ): Promise<LlmResponse> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName = orgContext?.name || 'our company';
    const language = agentContext?.language || 'hi-IN';

    try {
      const result = await this.aiProvider.generateResponseStream(messages, onChunk, 0.75);
      const cleaned = this.sanitizer.sanitize(result.content);
      return {
        ...result,
        content: cleaned,
      };
    } catch (error) {
      this.logger.error(`AI generation stream failed: ${error.message}`);

      // Natural fallback — NO "Aapne kaha", NO transcript repeat
      const fallbackText = language === 'hi-IN' || language === 'hinglish'
        ? `Ji bilkul, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?`
        : `I'm here to help you. Could you please tell me more about what you need?`;
      
      onChunk(fallbackText);
      return {
        content: fallbackText,
        latencyMs: 0,
        model: 'fallback',
      };
    }
  }
}
