import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import {
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateTimeSlotTemplateDto {
  @ApiProperty({ description: 'Venue id', format: 'uuid' })
  @IsUUID()
  venueId!: string;

  @ApiProperty({ description: 'Name of the template (e.g. Standard, Weekend)' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Optional Court id to override venue template', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @ApiProperty({
    description: 'Weekdays array',
    enum: TIME_SLOT_WEEKDAY_VALUES,
    isArray: true,
  })
  @Type(() => Number)
  @IsInt({ each: true })
  @IsIn(TIME_SLOT_WEEKDAY_VALUES, { each: true })
  weekdays!: TimeSlotWeekday[];

  @ApiProperty({ description: 'Start time in HH:mm or HH:mm:ss' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm or HH:mm:ss' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime!: string;

  @ApiProperty({ description: 'Template price', example: 200000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Template active status', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
