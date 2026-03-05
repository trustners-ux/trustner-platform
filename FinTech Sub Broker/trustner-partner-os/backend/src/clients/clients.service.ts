import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, KYCStatus, ClientStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clients Service
 * Manages client profiles, KYC verification, bank accounts, and portfolio tracking
 * - Client registration and profile management
 * - KYC status tracking
 * - Bank account management
 * - Portfolio and risk assessment
 */
@Injectable()
export class ClientsService {
  private readonly logger = new Logger('ClientsService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Create new client
   */
  async create(createDto: CreateClientDto, createdBy: string) {
    // Validate sub-broker exists
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id: createDto.subBrokerId },
    });

    if (!subBroker) {
      throw new BadRequestException(`Sub-broker with ID ${createDto.subBrokerId} not found`);
    }

    // Check for duplicate email
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(`User with email ${createDto.email} already exists`);
    }

    // Generate unique client code
    const clientCode = `TRUSTNER-C-${uuidv4().split('-')[0].toUpperCase()}`;

    const dateOfBirth = createDto.dateOfBirth
      ? new Date(createDto.dateOfBirth)
      : undefined;

    try {
      // Create user first
      const user = await this.prismaService.user.create({
        data: {
          email: createDto.email,
          phone: createDto.phone,
          passwordHash: '', // Will be set during registration
          role: 'CLIENT',
          isActive: true,
          profile: {
            create: {
              firstName: createDto.firstName,
              lastName: createDto.lastName,
              dateOfBirth,
              gender: createDto.gender,
              addressLine1: createDto.addressLine1,
              addressLine2: createDto.addressLine2,
              city: createDto.city,
              state: createDto.state,
              pincode: createDto.pincode,
            },
          },
        },
      });

      // Create client
      const client = await this.prismaService.client.create({
        data: {
          clientCode,
          userId: user.id,
          subBrokerId: createDto.subBrokerId,
          panNumber: createDto.panNumber || null,
          taxStatus: createDto.taxStatus || 'INDIVIDUAL',
          occupation: createDto.occupation,
          annualIncome: createDto.annualIncome,
          kycStatus: KYCStatus.NOT_STARTED,
          status: ClientStatus.PROSPECT,
          riskProfile: null,
          riskScore: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: true,
            },
          },
        },
      });

      this.logger.log(`Client created: ${clientCode} (${user.email}) by ${createdBy}`);

      return client;
    } catch (error) {
      this.logger.error(`Failed to create client: ${error.message}`);
      throw new BadRequestException('Failed to create client');
    }
  }

  /**
   * Get all clients with filters and pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      subBrokerId?: string;
      kycStatus?: KYCStatus;
      status?: ClientStatus;
      search?: string;
    },
  ) {
    const where: Prisma.ClientWhereInput = {};

    if (filters?.subBrokerId) {
      where.subBrokerId = filters.subBrokerId;
    }

    if (filters?.kycStatus) {
      where.kycStatus = filters.kycStatus;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { clientCode: { contains: filters.search, mode: 'insensitive' } },
        { panNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaService.client.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.client.count({ where }),
    ]);

    this.logger.log(`Retrieved ${data.length} clients from ${total} total`);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get client by ID with full details
   */
  async findOne(id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.prismaService.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            profile: true,
          },
        },
        subBroker: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        bankAccounts: {
          select: {
            id: true,
            bankName: true,
            ifscCode: true,
            accountType: true,
            isPrimary: true,
            isVerified: true,
          },
        },
        riskAssessments: {
          select: {
            id: true,
            riskProfile: true,
            totalScore: true,
            assessedAt: true,
          },
          orderBy: { assessedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      this.logger.warn(`Client not found: ${id}`);
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  /**
   * Update client information
   */
  async update(id: string, updateDto: UpdateClientDto) {
    await this.findOne(id);

    try {
      const updatedClient = await this.prismaService.client.update({
        where: { id },
        data: {
          occupation: updateDto.occupation,
          annualIncome: updateDto.annualIncome,
          taxStatus: updateDto.taxStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
      });

      this.logger.log(`Client updated: ${id}`);
      return updatedClient;
    } catch (error) {
      this.logger.error(`Failed to update client ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update client');
    }
  }

  /**
   * Update KYC status
   */
  async updateKycStatus(id: string, kycStatus: KYCStatus) {
    const client = await this.findOne(id);

    // Validate KYC status progression
    const validTransitions: Record<KYCStatus, KYCStatus[]> = {
      [KYCStatus.NOT_STARTED]: [
        KYCStatus.PAN_VERIFIED,
        KYCStatus.REJECTED,
      ],
      [KYCStatus.PAN_VERIFIED]: [
        KYCStatus.AADHAAR_VERIFIED,
        KYCStatus.REJECTED,
      ],
      [KYCStatus.AADHAAR_VERIFIED]: [
        KYCStatus.CKYC_FETCHED,
        KYCStatus.REJECTED,
      ],
      [KYCStatus.CKYC_FETCHED]: [
        KYCStatus.BANK_VERIFIED,
        KYCStatus.REJECTED,
      ],
      [KYCStatus.BANK_VERIFIED]: [
        KYCStatus.FATCA_DONE,
        KYCStatus.REJECTED,
      ],
      [KYCStatus.FATCA_DONE]: [
        KYCStatus.COMPLETE,
      ],
      [KYCStatus.COMPLETE]: [],
      [KYCStatus.REJECTED]: [
        KYCStatus.NOT_STARTED,
      ],
    };

    if (!validTransitions[client.kycStatus]?.includes(kycStatus)) {
      throw new BadRequestException(
        `Cannot transition KYC status from ${client.kycStatus} to ${kycStatus}`,
      );
    }

    try {
      const updatedClient = await this.prismaService.client.update({
        where: { id },
        data: {
          kycStatus,
          status: kycStatus === KYCStatus.COMPLETE ? ClientStatus.ACTIVE : client.status,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      this.logger.log(`KYC status updated for client ${id}: ${kycStatus}`);
      return updatedClient;
    } catch (error) {
      this.logger.error(`Failed to update KYC status for client ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update KYC status');
    }
  }

  /**
   * Add bank account for client
   */
  async addBankAccount(clientId: string, addAccountDto: AddBankAccountDto) {
    const client = await this.findOne(clientId);

    try {
      // If setting as primary, unset other primary accounts
      if (addAccountDto.isPrimary) {
        await this.prismaService.clientBankAccount.updateMany({
          where: { clientId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const bankAccount = await this.prismaService.clientBankAccount.create({
        data: {
          clientId,
          accountNumber: addAccountDto.accountNumber,
          ifscCode: addAccountDto.ifscCode,
          bankName: addAccountDto.bankName,
          branchName: addAccountDto.branchName,
          accountType: addAccountDto.accountType || 'SAVINGS',
          isPrimary: addAccountDto.isPrimary || false,
          isVerified: false,
        },
      });

      this.logger.log(`Bank account added for client ${clientId}: ${bankAccount.id}`);
      return bankAccount;
    } catch (error) {
      this.logger.error(`Failed to add bank account for client ${clientId}: ${error.message}`);
      throw new BadRequestException('Failed to add bank account');
    }
  }

  /**
   * Get all bank accounts for client
   */
  async getBankAccounts(clientId: string) {
    await this.findOne(clientId);

    const bankAccounts = await this.prismaService.clientBankAccount.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Retrieved ${bankAccounts.length} bank accounts for client: ${clientId}`);

    return bankAccounts;
  }

  /**
   * Get portfolio summary for client
   */
  async getPortfolioSummary(clientId: string) {
    const client = await this.findOne(clientId);

    try {
      const holdings = await this.prismaService.holding.findMany({
        where: { clientId },
        include: {
          scheme: {
            select: {
              id: true,
              name: true,
              isin: true,
            },
          },
        },
      });

      const sipRegistrations = await this.prismaService.sIPRegistration.findMany({
        where: { clientId },
        include: {
          scheme: {
            select: {
              name: true,
            },
          },
        },
      });

      const summary = {
        clientCode: client.clientCode,
        status: client.status,
        kycStatus: client.kycStatus,
        totalInvested: client.totalInvested,
        currentValue: client.currentValue,
        totalSipAmount: client.totalSipAmount,
        holdingsCount: holdings.length,
        sipCount: sipRegistrations.length,
        riskProfile: client.riskProfile,
        holdings: holdings.map((h) => ({
          id: h.id,
          schemeName: h.scheme.name,
          units: h.units,
          averageCost: h.averageCost,
          currentValue: h.currentValue,
        })),
        activeSips: sipRegistrations.filter((s) => s.status === 'ACTIVE').length,
      };

      this.logger.log(`Retrieved portfolio summary for client: ${clientId}`);
      return summary;
    } catch (error) {
      this.logger.error(`Failed to get portfolio summary for client ${clientId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve portfolio summary');
    }
  }
}
