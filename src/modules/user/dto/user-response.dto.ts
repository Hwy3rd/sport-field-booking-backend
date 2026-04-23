import { BaseUserDto } from './base-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import type { UserRole, UserStatus } from 'src/libs/constants/user.constant';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
} from 'src/libs/constants/user.constant';
import { Expose, Type } from 'class-transformer';
import { FilteredDataResponseDto } from 'src/libs/dtos/filtered-data-response.dto';

export class UserResponseDto extends BaseUserDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the user',
    example: '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
  })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'The role of the user', enum: USER_ROLE_VALUES })
  role!: UserRole;

  @Expose()
  @ApiProperty({
    description: 'The status of the user',
    enum: USER_STATUS_VALUES,
  })
  status!: UserStatus;

  @Expose()
  @ApiProperty({
    description: 'The creation time of the user',
    example: '2026-04-22T09:30:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'The last update time of the user',
    example: '2026-04-22T10:00:00.000Z',
  })
  updatedAt!: Date;
}

export class FilteredUserResponseDto extends FilteredDataResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  @ApiProperty({
    description: 'The items of the filtered data',
    example: [
      {
        id: '123abc',
        fullName: 'Nguyen Van A',
        email: 'nguyenvanA@example.com',
      },
    ],
    type: Array<UserResponseDto>,
  })
  items!: UserResponseDto[];
}
