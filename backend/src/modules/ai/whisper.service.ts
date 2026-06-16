import { Injectable, Logger, Inject } from '@nestjs/common';
import { STT_PROVIDER, ISttProvider } from '@providers/stt/stt.provider';
import { Buffer } from 'buffer';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);

  constructor(
    @Inject(STT_PROVIDER) private readonly sttProvider: ISttProvider,
  ) {}

  async transcribeAudio(audioBuffer: Buffer, language?: string): Promise<string> {
    try {
      this.logger.debug(`WhisperService delegating to dynamic STT Provider with language: ${language || 'default'}...`);
      const result = await this.sttProvider.transcribe(audioBuffer, language);
      return result.transcript;
    } catch (error) {
      this.logger.error('Error in WhisperService delegating to STT Provider', error);
      // Fallback
      return "Namaste, main aawaz sun rahi hoon par abhi transcribe nahi kar pa rahi hoon.";
    }
  }
}
