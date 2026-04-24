import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  VENUE_STATUS_VALUES,
  type VenueStatus,
} from 'src/libs/constants/venue.constant';
import { CreateVenueDto } from './create-venue.dto';

export class UpdateVenueDto extends PartialType(CreateVenueDto) {
  @ApiPropertyOptional({
    description: 'Venue status',
    enum: VENUE_STATUS_VALUES,
    example: 'maintenance',
  })
  @IsOptional()
  @IsEnum(VENUE_STATUS_VALUES)
  status?: VenueStatus;
}
