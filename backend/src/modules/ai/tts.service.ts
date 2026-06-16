import { Injectable, Logger, Inject } from '@nestjs/common';
import { TTS_PROVIDER, ITtsProvider, TtsOptions, TtsResult } from '@providers/tts/tts.provider';
import axios from 'axios';
import { Buffer } from 'buffer';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(
    @Inject(TTS_PROVIDER) private readonly ttsProvider: ITtsProvider,
  ) {}

  async synthesize(text: string, options?: TtsOptions): Promise<TtsResult> {
    try {
      this.logger.debug(`TtsService.synthesize delegating to dynamic TTS Provider for text: "${text.substring(0, 50)}..."`);
      const result = await this.ttsProvider.synthesize(text, {
        language: options?.language || 'hi-IN',
        gender: (options?.gender as any) || 'female',
        voice: options?.voice,
      });
      return result;
    } catch (error) {
      this.logger.error('Error in TtsService.synthesize delegating to TTS Provider. Trying Google fallback...', error);
      try {
        const lang = options?.language || 'hi-IN';
        const googleLang = lang.split('-')[0];
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${googleLang}&client=tw-ob`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return {
          audioBuffer: Buffer.from(response.data),
          mimeType: 'audio/mpeg',
          latencyMs: 0,
        };
      } catch (fallbackError) {
        this.logger.error('Error generating speech in fallback', fallbackError);
        throw fallbackError;
      }
    }
  }

  async generateSpeech(text: string, options?: TtsOptions): Promise<Buffer> {
    const result = await this.synthesize(text, options);
    return result.audioBuffer;
  }
}
