import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  TIME_SLOT_STATUS_VALUES,
  type TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class TimeSlotQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by court id',
    format: 'uuid',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Filter by template id',
    format: 'uuid',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Filter by slot date',
    example: '2026-05-01',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by slot status',
    enum: TIME_SLOT_STATUS_VALUES,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @Type(() => String)
  @IsIn(TIME_SLOT_STATUS_VALUES)
  status?: TimeSlotStatus;

  @ApiPropertyOptional({ description: 'Filter by venue id', format: 'uuid' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date', example: '2026-05-01' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date', example: '2026-05-07' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by min price' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by max price' })
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;
}
