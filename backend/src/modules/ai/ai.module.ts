import { Module } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { SarvamService } from './sarvam.service';
import { TtsService } from './tts.service';
import { ResponseSanitizerService } from './response-sanitizer.service';

@Module({
  providers: [WhisperService, SarvamService, TtsService, ResponseSanitizerService],
  exports: [WhisperService, SarvamService, TtsService, ResponseSanitizerService],
})
export class AiModule {}
