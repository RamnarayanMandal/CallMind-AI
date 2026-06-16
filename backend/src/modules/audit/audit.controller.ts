import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /** GET /api/v1/audit/logs?organizationId=&page=&limit=&action=&resource= */
  @Get('logs')
  async getAuditLogs(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.auditService.getAuditLogs(organizationId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      action,
      resource,
      userId,
      startDate,
      endDate,
    });
  }

  /** GET /api/v1/audit/logs/:id */
  @Get('logs/:id')
  async getAuditLogById(@Param('id') id: string) {
    return this.auditService.getAuditLogById(id);
  }
}
