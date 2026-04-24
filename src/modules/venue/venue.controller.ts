import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
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

@ApiTags('Venue')
@Controller('venue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN)
@ApiBearerAuth()
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiOkResponse({ type: VenueResponseDto })
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venueService.create(createVenueDto);
  }

  @Post('search')
  @Roles()
  @ApiOperation({ summary: 'Get all venues' })
  @ApiOkResponse({ type: FilteredVenueResponseDto })
  findAll(@Body() filterBody: FilterBodyDto) {
    return this.venueService.findAllByFilter(filterBody);
  }

  @Patch(':id')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
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
  @ApiOperation({ summary: 'Delete a venue' })
  remove(@Param('id') id: string) {
    return this.venueService.remove(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Admin delete multiple venues' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.venueService.bulkDelete(ids);
  }
}
