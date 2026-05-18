import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument, TranscriptEntry } from './schemas/conversation.schema';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { ILlmProvider, LLM_PROVIDER, LlmMessage } from '@providers/llm/llm.interface';
import { buildPrompt } from './prompt.builder';

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
  constructor(
    private readonly repo: ConversationRepository,
    @Inject(LLM_PROVIDER) private readonly llm: ILlmProvider,
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

    const now = new Date();
    const customerEntry: TranscriptEntry = { role: 'customer', content: customerInput, timestamp: now };
    const agentEntry: TranscriptEntry = { role: 'agent', content: llmResponse.content, timestamp: now };

    await this.repo['model'].findOneAndUpdate(
      { callId },
      {
        $push: { transcript: { $each: [customerEntry, agentEntry] } },
        $inc: { totalTurns: 1 },
      },
    );

    return { agentResponse: llmResponse.content };
  }

  async finalizeConversation(callId: string): Promise<ConversationDocument> {
    const conv = await this.repo.findOne({ callId });
    if (!conv) throw new NotFoundException('Conversation not found');

    const fullText = conv.transcript.map((t) => `${t.role}: ${t.content}`).join('\n');

    const summaryMessages: LlmMessage[] = [
      {
        role: 'system',
        content: 'You are a conversation analyst. Summarize this sales call transcript, extract key insights, and classify outcome as: interested/not-interested/follow-up/no-answer. Return JSON: { summary, keyInsights, outcome, topics }',
      },
      { role: 'user', content: fullText },
    ];

    let outcome = 'unknown';
    let summary = '';
    let keyInsights = '';
    let topics: string[] = [];

    try {
      const result = await this.llm.generateResponse(summaryMessages, 0.3);
      const parsed = JSON.parse(result.content);
      outcome = parsed.outcome || 'unknown';
      summary = parsed.summary || '';
      keyInsights = parsed.keyInsights || '';
      topics = parsed.topics || [];
    } catch {
      summary = 'Summary generation failed';
    }

    return this.repo.updateById(conv._id.toString(), { outcome, summary, keyInsights, topics });
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
