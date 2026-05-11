import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { TimeSlotService } from './time-slot.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlotQueryDto } from './dto/time-slot-query.dto';
import type { Request } from 'express';

@ApiTags('Time Slot')
@Controller('time-slot')
export class TimeSlotController {
  constructor(private readonly timeSlotService: TimeSlotService) {}

  @Get()
  @ApiOperation({ summary: 'Get all time slots' })
  @ApiOkResponse({ description: 'Filtered list of time slots' })
  findAll(@Query() query: TimeSlotQueryDto) {
    return this.timeSlotService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a time slot' })
  create(@Req() req: Request, @Body() createTimeSlotDto: CreateTimeSlotDto) {
    return this.timeSlotService.create(req.user as AuthUser, createTimeSlotDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a time slot' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    return this.timeSlotService.update(
      req.user as AuthUser,
      id,
      updateTimeSlotDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a time slot' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.timeSlotService.remove(req.user as AuthUser, id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete multiple time slots' })
  bulkDelete(@Req() req: Request, @Body() ids: BulkDeleteDto) {
    return this.timeSlotService.bulkDelete(req.user as AuthUser, ids);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock a time slot' })
  lock(@Param('id') id: string) {
    return this.timeSlotService.lock(id);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock a time slot' })
  unlock(@Param('id') id: string) {
    return this.timeSlotService.unlock(id);
  }
}
