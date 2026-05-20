import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAiProvider, LlmMessage, LlmResponse } from './ai.provider';

@Injectable()
export class SarvamAiProvider implements IAiProvider {
  private readonly logger = new Logger(SarvamAiProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('sarvam.apiUrl') || this.configService.get<string>('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';
    this.apiKey = this.configService.get<string>('sarvam.apiKey') || this.configService.get<string>('SARVAM_API_KEY');
  }

  async generateResponse(messages: LlmMessage[], temperature = 0.7): Promise<LlmResponse> {
    const startTime = Date.now();
    try {
      this.logger.debug('Generating response using Sarvam AI Provider (sarvam-m)...');

      if (!this.apiKey) {
        throw new Error('SARVAM_API_KEY is not configured');
      }

      // Filter/clean messages to prevent exposing AI providers or internal names
      const sanitisedMessages = messages.map(msg => {
        let content = msg.content;
        // Clean out any direct instructions or system references that might cause leaks
        if (msg.role === 'system') {
          content += '\nCRITICAL: Never mention "Sarvam", "Sarvam AI", "OpenAI", "ChatGPT", "GPT", or internal systems. You are exclusively a human voice assistant representing the organization.';
        }
        return {
          role: msg.role,
          content: content,
        };
      });

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'sarvam-m',
          messages: sanitisedMessages,
          temperature,
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 25000,
        }
      );

      const choice = response.data.choices[0];
      let reply = choice.message.content;

      // Final safety check to make sure the AI didn't leak system names
      reply = this.censorSystemNames(reply);

      const latencyMs = Date.now() - startTime;
      this.logger.log(`Sarvam AI generated response in ${latencyMs}ms`);

      return {
        content: reply,
        tokensUsed: response.data.usage?.total_tokens,
        model: response.data.model || 'sarvam-m',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Sarvam AI Provider failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
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
