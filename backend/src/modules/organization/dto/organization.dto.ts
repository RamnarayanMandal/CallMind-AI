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

  @ApiPropertyOptional({ example: 'AI voice calling, customer support automation, lead follow-up systems.' })
  @IsOptional() @IsString()
  productInfo?: string;

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

  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phoneNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industryCategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workingHours?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supportHours?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() escalationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() escalationEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tagline?: string;
  @ApiPropertyOptional() @IsOptional() brandColors?: { primary?: string; secondary?: string };
  @ApiPropertyOptional() @IsOptional() @IsString() defaultLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultWelcomeMessage?: string;
  @ApiPropertyOptional() @IsOptional() productsAndServices?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() returnPolicy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingPolicy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() refundPolicy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pricingInfo?: string;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
