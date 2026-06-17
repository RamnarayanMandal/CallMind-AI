export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  latencyMs?: number;
}

export interface IAiProvider {
  generateResponse(
    messages: LlmMessage[],
    temperature?: number,
    signal?: AbortSignal,           // ← Phase 2: abort support
  ): Promise<LlmResponse>;

  generateResponseStream(
    messages: LlmMessage[],
    onChunk: (chunk: string) => void,
    temperature?: number,
    signal?: AbortSignal,           // ← Phase 2: abort support
  ): Promise<LlmResponse>;
}

export const AI_PROVIDER  = 'AI_PROVIDER';
export const LLM_PROVIDER = 'LLM_PROVIDER';