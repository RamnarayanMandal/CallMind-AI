import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Buffer } from 'buffer';
import { ITtsProvider, TtsOptions, TtsResult } from './tts.provider';

@Injectable()
export class OpenAiTtsProvider implements ITtsProvider {
  private readonly logger = new Logger(OpenAiTtsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async synthesize(text: string, options?: TtsOptions): Promise<TtsResult> {
    const startTime = Date.now();
    try {
      this.logger.debug(`Synthesizing speech with OpenAI TTS Provider for text: "${text.substring(0, 50)}..."`);
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');

      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      // Default voice to alloy (can be overridden by options)
      const voice = options?.voice || 'alloy';
      const speed = options?.speed || 1.0;

      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: voice,
          input: text,
          speed: speed,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: 'arraybuffer',
          timeout: 8000,
        }
      );

      const latencyMs = Date.now() - startTime;
      this.logger.log(`OpenAI TTS completed in ${latencyMs}ms`);

      return {
        audioBuffer: Buffer.from(response.data),
        mimeType: 'audio/mpeg',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logger.error(`OpenAI TTS failed in ${latencyMs}ms: ${error.message}`);
      throw error;
    }
  }
}
