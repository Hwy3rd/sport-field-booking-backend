import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseUserDto {
  @Expose()
  @ApiProperty({
    description: 'The username of the user',
    example: 'username123',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @Expose()
  @ApiProperty({
    description: 'The email of the user',
    example: 'email@example.com',
  })
  @IsEmail()
  email!: string;

  @Expose()
  @ApiProperty({
    description: 'The full name of the user',
    example: 'Nguyen Van A',
  })
  @IsString()
  fullName!: string;

  @Expose()
  @ApiProperty({
    description: 'The phone of the user',
    example: '1234567890',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;
}
