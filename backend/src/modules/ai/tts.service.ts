import { Injectable, Logger, Inject } from '@nestjs/common';
import { TTS_PROVIDER, ITtsProvider } from '@providers/tts/tts.provider';
import axios from 'axios';
import { Buffer } from 'buffer';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(
    @Inject(TTS_PROVIDER) private readonly ttsProvider: ITtsProvider,
  ) {}

  async generateSpeech(text: string): Promise<Buffer> {
    try {
      this.logger.debug(`TtsService delegating to dynamic TTS Provider for text: "${text.substring(0, 50)}..."`);
      // Synthesize audio
      const result = await this.ttsProvider.synthesize(text, {
        language: 'hi-IN', // Defaulting to Hindi for dynamic calling system
        gender: 'female',  // SANGEETA is female
      });
      return result.audioBuffer;
    } catch (error) {
      this.logger.error('Error in TtsService delegating to TTS Provider. Trying Google fallback...', error);
      try {
        // Fallback to Google Translate TTS (free, unauthenticated)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=hi&client=tw-ob`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      } catch (fallbackError) {
        this.logger.error('Error generating speech in fallback', fallbackError);
        throw fallbackError;
      }
    }
  }
}
