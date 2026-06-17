import { Injectable } from '@nestjs/common';

@Injectable()
export class FillerDetectorService {
  private readonly fillers = new Set([
    'हाँ', 'हाँ जी', 'हाँ जी हाँ', 'हाँ जी हाँ जी',
    'अच्छा', 'अच्छा जी',
    'ओके', 'ok', 'okay', 'ठीक है',
    'हूँ', 'ह्म', 'mm-hmm', 'uh-huh',
    'जी', 'जी हाँ', 'जी अच्छा',
    'hello', 'hi', 'haan', 'haanji', 'nahi', 'नहीं',
    'hm', 'hmm', 'mm', 'uh', 'huh',
  ]);

  isFiller(text: string): boolean {
    const trimmed = text.trim().toLowerCase();
    if (this.fillers.has(trimmed)) return true;
    if (trimmed.length > 3) return false;
    return /^(हाँ|जी|haan|ji|ok|hm|mm|uh|huh|hey|hi|nahi)$/i.test(trimmed);
  }

  getBackchannelResponse(language: string): string {
    if (language === 'hi-IN' || language === 'hinglish') return 'जी।';
    return 'Mm-hmm.';
  }
}
