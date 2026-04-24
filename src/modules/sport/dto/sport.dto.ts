import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SportDto {
  @ApiProperty({
    description: 'The name of the sport',
    example: 'Football',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'The description of the sport',
    example: 'Football is a sport that is played with a ball',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
