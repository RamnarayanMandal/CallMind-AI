import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument, TranscriptEntry } from './schemas/conversation.schema';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { ILlmProvider, LLM_PROVIDER, LlmMessage } from '@providers/llm/llm.interface';
import { buildPrompt } from './prompt.builder';
import { ActionService } from '../action/action.service';

export interface ConversationContext {
  organizationName: string;
  productInfo: string;
  agentName: string;
  agentTone: string;
  customerName: string;
}

@Injectable()
export class ConversationRepository extends BaseRepository<ConversationDocument> {
  constructor(@InjectModel(Conversation.name) model: Model<ConversationDocument>) {
    super(model);
  }
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly repo: ConversationRepository,
    @Inject(LLM_PROVIDER) private readonly llm: ILlmProvider,
    private readonly actionService: ActionService,
  ) {}

  async startConversation(callId: string, organizationId: string): Promise<ConversationDocument> {
    return this.repo.create({ callId, organizationId, transcript: [], totalTurns: 0 });
  }

  async addTurn(
    callId: string,
    customerInput: string,
    context: ConversationContext,
  ): Promise<{ agentResponse: string }> {
    const conv = await this.repo.findOne({ callId });
    if (!conv) throw new NotFoundException('Conversation not found');

    const systemPrompt = buildPrompt(context);
    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conv.transcript.map((t) => ({
        role: t.role === 'agent' ? 'assistant' : 'user' as 'assistant' | 'user',
        content: t.content,
      })),
      { role: 'user', content: customerInput },
    ];

    const llmResponse = await this.llm.generateResponse(messages, 0.7);

    // Process actions from AI response
    const actions = this.parseActions(llmResponse.content);
    const organizationId = conv.organizationId;
    
    // Execute actions sequentially
    for (const action of actions) {
      try {
        await this.actionService.executeAction(
          callId,
          organizationId,
          action.type,
          action.params,
        );
      } catch (error) {
        this.logger.error(`Failed to execute action ${action.type}: ${error.message}`);
      }
    }

    // Remove action tags from the response before storing
    const cleanResponse = this.cleanActionsFromResponse(llmResponse.content);

    const now = new Date();
    const customerEntry: TranscriptEntry = { role: 'customer', content: customerInput, timestamp: now };
    const agentEntry: TranscriptEntry = { role: 'agent', content: cleanResponse, timestamp: now };

    await this.repo['model'].findOneAndUpdate(
      { callId },
      {
        $push: { transcript: { $each: [customerEntry, agentEntry] } },
        $inc: { totalTurns: 1 },
      },
    );

    return { agentResponse: cleanResponse };
  }

  /**
   * Parse action tags from AI response
   */
  private parseActions(response: string): Array<{ type: string; params: Record<string, any> }> {
    const actions: Array<{ type: string; params: Record<string, any> }> = [];
    const actionRegex = /\[_ACTION:([^:]+):([^\]]+)\]/g;
    
    let match;
    while ((match = actionRegex.exec(response)) !== null) {
      const type = match[1];
      try {
        const params = JSON.parse(match[2]);
        actions.push({ type, params });
      } catch (error) {
        this.logger.warn(`Failed to parse action params: ${match[2]}`);
      }
    }
    
    return actions;
  }

  /**
   * Remove action tags from the response
   */
  private cleanActionsFromResponse(response: string): string {
    return response.replace(/\[_ACTION:[^\]]+\]/g, '').trim();
  }

  async finalizeConversation(callId: string): Promise<ConversationDocument> {
    const conv = await this.repo.findOne({ callId });
    if (!conv) throw new NotFoundException('Conversation not found');

    const fullText = conv.transcript.map((t) => `${t.role}: ${t.content}`).join('\n');

    let outcome = 'unknown';
    let summary = '';
    let keyInsights = '';
    let topics: string[] = [];
    let sentiment = 'neutral';
    let customerIntent = '';
    let leadStatus = 'cold';

    if (!fullText || fullText.trim().length === 0) {
      this.logger.warn(`Empty transcript for callId=${callId} — skipping AI summary`);
      return this.repo.updateById(conv._id.toString(), {
        outcome, summary, keyInsights, topics, sentiment, customerIntent, leadStatus,
      });
    }

    const summaryMessages: LlmMessage[] = [
      {
        role: 'system',
        content: `You are a conversation analyst for a sales call. Analyze the transcript and return a JSON object with these fields:
- summary: A concise 2-3 sentence summary of the call
- keyInsights: Key takeaways from the conversation
- outcome: Classification as "interested", "not-interested", "follow-up", or "no-answer"
- topics: Array of main topics discussed (e.g., ["pricing", "demo", "integration"])
- sentiment: Overall customer sentiment as "positive", "negative", "neutral", or "mixed"
- customerIntent: What the customer was looking for (e.g., "Looking for a CRM solution", "Comparing pricing", "Requesting a demo")
- leadStatus: Lead qualification as "hot" (ready to buy), "warm" (interested but needs nurturing), "cold" (not interested), or "closed" (deal closed)

Return ONLY valid JSON, no markdown.`,
      },
      { role: 'user', content: fullText },
    ];

    try {
      const result = await this.llm.generateResponse(summaryMessages, 0.3);
      const parsed = JSON.parse(result.content);
      outcome = parsed.outcome || 'unknown';
      summary = parsed.summary || '';
      keyInsights = parsed.keyInsights || '';
      topics = parsed.topics || [];
      sentiment = parsed.sentiment || 'neutral';
      customerIntent = parsed.customerIntent || '';
      leadStatus = parsed.leadStatus || 'cold';
    } catch (e) {
      this.logger.error(`Failed to finalize conversation for callId=${callId}: ${e.message}`);
      summary = 'Summary generation failed';
    }

    return this.repo.updateById(conv._id.toString(), {
      outcome, summary, keyInsights, topics, sentiment, customerIntent, leadStatus,
    });
  }

  async saveTranscriptAndMetrics(
    callId: string,
    transcript: TranscriptEntry[],
    metrics: { avgStt?: number; avgLlm?: number; avgTts?: number; avgTotal?: number }
  ): Promise<ConversationDocument> {
    const conv = await this.repo.findOne({ callId });
    if (!conv) throw new NotFoundException('Conversation not found');

    return this.repo.updateById(conv._id.toString(), {
      transcript,
      totalTurns: Math.floor(transcript.length / 2),
      avgSttLatencyMs: metrics.avgStt,
      avgLlmLatencyMs: metrics.avgLlm,
      avgTtsLatencyMs: metrics.avgTts,
      avgTotalLatencyMs: metrics.avgTotal
    });
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    return this.repo.findPaginated({ organizationId }, pagination);
  }

  async findByCallId(callId: string) {
    const conv = await this.repo.findOne({ callId });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }
}
