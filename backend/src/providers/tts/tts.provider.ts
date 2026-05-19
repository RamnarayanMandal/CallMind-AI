import { Buffer } from 'buffer';

export interface TtsResult {
  audioBuffer: Buffer;
  mimeType: string;
  duration?: number;
  latencyMs?: number; // For performance monitoring
}

export interface TtsOptions {
  voice?: string;
  language?: string;
  gender?: 'male' | 'female';
  speed?: number;
}

export interface ITtsProvider {
  synthesize(text: string, options?: TtsOptions): Promise<TtsResult>;
}

export const TTS_PROVIDER = 'TTS_PROVIDER';
