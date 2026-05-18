import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateCallDto, UpdateCallOutcomeDto, CallQueryDto } from './dto/call.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CallService } from './call.service';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a call' })
  create(@Body() dto: CreateCallDto) {
    return this.callService.create(dto);
  }

  @Get()
  findAll(@Query() query: CallQueryDto) {
    const { organizationId, search, status, ...pagination } = query;
    return this.callService.findAll(organizationId, pagination, search, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callService.findOne(id);
  }

  @Patch(':id/outcome')
  @ApiOperation({ summary: 'Update call outcome' })
  updateOutcome(@Param('id') id: string, @Body() dto: UpdateCallOutcomeDto) {
    return this.callService.updateOutcome(id, dto);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually trigger call execution' })
  execute(@Param('id') id: string) {
    return this.callService.executeCall(id);
  }
}
