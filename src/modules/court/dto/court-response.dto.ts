import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  COURT_STATUS_VALUES,
  type CourtStatus,
} from 'src/libs/constants/court.constant';
import { FilteredDataResponseDto } from 'src/libs/dtos/filtered-data-response.dto';
import { BaseCourtDto } from './base-court.dto';

export class CourtResponseDto extends BaseCourtDto {
  @Expose()
  @ApiProperty({
    description: 'Court id',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Court status',
    enum: COURT_STATUS_VALUES,
  })
  status!: CourtStatus;

  @Expose()
  @ApiProperty({
    description: 'Created time',
    example: '2026-04-22T09:30:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Updated time',
    example: '2026-04-22T10:00:00.000Z',
  })
  updatedAt!: Date;
}

export class FilteredCourtResponseDto extends FilteredDataResponseDto {
  @Expose()
  @Type(() => CourtResponseDto)
  @ApiProperty({
    description: 'Filtered court list',
    type: Array<CourtResponseDto>,
  })
  items!: CourtResponseDto[];
}
