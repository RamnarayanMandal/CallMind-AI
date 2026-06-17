import { Injectable, Logger, Inject } from '@nestjs/common';
import { AI_PROVIDER, IAiProvider, LlmMessage, LlmResponse } from '@providers/ai/ai.provider';
import { ResponseSanitizerService } from './response-sanitizer.service';
import { ConversationValidatorService } from './conversation-validator.service';
import { isFallbackResponse } from '../../constants';

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider,
    private readonly sanitizer: ResponseSanitizerService,
    private readonly validator: ConversationValidatorService,
  ) {}

  // ── Template greeting (no LLM, instant) ───────────────────────────────────
  generateIntroFromTemplate(agentContext: any, orgContext: any): string {
    const agentName = agentContext?.name || 'Assistant';
    const orgName   = orgContext?.name   || 'our company';
    const language  = agentContext?.language || 'hi-IN';

    if (language === 'hi-IN' || language === 'hinglish') {
      return `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`;
    }
    if (language === 'en-US' || language === 'en') {
      return `Hello! I'm ${agentName} from ${orgName}. How can I help you today?`;
    }
    return `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`;
  }

  // ── Deprecated intro via LLM ───────────────────────────────────────────────
  async generateIntroResponse(
    introPrompt: string,
    agentContext: any,
    orgContext: any,
  ): Promise<string> {
    const agentName = agentContext?.name || 'Assistant';
    const orgName   = orgContext?.name   || 'our company';
    const language  = agentContext?.language || 'hi-IN';

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
      { role: 'user', content: 'Begin the greeting now.' },
    ];

    try {
      const result  = await this.aiProvider.generateResponse(messages, 0.8);
      return this.sanitizer.sanitize(result.content);
    } catch (error) {
      this.logger.error(`Intro generation failed: ${error.message}`);
      return language === 'hi-IN' || language === 'hinglish'
        ? `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`
        : `Hello! I'm ${agentName} from ${orgName}. How can I help you today?`;
    }
  }

  // ── Main turn response ─────────────────────────────────────────────────────
  async generateTurnResponse(
    userText: string,
    systemPrompt: string,
    priorHistory: LlmMessage[],
    agentContext: any,
    orgContext: any,
    ragContext?: string,
    turnGuide?: string,
    signal?: AbortSignal,             // ← Phase 2: abort support
  ): Promise<string> {
    const repairedHistory = this.validator.repair(priorHistory);

    let fullSystemPrompt = systemPrompt;
    if (ragContext) {
      fullSystemPrompt += `\n\n== RELEVANT KNOWLEDGE BASE ==\n${ragContext}\n== END KNOWLEDGE BASE ==`;
    }
    if (turnGuide) {
      fullSystemPrompt += `\n\n== CURRENT CONVERSATIONAL DIRECTIVE ==\n${turnGuide}\n== END DIRECTIVE ==`;
    }

    const messages: LlmMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...repairedHistory,
      { role: 'user', content: userText },
    ];

    if (!this.validator.isValid(messages)) {
      this.logger.error(
        `Message array still invalid after repair. History length: ${repairedHistory.length}. Falling back to single-turn.`,
      );
      const safeFallback: LlmMessage[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userText },
      ];
      return this.callAI(safeFallback, agentContext, orgContext, signal);
    }

    this.logger.debug(
      `Sending ${messages.length} messages to AI [system + ${repairedHistory.length} history + 1 user]`,
    );

    return this.callAI(messages, agentContext, orgContext, signal);
  }

  private async callAI(
    messages: LlmMessage[],
    agentContext: any,
    orgContext: any,
    signal?: AbortSignal,             // ← Phase 2
  ): Promise<string> {
    const language = agentContext?.language || 'hi-IN';

    try {
      const result  = await this.aiProvider.generateResponse(messages, 0.75, signal);
      const rawLength = result.content.length;

      this.logger.log(
        `[RAW_LLM_RESPONSE] length=${rawLength} tokens=${result.tokensUsed ?? '?'} ` +
        `preview="${result.content.substring(0, 120)}"`,
      );

      const cleaned = this.sanitizer.sanitize(result.content);

      this.logger.log(
        `[PARSED_LLM_RESPONSE] length=${cleaned.length} fallback=${isFallbackResponse(cleaned)} ` +
        `text="${cleaned.substring(0, 80)}"`,
      );

      return cleaned;
    } catch (error) {
      // Re-throw cancellations — let the caller handle them
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') throw error;

      this.logger.error(`[LLM_ERROR] AI generation failed: ${error.message}`);
      return language === 'hi-IN' || language === 'hinglish'
        ? 'Ji bilkul, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?'
        : "I'm here to help you. Could you please tell me more about what you need?";
    }
  }

  // ── Streaming turn response ────────────────────────────────────────────────
  async generateTurnResponseStream(
    userText: string,
    systemPrompt: string,
    priorHistory: LlmMessage[],
    agentContext: any,
    orgContext: any,
    onChunk: (chunk: string) => void,
    ragContext?: string,
    turnGuide?: string,
    signal?: AbortSignal,             // ← Phase 2
  ): Promise<LlmResponse> {
    const repairedHistory = this.validator.repair(priorHistory);

    let fullSystemPrompt = systemPrompt;
    if (ragContext) {
      fullSystemPrompt += `\n\n== RELEVANT KNOWLEDGE BASE ==\n${ragContext}\n== END KNOWLEDGE BASE ==`;
    }
    if (turnGuide) {
      fullSystemPrompt += `\n\n== CURRENT CONVERSATIONAL DIRECTIVE ==\n${turnGuide}\n== END DIRECTIVE ==`;
    }

    const messages: LlmMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...repairedHistory,
      { role: 'user', content: userText },
    ];

    if (!this.validator.isValid(messages)) {
      this.logger.error(
        `Message array still invalid after repair. Falling back to single-turn stream.`,
      );
      const safeFallback: LlmMessage[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userText },
      ];
      return this.callAIStream(safeFallback, agentContext, orgContext, onChunk, signal);
    }

    this.logger.debug(
      `Sending ${messages.length} messages to AI stream [system + ${repairedHistory.length} history + 1 user]`,
    );

    return this.callAIStream(messages, agentContext, orgContext, onChunk, signal);
  }

  private async callAIStream(
    messages: LlmMessage[],
    agentContext: any,
    orgContext: any,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,             // ← Phase 2
  ): Promise<LlmResponse> {
    const language = agentContext?.language || 'hi-IN';

    try {
      const result  = await this.aiProvider.generateResponseStream(messages, onChunk, 0.75, signal);
      const cleaned = this.sanitizer.sanitize(result.content);
      return { ...result, content: cleaned };
    } catch (error) {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') throw error;

      this.logger.error(`AI generation stream failed: ${error.message}`);
      const fallbackText =
        language === 'hi-IN' || language === 'hinglish'
          ? 'Ji bilkul, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?'
          : "I'm here to help you. Could you please tell me more about what you need?";

      onChunk(fallbackText);
      return { content: fallbackText, latencyMs: 0, model: 'fallback' };
    }
  }
}