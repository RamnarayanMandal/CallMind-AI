import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /** GET /api/v1/export/calls?organizationId=&startDate=&endDate=&status= */
  @Get('calls')
  async exportCalls(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const result = await this.exportService.exportCalls(organizationId, {
      startDate,
      endDate,
      status,
    });

    const csv = this.exportService.generateCsv(result.data, result.headers);
    
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=calls-export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    return { csv, filename: `calls-export-${new Date().toISOString().split('T')[0]}.csv` };
  }

  /** GET /api/v1/export/transcripts?organizationId=&startDate=&endDate= */
  @Get('transcripts')
  async exportTranscripts(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const result = await this.exportService.exportTranscripts(organizationId, {
      startDate,
      endDate,
    });

    const csv = this.exportService.generateCsv(result.data, result.headers);
    
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transcripts-export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    return { csv, filename: `transcripts-export-${new Date().toISOString().split('T')[0]}.csv` };
  }
}
