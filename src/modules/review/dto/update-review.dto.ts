import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Rating value from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    example: 'Great venue and friendly staff',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
