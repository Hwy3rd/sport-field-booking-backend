import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { SportQueryDto } from './dto/sport-query.dto';
import { SportDto } from './dto/sport.dto';
import { SportService } from './sport.service';

@ApiTags('Sport')
@Controller('sport')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN)
@ApiBearerAuth()
export class SportController {
  constructor(private readonly sportService: SportService) {}

  //Allow all users to access this endpoint
  @Get()
  @Roles()
  @ApiOperation({ summary: 'Get all sports' })
  @ApiOkResponse({ type: [SportDto] })
  findAll(@Query() query: SportQueryDto) {
    return this.sportService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sport' })
  @ApiOkResponse({ type: SportDto })
  create(@Body() sportDto: SportDto) {
    return this.sportService.create(sportDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sport' })
  @ApiOkResponse({ type: SportDto })
  update(@Param('id') id: string, @Body() sportDto: SportDto) {
    return this.sportService.update(id, sportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sport' })
  @ApiOkResponse({ type: SportDto })
  remove(@Param('id') id: string) {
    return this.sportService.remove(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Admin delete multiple users' })
  bulkDelete(@Body() ids: BulkDeleteDto) {
    return this.sportService.bulkDelete(ids);
  }
}
