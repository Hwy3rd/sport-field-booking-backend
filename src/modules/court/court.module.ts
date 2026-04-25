import { Module } from '@nestjs/common';
import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';
import { VenueModule } from '../venue/venue.module';
import { SportModule } from '../sport/sport.module';

@Module({
  imports: [TypeOrmModule.forFeature([Court]), VenueModule, SportModule],
  controllers: [CourtController],
  providers: [CourtService],
})
export class CourtModule {}
