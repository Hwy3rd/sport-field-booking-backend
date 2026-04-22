import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdminCreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { AdminUpdateUserDto } from 'src/modules/user/dto/update-user.dto';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import {
  filterQuery,
  FilterQueryOptions,
} from 'src/libs/helpers/filter-query.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async findById(id: string): Promise<User | null> {
    if (!id) return null;
    return this.userRepository.findOne({ where: { id } });
  }

  async findAllByFilter(filterBody: FilterBodyDto) {
    this.logger.log(
      `Searching users with pagination current=${filterBody.current}, limit=${filterBody.limit}`,
    );

    const filterOptions: FilterQueryOptions<User> = {
      regexFields: ['fullName', 'username', 'email'],
    };

    const filteredData = await filterQuery(
      this.userRepository,
      filterBody,
      filterOptions,
    );

    return filteredData;
  }

  create(createUserDto: AdminCreateUserDto) {
    this.logger.log(`Creating user with email=${createUserDto.email}`);

    try {
      // TODO: Replace with repository save logic.
      return {
        id: 'mock-user-id',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to create user with email=${createUserDto.email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  update(id: number, updateUserDto: AdminUpdateUserDto) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid user id');
    }

    this.logger.log(`Updating user id=${id}`);

    const existingUser = null;
    if (!existingUser) {
      this.logger.warn(`User not found for update id=${id}`);
      throw new NotFoundException('User not found');
    }

    try {
      // TODO: Replace with repository update logic.
      return {
        id,
        ...updateUserDto,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to update user id=${id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  remove(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid user id');
    }

    this.logger.log(`Removing user id=${id}`);

    const deleted = false;
    if (!deleted) {
      this.logger.warn(`User not found for remove id=${id}`);
      throw new NotFoundException('User not found');
    }

    return {
      id,
      deleted: true,
    };
  }

  bulkDelete(ids: BulkDeleteDto) {
    this.logger.log(`Bulk deleting users with ids=${ids}`);
    return {
      ids,
      deleted: true,
    };
  }
}
