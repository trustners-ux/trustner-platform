/**
 * GET    /api/employee/hr/performance/cycles/:id
 *   Returns the cycle row + counts (goals / self_reviews / manager_reviews /
 *   skip_reviews / ratings / pips) and a quick employee-coverage summary.
 *
 * PATCH  /api/employee/hr/performance/cycles/:id
 *   Updates editable fields. Editability depends on status:
 *     - draft               → all fields editable
 *     - goals_open          → due-dates + distribution-curve only
 *     - mid_year + later    → due-dates only
 *     - published/archived  → rejected
 *
 * DELETE /api/employee/hr/performance/cycles/:id
 *   Only allowed when status='draft'. Cascade deletes goals/reviews/ratings/pips
 *   via FK ON DELETE CASCADE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import type { CycleStatus } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

type EditableField =
  | 'start_date'
  | 'end_date'
  | 'enforce_distribution'
  | 'distribution_curve'
  | 'goals_due_date'
  | 'midyear_due_date'
  | 'self_review_due_date'
  | 'manager_review_due_date'
  | 'skip_review_due_date'
  | 'calibration_due_date';

const ALL_EDITABLE: EditableField[] = [
  'start_date',
  'end_date',
  'enforce_distribution',
  'distribution_curve',
  'goals_due_date',
  'midyear_due_date',
  'self_review_due_date',
  'manager_review_due_date',
  'skip_review_due_date',
  'calibration_due_date',
];

const GOALS_OPEN_EDITABLE: EditableField[] = [
  'enforce_distribution',
  'distribution_curve',
  'goals_due_date',
  'midyear_due_date',
  'self_review_due_date',
  'manager_review_due_date',
  'skip_review_due_date',
  'calibration_due_date',
];

const DUE_DATES_ONLY: EditableField[] = [
  'goals_due_date',
  'midyear_due_date',
  'self_review_due_date',
  'manager_review_due_date',
  'skip_review_due_date',
  'calibration_due_date',
];

function editableFor(status: CycleStatus): EditableField[] | 'locked' {
  if (status === 'draft') return ALL_EDITABLE;
  if (status === 'goals_open') return GOALS_OPEN_EDITABLE;
  if (status === 'published' || status === 'archived') return 'locked';
  return DUE_DATES_ONLY;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(_req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const cycleId = Number(id);
  if (!Number.isFinite(cycleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: cycle, error } = await supabase
    .from('hr_appraisal_cycle')
    .select('*')
    .eq('id', cycleId)
    .single();
  if (error || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }

  // Counts (head:true means metadata-only, no payload)
  const [
    { count: goalCount },
    { count: selfRevCount },
    { count: mgrRevCount },
    { count: skipRevCount },
    { count: ratingCount },
    { count: pipCount },
  ] = await Promise.all([
    supabase.from('hr_goals').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
    supabase.from('hr_self_review').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
    supabase.from('hr_manager_review').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
    supabase.from('hr_skip_review').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
    supabase.from('hr_rating').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
    supabase.from('hr_pip').select('id', { count: 'exact', head: true }).eq('cycle_id', cycleId),
  ]);

  // Distinct employees that have any goals — coverage proxy
  const { data: empRows } = await supabase
    .from('hr_goals')
    .select('employee_id')
    .eq('cycle_id', cycleId);
  const employee_coverage = new Set(
    (empRows ?? []).map((r: { employee_id: number }) => r.employee_id),
  ).size;

  return NextResponse.json({
    row: cycle,
    counts: {
      goals: goalCount ?? 0,
      self_reviews: selfRevCount ?? 0,
      manager_reviews: mgrRevCount ?? 0,
      skip_reviews: skipRevCount ?? 0,
      ratings: ratingCount ?? 0,
      pips: pipCount ?? 0,
      employees_with_goals: employee_coverage,
    },
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const cycleId = Number(id);
  if (!Number.isFinite(cycleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: cycle, error: fetchErr } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status')
    .eq('id', cycleId)
    .single();
  if (fetchErr || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }

  const allowed = editableFor(cycle.status as CycleStatus);
  if (allowed === 'locked') {
    return NextResponse.json(
      { error: `Cycle is ${cycle.status} — no fields are editable.` },
      { status: 422 },
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const updateRow: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updateRow[key] = body[key];
  }
  if (Object.keys(updateRow).length === 0) {
    return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hr_appraisal_cycle')
    .update(updateRow)
    .eq('id', cycleId)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ row: data, fields_updated: Object.keys(updateRow) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const cycleId = Number(id);
  if (!Number.isFinite(cycleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: cycle, error: fetchErr } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status')
    .eq('id', cycleId)
    .single();
  if (fetchErr || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }
  if (cycle.status !== 'draft') {
    return NextResponse.json(
      { error: `Only draft cycles may be deleted (current: ${cycle.status}).` },
      { status: 422 },
    );
  }

  const { error: delErr } = await supabase
    .from('hr_appraisal_cycle')
    .delete()
    .eq('id', cycleId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted_id: cycleId });
}
