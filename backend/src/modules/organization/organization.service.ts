import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { AgentService } from '../agent/agent.service';

import { OrgContextCacheService } from '../redis/org-context-cache.service';

@Injectable()
export class OrganizationRepository extends BaseRepository<OrganizationDocument> {
  constructor(@InjectModel(Organization.name) model: Model<OrganizationDocument>) {
    super(model);
  }
}

@Injectable()
export class OrganizationService {
  constructor(
    private readonly repo: OrganizationRepository,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    private readonly cacheService: OrgContextCacheService,
  ) {}

  async create(dto: CreateOrganizationDto, ownerId: string) {
    const org = await this.repo.create({ ...dto, ownerId });
    // Update the user's organizationId
    await this.userModel.findByIdAndUpdate(ownerId, { organizationId: org._id });
    return org;
  }

  async findAll(ownerId: string, pagination: PaginationDto) {
    return this.repo.findPaginated({ ownerId }, pagination);
  }

  async findOne(id: string, ownerId: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    if (org.ownerId.toString() !== ownerId) throw new ForbiddenException();
    return org;
  }

  async findById(id: string): Promise<OrganizationDocument | null> {
    return this.repo.findById(id);
  }

  async update(id: string, dto: UpdateOrganizationDto, ownerId: string) {
    await this.findOne(id, ownerId);
    const updatedOrg = await this.repo.updateById(id, dto);

    // Automatically regenerate prompts for all active agents under this organization
    try {
      await this.agentService.regeneratePromptsForOrganization(id);
      // Invalidate the cache to force recalculation on next call
      await this.cacheService.invalidateOrgCache(id);
    } catch (err) {
      // Log error but don't crash organization updates
      console.error(`Failed to propagate prompt updates for organization ${id}:`, err);
    }

    return updatedOrg;
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);
    // Invalidate the cache
    await this.cacheService.invalidateOrgCache(id);
    return this.repo.deleteById(id);
  }
}
