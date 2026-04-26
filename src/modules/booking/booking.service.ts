import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { In, Repository } from 'typeorm';
import {
  BOOKING_STATUS,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';
import {
  TIME_SLOT_STATUS,
  TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { Court } from '../court/entities/court.entity';
import { Venue } from '../venue/entities/venue.entity';
import { TimeSlotService } from '../time-slot/time-slot.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
    private readonly timeSlotService: TimeSlotService,
  ) {}

  private async ensureOwnerHasBookingAccess(
    authUser: AuthUser,
    bookingId: string,
  ) {
    if (authUser.role !== USER_ROLE.OWNER) return;

    const ownerBooking = await this.bookingItemRepository
      .createQueryBuilder('bookingItem')
      .innerJoin(Court, 'court', 'court.id = bookingItem.courtId')
      .innerJoin(Venue, 'venue', 'venue.id = court.venueId')
      .where('bookingItem.bookingId = :bookingId', { bookingId })
      .andWhere('venue.ownerId = :ownerId', { ownerId: authUser.id })
      .select('bookingItem.id')
      .getOne();

    if (!ownerBooking) {
      throw new ForbiddenException(
        'You can only access bookings in your own venue',
      );
    }
  }

  private async ensureCanAccessBooking(authUser: AuthUser, booking: Booking) {
    if (authUser.role === USER_ROLE.ADMIN) return;

    if (authUser.role === USER_ROLE.USER && booking.userId !== authUser.id) {
      throw new ForbiddenException('You can only access your own bookings');
    }

    await this.ensureOwnerHasBookingAccess(authUser, booking.id);
  }

  private async updateTimeSlotsStatus(
    slotIds: string[],
    status: TimeSlotStatus,
  ) {
    await this.timeSlotService.updateStatusByIds(slotIds, status);
  }

  async create(authUser: AuthUser, createBookingDto: CreateBookingDto) {
    const uniqueSlotIds = [...new Set(createBookingDto.timeSlotIds)];
    if (uniqueSlotIds.length === 0) {
      throw new BadRequestException('No time slot ids provided');
    }

    const timeSlots = await this.timeSlotService.findByIds(uniqueSlotIds);

    if (timeSlots.length !== uniqueSlotIds.length) {
      throw new NotFoundException('One or more time slots not found');
    }

    const unavailableSlot = timeSlots.find(
      (slot) => slot.status !== TIME_SLOT_STATUS.AVAILABLE,
    );
    if (unavailableSlot) {
      throw new BadRequestException(
        `Time slot ${unavailableSlot.id} is not available`,
      );
    }

    const totalPrice = timeSlots.reduce((sum, slot) => sum + slot.price, 0);

    const booking = this.bookingRepository.create({
      userId: authUser.id,
      totalPrice,
      status: BOOKING_STATUS.PENDING,
    });
    const savedBooking = await this.bookingRepository.save(booking);

    const bookingItems = timeSlots.map((slot) =>
      this.bookingItemRepository.create({
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
    await this.bookingItemRepository.save(bookingItems);

    await this.updateTimeSlotsStatus(uniqueSlotIds, TIME_SLOT_STATUS.BOOKED);

    return await this.findOne(authUser, savedBooking.id);
  }

  async findAll(authUser: AuthUser, query: BookingQueryDto) {
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.items', 'item')
      .orderBy('booking.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }

    if (authUser.role === USER_ROLE.ADMIN) {
      if (query.userId)
        qb.andWhere('booking.userId = :userId', { userId: query.userId });
    } else if (authUser.role === USER_ROLE.USER) {
      qb.andWhere('booking.userId = :userId', { userId: authUser.id });
    } else if (authUser.role === USER_ROLE.OWNER) {
      qb.innerJoin(Court, 'court', 'court.id = item.courtId').innerJoin(
        Venue,
        'venue',
        'venue.id = court.venueId AND venue.ownerId = :ownerId',
        { ownerId: authUser.id },
      );
    }

    const current = Math.max(1, Number(query.current) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    qb.skip((current - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      current,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(authUser: AuthUser, id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.ensureCanAccessBooking(authUser, booking);
    return booking;
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateBookingDto: UpdateBookingDto,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.ensureCanAccessBooking(authUser, booking);

    if (
      authUser.role === USER_ROLE.USER &&
      updateBookingDto.status &&
      updateBookingDto.status !== BOOKING_STATUS.CANCELLED
    ) {
      throw new ForbiddenException('User can only cancel booking');
    }

    const oldStatus = booking.status;
    if (updateBookingDto.status) {
      booking.status = updateBookingDto.status as BookingStatus;
    }

    const updated = await this.bookingRepository.save(booking);

    const slotIds = booking.items
      .map((item) => item.timeSlotId)
      .filter((slotId): slotId is string => Boolean(slotId));

    if (
      oldStatus !== BOOKING_STATUS.CANCELLED &&
      updated.status === BOOKING_STATUS.CANCELLED
    ) {
      await this.updateTimeSlotsStatus(slotIds, TIME_SLOT_STATUS.AVAILABLE);
    }
    if (
      oldStatus === BOOKING_STATUS.CANCELLED &&
      updated.status !== BOOKING_STATUS.CANCELLED
    ) {
      await this.updateTimeSlotsStatus(slotIds, TIME_SLOT_STATUS.BOOKED);
    }

    return updated;
  }

  async remove(authUser: AuthUser, id: string) {
    return await this.update(authUser, id, {
      status: BOOKING_STATUS.CANCELLED,
    });
  }

  async bulkDelete(authUser: AuthUser, ids: BulkDeleteDto) {
    if (authUser.role !== USER_ROLE.ADMIN) {
      throw new ForbiddenException('Only admin can bulk cancel bookings');
    }

    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No booking ids provided');

    const bookings = await this.bookingRepository.find({
      where: { id: In(uniqueIds) },
      relations: { items: true },
    });

    for (const booking of bookings) {
      if (booking.status === BOOKING_STATUS.CANCELLED) continue;
      booking.status = BOOKING_STATUS.CANCELLED;
      const slotIds = booking.items
        .map((item) => item.timeSlotId)
        .filter((slotId): slotId is string => Boolean(slotId));
      await this.updateTimeSlotsStatus(slotIds, TIME_SLOT_STATUS.AVAILABLE);
    }

    await this.bookingRepository.save(bookings);
    return {
      ids: uniqueIds,
      deletedCount: bookings.length,
    };
  }
}
