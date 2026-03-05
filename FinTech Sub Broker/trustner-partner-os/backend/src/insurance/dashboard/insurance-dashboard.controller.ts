import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InsuranceDashboardService } from './insurance-dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Dashboard')
@Controller('insurance/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class InsuranceDashboardController {
  constructor(private dashboardService: InsuranceDashboardService) {}

  /**
   * Get admin dashboard
   */
  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get admin dashboard',
    description: 'Total GWP, policies count, active POSPs, claims ratio, etc.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  /**
   * Get POSP dashboard
   */
  @Get('posp/:pospId')
  @ApiOperation({
    summary: "Get POSP's dashboard",
    description: 'My policies, commission, leads, renewals, performance rank',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getPOSPDashboard(@Param('pospId') pospId: string) {
    return this.dashboardService.getPOSPDashboard(pospId);
  }

  /**
   * Get sales performance chart
   */
  @Get('charts/sales-performance')
  @ApiOperation({
    summary: 'Get sales performance chart',
    description: 'Monthly premium trend',
  })
  @ApiResponse({ status: 200, description: 'Chart data' })
  async getSalesPerformanceChart(
    @Query('pospId') pospId?: string,
    @Query('months') months: string = '12',
  ) {
    return this.dashboardService.getSalesPerformanceChart({
      pospId,
      months: parseInt(months),
    });
  }

  /**
   * Get LOB distribution
   */
  @Get('charts/lob-distribution')
  @ApiOperation({
    summary: 'Get LOB distribution',
    description: 'Pie chart data for line of business',
  })
  @ApiResponse({ status: 200, description: 'Chart data' })
  async getLOBDistribution() {
    return this.dashboardService.getLOBDistribution();
  }

  /**
   * Get top performers
   */
  @Get('top-performers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get top performers leaderboard',
    description: 'Leaderboard of top performing POSPs',
  })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  async getTopPerformers(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.dashboardService.getTopPerformers(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  /**
   * Get renewal calendar
   */
  @Get('calendars/renewal')
  @ApiOperation({
    summary: 'Get renewal calendar',
    description: 'Calendar view of upcoming renewals',
  })
  @ApiResponse({ status: 200, description: 'Calendar data' })
  async getRenewalCalendar(@Query('pospId') pospId?: string) {
    return this.dashboardService.getRenewalCalendar(pospId);
  }

  /**
   * Get claims overview
   */
  @Get('claims-overview')
  @ApiOperation({
    summary: 'Get claims overview',
    description: 'Claims by status and type overview',
  })
  @ApiResponse({ status: 200, description: 'Overview data' })
  async getClaimsOverview() {
    return this.dashboardService.getClaimsOverview();
  }
}
