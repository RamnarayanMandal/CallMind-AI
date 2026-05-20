import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TranscriptSanitizerService {
  private readonly logger = new Logger(TranscriptSanitizerService.name);

  /**
   * Cleans raw STT transcript before it enters the AI pipeline.
   * Removes: UI labels, debug text, timestamps, duplicate fragments,
   * helper prompts, and websocket metadata.
   */
  sanitize(rawTranscript: string): string {
    if (!rawTranscript || rawTranscript.trim() === '') return '';

    let cleaned = rawTranscript;

    // Remove transcript UI labels (e.g. "User:", "Agent:", "You said:")
    cleaned = cleaned.replace(/^(user|agent|assistant|you said|aapne kaha)[:\s]*/gi, '');

    // Remove timestamp patterns (HH:MM:SS or HH:MM)
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '');

    // Remove debug/helper prompts that should never reach AI
    cleaned = cleaned.replace(/generate response now[:\s]*/gi, '');
    cleaned = cleaned.replace(/start the conversation[:\s]*/gi, '');
    cleaned = cleaned.replace(/process audio[:\s]*/gi, '');
    cleaned = cleaned.replace(/speech detected[:\s]*/gi, '');

    // Remove any XML/HTML style tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove markdown symbols
    cleaned = cleaned.replace(/[*_`~#]/g, '');

    // Collapse multiple spaces and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (!cleaned) {
      this.logger.warn('TranscriptSanitizer: cleaned transcript is empty');
      return '';
    }

    this.logger.debug(`Transcript cleaned: "${rawTranscript.substring(0, 60)}" → "${cleaned.substring(0, 60)}"`);
    return cleaned;
  }
}
