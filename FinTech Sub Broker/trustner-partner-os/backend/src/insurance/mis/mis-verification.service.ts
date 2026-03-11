import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MISVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyEntry(entryId: string, checkerId: string, action: string, remarks?: string) {
    const entry = await this.prisma.mISEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('MIS entry not found');
    if (entry.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Entry is not pending verification');
    }
    if (entry.makerId === checkerId) {
      throw new ForbiddenException('Self-approval is not allowed');
    }

    // Check if user has checker role (or is SUPER_ADMIN)
    const user = await this.prisma.user.findUnique({ where: { id: checkerId } });
    if (user?.role !== 'SUPER_ADMIN') {
      const roleConfig = await this.prisma.mISRoleConfig.findFirst({
        where: {
          userId: checkerId,
          canCheck: true,
          isActive: true,
          OR: [{ department: entry.department as any }, { department: null }],
        },
      });
      if (!roleConfig) {
        throw new ForbiddenException('User does not have checker permission for this department');
      }
    }

    let newStatus: string;
    switch (action) {
      case 'APPROVED': newStatus = 'VERIFIED'; break;
      case 'REJECTED': newStatus = 'REJECTED'; break;
      case 'AMENDMENT_REQUESTED': newStatus = 'AMENDMENT_REQUESTED'; break;
      default: throw new BadRequestException('Invalid action. Must be APPROVED, REJECTED, or AMENDMENT_REQUESTED');
    }

    const [verification, updatedEntry] = await this.prisma.$transaction([
      this.prisma.mISVerification.create({
        data: {
          misEntryId: entryId,
          checkerId,
          checkerAction: action,
          remarks: remarks || null,
          previousStatus: entry.status,
          newStatus: newStatus as any,
        },
      }),
      this.prisma.mISEntry.update({
        where: { id: entryId },
        data: { status: newStatus as any },
        include: { verifications: { orderBy: { verifiedAt: 'desc' } } },
      }),
    ]);

    return updatedEntry;
  }

  async getPendingForChecker(checkerId: string, page = 1, limit = 20, department?: string) {
    const skip = (page - 1) * limit;

    // Get checker's departments from role config
    const roleConfigs = await this.prisma.mISRoleConfig.findMany({
      where: { userId: checkerId, canCheck: true, isActive: true },
    });

    const departments = roleConfigs
      .map((r) => r.department)
      .filter(Boolean);

    const where: any = { status: 'PENDING_VERIFICATION' };
    if (department) {
      where.department = department;
    } else if (departments.length > 0) {
      where.department = { in: departments };
    }
    // Exclude entries made by this checker
    where.makerId = { not: checkerId };

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

  async getVerificationHistory(entryId: string) {
    return this.prisma.mISVerification.findMany({
      where: { misEntryId: entryId },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  async assignMISRole(dto: {
    userId: string;
    department?: string;
    regionName?: string;
    canMake: boolean;
    canCheck: boolean;
    canViewReports: boolean;
    canManageContest: boolean;
    assignedBy: string;
  }) {
    return this.prisma.mISRoleConfig.upsert({
      where: {
        userId_department_regionName: {
          userId: dto.userId,
          department: (dto.department as any) || null,
          regionName: dto.regionName || null,
        },
      },
      update: {
        canMake: dto.canMake,
        canCheck: dto.canCheck,
        canViewReports: dto.canViewReports,
        canManageContest: dto.canManageContest,
        assignedBy: dto.assignedBy,
        isActive: true,
      },
      create: {
        userId: dto.userId,
        department: (dto.department as any) || null,
        regionName: dto.regionName || null,
        canMake: dto.canMake,
        canCheck: dto.canCheck,
        canViewReports: dto.canViewReports,
        canManageContest: dto.canManageContest,
        assignedBy: dto.assignedBy,
      },
    });
  }

  async getMISRoles(filters?: { userId?: string; department?: string }) {
    const where: any = { isActive: true };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.department) where.department = filters.department;
    return this.prisma.mISRoleConfig.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async removeMISRole(id: string) {
    return this.prisma.mISRoleConfig.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Auto-resolve checker for a maker based on:
   * 1. CheckerAssignmentRule (makerRole → checkerRole mapping)
   * 2. First try: maker's hierarchy parent if role matches
   * 3. Fallback: any user with checkerRole + canCheck=true for that department
   */
  async resolveChecker(makerId: string, department?: string): Promise<string | null> {
    try {
      // Get maker's role
      const maker = await this.prisma.user.findUnique({ where: { id: makerId } });
      if (!maker) return null;

      // Find matching assignment rule
      const rule = await this.prisma.checkerAssignmentRule.findFirst({
        where: {
          makerRole: maker.role,
          isActive: true,
          OR: [{ department: department as any }, { department: null }],
        },
        orderBy: { priority: 'asc' },
      });
      if (!rule) return null;

      // Try 1: maker's hierarchy parent
      const makerNode = await this.prisma.salesHierarchyNode.findFirst({
        where: { userId: makerId, isActive: true },
        include: { parent: { include: { user: true } } },
      });
      if (makerNode?.parent?.user && makerNode.parent.user.role === rule.checkerRole) {
        // Verify the parent has canCheck permission
        const parentConfig = await this.prisma.mISRoleConfig.findFirst({
          where: {
            userId: makerNode.parent.userId,
            canCheck: true,
            isActive: true,
            OR: [{ department: department as any }, { department: null }],
          },
        });
        if (parentConfig) return makerNode.parent.userId;
      }

      // Try 2: any user with checkerRole + canCheck=true
      const checkerConfig = await this.prisma.mISRoleConfig.findFirst({
        where: {
          canCheck: true,
          isActive: true,
          OR: [{ department: department as any }, { department: null }],
          userId: { not: makerId }, // Exclude self
        },
        include: { },
      });
      if (checkerConfig) {
        // Verify the user has the right role
        const checkerUser = await this.prisma.user.findUnique({ where: { id: checkerConfig.userId } });
        if (checkerUser?.role === rule.checkerRole || checkerUser?.role === 'SUPER_ADMIN') {
          return checkerConfig.userId;
        }
      }

      // Try 3: any canCheck user (broader search)
      const anyChecker = await this.prisma.mISRoleConfig.findFirst({
        where: {
          canCheck: true,
          isActive: true,
          userId: { not: makerId },
        },
      });
      return anyChecker?.userId || null;
    } catch {
      return null;
    }
  }
}
