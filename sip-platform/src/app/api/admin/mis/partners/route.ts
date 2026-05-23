import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import {
  listPartners,
  createPartner,
  updatePartnerCategory,
  updatePartnerAgreement,
  upgradePartner,
  upgradeFranchiseToBQP,
  deactivatePartner,
  getPartnerStats,
  getPartner,
  getPOSPsUnderFranchise,
} from '@/lib/dal/partners';
import { getEmployees } from '@/lib/dal/employees';
import type { PartnerType, POSPCategory } from '@/lib/mis/types';
import {
  POSP_CATEGORY_ORDER,
  CATEGORY_APPROVAL_LIMITS,
} from '@/lib/mis/types';

// ─── Auth helper ───
type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

const EMPLOYEE_TO_ADMIN_ROLE: Record<string, AdminRole> = {
  bod: 'super_admin',
  cdo: 'admin',
  regional_manager: 'hr',
  branch_head: 'hr',
  cdm: 'editor',
  manager: 'editor',
  mentor: 'viewer',
  sr_rm: 'viewer',
  rm: 'viewer',
  back_office: 'viewer',
  support: 'viewer',
};

interface AuthUser {
  email: string;
  name: string;
  role: AdminRole;
  designation?: string;
}

async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // Try admin JWT first
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      return {
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as AdminRole,
      };
    }
  }

  // Fallback to employee JWT
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      return {
        email: payload.email as string,
        name: payload.name as string,
        role: EMPLOYEE_TO_ADMIN_ROLE[payload.role as string] || 'viewer',
        designation: payload.designation as string | undefined,
      };
    }
  }

  return null;
}

// ─── Category approval check ───
function getCategoryIndex(cat: POSPCategory): number {
  return POSP_CATEGORY_ORDER.indexOf(cat);
}

function canApproveCategory(user: AuthUser, targetCategory: POSPCategory): boolean {
  // Super Admin / Admin can approve anything
  if (user.role === 'super_admin' || user.role === 'admin') return true;

  // Check designation-based limits
  const designation = user.designation || '';
  const limit = CATEGORY_APPROVAL_LIMITS.find(
    (l) => l.designation.toLowerCase() === designation.toLowerCase()
  );
  if (!limit) return false;
  return getCategoryIndex(targetCategory) <= getCategoryIndex(limit.maxCategory);
}

