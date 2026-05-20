import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: 'The organization ID this knowledge item belongs to' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'The FAQ question or search key' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'The detailed answer/response guidelines' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: 'Tags for classification and filtering', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateKnowledgeBaseDto {
  @ApiProperty({ description: 'The FAQ question or search key', required: false })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({ description: 'The detailed answer/response guidelines', required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ description: 'Tags for classification and filtering', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
