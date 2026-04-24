import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminCreateUserDto,
  UserRegisterDto,
} from 'src/modules/user/dto/create-user.dto';
import {
  AdminChangePasswordDto,
  AdminUpdateUserDto,
  UserChangePasswordDto,
  UserUpdateDto,
} from 'src/modules/user/dto/update-user.dto';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Not, Repository } from 'typeorm';
import {
  filterQuery,
  FilterQueryOptions,
} from 'src/libs/helpers/filter-query.helper';
import { USER_ROLE, USER_STATUS } from 'src/libs/constants/user.constant';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async findById(id: string) {
    if (!id) return null;
    return this.userRepository.findOne({
      where: { id, status: Not(USER_STATUS.DELETED) },
    });
  }

  async findByIdentifier(identifier: string) {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = EMAIL_REGEX.test(identifier);
    if (isEmail) {
      return this.userRepository.findOne({
        where: { email: identifier, status: Not(USER_STATUS.DELETED) },
      });
    } else {
      return this.userRepository.findOne({
        where: { username: identifier, status: Not(USER_STATUS.DELETED) },
      });
    }
  }

  async checkDuplicateUsernameEmail(username: string, email: string) {
    const matchedUsers = await this.userRepository.find({
      where: [
        { username, status: Not(USER_STATUS.DELETED) },
        { email, status: Not(USER_STATUS.DELETED) },
      ],
      select: ['username', 'email'],
    });

    return {
      usernameTaken: matchedUsers.some((user) => user.username === username),
      emailTaken: matchedUsers.some((user) => user.email === email),
    };
  }

  //Admin endpoints logic
  async findAllByFilter(filterBody: FilterBodyDto) {
    this.logger.log(
      `Searching users with pagination current=${filterBody.current}, limit=${filterBody.limit}, filter=${JSON.stringify(filterBody.filter)}`,
    );

    const filterOptions: FilterQueryOptions<User> = {
      regexFields: ['fullName', 'username', 'email'],
    };

    const safeFilterBody: FilterBodyDto = {
      ...filterBody,
      filter: {
        ...(filterBody.filter ?? {}),
        status: USER_STATUS.ACTIVE,
      },
    };

    const filteredData = await filterQuery(
      this.userRepository,
      safeFilterBody,
      filterOptions,
    );

    return filteredData;
  }

  async adminCreate(createUserDto: AdminCreateUserDto) {
    this.logger.log(`Creating user with email=${createUserDto.email}`);
    const { username, email, password } = createUserDto;
    const { usernameTaken, emailTaken } =
      await this.checkDuplicateUsernameEmail(username, email);
    if (usernameTaken && emailTaken) {
      throw new BadRequestException('Username and email already exist');
    }
    if (usernameTaken) {
      throw new BadRequestException('Username already exists');
    }
    if (emailTaken) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      username,
      email,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    this.logger.log(
      `User created with username=${username} and email=${email}`,
    );
    return user;
  }

  async adminChangePassword(
    id: string,
    changePasswordDto: AdminChangePasswordDto,
  ) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newHashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    user.password = newHashedPassword;
    await this.userRepository.save(user);

    this.logger.log(`Password changed for user id=${id}`);
    return;
  }

  async adminUpdate(id: string, updateUserDto: AdminUpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    this.logger.log(`User updated id=${id}`);
    return user;
  }

  async deleteById(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = USER_STATUS.DELETED;
    await this.userRepository.save(user);

    this.logger.log(`User deleted id=${id}`);
    return {
      id,
    };
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No user ids provided');

    const result = await this.userRepository.update(
      {
        id: In(uniqueIds),
        status: Not(USER_STATUS.DELETED), // Chỉ update những ai chưa xóa
      },
      { status: USER_STATUS.DELETED },
    );

    this.logger.log(
      `Bulk deleted ${result.affected} users with list ids=${uniqueIds.join(',')}`,
    );

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }

  //User endpoints logic
  async getUserProfile(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  //Use for register endpoint in auth module
  async userCreate(createUserDto: UserRegisterDto) {
    const userData = {
      ...createUserDto,
      role: USER_ROLE.USER,
      status: USER_STATUS.ACTIVE,
    };
    await this.userRepository.save(userData);
    return userData;
  }

  async userUpdate(id: string, updateUserDto: UserUpdateDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return user;
  }

  async userChangePassword(
    id: string,
    changePasswordDto: UserChangePasswordDto,
  ) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const newHashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );
    user.password = newHashedPassword;
    await this.userRepository.save(user);

    return user;
  }
}
