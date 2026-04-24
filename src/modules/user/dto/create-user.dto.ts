import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
  type UserRole,
  type UserStatus,
} from 'src/libs/constants/user.constant';
import { BaseUserDto } from './base-user.dto';

export class UserRegisterDto extends BaseUserDto {
  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class AdminCreateUserDto extends BaseUserDto {
  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ description: 'The role of the user', example: 'user' })
  @IsNotEmpty()
  @IsEnum(USER_ROLE_VALUES)
  role!: UserRole;

  @ApiProperty({ description: 'The status of the user', example: 'active' })
  @IsNotEmpty()
  @IsEnum(USER_STATUS_VALUES)
  status!: UserStatus;
}
