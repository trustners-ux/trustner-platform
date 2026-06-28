/**
 * Productivity dashboard API — aggregates the founder's anti-leakage view.
 *
 * For each active employee returns:
 *   - 6-month salary cost
 *   - 6-month business booked + commission earned
 *   - ROI ratio (commission / salary)
 *   - 30-day DSR submission %
 *   - 30-day attendance %
 *   - flag count
 *
 * Auto-flags employees whose 3-month average ROI < 0.5 (i.e., salary cost
 * is 2x the commission they brought in) OR DSR-pct < 60% OR attendance < 75%.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_reports && !perms.can_access_employees) {
    return NextResponse.json({ error: 'HR/founder only' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // Use the productivity_summary view (defined in migration 022)
  const { data: summary, error } = await supabase
    .from('hr_productivity_summary')
    .select('*')
    .order('avg_roi_6mo');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Layer in real-time DSR + attendance percentages for the last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const empIds = (summary ?? []).map((s) => s.employee_id);

  // DSR last 30 days
  const dsrCounts = new Map<number, number>();
  if (empIds.length > 0) {
    const { data: dsrRows } = await supabase
      .from('hr_dsr_entries')
      .select('employee_id, entry_date')
      .gte('entry_date', sinceIso)
      .in('employee_id', empIds);
    for (const r of dsrRows ?? []) {
      dsrCounts.set(r.employee_id, (dsrCounts.get(r.employee_id) || 0) + 1);
    }
  }

  // Attendance last 30 days
  const presentCounts = new Map<number, number>();
  if (empIds.length > 0) {
    const { data: attRows } = await supabase
      .from('hr_attendance_logs')
      .select('employee_id, log_date, status')
      .gte('log_date', sinceIso)
      .in('employee_id', empIds);
    for (const r of attRows ?? []) {
      if (r.status && !['absent', 'weekly_off', 'holiday'].includes(r.status)) {
        presentCounts.set(r.employee_id, (presentCounts.get(r.employee_id) || 0) + 1);
      }
    }
  }

  // Working days in last 30 (~22)
  const expectedWorkingDays = 22;

  const enriched = (summary ?? []).map((s) => {
    const dsrDays = dsrCounts.get(s.employee_id) || 0;
    const presentDays = presentCounts.get(s.employee_id) || 0;
    const dsr_pct_30d = (dsrDays / expectedWorkingDays) * 100;
    const attendance_pct_30d = (presentDays / expectedWorkingDays) * 100;

    // Compute anti-leakage flag
    let flag_reason: string | null = null;
    if (s.months_in_period >= 3) {
      if (Number(s.avg_roi_6mo) > 0 && Number(s.avg_roi_6mo) < 0.5) {
        flag_reason = `ROI < 0.5 (commission earned is less than half of salary cost over 6 months)`;
      } else if (dsr_pct_30d < 60 && s.grade_band && ['L2','L3','L4','L5'].includes(s.grade_band)) {
        flag_reason = `DSR submission < 60% (last 30 days)`;
      } else if (attendance_pct_30d < 75) {
        flag_reason = `Attendance < 75% (last 30 days)`;
      }
    }

    return { ...s, dsr_days_30d: dsrDays, present_days_30d: presentDays, dsr_pct_30d, attendance_pct_30d, flag_reason };
  });

  // Headline stats
  const flagged = enriched.filter((e) => e.flag_reason);
  const totalSalary = enriched.reduce((sum, e) => sum + Number(e.total_salary_6mo || 0), 0);
  const totalCommission = enriched.reduce((sum, e) => sum + Number(e.total_commission_6mo || 0), 0);
  const overallRoi = totalSalary > 0 ? totalCommission / totalSalary : 0;

  return NextResponse.json({
    rows: enriched,
    summary: {
      total_employees: enriched.length,
      flagged_count: flagged.length,
      total_salary_6mo: totalSalary,
      total_commission_6mo: totalCommission,
      overall_roi: overallRoi,
    },
  });
}
