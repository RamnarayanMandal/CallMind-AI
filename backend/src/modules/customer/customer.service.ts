import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BaseRepository } from '@common/repositories/base.repository';

@Injectable()
export class CustomerRepository extends BaseRepository<CustomerDocument> {
  constructor(@InjectModel(Customer.name) model: Model<CustomerDocument>) {
    super(model);
  }

  async bulkUpsert(customers: Partial<CustomerDocument>[]): Promise<number> {
    const ops = customers.map((c) => ({
      updateOne: {
        filter: { organizationId: c.organizationId, phone: c.phone },
        update: { $set: c },
        upsert: true,
      },
    }));
    const result = await this.model.bulkWrite(ops as any);
    return result.upsertedCount + result.modifiedCount;
  }
}

@Injectable()
export class CustomerService {
  constructor(private readonly repo: CustomerRepository) {}

  async create(dto: CreateCustomerDto) {
    return this.repo.create(dto);
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    return this.repo.findPaginated({ organizationId, isActive: true }, pagination);
  }

  async findIdsBySearch(organizationId: string, search: string): Promise<string[]> {
    const customers = await this.repo.findAll({
      organizationId,
      name: { $regex: search, $options: 'i' },
    });
    return customers.map((c: any) => c._id.toString());
  }

  async findOne(id: string): Promise<CustomerDocument> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.repo.updateById(id, dto);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async remove(id: string) {
    return this.repo.updateById(id, { isActive: false });
  }

  async bulkUploadCsv(file: Express.Multer.File, organizationId: string): Promise<{ imported: number }> {
    if (!file) throw new BadRequestException('No file uploaded');

    let records: any[];
    try {
      records = parse(file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    const customers = records.map((r: any) => ({
      name: r.name || r.Name,
      phone: r.phone || r.Phone,
      email: r.email || r.Email,
      company: r.company || r.Company,
      organizationId,
    }));

    const imported = await this.repo.bulkUpsert(customers);
    return { imported };
  }
}
