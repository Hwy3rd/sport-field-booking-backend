import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({
    description: 'The ids of the users',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
