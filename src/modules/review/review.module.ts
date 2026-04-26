import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { VenueModule } from '../venue/venue.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), VenueModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
