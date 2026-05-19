import { Injectable, Logger, Inject } from '@nestjs/common';
import { AI_PROVIDER, IAiProvider, LlmMessage } from '@providers/ai/ai.provider';
import { ResponseSanitizerService } from './response-sanitizer.service';

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider,
    private readonly sanitizer: ResponseSanitizerService,
  ) { }

  async generateResponse(
    text: string,
    agentContext: any,
    isIntro: boolean = false,
    orgContext?: any,
  ): Promise<string> {
    const orgName = orgContext?.name || 'our company';
    const agentName = agentContext?.name || 'SANGEETA';

    try {
      this.logger.debug(`SarvamService delegating to dynamic AI Provider for agent ${agentName} representing ${orgName}`);

      let rawContent = '';

      // Handle intro message dynamically using LLM
      if (isIntro) {
        const messages: LlmMessage[] = [
          {
            role: 'system',
            content: text + '\n\nCRITICAL RULES:\n- Generate ONLY the opening greeting.\n- Never output thinking process, reasoning steps, internal analysis, or XML tags (like <think>).\n- Do not use markdown tags, stars, or brackets.'
          }
        ];
        const result = await this.aiProvider.generateResponse(messages);
        rawContent = result.content;
      } else {
        // If user input is provided, we format it as user message
        const formattedMessages: LlmMessage[] = [
          {
            role: 'system',
            content: `You are ${agentName}, a voice assistant representing ${orgName}.
System instructions: ${agentContext?.generatedSystemPrompt || agentContext?.systemPrompt || 'Answer questions politely.'}
CRITICAL RULES:
- Respond in the language requested: ${agentContext?.language || 'hi-IN'}.
- Keep the response short, conversational, and voice-only.
- Never output thinking process, internal reasoning, analysis, or any hidden notes.
- NEVER use XML tags (like <think> or </think>) or markdown formatting.
- Never mention OpenAI, Sarvam AI, or internal systems. You represent ${orgName}.`
          },
          { role: 'user', content: text }
        ];

        const result = await this.aiProvider.generateResponse(formattedMessages);
        rawContent = result.content;
      }

      // Process raw output through structural response sanitizer to strip reasoning blocks
      const cleanContent = this.sanitizer.sanitize(rawContent);
      this.logger.debug(`Raw: [${rawContent.substring(0, 100)}...] -> Cleaned: [${cleanContent}]`);
      return cleanContent;
    } catch (error) {
      this.logger.error('Error in SarvamService delegating to AI Provider', error);

      // Conversational dynamic fallback
      if (isIntro) {
        return agentContext?.language === 'hi-IN' || agentContext?.language === 'hinglish'
          ? `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Main aapki kya madad kar kar sakti hoon?`
          : `Hello! I am ${agentName} representing ${orgName}. How can I help you today?`;
      }

      const lastSegment = text.length > 50 ? text.substring(text.length - 50) : text;
      const fallbackCleanMsg = agentContext?.language === 'hi-IN' || agentContext?.language === 'hinglish'
        ? `Aapne kaha: "${lastSegment}". Main aapki help ${orgName} ke services ke baare mein kar sakti hoon. Kripya batayein aapko kya janna hai?`
        : `You said: "${lastSegment}". I am here to help you with ${orgName}'s products and services. What would you like to know?`;
      
      return this.sanitizer.sanitize(fallbackCleanMsg);
    }
  }
}
