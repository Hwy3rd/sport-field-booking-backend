import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BaseUserDto } from './base-user.dto';
import type { UserRole, UserStatus } from 'src/libs/constants/user.constant';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
} from 'src/libs/constants/user.constant';

export class UserUpdateDto extends PartialType(BaseUserDto) {}

export class UserChangePasswordDto {
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
  @MinLength(6)
  newPassword!: string;
}

export class AdminUpdateUserDto extends PartialType(BaseUserDto) {
  @ApiProperty({ description: 'The role of the user', example: 'user' })
  @IsOptional()
  @IsEnum(USER_ROLE_VALUES)
  role?: UserRole;

  @ApiProperty({ description: 'The status of the user', example: 'active' })
  @IsOptional()
  @IsEnum(USER_STATUS_VALUES)
  status?: UserStatus;
}

export class AdminChangePasswordDto {
  @ApiProperty({
    description: 'The new password of the user',
    example: 'newpassword',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
