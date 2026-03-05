import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClaimStatus } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Claims Management Service
 * Handles claim intimation, processing, investigation, approval, and settlement
 */
@Injectable()
export class ClaimsService {
  private readonly logger = new Logger('ClaimsService');

  constructor(private prisma: PrismaService) {}

  /**
   * Valid state transitions for claim status
   */
  private readonly stateTransitions: { [key: string]: ClaimStatus[] } = {
    INTIMATED: ['DOCUMENTS_PENDING', 'UNDER_INVESTIGATION'],
    DOCUMENTS_PENDING: ['DOCUMENTS_SUBMITTED'],
    DOCUMENTS_SUBMITTED: ['UNDER_INVESTIGATION', 'APPROVED', 'REJECTED'],
    UNDER_INVESTIGATION: ['SURVEYOR_APPOINTED', 'APPROVED', 'REJECTED'],
    SURVEYOR_APPOINTED: ['SURVEY_COMPLETED'],
    SURVEY_COMPLETED: ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
    APPROVED: ['SETTLED', 'CLOSED'],
    PARTIALLY_APPROVED: ['SETTLED', 'CLOSED'],
    REJECTED: ['CLOSED', 'REOPENED'],
    SETTLED: ['CLOSED'],
    CLOSED: ['REOPENED'],
    REOPENED: ['UNDER_INVESTIGATION', 'APPROVED', 'REJECTED'],
  };

