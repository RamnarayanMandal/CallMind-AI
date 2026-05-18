export interface SttResult {
  transcript: string;
  confidence?: number;
  language?: string;
}

export interface ISttProvider {
  transcribe(audioBuffer: Buffer, language?: string): Promise<SttResult>;
}

export const STT_PROVIDER = 'STT_PROVIDER';
