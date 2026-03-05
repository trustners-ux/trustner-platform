import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyStatus, InsuranceLOB } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Policy Management Service
 * Manages policy lifecycle with state machine validation
 * Handles quotes, proposals, payment, issuance, renewals, and claims
 */
@Injectable()
export class PoliciesService {
  private readonly logger = new Logger('PoliciesService');

  constructor(private prisma: PrismaService) {}

  /**
   * Valid state transitions for policy status
   */
  private readonly stateTransitions: { [key: string]: PolicyStatus[] } = {
    QUOTE_GENERATED: ['PROPOSAL_SUBMITTED', 'QUOTE_GENERATED'],
    PROPOSAL_SUBMITTED: ['PROPOSAL_UNDER_REVIEW', 'PAYMENT_PENDING'],
    PROPOSAL_UNDER_REVIEW: ['PAYMENT_PENDING', 'QUOTE_GENERATED'],
    PAYMENT_PENDING: ['PAYMENT_RECEIVED'],
    PAYMENT_RECEIVED: ['POLICY_ISSUED'],
    POLICY_ISSUED: ['POLICY_ACTIVE'],
    POLICY_ACTIVE: ['POLICY_EXPIRED', 'POLICY_CANCELLED', 'CLAIM_IN_PROGRESS', 'ENDORSEMENT_IN_PROGRESS'],
    POLICY_EXPIRED: ['POLICY_EXPIRED'],
    POLICY_CANCELLED: ['POLICY_CANCELLED'],
    POLICY_LAPSED: ['POLICY_ACTIVE'],
    CLAIM_IN_PROGRESS: ['POLICY_ACTIVE'],
    ENDORSEMENT_IN_PROGRESS: ['POLICY_ACTIVE'],
  };

