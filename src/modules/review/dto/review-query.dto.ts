import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class ReviewQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by venue id',
    example: 'e4471b96-23e5-4d28-9e9b-10cbdd6f33ee',
  })
  @IsNotEmpty()
  @IsUUID()
  venueId!: string;

  @ApiPropertyOptional({
    description: 'Filter by user id',
    example: '6f13e96f-c253-4f15-a080-2cd0ab08e9ef',
  })
  @IsOptional()
  @IsBoolean()
  newest?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filter by exact rating',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
