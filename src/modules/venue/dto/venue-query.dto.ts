import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class VenueQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by venue name (partial match)',
    example: 'Sport Center',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by address (partial match)',
    example: 'Quan 1',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner id',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
