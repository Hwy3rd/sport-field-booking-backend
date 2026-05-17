import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class TimeSlotTemplateQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter by venue id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Filter by court id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @ApiPropertyOptional({ description: 'Filter by template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by weekday',
    enum: TIME_SLOT_WEEKDAY_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(TIME_SLOT_WEEKDAY_VALUES)
  weekday?: TimeSlotWeekday;

  @ApiPropertyOptional({ description: 'Filter by template active status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by min price' })
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by max price' })
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by weekdays (comma-separated like 1,2,5)' })
  @IsOptional()
  @IsString()
  weekdays?: string;

  @ApiPropertyOptional({ description: 'Filter overlap start time' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Filter overlap end time' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
