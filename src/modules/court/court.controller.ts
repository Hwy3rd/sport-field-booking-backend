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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN)
@ApiBearerAuth()
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Get all courts' })
  @ApiOkResponse({ type: FilteredCourtResponseDto })
  findAll(@Query() query: CourtQueryDto) {
    return this.courtService.findAllByFilter(query);
  }

  @Get(':id')
  @Roles()
  @ApiOperation({ summary: 'Get a court by id' })
  @ApiOkResponse({ type: CourtResponseDto })
  findOne(@Param('id') id: string) {
    return this.courtService.findOneById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new court' })
  @ApiOkResponse({ type: CourtResponseDto })
  create(@Body() createCourtDto: CreateCourtDto) {
    return this.courtService.create(createCourtDto);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
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
  @ApiOperation({ summary: 'Delete a court' })
  remove(@Param('id') id: string) {
    return this.courtService.remove(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Admin delete multiple courts' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.courtService.bulkDelete(ids);
  }
}
