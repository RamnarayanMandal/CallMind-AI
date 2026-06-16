import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  // Industry standard rate limits (requests per minute)
  private readonly DEFAULT_RATE_LIMIT = 60;
  private readonly MAX_RATE_LIMIT = 1000;

  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  /**
   * Create a new API key for an organization
   */
  async createApiKey(
    organizationId: string,
    name: string,
    permissions: string[] = ['read'],
    rateLimit: number = this.DEFAULT_RATE_LIMIT,
  ) {
    // Generate a secure API key
    const key = this.generateApiKey();
    const hash = this.hashApiKey(key);

    // Validate rate limit
    const validatedRateLimit = Math.min(Math.max(1, rateLimit), this.MAX_RATE_LIMIT);

    const apiKey = await this.apiKeyModel.create({
      organizationId,
      name,
      key,
      hash,
      permissions,
      rateLimit: validatedRateLimit,
      isActive: true,
    });

    this.logger.log(`API key created: ${name} for org ${organizationId}`);

    // Return the key only once - it won't be retrievable again
    return {
      _id: apiKey._id,
      name: apiKey.name,
      key,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      createdAt: (apiKey as any).createdAt || new Date(),
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string) {
    const hash = this.hashApiKey(key);
    const apiKey = await this.apiKeyModel.findOne({
      hash,
      isActive: true,
    }).lean();

    if (!apiKey) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      this.logger.warn(`API key expired: ${apiKey.name}`);
      return null;
    }

    // Update last used timestamp
    await this.apiKeyModel.findByIdAndUpdate(apiKey._id, {
      lastUsedAt: new Date(),
    });

    return apiKey;
  }

  /**
   * Get all API keys for an organization
   */
  async getApiKeys(organizationId: string) {
    return this.apiKeyModel
      .find({ organizationId })
      .select('-hash') // Never return the hash
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string) {
    const apiKey = await this.apiKeyModel.findById(id);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyModel.findByIdAndUpdate(id, {
      isActive: false,
    });

    this.logger.log(`API key revoked: ${apiKey.name}`);
    return { success: true };
  }

  /**
   * Update rate limit for an API key
   */
  async updateRateLimit(id: string, rateLimit: number) {
    const validatedRateLimit = Math.min(Math.max(1, rateLimit), this.MAX_RATE_LIMIT);

    const apiKey = await this.apiKeyModel.findByIdAndUpdate(
      id,
      { rateLimit: validatedRateLimit },
      { new: true },
    ).select('-hash').lean();

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    this.logger.log(`API key rate limit updated: ${apiKey.name} → ${validatedRateLimit} rpm`);
    return apiKey;
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(id: string) {
    const apiKey = await this.apiKeyModel.findByIdAndDelete(id);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    this.logger.log(`API key deleted: ${apiKey.name}`);
    return { success: true };
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private generateApiKey(): string {
    // Generate a secure random API key with prefix
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `cm_${randomBytes}`;
  }

  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
