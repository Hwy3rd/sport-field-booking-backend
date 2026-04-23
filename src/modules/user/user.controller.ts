import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AdminCreateUserDto } from './dto/create-user.dto';
import {
  AdminChangePasswordDto,
  AdminUpdateUserDto,
  UserChangePasswordDto,
  UserUpdateDto,
} from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { Serialize } from 'src/common/decorators/serialize.decorator';
@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  //Admin endpoints
  @Post()
  @Roles(USER_ROLE.ADMIN)
  @Serialize(UserResponseDto)
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.userService.adminCreate(createUserDto);
  }

  @Post('search')
  @Roles(USER_ROLE.ADMIN)
  @Serialize(UserResponseDto)
  findAll(@Body() filterBody: FilterBodyDto) {
    return this.userService.findAllByFilter(filterBody);
  }

  @Post(':id/change-password')
  @Roles(USER_ROLE.ADMIN)
  adminChangePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: AdminChangePasswordDto,
  ) {
    return this.userService.adminChangePassword(id, changePasswordDto);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN)
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.userService.adminUpdate(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(USER_ROLE.ADMIN)
  delete(@Param('id') id: string) {
    return this.userService.deleteById(id);
  }

  @Post('bulk-delete')
  @Roles(USER_ROLE.ADMIN)
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.userService.bulkDelete(ids);
  }

  //User endpoints
  @Get('me')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@GetUserId() id: string) {
    return this.userService.getUserProfile(id);
  }

  @Post('change-password')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  userChangePassword(
    @GetUserId() id: string,
    @Body() changePasswordDto: UserChangePasswordDto,
  ) {
    return this.userService.userChangePassword(id, changePasswordDto);
  }

  @Patch('me')
  @Serialize(UserResponseDto)
  @ApiOkResponse({ type: UserResponseDto })
  userUpdate(@GetUserId() id: string, @Body() updateUserDto: UserUpdateDto) {
    return this.userService.userUpdate(id, updateUserDto);
  }
}
