import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BOOKING_STATUS,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';
import { TIME_SLOT_STATUS } from 'src/libs/constants/time-slot.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import {
  filterQuery,
  FilterQueryOptions,
} from 'src/libs/helpers/filter-query.helper';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { TimeSlotService } from '../time-slot/time-slot.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingItem } from './entities/booking-item.entity';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
    private readonly dataSource: DataSource,
    private readonly timeSlotService: TimeSlotService,
  ) {}

  private async changeTimeSlotsStatus(
    slotIds: string[],
    oldStatus: BookingStatus,
    newStatus: BookingStatus,
  ) {
    if (
      oldStatus !== BOOKING_STATUS.CANCELLED &&
      newStatus === BOOKING_STATUS.CANCELLED
    ) {
      await this.timeSlotService.updateStatusByIds(
        slotIds,
        TIME_SLOT_STATUS.AVAILABLE,
      );
    }
    if (
      oldStatus === BOOKING_STATUS.CANCELLED &&
      newStatus !== BOOKING_STATUS.CANCELLED
    ) {
      await this.timeSlotService.updateStatusByIds(
        slotIds,
        TIME_SLOT_STATUS.BOOKED,
      );
    }
  }

  async create(authUser: AuthUser, createBookingDto: CreateBookingDto) {
    const uniqueSlotIds = [...new Set(createBookingDto.timeSlotIds)];
    if (uniqueSlotIds.length === 0) {
      throw new BadRequestException('No time slot ids provided');
    }
    let savedBookingId = '';
    try {
      savedBookingId = await this.dataSource.transaction(async (manager) => {
        const sortedSlotIds = [...uniqueSlotIds].sort();
        const timeSlotRepository = manager.getRepository(TimeSlot);
        const bookingRepository = manager.getRepository(Booking);
        const bookingItemRepository = manager.getRepository(BookingItem);

        const timeSlots = await timeSlotRepository
          .createQueryBuilder('timeSlot')
          .setLock('pessimistic_write')
          .where('timeSlot.id IN (:...ids)', { ids: sortedSlotIds })
          .select([
            'timeSlot.id',
            'timeSlot.courtId',
            'timeSlot.date',
            'timeSlot.startTime',
            'timeSlot.endTime',
            'timeSlot.price',
            'timeSlot.status',
            'timeSlot.lockedAt',
          ])
          .getMany();

        if (timeSlots.length !== uniqueSlotIds.length) {
          throw new NotFoundException('Time slots not found');
        }

        const unavailableSlot = timeSlots.find((slot) => {
          // Allow available slots
          if (slot.status === TIME_SLOT_STATUS.AVAILABLE) return false;

          // Allow slots temporarily locked/reserved by users (has lockedAt date)
          if (
            slot.status === TIME_SLOT_STATUS.BLOCKED &&
            slot.lockedAt !== null
          ) {
            return false;
          }

          // All other states are blocked
          return true;
        });

        if (unavailableSlot) {
          throw new BadRequestException(
            `Time slot ${unavailableSlot.id} is not available`,
          );
        }

        const totalPrice = timeSlots.reduce((sum, slot) => sum + slot.price, 0);
        const booking = bookingRepository.create({
          userId: authUser.id,
          totalPrice,
          status: BOOKING_STATUS.PENDING,
          isDeleted: false,
        });
        const savedBooking = await bookingRepository.save(booking);

        const bookingItems = timeSlots.map((slot) =>
          bookingItemRepository.create({
            bookingId: savedBooking.id,
            timeSlotId: slot.id,
            courtId: slot.courtId,
            slotDate: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            unitPrice: slot.price,
            totalPrice: slot.price,
          }),
        );
        await bookingItemRepository.save(bookingItems);

        await timeSlotRepository.update(
          { id: In(sortedSlotIds) },
          { status: TIME_SLOT_STATUS.BOOKED, lockedAt: null },
        );

        return savedBooking.id;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new BadRequestException('One or more time slots are unavailable');
      }
      throw error;
    }

    return await this.findOne(authUser.id, savedBookingId);
  }

  async findAllByFilter(query: FilterBodyDto, userId?: string) {
    const safeQuery = {
      current: query.current,
      limit: query.limit,
      filter: {
        ...query.filter,
        isDeleted: false,
      },
    };
    const queryOptions = {
      rangeFields: ['createdAt'],
      omit: ['isDeleted'],
    };
    return await filterQuery(this.bookingRepository, safeQuery, queryOptions);
  }

  async getBookingHistory(query: BookingQueryDto, userId?: string) {
    const safeQuery = {
      current: query.current,
      limit: query.limit,
      filter: {
        userId: userId,
        status: query.status,
        createdAt: [query.startDate ?? null, query.endDate ?? null],
        isDeleted: false,
      },
    };
    const filterOptions: FilterQueryOptions<Booking> = {
      rangeFields: ['createdAt'],
      omit: ['isDeleted'],
    };
    return await filterQuery(this.bookingRepository, safeQuery, filterOptions);
  }

  async findOne(userId: string, id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException(
        'You are not allowed to access this booking',
      );

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldStatus = booking.status;
    if (updateBookingDto.status) {
      booking.status = updateBookingDto.status;
    }

    const updated = await this.bookingRepository.save(booking);

    const slotIds = booking.items
      .map((item) => item.timeSlotId)
      .filter((slotId): slotId is string => Boolean(slotId));

    await this.changeTimeSlotsStatus(slotIds, oldStatus, booking.status);

    return updated;
  }

  async cancelBooking(userId: string, id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException(
        'You are not allowed to cancel this booking',
      );

    const updatedBooking = await this.update(id, {
      status: BOOKING_STATUS.CANCELLED,
    });

    return updatedBooking;
  }

  async remove(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const oldStatus = booking.status;
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.isDeleted = true;
    const updatedBooking = await this.bookingRepository.save(booking);

    const slotIds = booking.items
      .map((item) => item.timeSlotId)
      .filter((slotId): slotId is string => Boolean(slotId));
    await this.changeTimeSlotsStatus(
      slotIds,
      oldStatus,
      BOOKING_STATUS.CANCELLED,
    );

    return updatedBooking;
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No booking ids provided');

    const bookings = await this.bookingRepository.find({
      where: { id: In(uniqueIds), isDeleted: false },
      relations: { items: true },
    });

    let deletedCount = 0;
    for (const booking of bookings) {
      if (booking.isDeleted) continue;
      deletedCount += 1;
      const oldStatus = booking.status;
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.isDeleted = true;
      const slotIds = booking.items
        .map((item) => item.timeSlotId)
        .filter((slotId): slotId is string => Boolean(slotId));
      await this.changeTimeSlotsStatus(
        slotIds,
        oldStatus,
        BOOKING_STATUS.CANCELLED,
      );
    }

    await this.bookingRepository.save(bookings);
    return {
      ids: uniqueIds,
      deletedCount,
    };
  }
}
