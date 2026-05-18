import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';

@Injectable()
export class AgentRepository extends BaseRepository<AgentDocument> {
  constructor(@InjectModel(Agent.name) model: Model<AgentDocument>) {
    super(model);
  }
}

@Injectable()
export class AgentService {
  constructor(private readonly repo: AgentRepository) {}

  async create(dto: CreateAgentDto, userId: string) {
    return this.repo.create({ ...dto, createdBy: userId });
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    return this.repo.findPaginated({ organizationId, isActive: true }, pagination);
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.repo.findById(id);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    const agent = await this.repo.updateById(id, dto);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async remove(id: string) {
    return this.repo.updateById(id, { isActive: false });
  }
}
