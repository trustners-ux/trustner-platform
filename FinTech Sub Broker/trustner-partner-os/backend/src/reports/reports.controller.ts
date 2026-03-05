import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * Get AUM report
   */
  @Get('aum')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get AUM report',
    description: 'Generate AUM trends report by month and partner',
  })
  @ApiResponse({ status: 200, description: 'AUM report' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAumReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subBrokerId') subBrokerId?: string,
    @CurrentUser() user: any,
  ) {
    const filters: ReportFiltersDto = { startDate, endDate, subBrokerId };
    return this.reportsService.getAumReport(filters);
  }

  /**
   * Get commission report
   */
  @Get('commissions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get commission report',
    description: 'Generate commission report by period and partner',
  })
  @ApiResponse({ status: 200, description: 'Commission report' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getCommissionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subBrokerId') subBrokerId?: string,
    @CurrentUser() user: any,
  ) {
    const filters: ReportFiltersDto = { startDate, endDate, subBrokerId };
    return this.reportsService.getCommissionReport(filters);
  }

  /**
   * Get SIP report
   */
  @Get('sip')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get SIP report',
    description: 'Generate SIP status breakdown and analytics',
  })
  @ApiResponse({ status: 200, description: 'SIP report' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSipReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subBrokerId') subBrokerId?: string,
    @CurrentUser() user: any,
  ) {
    const filters: ReportFiltersDto = { startDate, endDate, subBrokerId };
    return this.reportsService.getSipReport(filters);
  }

  /**
   * Get partner performance report
   */
  @Get('partner-performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get partner performance report',
    description: 'Generate partner leaderboard by AUM and commissions',
  })
  @ApiResponse({ status: 200, description: 'Partner performance report' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getPartnerPerformance(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getPartnerPerformance({});
  }

  /**
   * Get compliance report
   */
  @Get('compliance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get compliance report',
    description: 'Generate compliance report (expiring ARN, NISM, pending KYC)',
  })
  @ApiResponse({ status: 200, description: 'Compliance report' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getComplianceReport(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getComplianceReport();
  }

  /**
   * Get RTA imports history
   */
  @Get('rta-imports')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get RTA imports history',
    description: 'List all RTA file imports with status',
  })
  @ApiResponse({ status: 200, description: 'RTA imports list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRtaImports(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getRtaImports(pagination);
  }
}
