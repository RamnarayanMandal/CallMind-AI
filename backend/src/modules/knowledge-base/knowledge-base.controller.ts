import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';

@ApiTags('Knowledge Base (FAQ)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations/:orgId/knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @ApiOperation({ summary: 'Create a new FAQ/Knowledge Base entry' })
  @Post()
  async create(@Param('orgId') orgId: string, @Body() dto: CreateKnowledgeBaseDto) {
    dto.organizationId = orgId;
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all FAQ entries for an organization' })
  @Get()
  async findAll(@Param('orgId') orgId: string) {
    return this.service.findByOrg(orgId);
  }

  @ApiOperation({ summary: 'Update a specific FAQ entry' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an FAQ entry' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
