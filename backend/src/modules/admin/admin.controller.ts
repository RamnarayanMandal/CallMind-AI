import { Controller, Get, Put, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { UpdateTelephonyConfigDto } from './dto/telephony-config.dto';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../organization/dto/organization.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('subscriptions')
  async getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Organization Billing
  // ──────────────────────────────────────────────────────────────────────

  @Get('organizations')
  async getOrganizations() {
    return this.adminService.getOrganizations();
  }

  @Get('organizations/:id')
  async getOrganizationById(@Param('id') id: string) {
    return this.adminService.getOrganizationById(id);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Admin's Own Organizations — CRUD + Pagination
  // ──────────────────────────────────────────────────────────────────────

  @Get('my-organizations')
  async getMyOrganizations(@Req() req: any, @Query() pagination: PaginationDto) {
    return this.adminService.getMyOrganizations(req.user._id, pagination);
  }

  @Post('my-organizations')
  async createMyOrganization(@Req() req: any, @Body() dto: CreateOrganizationDto) {
    return this.adminService.createMyOrganization(req.user._id, dto);
  }

  @Get('my-organizations/:id')
  async getMyOrganizationById(@Req() req: any, @Param('id') id: string) {
    return this.adminService.getMyOrganizationById(req.user._id, id);
  }

  @Patch('my-organizations/:id')
  async updateMyOrganization(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.adminService.updateMyOrganization(req.user._id, id, dto);
  }

  @Delete('my-organizations/:id')
  async deleteMyOrganization(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteMyOrganization(req.user._id, id);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Admin Profile & Password
  // ──────────────────────────────────────────────────────────────────────

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() body: { name?: string; email?: string }) {
    return this.adminService.updateProfile(req.user._id, body);
  }

  @Post('change-password')
  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.adminService.changePassword(req.user._id, body.currentPassword, body.newPassword);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Telephony Provider Configuration (Super Admin only)
  // ──────────────────────────────────────────────────────────────────────

  @Get('telephony-config')
  async getTelephonyConfig() {
    return this.adminService.getTelephonyConfig();
  }

  @Put('telephony-config')
  async updateTelephonyConfig(@Body() dto: UpdateTelephonyConfigDto) {
    return this.adminService.updateTelephonyConfig(dto);
  }
}
