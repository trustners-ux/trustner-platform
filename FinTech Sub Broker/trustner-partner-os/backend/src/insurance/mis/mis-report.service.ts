import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MISReportService {
  constructor(private readonly prisma: PrismaService) {}

  private generateReportCode(): string {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rand = String(Math.floor(100 + Math.random() * 900));
    return `MISRPT-${ym}-${rand}`;
  }

  async generateReport(
    dto: { reportType: string; periodMonth?: number; periodYear: number; periodQuarter?: number; department?: string; filters?: any; startDate?: string; endDate?: string },
    userId: string,
  ) {
    // Build date range from period or custom date range
    let startDate: Date;
    let endDate: Date;

    if (dto.startDate && dto.endDate) {
      // Custom date range
      startDate = new Date(dto.startDate);
      endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (dto.periodMonth) {
      startDate = new Date(dto.periodYear, dto.periodMonth - 1, 1);
      endDate = new Date(dto.periodYear, dto.periodMonth, 0, 23, 59, 59);
    } else if (dto.periodQuarter) {
      const startMonth = (dto.periodQuarter - 1) * 3;
      startDate = new Date(dto.periodYear, startMonth, 1);
      endDate = new Date(dto.periodYear, startMonth + 3, 0, 23, 59, 59);
    } else {
      startDate = new Date(dto.periodYear, 0, 1);
      endDate = new Date(dto.periodYear, 11, 31, 23, 59, 59);
    }

    const where: any = {
      status: 'VERIFIED',
      createdAt: { gte: startDate, lte: endDate },
    };
    if (dto.department) where.department = dto.department;

    // Aggregate data
    const [entries, byDepartment, byLob, byGrade, byPosp] = await Promise.all([
      this.prisma.mISEntry.aggregate({
        where,
        _count: { id: true },
        _sum: { grossPremium: true, netPremium: true, commissionAmount: true },
      }),
      this.prisma.mISEntry.groupBy({
        by: ['department'],
        where,
        _count: { id: true },
        _sum: { grossPremium: true },
      }),
      this.prisma.mISEntry.groupBy({
        by: ['lob'],
        where,
        _count: { id: true },
        _sum: { grossPremium: true },
      }),
      this.prisma.mISEntry.groupBy({
        by: ['productGrade'],
        where,
        _count: { id: true },
        _sum: { grossPremium: true },
      }),
      this.prisma.mISEntry.groupBy({
        by: ['pospName', 'pospCode'],
        where,
        _count: { id: true },
        _sum: { grossPremium: true, commissionAmount: true },
        orderBy: { _sum: { grossPremium: 'desc' } },
        take: 50,
      }),
    ]);

    const newCustomers = await this.prisma.mISEntry.count({ where: { ...where, isNewCustomer: true } });
    const renewals = await this.prisma.mISEntry.count({ where: { ...where, isRenewal: true } });

    const reportData = {
      summary: {
        totalEntries: entries._count.id,
        totalGrossPremium: entries._sum.grossPremium || 0,
        totalNetPremium: entries._sum.netPremium || 0,
        totalCommission: entries._sum.commissionAmount || 0,
        newCustomers,
        renewals,
      },
      byDepartment: byDepartment.map((d) => ({ department: d.department, count: d._count.id, premium: d._sum.grossPremium || 0 })),
      byLob: byLob.map((l) => ({ lob: l.lob, count: l._count.id, premium: l._sum.grossPremium || 0 })),
      byGrade: byGrade.map((g) => ({ grade: g.productGrade, count: g._count.id, premium: g._sum.grossPremium || 0 })),
      topPerformers: byPosp.map((p) => ({ pospName: p.pospName, pospCode: p.pospCode, count: p._count.id, premium: p._sum.grossPremium || 0, commission: p._sum.commissionAmount || 0 })),
    };

    return this.prisma.mISReport.create({
      data: {
        reportCode: this.generateReportCode(),
        reportType: dto.reportType as any,
        periodMonth: dto.periodMonth || null,
        periodYear: dto.periodYear,
        periodQuarter: dto.periodQuarter || null,
        department: (dto.department as any) || null,
        filters: reportData,
        generatedBy: userId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getReports(page = 1, limit = 20, filters?: { reportType?: string; department?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.reportType) where.reportType = filters.reportType;
    if (filters?.department) where.department = filters.department;

    const [data, total] = await Promise.all([
      this.prisma.mISReport.findMany({ where, skip, take: limit, orderBy: { generatedAt: 'desc' } }),
      this.prisma.mISReport.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReport(id: string) {
    const report = await this.prisma.mISReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async getSummaryData(period: { month?: number; year: number; quarter?: number; startDate?: string; endDate?: string }, department?: string) {
    let startDate: Date;
    let endDate: Date;

    if (period.startDate && period.endDate) {
      // Custom date range
      startDate = new Date(period.startDate);
      endDate = new Date(period.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period.month) {
      startDate = new Date(period.year, period.month - 1, 1);
      endDate = new Date(period.year, period.month, 0, 23, 59, 59);
    } else if (period.quarter) {
      const startMonth = (period.quarter - 1) * 3;
      startDate = new Date(period.year, startMonth, 1);
      endDate = new Date(period.year, startMonth + 3, 0, 23, 59, 59);
    } else {
      startDate = new Date(period.year, 0, 1);
      endDate = new Date(period.year, 11, 31, 23, 59, 59);
    }

    const where: any = { status: 'VERIFIED', createdAt: { gte: startDate, lte: endDate } };
    if (department) where.department = department;

    const agg = await this.prisma.mISEntry.aggregate({
      where,
      _count: { id: true },
      _sum: { grossPremium: true, netPremium: true, commissionAmount: true },
    });

    const byDepartment = await this.prisma.mISEntry.groupBy({
      by: ['department'],
      where,
      _count: { id: true },
      _sum: { grossPremium: true },
    });

    return {
      totalEntries: agg._count.id,
      totalPremium: agg._sum.grossPremium || 0,
      totalCommission: agg._sum.commissionAmount || 0,
      byDepartment: byDepartment.map((d) => ({
        department: d.department,
        count: d._count.id,
        premium: d._sum.grossPremium || 0,
      })),
    };
  }
}
