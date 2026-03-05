import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import dayjs from 'dayjs';

/**
 * IRDAI Compliance Service
 * Generates regulatory reports and compliance checks
 */
@Injectable()
export class IRDAIComplianceService {
  private readonly logger = new Logger('IRDAIComplianceService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate monthly business report
   */
  async generateMonthlyBusinessReport(month: number, year: number): Promise<any> {
    try {
      const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).toDate();
      const monthEnd = dayjs(monthStart).endOf('month').toDate();

      const [policies, commissions, claims, endorsements] = await Promise.all([
        this.prisma.insurancePolicy.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        this.prisma.insuranceCommission.findMany({
          where: {
            periodMonth: month,
            periodYear: year,
          },
        }),
        this.prisma.insuranceClaim.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        this.prisma.endorsement.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ]);

      const totalGWP = policies.reduce((sum, p) => sum + Number(p.netPremium), 0);
      const totalCommission = commissions.reduce((sum, c) => sum + Number(c.brokerCommissionAmt), 0);
      const totalClaims = claims.length;
      const totalEndorsements = endorsements.length;

      const report = {
        period: `${month}/${year}`,
        generatedAt: new Date(),
        metrics: {
          policiesIssued: policies.length,
          totalGWP,
          totalCommission,
          claimsIntimated: totalClaims,
          endorsementsProcessed: totalEndorsements,
        },
      };

      // Save report
      await this.prisma.iRDAIReport.create({
        data: {
          reportType: 'MONTHLY_BUSINESS',
          periodMonth: month,
          periodYear: year,
          generatedAt: new Date(),
          generatedBy: 'SYSTEM',
          status: 'GENERATED',
        },
      });

      this.logger.log(`✓ Monthly business report generated: ${month}/${year}`);
      return report;
    } catch (error) {
      this.logger.error(`Error generating monthly report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate SP/BQP list for IRDAI
   */
  async generateSPBQPList(): Promise<any> {
    try {
      const agents = await this.prisma.pOSPAgent.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          agentCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          spCode: true,
          bqpCode: true,
          irdaiLicenseNumber: true,
          certificateExpiryAt: true,
        },
      });

      const report = {
        generatedAt: new Date(),
        totalAgents: agents.length,
        agents: agents.map((a) => ({
          agentCode: a.agentCode,
          name: `${a.firstName} ${a.lastName}`,
          email: a.email,
          phone: a.phone,
          spRegistration: a.spCode,
          bqpRegistration: a.bqpCode,
          licenseNumber: a.irdaiLicenseNumber,
          licenseExpiry: a.certificateExpiryAt,
        })),
      };

      // Save report
      await this.prisma.iRDAIReport.create({
        data: {
          reportType: 'SP_BQP_LIST',
          periodYear: dayjs().year(),
          generatedAt: new Date(),
          generatedBy: 'SYSTEM',
          status: 'GENERATED',
        },
      });

      this.logger.log(`✓ SP/BQP list generated: ${agents.length} agents`);
      return report;
    } catch (error) {
      this.logger.error(`Error generating SP/BQP list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate complaint register
   */
  async generateComplaintRegister(period: { month?: number; year: number }): Promise<any> {
    try {
      const tickets = await this.prisma.supportTicket.findMany({
        where: {
          category: 'COMPLAINT',
          createdAt: {
            gte: dayjs(`${period.year}-${String(period.month || 1).padStart(2, '0')}-01`).toDate(),
            lte: dayjs(`${period.year}-${String(period.month || 12).padStart(2, '0')}`).endOf('month').toDate(),
          },
        },
        include: {
          posp: { select: { agentCode: true } },
        },
      });

      const report = {
        period: period.month ? `${period.month}/${period.year}` : `${period.year}`,
        generatedAt: new Date(),
        totalComplaints: tickets.length,
        complaints: tickets.map((t) => ({
          ticketCode: t.ticketCode,
          date: t.createdAt,
          complaint: t.description,
          agent: t.posp?.agentCode,
          status: t.status,
          resolution: t.resolution,
        })),
      };

      // Save report
      await this.prisma.iRDAIReport.create({
        data: {
          reportType: 'COMPLAINT_REGISTER',
          periodMonth: period.month,
          periodYear: period.year,
          generatedAt: new Date(),
          generatedBy: 'SYSTEM',
          status: 'GENERATED',
        },
      });

      this.logger.log(`✓ Complaint register generated: ${tickets.length} complaints`);
      return report;
    } catch (error) {
      this.logger.error(`Error generating complaint register: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate claims register
   */
  async generateClaimsRegister(period: { month?: number; year: number }): Promise<any> {
    try {
      const claims = await this.prisma.insuranceClaim.findMany({
        where: {
          createdAt: {
            gte: dayjs(`${period.year}-${String(period.month || 1).padStart(2, '0')}-01`).toDate(),
            lte: dayjs(`${period.year}-${String(period.month || 12).padStart(2, '0')}`).endOf('month').toDate(),
          },
        },
        include: {
          policy: { select: { policyNumber: true, customerName: true } },
        },
      });

      const report = {
        period: period.month ? `${period.month}/${period.year}` : `${period.year}`,
        generatedAt: new Date(),
        totalClaims: claims.length,
        claims: claims.map((c) => ({
          claimCode: c.claimCode,
          policyNumber: c.policy.policyNumber,
          customerName: c.policy.customerName,
          claimType: c.claimType,
          incidentDate: c.incidentDate,
          claimedAmount: c.claimedAmount,
          approvedAmount: c.approvedAmount,
          status: c.status,
        })),
      };

      // Save report
      await this.prisma.iRDAIReport.create({
        data: {
          reportType: 'CLAIMS_REGISTER',
          periodMonth: period.month,
          periodYear: period.year,
          generatedAt: new Date(),
          generatedBy: 'SYSTEM',
          status: 'GENERATED',
        },
      });

      this.logger.log(`✓ Claims register generated: ${claims.length} claims`);
      return report;
    } catch (error) {
      this.logger.error(`Error generating claims register: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check POSP compliance (expired certificates, training gaps)
   */
  async checkPOSPCompliance(): Promise<any> {
    try {
      const agents = await this.prisma.pOSPAgent.findMany({
        where: {
          status: 'ACTIVE',
        },
      });

      const issues = [];

      for (const agent of agents) {
        const compliance: any = {
          agentId: agent.id,
          agentCode: agent.agentCode,
          issues: [],
        };

        // Check certificate expiry
        if (agent.certificateExpiryAt && dayjs(agent.certificateExpiryAt).isBefore(dayjs())) {
          compliance.issues.push('CERTIFICATE_EXPIRED');
        } else if (
          agent.certificateExpiryAt &&
          dayjs(agent.certificateExpiryAt).isBefore(dayjs().add(30, 'days'))
        ) {
          compliance.issues.push('CERTIFICATE_EXPIRING_SOON');
        }

        // Check training hours
        if (Number(agent.trainingHoursCompleted) < 15) {
          compliance.issues.push('INCOMPLETE_TRAINING');
        }

        if (compliance.issues.length > 0) {
          issues.push(compliance);
        }
      }

      this.logger.log(`✓ POSP compliance check: ${issues.length} agents with issues`);

      return {
        checkDate: new Date(),
        totalAgents: agents.length,
        agentsWithIssues: issues.length,
        issues,
      };
    } catch (error) {
      this.logger.error(`Error checking POSP compliance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get compliance dashboard
   */
  async getComplianceDashboard(): Promise<any> {
    try {
      const [expiredCerts, upcomingExpiry, incompleteTraining, complaints, claims] = await Promise.all([
        this.prisma.pOSPAgent.count({
          where: {
            status: 'ACTIVE',
            certificateExpiryAt: { lt: new Date() },
          },
        }),
        this.prisma.pOSPAgent.count({
          where: {
            status: 'ACTIVE',
            certificateExpiryAt: {
              gte: new Date(),
              lte: dayjs().add(30, 'days').toDate(),
            },
          },
        }),
        this.prisma.pOSPAgent.count({
          where: {
            trainingHoursCompleted: { lt: 15 },
          },
        }),
        this.prisma.supportTicket.count({
          where: { category: 'COMPLAINT' },
        }),
        this.prisma.insuranceClaim.count(),
      ]);

      return {
        dashboard: 'IRDAI Compliance',
        lastUpdated: new Date(),
        metrics: {
          expiredCertificates: expiredCerts,
          certificatesExpiringIn30Days: upcomingExpiry,
          agentsWithIncompleteTraining: incompleteTraining,
          totalComplaints: complaints,
          totalClaims: claims,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching compliance dashboard: ${error.message}`);
      throw error;
    }
  }
}
