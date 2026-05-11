import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseCourtDto } from './base-court.dto';

import { Type } from 'class-transformer';
import { CreateManualSlotDto } from './create-manual-slot.dto';

export class CreateCourtDto extends BaseCourtDto {
  @ApiPropertyOptional({ description: 'Names of the time slot templates to apply', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateNames?: string[];

  @ApiPropertyOptional({ description: 'Manual time slots to create immediately', type: () => [CreateManualSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateManualSlotDto)
  manualTimeSlots?: CreateManualSlotDto[];
}
