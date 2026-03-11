import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsuranceCommissionType } from '@prisma/client';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

/**
 * Insurance Commission Engine Service
 * Slab-based commission calculation for POSP agents
 * Handles: commission slabs, calculations, reconciliation, payouts, and clawback
 */
@Injectable()
export class InsuranceCommissionsService {
  private readonly logger = new Logger('InsuranceCommissionsService');

  constructor(private prisma: PrismaService) {}

  /**
   * Configure commission slabs for company/LOB
   */
  async configureSlabs(
    companyId: string,
    lob: string,
    slabs: Array<{
      slabName: string;
      minPremium: number;
      maxPremium: number;
      brokerRate: number;
      pospShareRate: number;
      effectiveFrom: string;
      effectiveTo?: string;
    }>,
  ): Promise<any> {
    try {
      const results = [];

      for (const slab of slabs) {
        const existing = await this.prisma.insuranceCommissionSlab.findFirst({
          where: {
            companyId,
            lob,
            slabName: slab.slabName,
            isActive: true,
          },
        });

        if (existing) {
          // Deactivate old slab
          await this.prisma.insuranceCommissionSlab.update({
            where: { id: existing.id },
            data: { isActive: false },
          });
        }

        const newSlab = await this.prisma.insuranceCommissionSlab.create({
          data: {
            companyId,
            lob: lob as any,
            slabName: slab.slabName,
            minPremium: Number(slab.minPremium),
            maxPremium: Number(slab.maxPremium),
            brokerRate: Number(slab.brokerRate),
            pospShareRate: Number(slab.pospShareRate),
            effectiveFrom: new Date(slab.effectiveFrom),
            effectiveTo: slab.effectiveTo ? new Date(slab.effectiveTo) : null,
            isActive: true,
          },
        });

        results.push(newSlab);
      }

      this.logger.log(`✓ Commission slabs configured for ${companyId}/${lob}`);
      return results;
    } catch (error) {
      this.logger.error(`Error configuring slabs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active commission slabs for company/LOB
   */
  async getSlabs(companyId: string, lob: string): Promise<any> {
    try {
      const slabs = await this.prisma.insuranceCommissionSlab.findMany({
        where: {
          companyId,
          lob,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
        },
        orderBy: { minPremium: 'asc' },
      });

      return slabs;
    } catch (error) {
      this.logger.error(`Error fetching slabs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate commission for policy
   * Applies slab-based calculation based on cumulative premium
   */
  async calculateCommission(
    policyId: string,
    commissionType: InsuranceCommissionType = InsuranceCommissionType.FIRST_YEAR,
  ): Promise<any> {
    try {
      // Get policy details
      const policy = await this.prisma.insurancePolicy.findUniqueOrThrow({
        where: { id: policyId },
        include: {
          company: true,
          posp: true,
        },
      });

      // Get applicable slabs
      const slabs = await this.getSlabs(policy.companyId, policy.lob);

      if (slabs.length === 0) {
        throw new BadRequestException(
          `No commission slabs configured for ${policy.company.companyName}/${policy.lob}`,
        );
      }

      const netPremium = new Decimal(policy.netPremium);
      const currentMonth = dayjs().month() + 1;
      const currentYear = dayjs().year();

      // Get POSP's cumulative premium for this company/LOB in current period
      const cumulativePremium = await this.prisma.insuranceCommission.aggregate({
        where: {
          pospId: policy.pospId,
          companyId: policy.companyId,
          periodMonth: currentMonth,
          periodYear: currentYear,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        _sum: { netPremium: true },
      });

      const cumPrem = new Decimal(cumulativePremium._sum.netPremium || 0).plus(netPremium);

      // Determine which slab applies
      let appliedSlab = slabs[0];
      for (const slab of slabs) {
        if (
          cumPrem.greaterThanOrEqualTo(slab.minPremium) &&
          cumPrem.lessThanOrEqualTo(slab.maxPremium)
        ) {
          appliedSlab = slab;
          break;
        }
      }

      // Calculate commissions
      const brokerRate = new Decimal(appliedSlab.brokerRate).dividedBy(100);
      const brokerCommissionAmt = netPremium.times(brokerRate);

      const pospShareRate = new Decimal(appliedSlab.pospShareRate).dividedBy(100);
      const pospCommissionAmt = brokerCommissionAmt.times(pospShareRate);

      const trustnerRetention = brokerCommissionAmt.minus(pospCommissionAmt);

      // Calculate TDS (10% for insurance if above threshold)
      let tdsAmount = new Decimal(0);
      if (pospCommissionAmt.greaterThan(5000)) {
        tdsAmount = pospCommissionAmt.times(0.1);
      }

      // Calculate GST
      const gstAmount = pospCommissionAmt.times(0.18);

      // Net payable to POSP
      const netPayable = pospCommissionAmt.minus(tdsAmount).minus(gstAmount);

      // Check if already exists
      const existing = await this.prisma.insuranceCommission.findFirst({
        where: {
          policyId,
          commissionType,
          periodMonth: currentMonth,
          periodYear: currentYear,
        },
      });

      if (existing) {
        // Update existing
        return await this.prisma.insuranceCommission.update({
          where: { id: existing.id },
          data: {
            netPremium: netPremium.toNumber(),
            brokerCommissionPct: appliedSlab.brokerRate,
            brokerCommissionAmt: brokerCommissionAmt.toNumber(),
            pospSharePct: appliedSlab.pospShareRate,
            pospCommissionAmt: pospCommissionAmt.toNumber(),
            trustnerRetention: trustnerRetention.toNumber(),
            tdsAmount: tdsAmount.toNumber(),
            gstAmount: gstAmount.toNumber(),
            netPayable: netPayable.toNumber(),
            slabApplied: appliedSlab.slabName,
            calculatedAt: new Date(),
          },
        });
      }

      // Create new commission entry
      const commission = await this.prisma.insuranceCommission.create({
        data: {
          policyId,
          pospId: policy.pospId,
          companyId: policy.companyId,
          commissionType,
          netPremium: netPremium.toNumber(),
          brokerCommissionPct: appliedSlab.brokerRate,
          brokerCommissionAmt: brokerCommissionAmt.toNumber(),
          pospSharePct: appliedSlab.pospShareRate,
          pospCommissionAmt: pospCommissionAmt.toNumber(),
          trustnerRetention: trustnerRetention.toNumber(),
          tdsAmount: tdsAmount.toNumber(),
          gstAmount: gstAmount.toNumber(),
          netPayable: netPayable.toNumber(),
          slabApplied: appliedSlab.slabName,
          periodMonth: currentMonth,
          periodYear: currentYear,
          status: 'PENDING',
          calculatedAt: new Date(),
        },
      });

      this.logger.log(
        `✓ Commission calculated: Policy ${policy.internalRefCode} - POSP ${policy.posp.agentCode}`,
      );

      return commission;
    } catch (error) {
      this.logger.error(`Error calculating commission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch calculate all pending commissions for a month
   */
  async batchCalculate(month: number, year: number): Promise<any> {
    try {
      // Get all policies issued in the month
      const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).toDate();
      const monthEnd = dayjs(monthStart).endOf('month').toDate();

      const policies = await this.prisma.insurancePolicy.findMany({
        where: {
          status: 'POLICY_ACTIVE',
          issuanceDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const results = [];
      for (const policy of policies) {
        try {
          const commission = await this.calculateCommission(
            policy.id,
            InsuranceCommissionType.FIRST_YEAR,
          );
          results.push(commission);
        } catch (error) {
          this.logger.warn(`Failed to calculate commission for policy ${policy.id}: ${error.message}`);
        }
      }

      this.logger.log(`✓ Batch calculated commissions: ${results.length} entries`);
      return { calculated: results.length, details: results };
    } catch (error) {
      this.logger.error(`Error in batch calculation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reconcile with insurer - match receivables
   */
  async reconcileWithInsurer(
    companyId: string,
    month: number,
    year: number,
    receivedAmount: number,
  ): Promise<any> {
    try {
      // Get all commissions for this company/month
      const commissions = await this.prisma.insuranceCommission.findMany({
        where: {
          companyId,
          periodMonth: month,
          periodYear: year,
          status: 'PENDING',
        },
      });

      const totalExpected = commissions.reduce((sum, c) => sum + Number(c.brokerCommissionAmt), 0);

      // Mark as reconciled
      await this.prisma.insuranceCommission.updateMany({
        where: {
          companyId,
          periodMonth: month,
          periodYear: year,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          reconciled: true,
          receivedFromInsurer: true,
          receivedAmount: new Decimal(receivedAmount).dividedBy(commissions.length).toNumber(),
          receivedDate: new Date(),
        },
      });

      this.logger.log(
        `✓ Reconciled: ${companyId} for ${month}/${year} - Received: ${receivedAmount}`,
      );

      return {
        company: companyId,
        month,
        year,
        commissionCount: commissions.length,
        expectedAmount: totalExpected,
        receivedAmount,
        difference: new Decimal(receivedAmount).minus(totalExpected).toNumber(),
      };
    } catch (error) {
      this.logger.error(`Error in reconciliation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process clawback (deduction from commission)
   */
  async processClawback(policyId: string, reason: string, amount: number): Promise<any> {
    try {
      const clawbackCode = `CLAW-${dayjs().format('YYYYMMDD')}-${Date.now()}`;

      // Create clawback commission entry
      const clawback = await this.prisma.insuranceCommission.create({
        data: {
          policyId,
          pospId: (await this.prisma.insurancePolicy.findUniqueOrThrow({ where: { id: policyId } }))
            .pospId,
          commissionType: InsuranceCommissionType.CLAWBACK,
          netPremium: 0,
          brokerCommissionPct: 0,
          brokerCommissionAmt: 0,
          pospSharePct: 0,
          pospCommissionAmt: Number(amount) * -1,
          trustnerRetention: 0,
          tdsAmount: 0,
          gstAmount: 0,
          netPayable: Number(amount) * -1,
          status: 'APPROVED',
          isClawback: true,
          clawbackRefId: clawbackCode,
          remarks: reason,
          periodMonth: dayjs().month() + 1,
          periodYear: dayjs().year(),
          calculatedAt: new Date(),
        },
      });

      this.logger.log(`✓ Clawback processed: ${clawbackCode}`);
      return clawback;
    } catch (error) {
      this.logger.error(`Error processing clawback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate payouts for POSP
   */
  async generatePayouts(month: number, year: number): Promise<any> {
    try {
      // Get all POSPs with approved commissions
      const pospList = await this.prisma.pOSPAgent.findMany({
        where: {
          commissions: {
            some: {
              periodMonth: month,
              periodYear: year,
              status: 'APPROVED',
            },
          },
        },
      });

      const results = [];

      for (const posp of pospList) {
        // Check if payout already exists
        const existing = await this.prisma.insurancePayout.findFirst({
          where: {
            pospId: posp.id,
            periodMonth: month,
            periodYear: year,
          },
        });

        if (existing) continue;

        // Get all commissions for this POSP
        const commissions = await this.prisma.insuranceCommission.findMany({
          where: {
            pospId: posp.id,
            periodMonth: month,
            periodYear: year,
            status: 'APPROVED',
          },
        });

        const grossAmount = commissions.reduce((sum, c) => sum + Number(c.pospCommissionAmt), 0);
        const tdsAmount = commissions.reduce((sum, c) => sum + Number(c.tdsAmount), 0);
        const gstAmount = commissions.reduce((sum, c) => sum + Number(c.gstAmount), 0);
        const clawbackAmount = commissions
          .filter((c) => c.isClawback)
          .reduce((sum, c) => sum + Math.abs(Number(c.pospCommissionAmt)), 0);

        const netPayable = new Decimal(grossAmount).minus(tdsAmount).minus(gstAmount).minus(clawbackAmount);

        const payoutCode = `IPAY-${dayjs().format('YYYYMM')}-${(await this.prisma.insurancePayout.count({
          where: {
            periodMonth: month,
            periodYear: year,
          },
        })) + 1}`;

        const payout = await this.prisma.insurancePayout.create({
          data: {
            pospId: posp.id,
            payoutCode,
            periodMonth: month,
            periodYear: year,
            grossAmount,
            tdsAmount,
            gstAmount,
            clawbackAmount,
            netPayable: netPayable.toNumber(),
            status: 'PENDING',
          },
        });

        // Link commissions to payout
        for (const commission of commissions) {
          await this.prisma.insurancePayoutItem.create({
            data: {
              payoutId: payout.id,
              commissionId: commission.id,
            },
          });
        }

        results.push(payout);
      }

      this.logger.log(`✓ Payouts generated: ${results.length} payouts for ${month}/${year}`);
      return results;
    } catch (error) {
      this.logger.error(`Error generating payouts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve payout
   */
  async approvePayout(id: string, approvedBy: string): Promise<any> {
    try {
      const payout = await this.prisma.insurancePayout.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      this.logger.log(`✓ Payout approved: ${payout.payoutCode}`);
      return payout;
    } catch (error) {
      this.logger.error(`Error approving payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark payout as paid
   */
  async markPaid(id: string, bankRef: string): Promise<any> {
    try {
      const payout = await this.prisma.insurancePayout.update({
        where: { id },
        data: {
          status: 'PAID',
          bankRefNumber: bankRef,
          paidAt: new Date(),
        },
      });

      this.logger.log(`✓ Payout marked paid: ${payout.payoutCode}`);
      return payout;
    } catch (error) {
      this.logger.error(`Error marking payout as paid: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get commission statement for POSP
   */
  async getCommissionStatement(pospId: string, month: number, year: number): Promise<any> {
    try {
      const commissions = await this.prisma.insuranceCommission.findMany({
        where: {
          pospId,
          periodMonth: month,
          periodYear: year,
        },
        include: {
          policy: {
            select: {
              policyNumber: true,
              customerName: true,
              netPremium: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCommission = commissions.reduce((sum, c) => sum + Number(c.pospCommissionAmt), 0);
      const totalTDS = commissions.reduce((sum, c) => sum + Number(c.tdsAmount), 0);
      const totalGST = commissions.reduce((sum, c) => sum + Number(c.gstAmount), 0);
      const netPayable = totalCommission - totalTDS - totalGST;

      return {
        pospId,
        period: `${month}/${year}`,
        statements: commissions,
        summary: {
          count: commissions.length,
          totalCommission,
          totalTDS,
          totalGST,
          netPayable,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching commission statement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get receivables report
   */
  async getReceivablesReport(month: number, year: number): Promise<any> {
    try {
      const commissions = await this.prisma.insuranceCommission.groupBy({
        by: ['companyId'],
        where: {
          periodMonth: month,
          periodYear: year,
          status: 'APPROVED',
        },
        _sum: {
          brokerCommissionAmt: true,
        },
      });

      const details = [];
      for (const item of commissions) {
        const company = await this.prisma.insuranceCompany.findUnique({
          where: { id: item.companyId || '' },
        });
        details.push({
          company: company?.companyName,
          amount: item._sum.brokerCommissionAmt || 0,
        });
      }

      const totalReceivable = details.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        period: `${month}/${year}`,
        receivables: details,
        totalReceivable,
      };
    } catch (error) {
      this.logger.error(`Error fetching receivables report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payables report
   */
  async getPayablesReport(month: number, year: number): Promise<any> {
    try {
      const payouts = await this.prisma.insurancePayout.findMany({
        where: {
          periodMonth: month,
          periodYear: year,
        },
        include: {
          posp: { select: { agentCode: true, firstName: true, lastName: true } },
        },
      });

      const totalPayable = payouts.reduce((sum, p) => sum + Number(p.netPayable), 0);

      return {
        period: `${month}/${year}`,
        payables: payouts,
        totalPayable,
      };
    } catch (error) {
      this.logger.error(`Error fetching payables report: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // PAYOUT MODEL CONFIGURATION
  // ============================================================================

  /**
   * Get payout config for a specific POSP
   */
  async getPayoutConfig(pospId: string) {
    const config = await this.prisma.pOSPPayoutConfig.findUnique({
      where: { pospId },
      include: { posp: { select: { agentCode: true, firstName: true, lastName: true } } },
    });
    return config || { pospId, payoutModel: 'SLAB_BASED', flatRatePct: null, isActive: false };
  }

  /**
   * Set or update payout configuration for a POSP
   */
  async setPayoutConfig(
    pospId: string,
    data: { payoutModel: string; flatRatePct?: number; remarks?: string; effectiveFrom?: string; effectiveTo?: string },
    assignedBy: string,
  ) {
    return this.prisma.pOSPPayoutConfig.upsert({
      where: { pospId },
      update: {
        payoutModel: data.payoutModel,
        flatRatePct: data.flatRatePct ?? null,
        remarks: data.remarks || null,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        assignedBy,
        isActive: true,
      },
      create: {
        pospId,
        payoutModel: data.payoutModel,
        flatRatePct: data.flatRatePct ?? null,
        remarks: data.remarks || null,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        assignedBy,
        isActive: true,
      },
      include: { posp: { select: { agentCode: true, firstName: true, lastName: true } } },
    });
  }

  /**
   * List all payout configs with POSP details
   */
  async listPayoutConfigs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.pOSPPayoutConfig.findMany({
        where: { isActive: true },
        include: { posp: { select: { agentCode: true, firstName: true, lastName: true, category: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pOSPPayoutConfig.count({ where: { isActive: true } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
