import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { TimeSlotModule } from '../time-slot/time-slot.module';
import { BookingCronService } from './booking-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingItem]), TimeSlotModule],
  controllers: [BookingController],
  providers: [BookingService, BookingCronService],
  exports: [BookingService, TypeOrmModule],
})
export class BookingModule {}
