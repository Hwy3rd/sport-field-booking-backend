import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';
import { TIME_REGEX } from 'src/libs/constants/regex.constant';
import type { VenueStatus } from 'src/libs/constants/venue.constant';

export class VenueQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by venue name (partial match)',
    example: 'Sport Center',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by address (partial match)',
    example: 'Quan 1',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Filter by operating hours start time',
    example: '18:00:00',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by operating hours end time',
    example: '19:30:00',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner ID',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by venue status',
  })
  @IsOptional()
  @IsString()
  status?: VenueStatus;
}
