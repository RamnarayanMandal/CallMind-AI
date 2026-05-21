import { Injectable, Logger, Inject } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ILlmProvider, LLM_PROVIDER, LlmMessage } from '@providers/llm/llm.interface';

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);
  
  // 30 minutes TTL for inactive sessions
  private readonly SESSION_TTL = 1800; 
  // Max number of messages to keep in history to avoid context bloat
  private readonly MAX_HISTORY_LENGTH = 30;

  constructor(
    private readonly redisService: RedisService,
    @Inject(LLM_PROVIDER) private readonly llmProvider: ILlmProvider,
  ) {}

  /**
   * Retrieves the current conversation history for a given session.
   */
  async getConversationMemory(sessionId: string): Promise<LlmMessage[]> {
    const key = this.getMemoryKey(sessionId);
    const history = await this.redisService.get<LlmMessage[]>(key);
    
    if (history) {
      this.logger.debug(`[${sessionId}] Memory loaded: ${history.length} messages`);
      return history;
    }
    
    this.logger.debug(`[${sessionId}] No active memory found. Starting fresh.`);
    return [];
  }

  /**
   * Appends one or more messages to the session's conversation history.
   * Enforces history length limits and resets the session TTL.
   */
  async appendMessages(sessionId: string, newMessages: LlmMessage[]): Promise<LlmMessage[]> {
    const key = this.getMemoryKey(sessionId);
    let history = await this.getConversationMemory(sessionId);

    // Append new messages
    history.push(...newMessages);

    // Trim history if it exceeds maximum allowed length (keep the most recent messages)
    if (history.length > this.MAX_HISTORY_LENGTH) {
      this.logger.debug(`[${sessionId}] Memory trim triggered. Old length: ${history.length}, Max: ${this.MAX_HISTORY_LENGTH}`);
      history = history.slice(-this.MAX_HISTORY_LENGTH);
    }

    // Save back to Redis with TTL
    await this.redisService.set(key, history, this.SESSION_TTL);
    this.logger.debug(`[${sessionId}] Memory saved. Total messages: ${history.length}, Expires in: ${this.SESSION_TTL}s`);

    return history;
  }

  /**
   * Clears the entire conversation memory for a session.
   */
  async clearMemory(sessionId: string): Promise<void> {
    const key = this.getMemoryKey(sessionId);
    await this.redisService.del(key);
    this.logger.log(`[${sessionId}] Session memory cleaned up.`);
  }

  /**
   * Summarizes the entire active conversation by passing the history to the LLM.
   */
  async summarizeConversation(sessionId: string): Promise<string> {
    const history = await this.getConversationMemory(sessionId);
    
    if (history.length === 0) {
      return 'No conversation history to summarize.';
    }

    const fullText = history.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

    const summaryMessages: LlmMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant tasked with summarizing a conversation between a user and an agent. Provide a concise, highly accurate summary of the key points discussed. Highlight the user\'s main intent, any agreements made, and the current state of the conversation.',
      },
      {
        role: 'user',
        content: `Please summarize the following conversation:\n\n${fullText}`,
      }
    ];

    try {
      this.logger.debug(`[${sessionId}] Generating conversation summary...`);
      const result = await this.llmProvider.generateResponse(summaryMessages, 0.3);
      this.logger.log(`[${sessionId}] Conversation summarized successfully.`);
      return result.content;
    } catch (error) {
      this.logger.error(`[${sessionId}] Failed to summarize conversation: ${error.message}`);
      return 'Failed to generate summary due to an error.';
    }
  }

  /**
   * Helper to construct the standard Redis key for a session's memory.
   */
  private getMemoryKey(sessionId: string): string {
    return `conversation_memory:${sessionId}`;
  }
}
