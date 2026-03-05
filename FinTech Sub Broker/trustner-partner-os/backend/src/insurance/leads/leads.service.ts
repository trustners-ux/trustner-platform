import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadStatus, InsuranceLOB, LeadSource } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Lead Management Service
 * Manages insurance sales funnel from lead creation to policy conversion
 * Tracks activities, quotes, and lead lifecycle
 */
@Injectable()
export class LeadsService {
  private readonly logger = new Logger('LeadsService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique lead code
   * Format: LEAD-INS-YYYYMMDD-XXXXX
   */
  private async generateLeadCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.insuranceLead.count({
      where: {
        leadCode: { startsWith: `LEAD-INS-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(5, '0');
    return `LEAD-INS-${datePrefix}-${seqNum}`;
  }

  /**
   * Create new lead
   */
  async createLead(createDto: CreateLeadDto, pospId?: string): Promise<any> {
    try {
      const leadCode = await this.generateLeadCode();

      const lead = await this.prisma.insuranceLead.create({
        data: {
          leadCode,
          lob: createDto.lob,
          source: createDto.source || LeadSource.OTHER,
          status: LeadStatus.NEW,
          customerName: createDto.customerName,
          customerPhone: createDto.customerPhone,
          customerEmail: createDto.customerEmail,
          customerCity: createDto.customerCity,
          customerState: createDto.customerState,
          customerPincode: createDto.customerPincode,
          dateOfBirth: createDto.dateOfBirth
            ? new Date(createDto.dateOfBirth)
            : null,
          productId: createDto.productId,
          pospId: pospId || createDto.pospId,
          vehicleRegNumber: createDto.vehicleRegNumber,
          vehicleMake: createDto.vehicleMake,
          vehicleModel: createDto.vehicleModel,
          vehicleVariant: createDto.vehicleVariant,
          vehicleYear: createDto.vehicleYear,
          vehicleFuelType: createDto.vehicleFuelType,
          previousInsurer: createDto.previousInsurer,
          previousPolicyExpiry: createDto.previousPolicyExpiry
            ? new Date(createDto.previousPolicyExpiry)
            : null,
          ncbPercentage: createDto.ncbPercentage
            ? Number(createDto.ncbPercentage)
            : null,
          idv: createDto.idv ? Number(createDto.idv) : null,
          membersCount: createDto.membersCount,
          membersDetails: createDto.membersDetails,
          sumInsuredRequired: createDto.sumInsuredRequired
            ? Number(createDto.sumInsuredRequired)
            : null,
          annualIncome: createDto.annualIncome
            ? Number(createDto.annualIncome)
            : null,
          smokingStatus: createDto.smokingStatus,
          coverRequired: createDto.coverRequired
            ? Number(createDto.coverRequired)
            : null,
          isRenewal: createDto.isRenewal || false,
          existingPolicyNumber: createDto.existingPolicyNumber,
        },
      });

      this.logger.log(`✓ Lead created: ${leadCode} (${lead.id})`);
      return lead;
    } catch (error) {
      this.logger.error(`Error creating lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all leads with filters and pagination
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      pospId?: string;
      status?: LeadStatus;
      lob?: InsuranceLOB;
      source?: LeadSource;
      search?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.pospId) where.pospId = filters.pospId;
      if (filters.status) where.status = filters.status;
      if (filters.lob) where.lob = filters.lob;
      if (filters.source) where.source = filters.source;

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      if (filters.search) {
        where.OR = [
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerPhone: { contains: filters.search, mode: 'insensitive' } },
          { customerEmail: { contains: filters.search, mode: 'insensitive' } },
          { leadCode: { contains: filters.search, mode: 'insensitive' } },
          {
            vehicleRegNumber: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.insuranceLead.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            posp: { select: { id: true, agentCode: true, firstName: true, lastName: true } },
            product: { select: { id: true, productName: true } },
            _count: {
              select: {
                activities: true,
                quotes: true,
              },
            },
          },
        }),
        this.prisma.insuranceLead.count({ where }),
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
      this.logger.error(`Error fetching leads: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single lead with activities and quotes
   */
  async findOne(id: string): Promise<any> {
    try {
      const lead = await this.prisma.insuranceLead.findUniqueOrThrow({
        where: { id },
        include: {
          activities: { orderBy: { createdAt: 'desc' } },
          quotes: { orderBy: { createdAt: 'desc' } },
          posp: { select: { id: true, agentCode: true, firstName: true, lastName: true } },
          product: true,
        },
      });

      return lead;
    } catch (error) {
      this.logger.error(`Error fetching lead: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('Lead not found');
      }
      throw error;
    }
  }

  /**
   * Update lead details
   */
  async updateLead(id: string, updateDto: Partial<CreateLeadDto>): Promise<any> {
    try {
      await this.findOne(id);

      const lead = await this.prisma.insuranceLead.update({
        where: { id },
        data: {
          customerName: updateDto.customerName,
          customerPhone: updateDto.customerPhone,
          customerEmail: updateDto.customerEmail,
          customerCity: updateDto.customerCity,
          customerState: updateDto.customerState,
          customerPincode: updateDto.customerPincode,
          vehicleRegNumber: updateDto.vehicleRegNumber,
          vehicleMake: updateDto.vehicleMake,
          vehicleModel: updateDto.vehicleModel,
          ncbPercentage: updateDto.ncbPercentage,
          idv: updateDto.idv ? Number(updateDto.idv) : undefined,
        },
      });

      this.logger.log(`✓ Lead updated: ${id}`);
      return lead;
    } catch (error) {
      this.logger.error(`Error updating lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update lead status with reason tracking
   */
  async updateStatus(
    id: string,
    newStatus: LeadStatus,
    reason?: string,
  ): Promise<any> {
    try {
      const lead = await this.findOne(id);

      const updated = await this.prisma.insuranceLead.update({
        where: { id },
        data: {
          status: newStatus,
          ...(reason && { followUpNotes: reason }),
        },
      });

      // Add activity log
      await this.addActivity(id, `STATUS_CHANGED_TO_${newStatus}`, reason, 'SYSTEM');

      this.logger.log(`✓ Lead status updated: ${id} -> ${newStatus}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating lead status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign lead to POSP
   */
  async assignLead(id: string, pospId: string): Promise<any> {
    try {
      const lead = await this.findOne(id);

      // Verify POSP exists
      await this.prisma.pOSPAgent.findUniqueOrThrow({ where: { id: pospId } });

      const updated = await this.prisma.insuranceLead.update({
        where: { id },
        data: { pospId },
      });

      await this.addActivity(id, 'ASSIGNED_TO_POSP', `Assigned to POSP ${pospId}`, 'SYSTEM');

      this.logger.log(`✓ Lead assigned to POSP: ${id} -> ${pospId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error assigning lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add activity log for lead
   */
  async addActivity(
    leadId: string,
    action: string,
    description?: string,
    performedBy: string = 'SYSTEM',
  ): Promise<any> {
    try {
      const activity = await this.prisma.leadActivity.create({
        data: {
          leadId,
          action,
          description,
          performedBy,
        },
      });

      return activity;
    } catch (error) {
      this.logger.error(`Error adding activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add insurance quote to lead
   */
  async addQuote(leadId: string, quoteDto: any): Promise<any> {
    try {
      await this.findOne(leadId);

      const quote = await this.prisma.insuranceQuote.create({
        data: {
          leadId,
          insurerName: quoteDto.insurerName,
          productName: quoteDto.productName,
          sumInsured: Number(quoteDto.sumInsured),
          premium: Number(quoteDto.premium),
          gst: Number(quoteDto.gst),
          totalPremium: Number(quoteDto.totalPremium),
          coverageDetails: quoteDto.coverageDetails,
          addOns: quoteDto.addOns,
          quoteRefId: quoteDto.quoteRefId,
          validTill: quoteDto.validTill ? new Date(quoteDto.validTill) : null,
        },
      });

      // Update lead status
      await this.updateStatus(leadId, LeadStatus.QUOTE_SHARED, 'Quote added');

      await this.addActivity(leadId, 'QUOTE_ADDED', `Quote from ${quoteDto.insurerName}`, 'SYSTEM');

      this.logger.log(`✓ Quote added to lead: ${leadId}`);
      return quote;
    } catch (error) {
      this.logger.error(`Error adding quote: ${error.message}`);
      throw error;
    }
  }

  /**
   * Select quote for lead
   */
  async selectQuote(leadId: string, quoteId: string): Promise<any> {
    try {
      await this.findOne(leadId);

      // Unselect all other quotes
      await this.prisma.insuranceQuote.updateMany({
        where: { leadId },
        data: { isSelected: false },
      });

      // Select this quote
      const quote = await this.prisma.insuranceQuote.update({
        where: { id: quoteId },
        data: { isSelected: true },
      });

      await this.updateStatus(
        leadId,
        LeadStatus.PROPOSAL_STAGE,
        'Quote selected for proposal',
      );

      await this.addActivity(
        leadId,
        'QUOTE_SELECTED',
        `Selected quote: ${quote.insurerName}`,
        'SYSTEM',
      );

      this.logger.log(`✓ Quote selected: ${leadId} -> ${quoteId}`);
      return quote;
    } catch (error) {
      this.logger.error(`Error selecting quote: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert lead to policy
   */
  async convertToPolicy(leadId: string): Promise<any> {
    try {
      const lead = await this.findOne(leadId);

      if (!lead.pospId) {
        throw new BadRequestException('Lead must be assigned to POSP first');
      }

      // Create policy from lead data
      const policy = await this.prisma.insurancePolicy.create({
        data: {
          policyNumber: `TIBPL-POL-${dayjs().format('YYYYMMDD')}-${Date.now()}`,
          internalRefCode: `TIBPL-POL-${dayjs().format('YYYYMMDD')}-${Date.now()}`,
          pospId: lead.pospId,
          companyId: '', // Will be set from quote
          productId: lead.productId || '',
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          customerEmail: lead.customerEmail,
          lob: lead.lob,
          sumInsured: lead.idv || lead.sumInsuredRequired || 0,
          basePremium: lead.quotedPremium || 0,
          gstAmount: 0,
          totalPremium: lead.quotedPremium || 0,
          netPremium: lead.quotedPremium || 0,
          status: 'QUOTE_GENERATED',
        },
      });

      // Update lead
      await this.prisma.insuranceLead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedPolicyId: policy.id,
        },
      });

      await this.addActivity(
        leadId,
        'CONVERTED_TO_POLICY',
        `Policy created: ${policy.policyNumber}`,
        'SYSTEM',
      );

      this.logger.log(`✓ Lead converted to policy: ${leadId} -> ${policy.id}`);
      return policy;
    } catch (error) {
      this.logger.error(`Error converting lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(filters: {
    fromDate?: Date;
    toDate?: Date;
    lob?: InsuranceLOB;
  }): Promise<any> {
    try {
      const where: any = {};
      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }
      if (filters.lob) where.lob = filters.lob;

      const [
        totalLeads,
        convertedLeads,
        lostLeads,
        leadsBySource,
        leadsByLOB,
        leadsByStatus,
      ] = await Promise.all([
        this.prisma.insuranceLead.count({ where }),
        this.prisma.insuranceLead.count({
          where: { ...where, status: LeadStatus.CONVERTED },
        }),
        this.prisma.insuranceLead.count({
          where: { ...where, status: LeadStatus.LOST },
        }),
        this.prisma.insuranceLead.groupBy({
          by: ['source'],
          where,
          _count: { id: true },
        }),
        this.prisma.insuranceLead.groupBy({
          by: ['lob'],
          where,
          _count: { id: true },
        }),
        this.prisma.insuranceLead.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
      ]);

      const conversionRate =
        totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

      return {
        summary: {
          totalLeads,
          convertedLeads,
          lostLeads,
          conversionRate: `${conversionRate}%`,
        },
        bySource: leadsBySource,
        byLOB: leadsByLOB,
        byStatus: leadsByStatus,
      };
    } catch (error) {
      this.logger.error(`Error fetching lead analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get follow-ups for POSP today
   */
  async getFollowUps(pospId: string, date: Date): Promise<any> {
    try {
      const startOfDay = dayjs(date).startOf('day').toDate();
      const endOfDay = dayjs(date).endOf('day').toDate();

      const leads = await this.prisma.insuranceLead.findMany({
        where: {
          pospId,
          followUpDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 5 },
          quotes: true,
        },
        orderBy: { followUpDate: 'asc' },
      });

      return {
        date: date.toISOString().split('T')[0],
        count: leads.length,
        leads,
      };
    } catch (error) {
      this.logger.error(`Error fetching follow-ups: ${error.message}`);
      throw error;
    }
  }
}
