import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { verifyEmployeeToken } from '@/lib/auth/employee-jwt';
import { canAccess, type AdminRole } from '@/lib/auth/config';
import { writeAuditLog } from '@/lib/dal/audit';

// ─── Auth helper ───
async function getAuthUser(): Promise<{ email: string; name: string; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin-session')?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return { email: payload.email as string, name: payload.name as string, role: payload.role as AdminRole };
  }
  const empToken = cookieStore.get('employee-session')?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      const roleMap: Record<string, AdminRole> = { bod: 'super_admin', cdo: 'admin', regional_manager: 'hr', branch_head: 'hr', cdm: 'editor', manager: 'editor' };
      return { email: payload.email as string, name: payload.name as string, role: roleMap[payload.role as string] || 'viewer' };
    }
  }
  return null;
}

// ─── Employee roles hierarchy (lowest → highest) ───
const ROLE_HIERARCHY = [
  'support', 'back_office', 'rm', 'sr_rm', 'mentor',
  'manager', 'cdm', 'branch_head', 'regional_manager', 'cdo', 'bod',
] as const;
type EmployeeRole = typeof ROLE_HIERARCHY[number];

// ─── Who can change roles to what level ───
// Admin/Super Admin: can change ANY role
// HR, CDO, Principal Officer: can change up to RM level
// CDM and above: need approval (creates pending request)
const RM_LEVEL_MAX_INDEX = 2; // up to 'rm' in hierarchy

function canDirectlyChangeRole(changerRole: AdminRole, targetRole: EmployeeRole): boolean {
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);

  if (changerRole === 'super_admin' || changerRole === 'admin') return true;
  if (changerRole === 'hr') return targetIndex <= RM_LEVEL_MAX_INDEX;
  return false;
}

function needsApproval(changerRole: AdminRole, targetRole: EmployeeRole): boolean {
  if (changerRole === 'super_admin' || changerRole === 'admin') return false;
  if (changerRole === 'hr') {
    return ROLE_HIERARCHY.indexOf(targetRole) > RM_LEVEL_MAX_INDEX;
  }
  return true; // All other roles always need approval
}

// In-memory pending role change requests (will migrate to Supabase)
interface RoleChangeRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  currentRole: string;
  requestedRole: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
}

let roleChangeRequests: RoleChangeRequest[] = [];
let nextRequestId = 1;

// ─── GET: List role change requests + current roles ───
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !canAccess(user.role, 'hr')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';

  let requests = [...roleChangeRequests];
  if (status !== 'all') {
    requests = requests.filter(r => r.status === status);
  }

  return NextResponse.json({
    requests: requests.sort((a, b) => b.id - a.id),
    total: requests.length,
    roleHierarchy: ROLE_HIERARCHY,
  });
}

// ─── POST: Change role or create approval request ───
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !canAccess(user.role, 'hr')) {
    return NextResponse.json({ error: 'Unauthorized — HR or above required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // ─── Change Role ───
    if (action === 'change_role') {
      const { employeeId, employeeName, currentRole, newRole, reason } = body;

      if (!employeeId || !newRole) {
        return NextResponse.json({ error: 'employeeId and newRole are required' }, { status: 400 });
      }

      if (!ROLE_HIERARCHY.includes(newRole)) {
        return NextResponse.json({ error: `Invalid role: ${newRole}` }, { status: 400 });
      }

      // Check if direct change or needs approval
      if (canDirectlyChangeRole(user.role, newRole)) {
        // Direct role change
        await writeAuditLog({
          tableName: 'employees',
          recordId: employeeId,
          action: 'UPDATE',
          changedBy: user.email,
          oldValues: { role: currentRole },
          newValues: { role: newRole },
          reason: reason || `Role changed from ${currentRole} to ${newRole}`,
        });

        return NextResponse.json({
          success: true,
          directChange: true,
          message: `Role changed to ${newRole} successfully.`,
        });
      }

      // Needs approval — create request
      if (needsApproval(user.role, newRole)) {
        const req: RoleChangeRequest = {
          id: nextRequestId++,
          employeeId,
          employeeName: employeeName || `Employee #${employeeId}`,
          currentRole: currentRole || 'unknown',
          requestedRole: newRole,
          requestedBy: user.email,
          requestedByName: user.name,
          requestedAt: new Date().toISOString(),
          status: 'pending',
          reason,
        };
        roleChangeRequests.push(req);

        await writeAuditLog({
          tableName: 'employees',
          recordId: employeeId,
          action: 'UPDATE',
          changedBy: user.email,
          oldValues: { role: currentRole },
          newValues: { requestedRole: newRole, status: 'pending_approval' },
          reason: `Role change request: ${currentRole} → ${newRole}`,
        });

        return NextResponse.json({
          success: true,
          directChange: false,
          needsApproval: true,
          requestId: req.id,
          message: `Role change to ${newRole} requires Admin/Super Admin approval. Request #${req.id} created.`,
        });
      }

      return NextResponse.json({ error: 'Insufficient permissions for this role change' }, { status: 403 });
    }

    // ─── Approve Role Change ───
    if (action === 'approve_request') {
      if (user.role !== 'super_admin' && user.role !== 'admin') {
        return NextResponse.json({ error: 'Only Admin/Super Admin can approve role changes' }, { status: 403 });
      }

      const { requestId } = body;
      const req = roleChangeRequests.find(r => r.id === requestId);
      if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      if (req.status !== 'pending') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

      req.status = 'approved';
      req.reviewedBy = user.email;
      req.reviewedAt = new Date().toISOString();

      await writeAuditLog({
        tableName: 'employees',
        recordId: req.employeeId,
        action: 'APPROVE',
        changedBy: user.email,
        oldValues: { role: req.currentRole },
        newValues: { role: req.requestedRole },
        reason: `Role change approved: ${req.currentRole} → ${req.requestedRole}`,
      });

      return NextResponse.json({ success: true, message: `Request #${requestId} approved. Role changed to ${req.requestedRole}.` });
    }

    // ─── Reject Role Change ───
    if (action === 'reject_request') {
      if (user.role !== 'super_admin' && user.role !== 'admin') {
        return NextResponse.json({ error: 'Only Admin/Super Admin can reject role changes' }, { status: 403 });
      }

      const { requestId, reason } = body;
      const req = roleChangeRequests.find(r => r.id === requestId);
      if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      if (req.status !== 'pending') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

      req.status = 'rejected';
      req.reviewedBy = user.email;
      req.reviewedAt = new Date().toISOString();
      req.reason = reason || req.reason;

      await writeAuditLog({
        tableName: 'employees',
        recordId: req.employeeId,
        action: 'REJECT',
        changedBy: user.email,
        oldValues: { requestedRole: req.requestedRole },
        newValues: { role: req.currentRole, status: 'rejected' },
        reason: reason || `Role change rejected: ${req.currentRole} → ${req.requestedRole}`,
      });

      return NextResponse.json({ success: true, message: `Request #${requestId} rejected.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[RoleManagement]', err);
    return NextResponse.json({ error: 'Failed to process role change' }, { status: 500 });
  }
}
