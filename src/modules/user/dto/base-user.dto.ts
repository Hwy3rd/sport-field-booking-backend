import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BaseUserDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'username123',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'email@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The full name of the user',
    example: 'Nguyen Van A',
  })
  @IsString()
  fullName!: string;

  @ApiProperty({
    description: 'The phone of the user',
    example: '1234567890',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;
}
