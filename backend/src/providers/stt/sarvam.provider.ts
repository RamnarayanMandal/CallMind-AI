import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Buffer } from 'buffer';
import { ISttProvider, SttResult } from './stt.provider';

@Injectable()
export class SarvamSttProvider implements ISttProvider {
  private readonly logger = new Logger(SarvamSttProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async transcribe(audioBuffer: Buffer, language?: string): Promise<SttResult> {
    const startTime = Date.now();
    try {
      this.logger.debug('Transcribing audio with Sarvam STT Provider...');
      const sarvamKey = this.configService.get<string>('sarvam.apiKey') || this.configService.get<string>('SARVAM_API_KEY');
      const sarvamUrl = this.configService.get<string>('sarvam.apiUrl') || this.configService.get<string>('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';

      if (!sarvamKey) {
        throw new Error('SARVAM_API_KEY is not configured');
      }

      const baseUrl = sarvamUrl.replace(/\/v1\/?$/, '');
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer as any], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'saaras:v3');
      
      // Map language code to standard Sarvam-compatible regional codes
      let langCode = language || 'hi-IN';
      const cleanLang = langCode.toLowerCase().trim();
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
        langCode = langMapping[cleanLang];
      }
      formData.append('language_code', langCode);

      const response = await axios.post(`${baseUrl}/speech-to-text`, formData, {
        headers: {
          'Authorization': `Bearer ${sarvamKey}`,
          'api-subscription-key': sarvamKey,
        },
      });

      const latencyMs = Date.now() - startTime;
      this.logger.log(`Sarvam STT completed in ${latencyMs}ms`);

      if (response.data && response.data.transcript) {
        return {
          transcript: response.data.transcript,
          language: langCode,
          latencyMs,
          confidence: response.data.confidence,
        };
      }

      throw new Error('No transcript returned from Sarvam STT');
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Sarvam STT failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }
}
