/**
 * POST /api/employee/hr/performance/cycles/:id/transition
 * Body: { to: CycleStatus }
 *
 * State machine:
 *   draft → goals_open → [mid_year] → self_review_open
 *   → manager_review_open → skip_review_open → calibration
 *   → published → archived
 *
 * Per-target gates (HR-admin only):
 *   goals_open           : at least one employee must have goals,
 *                          and every employee with goals must have
 *                          ALL goals locked with weights summing to 100.
 *   mid_year             : prior must be goals_open.
 *   self_review_open     : every employee with goals has goals locked.
 *   manager_review_open  : every employee with a hr_self_review row must be
 *                          status='submitted' (or skip — empty cycle allowed).
 *   skip_review_open     : every hr_manager_review row must be 'submitted'.
 *   calibration          : every hr_manager_review row is 'submitted'.
 *   published            : every employee with goals has an hr_rating
 *                          row with locked=true.
 *   archived             : only from 'published'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import type { CycleStatus } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const ORDER: CycleStatus[] = [
  'draft',
  'goals_open',
  'mid_year',
  'self_review_open',
  'manager_review_open',
  'skip_review_open',
  'calibration',
  'published',
  'archived',
];

/** Allowed transitions: forward by one or to archived from published. */
function canTransition(from: CycleStatus, to: CycleStatus): boolean {
  if (from === to) return false;
  if (from === 'published' && to === 'archived') return true;

  // mid_year is optional — allow goals_open → self_review_open directly
  if (from === 'goals_open' && to === 'self_review_open') return true;
  // mid_year → self_review_open (normal advance)
  if (from === 'mid_year' && to === 'self_review_open') return true;

  const i = ORDER.indexOf(from);
  const j = ORDER.indexOf(to);
  if (i === -1 || j === -1) return false;
  return j === i + 1;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const cycleId = Number(id);
  if (!Number.isFinite(cycleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { to } = body as { to?: CycleStatus };
  if (!to || !ORDER.includes(to)) {
    return NextResponse.json(
      { error: `to must be one of ${ORDER.join(', ')}` },
      { status: 400 },
    );
  }

  const { data: cycle, error: fetchErr } = await supabase
    .from('hr_appraisal_cycle')
    .select('*')
    .eq('id', cycleId)
    .single();
  if (fetchErr || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }

  const from = cycle.status as CycleStatus;
  if (!canTransition(from, to)) {
    return NextResponse.json(
      { error: `Illegal transition '${from}' → '${to}'.` },
      { status: 422 },
    );
  }

  // ── gates ────────────────────────────────────────────────────────
  if (to === 'goals_open') {
    // Need at least one goal seeded
    const { count: anyGoals } = await supabase
      .from('hr_goals')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycleId);
    if ((anyGoals ?? 0) === 0) {
      return NextResponse.json(
        { error: 'No goals seeded yet — call /seed-goals before opening goals.' },
        { status: 422 },
      );
    }
    // For each employee, weights must sum to 100 AND every goal locked
    const summary = await summarizeGoalLockStatus(supabase, cycleId);
    const unlocked = summary.filter((s) => !s.allLocked || s.weightSum !== 100);
    if (unlocked.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot open goals — some employees have unlocked or non-100-weighted goals.',
          violations: unlocked,
        },
        { status: 422 },
      );
    }
  }

  if (to === 'self_review_open') {
    // Goals must all be locked across the cycle
    const summary = await summarizeGoalLockStatus(supabase, cycleId);
    const violations = summary.filter((s) => !s.allLocked || s.weightSum !== 100);
    if (violations.length > 0) {
      return NextResponse.json(
        {
          error: 'Some employees still have unlocked goals.',
          violations,
        },
        { status: 422 },
      );
    }
  }

  if (to === 'manager_review_open') {
    // Every hr_self_review row must be 'submitted' or 'locked'
    const { data: pending } = await supabase
      .from('hr_self_review')
      .select('id, employee_id, status')
      .eq('cycle_id', cycleId)
      .in('status', ['draft']);
    if ((pending ?? []).length > 0) {
      return NextResponse.json(
        {
          error: 'Some self-reviews are still in draft.',
          pending: pending ?? [],
        },
        { status: 422 },
      );
    }
  }

  if (to === 'skip_review_open' || to === 'calibration') {
    const { data: pending } = await supabase
      .from('hr_manager_review')
      .select('id, employee_id, status')
      .eq('cycle_id', cycleId)
      .in('status', ['draft']);
    if ((pending ?? []).length > 0) {
      return NextResponse.json(
        {
          error: 'Some manager reviews are still in draft.',
          pending: pending ?? [],
        },
        { status: 422 },
      );
    }
  }

  if (to === 'published') {
    // Every employee with goals must have a LOCKED hr_rating row
    const { data: empRows } = await supabase
      .from('hr_goals')
      .select('employee_id')
      .eq('cycle_id', cycleId);
    const employeeIds = Array.from(
      new Set((empRows ?? []).map((r: { employee_id: number }) => r.employee_id)),
    );

    if (employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'No employees in cycle scope — nothing to publish.' },
        { status: 422 },
      );
    }

    const { data: ratings } = await supabase
      .from('hr_rating')
      .select('employee_id, locked')
      .eq('cycle_id', cycleId)
      .in('employee_id', employeeIds);

    const lockedSet = new Set(
      (ratings ?? [])
        .filter((r: { locked: boolean }) => r.locked === true)
        .map((r: { employee_id: number }) => r.employee_id),
    );
    const missing = employeeIds.filter((id) => !lockedSet.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'Some employees do not have a locked hr_rating.',
          missing_employee_ids: missing,
        },
        { status: 422 },
      );
    }
  }

  // ── apply transition ─────────────────────────────────────────────
  const updateRow: Record<string, unknown> = { status: to };
  if (to === 'published') updateRow.published_at = new Date().toISOString();

  const { data: updated, error: updErr } = await supabase
    .from('hr_appraisal_cycle')
    .update(updateRow)
    .eq('id', cycleId)
    .select('*')
    .single();
  if (updErr) {
    console.error('[Cycle transition]', updErr.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ row: updated, from, to });
}

interface LockSummaryRow {
  employee_id: number;
  totalGoals: number;
  lockedGoals: number;
  allLocked: boolean;
  weightSum: number;
}

async function summarizeGoalLockStatus(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  cycleId: number,
): Promise<LockSummaryRow[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('hr_goals')
    .select('employee_id, status, weight')
    .eq('cycle_id', cycleId);
  const byEmp = new Map<
    number,
    { totalGoals: number; lockedGoals: number; weightSum: number }
  >();
  for (const r of (data ?? []) as {
    employee_id: number;
    status: string;
    weight: number;
  }[]) {
    const cur = byEmp.get(r.employee_id) ?? {
      totalGoals: 0,
      lockedGoals: 0,
      weightSum: 0,
    };
    cur.totalGoals++;
    if (r.status === 'locked') cur.lockedGoals++;
    cur.weightSum += Number(r.weight) || 0;
    byEmp.set(r.employee_id, cur);
  }
  return Array.from(byEmp.entries()).map(([employee_id, v]) => ({
    employee_id,
    totalGoals: v.totalGoals,
    lockedGoals: v.lockedGoals,
    allLocked: v.lockedGoals === v.totalGoals,
    weightSum: Math.round(v.weightSum * 100) / 100,
  }));
}
