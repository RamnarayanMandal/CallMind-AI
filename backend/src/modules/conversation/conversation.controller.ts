import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { PaginationDto } from '@common/dto/pagination.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({ summary: 'List all conversations for an organization' })
  findAll(@Query('organizationId') orgId: string, @Query() pagination: PaginationDto) {
    return this.conversationService.findAll(orgId, pagination);
  }

  @Get('call/:callId')
  @ApiOperation({ summary: 'Get conversation transcript by call ID' })
  findByCallId(@Param('callId') callId: string) {
    return this.conversationService.findByCallId(callId);
  }

  @Post('call/:callId/finalize')
  @ApiOperation({ summary: 'Finalize conversation and generate AI summary' })
  finalize(@Param('callId') callId: string) {
    return this.conversationService.finalizeConversation(callId);
  }
}
