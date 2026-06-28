/**
 * Employee Self-Service — My Appraisal.
 *
 * GET  /api/employee/hr/me/appraisal
 *   Returns the active (or most-recent) appraisal snapshot for the signed-in
 *   employee:
 *     {
 *       cycle,
 *       goals[],
 *       self_review,
 *       manager_review_summary,    // narrative + overall only — no manager identity
 *       skip_review_summary,       // calibrated_rating + note only
 *       rating                     // null unless cycle published
 *     }
 *
 *   "Active" = whichever cycle has the employee's most recent goals row that
 *   isn't archived. We surface published cycles too so the employee can
 *   see their letter / final rating after publish.
 *
 * POST /api/employee/hr/me/appraisal
 *   Convenience proxy → /api/employee/hr/performance/self-review POST.
 *   Lets the personal dashboard submit self-review without knowing the
 *   internal endpoint. Body is forwarded as-is.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { resolveActorEmployee } from '@/lib/hr/performance/route-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const r = await resolveActorEmployee(req);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // Pick the most recent non-archived cycle in which the employee has goals.
  const { data: goalRows } = await supabase
    .from('hr_goals')
    .select('cycle_id')
    .eq('employee_id', r.employee.id);
  const cycleIds = Array.from(
    new Set((goalRows ?? []).map((x: { cycle_id: number }) => x.cycle_id)),
  );

  if (cycleIds.length === 0) {
    return NextResponse.json({
      cycle: null,
      goals: [],
      self_review: null,
      manager_review_summary: null,
      skip_review_summary: null,
      rating: null,
    });
  }

  const { data: cycles } = await supabase
    .from('hr_appraisal_cycle')
    .select('*')
    .in('id', cycleIds)
    .neq('status', 'archived')
    .order('start_date', { ascending: false })
    .limit(1);

  const cycle = (cycles ?? [])[0] ?? null;
  if (!cycle) {
    return NextResponse.json({
      cycle: null,
      goals: [],
      self_review: null,
      manager_review_summary: null,
      skip_review_summary: null,
      rating: null,
    });
  }

  const [
    { data: goals },
    { data: selfReview },
    { data: mgrReview },
    { data: skipReview },
    { data: rating },
  ] = await Promise.all([
    supabase
      .from('hr_goals')
      .select('*')
      .eq('cycle_id', cycle.id)
      .eq('employee_id', r.employee.id)
      .order('id', { ascending: true }),
    supabase
      .from('hr_self_review')
      .select('*')
      .eq('cycle_id', cycle.id)
      .eq('employee_id', r.employee.id)
      .maybeSingle(),
    supabase
      .from('hr_manager_review')
      .select(
        'overall_manager_rating, potential_rating, narrative_strengths, narrative_improvement, narrative_potential, narrative_compensation, recommended_promotion, status, submitted_at',
      )
      .eq('cycle_id', cycle.id)
      .eq('employee_id', r.employee.id)
      .maybeSingle(),
    supabase
      .from('hr_skip_review')
      .select('calibrated_rating, calibration_note, submitted_at')
      .eq('cycle_id', cycle.id)
      .eq('employee_id', r.employee.id)
      .maybeSingle(),
    supabase
      .from('hr_rating')
      .select('*')
      .eq('cycle_id', cycle.id)
      .eq('employee_id', r.employee.id)
      .maybeSingle(),
  ]);

  // Only expose rating once cycle is published OR rating is locked
  const ratingVisible =
    rating && (rating.locked || cycle.status === 'published' || cycle.status === 'archived');

  return NextResponse.json({
    cycle,
    goals: goals ?? [],
    self_review: selfReview ?? null,
    manager_review_summary:
      mgrReview && (mgrReview.status === 'submitted' || mgrReview.status === 'locked')
        ? mgrReview
        : null,
    skip_review_summary: skipReview ?? null,
    rating: ratingVisible ? rating : null,
  });
}

export async function POST(req: NextRequest) {
  // Forward to the self-review endpoint to keep the policy in one place
  const origin = new URL(req.url).origin;
  const cookieHeader = req.headers.get('cookie') ?? '';
  const body = await req.text();
  const resp = await fetch(`${origin}/api/employee/hr/performance/self-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body,
  });
  const json = await resp.json();
  return NextResponse.json(json, { status: resp.status });
}
