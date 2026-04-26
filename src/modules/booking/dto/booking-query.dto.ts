import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  BOOKING_STATUS_VALUES,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class BookingQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BOOKING_STATUS_VALUES,
  })
  @IsOptional()
  @Type(() => String)
  @IsIn(BOOKING_STATUS_VALUES)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by user id (admin only)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