// ─── GET: List partners with filters + stats ───
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as PartnerType | null;
    const managedById = searchParams.get('managedById');
    const isActive = searchParams.get('isActive');
    const city = searchParams.get('city');

    const partners = listPartners({
      type: type || undefined,
      managedById: managedById ? parseInt(managedById) : undefined,
      isActive: isActive !== null ? isActive === 'true' : undefined,
      city: city || undefined,
    });

    const stats = getPartnerStats();

    // Also return employees list for managing entity lookups
    const employees = await getEmployees({ isActive: true });

    return NextResponse.json({
      partners,
      stats,
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        employeeCode: e.employeeCode,
        designation: e.designation,
        segment: e.segment,
      })),
    });
  } catch (error) {
    console.error('[Partners API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

// ─── POST: Partner actions ───
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action field' }, { status: 400 });
    }

    switch (action) {
      // ─── Create Partner ───
      case 'create': {
        const { type, name, email, phone, franchiseSubType, managedByType, managedById, parentFranchiseId, agreementPct, location, city, notes } = body;
        if (!type || !name || !managedByType || managedById === undefined) {
          return NextResponse.json(
            { error: 'Required fields: type, name, managedByType, managedById' },
            { status: 400 }
          );
        }

        // Only admin+ can create partners
        if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'hr') {
          return NextResponse.json({ error: 'Insufficient permissions to create partners' }, { status: 403 });
        }

        const partner = createPartner({
          type,
          name,
          email,
          phone,
          franchiseSubType,
          managedByType,
          managedById: parseInt(managedById),
          parentFranchiseId: parentFranchiseId ? parseInt(parentFranchiseId) : undefined,
          agreementPct: agreementPct ? parseFloat(agreementPct) : undefined,
          location,
          city,
          notes,
        });

        console.log(`[Partners API] Created partner ${partner.code} (${partner.type}) by ${user.email}`);
        return NextResponse.json({ success: true, partner }, { status: 201 });
      }

      // ─── Update POSP Category ───
      case 'update_category': {
        const { partnerId, lob, newCategory } = body;
        if (!partnerId || !lob || !newCategory) {
          return NextResponse.json(
            { error: 'Required: partnerId, lob, newCategory' },
            { status: 400 }
          );
        }

        // Check approval authority
        if (!canApproveCategory(user, newCategory as POSPCategory)) {
          return NextResponse.json(
            { error: `You do not have authority to assign category ${newCategory}. Escalation required.` },
            { status: 403 }
          );
        }

        const updated = updatePartnerCategory(partnerId, lob, newCategory as POSPCategory);
        if (!updated) {
          return NextResponse.json({ error: 'Partner not found or not a POSP' }, { status: 404 });
        }

        console.log(`[Partners API] Updated category for partner #${partnerId} ${lob}=${newCategory} by ${user.email}`);
        return NextResponse.json({ success: true, partner: updated });
      }

      // ─── Update Agreement % ───
      case 'update_agreement': {
        const { partnerId: agreeId, newAgreementPct } = body;
        if (!agreeId || newAgreementPct === undefined) {
          return NextResponse.json(
            { error: 'Required: partnerId, newAgreementPct' },
            { status: 400 }
          );
        }

        // Only admin+ can change agreement %
        if (user.role !== 'super_admin' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only Admin/Super Admin can change agreement percentages' },
            { status: 403 }
          );
        }

        const partner = getPartner(agreeId);
        if (!partner) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        // Validate range for Franchise
        if (partner.type === 'Franchise') {
          const pct = parseFloat(newAgreementPct);
          if (pct < 80 || pct > 95) {
            return NextResponse.json(
              { error: 'Franchise agreement must be 80-95%' },
              { status: 400 }
            );
          }
          if (pct > 90 && user.role !== 'super_admin') {
            return NextResponse.json(
              { error: 'Agreement >90% requires Super Admin approval' },
              { status: 403 }
            );
          }
        }

        const updated = updatePartnerAgreement(agreeId, parseFloat(newAgreementPct));
        if (!updated) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        console.log(`[Partners API] Updated agreement for partner #${agreeId} to ${newAgreementPct}% by ${user.email}`);
        return NextResponse.json({ success: true, partner: updated });
      }

      // ─── Upgrade Partner Type ───
      case 'upgrade': {
        const { partnerId: upgradeId, newType, bqpCertDate, franchiseSubType: fSubType } = body;
        if (!upgradeId || !newType) {
          return NextResponse.json(
            { error: 'Required: partnerId, newType' },
            { status: 400 }
          );
        }

        // Only admin+ can upgrade
        if (user.role !== 'super_admin' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only Admin/Super Admin can upgrade partner types' },
            { status: 403 }
          );
        }

        const updated = upgradePartner(upgradeId, newType as PartnerType, {
          bqpCertDate,
          franchiseSubType: fSubType,
        });
        if (!updated) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        console.log(`[Partners API] Upgraded partner #${upgradeId} to ${newType} by ${user.email}`);
        return NextResponse.json({ success: true, partner: updated });
      }

      // ─── Upgrade Franchise to BQP ───
      case 'upgrade_to_bqp': {
        const { partnerId: bqpId, bqpCertDate: certDate } = body;
        if (!bqpId) {
          return NextResponse.json({ error: 'Required: partnerId' }, { status: 400 });
        }

        if (user.role !== 'super_admin' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only Admin/Super Admin can upgrade franchises to BQP' },
            { status: 403 }
          );
        }

        const updated = upgradeFranchiseToBQP(
          bqpId,
          certDate || new Date().toISOString().slice(0, 10)
        );
        if (!updated) {
          return NextResponse.json(
            { error: 'Partner not found or not a Franchise' },
            { status: 404 }
          );
        }

        console.log(`[Partners API] Upgraded franchise #${bqpId} to BQP by ${user.email}`);
        return NextResponse.json({ success: true, partner: updated });
      }

      // ─── Deactivate Partner ───
      case 'deactivate': {
        const { partnerId: deactivateId } = body;
        if (!deactivateId) {
          return NextResponse.json({ error: 'Required: partnerId' }, { status: 400 });
        }

        if (user.role !== 'super_admin' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only Admin/Super Admin can deactivate partners' },
            { status: 403 }
          );
        }

        // Check if franchise has POSPs under it
        const partner = getPartner(deactivateId);
        if (partner?.type === 'Franchise') {
          const pospsUnder = getPOSPsUnderFranchise(deactivateId);
          const activePosps = pospsUnder.filter((p) => p.isActive);
          if (activePosps.length > 0) {
            return NextResponse.json(
              { error: `Cannot deactivate franchise with ${activePosps.length} active POSPs. Reassign them first.` },
              { status: 400 }
            );
          }
        }

        const updated = deactivatePartner(deactivateId);
        if (!updated) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        console.log(`[Partners API] Deactivated partner #${deactivateId} by ${user.email}`);
        return NextResponse.json({ success: true, partner: updated });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Partners API] POST error:', error);
    return NextResponse.json(
      { error: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
