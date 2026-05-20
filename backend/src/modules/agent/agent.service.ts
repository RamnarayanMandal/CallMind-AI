import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { OrganizationService } from '../organization/organization.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';

import { OrgContextCacheService } from '../redis/org-context-cache.service';

@Injectable()
export class AgentRepository extends BaseRepository<AgentDocument> {
  constructor(@InjectModel(Agent.name) model: Model<AgentDocument>) {
    super(model);
  }

  async findByOrganization(organizationId: string): Promise<AgentDocument[]> {
    return this.model.find({ organizationId, isActive: true }).exec();
  }
}

@Injectable()
export class AgentService {
  constructor(
    private readonly repo: AgentRepository,
    @Inject(forwardRef(() => OrganizationService))
    private readonly orgService: OrganizationService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly cacheService: OrgContextCacheService,
  ) {}

  async create(dto: CreateAgentDto, userId: string): Promise<AgentDocument> {
    const org = await this.orgService.findById(dto.organizationId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Build the dynamic prompt
    const prompts = this.promptBuilder.build(
      {
        name: org.name,
        about: org.about,
        productInfo: org.productInfo,
        targetAudience: org.targetAudience,
        industry: org.industry,
        businessGoals: org.businessGoals,
        supportInstructions: org.supportInstructions,
        tone: org.tone,
        website: org.website,
      },
      {
        name: dto.name,
        gender: dto.gender,
        tone: dto.tone,
        language: dto.language,
        customInstructions: dto.customInstructions,
      }
    );

    return this.repo.create({
      ...dto,
      createdBy: userId,
      generatedSystemPrompt: prompts.systemPrompt,
    });
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    return this.repo.findPaginated({ organizationId, isActive: true }, pagination);
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.repo.findById(id);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentDocument> {
    const agent = await this.findOne(id);
    const updatedData: any = { ...dto };

    // If identity or customInstructions are updated, regenerate the prompt
    if (
      dto.name ||
      dto.gender ||
      dto.tone ||
      dto.language ||
      dto.customInstructions !== undefined
    ) {
      const org = await this.orgService.findById(agent.organizationId);
      if (org) {
        const prompts = this.promptBuilder.build(
          {
            name: org.name,
            about: org.about,
            productInfo: org.productInfo,
            targetAudience: org.targetAudience,
            industry: org.industry,
            businessGoals: org.businessGoals,
            supportInstructions: org.supportInstructions,
            tone: org.tone,
            website: org.website,
          },
          {
            name: dto.name || agent.name,
            gender: dto.gender || agent.gender,
            tone: dto.tone || agent.tone,
            language: dto.language || agent.language,
            customInstructions: dto.customInstructions !== undefined ? dto.customInstructions : agent.customInstructions,
          }
        );
        updatedData.generatedSystemPrompt = prompts.systemPrompt;
      }
    }

    const updatedAgent = await this.repo.updateById(id, updatedData);
    if (!updatedAgent) throw new NotFoundException('Agent not found');
    
    // Invalidate the cache to ensure new settings take effect
    await this.cacheService.invalidateAgentCache(agent.organizationId, id);
    
    return updatedAgent;
  }

  async remove(id: string) {
    const agent = await this.findOne(id);
    await this.cacheService.invalidateAgentCache(agent.organizationId, id);
    return this.repo.updateById(id, { isActive: false });
  }

  /**
   * Regenerates system prompts for all active agents in an organization.
   * Triggered when organization profile details are updated.
   */
  async regeneratePromptsForOrganization(organizationId: string): Promise<void> {
    const org = await this.orgService.findById(organizationId);
    if (!org) return;

    const agents = await this.repo.findByOrganization(organizationId);
    for (const agent of agents) {
      const prompts = this.promptBuilder.build(
        {
          name: org.name,
          about: org.about,
          productInfo: org.productInfo,
          targetAudience: org.targetAudience,
          industry: org.industry,
          businessGoals: org.businessGoals,
          supportInstructions: org.supportInstructions,
          tone: org.tone,
          website: org.website,
        },
        {
          name: agent.name,
          gender: agent.gender,
          tone: agent.tone,
          language: agent.language,
          customInstructions: agent.customInstructions,
        }
      );

      await this.repo.updateById(agent.id || agent._id.toString(), {
        generatedSystemPrompt: prompts.systemPrompt,
      });
    }
  }
}
