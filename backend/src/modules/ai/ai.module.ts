import { Module } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { SarvamService } from './sarvam.service';
import { TtsService } from './tts.service';

@Module({
  providers: [WhisperService, SarvamService, TtsService],
  exports: [WhisperService, SarvamService, TtsService],
})
export class AiModule {}
