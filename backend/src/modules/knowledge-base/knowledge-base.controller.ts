import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @ApiOperation({ summary: 'Create a new Knowledge Base entry' })
  @Post()
  async create(@Body() dto: CreateKnowledgeBaseDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all entries for an organization' })
  @Get()
  async findAll(@Query('organizationId') orgId: string) {
    return this.service.findByOrg(orgId);
  }

  @ApiOperation({ summary: 'Update a specific entry' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an entry' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @ApiOperation({ summary: 'Upload a PDF to extract knowledge' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('organizationId') organizationId: string,
  ) {
    if (!file || !organizationId) {
      throw new Error('File and organizationId are required');
    }
    await this.service.parsePdf(organizationId, file.buffer, file.originalname);
    return { success: true, message: 'PDF parsed successfully' };
  }

  @ApiOperation({ summary: 'Test RAG Search' })
  @Post('test-rag')
  async testRag(@Body() body: { organizationId: string; question: string }) {
    const results = await this.service.search(body.organizationId, body.question, 3);
    
    // Format response to mock what the LLM would get
    const contextStr = results.map(r => `[${r.title || 'FAQ'}] ${r.content || r.answer}`).join('\n\n');
    const answer = results.length > 0 
      ? `Based on the retrieved context, here is the information:\n\n${contextStr}`
      : "I couldn't find any information matching that query in the knowledge base.";

    return {
      answer,
      sources: results.map(r => ({ title: r.title, content: r.content, answer: r.answer, type: r.type }))
    };
  }
}
