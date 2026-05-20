import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAiProvider, LlmMessage, LlmResponse } from './ai.provider';

@Injectable()
export class ExistingAiProvider implements IAiProvider {
  private readonly logger = new Logger(ExistingAiProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async generateResponse(messages: LlmMessage[], temperature = 0.7): Promise<LlmResponse> {
    const startTime = Date.now();
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (openAiKey) {
      try {
        this.logger.debug('Generating response with OpenAI GPT-4o-mini (Existing Provider)...');
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages,
            temperature,
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${openAiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          }
        );

        const latencyMs = Date.now() - startTime;
        this.logger.log(`OpenAI GPT-4o-mini generated response in ${latencyMs}ms`);

        const choice = response.data.choices[0];
        return {
          content: this.censorSystemNames(choice.message.content),
          tokensUsed: response.data.usage?.total_tokens,
          model: response.data.model || 'gpt-4o-mini',
          latencyMs,
        };
      } catch (openAiError) {
        this.logger.warn(`OpenAI LLM failed: ${openAiError.message}. Falling back to Sarvam/Mock...`);
      }
    }

    // Try Sarvam AI fallback
    const sarvamKey = this.configService.get<string>('SARVAM_API_KEY');
    const sarvamUrl = this.configService.get<string>('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';
    if (sarvamKey) {
      try {
        this.logger.debug('OpenAI unavailable. Falling back to Sarvam LM...');
        const response = await axios.post(
          `${sarvamUrl}/chat/completions`,
          {
            model: 'sarvam-m',
            messages,
            temperature,
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${sarvamKey}`,
              'api-subscription-key': sarvamKey,
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          }
        );

        const latencyMs = Date.now() - startTime;
        const choice = response.data.choices[0];
        return {
          content: this.censorSystemNames(choice.message.content),
          tokensUsed: response.data.usage?.total_tokens,
          model: response.data.model || 'sarvam-m',
          latencyMs,
        };
      } catch (sarvamError) {
        this.logger.warn(`Sarvam LLM fallback failed: ${sarvamError.message}`);
      }
    }

    // Mock fallback if both fail
    const latencyMs = Date.now() - startTime;
    this.logger.warn(`All LLM APIs failed. Using mock response in ${latencyMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Extract agent name and organization name dynamically from system message
    const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
    let agentName = 'Assistant';
    let orgName = 'our company';

    const agentMatch = systemMsg.match(/You are ([^,\.]+)/i);
    if (agentMatch) agentName = agentMatch[1].trim();

    const orgMatch = systemMsg.match(/representing ([^,\.\n]+)/i) || systemMsg.match(/representing\s+([A-Za-z0-9\s]+)/i) || systemMsg.match(/Company:\s*([^\n]+)/i);
    if (orgMatch) orgName = orgMatch[1].trim();

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    let responseText = `Namaste! Main ${agentName} bol rahi/raha hoon ${orgName} se. Main aapki kya madad kar sakti/sakta hoon?`;

    if (lastUserMessage) {
      if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('namaste')) {
        responseText = `Namaste! ${orgName} se ${agentName} bol rahi/raha hoon. Hum aapki kaise madad kar sakte hain?`;
      } else {
        responseText = `Aapne kaha: "${lastUserMessage.substring(0, 50)}". Main iske baare mein information check karke aapko bataati/bataata hoon.`;
      }
    }

    return {
      content: responseText,
      tokensUsed: 0,
      model: 'mock-fallback',
      latencyMs,
    };
  }

  private censorSystemNames(text: string): string {
    if (!text) return '';
    return text
      .replace(/sarvam\s*ai/gi, 'Assistant')
      .replace(/sarvam/gi, 'Assistant')
      .replace(/openai/gi, 'Assistant')
      .replace(/chatgpt/gi, 'Assistant')
      .replace(/gpt-4o/gi, 'Assistant')
      .replace(/gpt/gi, 'Assistant');
  }
}
