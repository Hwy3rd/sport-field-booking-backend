import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, Min } from 'class-validator';

export class FilterBodyDto {
  @ApiProperty({
    description: 'The current page',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current: number;

  @ApiProperty({
    description: 'The limit of the page',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({
    description: 'The filter of the page',
    example: { fullName: 'Nguyen Van A' },
  })
  @IsObject()
  filter: Record<string, unknown>;
}
