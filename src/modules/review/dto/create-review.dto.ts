import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Venue id to review',
    example: 'e4471b96-23e5-4d28-9e9b-10cbdd6f33ee',
  })
  @IsNotEmpty()
  @IsUUID()
  venueId!: string;

  @ApiProperty({
    description: 'Rating value from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating!: number;

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
