import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Matches, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateManualSlotDto {
  @ApiProperty({ description: 'Slot date', example: '2026-05-01' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Start time in HH:mm', example: '18:00' })
  @IsString()
  @Matches(TIME_PATTERN)
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm', example: '19:30' })
  @IsString()
  @Matches(TIME_PATTERN)
  endTime!: string;

  @ApiProperty({ description: 'Slot price', example: 200000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;
}
