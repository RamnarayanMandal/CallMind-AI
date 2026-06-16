export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  latencyMs?: number; // Track AI generation time
}

export interface IAiProvider {
  generateResponse(messages: LlmMessage[], temperature?: number): Promise<LlmResponse>;
  generateResponseStream(
    messages: LlmMessage[],
    onChunk: (chunk: string) => void,
    temperature?: number,
  ): Promise<LlmResponse>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
export const LLM_PROVIDER = 'LLM_PROVIDER'; // Maintain compatibility with old LLM_PROVIDER
