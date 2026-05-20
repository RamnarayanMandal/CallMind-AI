import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeBase, KnowledgeBaseDocument } from './schemas/knowledge-base.schema';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly CACHE_TTL_SECONDS = 3600; // Cache search results for 1 hour

  constructor(
    @InjectModel(KnowledgeBase.name) private readonly model: Model<KnowledgeBaseDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBaseDocument> {
    const created = new this.model(dto);
    const saved = await created.save();
    await this.invalidateOrgFaqCache(dto.organizationId);
    return saved;
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto): Promise<KnowledgeBaseDocument> {
    const item = await this.model.findById(id);
    if (!item) {
      throw new NotFoundException('Knowledge item not found');
    }
    Object.assign(item, dto);
    const saved = await item.save();
    await this.invalidateOrgFaqCache(item.organizationId);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const item = await this.model.findById(id);
    if (!item) {
      throw new NotFoundException('Knowledge item not found');
    }
    await this.model.deleteOne({ _id: id });
    await this.invalidateOrgFaqCache(item.organizationId);
  }

  async findByOrg(organizationId: string): Promise<KnowledgeBaseDocument[]> {
    return this.model.find({ organizationId }).exec();
  }

  /**
   * Enterprise Hybrid Search (RAG)
   * Combines Text Index search and token-matching Jaccard overlap scoring for misspelled queries.
   */
  async search(organizationId: string, query: string, limit = 3): Promise<KnowledgeBaseDocument[]> {
    if (!query || query.trim() === '') return [];

    const cacheKey = `rag:${organizationId}:${query.toLowerCase().trim()}`;
    const cached = await this.redisService.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`RAG Cache HIT for query: "${query}"`);
      return cached;
    }

    this.logger.debug(`RAG Cache MISS for query: "${query}". Searching DB...`);

    // 1. First attempt: Standard MongoDB Text Search (with weights)
    let candidates = await this.model
      .find(
        { organizationId, $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit * 2)
      .exec();

    // 2. If text search returns nothing (often due to typos or partial token match), try regex token scanning
    if (candidates.length === 0) {
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      if (tokens.length > 0) {
        const regexes = tokens.map(token => new RegExp(token, 'i'));
        candidates = await this.model
          .find({
            organizationId,
            $or: [
              { question: { $in: regexes } },
              { answer: { $in: regexes } }
            ]
          })
          .limit(limit * 2)
          .exec();
      }
    }

    // 3. Score and rank candidates using token overlap similarity (Jaccard variant) to select top matches
    const queryTokens = new Set(query.toLowerCase().split(/\s+/).filter(t => t.length > 1));
    
    const scored = candidates.map(doc => {
      const docTokens = new Set(
        `${doc.question} ${doc.answer} ${doc.tags.join(' ')}`
          .toLowerCase()
          .split(/\s+/)
          .filter(t => t.length > 1)
      );

      // Jaccard similarity coefficient
      let intersection = 0;
      queryTokens.forEach(token => {
        if (docTokens.has(token)) intersection++;
      });
      const union = queryTokens.size + docTokens.size - intersection;
      const jaccardScore = union > 0 ? intersection / union : 0;

      return { doc, score: jaccardScore };
    });

    // Sort by descending overlap score
    const ranked = scored
      .filter(item => item.score > 0.05) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc)
      .slice(0, limit);

    // Cache results
    await this.redisService.set(cacheKey, ranked, this.CACHE_TTL_SECONDS);

    return ranked;
  }

  private async invalidateOrgFaqCache(organizationId: string) {
    const pattern = `rag:${organizationId}:*`;
    const keys = await this.redisService.scanKeys(pattern);
    if (keys.length > 0) {
      await this.redisService.delMany(keys);
      this.logger.log(`Invalidated ${keys.length} cached RAG queries for org=${organizationId}`);
    }
  }
}
