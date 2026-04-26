import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Filter by template id',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Filter by slot date',
    example: '2026-05-01',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by slot status',
    enum: TIME_SLOT_STATUS_VALUES,
  })
  @IsOptional()
  @Type(() => String)
  @IsIn(TIME_SLOT_STATUS_VALUES)
  status?: TimeSlotStatus;
}
