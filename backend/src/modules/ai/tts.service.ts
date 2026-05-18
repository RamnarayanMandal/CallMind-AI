import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private configService: ConfigService) {}

  async generateSpeech(text: string): Promise<Buffer> {
    this.logger.debug(`Generating TTS for: "${text}"`);
    
    const openAiKey = this.configService.get('OPENAI_API_KEY');
    if (openAiKey) {
      try {
        this.logger.debug('Using OpenAI TTS for demo');
        const response = await axios.post(
          'https://api.openai.com/v1/audio/speech',
          {
            model: 'tts-1',
            voice: 'alloy',
            input: text,
          },
          {
            headers: {
              Authorization: `Bearer ${openAiKey}`,
            },
            responseType: 'arraybuffer',
          }
        );
        return Buffer.from(response.data);
      } catch (openAiError) {
        this.logger.warn(`OpenAI TTS failed (${openAiError.message}), falling back...`);
      }
    }

    try {
      // Fallback to Google Translate TTS (free, unauthenticated)
      this.logger.debug('Using fallback TTS for demo');
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=hi&client=tw-ob`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (fallbackError) {
      this.logger.error('Error generating speech in fallback', fallbackError);
      throw fallbackError;
    }
  }
}
