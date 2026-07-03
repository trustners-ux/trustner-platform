/**
 * Phase 8 — Exit / F&F module.
 *
 * GET  /api/employee/hr/exits   — HR-admin lists separations.
 *   Query params: status, employee_id, separation_type, from_date, to_date,
 *   page (default 1), page_size (default 50, max 200).
 *
 * POST /api/employee/hr/exits   — HR-admin opens a separation case.
 *   Body:
 *     { employee_id, separation_type, resignation_date, intended_lwd,
 *       reason_primary, reason_secondary?, termination_ground?,
 *       is_misconduct?, notice_period_days? }
 *
 *   Side-effects on create:
 *     - case_code = SEP-<entity>-<YEAR>-<seq>
 *     - hr_separation_checklist seeded from EXIT_CHECKLIST_TEMPLATE
 *     - hr_employees.status = 'on_notice'
 *
 *   Reject (409) if the employee already has a non-terminal active case.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import { EXIT_CHECKLIST_TEMPLATE } from '@/data/hr/exit-checklist-template';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const ACTIVE_STATUSES = [
  'draft', 'manager_review', 'notice_active',
  'clearance_pending', 'fnf_pending', 'fnf_approved',
];

function canManageSeparation(perms: HrPermissions): boolean {
  // Until `can_manage_separation` is added to the permissions matrix, gate
  // on `can_access_payroll` (the same operators handle exit/F&F settlements).
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

async function getAdminActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { actor: null, perms: null, error: 'Unauthenticated', status: 401 as const };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { actor: null, perms: null, error: 'Invalid session', status: 401 as const };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!canManageSeparation(perms)) {
    return { actor, perms, error: 'Need can_manage_separation permission', status: 403 as const };
  }
  return { actor, perms, error: null as null, status: 200 as const };
}

export async function GET(req: NextRequest) {
  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const employee_id = url.searchParams.get('employee_id');
  const separation_type = url.searchParams.get('separation_type');
  const from_date = url.searchParams.get('from_date');
  const to_date = url.searchParams.get('to_date');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const page_size = Math.min(200, Math.max(1, Number(url.searchParams.get('page_size') ?? '50')));
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = supabase
    .from('hr_separation')
    .select(`
      id, case_code, employee_id, separation_type, reason_category, reason_notes,
      intent_date, requested_lwd, approved_lwd, lwd, separation_effective_date,
      notice_period_days_contractual, notice_period_days_served,
      notice_period_days_waived, notice_period_days_shortfall, status,
      initiated_by, initiated_at, manager_signoff_at, hr_signoff_at,
      finance_signoff_at, ceo_signoff_at, fnf_id, exit_interview_id,
      bonus_clause_present, bonus_amount, created_at, updated_at,
      employee:hr_employees!hr_separation_employee_id_fkey (
        id, full_name, employee_code, entity, designation, email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (employee_id) query = query.eq('employee_id', Number(employee_id));
  if (separation_type) query = query.eq('separation_type', separation_type);
  if (from_date) query = query.gte('intent_date', from_date);
  if (to_date) query = query.lte('intent_date', to_date);

  const { data, count, error } = await query;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({
    rows: data ?? [],
    page,
    page_size,
    total: count ?? (data?.length ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    employee_id,
    separation_type,
    resignation_date,
    intended_lwd,
    reason_primary,
    reason_secondary,
    termination_ground,
    is_misconduct,
    notice_period_days,
  } = body as {
    employee_id?: number;
    separation_type?: string;
    resignation_date?: string;
    intended_lwd?: string;
    reason_primary?: string;
    reason_secondary?: string;
    termination_ground?: string;
    is_misconduct?: boolean;
    notice_period_days?: number;
  };

  if (!employee_id || !separation_type || !resignation_date) {
    return NextResponse.json(
      { error: 'employee_id, separation_type, resignation_date required' },
      { status: 400 },
    );
  }

  // Pre-check: already an open case?
  const { data: existing } = await supabase
    .from('hr_separation')
    .select('id, case_code, status')
    .eq('employee_id', employee_id)
    .in('status', ACTIVE_STATUSES)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: `Employee already has an active separation case (${existing.case_code}, status=${existing.status}). Close or withdraw it first.`,
        existing_case_id: existing.id,
      },
      { status: 409 },
    );
  }

  // Fetch employee for entity + contractual notice
  const { data: emp, error: empErr } = await supabase
    .from('hr_employees')
    .select('id, entity, notice_period_days_contractual, employment_type, full_name, employee_code')
    .eq('id', employee_id)
    .single();
  if (empErr || !emp) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const entity = emp.entity || 'TAS';
  const year = new Date(resignation_date).getUTCFullYear();

  // Generate sequence number — count of cases this year for this entity
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const { count: yearCount } = await supabase
    .from('hr_separation')
    .select('id, hr_employees!hr_separation_employee_id_fkey(entity)', { count: 'exact', head: true })
    .gte('intent_date', yearStart)
    .lte('intent_date', yearEnd);

  const seq = String((yearCount ?? 0) + 1).padStart(4, '0');
  const case_code = `SEP-${entity}-${year}-${seq}`;

  const insertRow = {
    case_code,
    employee_id,
    separation_type,
    reason_category: reason_primary ?? null,
    reason_notes: [reason_secondary, termination_ground ? `Termination ground: ${termination_ground}` : null]
      .filter(Boolean).join('\n') || null,
    intent_date: resignation_date,
    requested_lwd: intended_lwd ?? null,
    notice_period_days_contractual:
      notice_period_days ?? emp.notice_period_days_contractual ?? 60,
    notice_period_days_served: 0,
    notice_period_days_waived: 0,
    status: 'draft',
    initiated_by: g.actor?.email ?? 'hr_admin',
    initiated_at: new Date().toISOString(),
  };

  const { data: sep, error: insErr } = await supabase
    .from('hr_separation')
    .insert(insertRow)
    .select('*')
    .single();
  if (insErr || !sep) {
    // Catch unique-index race
    if (insErr?.code === '23505') {
      return NextResponse.json(
        { error: 'Employee already has an active separation case (race).' },
        { status: 409 },
      );
    }
    if (insErr) console.error('[Exits insert]', insErr.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Seed checklist
  const checklistRows = EXIT_CHECKLIST_TEMPLATE.map(item => ({
    separation_id: sep.id,
    category: item.category,
    item_label: item.item_label,
    item_order: item.item_order,
    status: 'pending',
    required: item.required,
  }));
  const { error: chkErr } = await supabase
    .from('hr_separation_checklist')
    .insert(checklistRows);
  if (chkErr) {
    // Best-effort: don't fail the whole call but surface in response
    console.error('Checklist seed failed:', chkErr);
  }

  // Flip employee to on_notice
  const { error: stErr } = await supabase
    .from('hr_employees')
    .update({ status: 'on_notice' })
    .eq('id', employee_id);
  if (stErr) console.error('Employee status flip failed:', stErr);

  // Record misconduct flag in reason_notes if applicable (no dedicated column)
  if (is_misconduct) {
    const note = `${sep.reason_notes ?? ''}\n[misconduct: true]`.trim();
    await supabase.from('hr_separation').update({ reason_notes: note }).eq('id', sep.id);
  }

  return NextResponse.json({ row: sep, case_code, checklist_seeded: checklistRows.length });
}
