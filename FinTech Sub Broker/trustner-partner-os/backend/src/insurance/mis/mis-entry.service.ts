import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMISEntryDto } from './dto/create-mis-entry.dto';
import { UpdateMISEntryDto } from './dto/update-mis-entry.dto';
import { MISFilterDto } from './dto/mis-filter.dto';
import { MISVerificationService } from './mis-verification.service';

@Injectable()
export class MISEntryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MISVerificationService))
    private readonly verificationService: MISVerificationService,
  ) {}

  private getDepartment(lob: string): string {
    if (lob.startsWith('HEALTH_')) return 'HEALTH';
    if (lob.startsWith('LIFE_')) return 'LIFE';
    return 'GENERAL';
  }

  private generateMISCode(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `MIS-${date}-${rand}`;
  }

  private getEntryMonth(date?: Date): string {
    const d = date || new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private toDateOrNull(val: any): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private toDecimalOrNull(val: any): number | null {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  /**
   * Compute premium splits based on DST/POSP, renewal, and multi-year rules:
   * - Multi-year health: annualized = (netPremium / N) * 1.50
   * - DST new: netPremium100 = annualized (100% credit)
   * - POSP new: netPremium100 = annualized, netPremium70 = 70%, netPremium30 = 30%
   * - DST renewal: renewalPremium50 = annualized * 50% (50% of 100%)
   * - POSP renewal: renewalPremium50 = annualized * 70% * 50% = 35%
   */
  private computePremiumSplits(
    netPremium: number | null,
    policyTermYears: number,
    isDST: boolean,
    isRenewal: boolean,
  ) {
    if (!netPremium || netPremium <= 0) {
      return { annualizedPremium: null, netPremium100: null, netPremium70: null, netPremium30: null, renewalPremium50: null, renewalCreditPct: null };
    }

    const years = policyTermYears > 1 ? policyTermYears : 1;
    const annualizedPremium = years > 1
      ? (netPremium / years) * 1.50
      : netPremium;

    const netPremium100 = annualizedPremium;
    let netPremium70: number | null = null;
    let netPremium30: number | null = null;
    let renewalPremium50: number | null = null;
    let renewalCreditPct: number | null = null;

    if (isRenewal) {
      if (isDST) {
        // DST renewal: 50% of 100%
        renewalPremium50 = annualizedPremium * 0.50;
        renewalCreditPct = 50.0;
      } else {
        // POSP renewal: 50% of 70% = 35%
        renewalPremium50 = annualizedPremium * 0.70 * 0.50;
        renewalCreditPct = 35.0;
      }
    } else {
      if (!isDST) {
        // POSP new business: 70/30 split
        netPremium70 = annualizedPremium * 0.70;
        netPremium30 = annualizedPremium * 0.30;
      }
      // DST new business: gets 100% (netPremium100 only)
    }

    return {
      annualizedPremium: Math.round(annualizedPremium * 100) / 100,
      netPremium100: Math.round(netPremium100 * 100) / 100,
      netPremium70: netPremium70 ? Math.round(netPremium70 * 100) / 100 : null,
      netPremium30: netPremium30 ? Math.round(netPremium30 * 100) / 100 : null,
      renewalPremium50: renewalPremium50 ? Math.round(renewalPremium50 * 100) / 100 : null,
      renewalCreditPct,
    };
  }

  async createManualEntry(dto: CreateMISEntryDto, makerId: string) {
    const department = this.getDepartment(dto.lob);

    // Auto-detect entryMonth if not provided
    const entryMonth = dto.entryMonth || this.getEntryMonth(dto.entryDate ? new Date(dto.entryDate) : undefined);

    // Auto-detect policyCategory from isRenewal flag
    const policyCategory = dto.policyCategory || (dto.isRenewal ? 'RENEWAL' : 'NEW');

    // Look up product grade if policyId exists
    let productGrade = null;
    if (dto.policyId) {
      const policy = await this.prisma.insurancePolicy.findUnique({
        where: { id: dto.policyId },
        include: { product: { include: { grades: { where: { isActive: true }, take: 1 } } } },
      });
      if (policy?.product?.grades?.[0]) {
        productGrade = policy.product.grades[0].grade;
      }
    }

    // Find hierarchy node for POSP
    let hierarchyNodeId = null;
    if (dto.pospId) {
      const pospAgent = await this.prisma.pOSPAgent.findUnique({ where: { id: dto.pospId } });
      if (pospAgent?.userId) {
        const node = await this.prisma.salesHierarchyNode.findFirst({
          where: { userId: pospAgent.userId, isActive: true },
        });
        if (node) hierarchyNodeId = node.id;
      }
    }

    // Compute premium splits as server-side fallback
    const isDST = dto.isDST || false;
    const isRenewal = dto.isRenewal || false;
    const policyTermYears = dto.policyTermYears || 1;
    const netPremiumVal = this.toDecimalOrNull(dto.netPremium);
    const computed = this.computePremiumSplits(netPremiumVal, policyTermYears, isDST, isRenewal);

    // Use user-provided values if present, otherwise use computed fallbacks
    const finalNetPremium100 = this.toDecimalOrNull(dto.netPremium100) ?? computed.netPremium100;
    const finalNetPremium70 = this.toDecimalOrNull(dto.netPremium70) ?? computed.netPremium70;
    const finalNetPremium30 = this.toDecimalOrNull(dto.netPremium30) ?? computed.netPremium30;
    const finalRenewalPremium50 = this.toDecimalOrNull(dto.renewalPremium50) ?? computed.renewalPremium50;

    return this.prisma.mISEntry.create({
      data: {
        misCode: this.generateMISCode(),
        slNo: dto.slNo || null,
        policyId: dto.policyId || null,
        hierarchyNodeId,
        department: department as any,
        status: 'PENDING_VERIFICATION',

        // Entry Metadata
        entryDate: this.toDateOrNull(dto.entryDate) || new Date(),
        entryMonth,

        // Customer Details
        customerName: dto.customerName,
        customerPhone: dto.customerPhone || null,
        customerEmail: dto.customerEmail || null,
        insurerName: dto.insurerName || null,

        // Policy Details
        policyNumber: dto.policyNumber || null,
        productName: dto.productName || null,
        lob: dto.lob as any,
        policyType: dto.policyType || null,
        motorPolicyType: dto.motorPolicyType || null,
        policyCategory,
        productGrade: productGrade as any,
        sumInsured: this.toDecimalOrNull(dto.sumInsured),

        // Policy Dates
        policyStartDate: this.toDateOrNull(dto.policyStartDate),
        policyEndDate: this.toDateOrNull(dto.policyEndDate),
        issuedDate: this.toDateOrNull(dto.issuedDate),

        // Premium Breakdown
        odPremium: this.toDecimalOrNull(dto.odPremium),
        tpPremium: this.toDecimalOrNull(dto.tpPremium),
        grossPremium: this.toDecimalOrNull(dto.grossPremium),
        netPremium: netPremiumVal,
        gstAmount: this.toDecimalOrNull(dto.gstAmount),
        newPremium: this.toDecimalOrNull(dto.newPremium),

        // Commission Splits (auto-computed with fallback)
        netPremium100: finalNetPremium100,
        netPremium70: finalNetPremium70,
        netPremium30: finalNetPremium30,
        renewalPremium50: finalRenewalPremium50,
        commissionAmount: this.toDecimalOrNull(dto.commissionAmount),

        // Premium Auto-Calculation metadata
        policyTermYears,
        annualizedPremium: computed.annualizedPremium,
        renewalCreditPct: computed.renewalCreditPct,
        isDST,

        // Business Source & Sales
        referredBy: dto.referredBy || null,
        businessClosedBy: dto.businessClosedBy || null,
        agencyBroker: dto.agencyBroker || null,

        // Agent/POSP
        pospId: dto.pospId || null,
        pospName: dto.pospName || null,
        pospCode: dto.pospCode || null,

        // Location & Classification
        employeeLocation: dto.employeeLocation || null,
        branchName: dto.branchName || null,
        isRenewal,
        isNewCustomer: dto.isNewCustomer || false,

        // Motor-specific
        vehicleRegNo: dto.vehicleRegNo || null,
        vehicleMake: dto.vehicleMake || null,
        rtoLocation: dto.rtoLocation || null,

        // Payment Info
        paymentMode: dto.paymentMode || null,
        paymentReference: dto.paymentReference || null,

        sourceType: 'MANUAL',
        makerId,
        makerRemarks: dto.makerRemarks || null,
      },
      include: {
        policy: true,
        hierarchyNode: { include: { hierarchyLevel: true } },
      },
    });

    // Auto-assign checker based on maker role + hierarchy
    try {
      const checkerId = await this.verificationService.resolveChecker(makerId, department);
      if (checkerId) {
        await this.prisma.mISEntry.update({
          where: { id: entry.id },
          data: { assignedCheckerId: checkerId },
        });
        (entry as any).assignedCheckerId = checkerId;
      }
    } catch {
      // Non-blocking: if checker resolution fails, entry still created
    }

    return entry;
  }

  async createFromFileUpload(parsedRows: any[], batchId: string, makerId: string) {
    const requiredFields = ['customerName', 'lob'];
    const entries = [];
    let successCount = 0;
    let gapCount = 0;

    for (const row of parsedRows) {
      const missingFields = requiredFields.filter((f) => !row[f]);
      const optionalGaps = [
        'pospName', 'pospCode', 'policyNumber', 'insurerName', 'productName',
        'referredBy', 'businessClosedBy', 'employeeLocation',
      ].filter((f) => !row[f]);
      const allGaps = [...missingFields, ...optionalGaps];
      const hasRequiredGaps = missingFields.length > 0;

      const department = row.lob ? this.getDepartment(row.lob) : 'GENERAL';
      const entryMonth = row.entryMonth || this.getEntryMonth(row.entryDate ? new Date(row.entryDate) : undefined);
      const policyCategory = row.policyCategory || (row.isRenewal === true || row.isRenewal === 'true' ? 'RENEWAL' : 'NEW');

      const entry = await this.prisma.mISEntry.create({
        data: {
          misCode: this.generateMISCode(),
          slNo: row.slNo ? Number(row.slNo) : null,
          department: department as any,
          status: hasRequiredGaps ? 'DRAFT' : 'PENDING_VERIFICATION',

          // Entry Metadata
          entryDate: this.toDateOrNull(row.entryDate) || new Date(),
          entryMonth,

          // Customer Details
          customerName: row.customerName || 'UNKNOWN',
          customerPhone: row.customerPhone || row.contactNo || null,
          customerEmail: row.customerEmail || row.mailId || null,
          insurerName: row.insurerName || row.company || null,

          // Policy Details
          policyNumber: row.policyNumber || row.pNo || null,
          productName: row.productName || null,
          lob: (row.lob || 'OTHER') as any,
          policyType: row.policyType || null,
          motorPolicyType: row.motorPolicyType || row.typeOfMotorPolicy || null,
          policyCategory,
          sumInsured: this.toDecimalOrNull(row.sumInsured),

          // Policy Dates
          policyStartDate: this.toDateOrNull(row.policyStartDate || row.from),
          policyEndDate: this.toDateOrNull(row.policyEndDate || row.to),
          issuedDate: this.toDateOrNull(row.issuedDate),

          // Premium Breakdown
          odPremium: this.toDecimalOrNull(row.odPremium),
          tpPremium: this.toDecimalOrNull(row.tpPremium),
          grossPremium: this.toDecimalOrNull(row.grossPremium),
          netPremium: this.toDecimalOrNull(row.netPremium),
          gstAmount: this.toDecimalOrNull(row.gstAmount),
          newPremium: this.toDecimalOrNull(row.newPremium),

          // Commission Splits
          netPremium100: this.toDecimalOrNull(row.netPremium100),
          netPremium70: this.toDecimalOrNull(row.netPremium70),
          netPremium30: this.toDecimalOrNull(row.netPremium30),
          renewalPremium50: this.toDecimalOrNull(row.renewalPremium50),
          commissionAmount: this.toDecimalOrNull(row.commissionAmount),

          // Business Source & Sales
          referredBy: row.referredBy || null,
          businessClosedBy: row.businessClosedBy || null,
          agencyBroker: row.agencyBroker || null,

          // Agent/POSP
          pospId: row.pospId || null,
          pospName: row.pospName || null,
          pospCode: row.pospCode || null,

          // Location & Classification
          employeeLocation: row.employeeLocation || null,
          branchName: row.branchName || null,
          isRenewal: row.isRenewal === true || row.isRenewal === 'true',
          isNewCustomer: row.isNewCustomer === true || row.isNewCustomer === 'true',

          // Motor-specific
          vehicleRegNo: row.vehicleRegNo || null,
          vehicleMake: row.vehicleMake || null,
          rtoLocation: row.rtoLocation || null,

          // Payment Info
          paymentMode: row.paymentMode || null,
          paymentReference: row.paymentReference || null,

          sourceType: 'FILE_UPLOAD',
          uploadBatchId: batchId,
          gapFields: allGaps.length > 0 ? allGaps : null,
          gapResolved: allGaps.length === 0,
          makerId,
        },
      });

      entries.push({ entry, gaps: allGaps });
      if (hasRequiredGaps) gapCount++;
      else successCount++;
    }

    return { successCount, gapCount, totalRows: parsedRows.length, entries };
  }

  async resolveGaps(entryId: string, gapData: Record<string, any>, userId: string) {
    const entry = await this.prisma.mISEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('MIS entry not found');
    if (entry.status !== 'DRAFT') throw new BadRequestException('Only DRAFT entries can have gaps resolved');

    const updateData: any = { ...gapData, gapResolved: true, status: 'PENDING_VERIFICATION' };
    // Convert date strings
    const dateFields = ['policyStartDate', 'policyEndDate', 'issuedDate', 'entryDate'];
    dateFields.forEach((field) => {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
    });
    // Recalculate department if lob changed
    if (updateData.lob) updateData.department = this.getDepartment(updateData.lob);

    return this.prisma.mISEntry.update({
      where: { id: entryId },
      data: updateData,
      include: { policy: true, hierarchyNode: { include: { hierarchyLevel: true } } },
    });
  }

  async updateEntry(id: string, dto: UpdateMISEntryDto, userId: string) {
    const entry = await this.prisma.mISEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('MIS entry not found');
    if (!['DRAFT', 'REJECTED', 'AMENDMENT_REQUESTED'].includes(entry.status)) {
      throw new BadRequestException('Can only update DRAFT, REJECTED, or AMENDMENT_REQUESTED entries');
    }

    const data: any = { ...dto };
    // Convert date strings
    const dateFields = ['policyStartDate', 'policyEndDate', 'issuedDate', 'entryDate'];
    dateFields.forEach((field) => {
      if (data[field]) data[field] = new Date(data[field]);
    });
    if (dto.lob) data.department = this.getDepartment(dto.lob);
    // Re-submit for verification after amendment
    if (entry.status === 'AMENDMENT_REQUESTED' || entry.status === 'REJECTED') {
      data.status = 'PENDING_VERIFICATION';
    }

    return this.prisma.mISEntry.update({
      where: { id },
      data,
      include: { policy: true, hierarchyNode: { include: { hierarchyLevel: true } }, verifications: true },
    });
  }

  async findAll(filters: MISFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.department) where.department = filters.department;
    if (filters.status) where.status = filters.status;
    if (filters.lob) where.lob = filters.lob;
    if (filters.pospId) where.pospId = filters.pospId;
    if (filters.makerId) where.makerId = filters.makerId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    if (filters.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { policyNumber: { contains: filters.search, mode: 'insensitive' } },
        { pospName: { contains: filters.search, mode: 'insensitive' } },
        { misCode: { contains: filters.search, mode: 'insensitive' } },
        { referredBy: { contains: filters.search, mode: 'insensitive' } },
        { businessClosedBy: { contains: filters.search, mode: 'insensitive' } },
        { agencyBroker: { contains: filters.search, mode: 'insensitive' } },
        { employeeLocation: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.mISEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          hierarchyNode: { include: { hierarchyLevel: true } },
          verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mISEntry.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entry = await this.prisma.mISEntry.findUnique({
      where: { id },
      include: {
        policy: true,
        hierarchyNode: { include: { hierarchyLevel: true, user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } } },
        verifications: { orderBy: { verifiedAt: 'desc' } },
      },
    });
    if (!entry) throw new NotFoundException('MIS entry not found');
    return entry;
  }

  async getMyEntries(makerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.mISEntry.findMany({
        where: { makerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 } },
      }),
      this.prisma.mISEntry.count({ where: { makerId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPendingVerification(department?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'PENDING_VERIFICATION' };
    if (department) where.department = department;

    const [data, total] = await Promise.all([
      this.prisma.mISEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enteredAt: 'asc' },
        include: { hierarchyNode: { include: { hierarchyLevel: true } } },
      }),
      this.prisma.mISEntry.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDashboardStats(filters?: { department?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.department) where.department = filters.department;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [totalEntries, draftCount, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      this.prisma.mISEntry.count({ where }),
      this.prisma.mISEntry.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.mISEntry.count({ where: { ...where, status: 'PENDING_VERIFICATION' } }),
      this.prisma.mISEntry.count({ where: { ...where, status: 'VERIFIED' } }),
      this.prisma.mISEntry.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    const premiumAgg = await this.prisma.mISEntry.aggregate({
      where: { ...where, status: 'VERIFIED' },
      _sum: {
        grossPremium: true,
        netPremium: true,
        commissionAmount: true,
        odPremium: true,
        tpPremium: true,
        newPremium: true,
        netPremium100: true,
        netPremium70: true,
        netPremium30: true,
        renewalPremium50: true,
      },
    });

    const departmentBreakdown = await this.prisma.mISEntry.groupBy({
      by: ['department'],
      where,
      _count: { id: true },
      _sum: { grossPremium: true, netPremium: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = await this.prisma.mISEntry.count({
      where: { ...where, createdAt: { gte: today } },
    });

    return {
      totalEntries,
      draftCount,
      pendingCount,
      verifiedCount,
      rejectedCount,
      totalPremium: premiumAgg._sum.grossPremium || 0,
      totalNetPremium: premiumAgg._sum.netPremium || 0,
      totalCommission: premiumAgg._sum.commissionAmount || 0,
      totalOdPremium: premiumAgg._sum.odPremium || 0,
      totalTpPremium: premiumAgg._sum.tpPremium || 0,
      totalNewPremium: premiumAgg._sum.newPremium || 0,
      netPremium100Total: premiumAgg._sum.netPremium100 || 0,
      netPremium70Total: premiumAgg._sum.netPremium70 || 0,
      netPremium30Total: premiumAgg._sum.netPremium30 || 0,
      renewalPremium50Total: premiumAgg._sum.renewalPremium50 || 0,
      departmentBreakdown: departmentBreakdown.map((d) => ({
        department: d.department,
        count: d._count.id,
        premium: d._sum.grossPremium || 0,
        netPremium: d._sum.netPremium || 0,
      })),
      todayEntries,
    };
  }
}
