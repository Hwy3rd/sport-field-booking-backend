import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueService } from '../venue/venue.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import {
  filterQuery,
  FilterQueryOptions,
} from 'src/libs/helpers/filter-query.helper';
import { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly venueService: VenueService,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
    });
    return this.reviewRepository.save(review);
  }

  async findByVenueId(query: ReviewQueryDto) {
    const existingVenue = await this.venueService.findOneById(query.venueId);
    if (!existingVenue) {
      throw new NotFoundException('Venue not found');
    }

    const filterQueryOption: FilterQueryOptions<Review> = {
      sort: { field: 'createdAt', order: query.newest ? 'DESC' : 'ASC' },
    };

    return await filterQuery(this.reviewRepository, query, filterQueryOption);
  }

  async findOne(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async update(userId: string, id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not allowed to update this review');
    }

    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  async remove(user: AuthUser, id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== user.id && user.role !== USER_ROLE.ADMIN) {
      throw new ForbiddenException('You are not allowed to delete this review');
    }

    return this.reviewRepository.delete(id);
  }
}
