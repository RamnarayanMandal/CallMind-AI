import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeBaseType, KnowledgeSourceType } from '../schemas/knowledge-base.schema';

export class CreateKnowledgeBaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ enum: KnowledgeBaseType })
  @IsEnum(KnowledgeBaseType)
  @IsOptional()
  type?: KnowledgeBaseType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ enum: KnowledgeSourceType })
  @IsEnum(KnowledgeSourceType)
  @IsOptional()
  sourceType?: KnowledgeSourceType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional() @IsString() @IsOptional() agentId?: string;
  @ApiPropertyOptional({ enum: KnowledgeBaseType }) @IsEnum(KnowledgeBaseType) @IsOptional() type?: KnowledgeBaseType;
  @ApiPropertyOptional() @IsString() @IsOptional() title?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() question?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() answer?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() content?: string;
  @ApiPropertyOptional() @IsArray() @IsString({ each: true }) @IsOptional() tags?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() priority?: number;
  @ApiPropertyOptional({ enum: KnowledgeSourceType }) @IsEnum(KnowledgeSourceType) @IsOptional() sourceType?: KnowledgeSourceType;
  @ApiPropertyOptional() @IsString() @IsOptional() sourceUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fileName?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
