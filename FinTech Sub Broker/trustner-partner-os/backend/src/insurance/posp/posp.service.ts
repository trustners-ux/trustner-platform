import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePOSPDto } from './dto/create-posp.dto';
import { UpdatePOSPDto } from './dto/update-posp.dto';
import { POSPStatus, POSPCategory } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * POSP Management Service
 * Handles agent onboarding, training, certification, activation, and performance tracking
 * IRDAI-compliant POSP (Point of Sale Person) lifecycle management
 */
@Injectable()
export class POSPService {
  private readonly logger = new Logger('POSPService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique POSP agent code
   * Format: TIBPL-POSP-XXXXX
   */
  private async generateAgentCode(): Promise<string> {
    const count = await this.prisma.pOSPAgent.count();
    const seqNum = String(count + 1).padStart(5, '0');
    return `TIBPL-POSP-${seqNum}`;
  }

  /**
   * Register new POSP agent
   * Creates agent with APPLICATION_RECEIVED status
   */
  async registerPOSP(createDto: CreatePOSPDto, userId: string): Promise<any> {
    try {
      const agentCode = await this.generateAgentCode();

      // Check if email/phone already exists
      const existing = await this.prisma.pOSPAgent.findFirst({
        where: {
          OR: [{ email: createDto.email }, { phone: createDto.phone }],
        },
      });

      if (existing) {
        throw new ConflictException(
          'Agent with this email or phone already exists',
        );
      }

      const posp = await this.prisma.pOSPAgent.create({
        data: {
          userId,
          agentCode,
          category: createDto.category,
          status: POSPStatus.APPLICATION_RECEIVED,
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          dateOfBirth: new Date(createDto.dateOfBirth),
          gender: createDto.gender,
          email: createDto.email,
          phone: createDto.phone,
          panNumber: createDto.panNumber,
          aadhaarNumber: createDto.aadhaarNumber,
          addressLine1: createDto.addressLine1,
          addressLine2: createDto.addressLine2,
          city: createDto.city,
          state: createDto.state,
          pincode: createDto.pincode,
          branchId: createDto.branchId,
          reportingManagerId: createDto.reportingManagerId,
          regionId: createDto.regionId,
          remarks: createDto.remarks,
          subBrokerId: createDto.subBrokerId,
        },
      });

      this.logger.log(
        `✓ POSP agent registered: ${agentCode} (${posp.id})`,
      );

      return posp;
    } catch (error) {
      this.logger.error(`Error registering POSP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all POSPs with pagination and filters
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      status?: POSPStatus;
      category?: POSPCategory;
      branchId?: string;
      search?: string;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.category) where.category = filters.category;
      if (filters.branchId) where.branchId = filters.branchId;

      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { agentCode: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.pOSPAgent.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                policies: true,
                commissions: true,
                leads: true,
              },
            },
          },
        }),
        this.prisma.pOSPAgent.count({ where }),
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
      this.logger.error(`Error fetching POSPs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get full POSP profile with training records and documents
   */
  async findOne(id: string): Promise<any> {
    try {
      const posp = await this.prisma.pOSPAgent.findUniqueOrThrow({
        where: { id },
        include: {
          trainingRecords: {
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              policies: true,
              leads: true,
              commissions: true,
              payouts: true,
            },
          },
        },
      });

      // Calculate total training hours
      const totalTrainingHours = posp.trainingRecords.reduce(
        (sum, record) => sum + (record.isCompleted ? Number(record.moduleDuration) : 0),
        0,
      );

      return {
        ...posp,
        totalTrainingHours,
        trainingProgress: (totalTrainingHours / 15) * 100,
      };
    } catch (error) {
      this.logger.error(`Error fetching POSP: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('POSP agent not found');
      }
      throw error;
    }
  }

  /**
   * Update POSP profile details
   */
  async updateProfile(id: string, updateDto: UpdatePOSPDto): Promise<any> {
    try {
      await this.findOne(id); // Verify exists

      const posp = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          firstName: updateDto.firstName,
          lastName: updateDto.lastName,
          email: updateDto.email,
          phone: updateDto.phone,
          city: updateDto.city,
          state: updateDto.state,
          pincode: updateDto.pincode,
          remarks: updateDto.remarks,
        },
      });

      this.logger.log(`✓ POSP profile updated: ${id}`);
      return posp;
    } catch (error) {
      this.logger.error(`Error updating POSP profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update bank details for commission payout
   */
  async updateBankDetails(id: string, bankDetails: any): Promise<any> {
    try {
      await this.findOne(id); // Verify exists

      const posp = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          bankAccountName: bankDetails.bankAccountName,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankIfscCode: bankDetails.bankIfscCode,
          bankName: bankDetails.bankName,
        },
      });

      this.logger.log(`✓ Bank details updated for POSP: ${id}`);
      return posp;
    } catch (error) {
      this.logger.error(`Error updating bank details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start training - change status to TRAINING_IN_PROGRESS
   */
  async startTraining(id: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.APPLICATION_RECEIVED) {
        throw new BadRequestException(
          'Training can only be started from APPLICATION_RECEIVED status',
        );
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.TRAINING_IN_PROGRESS,
          trainingStartDate: new Date(),
        },
      });

      this.logger.log(`✓ Training started for POSP: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error starting training: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update training progress - mark module complete
   */
  async updateTrainingProgress(
    id: string,
    moduleTitle: string,
    data: {
      duration: number;
      score?: number;
      videoUrl?: string;
      materialUrl?: string;
    },
  ): Promise<any> {
    try {
      await this.findOne(id);

      // Create/update training record
      const record = await this.prisma.pOSPTrainingRecord.create({
        data: {
          pospId: id,
          moduleTitle,
          moduleDuration: data.duration,
          score: data.score,
          videoUrl: data.videoUrl,
          materialUrl: data.materialUrl,
          completedAt: new Date(),
          isCompleted: true,
        },
      });

      // Get total completed hours
      const records = await this.prisma.pOSPTrainingRecord.findMany({
        where: { pospId: id, isCompleted: true },
      });

      const totalHours = records.reduce((sum, r) => sum + Number(r.moduleDuration), 0);

      // Update POSP training hours
      await this.prisma.pOSPAgent.update({
        where: { id },
        data: { trainingHoursCompleted: totalHours },
      });

      this.logger.log(
        `✓ Training progress updated for POSP: ${id} (${totalHours} hours)`,
      );

      return { record, totalHours };
    } catch (error) {
      this.logger.error(`Error updating training progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete training - verify 15 hours done, change status
   */
  async completeTraining(id: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.TRAINING_IN_PROGRESS) {
        throw new BadRequestException(
          'Training can only be completed from TRAINING_IN_PROGRESS status',
        );
      }

      if (Number(posp.trainingHoursCompleted) < 15) {
        throw new BadRequestException(
          `Minimum 15 hours required. Currently completed: ${posp.trainingHoursCompleted} hours`,
        );
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.TRAINING_COMPLETED,
          trainingEndDate: new Date(),
        },
      });

      this.logger.log(`✓ Training completed for POSP: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error completing training: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule exam
   */
  async scheduleExam(id: string, examDate: Date): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.TRAINING_COMPLETED) {
        throw new BadRequestException(
          'Exam can only be scheduled after training completion',
        );
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          examDate,
          status: POSPStatus.EXAM_SCHEDULED,
        },
      });

      this.logger.log(`✓ Exam scheduled for POSP: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error scheduling exam: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record exam result
   */
  async recordExamResult(id: string, passed: boolean, score: number): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.EXAM_SCHEDULED) {
        throw new BadRequestException(
          'Exam result can only be recorded for scheduled exams',
        );
      }

      const newStatus = passed ? POSPStatus.EXAM_PASSED : POSPStatus.EXAM_FAILED;

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: newStatus,
          examScore: score,
          examAttempts: { increment: 1 },
        },
      });

      this.logger.log(
        `✓ Exam result recorded for POSP: ${id} - ${passed ? 'PASSED' : 'FAILED'} (${score}%)`,
      );

      return updated;
    } catch (error) {
      this.logger.error(`Error recording exam result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Issue certificate
   */
  async issueCertificate(id: string, certNumber: string, expiryDate: Date): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.EXAM_PASSED) {
        throw new BadRequestException(
          'Certificate can only be issued for agents who passed exam',
        );
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.CERTIFICATE_ISSUED,
          certificateNumber: certNumber,
          certificateIssuedAt: new Date(),
          certificateExpiryAt: expiryDate,
          irdaiLicenseDate: new Date(),
          irdaiExpiryDate: expiryDate,
        },
      });

      this.logger.log(`✓ Certificate issued for POSP: ${id} (${certNumber})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error issuing certificate: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activate POSP - final activation
   */
  async activate(id: string, approvedBy: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status !== POSPStatus.CERTIFICATE_ISSUED) {
        throw new BadRequestException(
          'POSP can only be activated after certificate issuance',
        );
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.ACTIVE,
          approvedAt: new Date(),
          approvedBy,
        },
      });

      this.logger.log(`✓ POSP activated: ${id} (Approved by: ${approvedBy})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error activating POSP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Suspend POSP
   */
  async suspend(id: string, reason: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      if (posp.status === POSPStatus.SUSPENDED) {
        throw new BadRequestException('POSP is already suspended');
      }

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.SUSPENDED,
          remarks: reason,
        },
      });

      this.logger.log(`✓ POSP suspended: ${id} - Reason: ${reason}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error suspending POSP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Terminate POSP
   */
  async terminate(id: string, reason: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      const updated = await this.prisma.pOSPAgent.update({
        where: { id },
        data: {
          status: POSPStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: reason,
        },
      });

      this.logger.log(`✓ POSP terminated: ${id} - Reason: ${reason}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error terminating POSP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get POSP performance metrics
   */
  async getPerformance(id: string): Promise<any> {
    try {
      const posp = await this.findOne(id);

      const [policies, commissions, activeCount] = await Promise.all([
        this.prisma.insurancePolicy.findMany({
          where: { pospId: id },
        }),
        this.prisma.insuranceCommission.findMany({
          where: { pospId: id, status: 'APPROVED' },
        }),
        this.prisma.insurancePolicy.count({
          where: {
            pospId: id,
            status: 'POLICY_ACTIVE',
          },
        }),
      ]);

      const totalPolicies = policies.length;
      const totalPremium = policies.reduce((sum, p) => sum + Number(p.netPremium), 0);
      const totalCommission = commissions.reduce(
        (sum, c) => sum + Number(c.pospCommissionAmt),
        0,
      );

      const renewalRate =
        totalPolicies > 0
          ? (
              (policies.filter((p) => p.renewalStatus !== null).length /
                totalPolicies) *
              100
            ).toFixed(2)
          : 0;

      return {
        pospId: id,
        agentCode: posp.agentCode,
        name: `${posp.firstName} ${posp.lastName}`,
        totalPoliciesSold: totalPolicies,
        activePolicies: activeCount,
        totalPremiumGenerated: totalPremium,
        totalCommissionEarned: totalCommission,
        averageCommissionPerPolicy:
          totalPolicies > 0 ? (totalCommission / totalPolicies).toFixed(2) : 0,
        renewalRate,
        status: posp.status,
      };
    } catch (error) {
      this.logger.error(`Error fetching POSP performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get POSP dashboard summary
   */
  async getPOSPDashboard(id: string): Promise<any> {
    try {
      const posp = await this.findOne(id);
      const today = dayjs();

      // Get current month
      const monthStart = today.startOf('month').toDate();
      const monthEnd = today.endOf('month').toDate();

      const [
        leadsNew,
        leadsPending,
        policiesMonth,
        commissionsMonth,
        renewalsUpcoming,
      ] = await Promise.all([
        this.prisma.insuranceLead.count({
          where: {
            pospId: id,
            status: 'NEW',
          },
        }),
        this.prisma.insuranceLead.count({
          where: {
            pospId: id,
            status: { in: ['CONTACTED', 'FOLLOW_UP', 'PROPOSAL_STAGE'] },
          },
        }),
        this.prisma.insurancePolicy.count({
          where: {
            pospId: id,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        this.prisma.insuranceCommission.aggregate({
          where: {
            pospId: id,
            periodMonth: today.month() + 1,
            periodYear: today.year(),
            status: 'APPROVED',
          },
          _sum: {
            netPayable: true,
          },
        }),
        this.prisma.renewalTracker.count({
          where: {
            pospId: id,
            status: { in: ['UPCOMING_30_DAYS', 'UPCOMING_15_DAYS', 'DUE'] },
          },
        }),
      ]);

      return {
        agent: {
          id: posp.id,
          agentCode: posp.agentCode,
          name: `${posp.firstName} ${posp.lastName}`,
          status: posp.status,
        },
        leads: {
          newLeads: leadsNew,
          pendingFollowUps: leadsPending,
        },
        policies: {
          policiesThisMonth: policiesMonth,
          totalActivePolicies: posp.activePolicies,
        },
        commissions: {
          commissionThisMonth: commissionsMonth._sum.netPayable || 0,
          totalEarned: posp.totalCommissionEarned,
        },
        renewals: {
          upcomingRenewals: renewalsUpcoming,
          renewalRate: posp.renewalRate,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching POSP dashboard: ${error.message}`);
      throw error;
    }
  }
}
