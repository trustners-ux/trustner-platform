import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyStatus } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Insurance Dashboard Service
 * Provides analytics and dashboard data for admin and POSP views
 */
@Injectable()
export class InsuranceDashboardService {
  private readonly logger = new Logger('InsuranceDashboardService');

  constructor(private prisma: PrismaService) {}

  /**
   * Get admin dashboard overview
   */
  async getAdminDashboard(): Promise<any> {
    try {
      const [
        totalPolicies,
        activePolicies,
        totalGWP,
        totalCommission,
        claimsCount,
        renewalsCount,
        pospCount,
        lobDistribution,
      ] = await Promise.all([
        this.prisma.insurancePolicy.count(),
        this.prisma.insurancePolicy.count({
          where: { status: PolicyStatus.POLICY_ACTIVE },
        }),
        this.prisma.insurancePolicy.aggregate({
          _sum: { netPremium: true },
        }),
        this.prisma.insuranceCommission.aggregate({
          where: { status: 'APPROVED' },
          _sum: { brokerCommissionAmt: true },
        }),
        this.prisma.insuranceClaim.count(),
        this.prisma.renewalTracker.count({
          where: {
            status: { in: ['UPCOMING_30_DAYS', 'UPCOMING_15_DAYS', 'DUE'] },
          },
        }),
        this.prisma.pOSPAgent.count({ where: { status: 'ACTIVE' } }),
        this.prisma.insurancePolicy.groupBy({
          by: ['lob'],
          _count: { id: true },
          _sum: { netPremium: true },
        }),
      ]);

      const claimRatio =
        totalPolicies > 0 ? ((claimsCount / totalPolicies) * 100).toFixed(2) : 0;

      return {
        dashboard: 'Admin Overview',
        lastUpdated: new Date(),
        summary: {
          totalPolicies,
          activePolicies,
          inactivePolicies: totalPolicies - activePolicies,
          totalGWP: totalGWP._sum.netPremium || 0,
          totalCommissionPayable: totalCommission._sum.brokerCommissionAmt || 0,
          claimsCount,
          claimRatio: `${claimRatio}%`,
          renewalsDue: renewalsCount,
          activePOSPs: pospCount,
        },
        lobDistribution: lobDistribution.map((item) => ({
          lob: item.lob,
          count: item._count.id,
          gwp: item._sum.netPremium || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching admin dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get POSP individual dashboard
   */
  async getPOSPDashboard(pospId: string): Promise<any> {
    try {
      const [
        posp,
        activePolicies,
        totalGWP,
        totalCommission,
        myLeads,
        myRenewals,
      ] = await Promise.all([
        this.prisma.pOSPAgent.findUniqueOrThrow({
          where: { id: pospId },
        }),
        this.prisma.insurancePolicy.count({
          where: { pospId, status: PolicyStatus.POLICY_ACTIVE },
        }),
        this.prisma.insurancePolicy.aggregate({
          where: { pospId },
          _sum: { netPremium: true },
        }),
        this.prisma.insuranceCommission.aggregate({
          where: { pospId, status: 'APPROVED' },
          _sum: { pospCommissionAmt: true },
        }),
        this.prisma.insuranceLead.count({
          where: { pospId, status: { in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] } },
        }),
        this.prisma.renewalTracker.count({
          where: {
            pospId,
            status: { in: ['UPCOMING_30_DAYS', 'UPCOMING_15_DAYS', 'DUE'] },
          },
        }),
      ]);

      return {
        dashboard: 'POSP Dashboard',
        agent: {
          id: posp.id,
          agentCode: posp.agentCode,
          name: `${posp.firstName} ${posp.lastName}`,
          status: posp.status,
        },
        metrics: {
          activePolicies,
          totalGWP: totalGWP._sum.netPremium || 0,
          totalCommissionEarned: totalCommission._sum.pospCommissionAmt || 0,
          pendingLeads: myLeads,
          renewalsDue: myRenewals,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching POSP dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sales performance chart data
   */
  async getSalesPerformanceChart(filters: {
    pospId?: string;
    months?: number;
  }): Promise<any> {
    try {
      const months = filters.months || 12;
      const data = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = dayjs().subtract(i, 'months');
        const monthStart = monthDate.startOf('month').toDate();
        const monthEnd = monthDate.endOf('month').toDate();

        const premium = await this.prisma.insurancePolicy.aggregate({
          where: {
            pospId: filters.pospId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { netPremium: true },
        });

        data.push({
          month: monthDate.format('MMM YYYY'),
          premium: premium._sum.netPremium || 0,
        });
      }

      return {
        chart: 'Monthly Premium Trend',
        data,
      };
    } catch (error) {
      this.logger.error(`Error fetching sales chart: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get LOB distribution
   */
  async getLOBDistribution(): Promise<any> {
    try {
      const distribution = await this.prisma.insurancePolicy.groupBy({
        by: ['lob'],
        _count: { id: true },
        _sum: { netPremium: true },
      });

      return {
        chart: 'LOB Distribution',
        data: distribution.map((item) => ({
          lob: item.lob,
          count: item._count.id,
          gwp: item._sum.netPremium || 0,
          percentage: 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching LOB distribution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top performers leaderboard
   */
  async getTopPerformers(month?: number, year?: number): Promise<any> {
    try {
      const monthDate = dayjs(`${year || dayjs().year()}-${String(month || dayjs().month() + 1).padStart(2, '0')}-01`);
      const monthStart = monthDate.startOf('month').toDate();
      const monthEnd = monthDate.endOf('month').toDate();

      const performers = await this.prisma.pOSPAgent.findMany({
        where: {
          status: 'ACTIVE',
          policies: {
            some: {
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          },
        },
        include: {
          _count: {
            select: {
              policies: {
                where: {
                  createdAt: { gte: monthStart, lte: monthEnd },
                },
              },
            },
          },
        },
      });

      const performersWithPremium = await Promise.all(
        performers.map(async (p) => {
          const premium = await this.prisma.insurancePolicy.aggregate({
            where: {
              pospId: p.id,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
            _sum: { netPremium: true },
          });

          return {
            agentCode: p.agentCode,
            name: `${p.firstName} ${p.lastName}`,
            policiesCount: p._count.policies,
            gwp: premium._sum.netPremium || 0,
          };
        }),
      );

      return {
        leaderboard: `Top Performers - ${month}/${year}`,
        topPerformers: performersWithPremium.sort((a, b) => b.gwp - a.gwp).slice(0, 10),
      };
    } catch (error) {
      this.logger.error(`Error fetching top performers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get renewal calendar view
   */
  async getRenewalCalendar(pospId?: string): Promise<any> {
    try {
      const renewals = await this.prisma.renewalTracker.findMany({
        where: pospId ? { pospId } : {},
        orderBy: { expiryDate: 'asc' },
        take: 30,
      });

      const calendar = renewals.reduce(
        (acc, r) => {
          const dateKey = dayjs(r.expiryDate).format('YYYY-MM-DD');
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(r);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      return {
        calendar: 'Renewal Calendar (Next 30 Days)',
        entries: calendar,
      };
    } catch (error) {
      this.logger.error(`Error fetching renewal calendar: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get claims overview
   */
  async getClaimsOverview(): Promise<any> {
    try {
      const [
        totalClaims,
        intimatedClaims,
        approvedClaims,
        rejectedClaims,
        settledClaims,
        byType,
      ] = await Promise.all([
        this.prisma.insuranceClaim.count(),
        this.prisma.insuranceClaim.count({
          where: { status: 'INTIMATED' },
        }),
        this.prisma.insuranceClaim.count({
          where: { status: 'APPROVED' },
        }),
        this.prisma.insuranceClaim.count({
          where: { status: 'REJECTED' },
        }),
        this.prisma.insuranceClaim.count({
          where: { status: 'SETTLED' },
        }),
        this.prisma.insuranceClaim.groupBy({
          by: ['claimType'],
          _count: { id: true },
        }),
      ]);

      return {
        overview: 'Claims Overview',
        summary: {
          totalClaims,
          intimatedClaims,
          approvedClaims,
          rejectedClaims,
          settledClaims,
        },
        byType,
      };
    } catch (error) {
      this.logger.error(`Error fetching claims overview: ${error.message}`);
      throw error;
    }
  }
}
