import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ReviewQueryDto } from './dto/review-query.dto';
import {
  FilteredReviewResponseDto,
  ReviewResponseDto,
} from './dto/review-response.dto';
import { AuthUser } from 'src/libs/types/jwt-payload.type';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';

@ApiTags('Review')
@Controller('review')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get reviews by venue id' })
  @ApiOkResponse({ type: [FilteredReviewResponseDto] })
  findByVenueId(@Query() query: ReviewQueryDto) {
    return this.reviewService.findByVenueId(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiOkResponse({ type: ReviewResponseDto })
  create(
    @GetUserId() userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.create(userId, createReviewDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiOkResponse({ type: ReviewResponseDto })
  update(
    @GetUserId() userId: string,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(userId, id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiOkResponse({ type: ReviewResponseDto })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.reviewService.remove(req.user, id);
  }
}
