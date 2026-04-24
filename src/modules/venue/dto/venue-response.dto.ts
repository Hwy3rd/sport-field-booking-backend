import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  VENUE_STATUS_VALUES,
  type VenueStatus,
} from 'src/libs/constants/venue.constant';
import { FilteredDataResponseDto } from 'src/libs/dtos/filtered-data-response.dto';
import {
  BaseVenueDto,
  VenueContactInfoDto,
  VenueOperatingHoursDto,
} from './base-venue.dto';

export class VenueResponseDto extends BaseVenueDto {
  @Expose()
  @ApiProperty({
    description: 'Venue id',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Venue status',
    enum: VENUE_STATUS_VALUES,
  })
  status!: VenueStatus;

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

export class FilteredVenueResponseDto extends FilteredDataResponseDto {
  @Expose()
  @Type(() => VenueResponseDto)
  @ApiProperty({
    description: 'Filtered venue list',
    type: Array<VenueResponseDto>,
  })
  items!: VenueResponseDto[];
}
