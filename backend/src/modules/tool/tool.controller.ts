import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.toolService.findByOrg(organizationId);
  }

  @Post()
  create(@Body() dto: CreateToolDto) {
    return this.toolService.create(dto as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateToolDto) {
    return this.toolService.update(id, dto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolService.remove(id);
  }

  @Post('seed-ecommerce')
  seedEcommerce(@Body() body: { organizationId: string; integrationId?: string }) {
    return this.toolService.seedEcommerceTools(body.organizationId, body.integrationId);
  }
}
