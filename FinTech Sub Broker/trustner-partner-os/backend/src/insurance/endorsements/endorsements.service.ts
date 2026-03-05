import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EndorsementStatus, EndorsementType } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Endorsements Service
 * Manages policy endorsements (amendments) like name change, address change, sum insured change, etc.
 */
@Injectable()
export class EndorsementsService {
  private readonly logger = new Logger('EndorsementsService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique endorsement code
   * Format: END-YYYYMMDD-XXXXX
   */
  private async generateEndorsementCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.endorsement.count({
      where: {
        endorsementCode: { startsWith: `END-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(5, '0');
    return `END-${datePrefix}-${seqNum}`;
  }

  /**
   * Create endorsement
   */
  async createEndorsement(endorsementDto: {
    policyId: string;
    type: EndorsementType;
    description: string;
    oldValues?: any;
    newValues?: any;
    premiumDifference?: number;
    requestedBy: string;
  }): Promise<any> {
    try {
      const endorsementCode = await this.generateEndorsementCode();

      // Verify policy exists
      await this.prisma.insurancePolicy.findUniqueOrThrow({
        where: { id: endorsementDto.policyId },
      });

      const endorsement = await this.prisma.endorsement.create({
        data: {
          endorsementCode,
          policyId: endorsementDto.policyId,
          type: endorsementDto.type,
          status: EndorsementStatus.REQUESTED,
          description: endorsementDto.description,
          oldValues: endorsementDto.oldValues,
          newValues: endorsementDto.newValues,
          premiumDifference: endorsementDto.premiumDifference
            ? Number(endorsementDto.premiumDifference)
            : null,
          requestedBy: endorsementDto.requestedBy,
          requestedChanges: {
            type: endorsementDto.type,
            description: endorsementDto.description,
          },
        },
        include: {
          policy: { select: { policyNumber: true, customerName: true } },
        },
      });

      // Create status history
      await this.prisma.endorsementStatusHistory.create({
        data: {
          endorsementId: endorsement.id,
          fromStatus: 'CREATED',
          toStatus: EndorsementStatus.REQUESTED,
          changedBy: 'SYSTEM',
        },
      });

      this.logger.log(`✓ Endorsement created: ${endorsementCode}`);
      return endorsement;
    } catch (error) {
      this.logger.error(`Error creating endorsement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all endorsements with filters
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      policyId?: string;
      status?: EndorsementStatus;
      type?: EndorsementType;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.policyId) where.policyId = filters.policyId;
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      const [data, total] = await Promise.all([
        this.prisma.endorsement.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            policy: { select: { policyNumber: true, customerName: true } },
            documents: true,
          },
        }),
        this.prisma.endorsement.count({ where }),
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
      this.logger.error(`Error fetching endorsements: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single endorsement
   */
  async findOne(id: string): Promise<any> {
    try {
      const endorsement = await this.prisma.endorsement.findUniqueOrThrow({
        where: { id },
        include: {
          policy: true,
          documents: { orderBy: { createdAt: 'desc' } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      return endorsement;
    } catch (error) {
      this.logger.error(`Error fetching endorsement: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('Endorsement not found');
      }
      throw error;
    }
  }

  /**
   * Update endorsement status
   */
  async updateStatus(
    id: string,
    newStatus: EndorsementStatus,
    processedBy: string,
    reason?: string,
  ): Promise<any> {
    try {
      const endorsement = await this.findOne(id);

      const updated = await this.prisma.endorsement.update({
        where: { id },
        data: {
          status: newStatus,
          processedBy: newStatus === EndorsementStatus.COMPLETED ? processedBy : endorsement.processedBy,
          processedAt: newStatus === EndorsementStatus.COMPLETED ? new Date() : endorsement.processedAt,
        },
      });

      // Create status history
      await this.prisma.endorsementStatusHistory.create({
        data: {
          endorsementId: id,
          fromStatus: endorsement.status,
          toStatus: newStatus,
          changedBy: processedBy,
          reason,
        },
      });

      this.logger.log(`✓ Endorsement status updated: ${id} -> ${newStatus}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating endorsement status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload endorsement document
   */
  async uploadDocument(endorsementId: string, filePath: string, fileName: string, documentType: string): Promise<any> {
    try {
      await this.findOne(endorsementId);

      const doc = await this.prisma.endorsementDocument.create({
        data: {
          endorsementId,
          documentType,
          fileName,
          filePath,
        },
      });

      this.logger.log(`✓ Document uploaded for endorsement: ${endorsementId}`);
      return doc;
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign endorsement
   */
  async assignEndorsement(id: string, userId: string): Promise<any> {
    try {
      const endorsement = await this.findOne(id);

      const updated = await this.prisma.endorsement.update({
        where: { id },
        data: { assignedToUserId: userId },
      });

      this.logger.log(`✓ Endorsement assigned: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error assigning endorsement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process endorsement
   */
  async processEndorsement(id: string, processedBy: string, premiumDiff?: number): Promise<any> {
    try {
      const endorsement = await this.findOne(id);

      let additionalPremium = null;
      let refundAmount = null;

      if (premiumDiff !== undefined) {
        if (premiumDiff > 0) {
          additionalPremium = Number(premiumDiff);
        } else if (premiumDiff < 0) {
          refundAmount = Math.abs(Number(premiumDiff));
        }
      }

      const updated = await this.prisma.endorsement.update({
        where: { id },
        data: {
          status: EndorsementStatus.PROCESSED,
          additionalPremium,
          refundAmount,
          processedBy,
          processedAt: new Date(),
        },
      });

      // Create status history
      await this.prisma.endorsementStatusHistory.create({
        data: {
          endorsementId: id,
          fromStatus: endorsement.status,
          toStatus: EndorsementStatus.PROCESSED,
          changedBy: processedBy,
          reason: `Premium diff: ${premiumDiff}`,
        },
      });

      this.logger.log(`✓ Endorsement processed: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error processing endorsement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get endorsement analytics
   */
  async getEndorsementAnalytics(): Promise<any> {
    try {
      const [
        totalEndorsements,
        approvedCount,
        rejectedCount,
        pendingCount,
        endByType,
        endByStatus,
      ] = await Promise.all([
        this.prisma.endorsement.count(),
        this.prisma.endorsement.count({
          where: { status: EndorsementStatus.APPROVED },
        }),
        this.prisma.endorsement.count({
          where: { status: EndorsementStatus.REJECTED },
        }),
        this.prisma.endorsement.count({
          where: {
            status: {
              in: [
                EndorsementStatus.REQUESTED,
                EndorsementStatus.DOCUMENTS_PENDING,
                EndorsementStatus.UNDER_REVIEW,
              ],
            },
          },
        }),
        this.prisma.endorsement.groupBy({
          by: ['type'],
          _count: { id: true },
        }),
        this.prisma.endorsement.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      return {
        summary: {
          totalEndorsements,
          approvedCount,
          rejectedCount,
          pendingCount,
          approvalRate:
            totalEndorsements > 0
              ? ((approvedCount / totalEndorsements) * 100).toFixed(2)
              : 0,
        },
        byType: endByType,
        byStatus: endByStatus,
      };
    } catch (error) {
      this.logger.error(`Error fetching endorsement analytics: ${error.message}`);
      throw error;
    }
  }
}
