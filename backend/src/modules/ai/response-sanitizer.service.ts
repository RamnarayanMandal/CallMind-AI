import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResponseSanitizerService {
  private readonly logger = new Logger(ResponseSanitizerService.name);

  /**
   * Cleans AI-generated text before it reaches TTS or the frontend.
   * Strips: reasoning blocks, XML tags, markdown, debug text,
   * transcript-repeat patterns, and internal metadata.
   */
  sanitize(rawResponse: string): string {
    if (!rawResponse) return '';

    let cleaned = rawResponse;

    // 1. Remove <think>...</think> reasoning blocks (Claude, DeepSeek style)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. Remove any other XML/HTML paired tags with their content
    cleaned = cleaned.replace(/<[A-Za-z][A-Za-z0-9_-]*[\s\S]*?>[\s\S]*?<\/[A-Za-z][A-Za-z0-9_-]*>/g, '');

    // 3. Strip remaining self-closing or unpaired HTML/XML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // 4. Remove Markdown symbols
    cleaned = cleaned.replace(/[*_`~]/g, '');
    cleaned = cleaned.replace(/^#+\s+/gm, '');
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

    // 5. Remove structural metadata blocks
    cleaned = cleaned.replace(/\[thought:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(thought:?[\s\S]*?\)/gi, '');
    cleaned = cleaned.replace(/\[note:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\[internal:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(internal:?[\s\S]*?\)/gi, '');

    // 6. Remove transcript-repeat debug phrases (CRITICAL — these must never reach TTS)
    cleaned = cleaned.replace(/aapne kaha\s*[:"']?[^.!?]*/gi, '');
    cleaned = cleaned.replace(/you said\s*[:"']?[^.!?]*/gi, '');
    cleaned = cleaned.replace(/generate response now[:\s]*/gi, '');
    cleaned = cleaned.replace(/start the conversation[:\s]*/gi, '');
    cleaned = cleaned.replace(/user said\s*[:"']?[^.!?]*/gi, '');

    // 7. Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 8. Emergency fallback if sanitizer empties the string
    if (!cleaned) {
      this.logger.warn('ResponseSanitizer: result was empty after cleaning — using safe fallback');
      return 'Ji bilkul, main aapki madad karne ke liye tayyar hoon.';
    }

    return cleaned;
  }
}
