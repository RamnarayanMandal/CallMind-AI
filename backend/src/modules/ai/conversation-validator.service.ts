import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage } from '@providers/ai/ai.provider';

@Injectable()
export class ConversationValidatorService {
  private readonly logger = new Logger(ConversationValidatorService.name);

  /**
   * Validates and auto-repairs conversation history to guarantee strict
   * user → assistant → user → assistant alternation required by all major LLM APIs.
   *
   * Rules enforced:
   * - History MUST NOT contain system messages (those belong in the system slot)
   * - History MUST start with a user message
   * - History MUST NOT have two consecutive identical roles
   * - History MUST end with an assistant message (current user turn is appended separately)
   *
   * @param history  Raw history array (role: user | assistant only)
   * @returns        Repaired, strictly alternating history
   */
  repair(history: LlmMessage[]): LlmMessage[] {
    if (!history || history.length === 0) return [];

    // Strip any system messages that leaked into history
    let filtered = history.filter(
      (m) => m.role === 'user' || m.role === 'assistant',
    );

    if (filtered.length === 0) return [];

    // Guarantee history starts with a user message
    while (filtered.length > 0 && filtered[0].role !== 'user') {
      this.logger.warn(
        `Removing leading non-user message from history: role="${filtered[0].role}"`,
      );
      filtered = filtered.slice(1);
    }

    if (filtered.length === 0) return [];

    // Collapse consecutive duplicate roles by keeping only the last one in each run
    const repaired: LlmMessage[] = [];
    for (const msg of filtered) {
      if (repaired.length === 0) {
        repaired.push(msg);
        continue;
      }
      const last = repaired[repaired.length - 1];
      if (last.role === msg.role) {
        // Merge content into last rather than dropping — preserves more context
        repaired[repaired.length - 1] = {
          role: last.role,
          content: last.content + ' ' + msg.content,
        };
        this.logger.warn(
          `Merged consecutive ${msg.role} messages to prevent API rejection`,
        );
      } else {
        repaired.push(msg);
      }
    }

    return repaired;
  }

  /**
   * Validates that a full messages array (system + history + current user) is correct.
   * Returns true if valid, false if the API would reject it.
   */
  isValid(messages: LlmMessage[]): boolean {
    // Must have at least system + one user
    if (messages.length < 2) return false;

    // First must be system
    if (messages[0].role !== 'system') return false;

    // Remaining must strictly alternate starting with user
    const conversational = messages.slice(1);
    for (let i = 0; i < conversational.length; i++) {
      const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
      if (conversational[i].role !== expectedRole) return false;
    }

    // Must end with user (the current query)
    return conversational[conversational.length - 1].role === 'user';
  }
}
