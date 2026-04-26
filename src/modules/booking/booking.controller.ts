import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { BookingService } from './booking.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import {
  BookingResponseDto,
  BookingWithItemsResponseDto,
  FilteredBookingResponseDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('Booking')
@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('history')
  @Serialize(BookingResponseDto)
  @ApiOperation({ summary: 'Get booking history' })
  @ApiOkResponse({ type: [BookingResponseDto] })
  findHistory(@GetUserId() userId: string, @Query() query: BookingQueryDto) {
    return this.bookingService.getBookingHistory(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  @ApiOkResponse({ type: BookingWithItemsResponseDto })
  findOne(@GetUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiOkResponse({ type: BookingWithItemsResponseDto })
  create(
    @Req() req: { user: AuthUser },
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(req.user, createBookingDto);
  }

  @Post('search')
  @Roles(USER_ROLE.ADMIN)
  @Serialize(FilteredBookingResponseDto)
  @ApiOperation({ summary: 'Admin search bookings' })
  @ApiOkResponse({ type: [FilteredBookingResponseDto] })
  findAll(@Body() filterBodyDto: FilterBodyDto) {
    return this.bookingService.findAllByFilter(filterBodyDto);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Update a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(@GetUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.cancelBooking(userId, id);
  }

  @Delete(':id')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  delete(@Param('id') id: string) {
    return this.bookingService.remove(id);
  }

  @Post('bulk-delete')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin bulk cancel bookings' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.bookingService.bulkDelete(ids);
  }
}
