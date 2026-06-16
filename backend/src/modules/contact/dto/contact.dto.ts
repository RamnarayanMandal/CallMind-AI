import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { ContactStatus } from '../schemas/contact.schema';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class AssignAgentDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;
}

export class ContactQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateResponseDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}
