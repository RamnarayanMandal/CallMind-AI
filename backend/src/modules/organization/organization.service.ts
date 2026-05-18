import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { User, UserDocument } from '../auth/schemas/user.schema';

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

  async update(id: string, dto: UpdateOrganizationDto, ownerId: string) {
    await this.findOne(id, ownerId);
    return this.repo.updateById(id, dto);
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);
    return this.repo.deleteById(id);
  }
}
