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
    this.apiUrl =
      this.configService.get<string>('sarvam.apiUrl') ||
      this.configService.get<string>('SARVAM_API_URL') ||
      'https://api.sarvam.ai/v1';
    this.apiKey =
      this.configService.get<string>('sarvam.apiKey') ||
      this.configService.get<string>('SARVAM_API_KEY');
  }

  // ── Non-streaming ──────────────────────────────────────────────────────────
  async generateResponse(
    messages: LlmMessage[],
    temperature = 0.7,
    signal?: AbortSignal,             // ← new
  ): Promise<LlmResponse> {
    const startTime = Date.now();
    try {
      this.logger.debug('Generating response using Sarvam AI Provider (sarvam-30b)...');

      if (!this.apiKey) throw new Error('SARVAM_API_KEY is not configured');

      const sanitisedMessages = this.sanitiseMessages(messages);

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'sarvam-30b',
          messages: sanitisedMessages,
          temperature,
          max_tokens: 300,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 8000,
          signal,                       // ← axios respects AbortSignal natively
        },
      );

      const choice = response.data.choices[0];
      let reply = this.censorSystemNames(choice.message.content);

      const latencyMs = Date.now() - startTime;
      this.logger.log(`Sarvam AI generated response in ${latencyMs}ms`);

      return {
        content: reply,
        tokensUsed: response.data.usage?.total_tokens,
        model: response.data.model || 'sarvam-30b',
        latencyMs,
      };
    } catch (error) {
      // Don't log noise when we intentionally cancelled
      if (axios.isCancel(error) || error?.name === 'AbortError') {
        this.logger.debug('Sarvam AI request cancelled (call hung up)');
        throw error;
      }
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      this.logger.error(`Sarvam AI Provider failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }

  // ── Streaming ──────────────────────────────────────────────────────────────
  async generateResponseStream(
    messages: LlmMessage[],
    onChunk: (chunk: string) => void,
    temperature = 0.7,
    signal?: AbortSignal,             // ← new
  ): Promise<LlmResponse> {
    const startTime = Date.now();
    try {
      this.logger.debug('Generating streaming response using Sarvam AI Provider (sarvam-30b)...');

      if (!this.apiKey) throw new Error('SARVAM_API_KEY is not configured');

      const sanitisedMessages = this.sanitiseMessages(messages);

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
          signal,                       // ← axios respects AbortSignal natively
        },
      );

      let fullText = '';
      let buffer   = '';

      return new Promise<LlmResponse>((resolve, reject) => {
        // If signal fires mid-stream, destroy the stream
        signal?.addEventListener('abort', () => {
          response.data.destroy?.();
          reject(new Error('AbortError'));
        });

        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          let boundary = buffer.indexOf('\n');
          while (boundary !== -1) {
            const line = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);
            boundary = buffer.indexOf('\n');

            if (line.includes('[DONE]')) continue;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  const censored = this.censorSystemNames(content);
                  fullText += censored;
                  onChunk(censored);
                }
              } catch (_) { /* partial chunk — ignore */ }
            }
          }
        });

        response.data.on('end', () => {
          const latencyMs = Date.now() - startTime;
          this.logger.log(`Sarvam AI stream completed in ${latencyMs}ms`);
          resolve({ content: fullText, model: 'sarvam-30b', latencyMs });
        });

        response.data.on('error', (err: any) => reject(err));
      });
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') {
        this.logger.debug('Sarvam AI stream cancelled (call hung up)');
        throw error;
      }
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      this.logger.error(`Sarvam AI Provider stream failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private sanitiseMessages(messages: LlmMessage[]): LlmMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content:
        msg.role === 'system'
          ? msg.content +
            '\nCRITICAL: Never mention "Sarvam", "Sarvam AI", "OpenAI", "ChatGPT", "GPT", or internal systems. You are exclusively a human voice assistant representing the organization.'
          : msg.content,
    }));
  }

  private censorSystemNames(text: string): string {
    if (!text) return '';
    return text
      .replace(/sarvam\s*ai/gi, 'Assistant')
      .replace(/sarvam/gi,      'Assistant')
      .replace(/openai/gi,      'Assistant')
      .replace(/chatgpt/gi,     'Assistant')
      .replace(/gpt-4o/gi,      'Assistant')
      .replace(/gpt/gi,         'Assistant');
  }
}