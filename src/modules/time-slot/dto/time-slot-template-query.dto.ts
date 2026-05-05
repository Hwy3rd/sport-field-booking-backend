import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class TimeSlotTemplateQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter by court id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Filter by weekday',
    enum: TIME_SLOT_WEEKDAY_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(TIME_SLOT_WEEKDAY_VALUES)
  weekday?: TimeSlotWeekday;
}
