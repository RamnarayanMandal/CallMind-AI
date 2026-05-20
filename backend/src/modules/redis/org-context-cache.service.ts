import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';

export interface CompiledOrgProfile {
  orgId: string;
  agentId: string;
  systemPrompt: string;
  introPrompt: string;
  agentContext: any;
  orgContext: any;
  compiledAt: number;
}

@Injectable()
export class OrgContextCacheService {
  private readonly logger = new Logger(OrgContextCacheService.name);
  // 24 hours TTL — refreshed only when org/agent is updated
  private readonly ORG_CACHE_TTL = 86400;

  constructor(
    private readonly redisService: RedisService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  private buildKey(orgId: string, agentId: string): string {
    return `org:${orgId}:agent:${agentId}:profile`;
  }

  /**
   * Get compiled org+agent profile from Redis cache using only agentId.
   * Scans keys for match, then returns cached profile.
   */
  async getCachedProfileByAgentId(agentId: string): Promise<CompiledOrgProfile | null> {
    const pattern = `org:*:agent:${agentId}:profile`;
    const keys = await this.redisService.scanKeys(pattern);
    if (keys.length > 0) {
      const cached = await this.redisService.get<CompiledOrgProfile>(keys[0]);
      if (cached) {
        this.logger.debug(`Cache HIT for agent=${agentId} via scan`);
        return cached;
      }
    }
    this.logger.debug(`Cache MISS for agent=${agentId} via scan`);
    return null;
  }

  /**
   * Get compiled org+agent profile from Redis cache.
   * Returns null on miss — caller should build and store it.
   */
  async getCachedProfile(orgId: string, agentId: string): Promise<CompiledOrgProfile | null> {
    const key = this.buildKey(orgId, agentId);
    const cached = await this.redisService.get<CompiledOrgProfile>(key);
    if (cached) {
      this.logger.debug(`Cache HIT for org=${orgId} agent=${agentId}`);
    } else {
      this.logger.debug(`Cache MISS for org=${orgId} agent=${agentId}`);
    }
    return cached;
  }

  /**
   * Build and store a compiled profile in Redis.
   * Called on cache miss or explicit invalidation.
   */
  async buildAndCacheProfile(
    orgId: string,
    agentId: string,
    orgContext: any,
    agentContext: any,
  ): Promise<CompiledOrgProfile> {
    const built = this.promptBuilder.build(
      {
        name: orgContext.name || 'our company',
        about: orgContext.about || '',
        productInfo: orgContext.productInfo || '',
        targetAudience: orgContext.targetAudience || '',
        industry: orgContext.industry || '',
        businessGoals: orgContext.businessGoals || '',
        supportInstructions: orgContext.supportInstructions || '',
        tone: orgContext.tone || 'professional',
        website: orgContext.website || '',
      },
      {
        name: agentContext.name || 'Assistant',
        gender: agentContext.gender || 'female',
        tone: agentContext.tone || 'professional',
        language: agentContext.language || 'hi-IN',
        customInstructions: agentContext.customInstructions || '',
      },
    );

    const profile: CompiledOrgProfile = {
      orgId,
      agentId,
      systemPrompt: agentContext.generatedSystemPrompt || agentContext.systemPrompt || built.systemPrompt,
      introPrompt: built.introPrompt,
      agentContext,
      orgContext,
      compiledAt: Date.now(),
    };

    const key = this.buildKey(orgId, agentId);
    await this.redisService.set(key, profile, this.ORG_CACHE_TTL);
    this.logger.debug(`Cached org profile for org=${orgId} agent=${agentId}`);
    return profile;
  }

  /**
   * Invalidate cached profiles for an entire org (e.g. when org is updated).
   * Scans for all agent keys under this org and deletes them.
   */
  async invalidateOrgCache(orgId: string): Promise<void> {
    const pattern = `org:${orgId}:agent:*:profile`;
    const keys = await this.redisService.scanKeys(pattern);
    if (keys.length > 0) {
      await this.redisService.delMany(keys);
      this.logger.log(`Invalidated ${keys.length} cached profiles for org=${orgId}`);
    }
  }

  /**
   * Invalidate cached profile for a specific agent (e.g. when agent is updated).
   */
  async invalidateAgentCache(orgId: string, agentId: string): Promise<void> {
    const key = this.buildKey(orgId, agentId);
    await this.redisService.del(key);
    this.logger.log(`Invalidated cached profile for org=${orgId} agent=${agentId}`);
  }
}
