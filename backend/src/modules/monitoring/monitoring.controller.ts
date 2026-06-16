import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /** GET /api/v1/monitoring/dashboard */
  @Get('dashboard')
  async getDashboard() {
    return this.monitoringService.getMonitoringDashboard();
  }

  /** GET /api/v1/monitoring/latency-trends?type=api&hours=24 */
  @Get('latency-trends')
  async getLatencyTrends(
    @Query('type') type: 'api' | 'ai' | 'call',
    @Query('hours') hours?: string,
  ) {
    return this.monitoringService.getLatencyTrends(type || 'api', hours ? parseInt(hours) : 24);
  }

  /** GET /api/v1/monitoring/error-rates?hours=24 */
  @Get('error-rates')
  async getErrorRates(@Query('hours') hours?: string) {
    return this.monitoringService.getErrorRatesOverTime(hours ? parseInt(hours) : 24);
  }

  /** GET /api/v1/monitoring/success-rate?organizationId=&days=7 */
  @Get('success-rate')
  async getSuccessRate(
    @Query('organizationId') organizationId?: string,
    @Query('days') days?: string,
  ) {
    return this.monitoringService.getCallSuccessRate(organizationId, days ? parseInt(days) : 7);
  }
}
