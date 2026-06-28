/**
 * Skip-level (skip-manager) review API.
 *
 * Auth: HR-admin OR the skip-manager (= reporting_manager_email of the
 * employee's manager).
 *
 * GET   /api/employee/hr/performance/skip-review/:employee_id?cycle_id=:id
 *   Returns the hr_skip_review row (or null) plus the manager review
 *   and ratings snapshot used to calibrate.
 *
 * POST  /api/employee/hr/performance/skip-review/:employee_id
 *   Body: { cycle_id, calibrated_rating, calibration_note?, submit? }
 *   Creates / updates skip review. Calibrated rating is a NUMERIC(3,2)
 *   in 1.00–5.00.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getActorContext } from '@/lib/hr/performance/route-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function gateSkip(req: NextRequest, employeeId: number) {
  const a = await getActorContext(req);
  if (!a.ok) return a;
  if (a.ctx.isAdmin) {
    return { ok: true as const, actor_email: a.ctx.email, isAdmin: true };
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false as const, error: 'DB not configured', status: 503 as const };

  const { data: emp } = await supabase
    .from('hr_employees')
    .select('id, reporting_manager_id')
    .eq('id', employeeId)
    .maybeSingle();
  if (!emp) return { ok: false as const, error: 'Employee not found', status: 404 as const };

  // Walk up: skip-manager = manager of the employee's manager.
  if (!emp.reporting_manager_id) {
    return { ok: false as const, error: 'No manager on file', status: 422 as const };
  }
  const { data: mgr } = await supabase
    .from('hr_employees')
    .select('id, reporting_manager_id')
    .eq('id', emp.reporting_manager_id)
    .maybeSingle();
  if (!mgr?.reporting_manager_id) {
    return { ok: false as const, error: 'No skip-level manager on file', status: 422 as const };
  }
  const { data: skipMgr } = await supabase
    .from('hr_employees')
    .select('email')
    .eq('id', mgr.reporting_manager_id)
    .maybeSingle();
  const skipEmail = (skipMgr?.email ?? '').toLowerCase();
  if (skipEmail && skipEmail === a.ctx.email) {
    return { ok: true as const, actor_email: a.ctx.email, isAdmin: false };
  }
  return { ok: false as const, error: 'Not this employee’s skip-level manager', status: 403 as const };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ employee_id: string }> },
) {
  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  const g = await gateSkip(req, empId);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const url = new URL(req.url);
  const cycle_id = Number(url.searchParams.get('cycle_id') ?? '');
  if (!Number.isFinite(cycle_id)) {
    return NextResponse.json({ error: 'cycle_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const [{ data: skip }, { data: mgr }, { data: rating }] = await Promise.all([
    supabase
      .from('hr_skip_review')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('employee_id', empId)
      .maybeSingle(),
    supabase
      .from('hr_manager_review')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('employee_id', empId)
      .maybeSingle(),
    supabase
      .from('hr_rating')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('employee_id', empId)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    skip_review: skip ?? null,
    manager_review: mgr ?? null,
    rating: rating ?? null,
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ employee_id: string }> },
) {
  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  const g = await gateSkip(req, empId);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { cycle_id, calibrated_rating, calibration_note, submit } = body as {
    cycle_id?: number;
    calibrated_rating?: number | null;
    calibration_note?: string;
    submit?: boolean;
  };

  if (!cycle_id) return NextResponse.json({ error: 'cycle_id required' }, { status: 400 });
  if (
    calibrated_rating != null &&
    (calibrated_rating < 1 || calibrated_rating > 5)
  ) {
    return NextResponse.json({ error: 'calibrated_rating must be 1..5' }, { status: 400 });
  }

  const { data: cycle } = await supabase
    .from('hr_appraisal_cycle')
    .select('status')
    .eq('id', cycle_id)
    .single();
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  if (cycle.status !== 'skip_review_open' && cycle.status !== 'calibration') {
    return NextResponse.json(
      {
        error: `Skip-review requires cycle.status='skip_review_open' (current: ${cycle.status})`,
      },
      { status: 422 },
    );
  }

  const payload: Record<string, unknown> = {
    cycle_id,
    employee_id: empId,
    skip_email: g.actor_email,
    calibrated_rating: calibrated_rating ?? null,
    calibration_note: calibration_note ?? null,
  };
  if (submit) payload.submitted_at = new Date().toISOString();

  const { data: existing } = await supabase
    .from('hr_skip_review')
    .select('id')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId)
    .maybeSingle();

  let row;
  if (existing) {
    const { data, error } = await supabase
      .from('hr_skip_review')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  } else {
    const { data, error } = await supabase
      .from('hr_skip_review')
      .insert(payload)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  }

  return NextResponse.json({ row });
}
