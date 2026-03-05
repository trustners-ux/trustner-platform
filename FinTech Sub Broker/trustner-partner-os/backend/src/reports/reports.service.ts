import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Reports Service
 * Generates business, financial, and regulatory reports
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Get AUM report with trends by month
   */
  async getAumReport(filters: ReportFiltersDto) {
    const where: any = {};

    if (filters.startDate) {
      where.recordDate = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      where.recordDate = {
        ...where.recordDate,
        lte: new Date(filters.endDate),
      };
    }

    if (filters.subBrokerId) {
      where.subBrokerId = filters.subBrokerId;
    }

    const records = await this.prismaService.aumRecord.findMany({
      where,
      orderBy: { recordDate: 'asc' },
      include: {
        subBroker: {
          select: { id: true, code: true, name: true, commissionTier: true },
        },
      },
    });

    // Group by month and calculate trends
    const byMonth = this.groupAUMByMonth(records);

    const summary = {
      totalPartners: new Set(records.map((r) => r.subBrokerId)).size,
      totalAUM: records.reduce((sum, r) => sum + (r.totalAum?.toNumber() || 0), 0),
      averageAUM:
        records.length > 0
          ? records.reduce((sum, r) => sum + (r.totalAum?.toNumber() || 0), 0) /
            records.length
          : 0,
      equityAUM: records.reduce((sum, r) => sum + (r.equityAum?.toNumber() || 0), 0),
      debtAUM: records.reduce((sum, r) => sum + (r.debtAum?.toNumber() || 0), 0),
      hybridAUM: records.reduce((sum, r) => sum + (r.hybridAum?.toNumber() || 0), 0),
    };

    return {
      reportType: 'AUM_REPORT',
      period: {
        from: filters.startDate || 'N/A',
        to: filters.endDate || 'N/A',
      },
      summary,
      byMonth,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get commission report by period and partner
   */
  async getCommissionReport(filters: ReportFiltersDto) {
    const where: any = {};

    if (filters.subBrokerId) {
      where.subBrokerId = filters.subBrokerId;
    }

    let commissions = await this.prismaService.commission.findMany({
      where,
      include: {
        subBroker: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by date if provided
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;

      commissions = commissions.filter((c) => {
        const cDate = c.createdAt;
        const startOk = !start || cDate >= start;
        const endOk = !end || cDate <= end;
        return startOk && endOk;
      });
    }

    // Group by status
    const byStatus = this.groupCommissionsByStatus(commissions);

    // Group by sub-broker
    const bySubBroker = this.groupCommissionsBySubBroker(commissions);

    const totals = {
      totalCount: commissions.length,
      totalGross: commissions.reduce((sum, c) => sum + (c.grossAmount?.toNumber() || 0), 0),
      totalTDS: commissions.reduce((sum, c) => sum + (c.tdsAmount?.toNumber() || 0), 0),
      totalGST: commissions.reduce((sum, c) => sum + (c.gstAmount?.toNumber() || 0), 0),
      totalNet: commissions.reduce((sum, c) => sum + (c.netAmount?.toNumber() || 0), 0),
    };

    return {
      reportType: 'COMMISSION_REPORT',
      period: {
        from: filters.startDate || 'All',
        to: filters.endDate || 'All',
      },
      totals,
      byStatus,
      bySubBroker,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get SIP report with status breakdown
   */
  async getSipReport(filters: ReportFiltersDto) {
    const where: any = {};

    if (filters.subBrokerId) {
      where.subBrokerId = filters.subBrokerId;
    }

    const sips = await this.prismaService.sIPRegistration.findMany({
      where,
      include: {
        client: { select: { name: true } },
        scheme: { select: { schemeName: true } },
        subBroker: { select: { code: true, name: true } },
      },
    });

    // Group by status
    const byStatus = this.groupSIPsByStatus(sips);

    // Calculate statistics
    const stats = {
      totalSIPs: sips.length,
      activeSIPs: sips.filter((s) => s.status === 'ACTIVE').length,
      cancelledSIPs: sips.filter((s) => s.status === 'CANCELLED').length,
      completedSIPs: sips.filter((s) => s.status === 'COMPLETED').length,
      failedSIPs: sips.filter((s) => s.status === 'FAILED').length,
      totalMonthlyAmount: sips
        .filter((s) => s.status === 'ACTIVE')
        .reduce((sum, s) => sum + (s.amount?.toNumber() || 0), 0),
      totalInvested: sips.reduce((sum, s) => sum + (s.totalInvested?.toNumber() || 0), 0),
      newSIPsThisMonth: sips.filter(
        (s) => this.isThisMonth(s.createdAt),
      ).length,
    };

    return {
      reportType: 'SIP_REPORT',
      period: {
        from: filters.startDate || 'All',
        to: filters.endDate || 'All',
      },
      stats,
      byStatus,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get partner performance leaderboard
   */
  async getPartnerPerformance(filters: ReportFiltersDto) {
    const subBrokers = await this.prismaService.subBroker.findMany({
      where: { status: 'APPROVED' },
      include: {
        clients: { select: { id: true } },
        commissions: { select: { netAmount: true } },
      },
    });

    // Calculate metrics for each partner
    const performance = await Promise.all(
      subBrokers.map(async (sb) => {
        const aum = await this.getSubBrokerAUM(sb.id);
        const sipBook = await this.getSubBrokerSIPBook(sb.id);
        const totalCommission = sb.commissions.reduce(
          (sum, c) => sum + (c.netAmount?.toNumber() || 0),
          0,
        );

        return {
          id: sb.id,
          code: sb.code,
          name: sb.name,
          tier: sb.commissionTier,
          aum,
          clients: sb.clients.length,
          sipBook,
          totalCommission,
          createdAt: sb.createdAt,
        };
      }),
    );

    // Sort by AUM (descending)
    performance.sort((a, b) => b.aum - a.aum);

    // Add rank
    const ranked = performance.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));

    return {
      reportType: 'PARTNER_PERFORMANCE',
      leaderboard: ranked,
      topPerformers: ranked.slice(0, 10),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get compliance report (expiring ARN, NISM, pending KYC)
   */
  async getComplianceReport() {
    const today = new Date();

    // Expiring ARN (within 90 days)
    const expiringARN = await this.prismaService.subBroker.findMany({
      where: {
        arnValidTill: {
          lte: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
          gte: today,
        },
      },
      select: { id: true, code: true, name: true, arnValidTill: true },
    });

    // Expired ARN
    const expiredARN = await this.prismaService.subBroker.findMany({
      where: {
        arnValidTill: { lt: today },
      },
      select: { id: true, code: true, name: true, arnValidTill: true },
    });

    // Incomplete KYC
    const incompleteKYC = await this.prismaService.client.findMany({
      where: {
        kycStatus: { notIn: ['COMPLETE'] },
      },
      select: { id: true, clientCode: true, kycStatus: true },
    });

    // Active compliance alerts
    const alerts = await this.prismaService.complianceAlert.findMany({
      where: { isResolved: false },
      orderBy: { severity: 'desc' },
      select: { id: true, type: true, severity: true, description: true, dueDate: true },
    });

    return {
      reportType: 'COMPLIANCE_REPORT',
      summary: {
        expiringARNCount: expiringARN.length,
        expiredARNCount: expiredARN.length,
        incompleteKYCCount: incompleteKYC.length,
        activeAlertsCount: alerts.length,
      },
      details: {
        expiringARN,
        expiredARN,
        incompleteKYC,
        alerts,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get RTA import history
   */
  async getRtaImports(pagination: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prismaService.rTAImport.findMany({
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.rTAImport.count(),
    ]);

    return {
      data,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private groupAUMByMonth(records: any[]) {
    const byMonth: any = {};

    records.forEach((r) => {
      const month = r.recordDate.toISOString().slice(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = {
          totalAUM: 0,
          equityAUM: 0,
          debtAUM: 0,
          hybridAUM: 0,
          partnerCount: new Set(),
        };
      }
      byMonth[month].totalAUM += r.totalAum?.toNumber() || 0;
      byMonth[month].equityAUM += r.equityAum?.toNumber() || 0;
      byMonth[month].debtAUM += r.debtAum?.toNumber() || 0;
      byMonth[month].hybridAUM += r.hybridAum?.toNumber() || 0;
      byMonth[month].partnerCount.add(r.subBrokerId);
    });

    return Object.entries(byMonth).map(([month, data]: any) => ({
      month,
      ...data,
      partnerCount: data.partnerCount.size,
    }));
  }

  private groupCommissionsByStatus(commissions: any[]) {
    return commissions.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {},
    );
  }

  private groupCommissionsBySubBroker(commissions: any[]) {
    const grouped: any = {};

    commissions.forEach((c) => {
      if (!grouped[c.subBrokerId]) {
        grouped[c.subBrokerId] = {
          code: c.subBroker.code,
          name: c.subBroker.name,
          count: 0,
          totalGross: 0,
          totalNet: 0,
        };
      }
      grouped[c.subBrokerId].count++;
      grouped[c.subBrokerId].totalGross += c.grossAmount?.toNumber() || 0;
      grouped[c.subBrokerId].totalNet += c.netAmount?.toNumber() || 0;
    });

    return Object.values(grouped);
  }

  private groupSIPsByStatus(sips: any[]) {
    return sips.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {},
    );
  }

  private async getSubBrokerAUM(subBrokerId: string): Promise<number> {
    const result = await this.prismaService.holding.aggregate({
      _sum: { currentValue: true },
      where: { client: { subBrokerId } },
    });
    return result._sum.currentValue?.toNumber() || 0;
  }

  private async getSubBrokerSIPBook(subBrokerId: string): Promise<number> {
    const result = await this.prismaService.sIPRegistration.aggregate({
      _sum: { amount: true },
      where: { subBrokerId, status: 'ACTIVE' },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  private isThisMonth(date: Date): boolean {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }
}
