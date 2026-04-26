import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
  type UserRole,
  type UserStatus,
} from 'src/libs/constants/user.constant';
import { FilterQueryDto } from 'src/libs/dtos/filter-query.dto';

export class UserQueryDto extends FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by email (partial match)',
    example: 'example@gmail.com',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by full name (partial match)',
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: USER_ROLE_VALUES,
    example: 'user',
  })
  @IsOptional()
  @IsIn(USER_ROLE_VALUES)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: USER_STATUS_VALUES,
    example: 'active',
  })
  @IsOptional()
  @IsIn(USER_STATUS_VALUES)
  status?: UserStatus;
}
