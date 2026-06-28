/**
 * Self-review API — employee-self only.
 *
 * GET   /api/employee/hr/performance/self-review?cycle_id=:id
 *   Returns existing hr_self_review row (or null) plus the employee's goals
 *   with self_rating + self_note filled in.
 *
 * POST  /api/employee/hr/performance/self-review
 *   Creates the hr_self_review row in 'draft' state if not present, and writes
 *   per-goal self_rating + self_note. Also accepts narrative fields.
 *   Body:
 *     {
 *       cycle_id,
 *       goals: [{ id, self_rating, self_note? }],
 *       narrative_strengths?, narrative_improvement?, narrative_career?,
 *       submit?: boolean        // if true, status flips to 'submitted'
 *                               // BUT only after an attestation is logged
 *     }
 *
 * PATCH /api/employee/hr/performance/self-review
 *   Same body but only writes narrative + per-goal fields. Cannot switch
 *   submit unless the cycle.status is self_review_open AND attestation_id
 *   is supplied.
 *
 * On submit:
 *   Writes hr_attestations row (attestation_type='manager_signoff' as a
 *   safe-superset since 'self_review' isn't in the CHECK list). Status
 *   flips to 'submitted' only after the attestation is logged with
 *   status='signed'. This mirrors the policy OTP-sign pattern (Phase 7).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { resolveActorEmployee } from '@/lib/hr/performance/route-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface GoalRating {
  id: number;
  self_rating?: number | null;
  self_note?: string | null;
  actual_value?: number | null;
}

export async function GET(req: NextRequest) {
  const r = await resolveActorEmployee(req);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  const url = new URL(req.url);
  const cycle_id = Number(url.searchParams.get('cycle_id') ?? '');
  if (!Number.isFinite(cycle_id) || cycle_id <= 0) {
    return NextResponse.json({ error: 'cycle_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: selfReview } = await supabase
    .from('hr_self_review')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', r.employee.id)
    .maybeSingle();

  const { data: goals } = await supabase
    .from('hr_goals')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', r.employee.id)
    .order('id', { ascending: true });

  return NextResponse.json({
    self_review: selfReview ?? null,
    goals: goals ?? [],
  });
}

async function upsertCore(
  req: NextRequest,
  forceCreate: boolean,
) {
  const r = await resolveActorEmployee(req);
  if (!r.ok) return { error: r.error, status: r.status };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const };

  const body = await req.json();
  const {
    cycle_id,
    goals,
    narrative_strengths,
    narrative_improvement,
    narrative_career,
    submit,
    attestation_id,
  } = body as {
    cycle_id?: number;
    goals?: GoalRating[];
    narrative_strengths?: string;
    narrative_improvement?: string;
    narrative_career?: string;
    submit?: boolean;
    attestation_id?: number;
  };

  if (!cycle_id) return { error: 'cycle_id required', status: 400 as const };

  const { data: cycle } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status')
    .eq('id', cycle_id)
    .single();
  if (!cycle) return { error: 'Cycle not found', status: 404 as const };

  if (cycle.status !== 'self_review_open' && cycle.status !== 'mid_year') {
    return {
      error: `Self-review requires cycle.status='self_review_open' (current: ${cycle.status})`,
      status: 422 as const,
    };
  }

  // Per-goal updates first
  let goals_updated = 0;
  if (Array.isArray(goals)) {
    for (const g of goals) {
      if (typeof g.self_rating === 'number' && (g.self_rating < 1 || g.self_rating > 5)) {
        return {
          error: `self_rating must be 1..5 for goal ${g.id}`,
          status: 400 as const,
        };
      }
      const goalUpdate: Record<string, unknown> = {};
      if ('self_rating' in g) goalUpdate.self_rating = g.self_rating ?? null;
      if ('self_note' in g) goalUpdate.self_note = g.self_note ?? null;
      if ('actual_value' in g) goalUpdate.actual_value = g.actual_value ?? null;
      if (Object.keys(goalUpdate).length === 0) continue;
      const { error: upErr } = await supabase
        .from('hr_goals')
        .update(goalUpdate)
        .eq('id', g.id)
        .eq('employee_id', r.employee.id);
      if (!upErr) goals_updated++;
    }
  }

  // Compute weighted-avg self rating
  let overall_self_rating: number | null = null;
  const { data: allGoals } = await supabase
    .from('hr_goals')
    .select('self_rating, weight')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', r.employee.id);
  if ((allGoals ?? []).length > 0) {
    let sumWR = 0;
    let sumW = 0;
    for (const x of (allGoals ?? []) as { self_rating: number | null; weight: number }[]) {
      if (x.self_rating == null) continue;
      sumWR += Number(x.self_rating) * Number(x.weight);
      sumW += Number(x.weight);
    }
    overall_self_rating = sumW > 0 ? Math.round((sumWR / sumW) * 100) / 100 : null;
  }

  // Upsert hr_self_review row
  const reviewPayload: Record<string, unknown> = {
    cycle_id,
    employee_id: r.employee.id,
    overall_self_rating,
  };
  if (narrative_strengths !== undefined) reviewPayload.narrative_strengths = narrative_strengths ?? null;
  if (narrative_improvement !== undefined) reviewPayload.narrative_improvement = narrative_improvement ?? null;
  if (narrative_career !== undefined) reviewPayload.narrative_career = narrative_career ?? null;

  // Existing row?
  const { data: existing } = await supabase
    .from('hr_self_review')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', r.employee.id)
    .maybeSingle();

  let row: Record<string, unknown> | null = null;
  if (existing) {
    if (existing.status === 'locked') {
      return { error: 'Self-review is locked', status: 422 as const };
    }
    const { data: upd, error: updErr } = await supabase
      .from('hr_self_review')
      .update(reviewPayload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (updErr) return { error: updErr.message, status: 500 as const };
    row = upd;
  } else if (forceCreate || submit) {
    reviewPayload.status = 'draft';
    const { data: ins, error: insErr } = await supabase
      .from('hr_self_review')
      .insert(reviewPayload)
      .select('*')
      .single();
    if (insErr) return { error: insErr.message, status: 500 as const };
    row = ins;
  } else {
    return { error: 'No self-review row yet — use POST to create.', status: 404 as const };
  }

  // Submit path: require attestation_id (per existing OTP-sign flow)
  if (submit) {
    if (!attestation_id) {
      return {
        error:
          'submit=true requires attestation_id from /api/employee/hr/policies/.../sign (verify-step).',
        status: 422 as const,
      };
    }
    const { data: att } = await supabase
      .from('hr_attestations')
      .select('id, employee_id, status')
      .eq('id', attestation_id)
      .single();
    if (!att || att.employee_id !== r.employee.id) {
      return { error: 'Invalid attestation_id', status: 422 as const };
    }
    if (att.status !== 'signed') {
      return {
        error: 'Attestation has not been OTP-verified (status != signed)',
        status: 422 as const,
      };
    }
    const { data: subRow, error: subErr } = await supabase
      .from('hr_self_review')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        attestation_id,
      })
      .eq('id', (row as { id: number }).id)
      .select('*')
      .single();
    if (subErr) return { error: subErr.message, status: 500 as const };
    row = subRow;
  }

  return { row, goals_updated };
}

export async function POST(req: NextRequest) {
  const r = await upsertCore(req, true);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}

export async function PATCH(req: NextRequest) {
  const r = await upsertCore(req, false);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
