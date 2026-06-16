import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call, CallDocument } from '../call/schemas/call.schema';
import { Conversation, ConversationDocument } from '../conversation/schemas/conversation.schema';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<CallDocument>,
    @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
  ) {}

  /**
   * Export calls to Excel-compatible CSV format
   */
  async exportCalls(
    organizationId: string,
    options: {
      startDate?: string;
      endDate?: string;
      status?: string;
      format?: 'csv' | 'excel';
    } = {},
  ): Promise<{ data: any[]; headers: string[] }> {
    const filter: any = { organizationId };

    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) filter.createdAt.$gte = new Date(options.startDate);
      if (options.endDate) filter.createdAt.$lte = new Date(options.endDate);
    }

    if (options.status) {
      filter.status = options.status;
    }

    const calls = await this.callModel
      .find(filter)
      .populate('customerId', 'name phone email company')
      .populate('agentId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Call ID',
      'Phone Number',
      'Customer Name',
      'Customer Email',
      'Customer Company',
      'Agent',
      'Status',
      'Outcome',
      'Duration (seconds)',
      'Recording URL',
      'Recording Duration',
      'AI Input Tokens',
      'AI Output Tokens',
      'AI Model',
      'AI Cost',
      'STT Minutes',
      'TTS Characters',
      'TTS Cost',
      'Call Minutes',
      'Telephony Cost',
      'Total Cost',
      'Created At',
    ];

    const data = calls.map(call => [
      call._id.toString(),
      call.phoneNumber,
      (call.customerId as any)?.name || '',
      (call.customerId as any)?.email || '',
      (call.customerId as any)?.company || '',
      (call.agentId as any)?.name || '',
      call.status,
      call.outcome,
      call.durationSeconds,
      call.recordingUrl || '',
      call.recordingDuration || '',
      call.aiInputTokens || 0,
      call.aiOutputTokens || 0,
      call.aiModel || '',
      call.aiCost || 0,
      call.sttMinutes || 0,
      call.ttsCharacters || 0,
      call.ttsCost || 0,
      call.callMinutes || 0,
      call.telephonyCost || 0,
      (call.aiCost || 0) + (call.ttsCost || 0) + (call.telephonyCost || 0),
      (call as any).createdAt || new Date(),
    ]);

    return { data, headers };
  }

  /**
   * Export transcripts to Excel-compatible CSV format
   */
  async exportTranscripts(
    organizationId: string,
    options: {
      startDate?: string;
      endDate?: string;
      format?: 'csv' | 'excel';
    } = {},
  ): Promise<{ data: any[]; headers: string[] }> {
    const filter: any = { organizationId };

    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) filter.createdAt.$gte = new Date(options.startDate);
      if (options.endDate) filter.createdAt.$lte = new Date(options.endDate);
    }

    const conversations = await this.convModel
      .find(filter)
      .populate({
        path: 'callId',
        populate: [
          { path: 'customerId', select: 'name phone' },
          { path: 'agentId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Call ID',
      'Customer',
      'Agent',
      'Total Turns',
      'Summary',
      'Sentiment',
      'Outcome',
      'Topics',
      'Customer Intent',
      'Lead Status',
      'Created At',
    ];

    const data = conversations.map(conv => {
      const call = conv.callId as any;
      return [
        call?._id?.toString() || conv.callId?.toString() || '',
        call?.customerId?.name || '',
        call?.agentId?.name || '',
        conv.totalTurns,
        conv.summary || '',
        conv.sentiment || '',
        conv.outcome || '',
        (conv.topics || []).join(', '),
        conv.customerIntent || '',
        conv.leadStatus || '',
        (conv as any).createdAt || new Date(),
      ];
    });

    return { data, headers };
  }

  /**
   * Generate CSV content from data
   */
  generateCsv(data: any[], headers: string[]): string {
    const csvRows: string[] = [];
    
    // Add headers
    csvRows.push(headers.map(h => this.escapeCsvField(h)).join(','));
    
    // Add data rows
    for (const row of data) {
      csvRows.push(row.map(cell => this.escapeCsvField(String(cell ?? ''))).join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Escape a CSV field
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
