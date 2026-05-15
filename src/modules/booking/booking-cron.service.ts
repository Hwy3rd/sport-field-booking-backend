import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingService } from './booking.service';
import { BOOKING_STATUS } from 'src/libs/constants/booking.constant';

@Injectable()
export class BookingCronService {
  private readonly logger = new Logger(BookingCronService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingService: BookingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cancelExpiredBookings() {
    this.logger.debug('Running cancelExpiredBookings cron...');
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 16); // 16 minutes

    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: BOOKING_STATUS.PENDING,
        createdAt: LessThan(expirationTime),
        isDeleted: false,
      },
      select: ['id'],
    });

    if (expiredBookings.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${expiredBookings.length} expired pending bookings to cancel`,
    );

    for (const booking of expiredBookings) {
      try {
        await this.bookingService.update(booking.id, {
          status: BOOKING_STATUS.CANCELLED,
        });
        this.logger.log(`Cancelled expired booking: ${booking.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to cancel expired booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
