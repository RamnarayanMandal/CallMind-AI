import { Controller, Get, Param, Query } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  /** GET /api/v1/admin/analytics/overview — system-wide stats */
  @Get('overview')
  getSystemOverview() {
    return this.adminAnalyticsService.getSystemOverview();
  }

  /** GET /api/v1/admin/analytics/org-usage — per-org usage breakdown */
  @Get('org-usage')
  getOrgUsage() {
    return this.adminAnalyticsService.getOrgUsageBreakdown();
  }

  /** GET /api/v1/admin/analytics/org/:id/trend?days=30 */
  @Get('org/:id/trend')
  getOrgTrend(
    @Param('id') organizationId: string,
    @Query('days') days?: string,
  ) {
    return this.adminAnalyticsService.getCallTrendByOrg(organizationId, days ? parseInt(days) : 30);
  }
}
