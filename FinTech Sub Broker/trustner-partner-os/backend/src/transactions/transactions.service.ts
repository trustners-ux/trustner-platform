import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionType,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transactions Service
 * Manages investment transactions: LUMPSUM, SIP, STP, SWP, REDEMPTION, SWITCH
 * Handles transaction lifecycle and status updates
 */
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger('TransactionsService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Create new transaction
   * Generates unique code: TXN-YYYYMMDD-XXXXX
   * Initial status: INITIATED
   */
  async create(createDto: CreateTransactionDto, userId: string) {
    // Verify client exists and user has access
    const client = await this.prismaService.client.findUnique({
      where: { id: createDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(
        `Client with ID ${createDto.clientId} not found`,
      );
    }

    // Verify scheme exists
    const scheme = await this.prismaService.mutualFundScheme.findUnique({
      where: { id: createDto.schemeId },
    });

    if (!scheme || !scheme.isActive) {
      throw new BadRequestException(
        `Scheme with ID ${createDto.schemeId} not found or inactive`,
      );
    }

    // Validate switch/STP scheme if applicable
    if (createDto.type === TransactionType.SWITCH && createDto.switchToSchemeId) {
      const switchScheme = await this.prismaService.mutualFundScheme.findUnique({
        where: { id: createDto.switchToSchemeId },
      });
      if (!switchScheme || !switchScheme.isActive) {
        throw new BadRequestException('Invalid switch-to scheme');
      }
    }

    if (createDto.type === TransactionType.STP && createDto.stpToSchemeId) {
      const stpScheme = await this.prismaService.mutualFundScheme.findUnique({
        where: { id: createDto.stpToSchemeId },
      });
      if (!stpScheme || !stpScheme.isActive) {
        throw new BadRequestException('Invalid STP scheme');
      }
    }

    // Generate unique transaction code
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = uuidv4().split('-')[0].toUpperCase();
    const transactionCode = `TXN-${dateStr}-${randomStr}`;

    try {
      const transaction = await this.prismaService.transaction.create({
        data: {
          transactionCode,
          clientId: createDto.clientId,
          subBrokerId: client.subBrokerId,
          schemeId: createDto.schemeId,
          type: createDto.type,
          amount: new Prisma.Decimal(createDto.amount),
          folioNumber: createDto.folioNumber || null,
          paymentMode: createDto.paymentMode || null,
          switchToSchemeId: createDto.switchToSchemeId || null,
          stpToSchemeId: createDto.stpToSchemeId || null,
          status: TransactionStatus.INITIATED,
        },
        include: {
          client: { select: { id: true, user: { select: { email: true } } } },
          scheme: { select: { schemeName: true } },
        },
      });

      this.logger.log(
        `Transaction created: ${transaction.transactionCode} for client ${createDto.clientId}`,
      );

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      throw new BadRequestException('Failed to create transaction');
    }
  }

  /**
   * Get all transactions with filters and pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      clientId?: string;
      subBrokerId?: string;
      type?: TransactionType;
      status?: TransactionStatus;
      dateRange?: { from: Date; to: Date };
    },
  ) {
    const where: Prisma.TransactionWhereInput = {};

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.subBrokerId) {
      where.subBrokerId = filters.subBrokerId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.transaction.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          client: { select: { id: true, user: { select: { email: true } } } },
          scheme: { select: { schemeName: true, amcName: true } },
        },
      }),
      this.prismaService.transaction.count({ where }),
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
   * Get single transaction
   */
  async findOne(id: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, user: { select: { email: true, name: true } } } },
        scheme: { select: { schemeName: true, amcName: true, latestNav: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: TransactionStatus,
    details?: {
      bseOrderId?: string;
      allotmentNav?: string;
      allotmentUnits?: string;
      remarks?: string;
      failureReason?: string;
    },
  ) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Validate status transitions
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.INITIATED]: [
        TransactionStatus.PAYMENT_PENDING,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAYMENT_PENDING]: [
        TransactionStatus.PAYMENT_RECEIVED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAYMENT_RECEIVED]: [
        TransactionStatus.SUBMITTED_TO_BSE,
        TransactionStatus.FAILED,
      ],
      [TransactionStatus.SUBMITTED_TO_BSE]: [
        TransactionStatus.BSE_ACCEPTED,
        TransactionStatus.BSE_REJECTED,
      ],
      [TransactionStatus.BSE_ACCEPTED]: [
        TransactionStatus.ALLOTMENT_DONE,
        TransactionStatus.FAILED,
      ],
      [TransactionStatus.BSE_REJECTED]: [TransactionStatus.FAILED],
      [TransactionStatus.ALLOTMENT_DONE]: [TransactionStatus.FAILED],
      [TransactionStatus.FAILED]: [],
      [TransactionStatus.CANCELLED]: [],
    };

    if (
      !validTransitions[transaction.status]?.includes(status)
    ) {
      throw new BadRequestException(
        `Invalid status transition from ${transaction.status} to ${status}`,
      );
    }

    const updatedData: Prisma.TransactionUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    if (details?.bseOrderId) {
      updatedData.bseOrderId = details.bseOrderId;
    }
    if (details?.allotmentNav) {
      updatedData.allotmentNav = new Prisma.Decimal(details.allotmentNav);
    }
    if (details?.allotmentUnits) {
      updatedData.allotmentUnits = new Prisma.Decimal(details.allotmentUnits);
    }
    if (details?.remarks) {
      updatedData.remarks = details.remarks;
    }
    if (details?.failureReason) {
      updatedData.failureReason = details.failureReason;
    }

    if (status === TransactionStatus.ALLOTMENT_DONE) {
      updatedData.allotmentDate = new Date();
      updatedData.completedAt = new Date();
    } else if (
      [TransactionStatus.FAILED, TransactionStatus.CANCELLED].includes(status)
    ) {
      updatedData.completedAt = new Date();
    }

    const updated = await this.prismaService.transaction.update({
      where: { id },
      data: updatedData,
    });

    this.logger.log(
      `Transaction ${updated.transactionCode} status updated to ${status}`,
    );

    return updated;
  }

  /**
   * Get client transactions with pagination
   */
  async getClientTransactions(clientId: string, pagination: PaginationDto) {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const [transactions, total] = await Promise.all([
      this.prismaService.transaction.findMany({
        where: { clientId },
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          scheme: { select: { schemeName: true, amcName: true } },
        },
      }),
      this.prismaService.transaction.count({ where: { clientId } }),
    ]);

    return {
      data: transactions,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Cancel transaction
   */
  async cancel(id: string, userId: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (
      ![
        TransactionStatus.INITIATED,
        TransactionStatus.PAYMENT_PENDING,
        TransactionStatus.PAYMENT_RECEIVED,
      ].includes(transaction.status)
    ) {
      throw new BadRequestException(
        `Cannot cancel transaction with status ${transaction.status}`,
      );
    }

    const updated = await this.prismaService.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.CANCELLED,
        completedAt: new Date(),
        remarks: `Cancelled by user ${userId}`,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Transaction ${updated.transactionCode} cancelled by ${userId}`);

    return updated;
  }

  /**
   * Get transaction summary for sub-broker
   */
  async getTransactionSummary(subBrokerId?: string) {
    const where: Prisma.TransactionWhereInput = subBrokerId
      ? { subBrokerId }
      : {};

    const transactions = await this.prismaService.transaction.findMany({
      where,
      select: {
        type: true,
        status: true,
        amount: true,
        allotmentUnits: true,
      },
    });

    const summary = {
      total: transactions.length,
      totalAmount: transactions.reduce(
        (sum, t) => sum + t.amount.toNumber(),
        0,
      ),
      byType: {} as Record<TransactionType, number>,
      byStatus: {} as Record<TransactionStatus, number>,
      totalUnitsAllotted: transactions
        .filter((t) => t.allotmentUnits)
        .reduce((sum, t) => sum + (t.allotmentUnits?.toNumber() || 0), 0),
    };

    transactions.forEach((t) => {
      summary.byType[t.type] = (summary.byType[t.type] || 0) + 1;
      summary.byStatus[t.status] = (summary.byStatus[t.status] || 0) + 1;
    });

    return summary;
  }
}
