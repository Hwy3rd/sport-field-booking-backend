import { Module } from '@nestjs/common';
import { SportService } from './sport.service';
import { SportController } from './sport.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from './entities/sport.entity';
import { Court } from '../court/entities/court.entity';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sport, Court, TimeSlot])],
  controllers: [SportController],
  providers: [SportService],
  exports: [SportService],
})
export class SportModule {}
