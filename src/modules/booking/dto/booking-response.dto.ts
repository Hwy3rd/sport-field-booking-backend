import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  BOOKING_STATUS_VALUES,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';
import { FilteredDataResponseDto } from 'src/libs/dtos/filtered-data-response.dto';

export class VenueInCourtDto {
  @Expose()
  @ApiProperty({ example: 'Sân bóng ABC' })
  name!: string;
}

export class CourtInTimeSlotDto {
  @Expose()
  @ApiProperty({ example: 'Sân 1' })
  name!: string;

  @Expose()
  @Type(() => VenueInCourtDto)
  @ApiProperty({ type: VenueInCourtDto })
  venue!: VenueInCourtDto;
}

export class TimeSlotInBookingItemDto {
  @Expose()
  @ApiProperty({ example: 'd8fb4022-a6f4-4a96-a4fb-a57f4da5dd7b' })
  id!: string;

  @Expose()
  @Type(() => CourtInTimeSlotDto)
  @ApiProperty({ type: CourtInTimeSlotDto })
  court!: CourtInTimeSlotDto;
}

export class UserInBookingDto {
  @Expose()
  @ApiProperty({ example: 'd94b11fc-18bb-4c29-aa26-7d4a3f7aeef6' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'user123' })
  username!: string;

  @Expose()
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName!: string;

  @Expose()
  @ApiProperty({ example: '0987654321', nullable: true })
  phone!: string | null;
}

export class BookingItemResponseDto {
  @Expose()
  @Type(() => TimeSlotInBookingItemDto)
  @ApiProperty({ type: TimeSlotInBookingItemDto, nullable: true })
  timeSlot!: TimeSlotInBookingItemDto | null;
  @Expose()
  @ApiProperty({
    description: 'Booking item id',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Time slot id',
    example: 'd8fb4022-a6f4-4a96-a4fb-a57f4da5dd7b',
    nullable: true,
  })
  timeSlotId!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Court id snapshot',
    example: '2687cbda-4f1d-4f0a-bc10-0a237ecab81b',
  })
  courtId!: string;

  @Expose()
  @ApiProperty({
    description: 'Slot date snapshot',
    example: '2026-05-01',
  })
  slotDate!: Date;

  @Expose()
  @ApiProperty({
    description: 'Slot start time snapshot',
    example: '18:00:00',
  })
  startTime!: string;

  @Expose()
  @ApiProperty({
    description: 'Slot end time snapshot',
    example: '19:30:00',
  })
  endTime!: string;

  @Expose()
  @ApiProperty({
    description: 'Slot unit price snapshot',
    example: 200000,
  })
  unitPrice!: number;

  @Expose()
  @ApiProperty({
    description: 'Total line price',
    example: 200000,
  })
  totalPrice!: number;
}

export class BookingResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Booking id',
    example: 'c7c92f89-f1bd-4a66-b1bd-908196f680fc',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User id',
    example: 'd94b11fc-18bb-4c29-aa26-7d4a3f7aeef6',
  })
  userId!: string;

  @Expose()
  @Type(() => UserInBookingDto)
  @ApiProperty({ type: UserInBookingDto, nullable: true })
  user?: UserInBookingDto;

  @Expose()
  @ApiProperty({
    description: 'Booking total price',
    example: 400000,
  })
  totalPrice!: number;

  @Expose()
  @ApiProperty({
    description: 'Booking status',
    enum: BOOKING_STATUS_VALUES,
  })
  status!: BookingStatus;

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

export class BookingWithItemsResponseDto extends BookingResponseDto {
  @Expose()
  @Type(() => BookingItemResponseDto)
  @ApiProperty({
    description: 'Booking items',
    type: [BookingItemResponseDto],
  })
  items!: BookingItemResponseDto[];
}

export class FilteredBookingResponseDto extends FilteredDataResponseDto {
  @Expose()
  @Type(() => BookingWithItemsResponseDto)
  @ApiProperty({
    description: 'Filtered booking list',
    type: [BookingWithItemsResponseDto],
  })
  items!: BookingWithItemsResponseDto[];
}
