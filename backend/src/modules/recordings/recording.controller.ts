import { Controller, Get, Delete, Param, Query, BadRequestException } from '@nestjs/common';
import { RecordingService } from './recording.service';

@Controller('recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  /** GET /api/v1/recordings?organizationId=&page=&limit=&search=&status= */
  @Get()
  async getRecordings(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.recordingService.getRecordings(organizationId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  /** GET /api/v1/recordings/storage-analytics?organizationId= */
  @Get('storage-analytics')
  async getStorageAnalytics(@Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.recordingService.getStorageAnalytics(organizationId);
  }

  /** GET /api/v1/recordings/search?organizationId=&q= */
  @Get('search')
  async searchRecordings(
    @Query('organizationId') organizationId: string,
    @Query('q') query: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.recordingService.searchRecordings(organizationId, query || '');
  }

  /** GET /api/v1/recordings/:id */
  @Get(':id')
  async getRecordingById(@Param('id') id: string) {
    return this.recordingService.getRecordingById(id);
  }

  /** DELETE /api/v1/recordings/:id */
  @Delete(':id')
  async deleteRecording(@Param('id') id: string) {
    return this.recordingService.deleteRecording(id);
  }
}
