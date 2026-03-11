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
