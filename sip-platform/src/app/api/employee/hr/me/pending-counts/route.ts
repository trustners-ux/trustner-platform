/**
 * GET /api/employee/hr/me/pending-counts
 *
 * Aggregate "needs your attention" counters that the HR sidebar surfaces as
 * little chips next to nav items. Pure read; cheap. Falls back to 0 on any
 * single sub-query failure so the sidebar never breaks because one table is
 * missing.
 *
 * Returns:
 *   {
 *     acks:        number,  // unsigned policy acknowledgements for THIS employee
 *     letters:     number,  // letters issued to THIS employee they haven't downloaded
 *     exits:       number,  // separations needing HR action  (HR-admin scope)
 *     approvals:   number,  // leave requests pending approval (manager scope)
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const out = { acks: 0, letters: 0, exits: 0, approvals: 0, notifications: 0 };
  try {
    const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
    const actor = tok ? await verifyEmployeeToken(tok) : null;
    if (!actor) return NextResponse.json(out);

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json(out);

    const perms = await getEffectivePermissions(actor.email, actor.role).catch(() => null);
    const isHrAdmin = perms?.can_access_payroll === true || perms?.can_access_employees === true;

    // Resolve employee id.
    let empId: number | null = null;
    try {
      const { data } = await supabase
        .from('hr_employees').select('id').eq('email', actor.email.toLowerCase()).maybeSingle();
      empId = (data?.id as number) ?? null;
    } catch { /* swallow */ }

    // Acks
    if (empId) {
      try {
        const { data: required } = await supabase
          .from('hr_policies').select('id, version').eq('requires_acknowledgement', true).eq('is_active', true);
        if (required?.length) {
          const { data: signed } = await supabase
            .from('hr_policy_acknowledgements').select('policy_id, policy_version').eq('employee_id', empId);
          const signedSet = new Set((signed || []).map((s: { policy_id: number; policy_version: string }) =>
            `${s.policy_id}:${s.policy_version}`));
          out.acks = required.filter((p: { id: number; version: string }) => !signedSet.has(`${p.id}:${p.version}`)).length;
        }
      } catch { /* swallow */ }
    }

    // Letters issued but not downloaded.
    if (empId) {
      try {
        const { count } = await supabase
          .from('hr_letter_archive').select('*', { count: 'exact', head: true })
          .eq('employee_id', empId).is('downloaded_at', null).eq('is_deleted', false);
        out.letters = count ?? 0;
      } catch { /* swallow */ }
    }

    // Unread notifications for THIS employee.
    if (empId) {
      try {
        const { count } = await supabase
          .from('hr_notifications').select('*', { count: 'exact', head: true })
          .eq('employee_id', empId).is('read_at', null);
        out.notifications = count ?? 0;
      } catch { /* swallow */ }
    }

    // Open separations (HR-admin scope).
    if (isHrAdmin) {
      try {
        const { count } = await supabase
          .from('hr_separation').select('*', { count: 'exact', head: true })
          .in('status', ['manager_review', 'clearance_pending', 'fnf_pending', 'fnf_approved']);
        out.exits = count ?? 0;
      } catch { /* swallow */ }
    }

    // Leave approvals pending where this user is the manager.
    try {
      const { count } = await supabase
        .from('hr_leave_requests').select('*', { count: 'exact', head: true })
        .eq('manager_email', actor.email.toLowerCase()).eq('status', 'pending');
      out.approvals = count ?? 0;
    } catch { /* swallow */ }

  } catch { /* swallow */ }
  return NextResponse.json(out);
}
