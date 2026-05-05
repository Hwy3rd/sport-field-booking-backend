import { forwardRef, Module } from '@nestjs/common';
import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';
import { VenueModule } from '../venue/venue.module';
import { SportModule } from '../sport/sport.module';
import { TimeSlotModule } from '../time-slot/time-slot.module';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { TimeSlotTemplate } from '../time-slot/entities/time-slot-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court, TimeSlot, TimeSlotTemplate]),
    forwardRef(() => VenueModule),
    SportModule,
    forwardRef(() => TimeSlotModule),
  ],
  controllers: [CourtController],
  providers: [CourtService],
  exports: [CourtService],
})
export class CourtModule {}
