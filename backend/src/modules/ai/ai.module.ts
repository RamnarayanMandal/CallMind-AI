import { Module } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { SarvamService } from './sarvam.service';
import { TtsService } from './tts.service';
import { ResponseSanitizerService } from './response-sanitizer.service';
import { ConversationValidatorService } from './conversation-validator.service';
import { TranscriptSanitizerService } from './transcript-sanitizer.service';
import { ResponseCompletenessValidatorService } from './response-completeness-validator.service';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';

@Module({
  providers: [
    WhisperService,
    SarvamService,
    TtsService,
    ResponseSanitizerService,
    ConversationValidatorService,
    TranscriptSanitizerService,
    ResponseCompletenessValidatorService,
    ConversationOrchestratorService,
  ],
  exports: [
    WhisperService,
    SarvamService,
    TtsService,
    ResponseSanitizerService,
    ConversationValidatorService,
    TranscriptSanitizerService,
    ResponseCompletenessValidatorService,
    ConversationOrchestratorService,
  ],
})
export class AiModule {}
