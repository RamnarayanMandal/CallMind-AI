export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

export interface ILlmProvider {
  generateResponse(messages: LlmMessage[], temperature?: number): Promise<LlmResponse>;
}

export const LLM_PROVIDER = 'LLM_PROVIDER';
