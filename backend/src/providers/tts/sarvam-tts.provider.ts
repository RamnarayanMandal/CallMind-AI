import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Buffer } from 'buffer';
import { ITtsProvider, TtsOptions, TtsResult } from './tts.provider';

@Injectable()
export class SarvamTtsProvider implements ITtsProvider {
  private readonly logger = new Logger(SarvamTtsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async synthesize(text: string, options?: TtsOptions): Promise<TtsResult> {
    const startTime = Date.now();
    try {
      this.logger.debug(`Synthesizing speech with Sarvam TTS Provider for text: "${text.substring(0, 50)}..."`);
      const sarvamKey = this.configService.get<string>('sarvam.apiKey') || this.configService.get<string>('SARVAM_API_KEY');
      const sarvamUrl = this.configService.get<string>('sarvam.apiUrl') || this.configService.get<string>('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';

      if (!sarvamKey) {
        throw new Error('SARVAM_API_KEY is not configured');
      }

      const baseUrl = sarvamUrl.replace(/\/v1\/?$/, '');
      const endpoint = `${baseUrl}/text-to-speech`;

      // Select voice/speaker
      // Default to "ritu" for female and "shubh" for male/default, in lowercase
      let speaker = 'ritu';
      if (options?.voice) {
        speaker = options.voice.toLowerCase();
      } else if (options?.gender === 'male') {
        speaker = 'shubh';
      }

      // Map language code to standard Sarvam-compatible regional codes
      let targetLanguageCode = options?.language || 'hi-IN';
      const cleanLang = targetLanguageCode.toLowerCase().trim();
      const langMapping: Record<string, string> = {
        en: 'en-IN',
        'en-in': 'en-IN',
        'en-us': 'en-IN',
        hi: 'hi-IN',
        'hi-in': 'hi-IN',
        hinglish: 'hi-IN',
        bn: 'bn-IN',
        'bn-in': 'bn-IN',
        ta: 'ta-IN',
        'ta-in': 'ta-IN',
        te: 'te-IN',
        'te-in': 'te-IN',
        mr: 'mr-IN',
        'mr-in': 'mr-IN',
        gu: 'gu-IN',
        'gu-in': 'gu-IN',
        kn: 'kn-IN',
        'kn-in': 'kn-IN',
        ml: 'ml-IN',
        'ml-in': 'ml-IN',
        pa: 'pa-IN',
        'pa-in': 'pa-IN',
        ur: 'ur-IN',
        'ur-in': 'ur-IN',
        or: 'or-IN',
        'or-in': 'or-IN',
        as: 'as-IN',
        'as-in': 'as-IN',
      };
      if (langMapping[cleanLang]) {
        targetLanguageCode = langMapping[cleanLang];
      }

      const response = await axios.post(
        endpoint,
        {
          text: text,
          target_language_code: targetLanguageCode,
          speaker: speaker,
          model: 'bulbul:v3',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamKey,
          },
        }
      );

      const latencyMs = Date.now() - startTime;
      this.logger.log(`Sarvam TTS completed in ${latencyMs}ms`);

      if (response.data && response.data.audios && response.data.audios.length > 0) {
        const base64Audio = response.data.audios[0];
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        return {
          audioBuffer,
          mimeType: 'audio/wav', // Bulbul v3 default is WAV
          latencyMs,
        };
      }

      throw new Error('No audio content returned in Sarvam TTS response');
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Sarvam TTS failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }
}
