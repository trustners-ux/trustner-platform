/**
 * GET  /api/employee/hr/performance/goals
 *   Lists goals. Query params:
 *     - cycle_id (required for non-admins)
 *     - employee_id
 *     - status, kra_category
 *     - page, page_size
 *
 *   Non-admins may only list their OWN goals (employee_id forced to their id).
 *
 * POST /api/employee/hr/performance/goals
 *   HR-admin (or the employee themselves if cycle is goals_open) creates one
 *   goal. Validates weight ≤ 100 - sum(existing weights for this (cycle,emp)).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  getActorContext,
  canManagePerformance,
  resolveActorEmployee,
} from '@/lib/hr/performance/route-auth';
import type { KraCategory, AutoSource } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const VALID_CAT: KraCategory[] = [
  'business',
  'operational',
  'behavioural',
  'learning',
  'compliance',
];

export async function GET(req: NextRequest) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const cycle_id = url.searchParams.get('cycle_id');
  const employee_id_q = url.searchParams.get('employee_id');
  const status = url.searchParams.get('status');
  const kra_category = url.searchParams.get('kra_category');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const page_size = Math.min(200, Math.max(1, Number(url.searchParams.get('page_size') ?? '50')));
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let employee_id: number | null = employee_id_q ? Number(employee_id_q) : null;

  if (!a.ctx.isAdmin) {
    // Force scope to self
    const empRes = await resolveActorEmployee(req);
    if (!empRes.ok) return NextResponse.json({ error: empRes.error }, { status: empRes.status });
    employee_id = empRes.employee.id;
  }

  let query = supabase
    .from('hr_goals')
    .select('*', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to);

  if (cycle_id) query = query.eq('cycle_id', Number(cycle_id));
  if (employee_id) query = query.eq('employee_id', employee_id);
  if (status) query = query.eq('status', status);
  if (kra_category) query = query.eq('kra_category', kra_category);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    page,
    page_size,
    total: count ?? (data?.length ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    cycle_id,
    employee_id,
    kra_category,
    goal_title,
    goal_description,
    weight,
    target_metric,
    target_value,
    target_unit,
    auto_source,
  } = body as {
    cycle_id?: number;
    employee_id?: number;
    kra_category?: KraCategory;
    goal_title?: string;
    goal_description?: string;
    weight?: number;
    target_metric?: string;
    target_value?: number;
    target_unit?: string;
    auto_source?: AutoSource;
  };

  if (
    !cycle_id ||
    !employee_id ||
    !kra_category ||
    !goal_title ||
    weight === undefined ||
    weight === null
  ) {
    return NextResponse.json(
      { error: 'cycle_id, employee_id, kra_category, goal_title, weight required' },
      { status: 400 },
    );
  }
  if (!VALID_CAT.includes(kra_category)) {
    return NextResponse.json(
      { error: `kra_category must be one of ${VALID_CAT.join(', ')}` },
      { status: 400 },
    );
  }
  if (weight < 0 || weight > 100) {
    return NextResponse.json({ error: 'weight must be between 0 and 100' }, { status: 400 });
  }

  // Self-only path: non-admin may only add to their own (cycle in goals_open)
  if (!a.ctx.isAdmin) {
    const empRes = await resolveActorEmployee(req);
    if (!empRes.ok) return NextResponse.json({ error: empRes.error }, { status: empRes.status });
    if (empRes.employee.id !== employee_id) {
      return NextResponse.json(
        { error: 'Cannot create goals for another employee' },
        { status: 403 },
      );
    }
    const { data: cy } = await supabase
      .from('hr_appraisal_cycle')
      .select('status')
      .eq('id', cycle_id)
      .single();
    if (!cy || cy.status !== 'goals_open') {
      return NextResponse.json(
        { error: 'Self-created goals only allowed when cycle.status=goals_open' },
        { status: 422 },
      );
    }
  }

  // Validate weight cap
  const { data: existing } = await supabase
    .from('hr_goals')
    .select('weight')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', employee_id);

  const existingSum = (existing ?? []).reduce(
    (s: number, r: { weight: number }) => s + Number(r.weight),
    0,
  );
  const remaining = 100 - existingSum;
  if (weight > remaining + 0.001) {
    return NextResponse.json(
      {
        error: `weight ${weight} exceeds remaining ${remaining.toFixed(2)} for this employee in cycle`,
      },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('hr_goals')
    .insert({
      cycle_id,
      employee_id,
      kra_category,
      goal_title,
      goal_description: goal_description ?? null,
      weight,
      target_metric: target_metric ?? null,
      target_value: target_value ?? null,
      target_unit: target_unit ?? null,
      auto_source: auto_source ?? null,
      status: 'open',
      created_by: a.ctx.email,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate goal_title for this (cycle, employee)' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ row: data });
}

// Keep canManagePerformance referenced for tooling
void canManagePerformance;
