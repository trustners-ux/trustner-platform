/**
 * Artefact-View Audit Log API
 *
 * GET /api/admin/audit/views
 *
 * Returns rows from app_artefact_views — every read of every
 * sensitive artefact (portfolio diagnostic, meeting brief, client
 * family, etc.) with viewer name + artefact label + scope used.
 *
 * Query params:
 *   employeeId      → only views by this viewer
 *   artefactType    → only this type
 *   artefactId      → only this specific artefact
 *   familyId        → only artefacts belonging to this family
 *   from / to       → ISO date range
 *   limit           → default 200, max 1000
 *
 * Distinct from the existing /api/admin/audit endpoint which logs
 * table-level CRUD changes. This one logs READS for compliance.
 *
 * Auth: principals OR can_view_pii.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

const VALID_TYPES = new Set([
  'portfolio_diagnostic',
  'meeting_brief',
  'investment_proposal',
  'client_orientation',
  'periodic_review',
  'client_family',
  'employee_profile',
]);

export async function GET(req: NextRequest) {
  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');
  const artefactType = url.searchParams.get('artefactType');
  const artefactId = url.searchParams.get('artefactId');
  const familyId = url.searchParams.get('familyId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200', 10), 1000);

  let q = supabase
    .from('app_artefact_views')
    .select(
      `id, viewer_employee_id, artefact_type, artefact_id, scope_used, viewed_at,
       viewer:employees!app_artefact_views_viewer_employee_id_fkey(name, email, designation)`
    )
    .order('viewed_at', { ascending: false })
    .limit(limit);

  if (employeeId) q = q.eq('viewer_employee_id', parseInt(employeeId, 10));
  if (artefactType && VALID_TYPES.has(artefactType)) q = q.eq('artefact_type', artefactType);
  if (artefactId) q = q.eq('artefact_id', parseInt(artefactId, 10));
  if (from) q = q.gte('viewed_at', from);
  if (to) q = q.lte('viewed_at', to);

  if (familyId) {
    const fid = parseInt(familyId, 10);
    const { data: pdRuns } = await supabase
      .from('pd_diagnostic_runs')
      .select('id')
      .eq('family_id', fid);
    const ids = (pdRuns ?? []).map((r) => r.id as number);
    if (ids.length === 0) return NextResponse.json({ views: [] });
    q = q.in('artefact_id', ids).eq('artefact_type', 'portfolio_diagnostic');
  }

  const { data: views, error } = await q;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Enrich PD diagnostic IDs with family + status
  const pdIds = (views ?? [])
    .filter((v) => v.artefact_type === 'portfolio_diagnostic')
    .map((v) => v.artefact_id as number);
  const pdMeta = new Map<number, { familyName: string; status: string }>();
  if (pdIds.length > 0) {
    const { data: pdRows } = await supabase
      .from('pd_diagnostic_runs')
      .select('id, family_name, status')
      .in('id', pdIds);
    for (const r of pdRows ?? []) {
      pdMeta.set(r.id as number, {
        familyName: (r.family_name as string) ?? '—',
        status: (r.status as string) ?? '—',
      });
    }
  }

  const result = (views ?? []).map((v) => {
    const viewerObj = (v as { viewer?: unknown }).viewer;
    const viewer = Array.isArray(viewerObj) ? viewerObj[0] : viewerObj;
    return {
      id: v.id as number,
      viewedAt: v.viewed_at as string,
      viewerId: v.viewer_employee_id as number,
      viewerName: (viewer as { name?: string } | undefined)?.name ?? '—',
      viewerEmail: (viewer as { email?: string } | undefined)?.email ?? '',
      viewerRole: (viewer as { designation?: string } | undefined)?.designation ?? '',
      artefactType: v.artefact_type as string,
      artefactId: v.artefact_id as number,
      artefactLabel:
        v.artefact_type === 'portfolio_diagnostic'
          ? pdMeta.get(v.artefact_id as number)?.familyName ?? `PD #${v.artefact_id}`
          : `${v.artefact_type} #${v.artefact_id}`,
      artefactStatus:
        v.artefact_type === 'portfolio_diagnostic'
          ? pdMeta.get(v.artefact_id as number)?.status ?? null
          : null,
      scopeUsed: (v.scope_used as string | null) ?? null,
    };
  });

  return NextResponse.json({ views: result });
}

async function authorize(): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
  const cookieStore = await cookies();
  let email: string | null = null;
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) return { allowed: false, status: 401, reason: 'Not authenticated' };
  if (APPROVER_EMAILS.includes(email.toLowerCase())) return { allowed: true };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };
  const { data: empRow } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!empRow?.id) return { allowed: false, status: 403, reason: 'Employee row not found' };
  const { data: roleRow } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(can_view_pii, can_manage_users)')
    .eq('employee_id', empRow.id)
    .eq('is_active', true)
    .maybeSingle();
  const role = (roleRow as { role?: unknown })?.role;
  const r = Array.isArray(role) ? role[0] : role;
  const allowed = Boolean(
    (r as { can_view_pii?: boolean; can_manage_users?: boolean } | undefined)?.can_view_pii ||
      (r as { can_manage_users?: boolean } | undefined)?.can_manage_users
  );
  if (!allowed) return { allowed: false, status: 403, reason: 'Need can_view_pii or can_manage_users' };
  return { allowed: true };
}
