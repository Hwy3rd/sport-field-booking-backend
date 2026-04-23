import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import {
  AdminChangePasswordDto,
  AdminUpdateUserDto,
  UserChangePasswordDto,
  UserUpdateDto,
} from './dto/update-user.dto';
import {
  FilteredUserResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UserService } from './user.service';
@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  //User endpoints
  @Get('me')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@GetUserId() id: string) {
    return this.userService.getUserProfile(id);
  }

  @Patch('change-password')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Change password for current user' })
  userChangePassword(
    @GetUserId() id: string,
    @Body() changePasswordDto: UserChangePasswordDto,
  ) {
    return this.userService.userChangePassword(id, changePasswordDto);
  }

  @Patch('me')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Update current user profile' })
  userUpdate(@GetUserId() id: string, @Body() updateUserDto: UserUpdateDto) {
    return this.userService.userUpdate(id, updateUserDto);
  }

  //Admin endpoints
  @Post()
  @Roles(USER_ROLE.ADMIN)
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Admin create a new user' })
  @ApiOkResponse({ type: UserResponseDto })
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.userService.adminCreate(createUserDto);
  }

  @Post('search')
  @Roles(USER_ROLE.ADMIN)
  @Serialize(FilteredUserResponseDto)
  @ApiOperation({ summary: 'Admin search users by filter' })
  @ApiOkResponse({ type: FilteredUserResponseDto })
  findAll(@Body() filterBody: FilterBodyDto) {
    return this.userService.findAllByFilter(filterBody);
  }

  @Post(':id/change-password')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin change password for a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  adminChangePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: AdminChangePasswordDto,
  ) {
    return this.userService.adminChangePassword(id, changePasswordDto);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN)
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Admin update a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.userService.adminUpdate(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin delete a user by id' })
  delete(@Param('id') id: string) {
    return this.userService.deleteById(id);
  }

  @Post('bulk-delete')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin delete multiple users' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.userService.bulkDelete(ids);
  }
}
