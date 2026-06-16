import { Controller, Get, Put, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { UpdateTelephonyConfigDto } from './dto/telephony-config.dto';

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
  // Admin's Own Organizations
  // ──────────────────────────────────────────────────────────────────────

  @Get('my-organizations')
  async getMyOrganizations(@Req() req: any) {
    return this.adminService.getMyOrganizations(req.user._id);
  }

  @Get('my-organizations/:id')
  async getMyOrganizationById(@Req() req: any, @Param('id') id: string) {
    return this.adminService.getMyOrganizationById(req.user._id, id);
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
