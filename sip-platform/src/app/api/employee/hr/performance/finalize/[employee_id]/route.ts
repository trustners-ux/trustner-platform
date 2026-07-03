/**
 * POST /api/employee/hr/performance/finalize/:employee_id
 * HR-admin only.
 * Body:
 *   {
 *     cycle_id,
 *     final_increment_pct,        // within band per increment_matrix
 *     promoted?: boolean,
 *     new_designation?: string,
 *     generate_letter?: boolean   // default true → writes hr_letter_archive
 *   }
 *
 * Workflow:
 *   1. Verify rating row exists (otherwise 422 — go calibrate first).
 *   2. Validate increment % within (fiscal_year, rating) band.
 *   3. Compute increment amount from current basic+hra+special+pf+variable monthly.
 *   4. Update hr_rating: final_increment_pct, increment_amount,
 *      promoted, new_designation, locked=true, locked_at=now, letter_id (if generated).
 *   5. If generate_letter: write hr_letter_archive row, letter_type='increment'.
 *   6. If final_performance_rating === 1, auto-open an hr_pip row with the
 *      standard 30/60/90 milestones (only if no open PIP already exists).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import {
  finalizeIncrement,
  computeIncrement,
  getIncrementBands,
  type HrPipMilestone,
} from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ employee_id: string }> },
) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const { employee_id } = await ctx.params;
  const empId = Number(employee_id);
  if (!Number.isFinite(empId)) {
    return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    cycle_id,
    final_increment_pct,
    promoted,
    new_designation,
    generate_letter,
  } = body as {
    cycle_id?: number;
    final_increment_pct?: number;
    promoted?: boolean;
    new_designation?: string;
    generate_letter?: boolean;
  };

  if (!cycle_id || typeof final_increment_pct !== 'number') {
    return NextResponse.json(
      { error: 'cycle_id and final_increment_pct required' },
      { status: 400 },
    );
  }

  const { data: cycle } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, fiscal_year, status')
    .eq('id', cycle_id)
    .single();
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });

  const { data: rating } = await supabase
    .from('hr_rating')
    .select('*')
    .eq('cycle_id', cycle_id)
    .eq('employee_id', empId)
    .maybeSingle();
  if (!rating) {
    return NextResponse.json(
      { error: 'No hr_rating row — run /calibration first' },
      { status: 422 },
    );
  }
  if (rating.locked) {
    return NextResponse.json(
      { error: 'Rating is already locked. Cannot re-finalize.' },
      { status: 409 },
    );
  }

  const { data: emp } = await supabase
    .from('hr_employees')
    .select(
      'id, full_name, employee_code, entity, designation, email, basic_monthly, hra_monthly, special_allowance_monthly, pf_monthly, variable_pay_monthly',
    )
    .eq('id', empId)
    .single();
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const currentGross =
    Number(emp.basic_monthly ?? 0) +
    Number(emp.hra_monthly ?? 0) +
    Number(emp.special_allowance_monthly ?? 0) +
    Number(emp.pf_monthly ?? 0) +
    Number(emp.variable_pay_monthly ?? 0);

  // Validate band + persist final_increment_pct / increment_amount on hr_rating
  let finalizedBand;
  try {
    finalizedBand = await finalizeIncrement({
      rating_id: rating.id,
      fiscal_year: cycle.fiscal_year,
      rating: rating.final_performance_rating,
      requested_pct: final_increment_pct,
      currentGrossMonthly: currentGross,
      approver_email: g.ctx.email,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Increment validation failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const incrementDelta = computeIncrement(currentGross, final_increment_pct);
  // Band info for letter (best-effort, already validated above)
  const bands = await getIncrementBands(cycle.fiscal_year, rating.final_performance_rating);

  // Optionally generate increment letter
  let letterId: number | null = rating.letter_id ?? null;
  if (generate_letter !== false) {
    const snapshot = {
      employee: {
        id: emp.id,
        full_name: emp.full_name,
        employee_code: emp.employee_code,
        designation: emp.designation,
        new_designation: new_designation ?? null,
      },
      cycle_id,
      fiscal_year: cycle.fiscal_year,
      rating: rating.final_performance_rating,
      final_increment_pct,
      band: bands,
      old_gross_monthly: currentGross,
      new_gross_monthly: incrementDelta.newGrossMonthly,
      delta_monthly: incrementDelta.deltaMonthly,
      delta_annual: incrementDelta.deltaAnnual,
      promoted: !!promoted,
      effective_date: new Date().toISOString().slice(0, 10),
    };
    const { data: letter, error: letterErr } = await supabase
      .from('hr_letter_archive')
      .insert({
        employee_id: emp.id,
        letter_type: 'increment',
        entity: emp.entity || 'TAS',
        recipient_name: emp.full_name,
        data_snapshot: snapshot,
        generated_by: g.ctx.email,
        status: 'draft',
      })
      .select('id')
      .single();
    if (letterErr) {
      // Don't fail finalize on letter failure — log only
      console.error('Letter generation failed:', letterErr.message);
    } else {
      letterId = letter.id;
    }
  }

  // Lock the rating
  const { data: lockedRating, error: lockErr } = await supabase
    .from('hr_rating')
    .update({
      promoted: !!promoted,
      new_designation: new_designation ?? null,
      locked: true,
      locked_at: new Date().toISOString(),
      letter_id: letterId,
    })
    .eq('id', rating.id)
    .select('*')
    .single();
  if (lockErr) {
    console.error('[Finalize lock]', lockErr.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // PIP auto-trigger on rating=1
  let pipRow: Record<string, unknown> | null = null;
  if (rating.final_performance_rating === 1) {
    const { data: existingPip } = await supabase
      .from('hr_pip')
      .select('id, outcome')
      .eq('rating_id', rating.id)
      .maybeSingle();
    if (!existingPip) {
      const openedAt = new Date();
      const milestones: HrPipMilestone[] = [
        {
          milestone: '30-day review — initial behaviour & goals reset',
          target_date: addDays(openedAt, 30).toISOString().slice(0, 10),
          status: 'open',
        },
        {
          milestone: '60-day review — progress check on KRA scorecard',
          target_date: addDays(openedAt, 60).toISOString().slice(0, 10),
          status: 'open',
        },
        {
          milestone: '90-day review — final pass/fail decision',
          target_date: addDays(openedAt, 90).toISOString().slice(0, 10),
          status: 'open',
        },
      ];
      // Manager email (from hr_employees.reporting_manager_id) — best-effort
      const { data: empWithMgr } = await supabase
        .from('hr_employees')
        .select('reporting_manager_id')
        .eq('id', emp.id)
        .maybeSingle();
      let managerEmail: string | null = null;
      if (empWithMgr?.reporting_manager_id) {
        const { data: mgrRow } = await supabase
          .from('hr_employees')
          .select('email')
          .eq('id', empWithMgr.reporting_manager_id)
          .maybeSingle();
        managerEmail = mgrRow?.email ?? null;
      }
      const { data: pipIns, error: pipErr } = await supabase
        .from('hr_pip')
        .insert({
          rating_id: rating.id,
          cycle_id,
          employee_id: emp.id,
          manager_email: managerEmail,
          expected_outcomes: milestones,
          outcome: 'open',
        })
        .select('*')
        .single();
      if (!pipErr) pipRow = pipIns;
    }
  }

  return NextResponse.json({
    rating: lockedRating,
    band: finalizedBand.bands,
    increment: incrementDelta,
    letter_id: letterId,
    pip: pipRow,
  });
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}
