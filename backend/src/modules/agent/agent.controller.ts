import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateAgentDto, UpdateAgentDto, AgentQueryDto } from './dto/agent.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PaginationDto } from '@common/dto/pagination.dto';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiOperation({ summary: 'Create AI agent' })
  create(@Body() dto: CreateAgentDto, @CurrentUser('sub') userId: string) {
    return this.agentService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List agents by organization' })
  findAll(@Query() query: AgentQueryDto) {
    return this.agentService.findAll(query.organizationId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }
}
