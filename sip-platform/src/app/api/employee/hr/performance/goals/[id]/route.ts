/**
 * GET    /api/employee/hr/performance/goals/:id
 *   HR-admin OR the goal's owning employee may read.
 *
 * PATCH  /api/employee/hr/performance/goals/:id
 *   HR-admin: any field.
 *   Owning employee: only when goal.status='open' AND cycle.status='goals_open',
 *     and only these fields: goal_title, goal_description, target_metric,
 *     target_value, target_unit, weight, kra_category, auto_source.
 *   Goal can be flipped to status='locked' by HR-admin; once locked, only
 *     midyear_*, self_*, manager_*, final_rating, actual_value may change.
 *
 * DELETE /api/employee/hr/performance/goals/:id
 *   HR-admin OR the owning employee when goal.status='open' and cycle.status
 *   ∈ {draft, goals_open}.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  getActorContext,
  resolveActorEmployee,
} from '@/lib/hr/performance/route-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const SELF_EDITABLE_OPEN = [
  'goal_title',
  'goal_description',
  'target_metric',
  'target_value',
  'target_unit',
  'weight',
  'kra_category',
  'auto_source',
] as const;

const POST_LOCK_FIELDS = [
  'actual_value',
  'midyear_actual',
  'midyear_note',
  'self_rating',
  'self_note',
  'manager_rating',
  'manager_note',
  'final_rating',
] as const;

async function loadGoal(id: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const };
  const { data: goal, error } = await supabase
    .from('hr_goals')
    .select('*, cycle:hr_appraisal_cycle!hr_goals_cycle_id_fkey(id, status)')
    .eq('id', id)
    .single();
  if (error || !goal) return { error: 'Goal not found', status: 404 as const };
  return { goal, supabase };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await ctx.params;
  const goalId = Number(id);
  if (!Number.isFinite(goalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadGoal(goalId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { goal } = r;

  if (!a.ctx.isAdmin) {
    const empRes = await resolveActorEmployee(req);
    if (!empRes.ok) return NextResponse.json({ error: empRes.error }, { status: empRes.status });
    if (goal.employee_id !== empRes.employee.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return NextResponse.json({ row: goal });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await ctx.params;
  const goalId = Number(id);
  if (!Number.isFinite(goalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadGoal(goalId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { goal, supabase } = r;

  const body = (await req.json()) as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (a.ctx.isAdmin) {
    const cycleStatus = (goal.cycle as { status: string } | null)?.status;
    if (goal.status === 'locked') {
      // Only post-lock fields editable
      for (const k of POST_LOCK_FIELDS) {
        if (k in body) update[k] = body[k];
      }
      // Allow HR to set status back to open (rare) or to lock (idempotent)
      if (body.status === 'open') update.status = 'open';
    } else {
      // Open: any field admin wants (mirror create body)
      for (const k of [
        ...SELF_EDITABLE_OPEN,
        'status',
        ...POST_LOCK_FIELDS,
      ] as const) {
        if (k in body) update[k] = body[k];
      }
    }
    // Published cycles are locked
    if (cycleStatus === 'published' || cycleStatus === 'archived') {
      return NextResponse.json(
        { error: `Cycle is ${cycleStatus} — goals cannot be edited.` },
        { status: 422 },
      );
    }
  } else {
    // Employee self
    const empRes = await resolveActorEmployee(req);
    if (!empRes.ok) return NextResponse.json({ error: empRes.error }, { status: empRes.status });
    if (goal.employee_id !== empRes.employee.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const cycleStatus = (goal.cycle as { status: string } | null)?.status;

    if (goal.status === 'open' && cycleStatus === 'goals_open') {
      for (const k of SELF_EDITABLE_OPEN) {
        if (k in body) update[k] = body[k];
      }
    } else if (cycleStatus === 'self_review_open') {
      // Self-review window — only self_rating + self_note + actual_value
      for (const k of ['self_rating', 'self_note', 'actual_value'] as const) {
        if (k in body) update[k] = body[k];
      }
    } else {
      return NextResponse.json(
        {
          error: `Goal not editable: goal.status=${goal.status}, cycle.status=${cycleStatus}`,
        },
        { status: 422 },
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
  }

  // Weight cap re-check if weight changed
  if ('weight' in update) {
    const w = Number(update.weight);
    if (Number.isNaN(w) || w < 0 || w > 100) {
      return NextResponse.json({ error: 'weight must be 0..100' }, { status: 400 });
    }
    const { data: siblings } = await supabase!
      .from('hr_goals')
      .select('id, weight')
      .eq('cycle_id', goal.cycle_id)
      .eq('employee_id', goal.employee_id)
      .neq('id', goalId);
    const sum = (siblings ?? []).reduce(
      (s: number, x: { weight: number }) => s + Number(x.weight),
      0,
    );
    if (w + sum > 100.001) {
      return NextResponse.json(
        {
          error: `weight ${w} + siblings ${sum} > 100`,
        },
        { status: 422 },
      );
    }
  }

  const { data, error } = await supabase!
    .from('hr_goals')
    .update(update)
    .eq('id', goalId)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ row: data, fields_updated: Object.keys(update) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await ctx.params;
  const goalId = Number(id);
  if (!Number.isFinite(goalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadGoal(goalId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { goal, supabase } = r;
  const cycleStatus = (goal.cycle as { status: string } | null)?.status;

  if (!a.ctx.isAdmin) {
    const empRes = await resolveActorEmployee(req);
    if (!empRes.ok) return NextResponse.json({ error: empRes.error }, { status: empRes.status });
    if (goal.employee_id !== empRes.employee.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  if (goal.status !== 'open' || (cycleStatus !== 'draft' && cycleStatus !== 'goals_open')) {
    return NextResponse.json(
      { error: 'Only open goals in draft/goals_open cycles may be deleted' },
      { status: 422 },
    );
  }

  const { error } = await supabase!.from('hr_goals').delete().eq('id', goalId);
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ ok: true, deleted_id: goalId });
}
