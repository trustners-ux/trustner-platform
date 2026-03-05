import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Get admin dashboard
   */
  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Get admin dashboard',
    description: 'Get platform-wide analytics and metrics',
  })
  @ApiResponse({ status: 200, description: 'Admin dashboard data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAdminDashboard(
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getAdminDashboard();
  }

  /**
   * Get partner dashboard
   */
  @Get('partner')
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Get partner dashboard',
    description: 'Get sub-broker metrics and performance data',
  })
  @ApiResponse({ status: 200, description: 'Partner dashboard data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPartnerDashboard(
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SUB_BROKER && !user.subBrokerId) {
      throw new ForbiddenException('Sub-broker ID not found');
    }

    const subBrokerId =
      user.role === UserRole.SUB_BROKER ? user.subBrokerId : user.subBrokerId;

    if (!subBrokerId) {
      throw new ForbiddenException('Sub-broker information not available');
    }

    return this.dashboardService.getPartnerDashboard(subBrokerId);
  }

  /**
   * Get client dashboard
   */
  @Get('client')
  @Roles(UserRole.CLIENT, UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get client dashboard',
    description: 'Get client portfolio and investment metrics',
  })
  @ApiResponse({ status: 200, description: 'Client dashboard data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getClientDashboard(
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.CLIENT && !user.clientId) {
      throw new ForbiddenException('Client ID not found');
    }

    const clientId =
      user.role === UserRole.CLIENT ? user.clientId : user.clientId;

    if (!clientId) {
      throw new ForbiddenException('Client information not available');
    }

    return this.dashboardService.getClientDashboard(clientId);
  }

  /**
   * Get system statistics
   */
  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get system statistics',
    description: 'Get system-wide statistics and trends',
  })
  @ApiResponse({ status: 200, description: 'System statistics' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSystemStats(
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getSystemStats();
  }
}
