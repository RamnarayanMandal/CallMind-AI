import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { buildPaginationMeta, buildSkip, PaginatedResult, PaginationOptions } from '../utils/pagination.util';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean() as any;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean() as any;
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).lean() as any;
  }

  async findPaginated(
    filter: FilterQuery<T>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = buildSkip(page, limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as any;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return { data: data as any, meta: buildPaginationMeta(total, page, limit) };
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save() as any;
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean() as any;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }
}
