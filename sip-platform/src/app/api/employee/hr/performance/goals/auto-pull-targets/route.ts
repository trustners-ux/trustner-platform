/**
 * POST /api/employee/hr/performance/goals/auto-pull-targets
 * Body: { cycle_id: number, employee_id?: number }
 *
 * HR-admin only. For the supplied cycle, invokes applyAutoFeedsForEmployee
 * for every in-scope employee (or just the one supplied via employee_id).
 *
 * Returns per-employee:
 *   {
 *     employee_id,
 *     rows_auto_sourced,      // total hr_goals with non-null auto_source != 'manual'
 *     rows_pulled,            // updated this call
 *     data_quality_pct        // pulled / sourced  × 100  (null if denom=0)
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import { applyAutoFeedsForEmployee, type CycleWindow } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { cycle_id, employee_id } = body as { cycle_id?: number; employee_id?: number };
  if (!cycle_id) {
    return NextResponse.json({ error: 'cycle_id required' }, { status: 400 });
  }

  const { data: cycle, error: cyErr } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, start_date, end_date, status')
    .eq('id', cycle_id)
    .single();
  if (cyErr || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }
  if (cycle.status === 'archived') {
    return NextResponse.json({ error: 'Archived cycles cannot be re-pulled' }, { status: 422 });
  }

  const cycleWindow: CycleWindow = {
    cycle_id: cycle.id,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
  };

  // Resolve target employees
  let targets: number[] = [];
  if (employee_id) {
    targets = [employee_id];
  } else {
    const { data } = await supabase
      .from('hr_goals')
      .select('employee_id')
      .eq('cycle_id', cycle_id)
      .not('auto_source', 'is', null)
      .neq('auto_source', 'manual');
    targets = Array.from(
      new Set((data ?? []).map((r: { employee_id: number }) => r.employee_id)),
    );
  }

  const results: Array<{
    employee_id: number;
    rows_auto_sourced: number;
    rows_pulled: number;
    data_quality_pct: number | null;
    errors: string[];
  }> = [];

  for (const empId of targets) {
    // Count source rows
    const { count: sourced } = await supabase
      .from('hr_goals')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycle_id)
      .eq('employee_id', empId)
      .not('auto_source', 'is', null)
      .neq('auto_source', 'manual');

    const out = await applyAutoFeedsForEmployee(empId, cycleWindow);

    // Count rows with non-null actual_value after run
    const { count: filled } = await supabase
      .from('hr_goals')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycle_id)
      .eq('employee_id', empId)
      .not('auto_source', 'is', null)
      .neq('auto_source', 'manual')
      .not('actual_value', 'is', null);

    const denom = sourced ?? 0;
    const dq = denom === 0 ? null : Math.round(((filled ?? 0) / denom) * 10000) / 100;
    results.push({
      employee_id: empId,
      rows_auto_sourced: denom,
      rows_pulled: out.updated,
      data_quality_pct: dq,
      errors: out.errors,
    });
  }

  return NextResponse.json({
    cycle_id,
    total_employees: results.length,
    total_rows_pulled: results.reduce((s, r) => s + r.rows_pulled, 0),
    results,
  });
}
