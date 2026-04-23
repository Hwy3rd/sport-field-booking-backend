import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FilteredDataResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The total number of items',
    example: 100,
    type: Number,
  })
  total!: number;

  @Expose()
  @ApiProperty({
    description: 'The current page',
    example: 1,
    type: Number,
  })
  current!: number;

  @Expose()
  @ApiProperty({
    description: 'The limit of the page',
    example: 10,
    type: Number,
  })
  limit!: number;

  @Expose()
  @ApiProperty({
    description: 'The total number of pages',
    example: 10,
    type: Number,
  })
  totalPages!: number;
}
