import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WaveFile } from 'wavefile';
import { CallService, CALL_QUEUE } from './call.service';
import { AgentService } from '../agent/agent.service';
import { OrganizationService } from '../organization/organization.service';
import { OrgContextCacheService } from '../redis/org-context-cache.service';
import { RedisService } from '../redis/redis.service';
import { TtsService } from '../ai/tts.service';

@Processor(CALL_QUEUE)
export class CallProcessor {
  private readonly logger = new Logger(CallProcessor.name);

  constructor(
    private readonly callService: CallService,
    private readonly agentService: AgentService,
    private readonly organizationService: OrganizationService,
    private readonly orgCacheService: OrgContextCacheService,
    private readonly redisService: RedisService,
    private readonly ttsService: TtsService,
  ) {}

  @Process('execute')
  async handleExecute(job: Job<{ callId: string }>) {
    const { callId } = job.data;
    this.logger.log(`[CALL_PROCESSOR] Processing call execution for ID: ${callId}`);
    const startTime = Date.now();

    try {
      // PRELOAD: Load agent context and cache it before dialing
      await this.preloadAgentContext(callId);

      // The actual work is still in CallService but now it's called by a worker
      await this.callService.processExecution(callId);
      this.logger.log(`[CALL_PROCESSOR] Successfully processed call: ${callId} (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.logger.error(`[CALL_PROCESSOR] Failed to process call ${callId}: ${error.message}`);
      // Bull will retry automatically if we throw
      throw error;
    }
  }

  /**
   * Preload agent context and cache it in Redis before the call is initiated.
   * This eliminates the need for MongoDB queries after the customer answers.
   */
  private async preloadAgentContext(callId: string): Promise<void> {
    try {
      const call = await this.callService.findOne(callId);
      if (!call || !call.agentId) {
        this.logger.warn(`[PRELOAD] No call or agent found for ${callId}`);
        return;
      }

      const agentId = call.agentId.toString();
      const preloadStart = Date.now();

      // Check if already cached
      const cached = await this.orgCacheService.getCachedProfileByAgentId(agentId);
      if (!cached) {
        // Load from MongoDB
        const agent = await this.agentService.findOne(agentId);
        if (!agent) {
          this.logger.warn(`[PRELOAD] Agent ${agentId} not found`);
          return;
        }

        let orgContext: any = {};
        if (agent.organizationId) {
          orgContext = await this.organizationService.findById(agent.organizationId);
        }

        // Build and cache profile
        const profile = await this.orgCacheService.buildAndCacheProfile(
          agent.organizationId || 'default',
          agentId,
          orgContext,
          agent,
        );

        this.logger.log(`[PRELOAD] Agent context cached for ${agentId} (${Date.now() - preloadStart}ms)`);

        // Pre-generate TTS audio for greeting
        await this.preGenerateGreetingAudio(agent, orgContext, profile.systemPrompt, agentId);
      } else {
        this.logger.log(`[PRELOAD] Agent ${agentId} already cached (${Date.now() - preloadStart}ms)`);
        // Still ensure TTS is cached (profile cache and TTS cache are independent)
        const ttsCacheKey = `tts_cache:greeting:${agentId}`;
        const existing = await this.redisService.get(ttsCacheKey);
        if (!existing) {
          this.logger.log(`[PRELOAD] TTS cache missing for ${agentId}, pre-generating`);
          const profile = cached;
          await this.preGenerateGreetingAudio(
            profile.agentContext || {},
            profile.orgContext || {},
            profile.systemPrompt || '',
            agentId,
          );
        }
      }

    } catch (err) {
      this.logger.warn(`[PRELOAD_ERROR] Failed to preload agent context: ${err.message}`);
    }
  }

  /**
   * Pre-generate TTS audio for the greeting and cache it in Redis.
   * This eliminates TTS latency when the customer answers.
   */
  private async preGenerateGreetingAudio(
    agentContext: any,
    orgContext: any,
    systemPrompt: string,
    agentId: string,
  ): Promise<void> {
    try {
      const ttsCacheKey = `tts_cache:greeting:${agentId}`;

      // Check if already cached
      const existing = await this.redisService.get(ttsCacheKey);
      if (existing) {
        this.logger.log(`[PRELOAD_TTS] Greeting TTS already cached for agent ${agentId}`);
        return;
      }

      // Generate greeting text from template (instant, no LLM call)
      const agentName = agentContext?.name || 'Assistant';
      const orgName = orgContext?.name || 'our company';
      const language = agentContext?.language || 'hi-IN';
      let greetingText: string;
      if (language === 'hi-IN' || language === 'hinglish') {
        greetingText = `Namaste! Main ${agentName} bol rahi hoon ${orgName} se. Aapki kya madad kar sakti hoon?`;
      } else {
        greetingText = `Hello! I'm ${agentName} from ${orgName}. How can I help you today?`;
      }

      this.logger.log(`[PRELOAD_TTS] Generating greeting TTS for agent ${agentId}: "${greetingText.substring(0, 60)}"`);

      // Synthesize TTS
      const ttsResult = await this.ttsService.synthesize(greetingText, {
        language,
        gender: agentContext?.gender || 'female',
      });

      // Convert to 8000Hz mu-law for Vobiz streaming
      const wav = new WaveFile(ttsResult.audioBuffer);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      const rawMuLaw = Buffer.from((wav.data as any).samples);

      // Cache the raw mu-law bytes as base64 string in Redis
      const cacheValue = JSON.stringify({
        greetingText,
        audioBase64: rawMuLaw.toString('base64'),
        length: rawMuLaw.length,
        language,
      });
      await this.redisService.set(ttsCacheKey, cacheValue, 86400); // 24-hour TTL

      this.logger.log(`[PRELOAD_TTS] Greeting TTS cached for agent ${agentId} (${rawMuLaw.length} bytes)`);

    } catch (err) {
      this.logger.warn(`[PRELOAD_TTS_ERROR] Failed to pre-generate greeting for agent ${agentId}: ${err.message}`);
    }
  }
}
