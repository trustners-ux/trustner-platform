import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, SubBrokerStatus, CommissionTier, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubBrokerDto } from './dto/create-sub-broker.dto';
import { UpdateSubBrokerDto } from './dto/update-sub-broker.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sub-Brokers Service
 * Manages sub-broker accounts, profiles, KYC, and performance tracking
 * - Registration and approval workflow
 * - AUM and tier management
 * - Performance metrics
 */
@Injectable()
export class SubBrokersService {
  private readonly logger = new Logger('SubBrokersService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Create new sub-broker
   * Generates unique code: TRUSTNER-SB-XXXXX
   * Initial status: PENDING_APPROVAL
   */
  async create(createDto: CreateSubBrokerDto, createdBy?: string) {
    // Check for duplicate ARN
    const existingArn = await this.prismaService.subBroker.findUnique({
      where: { arn: createDto.arn },
    });

    if (existingArn) {
      throw new BadRequestException(`Sub-broker with ARN ${createDto.arn} already exists`);
    }

    // Generate unique code
    const code = `TRUSTNER-SB-${uuidv4().split('-')[0].toUpperCase()}`;

    try {
      const subBroker = await this.prismaService.subBroker.create({
        data: {
          code,
          name: createDto.name,
          arn: createDto.arn,
          email: createDto.email,
          phone: createDto.phone,
          addressLine1: createDto.addressLine1 || '',
          addressLine2: createDto.addressLine2 || '',
          city: createDto.city || '',
          state: createDto.state || '',
          postalCode: createDto.postalCode || '',
          branch: createDto.branch || '',
          regionalHeadId: createDto.regionalHeadId || null,
          pan: createDto.pan || '',
          gstNumber: createDto.gstNumber || '',
          bankAccountNumber: createDto.bankAccountNumber || '',
          bankIfscCode: createDto.bankIfscCode || '',
          bankName: createDto.bankName || '',
          website: createDto.website || '',
          description: createDto.description || '',
          status: SubBrokerStatus.PENDING_APPROVAL,
          commissionTier: createDto.commissionTier || CommissionTier.STARTER,
          aum: createDto.initialAUM || 0,
          clientCount: 0,
          sipBookSize: 0,
          totalCommissionEarned: 0,
          arnExpiryDate: null,
          nismExpiryDate: null,
          pospExpiryDate: null,
          createdBy: createdBy || 'system',
          approvedAt: null,
          approvedBy: null,
          suspendedAt: null,
          suspendedBy: null,
          suspendReason: null,
        },
        include: {
          regionalHead: true,
        },
      });

      this.logger.log(`Sub-broker created: ${subBroker.code} (${subBroker.arn})`);

      return subBroker;
    } catch (error) {
      this.logger.error(`Failed to create sub-broker: ${error.message}`);
      throw new BadRequestException('Failed to create sub-broker');
    }
  }

  /**
   * Get all sub-brokers with filters and pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: SubBrokerStatus;
      branch?: string;
      regionalHeadId?: string;
      commissionTier?: CommissionTier;
      search?: string;
    },
  ) {
    const where: Prisma.SubBrokerWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.branch) {
      where.branch = filters.branch;
    }

    if (filters?.regionalHeadId) {
      where.regionalHeadId = filters.regionalHeadId;
    }

    if (filters?.commissionTier) {
      where.commissionTier = filters.commissionTier;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { arn: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaService.subBroker.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          regionalHead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      }),
      this.prismaService.subBroker.count({ where }),
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
   * Get single sub-broker with detailed information
   */
  async findOne(id: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
      include: {
        regionalHead: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            isActive: true,
            role: true,
          },
        },
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            kycStatus: true,
          },
        },
        commissions: {
          select: {
            id: true,
            grossAmount: true,
            netAmount: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    return subBroker;
  }

  /**
   * Update sub-broker information
   */
  async update(id: string, updateDto: UpdateSubBrokerDto, updatedBy?: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    // Prevent duplicate ARN
    if (updateDto.arn && updateDto.arn !== subBroker.arn) {
      const existingArn = await this.prismaService.subBroker.findUnique({
        where: { arn: updateDto.arn },
      });
      if (existingArn) {
        throw new BadRequestException(`Sub-broker with ARN ${updateDto.arn} already exists`);
      }
    }

    const updated = await this.prismaService.subBroker.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      include: { regionalHead: true },
    });

    this.logger.log(`Sub-broker updated: ${updated.code}`);

    return updated;
  }

  /**
   * Approve sub-broker (status: APPROVED)
   */
  async approve(id: string, approvedBy: string, notes?: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    if (subBroker.status === SubBrokerStatus.APPROVED) {
      throw new BadRequestException('Sub-broker is already approved');
    }

    const updated = await this.prismaService.subBroker.update({
      where: { id },
      data: {
        status: SubBrokerStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy,
      },
    });

    this.logger.log(`Sub-broker approved: ${updated.code} by ${approvedBy}`);

    // TODO: Send approval notification

    return updated;
  }

  /**
   * Suspend sub-broker
   */
  async suspend(id: string, reason: string, suspendedBy: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    if (subBroker.status === SubBrokerStatus.SUSPENDED) {
      throw new BadRequestException('Sub-broker is already suspended');
    }

    const updated = await this.prismaService.subBroker.update({
      where: { id },
      data: {
        status: SubBrokerStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedBy,
        suspendReason: reason,
      },
    });

    this.logger.log(`Sub-broker suspended: ${updated.code} - Reason: ${reason}`);

    // TODO: Send suspension notification

    return updated;
  }

  /**
   * Auto-update tier based on AUM thresholds
   * STARTER: AUM < 1Cr
   * GROWTH: 1Cr - 5Cr
   * SENIOR: 5Cr - 25Cr
   * ELITE: >25Cr
   */
  async updateTier(id: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
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
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    // Calculate total AUM
    const aum = subBroker.clients.reduce((sum, client) => {
      const clientAUM = client.holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
      return sum + clientAUM;
    }, 0);

    let newTier = CommissionTier.STARTER;
    const oneCr = 10000000;
    const fiveCr = 50000000;
    const twentyFiveCr = 250000000;

    if (aum >= twentyFiveCr) {
      newTier = CommissionTier.ELITE;
    } else if (aum >= fiveCr) {
      newTier = CommissionTier.SENIOR;
    } else if (aum >= oneCr) {
      newTier = CommissionTier.GROWTH;
    } else {
      newTier = CommissionTier.STARTER;
    }

    if (newTier !== subBroker.commissionTier) {
      const updated = await this.prismaService.subBroker.update({
        where: { id },
        data: {
          commissionTier: newTier,
          aum,
        },
      });

      this.logger.log(`Sub-broker tier updated: ${updated.code} - New tier: ${newTier}`);

      return updated;
    }

    return subBroker;
  }

  /**
   * Get performance metrics for sub-broker
   */
  async getPerformance(id: string) {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            holdings: {
              select: {
                currentValue: true,
              },
            },
            sipMandates: {
              select: {
                monthlyAmount: true,
                status: true,
              },
            },
          },
        },
        commissions: {
          select: {
            grossAmount: true,
            netAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subBroker) {
      throw new NotFoundException(`Sub-broker with ID ${id} not found`);
    }

    // Calculate metrics
    const totalAUM = subBroker.clients.reduce((sum, client) => {
      const clientAUM = client.holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
      return sum + clientAUM;
    }, 0);

    const totalSIPAmount = subBroker.clients.reduce((sum, client) => {
      const activeSIPs = client.sipMandates.filter((s) => s.status === 'ACTIVE');
      const sipSum = activeSIPs.reduce((s, sip) => s + (sip.monthlyAmount || 0), 0);
      return sum + sipSum;
    }, 0);

    const totalCommission = subBroker.commissions.reduce((sum, c) => sum + (c.netAmount || 0), 0);

    return {
      id: subBroker.id,
      code: subBroker.code,
      name: subBroker.name,
      aum: totalAUM,
      clientCount: subBroker.clientCount,
      sipBookMonthly: totalSIPAmount,
      totalCommissionEarned: totalCommission,
      commissionTier: subBroker.commissionTier,
      status: subBroker.status,
      createdAt: subBroker.createdAt,
      metricsUpdatedAt: new Date(),
    };
  }

  /**
   * Check and authenticate sub-broker access
   */
  async checkSubBrokerAccess(subBrokerId: string, user: any): Promise<boolean> {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.COMPLIANCE_ADMIN) {
      return true;
    }

    if (user.role === UserRole.SUB_BROKER && user.subBrokerId === subBrokerId) {
      return true;
    }

    return false;
  }
}
