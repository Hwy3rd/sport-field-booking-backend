import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FilteredDataResponseDto } from 'src/libs/dtos/filtered-data-response.dto';

export class ReviewResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Review id',
    example: '5a6b7b6e-1ef8-445a-9d8d-f7fd61411b4a',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Reviewer user id',
    example: '6f13e96f-c253-4f15-a080-2cd0ab08e9ef',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Reviewed venue id',
    example: 'e4471b96-23e5-4d28-9e9b-10cbdd6f33ee',
  })
  venueId!: string;

  @Expose()
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
  })
  rating!: number;

  @Expose()
  @ApiProperty({
    description: 'Review comment',
    example: 'Great venue and friendly staff',
    nullable: true,
  })
  comment!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Created time',
    example: '2026-04-22T09:30:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Updated time',
    example: '2026-04-22T10:00:00.000Z',
  })
  updatedAt!: Date;
}

export class FilteredReviewResponseDto extends FilteredDataResponseDto {
  @Expose()
  @Type(() => ReviewResponseDto)
  @ApiProperty({
    description: 'Filtered review list',
    type: [ReviewResponseDto],
  })
  items!: ReviewResponseDto[];
}
