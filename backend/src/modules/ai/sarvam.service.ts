import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);

  constructor(private configService: ConfigService) {}

  async generateResponse(text: string, agentContext: any, isIntro: boolean = false): Promise<string> {
    try {
      this.logger.debug(`Generating AI response for: "${text.substring(0, 100)}..."`);
      
      const openAiKey = this.configService.get('OPENAI_API_KEY');
      if (openAiKey) {
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are an incredibly realistic human voice assistant. Respond with ONLY what you want to say out loud. Never use asterisks or formatting.' },
                { role: 'user', content: text }
              ],
              temperature: 0.7,
              max_tokens: 150,
            },
            { headers: { Authorization: `Bearer ${openAiKey}` } }
          );
          return response.data.choices[0].message.content;
        } catch (openAiError) {
          this.logger.warn(`OpenAI LLM failed (${openAiError.message}), trying Sarvam AI / fallback...`);
        }
      }

      // Try Sarvam AI
      const sarvamKey = this.configService.get('SARVAM_API_KEY');
      const sarvamUrl = this.configService.get('SARVAM_API_URL') || 'https://api.sarvam.ai/v1';
      if (sarvamKey) {
        try {
          const response = await axios.post(
            `${sarvamUrl}/chat/completions`,
            {
              model: 'sarvam-2b-lm',
              messages: [
                { role: 'system', content: 'You are an incredibly realistic human voice assistant. Respond with ONLY what you want to say out loud. Never use asterisks or formatting.' },
                { role: 'user', content: text }
              ],
              temperature: 0.7,
              max_tokens: 150,
            },
            { 
              headers: { 
                Authorization: `Bearer ${sarvamKey}`, 
                'api-subscription-key': sarvamKey,
                'Content-Type': 'application/json' 
              } 
            }
          );
          return response.data.choices[0].message.content;
        } catch (sarvamError) {
          this.logger.warn(`Sarvam LLM failed: ${sarvamError.message} - ${JSON.stringify(sarvamError.response?.data || {})}`);
        }
      }

      // Mock fallback if no API key is provided or both APIs fail
      this.logger.debug('Using mock fallback for AI response');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isIntro) {
        return `Namaste! Main ${agentContext?.name || 'Assistant'} bol rahi hoon. Main is organization ke liye virtual assistant hoon. Aapki kya madad kar sakti hoon?`;
      }

      const match = text.match(/User said:\s*"([^"]+)"/i);
      const userMessage = match ? match[1] : text;

      return `Aapne kaha: "${userMessage.substring(0, 50)}". Main sirf apne organization ke baare mein hi baat kar sakti hoon.`;
      
    } catch (error) {
      this.logger.error('Error generating AI response', error);
      return "Maaf kijiye, abhi mujhe connect karne mein problem ho rahi hai.";
    }
  }
}
