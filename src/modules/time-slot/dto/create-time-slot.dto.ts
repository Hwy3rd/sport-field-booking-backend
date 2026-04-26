import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import {
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_VALUES,
  type TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateTimeSlotDto {
  @ApiProperty({
    description: 'Court id',
    format: 'uuid',
  })
  @IsUUID()
  courtId!: string;

  @ApiPropertyOptional({
    description: 'Template id if this slot is generated from a template',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({
    description: 'Slot date',
    example: '2026-05-01',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Start time in HH:mm or HH:mm:ss',
    example: '18:00:00',
  })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime!: string;

  @ApiProperty({
    description: 'End time in HH:mm or HH:mm:ss',
    example: '19:30:00',
  })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime!: string;

  @ApiProperty({
    description: 'Slot price',
    example: 200000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    description: 'Slot status',
    enum: TIME_SLOT_STATUS_VALUES,
    default: TIME_SLOT_STATUS.AVAILABLE,
  })
  @IsOptional()
  @IsIn(TIME_SLOT_STATUS_VALUES)
  status?: TimeSlotStatus;
}
