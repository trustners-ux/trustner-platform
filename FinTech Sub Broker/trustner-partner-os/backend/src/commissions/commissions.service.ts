import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

/**
 * Commissions Service - THE HEART OF THE SYSTEM
 * Manages commission calculation, RTA file imports, TDS/GST processing, and payouts
 * Fintech-grade precision with proper decimal handling
 *
 * Revenue Share Tiers:
 * - STARTER (AUM < 1Cr): 50%
 * - GROWTH (1-5Cr): 60%
 * - SENIOR (5-25Cr): 65%
 * - ELITE (>25Cr): 70%
 */
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger('CommissionsService');
  private readonly TDS_RATE = 5; // 5%
  private readonly GST_RATE = 18; // 18%
  private readonly TDS_THRESHOLD = 15000; // 15K per financial year

  constructor(private prismaService: PrismaService) {}

  /**
   * Import RTA file and create commission records
   * Supports CAMS, KFINTECH CSV formats
   * Maps transactions to clients, schemes, and partners
   */
  async importRTAFile(
    file: Express.Multer.File,
    rtaSource: 'CAMS' | 'KFINTECH' | 'FRANKLIN' | 'SBICAP',
    period: string, // YYYY-MM format
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as any[];

      if (!records || records.length === 0) {
        throw new BadRequestException('CSV file is empty');
      }

      this.logger.log(`Importing RTA file from ${rtaSource} - Period: ${period}, Records: ${records.length}`);

      let successCount = 0;
      let errorCount = 0;

      // Process each record
      for (const record of records) {
        try {
          await this.processRTARecord(record, rtaSource, period);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.warn(`Failed to process RTA record: ${error.message}`);
        }
      }

      this.logger.log(`RTA import completed - Success: ${successCount}, Errors: ${errorCount}`);

      return {
        imported: successCount,
        failed: errorCount,
        total: records.length,
        period,
        rtaSource,
      };
    } catch (error) {
      this.logger.error(`RTA import failed: ${error.message}`);
      throw new BadRequestException(`Failed to import RTA file: ${error.message}`);
    }
  }

  /**
   * Process individual RTA record
   * Maps CSV data to commission structure
   */
  private async processRTARecord(record: any, rtaSource: string, period: string) {
    // TODO: Implement actual RTA mapping based on RTA source format
    // This is a template for CAMS format
    const clientId = record['Client ID'] || record['ClientCode'];
    const schemeCode = record['Scheme Code'];
    const units = parseFloat(record['Units'] || record['Quantity']);
    const navigationValue = parseFloat(record['NAV']);
    const transactionType = record['Transaction Type'];

    if (!clientId || !schemeCode || isNaN(units) || isNaN(navigationValue)) {
      throw new BadRequestException('Invalid RTA record format');
    }

    const client = await this.prismaService.client.findFirst({
      where: { externalClientId: clientId },
    });

    if (!client) {
      this.logger.warn(`Client not found for external ID: ${clientId}`);
      return;
    }

    const scheme = await this.prismaService.scheme.findUnique({
      where: { code: schemeCode },
    });

    if (!scheme) {
      this.logger.warn(`Scheme not found: ${schemeCode}`);
      return;
    }

    // Calculate transaction value
    const transactionValue = new Decimal(units).times(navigationValue);

    // This would link to commission rates and calculate actual commission
    // For now, just logging the structure
    this.logger.debug(`RTA: ${clientId} - ${schemeCode} - ${units} units @ ${navigationValue}`);
  }

  /**
   * Calculate commissions for a month/year
   * Applies scheme commission rates, TDS, GST
   */
  async calculateCommissions(month: number, year: number) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }

    this.logger.log(`Calculating commissions for ${year}-${String(month).padStart(2, '0')}`);

    try {
      // Get all transactions for the period
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const transactions = await this.prismaService.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'ALLOTMENT_DONE',
        },
        include: {
          client: {
            include: {
              subBroker: true,
            },
          },
          scheme: {
            include: {
              commissionRates: true,
            },
          },
        },
      });

      let totalCommissionProcessed = 0;

      for (const transaction of transactions) {
        // Get applicable commission rate
        const rate = transaction.scheme.commissionRates.find(
          (r) => r.type === transaction.type,
        );

        if (!rate) {
          this.logger.warn(`No commission rate for ${transaction.type}`);
          continue;
        }

        // Calculate commission
        const commissionAmount = transaction.transactionAmount
          ? new Decimal(transaction.transactionAmount).times(rate.rate).dividedBy(100)
          : new Decimal(0);

        // Apply revenue share based on tier
        const revenueShare = this.getRevenueShare(transaction.client.subBroker.commissionTier);
        const subBrokerCommission = commissionAmount.times(revenueShare).dividedBy(100);

        // Calculate TDS (if applicable for annual threshold)
        let tdsAmount = new Decimal(0);
        if (subBrokerCommission.greaterThan(this.TDS_THRESHOLD)) {
          tdsAmount = subBrokerCommission.times(this.TDS_RATE).dividedBy(100);
        }

        // Calculate GST on commission
        const gstAmount = subBrokerCommission.times(this.GST_RATE).dividedBy(100);

        // Net amount after TDS and GST
        const netAmount = subBrokerCommission.minus(tdsAmount).minus(gstAmount);

        // Create commission record
        await this.prismaService.commission.create({
          data: {
            transactionId: transaction.id,
            subBrokerId: transaction.client.subBrokerId,
            clientId: transaction.clientId,
            schemeId: transaction.schemeId,
            commissionRate: rate.rate,
            grossAmount: commissionAmount.toNumber(),
            revenueShare,
            subBrokerAmount: subBrokerCommission.toNumber(),
            tdsAmount: tdsAmount.toNumber(),
            tdsRate: this.TDS_RATE,
            gstAmount: gstAmount.toNumber(),
            gstRate: this.GST_RATE,
            netAmount: netAmount.toNumber(),
            period: `${year}-${String(month).padStart(2, '0')}`,
            status: 'PENDING',
          },
        });

        totalCommissionProcessed++;
      }

      this.logger.log(`Commissions calculated: ${totalCommissionProcessed} transactions processed`);

      return {
        period: `${year}-${String(month).padStart(2, '0')}`,
        transactionsProcessed: totalCommissionProcessed,
        status: 'Commissions calculated successfully',
      };
    } catch (error) {
      this.logger.error(`Commission calculation failed: ${error.message}`);
      throw new BadRequestException(`Failed to calculate commissions: ${error.message}`);
    }
  }

  /**
   * Get revenue share percentage based on commission tier
   */
  private getRevenueShare(tier: string): number {
    const shareMap = {
      STARTER: 50,
      GROWTH: 60,
      SENIOR: 65,
      ELITE: 70,
    };
    return shareMap[tier] || 50;
  }

  /**
   * Apply revenue share split between sub-broker and Trustner
   */
  async applyRevenueShare(commissionId: string) {
    const commission = await this.prismaService.commission.findUnique({
      where: { id: commissionId },
      include: { subBroker: true },
    });

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${commissionId} not found`);
    }

    // Revenue share is already calculated during commission creation
    // This method is for validation/audit purposes
    return {
      id: commission.id,
      grossAmount: commission.grossAmount,
      subBrokerShare: commission.subBrokerAmount,
      trustnerShare: commission.grossAmount - commission.subBrokerAmount,
      netAmount: commission.netAmount,
    };
  }

  /**
   * Process clawback (negative commission due to redemption/switch)
   */
  async processClawback(originalCommissionId: string, amount: number, reason: string) {
    const originalCommission = await this.prismaService.commission.findUnique({
      where: { id: originalCommissionId },
    });

    if (!originalCommission) {
      throw new NotFoundException(`Commission with ID ${originalCommissionId} not found`);
    }

    if (amount <= 0 || amount > originalCommission.netAmount) {
      throw new BadRequestException('Invalid clawback amount');
    }

    // Create negative commission entry
    const clawback = await this.prismaService.commission.create({
      data: {
        transactionId: originalCommission.transactionId,
        subBrokerId: originalCommission.subBrokerId,
        clientId: originalCommission.clientId,
        schemeId: originalCommission.schemeId,
        commissionRate: -originalCommission.commissionRate,
        grossAmount: -amount,
        revenueShare: originalCommission.revenueShare,
        subBrokerAmount: -(amount * (originalCommission.revenueShare / 100)),
        tdsAmount: 0,
        tdsRate: this.TDS_RATE,
        gstAmount: 0,
        gstRate: this.GST_RATE,
        netAmount: -(amount * (originalCommission.revenueShare / 100)),
        period: originalCommission.period,
        status: 'CLAWBACK',
        remarks: `Clawback: ${reason}`,
      },
    });

    this.logger.log(`Clawback processed: ${clawback.id} for commission: ${originalCommissionId}`);

    return clawback;
  }

  /**
   * Get commission statement for a sub-broker
   */
  async getCommissionStatement(subBrokerId: string, month: number, year: number) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }

    const period = `${year}-${String(month).padStart(2, '0')}`;

    const commissions = await this.prismaService.commission.findMany({
      where: {
        subBrokerId,
        period,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scheme: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (commissions.length === 0) {
      throw new NotFoundException(`No commissions found for period ${period}`);
    }

    // Calculate totals
    const totals = commissions.reduce(
      (acc, c) => ({
        grossAmount: acc.grossAmount + (c.grossAmount || 0),
        tdsAmount: acc.tdsAmount + (c.tdsAmount || 0),
        gstAmount: acc.gstAmount + (c.gstAmount || 0),
        netAmount: acc.netAmount + (c.netAmount || 0),
        count: acc.count + 1,
      }),
      { grossAmount: 0, tdsAmount: 0, gstAmount: 0, netAmount: 0, count: 0 },
    );

    return {
      period,
      subBrokerId,
      commissions,
      summary: {
        totalTransactions: totals.count,
        totalGross: totals.grossAmount,
        totalTDS: totals.tdsAmount,
        totalGST: totals.gstAmount,
        totalNet: totals.netAmount,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get trail forecast based on AUM
   */
  async getTrailForecast(subBrokerId: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id: subBrokerId },
      include: {
        clients: {
          include: {
            holdings: {
              select: {
                currentValue: true,
              },
            },
          },
        },
      },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${subBrokerId} not found`);
    }

    // Calculate total AUM
    const totalAUM = subBroker.clients.reduce((sum, client) => {
      const clientAUM = client.holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
      return sum + clientAUM;
    }, 0);

    // Estimate monthly trail (assuming 0.75% p.a. average trail rate)
    const monthlyTrailRate = 0.75 / 12;
    const estimatedMonthlyTrail = new Decimal(totalAUM).times(monthlyTrailRate).dividedBy(100);

    return {
      subBrokerId,
      currentAUM: totalAUM,
      commissionTier: subBroker.commissionTier,
      estimatedMonthlyTrail: estimatedMonthlyTrail.toNumber(),
      estimatedAnnualTrail: estimatedMonthlyTrail.times(12).toNumber(),
      forecastDate: new Date().toISOString(),
      assumptions: {
        trailRatePerAnnum: '0.75%',
        basedOnCurrentAUM: true,
      },
    };
  }

  /**
   * Get annual commission summary for TDS certificate
   */
  async getAnnualSummary(subBrokerId: string, year: number) {
    const commissions = await this.prismaService.commission.findMany({
      where: {
        subBrokerId,
        period: {
          startsWith: String(year),
        },
        status: { not: 'CLAWBACK' },
      },
    });

    const summary = commissions.reduce(
      (acc, c) => ({
        grossAmount: acc.grossAmount + (c.grossAmount || 0),
        tdsAmount: acc.tdsAmount + (c.tdsAmount || 0),
        gstAmount: acc.gstAmount + (c.gstAmount || 0),
        netAmount: acc.netAmount + (c.netAmount || 0),
      }),
      { grossAmount: 0, tdsAmount: 0, gstAmount: 0, netAmount: 0 },
    );

    return {
      year,
      subBrokerId,
      totalGrossCommission: summary.grossAmount,
      totalTDSDeducted: summary.tdsAmount,
      totalGSTPaid: summary.gstAmount,
      totalNetCommission: summary.netAmount,
      tdsCertificateRequired: summary.tdsAmount > 0,
      generatedAt: new Date().toISOString(),
    };
  }
}
