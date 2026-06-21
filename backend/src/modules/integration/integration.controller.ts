import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('templates')
  getTemplates() {
    return this.integrationService.getTemplates();
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.integrationService.findByOrg(organizationId);
  }

  @Post()
  create(@Body() dto: CreateIntegrationDto) {
    return this.integrationService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    return this.integrationService.update(id, dto);
  }

  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.integrationService.testConnection(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationService.remove(id);
  }
}
