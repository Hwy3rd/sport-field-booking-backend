import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CourtService } from './court.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CourtResponseDto,
  FilteredCourtResponseDto,
} from './dto/court-response.dto';
import { CourtQueryDto } from './dto/court-query.dto';

@ApiTags('Court')
@Controller('court')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courts' })
  @ApiOkResponse({ type: FilteredCourtResponseDto })
  findAll(@Query() query: CourtQueryDto) {
    return this.courtService.findAllByFilter(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a court by id' })
  @ApiOkResponse({ type: CourtResponseDto })
  findOne(@Param('id') id: string) {
    return this.courtService.findOneById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new court' })
  @ApiOkResponse({ type: CourtResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() createCourtDto: CreateCourtDto) {
    return this.courtService.create(req.user, createCourtDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a court' })
  @ApiOkResponse({ type: CourtResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() updateCourtDto: UpdateCourtDto,
  ) {
    return this.courtService.update(req.user, id, updateCourtDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a court' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.courtService.remove(req.user, id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete multiple courts' })
  bulkDelete(@Req() req: { user: AuthUser }, @Body() ids: BulkDeleteDto) {
    return this.courtService.bulkDelete(req.user, ids);
  }
}
