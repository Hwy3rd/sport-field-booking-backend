import { ApiPropertyOptional } from '@nestjs/swagger';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SportQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Search by sport name',
    example: 'football',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
