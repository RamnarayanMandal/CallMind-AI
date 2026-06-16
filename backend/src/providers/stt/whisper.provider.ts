import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Buffer } from 'buffer';
import { ISttProvider, SttResult } from './stt.provider';

@Injectable()
export class WhisperSttProvider implements ISttProvider {
  private readonly logger = new Logger(WhisperSttProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async transcribe(audioBuffer: Buffer, language?: string): Promise<SttResult> {
    const startTime = Date.now();
    try {
      this.logger.debug('Transcribing audio with OpenAI Whisper Provider...');
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      const formData = new FormData();
      // Whisper expects a file. We wrap the buffer in a Blob as standard.
      formData.append('file', new Blob([audioBuffer as any], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'whisper-1');
      if (language) {
        formData.append('language', language.split('-')[0]); // e.g. 'hi' or 'en'
      }

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 8000,
      });

      const latencyMs = Date.now() - startTime;
      this.logger.log(`OpenAI Whisper completed in ${latencyMs}ms`);

      if (response.data && response.data.text) {
        return {
          transcript: response.data.text,
          language: language || 'en',
          latencyMs,
        };
      }

      throw new Error('No transcript returned from OpenAI Whisper');
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`OpenAI Whisper failed in ${latencyMs}ms: ${errorMessage}`);
      throw error;
    }
  }
}
