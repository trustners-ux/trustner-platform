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

  // =========================================================================
  // DASHBOARD ANALYTICS — VJ Infosoft Feature Parity
  // =========================================================================

  private getDateRange(period: 'today' | '7days' | '15days' | '1month' | 'week' | 'quarter' | 'year' | 'all'): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '15days':
        start = new Date(now);
        start.setDate(start.getDate() - 15);
        start.setHours(0, 0, 0, 0);
        break;
      case '1month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay()); // start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        start = new Date(2020, 0, 1);
        break;
    }
    return { start, end };
  }

  /**
   * 1. Renewals Due — policies expiring within the period window
   */
  async getRenewalsDue(period: 'today' | '7days' | '15days' | '1month') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let futureEnd: Date;

    switch (period) {
      case 'today':
        futureEnd = new Date(now);
        futureEnd.setHours(23, 59, 59, 999);
        break;
      case '7days':
        futureEnd = new Date(now);
        futureEnd.setDate(futureEnd.getDate() + 7);
        futureEnd.setHours(23, 59, 59, 999);
        break;
      case '15days':
        futureEnd = new Date(now);
        futureEnd.setDate(futureEnd.getDate() + 15);
        futureEnd.setHours(23, 59, 59, 999);
        break;
      case '1month':
        futureEnd = new Date(now);
        futureEnd.setMonth(futureEnd.getMonth() + 1);
        futureEnd.setHours(23, 59, 59, 999);
        break;
    }

    const renewals = await this.prisma.mISEntry.findMany({
      where: {
        status: 'VERIFIED',
        policyEndDate: { gte: now, lte: futureEnd },
      },
      select: {
        id: true,
        misCode: true,
        customerName: true,
        customerPhone: true,
        insurerName: true,
        policyNumber: true,
        lob: true,
        grossPremium: true,
        netPremium: true,
        policyStartDate: true,
        policyEndDate: true,
        pospName: true,
        employeeLocation: true,
      },
      orderBy: { policyEndDate: 'asc' },
      take: 100,
    });

    const count = await this.prisma.mISEntry.count({
      where: {
        status: 'VERIFIED',
        policyEndDate: { gte: now, lte: futureEnd },
      },
    });

    return {
      period,
      count,
      renewals: renewals.map((r) => ({
        ...r,
        daysLeft: r.policyEndDate ? Math.ceil((r.policyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
      })),
    };
  }

  /**
   * 2. Company-wise distribution — premium aggregated by insurer
   */
  async getCompanyWiseDistribution() {
    const byCompany = await this.prisma.mISEntry.groupBy({
      by: ['insurerName'],
      where: { status: 'VERIFIED', insurerName: { not: null } },
      _count: { id: true },
      _sum: { grossPremium: true, netPremium: true, commissionAmount: true },
      orderBy: { _sum: { grossPremium: 'desc' } },
    });

    return byCompany.map((c) => ({
      company: c.insurerName || 'Unknown',
      count: c._count.id,
      grossPremium: c._sum.grossPremium || 0,
      netPremium: c._sum.netPremium || 0,
      commission: c._sum.commissionAmount || 0,
    }));
  }

  /**
   * 3. LOB-wise distribution — premium aggregated by line of business
   */
  async getLOBWiseDistribution() {
    const byLob = await this.prisma.mISEntry.groupBy({
      by: ['lob'],
      where: { status: 'VERIFIED' },
      _count: { id: true },
      _sum: { grossPremium: true, netPremium: true, commissionAmount: true },
      orderBy: { _sum: { grossPremium: 'desc' } },
    });

    return byLob.map((l) => ({
      lob: l.lob,
      count: l._count.id,
      grossPremium: l._sum.grossPremium || 0,
      netPremium: l._sum.netPremium || 0,
      commission: l._sum.commissionAmount || 0,
    }));
  }

  /**
   * 4. Business Summary — totals for today/week/month/quarter/year/all-time
   */
  async getBusinessSummary() {
    const periods: Array<'today' | 'week' | '1month' | 'quarter' | 'year' | 'all'> = [
      'today', 'week', '1month', 'quarter', 'year', 'all',
    ];
    const labels: Record<string, string> = {
      today: 'Today',
      week: 'This Week',
      '1month': 'This Month',
      quarter: 'This Quarter',
      year: 'This Year',
      all: 'Gross Total',
    };

    const results = await Promise.all(
      periods.map(async (p) => {
        const { start, end } = this.getDateRange(p);
        const agg = await this.prisma.mISEntry.aggregate({
          where: {
            status: 'VERIFIED',
            entryDate: { gte: start, lte: end },
          },
          _count: { id: true },
          _sum: { grossPremium: true, netPremium: true, commissionAmount: true },
        });
        return {
          period: p,
          label: labels[p],
          entries: agg._count.id,
          grossPremium: agg._sum.grossPremium || 0,
          netPremium: agg._sum.netPremium || 0,
          commission: agg._sum.commissionAmount || 0,
        };
      }),
    );

    return results;
  }

  /**
   * 5. Growth Metrics — compare current year vs previous year for each period
   */
  async getGrowthMetrics() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;

    const periodDefs = [
      {
        label: 'Today',
        current: { start: new Date(currentYear, now.getMonth(), now.getDate(), 0, 0, 0), end: new Date(currentYear, now.getMonth(), now.getDate(), 23, 59, 59) },
        previous: { start: new Date(prevYear, now.getMonth(), now.getDate(), 0, 0, 0), end: new Date(prevYear, now.getMonth(), now.getDate(), 23, 59, 59) },
      },
      {
        label: 'This Week',
        current: { start: (() => { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; })(), end: now },
        previous: { start: (() => { const d = new Date(prevYear, now.getMonth(), now.getDate()); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; })(), end: new Date(prevYear, now.getMonth(), now.getDate(), 23, 59, 59) },
      },
      {
        label: 'This Month',
        current: { start: new Date(currentYear, now.getMonth(), 1), end: now },
        previous: { start: new Date(prevYear, now.getMonth(), 1), end: new Date(prevYear, now.getMonth() + 1, 0, 23, 59, 59) },
      },
      {
        label: 'This Quarter',
        current: { start: new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 1), end: now },
        previous: { start: new Date(prevYear, Math.floor(now.getMonth() / 3) * 3, 1), end: new Date(prevYear, Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59) },
      },
      {
        label: 'This Year',
        current: { start: new Date(currentYear, 0, 1), end: now },
        previous: { start: new Date(prevYear, 0, 1), end: new Date(prevYear, 11, 31, 23, 59, 59) },
      },
    ];

    const results = await Promise.all(
      periodDefs.map(async (pd) => {
        const [currAgg, prevAgg] = await Promise.all([
          this.prisma.mISEntry.aggregate({
            where: { status: 'VERIFIED', entryDate: { gte: pd.current.start, lte: pd.current.end } },
            _count: { id: true },
            _sum: { grossPremium: true },
          }),
          this.prisma.mISEntry.aggregate({
            where: { status: 'VERIFIED', entryDate: { gte: pd.previous.start, lte: pd.previous.end } },
            _count: { id: true },
            _sum: { grossPremium: true },
          }),
        ]);

        const currPremium = Number(currAgg._sum.grossPremium || 0);
        const prevPremium = Number(prevAgg._sum.grossPremium || 0);
        const growthPremium = currPremium - prevPremium;
        const growthRate = prevPremium > 0 ? ((growthPremium / prevPremium) * 100) : (currPremium > 0 ? 100 : 0);

        return {
          label: pd.label,
          currentEntries: currAgg._count.id,
          currentPremium: currPremium,
          previousEntries: prevAgg._count.id,
          previousPremium: prevPremium,
          growthPremium,
          growthRate: Math.round(growthRate * 100) / 100,
        };
      }),
    );

    return results;
  }

  /**
   * 6. Client Stats — count distinct clients, missing phone/email/DOB
   */
  async getClientStats() {
    // Distinct customer names as proxy for client count
    const allCustomers = await this.prisma.mISEntry.groupBy({
      by: ['customerName'],
      where: { status: 'VERIFIED' },
      _count: { id: true },
    });

    const totalClients = allCustomers.length;

    // Count distinct customers with missing phone
    const missingPhone = await this.prisma.mISEntry.groupBy({
      by: ['customerName'],
      where: {
        status: 'VERIFIED',
        OR: [{ customerPhone: null }, { customerPhone: '' }],
      },
    });

    // Count distinct customers with missing email
    const missingEmail = await this.prisma.mISEntry.groupBy({
      by: ['customerName'],
      where: {
        status: 'VERIFIED',
        OR: [{ customerEmail: null }, { customerEmail: '' }],
      },
    });

    // New customers this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newClientsThisMonth = await this.prisma.mISEntry.count({
      where: {
        status: 'VERIFIED',
        isNewCustomer: true,
        entryDate: { gte: monthStart },
      },
    });

    // Total policies count for average
    const totalPolicies = await this.prisma.mISEntry.count({
      where: { status: 'VERIFIED' },
    });

    return {
      totalClients,
      missingPhone: missingPhone.length,
      missingEmail: missingEmail.length,
      newClientsThisMonth,
      totalPolicies,
      avgPoliciesPerClient: totalClients > 0 ? Math.round((totalPolicies / totalClients) * 100) / 100 : 0,
    };
  }

  /**
   * 7. Renewal Loss Ratio — ratio of lapsed/total-due renewals per period
   */
  async getRenewalLossRatio() {
    const now = new Date();
    const periods = [
      {
        label: 'This Month',
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      },
      {
        label: 'This Quarter',
        start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59),
      },
      {
        label: 'This Year',
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      },
    ];

    const results = await Promise.all(
      periods.map(async (p) => {
        // Total policies whose policyEndDate falls in this period (renewals due)
        const totalDue = await this.prisma.mISEntry.count({
          where: {
            status: 'VERIFIED',
            policyEndDate: { gte: p.start, lte: p.end },
          },
        });

        // Renewed = entries that are renewal with entryDate in same period
        const renewed = await this.prisma.mISEntry.count({
          where: {
            status: 'VERIFIED',
            isRenewal: true,
            entryDate: { gte: p.start, lte: p.end },
          },
        });

        const lapsed = totalDue > renewed ? totalDue - renewed : 0;
        const lossRatio = totalDue > 0 ? Math.round((lapsed / totalDue) * 10000) / 100 : 0;
        const renewalRate = totalDue > 0 ? Math.round((renewed / totalDue) * 10000) / 100 : 0;

        return {
          label: p.label,
          totalDue,
          renewed,
          lapsed,
          lossRatio,
          renewalRate,
        };
      }),
    );

    return results;
  }
}
