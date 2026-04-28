import { forwardRef, Module } from '@nestjs/common';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from './entities/venue.entity';
import { TimeSlotModule } from '../time-slot/time-slot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue]),
    forwardRef(() => TimeSlotModule),
  ],
  controllers: [VenueController],
  providers: [VenueService],
  exports: [VenueService],
})
export class VenueModule {}
