import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResponseSanitizerService {
  private readonly logger = new Logger(ResponseSanitizerService.name);

  sanitize(rawResponse: string): string {
    if (!rawResponse) {
      return 'Ji bilkul, main aapki madad karne ke liye tayyar hoon.';
    }

    let cleaned = rawResponse;

    // 1. Remove <think>…</think> reasoning blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. Remove XML/HTML paired tags with content
    cleaned = cleaned.replace(/<[A-Za-z][A-Za-z0-9_-]*[\s\S]*?>[\s\S]*?<\/[A-Za-z][A-Za-z0-9_-]*>/g, '');

    // 3. Strip self-closing or unpaired tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // 4. Remove Markdown symbols
    cleaned = cleaned.replace(/[*_`~]/g, '');
    cleaned = cleaned.replace(/^#+\s+/gm, '');
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

    // 5. Strip JSON fences (fixes the sales-analysis parse error from logs)
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // 6. Remove structural metadata blocks
    cleaned = cleaned.replace(/\[thought:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(thought:?[\s\S]*?\)/gi, '');
    cleaned = cleaned.replace(/\[note:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\[internal:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(internal:?[\s\S]*?\)/gi, '');

    // 7. Remove transcript-repeat debug phrases
    cleaned = cleaned.replace(/aapne kaha\s*[:"']?[^.!?]*/gi, '');
    cleaned = cleaned.replace(/you said\s*[:"']?[^.!?]*/gi, '');
    cleaned = cleaned.replace(/generate response now[:\s]*/gi, '');
    cleaned = cleaned.replace(/start the conversation[:\s]*/gi, '');
    cleaned = cleaned.replace(/user said\s*[:"']?[^.!?]*/gi, '');

    // 8. Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 9. Phase 2: Guard against single-char / near-empty responses
    if (cleaned.length < 2) {
      this.logger.warn(
        `[FALLBACK_TRIGGERED] reason="too_short" rawLength=${rawResponse.length} chars=${cleaned.length} ` +
        `rawPreview="${rawResponse.substring(0, 80)}"`,
      );
      return 'Ji bilkul, main aapki madad karne ke liye tayyar hoon.';
    }

    // 10. Emergency fallback if sanitizer emptied the string
    if (!cleaned) {
      this.logger.warn(
        `[FALLBACK_TRIGGERED] reason="emptied_by_sanitizer" rawLength=${rawResponse.length} ` +
        `rawPreview="${rawResponse.substring(0, 80)}"`,
      );
      return 'Ji bilkul, main aapki madad karne ke liye tayyar hoon.';
    }

    return cleaned;
  }

  /**
   * Dedicated JSON sanitizer — strips markdown fences before JSON.parse().
   * Use this in finalizeConversation / sales-analysis paths.
   */
  sanitizeJson(rawResponse: string): string {
    if (!rawResponse) return '{}';
    return rawResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }
}