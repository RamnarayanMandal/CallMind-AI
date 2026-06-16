import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query, Res, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import axios from 'axios';
import { CreateCallDto, UpdateCallOutcomeDto, CallQueryDto } from './dto/call.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CallService } from './call.service';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller(['calls', 'call'])
export class CallController {
  private readonly logger = new Logger(CallController.name);

  constructor(private readonly callService: CallService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a call' })
  create(@Body() dto: CreateCallDto) {
    return this.callService.create(dto);
  }

  @Get()
  findAll(@Query() query: CallQueryDto) {
    const { organizationId, search, status, ...pagination } = query;
    return this.callService.findAll(organizationId, pagination, search, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callService.findOne(id);
  }

  @Get(':id/recording')
  @ApiOperation({ summary: 'Proxy recording audio stream' })
  async getRecording(@Param('id') id: string, @Res() res: Response) {
    const call = await this.callService.findOne(id);
    if (!call.recordingUrl) {
      return res.status(404).json({ message: 'No recording available for this call' });
    }

    try {
      const response = await axios.get(call.recordingUrl, {
        responseType: 'stream',
        timeout: 15000,
        headers: {
          'User-Agent': 'CallMind-AI/1.0',
          'X-Auth-ID': process.env.VOBIZ_AUTH_ID || '',
          'X-Auth-Token': process.env.VOBIZ_AUTH_TOKEN || '',
        },
      });

      res.set({
        'Content-Type': response.headers['content-type'] || 'audio/mpeg',
        'Content-Length': response.headers['content-length'],
        'Accept-Ranges': 'bytes',
      });
      response.data.pipe(res);
    } catch (err) {
      this.logger.error(`Recording proxy failed for call ${id}: ${err.message}`);
      return res.status(502).json({ message: 'Failed to fetch recording' });
    }
  }

  @Patch(':id/outcome')
  @ApiOperation({ summary: 'Update call outcome' })
  updateOutcome(@Param('id') id: string, @Body() dto: UpdateCallOutcomeDto) {
    return this.callService.updateOutcome(id, dto);
  }

  @Get('history/list')
  @ApiOperation({ summary: 'Get call history with conversations' })
  async getHistory(
    @Query('organizationId') organizationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<{ data: any[]; meta: any }> {
    return this.callService.findHistory(organizationId, Number(page), Number(limit));
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually trigger call execution' })
  execute(@Param('id') id: string) {
    return this.callService.executeCall(id);
  }
}
