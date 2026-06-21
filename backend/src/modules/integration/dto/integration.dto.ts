import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNotEmpty, IsMongoId } from 'class-validator';
import { IntegrationType, AuthType } from '../integration.schema';

export class CreateIntegrationDto {
  @IsMongoId()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IntegrationType)
  @IsOptional()
  type?: IntegrationType;

  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsEnum(AuthType)
  @IsOptional()
  authType?: AuthType;

  // Raw credentials (will be encrypted before saving)
  @IsObject()
  @IsOptional()
  credentials?: {
    apiKey?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  };

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsString()
  @IsOptional()
  shopDomain?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateIntegrationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsEnum(AuthType)
  @IsOptional()
  authType?: AuthType;

  @IsObject()
  @IsOptional()
  credentials?: Record<string, string>;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
