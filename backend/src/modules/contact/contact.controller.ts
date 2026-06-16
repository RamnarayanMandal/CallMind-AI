import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto, AssignAgentDto, ContactQueryDto, UpdateResponseDto } from './dto/contact.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles, Role } from '@common/decorators/roles.decorator';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contacts')
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async findAll(@Query() query: ContactQueryDto) {
    return this.contactService.findAll(query);
  }

  @Get('contacts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async findById(@Param('id') id: string) {
    return this.contactService.findById(id);
  }

  @Patch('contacts/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.contactService.assignAgent(id, dto.agentId);
  }

  @Post('contacts/:id/trigger-call')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async triggerCall(@Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.contactService.triggerCall(id, dto.agentId);
  }

  @Patch('contacts/:id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateResponse(@Param('id') id: string, @Body() dto: UpdateResponseDto) {
    return this.contactService.updateResponse(id, dto.response);
  }
}
