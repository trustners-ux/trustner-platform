/**
 * Employee-self single exit-request endpoints.
 *
 * GET   /api/employee/hr/me/exit-request/:id
 *   Employee-self only. 404 if id doesn't belong to the signed-in employee.
 *
 * PATCH /api/employee/hr/me/exit-request/:id
 *   { action: 'withdraw', reason?: string }
 *   Allowed only when status is NOT in (fnf_approved, fnf_disbursed, closed).
 *   Sets status='withdrawn', stamps withdrawn_at + withdrawal_reason, and
 *   flips the employee status back to 'active'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const BLOCKED_FOR_WITHDRAWAL = new Set([
  'fnf_approved', 'fnf_disbursed', 'closed', 'withdrawn', 'rejected',
]);

async function loadEmployee(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { error: 'Unauthenticated', status: 401 as const, emp: null };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { error: 'Invalid session', status: 401 as const, emp: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const, emp: null };
  const { data: emp } = await supabase
    .from('hr_employees').select('id, email').eq('email', actor.email.toLowerCase()).maybeSingle();
  if (!emp) return { error: 'No employee record', status: 404 as const, emp: null };
  return { error: null as null, status: 200 as const, emp };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadEmployee(req);
  if (ctxAuth.error || !ctxAuth.emp) {
    return NextResponse.json({ error: ctxAuth.error ?? 'No employee' }, { status: ctxAuth.status });
  }
  const emp = ctxAuth.emp;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: sep, error } = await supabase
    .from('hr_separation').select('*').eq('id', sepId).single();
  if (error || !sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sep.employee_id !== emp.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Attach checklist + interview for the employee's own view
  const [checklistRes, interviewRes] = await Promise.all([
    supabase.from('hr_separation_checklist').select('*')
      .eq('separation_id', sepId).order('category').order('item_order'),
    sep.exit_interview_id
      ? supabase.from('hr_exit_interview').select('*').eq('id', sep.exit_interview_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    row: sep,
    checklist: checklistRes.data ?? [],
    interview: interviewRes.data ?? null,
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadEmployee(req);
  if (ctxAuth.error || !ctxAuth.emp) {
    return NextResponse.json({ error: ctxAuth.error ?? 'No employee' }, { status: ctxAuth.status });
  }
  const emp = ctxAuth.emp;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { action, reason } = body as { action?: string; reason?: string };
  if (action !== 'withdraw') {
    return NextResponse.json({ error: "Only action='withdraw' supported." }, { status: 400 });
  }

  const { data: sep, error: sepErr } = await supabase
    .from('hr_separation').select('id, employee_id, status').eq('id', sepId).single();
  if (sepErr || !sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sep.employee_id !== emp.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (BLOCKED_FOR_WITHDRAWAL.has(sep.status)) {
    return NextResponse.json(
      { error: `Cannot withdraw from status '${sep.status}'.` },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('hr_separation')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
      withdrawal_reason: reason ?? null,
    })
    .eq('id', sepId)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flip employee back to active
  await supabase.from('hr_employees')
    .update({ status: 'active' }).eq('id', emp.id);

  return NextResponse.json({ row: data });
}
