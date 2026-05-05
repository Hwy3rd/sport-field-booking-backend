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
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import {
  FilteredVenueResponseDto,
  VenueResponseDto,
} from './dto/venue-response.dto';
import { VenueService } from './venue.service';
import { VenueQueryDto } from './dto/venue-query.dto';
import { Serialize } from 'src/common/decorators/serialize.decorator';

@ApiTags('Venue')
@Controller('venue')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiOkResponse({ type: VenueResponseDto })
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venueService.create(createVenueDto);
  }

  @Post('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @Serialize(FilteredVenueResponseDto)
  @ApiOperation({ summary: 'Get all venues' })
  @ApiOkResponse({ type: FilteredVenueResponseDto })
  findAll(@Body() filterBody: FilterBodyDto) {
    return this.venueService.findAllByFilter(filterBody);
  }

  @Get()
  @Roles()
  @Serialize(FilteredVenueResponseDto)
  @ApiOperation({ summary: 'Get all venues' })
  @ApiOkResponse({ type: FilteredVenueResponseDto })
  findAllByQuery(@Query() query: VenueQueryDto) {
    return this.venueService.findAllByQuery(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a venue by id' })
  @ApiOkResponse({ type: VenueResponseDto })
  findOne(@Param('id') id: string) {
    return this.venueService.findOneById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a venue' })
  @ApiOkResponse({ type: VenueResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venueService.update(req.user, id, updateVenueDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a venue' })
  remove(@Param('id') id: string) {
    return this.venueService.remove(id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete multiple venues' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.venueService.bulkDelete(ids);
  }
}
