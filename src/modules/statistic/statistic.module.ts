import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { BookingItem } from '../booking/entities/booking-item.entity';
import { User } from '../user/entities/user.entity';
import { Venue } from '../venue/entities/venue.entity';
import { Court } from '../court/entities/court.entity';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingItem,
      User,
      Venue,
      Court,
      TimeSlot,
    ]),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
  exports: [StatisticService],
})
export class StatisticModule {}
