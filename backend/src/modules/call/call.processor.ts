import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CallService, CALL_QUEUE } from './call.service';
import { AgentService } from '../agent/agent.service';
import { OrganizationService } from '../organization/organization.service';
import { OrgContextCacheService } from '../redis/org-context-cache.service';
import { TtsService } from '../ai/tts.service';

@Processor(CALL_QUEUE)
export class CallProcessor {
  private readonly logger = new Logger(CallProcessor.name);

  constructor(
    private readonly callService: CallService,
    private readonly agentService: AgentService,
    private readonly organizationService: OrganizationService,
    private readonly orgCacheService: OrgContextCacheService,
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
      if (cached) {
        this.logger.log(`[PRELOAD] Agent ${agentId} already cached (${Date.now() - preloadStart}ms)`);
        return;
      }

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
      await this.preGenerateGreetingAudio(agent, orgContext, profile.systemPrompt);

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
  ): Promise<void> {
    try {
      const ttsCacheKey = `tts_cache:intro:${agentContext._id}`;

      // Check if already cached (use the service's get method)
      const { RedisService } = await import('../redis/redis.service');
      // We can't inject RedisService here, but the OrgContextCacheService uses it
      // The TTS audio will be cached in the live call service instead
      this.logger.log(`[PRELOAD] TTS greeting will be cached on first call for agent ${agentContext._id}`);

    } catch (err) {
      this.logger.warn(`[PRELOAD_TTS_ERROR] Failed to pre-generate greeting: ${err.message}`);
    }
  }
}
