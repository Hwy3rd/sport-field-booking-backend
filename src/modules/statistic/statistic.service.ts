import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { BookingItem } from '../booking/entities/booking-item.entity';
import { User } from '../user/entities/user.entity';
import { Venue } from '../venue/entities/venue.entity';
import { Court } from '../court/entities/court.entity';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE, USER_STATUS } from 'src/libs/constants/user.constant';
import { BOOKING_STATUS } from 'src/libs/constants/booking.constant';
import { VENUE_STATUS } from 'src/libs/constants/venue.constant';
import { COURT_STATUS } from 'src/libs/constants/court.constant';
import { TIME_SLOT_STATUS } from 'src/libs/constants/time-slot.constant';

@Injectable()
export class StatisticService {
  private readonly successfulStatuses = [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.COMPLETED,
  ];

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
  ) {}

  async getSummaryStats(authUser: AuthUser) {
    const isAdmin = authUser.role === USER_ROLE.ADMIN;

    if (isAdmin) {
      // 1. Calculate Platform Total Revenue from successful bookings
      const revenueRaw = await this.bookingItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.booking', 'booking')
        .select('SUM(item.totalPrice)', 'revenue')
        .where('booking.status IN (:...statuses)', {
          statuses: this.successfulStatuses,
        })
        .andWhere('booking.isDeleted = false')
        .getRawOne();

      const totalRevenue = Number(revenueRaw?.revenue || 0);

      // 2. Count overall successful bookings
      const totalBookings = await this.bookingRepository.count({
        where: {
          status: In(this.successfulStatuses),
          isDeleted: false,
        },
      });

      // 3. Count Active Platform Users
      const activeUsers = await this.userRepository.count({
        where: { status: USER_STATUS.ACTIVE },
      });

      // 4. Count Active Venues
      const activeVenues = await this.venueRepository.count({
        where: { status: VENUE_STATUS.ACTIVE },
      });

      return {
        totalRevenue,
        totalBookings,
        activeUsers,
        activeVenues,
      };
    } else {
      // Context for OWNER dashboard
      // 1. Sum up revenue generated across their courts
      const revenueRaw = await this.bookingItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.booking', 'booking')
        .innerJoin(Court, 'court', 'court.id = item.courtId')
        .innerJoin('court.venue', 'venue')
        .select('SUM(item.totalPrice)', 'revenue')
        .where('booking.status IN (:...statuses)', {
          statuses: this.successfulStatuses,
        })
        .andWhere('venue.ownerId = :ownerId', { ownerId: authUser.id })
        .andWhere('booking.isDeleted = false')
        .getRawOne();

      const totalRevenue = Number(revenueRaw?.revenue || 0);

      // 2. Count how many bookings were made under their venues
      const bookingItemsRaw = await this.bookingItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.booking', 'booking')
        .innerJoin(Court, 'court', 'court.id = item.courtId')
        .innerJoin('court.venue', 'venue')
        .select('COUNT(DISTINCT item.id)', 'count')
        .where('booking.status IN (:...statuses)', {
          statuses: this.successfulStatuses,
        })
        .andWhere('venue.ownerId = :ownerId', { ownerId: authUser.id })
        .andWhere('booking.isDeleted = false')
        .getRawOne();

      const totalBookingItems = Number(bookingItemsRaw?.count || 0);

      // 3. Active Venues Owned
      const myVenues = await this.venueRepository.count({
        where: { ownerId: authUser.id, status: VENUE_STATUS.ACTIVE },
      });

      // 4. Active Courts Owned
      const myCourts = await this.courtRepository
        .createQueryBuilder('court')
        .innerJoin('court.venue', 'venue')
        .where('venue.ownerId = :ownerId', { ownerId: authUser.id })
        .andWhere('court.status = :status', { status: COURT_STATUS.ACTIVE })
        .getCount();

      return {
        totalRevenue,
        totalBookings: totalBookingItems,
        activeVenues: myVenues,
        activeCourts: myCourts,
      };
    }
  }

  async getRevenueChart(
    authUser: AuthUser,
    query: { startDate?: string; endDate?: string },
  ) {
    const isAdmin = authUser.role === USER_ROLE.ADMIN;

    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 29); // default last 30 days

    const start = query.startDate ? new Date(query.startDate) : defaultStart;
    const end = query.endDate ? new Date(query.endDate) : now;
    end.setHours(23, 59, 59, 999); // Ensure end of day

    const qb = this.bookingItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.booking', 'booking')
      .select("DATE_TRUNC('day', booking.createdAt)", 'date')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .addSelect('COUNT(DISTINCT booking.id)', 'bookingCount')
      .where('booking.status IN (:...statuses)', {
        statuses: this.successfulStatuses,
      })
      .andWhere('booking.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('booking.isDeleted = false');

    if (!isAdmin) {
      qb.innerJoin(Court, 'court', 'court.id = item.courtId')
        .innerJoin('court.venue', 'venue')
        .andWhere('venue.ownerId = :ownerId', { ownerId: authUser.id });
    }

    const result = await qb
      .groupBy("DATE_TRUNC('day', booking.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Post-process results to return clean format
    return result.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      revenue: Number(row.revenue || 0),
      bookingCount: Number(row.bookingCount || 0),
    }));
  }

  async getSportCategorySplit(authUser: AuthUser) {
    const isAdmin = authUser.role === USER_ROLE.ADMIN;

    const qb = this.bookingItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.booking', 'booking')
      .innerJoin(Court, 'court', 'court.id = item.courtId')
      .innerJoin('court.sport', 'sport')
      .select('sport.name', 'sportName')
      .addSelect('COUNT(item.id)', 'count')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .where('booking.status IN (:...statuses)', {
        statuses: this.successfulStatuses,
      })
      .andWhere('booking.isDeleted = false');

    if (!isAdmin) {
      qb.innerJoin('court.venue', 'venue').andWhere(
        'venue.ownerId = :ownerId',
        { ownerId: authUser.id },
      );
    }

    const rawData = await qb.groupBy('sport.name').getRawMany();

    return rawData.map((item) => ({
      sportName: String(item.sportName),
      count: Number(item.count || 0),
      revenue: Number(item.revenue || 0),
    }));
  }

  async getOccupancyRate(authUser: AuthUser) {
    const isAdmin = authUser.role === USER_ROLE.ADMIN;

    // Calculates how many timeslots are currently BOOKED versus available generated timeslots
    // Filter to include upcoming 30 days of availability to calculate future occupancy
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 30);

    const qb = this.timeSlotRepository
      .createQueryBuilder('slot')
      .select('slot.status', 'status')
      .addSelect('COUNT(slot.id)', 'count')
      .where('slot.date BETWEEN :now AND :end', { now, end });

    if (!isAdmin) {
      qb.innerJoin('slot.court', 'court')
        .innerJoin('court.venue', 'venue')
        .andWhere('venue.ownerId = :ownerId', { ownerId: authUser.id });
    }

    const results = await qb.groupBy('slot.status').getRawMany();

    let booked = 0;
    let total = 0;

    results.forEach((item) => {
      const count = Number(item.count || 0);
      total += count;
      if (item.status === TIME_SLOT_STATUS.BOOKED) {
        booked += count;
      }
    });

    const rate = total > 0 ? Math.round((booked / total) * 100) : 0;

    return {
      totalSlots: total,
      bookedSlots: booked,
      occupancyRate: rate,
    };
  }

  async getTopVenues() {
    // Aggregate top 5 venues with maximum successful booking revenue
    const result = await this.bookingItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.booking', 'booking')
      .innerJoin(Court, 'court', 'court.id = item.courtId')
      .innerJoin('court.venue', 'venue')
      .select('venue.name', 'venueName')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .addSelect('COUNT(DISTINCT booking.id)', 'bookingsCount')
      .where('booking.status IN (:...statuses)', {
        statuses: this.successfulStatuses,
      })
      .andWhere('booking.isDeleted = false')
      .groupBy('venue.name')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((row) => ({
      venueName: String(row.venueName),
      revenue: Number(row.revenue || 0),
      bookingsCount: Number(row.bookingsCount || 0),
    }));
  }

  async getUserRegistrationGrowth(query: {
    startDate?: string;
    endDate?: string;
  }) {
    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 29); // 30 days window

    const start = query.startDate ? new Date(query.startDate) : defaultStart;
    const end = query.endDate ? new Date(query.endDate) : now;
    end.setHours(23, 59, 59, 999);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.createdAt)", 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("DATE_TRUNC('day', user.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      newUsers: Number(row.count || 0),
    }));
  }
}