  /**
   * Generate unique claim code
   * Format: CLM-YYYYMMDD-XXXXX
   */
  private async generateClaimCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.insuranceClaim.count({
      where: {
        claimCode: { startsWith: `CLM-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(5, '0');
    return `CLM-${datePrefix}-${seqNum}`;
  }

  /**
   * Validate state transition
   */
  private validateStateTransition(fromStatus: ClaimStatus, toStatus: ClaimStatus): void {
    const validTransitions = this.stateTransitions[fromStatus] || [];
    if (!validTransitions.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid claim status transition: ${fromStatus} -> ${toStatus}`,
      );
    }
  }

  /**
   * Intimate claim
   */
  async intimateClaim(claimDto: {
    policyId: string;
    claimType: string;
    incidentDate: string;
    description: string;
    estimatedAmount?: number;
  }): Promise<any> {
    try {
      const claimCode = await this.generateClaimCode();

      // Verify policy exists
      const policy = await this.prisma.insurancePolicy.findUniqueOrThrow({
        where: { id: claimDto.policyId },
      });

      const claim = await this.prisma.insuranceClaim.create({
        data: {
          claimCode,
          policyId: claimDto.policyId,
          pospId: policy.pospId,
          claimType: claimDto.claimType,
          status: ClaimStatus.INTIMATED,
          incidentDate: new Date(claimDto.incidentDate),
          description: claimDto.description,
          estimatedAmount: claimDto.estimatedAmount ? Number(claimDto.estimatedAmount) : null,
        },
        include: {
          policy: { select: { policyNumber: true, customerName: true } },
        },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          fromStatus: 'CREATED',
          toStatus: ClaimStatus.INTIMATED,
          changedBy: 'SYSTEM',
        },
      });

      this.logger.log(`✓ Claim intimated: ${claimCode} (${claim.id})`);
      return claim;
    } catch (error) {
      this.logger.error(`Error intimating claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all claims with filters
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      status?: ClaimStatus;
      claimType?: string;
      pospId?: string;
      policyId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.claimType) where.claimType = filters.claimType;
      if (filters.pospId) where.pospId = filters.pospId;
      if (filters.policyId) where.policyId = filters.policyId;

      if (filters.fromDate || filters.toDate) {
        where.intimationDate = {};
        if (filters.fromDate) where.intimationDate.gte = filters.fromDate;
        if (filters.toDate) where.intimationDate.lte = filters.toDate;
      }

      const [data, total] = await Promise.all([
        this.prisma.insuranceClaim.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            policy: { select: { policyNumber: true, customerName: true } },
            documents: true,
            statusHistory: true,
          },
        }),
        this.prisma.insuranceClaim.count({ where }),
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
      this.logger.error(`Error fetching claims: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single claim
   */
  async findOne(id: string): Promise<any> {
    try {
      const claim = await this.prisma.insuranceClaim.findUniqueOrThrow({
        where: { id },
        include: {
          policy: true,
          documents: { orderBy: { createdAt: 'desc' } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      return claim;
    } catch (error) {
      this.logger.error(`Error fetching claim: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('Claim not found');
      }
      throw error;
    }
  }

  /**
   * Update claim details
   */
  async updateClaim(id: string, updateDto: any): Promise<any> {
    try {
      await this.findOne(id);

      const claim = await this.prisma.insuranceClaim.update({
        where: { id },
        data: {
          description: updateDto.description,
          estimatedAmount: updateDto.estimatedAmount ? Number(updateDto.estimatedAmount) : undefined,
          providerName: updateDto.providerName,
          providerCity: updateDto.providerCity,
          providerState: updateDto.providerState,
        },
      });

      this.logger.log(`✓ Claim updated: ${id}`);
      return claim;
    } catch (error) {
      this.logger.error(`Error updating claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update claim status with state machine validation
   */
  async updateStatus(
    id: string,
    newStatus: ClaimStatus,
    changedBy: string,
    reason?: string,
  ): Promise<any> {
    try {
      const claim = await this.findOne(id);

      // Validate state transition
      this.validateStateTransition(claim.status, newStatus);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: { status: newStatus },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: newStatus,
          changedBy,
          reason,
        },
      });

      this.logger.log(`✓ Claim status updated: ${id} -> ${newStatus}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating claim status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload claim document
   */
  async uploadDocument(claimId: string, filePath: string, fileName: string, documentType: string): Promise<any> {
    try {
      await this.findOne(claimId);

      const doc = await this.prisma.claimDocument.create({
        data: {
          claimId,
          documentType,
          fileName,
          filePath,
        },
      });

      this.logger.log(`✓ Document uploaded for claim: ${claimId}`);
      return doc;
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign claim to internal team
   */
  async assignClaim(id: string, userId: string): Promise<any> {
    try {
      const claim = await this.findOne(id);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: { assignedToUserId: userId },
      });

      this.logger.log(`✓ Claim assigned: ${id} -> ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error assigning claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Appoint surveyor for motor claims
   */
  async appointSurveyor(id: string, name: string, phone: string): Promise<any> {
    try {
      const claim = await this.findOne(id);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: {
          surveyorName: name,
          surveyorPhone: phone,
          status: ClaimStatus.SURVEYOR_APPOINTED,
        },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: ClaimStatus.SURVEYOR_APPOINTED,
          changedBy: 'SYSTEM',
          reason: `Surveyor: ${name}`,
        },
      });

      this.logger.log(`✓ Surveyor appointed for claim: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error appointing surveyor: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve claim
   */
  async approveClaim(id: string, approvedAmount: number, approvedBy: string): Promise<any> {
    try {
      const claim = await this.findOne(id);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: ClaimStatus.APPROVED,
          approvedAmount: Number(approvedAmount),
        },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: ClaimStatus.APPROVED,
          changedBy: approvedBy,
          reason: `Approved amount: ${approvedAmount}`,
        },
      });

      this.logger.log(`✓ Claim approved: ${id} (${approvedAmount})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error approving claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject claim
   */
  async rejectClaim(id: string, reason: string, rejectedBy: string): Promise<any> {
    try {
      const claim = await this.findOne(id);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: ClaimStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: ClaimStatus.REJECTED,
          changedBy: rejectedBy,
          reason,
        },
      });

      this.logger.log(`✓ Claim rejected: ${id} - ${reason}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error rejecting claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Settle claim
   */
  async settleClaim(id: string, settledAmount: number): Promise<any> {
    try {
      const claim = await this.findOne(id);

      const updated = await this.prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: ClaimStatus.SETTLED,
          settledAmount: Number(settledAmount),
          settledAt: new Date(),
        },
      });

      // Create status history
      await this.prisma.claimStatusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: ClaimStatus.SETTLED,
          changedBy: 'SYSTEM',
          reason: `Settled amount: ${settledAmount}`,
        },
      });

      this.logger.log(`✓ Claim settled: ${id} (${settledAmount})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error settling claim: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get claim analytics
   */
  async getClaimAnalytics(): Promise<any> {
    try {
      const [
        totalClaims,
        approvedClaims,
        rejectedClaims,
        settledClaims,
        totalApprovedAmount,
        totalSettledAmount,
        claimsByStatus,
        claimsByType,
      ] = await Promise.all([
        this.prisma.insuranceClaim.count(),
        this.prisma.insuranceClaim.count({
          where: { status: ClaimStatus.APPROVED },
        }),
        this.prisma.insuranceClaim.count({
          where: { status: ClaimStatus.REJECTED },
        }),
        this.prisma.insuranceClaim.count({
          where: { status: ClaimStatus.SETTLED },
        }),
        this.prisma.insuranceClaim.aggregate({
          where: { status: ClaimStatus.APPROVED },
          _sum: { approvedAmount: true },
        }),
        this.prisma.insuranceClaim.aggregate({
          where: { status: ClaimStatus.SETTLED },
          _sum: { settledAmount: true },
        }),
        this.prisma.insuranceClaim.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.insuranceClaim.groupBy({
          by: ['claimType'],
          _count: { id: true },
        }),
      ]);

      const approvalRate =
        totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(2) : 0;
      const settlementRatio =
        approvedClaims > 0
          ? ((settledClaims / approvedClaims) * 100).toFixed(2)
          : 0;

      return {
        summary: {
          totalClaims,
          approvedClaims,
          rejectedClaims,
          settledClaims,
          approvalRate: `${approvalRate}%`,
          settlementRatio: `${settlementRatio}%`,
          totalApprovedAmount: totalApprovedAmount._sum.approvedAmount || 0,
          totalSettledAmount: totalSettledAmount._sum.settledAmount || 0,
        },
        byStatus: claimsByStatus,
        byType: claimsByType,
      };
    } catch (error) {
      this.logger.error(`Error fetching claim analytics: ${error.message}`);
      throw error;
    }
  }
}
