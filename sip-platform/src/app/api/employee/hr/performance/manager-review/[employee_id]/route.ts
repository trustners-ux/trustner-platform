/**
 * Manager review API.
 *
 * Auth: HR-admin OR the employee's reporting manager
 *   (hr_employees.reporting_manager_email match against actor.email).
 *
 * GET   /api/employee/hr/performance/manager-review/:employee_id?cycle_id=:id
 *   Returns hr_manager_review (or null) + goals with manager_rating filled.
 *
 * POST  /api/employee/hr/performance/manager-review/:employee_id
 *   Creates the row in 'draft' if missing, writes per-goal manager_rating +
 *   manager_note, narrative + potential_rating + recommended_increment_pct.
 *
 * PATCH /api/employee/hr/performance/manager-review/:employee_id
 *   Updates existing draft row. Does NOT create.
 *
 * On submit (?submit=true on POST/PATCH body):
 *   Computes computeComplianceCap(employee_id). If capped:
 *     - overall_manager_rating ceiling = 3.0
 *     - per-goal manager_rating capped to 3
 *     - narrative_compensation flagged with cap reason list
 *   Flips status to 'submitted' + sets submitted_at.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  getActorContext,
  canManagePerformance,
} from '@/lib/hr/performance/route-auth';
import { computeComplianceCap, type CycleWindow } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface GoalManagerRating {
  id: number;
  manager_rating?: number | null;
  manager_note?: string | null;
}

async function gateManager(
  req: NextRequest,
  employeeId: number,
): Promise<
  | { ok: true; actor_email: string; isAdmin: boolean }
  | { ok: false; error: string; status: 401 | 403 | 404 | 503 }
> {
  const a = await getActorContext(req);
  if (!a.ok) return a;
  if (a.ctx.isAdmin) return { ok: true, actor_email: a.ctx.email, isAdmin: true };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: 'DB not configured', status: 503 };
  const { data: emp } = await supabase
    .from('hr_employees')
    .select('id, reporting_manager_id')
    .eq('id', employeeId)
    .maybeSingle();
  if (!emp) return { ok: false, error: 'Employee not found', status: 404 };
  if (emp.reporting_manager_id) {
    const { data: mgrRow } = await supabase
      .from('hr_employees')
      .select('email')
      .eq('id', emp.reporting_manager_id)
      .maybeSingle();
    const mgrEmail = (mgrRow?.email ?? '').toLowerCase();
    if (mgrEmail && mgrEmail === a.ctx.email) {
      return { ok: true, actor_email: a.ctx.email, isAdmin: false };
    }
  }
  return { ok: false, error: 'Not this employee’s manager', status: 403 };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ employee_id: string }> },
) {
  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  const g = await gateManager(req, empId);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const url = new URL(req.url);
  const cycle_id = Number(url.searchParams.get('cycle_id') ?? '');
  if (!Number.isFinite(cycle_id) || cycle_id <= 0) {
    return NextResponse.json({ error: 'cycle_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: mgrReview } = await supabase
    .from('hr_manager_review')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId)
    .maybeSingle();

  const { data: goals } = await supabase
    .from('hr_goals')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId)
    .order('id', { ascending: true });

  return NextResponse.json({
    manager_review: mgrReview ?? null,
    goals: goals ?? [],
  });
}

async function upsertCore(
  req: NextRequest,
  empId: number,
  forceCreate: boolean,
): Promise<
  | { row: Record<string, unknown>; goals_updated: number; capped: boolean; cap_reason: string[] }
  | { error: string; status: 400 | 401 | 403 | 404 | 422 | 500 | 503 }
> {
  const g = await gateManager(req, empId);
  if (!g.ok) return { error: g.error, status: g.status };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 };

  const body = await req.json();
  const {
    cycle_id,
    goals,
    narrative_strengths,
    narrative_improvement,
    narrative_potential,
    narrative_compensation,
    potential_rating,
    recommended_increment_pct,
    recommended_promotion,
    submit,
  } = body as {
    cycle_id?: number;
    goals?: GoalManagerRating[];
    narrative_strengths?: string;
    narrative_improvement?: string;
    narrative_potential?: string;
    narrative_compensation?: string;
    potential_rating?: number;
    recommended_increment_pct?: number;
    recommended_promotion?: boolean;
    submit?: boolean;
  };

  if (!cycle_id) return { error: 'cycle_id required', status: 400 };

  const { data: cycle } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status, start_date, end_date')
    .eq('id', cycle_id)
    .single();
  if (!cycle) return { error: 'Cycle not found', status: 404 };
  if (cycle.status !== 'manager_review_open' && cycle.status !== 'self_review_open') {
    return {
      error: `Manager-review requires cycle.status='manager_review_open' (current: ${cycle.status})`,
      status: 422,
    };
  }

  // Compute compliance cap up-front (used both for per-goal cap on submit and meta)
  const cap = await computeComplianceCap(empId, {
    cycle_id,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
  } as CycleWindow);

  // Per-goal updates
  let goals_updated = 0;
  if (Array.isArray(goals)) {
    for (const goal of goals) {
      if (typeof goal.manager_rating === 'number') {
        if (goal.manager_rating < 1 || goal.manager_rating > 5) {
          return { error: `manager_rating must be 1..5 for goal ${goal.id}`, status: 400 };
        }
      }
      const upd: Record<string, unknown> = {};
      if ('manager_rating' in goal) {
        const v = goal.manager_rating;
        upd.manager_rating =
          submit && cap.capped && typeof v === 'number' ? Math.min(v, 3) : v ?? null;
      }
      if ('manager_note' in goal) upd.manager_note = goal.manager_note ?? null;
      if (Object.keys(upd).length === 0) continue;
      const { error: gErr } = await supabase
        .from('hr_goals')
        .update(upd)
        .eq('id', goal.id)
        .eq('employee_id', empId);
      if (!gErr) goals_updated++;
    }
  }

  // Weighted overall manager rating from current goal rows
  const { data: allGoals } = await supabase
    .from('hr_goals')
    .select('manager_rating, weight')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId);
  let overall_manager_rating: number | null = null;
  if ((allGoals ?? []).length > 0) {
    let sumWR = 0;
    let sumW = 0;
    for (const x of (allGoals ?? []) as { manager_rating: number | null; weight: number }[]) {
      if (x.manager_rating == null) continue;
      sumWR += Number(x.manager_rating) * Number(x.weight);
      sumW += Number(x.weight);
    }
    overall_manager_rating = sumW > 0 ? Math.round((sumWR / sumW) * 100) / 100 : null;
  }
  // Ceiling at 3 on submit if capped
  if (submit && cap.capped && overall_manager_rating != null && overall_manager_rating > 3) {
    overall_manager_rating = 3;
  }

  // Upsert hr_manager_review
  const reviewPayload: Record<string, unknown> = {
    cycle_id,
    employee_id: empId,
    manager_email: g.actor_email,
    overall_manager_rating,
  };
  if (narrative_strengths !== undefined) reviewPayload.narrative_strengths = narrative_strengths ?? null;
  if (narrative_improvement !== undefined) reviewPayload.narrative_improvement = narrative_improvement ?? null;
  if (narrative_potential !== undefined) reviewPayload.narrative_potential = narrative_potential ?? null;
  if (narrative_compensation !== undefined) reviewPayload.narrative_compensation = narrative_compensation ?? null;
  if (potential_rating !== undefined) {
    if (potential_rating != null && (potential_rating < 1 || potential_rating > 5)) {
      return { error: 'potential_rating must be 1..5', status: 400 };
    }
    reviewPayload.potential_rating = potential_rating ?? null;
  }
  if (recommended_increment_pct !== undefined) reviewPayload.recommended_increment_pct = recommended_increment_pct ?? null;
  if (recommended_promotion !== undefined) reviewPayload.recommended_promotion = !!recommended_promotion;

  // If cap is active, annotate narrative_compensation with the reason list
  if (submit && cap.capped) {
    const baseline = (reviewPayload.narrative_compensation as string | undefined) ?? '';
    const flag = `[COMPLIANCE CAP] Rating ceiling=3.0. Reasons: ${cap.reason.join('; ')}`;
    reviewPayload.narrative_compensation = baseline ? `${baseline}\n${flag}` : flag;
  }

  const { data: existing } = await supabase
    .from('hr_manager_review')
    .select('id, status')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId)
    .maybeSingle();

  let row: Record<string, unknown> | null = null;
  if (existing) {
    if (existing.status === 'locked') {
      return { error: 'Manager review is locked', status: 422 };
    }
    const { data: upd, error: updErr } = await supabase
      .from('hr_manager_review')
      .update(reviewPayload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (updErr) return { error: updErr.message, status: 500 };
    row = upd;
  } else if (forceCreate || submit) {
    reviewPayload.status = 'draft';
    const { data: ins, error: insErr } = await supabase
      .from('hr_manager_review')
      .insert(reviewPayload)
      .select('*')
      .single();
    if (insErr) return { error: insErr.message, status: 500 };
    row = ins;
  } else {
    return { error: 'No manager-review row yet — use POST to create.', status: 404 };
  }

  if (submit) {
    const { data: subRow, error: subErr } = await supabase
      .from('hr_manager_review')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', (row as { id: number }).id)
      .select('*')
      .single();
    if (subErr) return { error: subErr.message, status: 500 };
    row = subRow;
  }

  return { row: row!, goals_updated, capped: cap.capped, cap_reason: cap.reason };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ employee_id: string }> }) {
  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  const out = await upsertCore(req, empId, true);
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(out);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ employee_id: string }> }) {
  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  const out = await upsertCore(req, empId, false);
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(out);
}

void canManagePerformance;
