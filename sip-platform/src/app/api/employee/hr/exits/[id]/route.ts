/**
 * GET    /api/employee/hr/exits/:id   — full case + checklist + fnf + interview + letters
 * PATCH  /api/employee/hr/exits/:id   — HR-admin updates editable fields
 * DELETE /api/employee/hr/exits/:id   — HR-admin deletes (only if status='draft')
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import { canTransition } from '@/lib/hr/separation-state';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function canManageSeparation(perms: HrPermissions): boolean {
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

async function loadActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return { actor, perms };
}

const EDITABLE_FIELDS_BY_STATUS: Record<string, string[]> = {
  draft: [
    'separation_type', 'reason_category', 'reason_notes',
    'intent_date', 'requested_lwd', 'approved_lwd',
    'notice_period_days_contractual', 'notice_period_days_served', 'notice_period_days_waived',
    'bonus_clause_present', 'bonus_amount', 'bonus_notes',
  ],
  manager_review: [
    'reason_notes', 'approved_lwd',
    'notice_period_days_served', 'notice_period_days_waived',
    'manager_signoff_by', 'manager_signoff_at',
    'bonus_clause_present', 'bonus_amount', 'bonus_notes',
  ],
  notice_active: [
    'reason_notes', 'approved_lwd', 'lwd',
    'notice_period_days_served', 'notice_period_days_waived',
    'bonus_clause_present', 'bonus_amount', 'bonus_notes',
    'hr_signoff_by', 'hr_signoff_at',
  ],
  clearance_pending: [
    'reason_notes', 'lwd', 'separation_effective_date',
    'notice_period_days_served', 'notice_period_days_waived',
    'bonus_clause_present', 'bonus_amount', 'bonus_notes',
    'hr_signoff_by', 'hr_signoff_at',
  ],
  fnf_pending: [
    'reason_notes',
    'bonus_clause_present', 'bonus_amount', 'bonus_notes',
    'finance_signoff_by', 'finance_signoff_at',
  ],
  fnf_approved: [
    'finance_signoff_by', 'finance_signoff_at',
    'ceo_signoff_by', 'ceo_signoff_at',
  ],
  fnf_disbursed: [],
  closed: [],
  withdrawn: [],
  rejected: [],
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: sep, error } = await supabase
    .from('hr_separation')
    .select(`
      *,
      employee:hr_employees!hr_separation_employee_id_fkey (
        id, full_name, employee_code, entity, designation, department, email,
        date_of_joining, employment_type, notice_period_days_contractual,
        pan, bank_account_number, bank_ifsc, bank_branch
      )
    `)
    .eq('id', sepId)
    .single();
  if (error || !sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Authorize: HR-admin OR employee-self
  const isAdmin = canManageSeparation(ctxAuth.perms);
  const isSelf =
    sep.employee?.email &&
    ctxAuth.actor.email.toLowerCase() === String(sep.employee.email).toLowerCase();
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [checklistRes, fnfRes, interviewRes, lettersRes] = await Promise.all([
    supabase
      .from('hr_separation_checklist')
      .select('*')
      .eq('separation_id', sepId)
      .order('category')
      .order('item_order'),
    sep.fnf_id
      ? supabase.from('hr_fnf').select('*').eq('id', sep.fnf_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sep.exit_interview_id
      ? supabase.from('hr_exit_interview').select('*').eq('id', sep.exit_interview_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('hr_letter_archive')
      .select('id, letter_type, recipient_name, serial_number, status, generated_by, generated_at')
      .eq('separation_id', sepId)
      .order('generated_at', { ascending: false }),
  ]);

  return NextResponse.json({
    row: sep,
    checklist: checklistRes.data ?? [],
    fnf: fnfRes.data ?? null,
    interview: interviewRes.data ?? null,
    letters: lettersRes.data ?? [],
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!canManageSeparation(ctxAuth.perms)) {
    return NextResponse.json({ error: 'Need can_manage_separation permission' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: cur, error: curErr } = await supabase
    .from('hr_separation').select('id, status').eq('id', sepId).single();
  if (curErr || !cur) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const allowed = EDITABLE_FIELDS_BY_STATUS[cur.status] ?? [];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }
  // Allow caller to supply a transition via this endpoint too (status field).
  if (body.status && body.status !== cur.status) {
    if (!canTransition(cur.status, body.status)) {
      return NextResponse.json(
        { error: `Illegal transition: ${cur.status} → ${body.status}` },
        { status: 422 },
      );
    }
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: `No editable fields for status='${cur.status}'.` },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('hr_separation').update(update).eq('id', sepId).select('*').single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ row: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!canManageSeparation(ctxAuth.perms)) {
    return NextResponse.json({ error: 'Need can_manage_separation permission' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: cur, error: curErr } = await supabase
    .from('hr_separation').select('id, status, employee_id').eq('id', sepId).single();
  if (curErr || !cur) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (cur.status !== 'draft') {
    return NextResponse.json(
      { error: `Only draft separations can be deleted. Current status: ${cur.status}.` },
      { status: 422 },
    );
  }

  const { error } = await supabase.from('hr_separation').delete().eq('id', sepId);
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Roll employee status back to active if no other active case
  const { data: other } = await supabase
    .from('hr_separation')
    .select('id')
    .eq('employee_id', cur.employee_id)
    .in('status', ['manager_review', 'notice_active', 'clearance_pending',
                   'fnf_pending', 'fnf_approved'])
    .limit(1);
  if (!other || other.length === 0) {
    await supabase.from('hr_employees').update({ status: 'active' }).eq('id', cur.employee_id);
  }

  return NextResponse.json({ ok: true });
}
