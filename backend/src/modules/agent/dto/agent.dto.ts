import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AgentGender, AgentTone } from '../schemas/agent.schema';
import { PaginationDto } from '@common/dto/pagination.dto';

export class CreateAgentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: AgentGender })
  @IsOptional()
  @IsEnum(AgentGender)
  gender?: AgentGender;

  @ApiPropertyOptional({ enum: AgentTone })
  @IsOptional()
  @IsEnum(AgentTone)
  tone?: AgentTone;

  @ApiPropertyOptional({ example: 'en-IN' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}

export class AgentQueryDto extends PaginationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
