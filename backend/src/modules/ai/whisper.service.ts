import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);

  constructor(private configService: ConfigService) {}

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      this.logger.debug('Transcribing audio with Whisper...');
      
      const apiKey = this.configService.get('OPENAI_API_KEY');
      if (apiKey) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([audioBuffer as any], { type: 'audio/webm' }), 'audio.webm');
          formData.append('model', 'whisper-1');

          const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
          if (response.data && response.data.text) {
            return response.data.text;
          }
        } catch (openAiError) {
          this.logger.warn(`OpenAI Whisper failed: ${openAiError.message} - ${JSON.stringify(openAiError.response?.data || {})}`);
        }
      }

      // Try Sarvam AI STT
      const sarvamKey = this.configService.get('SARVAM_API_KEY');
      const sarvamUrl = this.configService.get('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';
      if (sarvamKey) {
        try {
          const baseUrl = sarvamUrl.replace(/\/v1\/?$/, '');
          const formData = new FormData();
          formData.append('file', new Blob([audioBuffer as any], { type: 'audio/webm' }), 'audio.webm');
          formData.append('model', 'saaras:v1');
          formData.append('language_code', 'hi-IN');

          const response = await axios.post(`${baseUrl}/speech-to-text`, formData, {
            headers: {
              'Authorization': `Bearer ${sarvamKey}`,
              'api-subscription-key': sarvamKey,
            },
          });
          if (response.data && response.data.transcript) {
            return response.data.transcript;
          }
        } catch (sarvamError) {
          this.logger.warn(`Sarvam STT failed: ${sarvamError.message} - ${JSON.stringify(sarvamError.response?.data || {})}`);
        }
      }

      // Fallback if APIs fail or are not configured
      this.logger.warn('Both STT APIs failed or not configured. Using fallback text.');
      return "Namaste, main aawaz sun rahi hoon par abhi transcribe nahi kar pa rahi hoon.";
    } catch (error) {
      this.logger.error('Error in transcription', error);
      return "Error transcribing audio.";
    }
  }
}
