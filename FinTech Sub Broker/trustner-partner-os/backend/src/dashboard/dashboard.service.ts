import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Dashboard Service
 * Provides aggregated analytics and metrics for different user roles
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger('DashboardService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Get admin dashboard with platform-wide metrics
   */
  async getAdminDashboard() {
    const [subBrokers, clients, totalAUM, monthlyCommission, sipBook, alerts] =
      await Promise.all([
        this.prismaService.subBroker.count({
          where: { status: 'APPROVED' },
        }),
        this.prismaService.client.count({
          where: { status: 'ACTIVE' },
        }),
        this.getTotalAUM(),
        this.getMonthlyCommission(),
        this.getTotalSIPBook(),
        this.getPendingAlerts(),
      ]);

    const newPartnersThisMonth = await this.getNewPartnersThisMonth();
    const pendingApprovals = await this.getPendingApprovals();

    return {
      overview: {
        totalPartners: subBrokers,
        activeClients: clients,
        totalAUM: totalAUM,
        monthlyCommission: monthlyCommission,
        sipBook: sipBook,
      },
      metrics: {
        newPartnersThisMonth: newPartnersThisMonth,
        pendingApprovals: pendingApprovals,
        criticalAlerts: alerts.critical,
        highAlerts: alerts.high,
      },
      recentActivity: {
        lastTransactions: await this.getRecentTransactions(5),
        topPartnersByAUM: await this.getTopPartners(5),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get partner/sub-broker dashboard
   */
  async getPartnerDashboard(subBrokerId: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id: subBrokerId },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${subBrokerId} not found`);
    }

    const [myAUM, myClients, myCommissions, mySIPBook, pendingPayouts] =
      await Promise.all([
        this.getSubBrokerAUM(subBrokerId),
        this.getSubBrokerClientCount(subBrokerId),
        this.getSubBrokerCommissions(subBrokerId),
        this.getSubBrokerSIPBook(subBrokerId),
        this.getSubBrokerPendingPayouts(subBrokerId),
      ]);

    const recentTransactions = await this.getSubBrokerTransactions(
      subBrokerId,
      5,
    );

    return {
      partner: {
        id: subBroker.id,
        code: subBroker.code,
        name: subBroker.name,
        commissionTier: subBroker.commissionTier,
        status: subBroker.status,
      },
      metrics: {
        myAUM: myAUM,
        activeClients: myClients,
        monthlyCommission: myCommissions,
        sipBook: mySIPBook,
      },
      payouts: {
        pendingPayouts: pendingPayouts.count,
        pendingAmount: pendingPayouts.amount,
      },
      recentTransactions: recentTransactions,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get client dashboard
   */
  async getClientDashboard(clientId: string) {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
      include: {
        holdings: true,
        sipRegistrations: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const portfolioValue = client.holdings.reduce(
      (sum, h) => sum + (h.currentValue?.toNumber() || 0),
      0,
    );

    const investedAmount = client.holdings.reduce(
      (sum, h) => sum + (h.investedAmount?.toNumber() || 0),
      0,
    );

    const returns = portfolioValue - investedAmount;
    const returnsPercentage =
      investedAmount > 0 ? (returns / investedAmount) * 100 : 0;

    const activeSIPs = client.sipRegistrations.filter(
      (s) => s.status === 'ACTIVE',
    );
    const nextSIPDue = activeSIPs.length > 0
      ? Math.min(...activeSIPs.map((s) => s.nextDueDate?.getTime() || 0))
      : null;

    const recentTransactions = await this.getClientTransactions(clientId, 5);

    return {
      client: {
        id: client.id,
        code: client.clientCode,
        name: client.user?.name || 'N/A',
        status: client.status,
        kycStatus: client.kycStatus,
      },
      portfolio: {
        totalValue: portfolioValue,
        investedAmount: investedAmount,
        returns: returns,
        returnsPercentage: returnsPercentage.toFixed(2),
        holdingsCount: client.holdings.length,
      },
      sip: {
        activeSIPs: activeSIPs.length,
        nextDueDate: nextSIPDue ? new Date(nextSIPDue) : null,
        totalSIPAmount: client.totalSipAmount.toNumber(),
      },
      recentTransactions: recentTransactions,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats() {
    const usersByRole = await this.getUsersByRole();
    const transactionsByStatus = await this.getTransactionsByStatus();
    const topPartners = await this.getTopPartners(10);

    return {
      users: usersByRole,
      transactions: transactionsByStatus,
      topPartners: topPartners,
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getTotalAUM(): Promise<number> {
    const result = await this.prismaService.holding.aggregate({
      _sum: { currentValue: true },
    });
    return result._sum.currentValue?.toNumber() || 0;
  }

  private async getMonthlyCommission(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prismaService.commission.aggregate({
      _sum: { netAmount: true },
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    return result._sum.netAmount?.toNumber() || 0;
  }

  private async getTotalSIPBook(): Promise<number> {
    const result = await this.prismaService.sIPRegistration.aggregate({
      _sum: { amount: true },
      where: { status: 'ACTIVE' },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  private async getPendingAlerts() {
    const [critical, high] = await Promise.all([
      this.prismaService.complianceAlert.count({
        where: { severity: 'CRITICAL', isResolved: false },
      }),
      this.prismaService.complianceAlert.count({
        where: { severity: 'HIGH', isResolved: false },
      }),
    ]);

    return { critical, high };
  }

  private async getNewPartnersThisMonth(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.prismaService.subBroker.count({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'APPROVED',
      },
    });
  }

  private async getPendingApprovals(): Promise<number> {
    return this.prismaService.subBroker.count({
      where: { status: { in: ['PENDING_APPROVAL', 'UNDER_REVIEW'] } },
    });
  }

  private async getRecentTransactions(limit: number) {
    return this.prismaService.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transactionCode: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    });
  }

  private async getTopPartners(limit: number) {
    return this.prismaService.subBroker.findMany({
      take: limit,
      orderBy: { totalAum: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        totalAum: true,
        totalClients: true,
        totalSipBook: true,
        commissionTier: true,
      },
    });
  }

  private async getSubBrokerAUM(subBrokerId: string): Promise<number> {
    const result = await this.prismaService.holding.aggregate({
      _sum: { currentValue: true },
      where: {
        client: { subBrokerId },
      },
    });
    return result._sum.currentValue?.toNumber() || 0;
  }

  private async getSubBrokerClientCount(subBrokerId: string): Promise<number> {
    return this.prismaService.client.count({
      where: { subBrokerId, status: 'ACTIVE' },
    });
  }

  private async getSubBrokerCommissions(subBrokerId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prismaService.commission.aggregate({
      _sum: { netAmount: true },
      where: {
        subBrokerId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    return result._sum.netAmount?.toNumber() || 0;
  }

  private async getSubBrokerSIPBook(subBrokerId: string): Promise<number> {
    const result = await this.prismaService.sIPRegistration.aggregate({
      _sum: { amount: true },
      where: { subBrokerId, status: 'ACTIVE' },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  private async getSubBrokerPendingPayouts(subBrokerId: string) {
    const result = await this.prismaService.payout.aggregate({
      _count: true,
      _sum: { finalAmount: true },
      where: { subBrokerId, status: 'PENDING' },
    });

    return {
      count: result._count,
      amount: result._sum.finalAmount?.toNumber() || 0,
    };
  }

  private async getSubBrokerTransactions(
    subBrokerId: string,
    limit: number,
  ) {
    return this.prismaService.transaction.findMany({
      where: { client: { subBrokerId } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transactionCode: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    });
  }

  private async getClientTransactions(clientId: string, limit: number) {
    return this.prismaService.transaction.findMany({
      where: { clientId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transactionCode: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        scheme: { select: { schemeName: true } },
      },
    });
  }

  private async getUsersByRole() {
    const result = await this.prismaService.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    return result.map((r) => ({
      role: r.role,
      count: r._count.id,
    }));
  }

  private async getTransactionsByStatus() {
    const result = await this.prismaService.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    return result.map((r) => ({
      status: r.status,
      count: r._count.id,
      totalAmount: r._sum.amount?.toNumber() || 0,
    }));
  }
}
