import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResponseSanitizerService {
  private readonly logger = new Logger(ResponseSanitizerService.name);

  /**
   * Cleans AI generated text outputs before exposing them to the frontend, websocket,
   * transcription tables, or TTS generation engines.
   * Extracts and strips internal reasoning blocks, XML tags, markdown elements,
   * and non-verbal symbols.
   *
   * @param rawResponse The raw string response returned from the LLM provider.
   * @returns Cleaned conversational dialogue fit for voice synthesis and user display.
   */
  sanitize(rawResponse: string): string {
    if (!rawResponse) return '';

    let cleaned = rawResponse;

    // 1. Remove XML/HTML style <think>...</think> tags and all content inside them (reasoning process)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. Strip any other HTML or XML formatting tags (e.g. <reasoning>, <thought>, etc.)
    cleaned = cleaned.replace(/<[A-Za-z0-9_#-]+[\s\S]*?>[\s\S]*?<\/[A-Za-z0-9_#-]+>/g, '');
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // 3. Remove Markdown notation symbols (asterisks, hashtags, dashes at starts of lines, backticks)
    // Strip bold/italic markdown symbols
    cleaned = cleaned.replace(/[\*_`~]/g, '');
    // Strip headers
    cleaned = cleaned.replace(/^#+\s+/gm, '');
    // Strip list bullet markers
    cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');

    // 4. Clean up structural/non-dialogue metadata notes (e.g. [Thought: ...], (Internal Note: ...))
    cleaned = cleaned.replace(/\[thought:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(thought:?[\s\S]*?\)/gi, '');
    cleaned = cleaned.replace(/\[note:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(note:?[\s\S]*?\)/gi, '');
    cleaned = cleaned.replace(/\[internal:?[\s\S]*?\]/gi, '');
    cleaned = cleaned.replace(/\(internal:?[\s\S]*?\)/gi, '');

    // 5. Replace multiple concurrent white spaces and newlines with a single space to make speech voice-friendly
    cleaned = cleaned.replace(/\s+/g, ' ');

    // 6. Clean up trailing or leading whitespaces
    cleaned = cleaned.trim();

    // 7. Emergency validation check: If the sanitizer leaves the message empty, supply a friendly dialog fallback
    if (!cleaned) {
      this.logger.warn('Sanitization process emptied the conversational string. Restoring fallback greeting.');
      cleaned = 'Haan ji, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?';
    }

    return cleaned;
  }
}
