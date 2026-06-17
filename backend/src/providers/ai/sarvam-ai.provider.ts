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
      this.logger.debug('Generating response using Sarvam AI Provider (sarvam-30b)...');

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
          model: 'sarvam-30b',
          messages: sanitisedMessages,
          temperature,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 8000,
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
        model: response.data.model || 'sarvam-30b',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Sarvam AI Provider failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }

  async generateResponseStream(
    messages: LlmMessage[],
    onChunk: (chunk: string) => void,
    temperature = 0.7
  ): Promise<LlmResponse> {
    const startTime = Date.now();
    try {
      this.logger.debug('Generating streaming response using Sarvam AI Provider (sarvam-30b)...');

      if (!this.apiKey) {
        throw new Error('SARVAM_API_KEY is not configured');
      }

      const sanitisedMessages = messages.map(msg => {
        let content = msg.content;
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
          model: 'sarvam-30b',
          messages: sanitisedMessages,
          temperature,
          max_tokens: 150,
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: 'stream',
          timeout: 8000,
        }
      );

      let fullText = '';
      let buffer = '';

      return new Promise<LlmResponse>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          let boundary = buffer.indexOf('\n');
          while (boundary !== -1) {
            const line = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);
            boundary = buffer.indexOf('\n');

            if (line.includes('[DONE]')) {
              continue;
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  const censored = this.censorSystemNames(content);
                  fullText += censored;
                  onChunk(censored);
                }
              } catch (e) {
                // Ignore parsing errors for split chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          const latencyMs = Date.now() - startTime;
          this.logger.log(`Sarvam AI stream completed in ${latencyMs}ms`);
          resolve({
            content: fullText,
            model: 'sarvam-30b',
            latencyMs,
          });
        });

        response.data.on('error', (err: any) => {
          reject(err);
        });
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Sarvam AI Provider stream failed in ${latencyMs}ms: ${errorMessage}`);
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
