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
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  //Admin endpoints
  @Post('search')
  @Roles(USER_ROLE.ADMIN)
  findAll(@Body() filterBody: FilterBodyDto) {
    return this.userService.findAllByFilter(filterBody);
  }

  @Post()
  @Roles(USER_ROLE.ADMIN)
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post(':id/change-password')
  @Roles(USER_ROLE.ADMIN)
  adminChangePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: AdminChangePasswordDto,
  ) {
    // return this.userService.changePassword(id, changePasswordDto);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles(USER_ROLE.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Post('bulk-delete')
  @Roles(USER_ROLE.ADMIN)
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.userService.bulkDelete(ids);
  }

  //User endpoints
  @Get('me')
  getMe(@GetUserId() id: string) {
    // return this.userService.getMe(id);
  }

  @Post('change-password')
  userChangePassword(
    @GetUserId() id: string,
    @Body() changePasswordDto: UserChangePasswordDto,
  ) {
    // return this.userService.changePassword(id, changePasswordDto);
  }

  @Patch('me')
  userUpdate(@GetUserId() id: string, @Body() updateUserDto: UserUpdateDto) {
    // return this.userService.updateMe(id, updateUserDto);
  }
}
