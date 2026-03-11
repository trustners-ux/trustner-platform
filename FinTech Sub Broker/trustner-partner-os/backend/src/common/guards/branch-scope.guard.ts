import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Branch Scope Guard
 * Attaches branchScope to request based on user's hierarchy position:
 * - SUPER_ADMIN / PRINCIPAL_OFFICER: no restriction
 * - HEAD_OFFICE branch: no restriction
 * - REGIONAL_OFFICE: sees all branches in same state/region
 * - BRANCH / FRANCHISE: sees only own branch
 * - No branch assigned: no restriction (backward compatibility)
 */
@Injectable()
export class BranchScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    // Admin roles bypass branch scoping
    const bypassRoles = ['SUPER_ADMIN', 'PRINCIPAL_OFFICER'];
    if (bypassRoles.includes(user.role)) {
      request.branchScope = null;
      return true;
    }

    // Find user's hierarchy node with branch
    const node = await this.prisma.salesHierarchyNode.findFirst({
      where: { userId: user.id, isActive: true },
      include: { branch: true },
    });

    if (!node?.branchId || !node.branch) {
      // No branch assigned — no restriction for backward compat
      request.branchScope = null;
      return true;
    }

    const branch = node.branch;

    switch (branch.type) {
      case 'HEAD_OFFICE':
        // Head office sees everything
        request.branchScope = null;
        break;

      case 'REGIONAL_OFFICE': {
        // Regional office sees all branches in same state
        const regionalBranches = await this.prisma.branch.findMany({
          where: { state: branch.state, isActive: true },
          select: { id: true, name: true },
        });
        request.branchScope = {
          branchIds: regionalBranches.map((b) => b.id),
          branchNames: regionalBranches.map((b) => b.name),
          scopeType: 'REGIONAL',
          regionState: branch.state,
        };
        break;
      }

      case 'BRANCH':
      case 'FRANCHISE':
      default: {
        // Single branch restriction
        request.branchScope = {
          branchIds: [branch.id],
          branchNames: [branch.name],
          scopeType: 'BRANCH',
        };
        break;
      }
    }

    return true;
  }
}
