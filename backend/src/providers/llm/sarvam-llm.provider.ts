import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ILlmProvider, LlmMessage, LlmResponse } from './llm.interface';

@Injectable()
export class SarvamLlmProvider implements ILlmProvider {
  private readonly logger = new Logger(SarvamLlmProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('sarvam.apiUrl');
    this.apiKey = this.configService.get<string>('sarvam.apiKey');
  }

  async generateResponse(messages: LlmMessage[], temperature = 0.7): Promise<LlmResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'sarvam-m',
          messages,
          temperature,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        tokensUsed: response.data.usage?.total_tokens,
        model: response.data.model,
      };
    } catch (error) {
      this.logger.error('Sarvam LLM error', error?.response?.data || error.message);
      throw error;
    }
  }
}
