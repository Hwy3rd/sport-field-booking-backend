import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class VenueOperatingHoursDto {
  @Expose()
  @ApiProperty({
    description: 'Opening time in HH:mm format',
    example: '06:00',
  })
  @IsNotEmpty()
  @IsString()
  start_time!: string;

  @Expose()
  @ApiProperty({
    description: 'Closing time in HH:mm format',
    example: '22:00',
  })
  @IsNotEmpty()
  @IsString()
  end_time!: string;
}

export class VenueContactInfoDto {
  @Expose()
  @ApiProperty({
    description: 'Contact phone number',
    example: '0901234567',
  })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @Expose()
  @ApiProperty({
    description: 'Contact email',
    example: 'owner@venue.com',
  })
  @IsEmail()
  email!: string;
}

export class BaseVenueDto {
  @Expose()
  @ApiProperty({
    description: 'Owner user id',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  @IsUUID()
  ownerId!: string;

  @Expose()
  @ApiProperty({
    description: 'Venue name',
    example: 'SVD Minh Duc',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Venue address',
    example: '123 Tran Hung Dao, HCMC',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  address!: string;

  @Expose()
  @ApiProperty({
    description: 'Venue description',
    example: 'A full-service sports complex with modern facilities.',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @Expose()
  @ApiProperty({
    description: 'Venue operating hours',
    type: VenueOperatingHoursDto,
  })
  operating_hours!: VenueOperatingHoursDto;

  @Expose()
  @ApiProperty({
    description: 'Venue contact information',
    type: VenueContactInfoDto,
  })
  contact_info!: VenueContactInfoDto;
}
