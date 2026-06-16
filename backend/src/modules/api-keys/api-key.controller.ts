import { Controller, Get, Post, Delete, Patch, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /** POST /api/v1/api-keys */
  @Post()
  async createApiKey(@Body() body: {
    organizationId: string;
    name: string;
    permissions?: string[];
    rateLimit?: number;
  }) {
    if (!body.organizationId || !body.name) {
      throw new BadRequestException('organizationId and name are required');
    }
    return this.apiKeyService.createApiKey(
      body.organizationId,
      body.name,
      body.permissions,
      body.rateLimit,
    );
  }

  /** GET /api/v1/api-keys?organizationId= */
  @Get()
  async getApiKeys(@Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.apiKeyService.getApiKeys(organizationId);
  }

  /** DELETE /api/v1/api-keys/:id */
  @Delete(':id')
  async deleteApiKey(@Param('id') id: string) {
    return this.apiKeyService.deleteApiKey(id);
  }

  /** PATCH /api/v1/api-keys/:id/revoke */
  @Patch(':id/revoke')
  async revokeApiKey(@Param('id') id: string) {
    return this.apiKeyService.revokeApiKey(id);
  }

  /** PATCH /api/v1/api-keys/:id/rate-limit */
  @Patch(':id/rate-limit')
  async updateRateLimit(@Param('id') id: string, @Body() body: { rateLimit: number }) {
    if (!body.rateLimit || body.rateLimit < 1) {
      throw new BadRequestException('rateLimit must be a positive number');
    }
    return this.apiKeyService.updateRateLimit(id, body.rateLimit);
  }
}
