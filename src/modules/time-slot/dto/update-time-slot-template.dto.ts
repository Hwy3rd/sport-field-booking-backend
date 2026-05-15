import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import {
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';
import { CreateTimeSlotTemplateDto } from './create-time-slot-template.dto';

export class UpdateTimeSlotTemplateDto extends PartialType(
  CreateTimeSlotTemplateDto,
) {
  @ApiPropertyOptional({
    description: 'Single weekday override for this record',
    enum: TIME_SLOT_WEEKDAY_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(TIME_SLOT_WEEKDAY_VALUES)
  weekday?: TimeSlotWeekday;
}
