import { Module } from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { TimeSlotController } from './time-slot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotTemplate } from './entities/time-slot-template.entity';
import { CourtModule } from '../court/court.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot, TimeSlotTemplate]), CourtModule],
  controllers: [TimeSlotController],
  providers: [TimeSlotService],
  exports: [TimeSlotService],
})
export class TimeSlotModule {}
