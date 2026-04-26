import { PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  BOOKING_STATUS_VALUES,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiPropertyOptional({
    description: 'Booking status',
    enum: BOOKING_STATUS_VALUES,
  })
  @IsOptional()
  @IsIn(BOOKING_STATUS_VALUES)
  status?: BookingStatus;
}
