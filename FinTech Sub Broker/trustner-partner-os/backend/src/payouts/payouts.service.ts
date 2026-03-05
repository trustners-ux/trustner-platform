import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payouts Service
 * Manages payout generation, approval, payment processing, and statements
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger('PayoutsService');
  private readonly TDS_RATE = 5; // 5%
  private readonly GST_RATE = 18; // 18%

  constructor(private prismaService: PrismaService) {}

  /**
   * Generate payout from commissions
   * Aggregates commissions, calculates TDS/GST, generates unique code
   */
  async generate(createDto: CreatePayoutDto, userId: string) {
    const { subBrokerId, periodMonth, periodYear, commissionIds } = createDto;

    // Check if payout already exists for this period
    const existingPayout = await this.prismaService.payout.findUnique({
      where: {
        subBrokerId_periodMonth_periodYear: {
          subBrokerId,
          periodMonth,
          periodYear,
        },
      },
    });

    if (existingPayout) {
      throw new BadRequestException(
        `Payout already exists for ${subBrokerId} in ${periodYear}-${String(periodMonth).padStart(2, '0')}`,
      );
    }

    // Fetch commissions for the period
    const where: any = {
      subBrokerId,
      periodMonth,
      periodYear,
      status: { in: ['PENDING', 'CALCULATED', 'APPROVED'] },
    };

    if (commissionIds && commissionIds.length > 0) {
      where.id = { in: commissionIds };
    }

    const commissions = await this.prismaService.commission.findMany({
      where,
    });

    if (commissions.length === 0) {
      throw new BadRequestException('No commissions found for this period');
    }

    // Aggregate totals
    const grossAmount = commissions.reduce(
      (sum, c) => sum + (c.netAmount || 0),
      0,
    );
    const tdsAmount = new Decimal(grossAmount)
      .times(this.TDS_RATE)
      .dividedBy(100)
      .toNumber();
    const gstAmount = new Decimal(grossAmount)
      .times(this.GST_RATE)
      .dividedBy(100)
      .toNumber();
    const netPayable = new Decimal(grossAmount)
      .minus(tdsAmount)
      .minus(gstAmount)
      .toNumber();

    // Generate unique payout code: PAY-YYYYMM-001
    const payoutCode = await this.generatePayoutCode(periodYear, periodMonth);

    const payout = await this.prismaService.payout.create({
      data: {
        subBrokerId,
        payoutCode,
        periodMonth,
        periodYear,
        grossAmount: new Decimal(grossAmount),
        tdsAmount: new Decimal(tdsAmount),
        gstAmount: new Decimal(gstAmount),
        netPayable: new Decimal(netPayable),
        clawbackAmount: new Decimal(0),
        finalAmount: new Decimal(netPayable),
        status: 'PENDING',
        items: {
          create: commissions.map((c) => ({
            commissionId: c.id,
          })),
        },
      },
      include: { items: { include: { commission: true } } },
    });

    this.logger.log(
      `Payout generated: ${payoutCode} for ${subBrokerId}, Amount: ${netPayable}`,
    );

    return payout;
  }

  /**
   * Get all payouts with pagination and filters
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      subBrokerId?: string;
      status?: string;
      month?: number;
      year?: number;
    },
  ) {
    const where: any = {};

    if (filters?.subBrokerId) where.subBrokerId = filters.subBrokerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.month) where.periodMonth = filters.month;
    if (filters?.year) where.periodYear = filters.year;

    const [data, total] = await Promise.all([
      this.prismaService.payout.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          subBroker: { select: { id: true, code: true, name: true } },
          items: { include: { commission: true } },
        },
      }),
      this.prismaService.payout.count({ where }),
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

  /**
   * Get single payout details
   */
  async findOne(id: string) {
    const payout = await this.prismaService.payout.findUnique({
      where: { id },
      include: {
        subBroker: true,
        items: {
          include: {
            commission: {
              include: {
                subBroker: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }

    return payout;
  }

  /**
   * Approve payout for payment
   */
  async approve(id: string, userId: string) {
    const payout = await this.findOne(id);

    if (payout.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PENDING payouts can be approved. Current status: ${payout.status}`,
      );
    }

    const updated = await this.prismaService.payout.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: { subBroker: true, items: { include: { commission: true } } },
    });

    this.logger.log(`Payout approved: ${updated.payoutCode}`);

    return updated;
  }

  /**
   * Mark payout as paid with bank reference
   */
  async markPaid(id: string, bankRefNumber: string, userId: string) {
    const payout = await this.findOne(id);

    if (payout.status !== 'PROCESSING' && payout.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PROCESSING/PENDING payouts can be marked as paid`,
      );
    }

    const updated = await this.prismaService.payout.update({
      where: { id },
      data: {
        status: 'PAID',
        bankRefNumber,
        paidAt: new Date(),
      },
      include: { subBroker: true },
    });

    this.logger.log(`Payout marked as paid: ${updated.payoutCode}`);

    return updated;
  }

  /**
   * Put payout on hold with reason
   */
  async putOnHold(id: string, reason: string, userId: string) {
    const payout = await this.findOne(id);

    if (payout.status === 'PAID') {
      throw new BadRequestException('Cannot put a PAID payout on hold');
    }

    const updated = await this.prismaService.payout.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        remarks: reason,
      },
      include: { subBroker: true },
    });

    this.logger.log(`Payout put on hold: ${updated.payoutCode}`);

    return updated;
  }

  /**
   * Get payouts for a specific sub-broker
   */
  async getSubBrokerPayouts(subBrokerId: string, pagination: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prismaService.payout.findMany({
        where: { subBrokerId },
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { commission: true } },
        },
      }),
      this.prismaService.payout.count({ where: { subBrokerId } }),
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

  /**
   * Get payout summary statistics
   */
  async getPayoutSummary(month?: number, year?: number) {
    const where: any = {};
    if (month) where.periodMonth = month;
    if (year) where.periodYear = year;

    const payouts = await this.prismaService.payout.findMany({
      where,
      include: { subBroker: true },
    });

    const summary = payouts.reduce(
      (acc, p) => ({
        totalPayouts: acc.totalPayouts + 1,
        totalAmount: acc.totalAmount + (p.finalAmount?.toNumber() || 0),
        paidAmount:
          acc.paidAmount +
          (p.status === 'PAID' ? p.finalAmount?.toNumber() || 0 : 0),
        pendingAmount:
          acc.pendingAmount +
          (p.status === 'PENDING' ? p.finalAmount?.toNumber() || 0 : 0),
        onHoldAmount:
          acc.onHoldAmount +
          (p.status === 'ON_HOLD' ? p.finalAmount?.toNumber() || 0 : 0),
        payoutsByStatus: {
          ...acc.payoutsByStatus,
          [p.status]: (acc.payoutsByStatus[p.status] || 0) + 1,
        },
      }),
      {
        totalPayouts: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        onHoldAmount: 0,
        payoutsByStatus: {},
      },
    );

    return {
      period: month && year ? `${year}-${String(month).padStart(2, '0')}` : 'All',
      ...summary,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate unique payout code: PAY-YYYYMM-001
   */
  private async generatePayoutCode(year: number, month: number): Promise<string> {
    const prefix = `PAY-${year}${String(month).padStart(2, '0')}-`;
    const lastPayout = await this.prismaService.payout.findFirst({
      where: {
        payoutCode: { startsWith: prefix },
      },
      orderBy: { payoutCode: 'desc' },
    });

    let sequence = 1;
    if (lastPayout) {
      const lastSequence = parseInt(lastPayout.payoutCode.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }
}
