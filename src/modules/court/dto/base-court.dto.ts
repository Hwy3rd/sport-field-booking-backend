import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class BaseCourtDto {
  @Expose()
  @ApiProperty({
    description: 'Venue id',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  @IsUUID()
  venueId!: string;

  @Expose()
  @ApiProperty({
    description: 'Sport id',
    example: '54ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  @IsUUID()
  sportId!: string;

  @Expose()
  @ApiProperty({
    description: 'Court name',
    example: 'Court A',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Court price per hour',
    example: 300000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  pricePerHour!: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Court image URL',
    example: 'https://example.com/court-a.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
