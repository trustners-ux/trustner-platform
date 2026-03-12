import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInsuranceClientDto } from './dto/create-insurance-client.dto';
import { UpdateInsuranceClientDto } from './dto/update-insurance-client.dto';

@Injectable()
export class InsuranceClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateClientCode(): Promise<string> {
    const lastClient = await this.prisma.insuranceClient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { clientCode: true },
    });

    let nextNum = 1;
    if (lastClient?.clientCode) {
      const match = lastClient.clientCode.match(/TIB-CLT-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `TIB-CLT-${String(nextNum).padStart(5, '0')}`;
  }

  async create(dto: CreateInsuranceClientDto, userId: string) {
    const clientCode = await this.generateClientCode();

    return this.prisma.insuranceClient.create({
      data: {
        clientCode,
        name: dto.name,
        phone: dto.phone || null,
        email: dto.email || null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        panNumber: dto.panNumber || null,
        aadharNumber: dto.aadharNumber || null,
        address: dto.address || null,
        city: dto.city || null,
        state: dto.state || null,
        pincode: dto.pincode || null,
        groupHeadName: dto.groupHeadName || null,
        createdBy: userId,
      },
      include: { creator: { select: { email: true, name: true } } },
    });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    kycStatus?: string;
    isActive?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.kycStatus) where.kycStatus = filters.kycStatus;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { clientCode: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { groupHeadName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.insuranceClient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { email: true, name: true } } },
      }),
      this.prisma.insuranceClient.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.insuranceClient.findUnique({
      where: { id },
      include: { creator: { select: { email: true, name: true } } },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateInsuranceClientDto) {
    const client = await this.prisma.insuranceClient.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    const data: any = { ...dto };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);

    return this.prisma.insuranceClient.update({
      where: { id },
      data,
      include: { creator: { select: { email: true, name: true } } },
    });
  }

  async getPortfolio(clientId: string) {
    const client = await this.prisma.insuranceClient.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    // Fetch all MIS entries for this client (matched by name)
    const policies = await this.prisma.mISEntry.findMany({
      where: {
        customerName: { equals: client.name, mode: 'insensitive' },
        status: 'VERIFIED',
      },
      orderBy: { policyEndDate: 'desc' },
      select: {
        id: true,
        misCode: true,
        policyNumber: true,
        insurerName: true,
        lob: true,
        policyType: true,
        policyStartDate: true,
        policyEndDate: true,
        grossPremium: true,
        netPremium: true,
        sumInsured: true,
        isRenewal: true,
        status: true,
      },
    });

    const premiumAgg = await this.prisma.mISEntry.aggregate({
      where: {
        customerName: { equals: client.name, mode: 'insensitive' },
        status: 'VERIFIED',
      },
      _count: { id: true },
      _sum: { grossPremium: true, netPremium: true, sumInsured: true },
    });

    return {
      client,
      policies,
      summary: {
        totalPolicies: premiumAgg._count.id,
        totalGrossPremium: premiumAgg._sum.grossPremium || 0,
        totalNetPremium: premiumAgg._sum.netPremium || 0,
        totalSumInsured: premiumAgg._sum.sumInsured || 0,
      },
    };
  }

  async getStats() {
    const [total, active, pendingKyc, verifiedKyc] = await Promise.all([
      this.prisma.insuranceClient.count(),
      this.prisma.insuranceClient.count({ where: { isActive: true } }),
      this.prisma.insuranceClient.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.insuranceClient.count({ where: { kycStatus: 'VERIFIED' } }),
    ]);

    return { total, active, inactive: total - active, pendingKyc, verifiedKyc };
  }
}
