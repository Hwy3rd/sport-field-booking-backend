import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  USER_STATUS,
  USER_STATUS_VALUES,
  UserStatus,
} from 'src/libs/constants/user.constant';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username of the user',
    example: 'username123',
  })
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'username123',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

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
  full_name!: string;

  @ApiProperty({
    description: 'The phone of the user',
    example: '1234567890',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;
}
