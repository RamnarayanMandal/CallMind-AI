import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class NotificationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class MarkReadDto {
  @IsString({ each: true })
  ids?: string[];
}
