import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { UsageService } from './usage.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  /** GET /api/v1/usage/summary?organizationId=&period= */
  @Get('summary')
  async getUsageSummary(
    @Query('organizationId') organizationId: string,
    @Query('period') period?: string,
  ): Promise<any> {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.usageService.getUsageSummary(organizationId, period);
  }

  /** GET /api/v1/usage/current?organizationId= */
  @Get('current')
  async getCurrentUsage(@Query('organizationId') organizationId: string): Promise<any> {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.usageService.getCurrentMonthUsage(organizationId);
  }

  /** GET /api/v1/usage/trends?organizationId=&days= */
  @Get('trends')
  async getUsageTrends(
    @Query('organizationId') organizationId: string,
    @Query('days') days?: string,
  ): Promise<any> {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.usageService.getUsageTrends(organizationId, days ? parseInt(days) : 30);
  }

  /** GET /api/v1/usage/breakdown?organizationId=&period= */
  @Get('breakdown')
  async getUsageBreakdown(
    @Query('organizationId') organizationId: string,
    @Query('period') period?: string,
  ): Promise<any> {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.usageService.getUsageBreakdown(organizationId, period);
  }
}
