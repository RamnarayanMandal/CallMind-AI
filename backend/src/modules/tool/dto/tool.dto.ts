import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateToolDto {
  @IsString() @IsNotEmpty() organizationId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() displayName: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsString() category?: string;
  @IsObject() @IsNotEmpty() parameters: any;
  @IsOptional() @IsString() integrationId?: string;
  @IsOptional() @IsString() endpoint?: string;
  @IsOptional() @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) method?: string;
  @IsOptional() @IsObject() parameterMapping?: Record<string, string>;
  @IsOptional() @IsString() responseMapping?: string;
  @IsOptional() @IsString() responseTemplate?: string;
}

export class UpdateToolDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsObject() parameters?: any;
  @IsOptional() @IsString() integrationId?: string;
  @IsOptional() @IsString() endpoint?: string;
  @IsOptional() @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) method?: string;
  @IsOptional() @IsObject() parameterMapping?: Record<string, string>;
  @IsOptional() @IsString() responseMapping?: string;
  @IsOptional() @IsString() responseTemplate?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