  /**
   * Generate unique policy internal reference code
   * Format: TIBPL-POL-YYYYMMDD-XXXXX
   */
  private async generatePolicyCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.insurancePolicy.count({
      where: {
        internalRefCode: { startsWith: `TIBPL-POL-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(5, '0');
    return `TIBPL-POL-${datePrefix}-${seqNum}`;
  }

  /**
   * Validate state transition
   */
  private validateStateTransition(fromStatus: PolicyStatus, toStatus: PolicyStatus): void {
    const validTransitions = this.stateTransitions[fromStatus] || [];
    if (!validTransitions.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid state transition: ${fromStatus} -> ${toStatus}. Valid transitions: ${validTransitions.join(', ')}`,
      );
    }
  }

  /**
   * Create new policy
   */
  async createPolicy(createDto: CreatePolicyDto, pospId?: string): Promise<any> {
    try {
      const internalRefCode = await this.generatePolicyCode();

      // Verify POSP exists
      await this.prisma.pOSPAgent.findUniqueOrThrow({
        where: { id: createDto.pospId || pospId },
      });

      // Verify company exists
      await this.prisma.insuranceCompany.findUniqueOrThrow({
        where: { id: createDto.companyId },
      });

      // Verify product exists
      await this.prisma.insuranceProduct.findUniqueOrThrow({
        where: { id: createDto.productId },
      });

      const policy = await this.prisma.insurancePolicy.create({
        data: {
          policyNumber: internalRefCode, // Will be replaced with insurer's actual number later
          internalRefCode,
          pospId: createDto.pospId || pospId,
          companyId: createDto.companyId,
          productId: createDto.productId,
          lob: createDto.lob,
          status: PolicyStatus.QUOTE_GENERATED,
          customerName: createDto.customerName,
          customerPhone: createDto.customerPhone,
          customerEmail: createDto.customerEmail,
          customerPan: createDto.customerPan,
          customerAadhaar: createDto.customerAadhaar,
          sumInsured: Number(createDto.sumInsured),
          basePremium: Number(createDto.basePremium),
          addOnPremium: Number(createDto.addOnPremium) || 0,
          gstAmount: Number(createDto.gstAmount),
          totalPremium: Number(createDto.totalPremium),
          stampDuty: Number(createDto.stampDuty) || 0,
          netPremium: Number(createDto.netPremium),
          vehicleRegNumber: createDto.vehicleRegNumber,
          vehicleMake: createDto.vehicleMake,
          vehicleModel: createDto.vehicleModel,
          idv: createDto.idv ? Number(createDto.idv) : null,
          ncbPercentage: createDto.ncbPercentage ? Number(createDto.ncbPercentage) : null,
          policyType: createDto.policyType,
          nomineeName: createDto.nomineeName,
          nomineeRelation: createDto.nomineeRelation,
          startDate: createDto.startDate ? new Date(createDto.startDate) : null,
          endDate: createDto.endDate ? new Date(createDto.endDate) : null,
          remarks: createDto.remarks,
        },
        include: {
          company: true,
          product: true,
          posp: { select: { id: true, agentCode: true } },
        },
      });

      // Create status history entry
      await this.prisma.policyStatusHistory.create({
        data: {
          policyId: policy.id,
          fromStatus: 'CREATED',
          toStatus: PolicyStatus.QUOTE_GENERATED,
          changedBy: 'SYSTEM',
        },
      });

      this.logger.log(`✓ Policy created: ${internalRefCode} (${policy.id})`);
      return policy;
    } catch (error) {
      this.logger.error(`Error creating policy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all policies with filters and pagination
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      pospId?: string;
      companyId?: string;
      lob?: InsuranceLOB;
      status?: PolicyStatus;
      search?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.pospId) where.pospId = filters.pospId;
      if (filters.companyId) where.companyId = filters.companyId;
      if (filters.lob) where.lob = filters.lob;
      if (filters.status) where.status = filters.status;

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      if (filters.search) {
        where.OR = [
          { policyNumber: { contains: filters.search, mode: 'insensitive' } },
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerPhone: { contains: filters.search, mode: 'insensitive' } },
          { vehicleRegNumber: { contains: filters.search, mode: 'insensitive' } },
          { internalRefCode: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.insurancePolicy.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            company: { select: { id: true, companyName: true } },
            product: { select: { id: true, productName: true } },
            posp: { select: { id: true, agentCode: true, firstName: true, lastName: true } },
            _count: {
              select: {
                endorsements: true,
                claims: true,
                commissions: true,
              },
            },
          },
        }),
        this.prisma.insurancePolicy.count({ where }),
      ]);

      return {
        data,
        pagination: {
          total,
          skip: pagination.skip,
          take: pagination.take,
          pages: Math.ceil(total / pagination.take),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching policies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single policy with full details
   */
  async findOne(id: string): Promise<any> {
    try {
      const policy = await this.prisma.insurancePolicy.findUniqueOrThrow({
        where: { id },
        include: {
          company: true,
          product: true,
          posp: true,
          endorsements: { orderBy: { createdAt: 'desc' } },
          claims: { orderBy: { createdAt: 'desc' } },
          commissions: { orderBy: { createdAt: 'desc' } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          documents: { orderBy: { createdAt: 'desc' } },
          inspections: { orderBy: { createdAt: 'desc' } },
        },
      });

      return policy;
    } catch (error) {
      this.logger.error(`Error fetching policy: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('Policy not found');
      }
      throw error;
    }
  }

  /**
   * Update policy details
   */
  async updatePolicy(id: string, updateDto: Partial<CreatePolicyDto>): Promise<any> {
    try {
      await this.findOne(id);

      const policy = await this.prisma.insurancePolicy.update({
        where: { id },
        data: {
          customerName: updateDto.customerName,
          customerPhone: updateDto.customerPhone,
          customerEmail: updateDto.customerEmail,
          nomineeName: updateDto.nomineeName,
          nomineeRelation: updateDto.nomineeRelation,
          remarks: updateDto.remarks,
        },
      });

      this.logger.log(`✓ Policy updated: ${id}`);
      return policy;
    } catch (error) {
      this.logger.error(`Error updating policy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update policy status with state machine validation
   */
  async updateStatus(
    id: string,
    newStatus: PolicyStatus,
    changedBy: string,
    reason?: string,
  ): Promise<any> {
    try {
      const policy = await this.findOne(id);

      // Validate state transition
      this.validateStateTransition(policy.status, newStatus);

      const updated = await this.prisma.insurancePolicy.update({
        where: { id },
        data: {
          status: newStatus,
          remarks: reason ? `${policy.remarks || ''}\n[${newStatus}] ${reason}` : policy.remarks,
        },
      });

      // Create status history
      await this.prisma.policyStatusHistory.create({
        data: {
          policyId: id,
          fromStatus: policy.status,
          toStatus: newStatus,
          changedBy,
          reason,
        },
      });

      this.logger.log(`✓ Policy status updated: ${id} -> ${newStatus}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating policy status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload policy document
   */
  async uploadDocument(id: string, filePath: string, fileName: string, documentType: string): Promise<any> {
    try {
      await this.findOne(id);

      const doc = await this.prisma.policyDocument.create({
        data: {
          policyId: id,
          documentType,
          fileName,
          filePath,
        },
      });

      this.logger.log(`✓ Document uploaded for policy: ${id} (${documentType})`);
      return doc;
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tag BQP to policy
   */
  async tagBQP(id: string, bqpCode: string): Promise<any> {
    try {
      const policy = await this.findOne(id);

      const updated = await this.prisma.insurancePolicy.update({
        where: { id },
        data: {
          bqpCode,
          bqpTagged: true,
        },
      });

      this.logger.log(`✓ BQP tagged to policy: ${id} (${bqpCode})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error tagging BQP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tag SP to policy
   */
  async tagSP(id: string, spCode: string): Promise<any> {
    try {
      const policy = await this.findOne(id);

      const updated = await this.prisma.insurancePolicy.update({
        where: { id },
        data: {
          spCode,
          spTagged: true,
        },
      });

      this.logger.log(`✓ SP tagged to policy: ${id} (${spCode})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error tagging SP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get policy status timeline
   */
  async getPolicyTimeline(id: string): Promise<any> {
    try {
      await this.findOne(id);

      const timeline = await this.prisma.policyStatusHistory.findMany({
        where: { policyId: id },
        orderBy: { createdAt: 'asc' },
      });

      return {
        policyId: id,
        timeline,
      };
    } catch (error) {
      this.logger.error(`Error fetching policy timeline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get bulk policies for export
   */
  async getBulkPolicies(filters: {
    pospId?: string;
    companyId?: string;
    lob?: InsuranceLOB;
    status?: PolicyStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters.pospId) where.pospId = filters.pospId;
      if (filters.companyId) where.companyId = filters.companyId;
      if (filters.lob) where.lob = filters.lob;
      if (filters.status) where.status = filters.status;

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      const policies = await this.prisma.insurancePolicy.findMany({
        where,
        select: {
          id: true,
          policyNumber: true,
          internalRefCode: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          lob: true,
          status: true,
          sumInsured: true,
          basePremium: true,
          gstAmount: true,
          totalPremium: true,
          netPremium: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          posp: { select: { agentCode: true, firstName: true, lastName: true } },
          company: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        count: policies.length,
        data: policies,
      };
    } catch (error) {
      this.logger.error(`Error fetching bulk policies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get expiring policies for renewal management
   */
  async getExpiringPolicies(daysAhead: number): Promise<any> {
    try {
      const now = dayjs();
      const expiryDate = now.add(daysAhead, 'days').toDate();
      const startDate = now.toDate();

      const policies = await this.prisma.insurancePolicy.findMany({
        where: {
          endDate: {
            gte: startDate,
            lte: expiryDate,
          },
          status: PolicyStatus.POLICY_ACTIVE,
        },
        include: {
          posp: { select: { id: true, agentCode: true, firstName: true, lastName: true, phone: true } },
          company: { select: { companyName: true } },
        },
        orderBy: { endDate: 'asc' },
      });

      return {
        expiringIn: daysAhead,
        count: policies.length,
        policies,
      };
    } catch (error) {
      this.logger.error(`Error fetching expiring policies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get policy statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [
        totalPolicies,
        activeCount,
        expiredCount,
        cancelledCount,
        totalPremium,
        totalGWP,
      ] = await Promise.all([
        this.prisma.insurancePolicy.count(),
        this.prisma.insurancePolicy.count({
          where: { status: PolicyStatus.POLICY_ACTIVE },
        }),
        this.prisma.insurancePolicy.count({
          where: { status: PolicyStatus.POLICY_EXPIRED },
        }),
        this.prisma.insurancePolicy.count({
          where: { status: PolicyStatus.POLICY_CANCELLED },
        }),
        this.prisma.insurancePolicy.aggregate({
          _sum: { totalPremium: true },
        }),
        this.prisma.insurancePolicy.aggregate({
          _sum: { netPremium: true },
        }),
      ]);

      return {
        totalPolicies,
        activeCount,
        expiredCount,
        cancelledCount,
        totalPremium: totalPremium._sum.totalPremium || 0,
        totalGWP: totalGWP._sum.netPremium || 0,
      };
    } catch (error) {
      this.logger.error(`Error fetching policy statistics: ${error.message}`);
      throw error;
    }
  }
}
