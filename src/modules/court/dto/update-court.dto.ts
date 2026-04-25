import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  COURT_STATUS_VALUES,
  type CourtStatus,
} from 'src/libs/constants/court.constant';
import { CreateCourtDto } from './create-court.dto';

export class UpdateCourtDto extends PartialType(CreateCourtDto) {
  @ApiPropertyOptional({
    description: 'Court status',
    enum: COURT_STATUS_VALUES,
    example: 'maintenance',
  })
  @IsOptional()
  @IsEnum(COURT_STATUS_VALUES)
  status?: CourtStatus;
}
