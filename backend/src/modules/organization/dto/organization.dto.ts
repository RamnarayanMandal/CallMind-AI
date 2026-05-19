import { IsString, IsNotEmpty, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OrgTone } from '../schemas/organization.schema';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Bivha Technologies' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'We provide AI-powered voice automation solutions for businesses.' })
  @IsString() @IsNotEmpty()
  about: string;

  @ApiProperty({ example: 'AI voice calling, customer support automation, lead follow-up systems.' })
  @IsString() @IsNotEmpty()
  productInfo: string;

  @ApiPropertyOptional({ example: 'Small and medium businesses in retail, healthcare, and finance.' })
  @IsOptional() @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ example: 'SaaS / AI Technology' })
  @IsOptional() @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'Generate leads, automate support calls, reduce churn.' })
  @IsOptional() @IsString()
  businessGoals?: string;

  @ApiPropertyOptional({ example: 'Always ask for customer consent before continuing. Never make medical claims.' })
  @IsOptional() @IsString()
  supportInstructions?: string;

  @ApiPropertyOptional({ enum: OrgTone, example: OrgTone.FRIENDLY })
  @IsOptional() @IsEnum(OrgTone)
  tone?: OrgTone;

  @ApiPropertyOptional({ example: 'https://bivhatechnologies.com' })
  @IsOptional() @IsString()
  website?: string;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
