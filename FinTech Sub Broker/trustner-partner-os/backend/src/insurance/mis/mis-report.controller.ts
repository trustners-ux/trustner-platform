import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MISReportService } from './mis-report.service';

@Controller('insurance/mis/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MISReportController {
  constructor(private readonly reportService: MISReportService) {}

  @Post('generate')
  generate(@Body() dto: any, @Request() req: any) {
    return this.reportService.generateReport(dto, req.user.id);
  }

  @Get('summary')
  getSummary(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getSummaryData(
      {
        month: month ? Number(month) : undefined,
        year: Number(year) || new Date().getFullYear(),
        quarter: quarter ? Number(quarter) : undefined,
        startDate,
        endDate,
      },
      department,
    );
  }

  @Get()
  getReports(@Query('page') page?: string, @Query('limit') limit?: string, @Query('reportType') reportType?: string, @Query('department') department?: string) {
    return this.reportService.getReports(Number(page) || 1, Number(limit) || 20, { reportType, department });
  }

  @Get(':id')
  getReport(@Param('id') id: string) {
    return this.reportService.getReport(id);
  }
}

// =========================================================================
// DASHBOARD ANALYTICS CONTROLLER — Separate route prefix
// =========================================================================

@Controller('insurance/mis/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MISDashboardController {
  constructor(private readonly reportService: MISReportService) {}

  @Get('renewals-due')
  getRenewalsDue(@Query('period') period?: string) {
    const validPeriods = ['today', '7days', '15days', '1month'];
    const p = validPeriods.includes(period) ? period as any : '7days';
    return this.reportService.getRenewalsDue(p);
  }

  @Get('company-distribution')
  getCompanyDistribution() {
    return this.reportService.getCompanyWiseDistribution();
  }

  @Get('lob-distribution')
  getLOBDistribution() {
    return this.reportService.getLOBWiseDistribution();
  }

  @Get('business-summary')
  getBusinessSummary() {
    return this.reportService.getBusinessSummary();
  }

  @Get('growth-metrics')
  getGrowthMetrics() {
    return this.reportService.getGrowthMetrics();
  }

  @Get('client-stats')
  getClientStats() {
    return this.reportService.getClientStats();
  }

  @Get('renewal-loss-ratio')
  getRenewalLossRatio() {
    return this.reportService.getRenewalLossRatio();
  }
}
