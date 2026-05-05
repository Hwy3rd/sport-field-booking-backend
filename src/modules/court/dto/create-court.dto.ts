import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_VALUES,
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotStatus,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';
import { TIME_REGEX } from 'src/libs/constants/regex.constant';
import { BaseCourtDto } from './base-court.dto';

class ManualTimeSlotInputDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime!: string;

  @ApiProperty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ enum: TIME_SLOT_STATUS_VALUES, default: TIME_SLOT_STATUS.AVAILABLE })
  @IsOptional()
  @IsIn(TIME_SLOT_STATUS_VALUES)
  status?: TimeSlotStatus;
}

class TemplateGenerationInputDto {
  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty({ type: [Number], enum: TIME_SLOT_WEEKDAY_VALUES })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsIn(TIME_SLOT_WEEKDAY_VALUES, { each: true })
  weekdays!: TimeSlotWeekday[];

  @ApiProperty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime!: string;

  @ApiProperty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  createTemplate?: boolean;
}

class CourtTimeSlotConfigDto {
  @ApiPropertyOptional({ type: [ManualTimeSlotInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualTimeSlotInputDto)
  manualSlots?: ManualTimeSlotInputDto[];

  @ApiPropertyOptional({ type: TemplateGenerationInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateGenerationInputDto)
  templateGeneration?: TemplateGenerationInputDto;
}

export class CreateCourtDto extends BaseCourtDto {
  @ApiPropertyOptional({
    description: 'Optional time slot generation config while creating court',
    type: CourtTimeSlotConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourtTimeSlotConfigDto)
  timeSlotConfig?: CourtTimeSlotConfigDto;
}
