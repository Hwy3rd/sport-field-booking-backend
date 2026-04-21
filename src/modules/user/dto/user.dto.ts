import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { UserRole, UserStatus } from 'src/libs/constants/user.constant';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
} from 'src/libs/constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class UserDto {
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

  @ApiProperty({ description: 'The role of the user', example: 'user' })
  @IsNotEmpty()
  @IsEnum(USER_ROLE_VALUES)
  role!: UserRole;

  @ApiProperty({ description: 'The status of the user', example: 'active' })
  @IsNotEmpty()
  @IsEnum(USER_STATUS_VALUES)
  status!: UserStatus;

  @ApiProperty({
    description: 'The created at of the user',
    example: '2021-01-01',
  })
  @IsOptional()
  createdAt?: Date | null;

  @ApiProperty({
    description: 'The updated at of the user',
    example: '2021-01-01',
  })
  @IsOptional()
  updatedAt?: Date | null;
}

export class CreateUserDto extends UserDto {}

export class UpdateUserDto extends PartialType(UserDto) {}

export class ChangePasswordDto extends UserDto {
  @ApiProperty({
    description: 'The old password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'The new password of the user',
    example: 'newpassword',
  })
  @IsNotEmpty()
  @IsString()
  newPassword!: string;
}
