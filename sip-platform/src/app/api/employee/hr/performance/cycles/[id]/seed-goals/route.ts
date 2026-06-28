/**
 * POST /api/employee/hr/performance/cycles/:id/seed-goals
 * Body:
 *   {
 *     template_role_family: 'sales_rm' | 'cdm_service' | 'ops_admin' | 'tech_product',
 *     employee_ids?: number[]   // optional whitelist; otherwise all 'active' employees
 *   }
 *
 * For each employee in scope:
 *   - Reads KRA template
 *   - Inserts one hr_goals row per template item (open state)
 *   - Skips if (cycle_id, employee_id, goal_title) already exists (UNIQUE)
 *
 * Returns:
 *   { template, employee_count, goals_inserted, conflicts: [{employee_id, goal_title}], errors }
 *
 * HR-admin only. Cycle status must be 'draft' or 'goals_open'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import {
  KRA_TEMPLATES,
  type KraTemplate,
} from '@/data/hr/kra-templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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
  const { template_role_family, employee_ids } = body as {
    template_role_family?: KraTemplate['role_family'];
    employee_ids?: number[];
  };

  if (!template_role_family) {
    return NextResponse.json({ error: 'template_role_family required' }, { status: 400 });
  }
  const template = KRA_TEMPLATES.find((t) => t.role_family === template_role_family);
  if (!template) {
    return NextResponse.json(
      { error: `Unknown template_role_family ${template_role_family}` },
      { status: 400 },
    );
  }

  const { data: cycle, error: cyErr } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status')
    .eq('id', cycleId)
    .single();
  if (cyErr || !cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }
  if (cycle.status !== 'draft' && cycle.status !== 'goals_open') {
    return NextResponse.json(
      { error: `Cannot seed goals when cycle.status='${cycle.status}'` },
      { status: 422 },
    );
  }

  // Resolve target employees
  let empQuery = supabase
    .from('hr_employees')
    .select('id')
    .eq('status', 'active');
  if (Array.isArray(employee_ids) && employee_ids.length > 0) {
    empQuery = supabase.from('hr_employees').select('id').in('id', employee_ids);
  }
  const { data: emps, error: empErr } = await empQuery;
  if (empErr) return NextResponse.json({ error: empErr.message }, { status: 500 });
  const targets = (emps ?? []) as { id: number }[];
  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'No employees matched scope.' },
      { status: 422 },
    );
  }

  // Build all rows
  const rows: Record<string, unknown>[] = [];
  for (const e of targets) {
    for (const item of template.items) {
      rows.push({
        cycle_id: cycleId,
        employee_id: e.id,
        kra_category: item.kra_category,
        goal_title: item.goal_title,
        goal_description: item.goal_description,
        weight: item.weight,
        target_metric: item.target_metric,
        target_unit: item.target_unit,
        auto_source: item.auto_source ?? null,
        status: 'open',
        created_by: g.ctx.email,
      });
    }
  }

  // Insert, ignoring UNIQUE conflicts
  const conflicts: Array<{ employee_id: number; goal_title: string }> = [];
  const errors: string[] = [];
  let inserted = 0;

  // Insert in batches to avoid PostgREST request-size limits
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { data: ins, error: insErr } = await supabase
      .from('hr_goals')
      .insert(slice)
      .select('id, employee_id, goal_title');
    if (insErr) {
      // If unique violation on bulk insert, fall back to row-by-row to log conflicts
      if (insErr.code === '23505') {
        for (const r of slice) {
          const { error: rowErr } = await supabase.from('hr_goals').insert(r);
          if (rowErr) {
            if (rowErr.code === '23505') {
              conflicts.push({
                employee_id: r.employee_id as number,
                goal_title: r.goal_title as string,
              });
            } else {
              errors.push(`emp ${r.employee_id} '${r.goal_title}': ${rowErr.message}`);
            }
          } else {
            inserted++;
          }
        }
      } else {
        errors.push(insErr.message);
      }
    } else {
      inserted += (ins ?? []).length;
    }
  }

  return NextResponse.json({
    template: template.role_family,
    employee_count: targets.length,
    goals_inserted: inserted,
    conflicts,
    errors,
  });
}
