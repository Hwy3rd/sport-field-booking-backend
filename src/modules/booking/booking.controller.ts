import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
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
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { BookingService } from './booking.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import {
  BookingResponseDto,
  FilteredBookingResponseDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';

@ApiTags('Booking')
@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('me/history')
  @ApiOperation({ summary: 'Get booking history' })
  @ApiOkResponse({ type: BookingResponseDto })
  findHistory(@GetUserId() userId: string, @Query() query: BookingQueryDto) {
    // return this.bookingService.findBookingHistory(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  @ApiOkResponse({ type: BookingResponseDto })
  findOne(@Param('id') id: string) {
    // return this.bookingService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  create(
    @GetUserId() userId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    // return this.bookingService.create(userId, createBookingDto);
  }

  @Post('search')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Get all bookings by scope' })
  @ApiOkResponse({ type: FilteredBookingResponseDto })
  findAll(@Body() filterBody: FilterBodyDto) {
    // return this.bookingService.findAllByFilter(filterBody);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiOkResponse({ type: BookingResponseDto })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    // return this.bookingService.update(id, updateBookingDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiOkResponse({ type: BookingResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    // return this.bookingService.updateStatus(id, updateBookingDto);
  }

  @Patch(':id/cancel')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Cancel a booking' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.bookingService.remove(req.user, id);
  }

  @Post('bulk-cancel')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin bulk cancel bookings' })
  bulkDelete(@Req() req: { user: AuthUser }, @Body() ids: BulkDeleteDto) {
    return this.bookingService.bulkDelete(req.user, ids);
  }
}
