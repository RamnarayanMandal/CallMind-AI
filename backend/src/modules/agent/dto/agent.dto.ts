import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AgentGender, AgentTone, AgentLanguage } from '../schemas/agent.schema';
import { PaginationDto } from '@common/dto/pagination.dto';

export class CreateAgentDto {
  @ApiProperty({ example: 'SANGEETA' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: AgentGender, default: AgentGender.FEMALE })
  @IsOptional() @IsEnum(AgentGender)
  gender?: AgentGender;

  @ApiPropertyOptional({ enum: AgentTone, default: AgentTone.FRIENDLY })
  @IsOptional() @IsEnum(AgentTone)
  tone?: AgentTone;

  @ApiPropertyOptional({ example: 'hi-IN' })
  @IsOptional() @IsString()
  language?: string;

  /**
   * Optional user-supplied extra instructions — appended to the
   * auto-generated system prompt. Replaces the old "systemPrompt" field
   * for new agents.
   */
  @ApiPropertyOptional({ example: 'Always ask for the customer\'s name first. Focus on appointment scheduling.' })
  @IsOptional() @IsString()
  customInstructions?: string;

  /**
   * Legacy manual system prompt (kept for backward compatibility).
   * If provided, bypasses auto-generation entirely.
   */
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  systemPrompt?: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  organizationId: string;
}

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}

export class AgentQueryDto extends PaginationDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  organizationId: string;
}
