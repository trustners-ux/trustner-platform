import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RenewalStatus } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Renewals Engine Service
 * Manages policy renewal tracking, reminders, and analytics
 */
@Injectable()
export class RenewalsService {
  private readonly logger = new Logger('RenewalsService');

  constructor(private prisma: PrismaService) {}

  /**
   * List all renewal trackers with pagination
   */
  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.renewalTracker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.renewalTracker.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get renewal stats for dashboard
   */
  async getStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [dueThisMonth, renewed, lapsed, total] = await Promise.all([
      this.prisma.renewalTracker.count({
        where: { expiryDate: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.renewalTracker.count({
        where: { status: 'RENEWED' },
      }),
      this.prisma.renewalTracker.count({
        where: { status: 'LAPSED' },
      }),
      this.prisma.renewalTracker.count(),
    ]);

    return { dueThisMonth, renewed, lapsed, total };
  }

  /**
   * Scan for policies expiring soon and create renewal trackers
   * Called as scheduled task
   */
  async scanForRenewals(): Promise<any> {
    try {
      const now = dayjs();
      const targets = [
        { days: 90, status: RenewalStatus.UPCOMING_90_DAYS },
        { days: 60, status: RenewalStatus.UPCOMING_60_DAYS },
        { days: 30, status: RenewalStatus.UPCOMING_30_DAYS },
        { days: 15, status: RenewalStatus.UPCOMING_15_DAYS },
        { days: 7, status: RenewalStatus.UPCOMING_15_DAYS },
        { days: 0, status: RenewalStatus.DUE },
      ];

      const results = [];

      for (const target of targets) {
        const fromDate = now.add(target.days - 1, 'days').startOf('day').toDate();
        const toDate = now.add(target.days, 'days').endOf('day').toDate();

        const expiring = await this.prisma.insurancePolicy.findMany({
          where: {
            status: 'POLICY_ACTIVE',
            endDate: {
              gte: fromDate,
              lte: toDate,
            },
          },
          include: {
            posp: { select: { phone: true } },
            company: { select: { companyName: true } },
          },
        });

        for (const policy of expiring) {
          const existing = await this.prisma.renewalTracker.findUnique({
            where: { policyId: policy.id },
          });

          if (!existing) {
            const tracker = await this.prisma.renewalTracker.create({
              data: {
                policyId: policy.id,
                pospId: policy.pospId,
                customerName: policy.customerName,
                customerPhone: policy.customerPhone,
                lob: policy.lob,
                companyName: policy.company.companyName,
                policyNumber: policy.policyNumber,
                expiryDate: policy.endDate,
                premiumAmount: policy.netPremium,
                status: target.status,
              },
            });

            results.push(tracker);
          } else {
            // Update status
            const updated = await this.prisma.renewalTracker.update({
              where: { policyId: policy.id },
              data: { status: target.status },
            });
            results.push(updated);
          }
        }
      }

      this.logger.log(`✓ Renewal scan completed: ${results.length} trackers updated`);
      return { updated: results.length, details: results };
    } catch (error) {
      this.logger.error(`Error scanning for renewals: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update renewal status
   */
  async updateRenewalStatus(id: string, status: RenewalStatus): Promise<any> {
    try {
      const updated = await this.prisma.renewalTracker.update({
        where: { id },
        data: { status },
      });

      this.logger.log(`✓ Renewal status updated: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating renewal status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send renewal reminder
   */
  async sendRenewalReminder(id: string, channel: 'SMS' | 'WHATSAPP' | 'EMAIL'): Promise<any> {
    try {
      const tracker = await this.prisma.renewalTracker.findUniqueOrThrow({
        where: { id },
      });

      // Update appropriate reminder flag
      let updateData: any = {};
      switch (tracker.status) {
        case RenewalStatus.UPCOMING_90_DAYS:
          updateData.reminder90DaySent = true;
          break;
        case RenewalStatus.UPCOMING_60_DAYS:
          updateData.reminder60DaySent = true;
          break;
        case RenewalStatus.UPCOMING_30_DAYS:
          updateData.reminder30DaySent = true;
          break;
        case RenewalStatus.UPCOMING_15_DAYS:
          updateData.reminder15DaySent = true;
          break;
      }

      const updated = await this.prisma.renewalTracker.update({
        where: { id },
        data: updateData,
      });

      // In production, integrate with SMS/Email/WhatsApp provider
      this.logger.log(
        `✓ Renewal reminder sent via ${channel}: ${tracker.policyNumber}`,
      );

      return {
        trackerId: id,
        channel,
        policyNumber: tracker.policyNumber,
        customerPhone: tracker.customerPhone,
        status: 'SENT',
      };
    } catch (error) {
      this.logger.error(`Error sending reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark renewal as renewed
   */
  async markRenewed(id: string, newPolicyId: string): Promise<any> {
    try {
      const updated = await this.prisma.renewalTracker.update({
        where: { id },
        data: {
          status: RenewalStatus.RENEWED,
          renewedPolicyId: newPolicyId,
        },
      });

      this.logger.log(`✓ Renewal marked renewed: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error marking renewal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark renewal as lost
   */
  async markLost(id: string, reason: string, competitorName?: string): Promise<any> {
    try {
      const updated = await this.prisma.renewalTracker.update({
        where: { id },
        data: {
          status: RenewalStatus.LOST_TO_COMPETITOR,
          lostReason: reason,
          competitorName,
        },
      });

      this.logger.log(`✓ Renewal marked lost: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error marking renewal as lost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get renewal dashboard for POSP
   */
  async getRenewalDashboard(pospId: string): Promise<any> {
    try {
      const trackers = await this.prisma.renewalTracker.findMany({
        where: { pospId },
        orderBy: { expiryDate: 'asc' },
      });

      const grouped = {
        upcoming_90_days: trackers.filter(
          (t) => t.status === RenewalStatus.UPCOMING_90_DAYS,
        ).length,
        upcoming_60_days: trackers.filter(
          (t) => t.status === RenewalStatus.UPCOMING_60_DAYS,
        ).length,
        upcoming_30_days: trackers.filter(
          (t) => t.status === RenewalStatus.UPCOMING_30_DAYS,
        ).length,
        upcoming_15_days: trackers.filter(
          (t) => t.status === RenewalStatus.UPCOMING_15_DAYS,
        ).length,
        due: trackers.filter((t) => t.status === RenewalStatus.DUE).length,
        renewed: trackers.filter((t) => t.status === RenewalStatus.RENEWED)
          .length,
        lapsed: trackers.filter((t) => t.status === RenewalStatus.LAPSED)
          .length,
      };

      return {
        pospId,
        summary: grouped,
        total: trackers.length,
        renewals: trackers,
      };
    } catch (error) {
      this.logger.error(`Error fetching renewal dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get renewal analytics
   */
  async getRenewalAnalytics(): Promise<any> {
    try {
      const [
        totalRenewals,
        renewedCount,
        lapsedCount,
        lostCount,
        renewalsByLOB,
        renewalsByCompany,
      ] = await Promise.all([
        this.prisma.renewalTracker.count(),
        this.prisma.renewalTracker.count({
          where: { status: RenewalStatus.RENEWED },
        }),
        this.prisma.renewalTracker.count({
          where: { status: RenewalStatus.LAPSED },
        }),
        this.prisma.renewalTracker.count({
          where: { status: RenewalStatus.LOST_TO_COMPETITOR },
        }),
        this.prisma.renewalTracker.groupBy({
          by: ['lob'],
          _count: { id: true },
          _sum: { premiumAmount: true },
        }),
        this.prisma.renewalTracker.groupBy({
          by: ['companyName'],
          _count: { id: true },
          _sum: { premiumAmount: true },
        }),
      ]);

      const renewalRate =
        totalRenewals > 0 ? ((renewedCount / totalRenewals) * 100).toFixed(2) : 0;
      const lapsedRate =
        totalRenewals > 0 ? ((lapsedCount / totalRenewals) * 100).toFixed(2) : 0;

      return {
        summary: {
          totalRenewals,
          renewedCount,
          lapsedCount,
          lostCount,
          renewalRate: `${renewalRate}%`,
          lapsedRate: `${lapsedRate}%`,
        },
        byLOB: renewalsByLOB,
        byCompany: renewalsByCompany,
      };
    } catch (error) {
      this.logger.error(`Error fetching renewal analytics: ${error.message}`);
      throw error;
    }
  }
}
