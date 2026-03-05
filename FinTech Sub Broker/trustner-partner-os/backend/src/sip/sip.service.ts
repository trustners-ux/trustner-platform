import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, SIPStatus, SIPFrequency, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSIPDto } from './dto/create-sip.dto';
import { UpdateSIPDto } from './dto/update-sip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * SIP Service
 * Manages Systematic Investment Plans and installments
 * Handles SIP lifecycle: creation, pause, resume, cancellation
 */
@Injectable()
export class SIPService {
  private readonly logger = new Logger('SIPService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Create new SIP registration
   * Generates unique code: SIP-YYYYMMDD-XXXXX
   * Creates initial installments based on frequency
   */
  async create(createDto: CreateSIPDto, subBrokerId: string) {
    // Verify client and sub-broker relationship
    const client = await this.prismaService.client.findUnique({
      where: { id: createDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(
        `Client with ID ${createDto.clientId} not found`,
      );
    }

    if (client.subBrokerId !== subBrokerId) {
      throw new BadRequestException(
        'Client does not belong to this sub-broker',
      );
    }

    // Verify scheme exists and SIP is allowed
    const scheme = await this.prismaService.mutualFundScheme.findUnique({
      where: { id: createDto.schemeId },
    });

    if (!scheme || !scheme.isActive || !scheme.sipAllowed) {
      throw new BadRequestException(
        'Scheme not found, inactive, or SIP not allowed',
      );
    }

    // Generate SIP code
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = uuidv4().split('-')[0].toUpperCase();
    const sipCode = `SIP-${dateStr}-${randomStr}`;

    // Parse dates
    const startDate = new Date(createDto.startDate);
    const endDate = createDto.endDate ? new Date(createDto.endDate) : null;

    if (startDate < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Calculate next due date
    const nextDueDate = this.calculateNextDueDate(
      startDate,
      createDto.sipDate,
      createDto.frequency,
    );

    try {
      const sip = await this.prismaService.sIPRegistration.create({
        data: {
          sipCode,
          clientId: createDto.clientId,
          subBrokerId,
          schemeId: createDto.schemeId,
          amount: new Prisma.Decimal(createDto.amount),
          frequency: createDto.frequency,
          sipDate: createDto.sipDate,
          startDate,
          endDate,
          totalInstallments: createDto.totalInstallments || null,
          status: SIPStatus.ACTIVE,
          nextDueDate,
        },
        include: {
          client: { select: { user: { select: { email: true } } } },
          scheme: { select: { schemeName: true, amcName: true } },
        },
      });

      this.logger.log(
        `SIP created: ${sip.sipCode} for client ${createDto.clientId}`,
      );

      return sip;
    } catch (error) {
      this.logger.error(`Failed to create SIP: ${error.message}`);
      throw new BadRequestException('Failed to create SIP');
    }
  }

  /**
   * Get all SIPs with filters and pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      clientId?: string;
      subBrokerId?: string;
      status?: SIPStatus;
      frequency?: SIPFrequency;
    },
  ) {
    const where: Prisma.SIPRegistrationWhereInput = {};

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.subBrokerId) where.subBrokerId = filters.subBrokerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.frequency) where.frequency = filters.frequency;

    const [data, total] = await Promise.all([
      this.prismaService.sIPRegistration.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          client: { select: { user: { select: { email: true } } } },
          scheme: { select: { schemeName: true, amcName: true } },
        },
      }),
      this.prismaService.sIPRegistration.count({ where }),
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
   * Get single SIP with installments
   */
  async findOne(id: string) {
    const sip = await this.prismaService.sIPRegistration.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, user: { select: { email: true } } } },
        scheme: { select: { schemeName: true, amcName: true, latestNav: true } },
        installments: {
          orderBy: { installmentNo: 'asc' },
          take: 20,
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    return sip;
  }

  /**
   * Pause SIP
   */
  async pause(id: string, userId: string) {
    const sip = await this.prismaService.sIPRegistration.findUnique({
      where: { id },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.status !== SIPStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot pause SIP with status ${sip.status}`,
      );
    }

    const updated = await this.prismaService.sIPRegistration.update({
      where: { id },
      data: {
        status: SIPStatus.PAUSED,
        pausedAt: new Date(),
        remarks: `Paused by user ${userId}`,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`SIP ${updated.sipCode} paused by ${userId}`);

    return updated;
  }

  /**
   * Resume SIP
   */
  async resume(id: string, userId: string) {
    const sip = await this.prismaService.sIPRegistration.findUnique({
      where: { id },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.status !== SIPStatus.PAUSED) {
      throw new BadRequestException(
        `Cannot resume SIP with status ${sip.status}`,
      );
    }

    // Recalculate next due date from today
    const nextDueDate = this.calculateNextDueDate(
      new Date(),
      sip.sipDate,
      sip.frequency,
    );

    const updated = await this.prismaService.sIPRegistration.update({
      where: { id },
      data: {
        status: SIPStatus.ACTIVE,
        nextDueDate,
        remarks: `Resumed by user ${userId}`,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`SIP ${updated.sipCode} resumed by ${userId}`);

    return updated;
  }

  /**
   * Cancel SIP
   */
  async cancel(id: string, reason: string, userId: string) {
    const sip = await this.prismaService.sIPRegistration.findUnique({
      where: { id },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (![SIPStatus.ACTIVE, SIPStatus.PAUSED].includes(sip.status)) {
      throw new BadRequestException(
        `Cannot cancel SIP with status ${sip.status}`,
      );
    }

    const updated = await this.prismaService.sIPRegistration.update({
      where: { id },
      data: {
        status: SIPStatus.CANCELLED,
        cancelledAt: new Date(),
        remarks: `Cancelled by ${userId}: ${reason}`,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`SIP ${updated.sipCode} cancelled by ${userId}`);

    return updated;
  }

  /**
   * Get SIP installments with pagination
   */
  async getInstallments(sipId: string, pagination: PaginationDto) {
    const sip = await this.prismaService.sIPRegistration.findUnique({
      where: { id: sipId },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${sipId} not found`);
    }

    const [installments, total] = await Promise.all([
      this.prismaService.sIPInstallment.findMany({
        where: { sipId },
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { installmentNo: 'asc' },
      }),
      this.prismaService.sIPInstallment.count({ where: { sipId } }),
    ]);

    return {
      data: installments,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Get client SIPs
   */
  async getClientSips(clientId: string) {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prismaService.sIPRegistration.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        scheme: { select: { schemeName: true, amcName: true } },
        installments: {
          where: { status: 'PENDING' },
          select: { dueDate: true },
          take: 1,
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  /**
   * Get SIP summary for sub-broker
   */
  async getSipSummary(subBrokerId?: string) {
    const where: Prisma.SIPRegistrationWhereInput = subBrokerId
      ? { subBrokerId }
      : {};

    const sips = await this.prismaService.sIPRegistration.findMany({
      where,
      select: {
        id: true,
        status: true,
        amount: true,
        frequency: true,
        totalInvested: true,
      },
    });

    const summary = {
      total: sips.length,
      active: sips.filter((s) => s.status === SIPStatus.ACTIVE).length,
      paused: sips.filter((s) => s.status === SIPStatus.PAUSED).length,
      completed: sips.filter((s) => s.status === SIPStatus.COMPLETED).length,
      cancelled: sips.filter((s) => s.status === SIPStatus.CANCELLED).length,
      totalMonthlyAmount: sips
        .filter((s) => s.status === SIPStatus.ACTIVE && s.frequency === SIPFrequency.MONTHLY)
        .reduce((sum, s) => sum + s.amount.toNumber(), 0),
      totalInvested: sips.reduce((sum, s) => sum + s.totalInvested.toNumber(), 0),
    };

    return summary;
  }

  /**
   * Calculate next due date based on frequency and SIP date
   */
  private calculateNextDueDate(
    startDate: Date,
    sipDate: number,
    frequency: SIPFrequency,
  ): Date {
    const now = new Date();
    let nextDate = new Date(startDate);

    while (nextDate <= now) {
      switch (frequency) {
        case SIPFrequency.MONTHLY:
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case SIPFrequency.QUARTERLY:
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case SIPFrequency.WEEKLY:
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case SIPFrequency.YEARLY:
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
    }

    // Adjust to SIP date if frequency is MONTHLY
    if (frequency === SIPFrequency.MONTHLY && sipDate <= 28) {
      nextDate.setDate(Math.min(sipDate, 28));
    }

    return nextDate;
  }
}
