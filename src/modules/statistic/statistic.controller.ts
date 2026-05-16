import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { StatisticService } from './statistic.service';

@ApiTags('Statistic')
@Controller('statistic')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
@ApiBearerAuth()
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated summary KPIs for Admin/Owner' })
  getSummary(@Req() req: { user: AuthUser }) {
    return this.statisticService.getSummaryStats(req.user);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get timeseries revenue data' })
  getRevenueChart(
    @Req() req: { user: AuthUser },
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    return this.statisticService.getRevenueChart(req.user, query);
  }

  @Get('sport-split')
  @ApiOperation({ summary: 'Get popularity split by sport category' })
  getSportSplit(@Req() req: { user: AuthUser }) {
    return this.statisticService.getSportCategorySplit(req.user);
  }

  @Get('occupancy-rate')
  @ApiOperation({ summary: 'Get future slot occupancy percentage' })
  getOccupancyRate(@Req() req: { user: AuthUser }) {
    return this.statisticService.getOccupancyRate(req.user);
  }

  @Get('top-venues')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Get top 5 venues by platform revenue (Admin/Owner)' })
  getTopVenues(@Req() req: { user: AuthUser }) {
    return this.statisticService.getTopVenues(req.user);
  }

  @Get('user-growth')
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Get daily new user registration growth (Admin only)' })
  getUserGrowth(@Query() query: { startDate?: string; endDate?: string }) {
    return this.statisticService.getUserRegistrationGrowth(query);
  }
}
