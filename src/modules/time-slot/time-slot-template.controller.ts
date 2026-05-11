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
import type { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { CreateTimeSlotTemplateDto } from './dto/create-time-slot-template.dto';
import { TimeSlotTemplateQueryDto } from './dto/time-slot-template-query.dto';
import { UpdateTimeSlotTemplateDto } from './dto/update-time-slot-template.dto';
import { TimeSlotTemplateService } from './time-slot-template.service';

@ApiTags('Time Slot Template')
@Controller('time-slot-template')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
@ApiBearerAuth()
export class TimeSlotTemplateController {
  constructor(private readonly service: TimeSlotTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a time slot template' })
  create(@Req() req: Request, @Body() dto: CreateTimeSlotTemplateDto) {
    return this.service.create(req.user as AuthUser, dto);
  }

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Get all time slot templates' })
  @ApiOkResponse({ description: 'Filtered list of time slot templates' })
  findAll(@Query() query: TimeSlotTemplateQueryDto) {
    return this.service.findAll(query);
  }

  @Get('group-names/:venueId')
  @ApiOperation({ summary: 'Get template group names for a venue' })
  getGroupNames(@Req() req: Request, @Param('venueId') venueId: string) {
    return this.service.getGroupNames(req.user as AuthUser, venueId);
  }

  @Get(':id')
  @Roles()
  @ApiOperation({ summary: 'Get one time slot template' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a time slot template' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTimeSlotTemplateDto,
  ) {
    return this.service.update(req.user as AuthUser, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a time slot template' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.service.remove(req.user as AuthUser, id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple time slot templates' })
  bulkDelete(@Req() req: Request, @Body() ids: BulkDeleteDto) {
    return this.service.bulkDelete(req.user as AuthUser, ids);
  }
}
