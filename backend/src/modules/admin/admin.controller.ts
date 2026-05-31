import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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
