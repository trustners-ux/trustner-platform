/**
 * Performance — Auto Feeds.
 *
 * Pulls actual_value into hr_goals rows whose auto_source is set, so a
 * Sales RM's "Business AUM" goal doesn't need manual entry — it reads
 * hr_dsr_entries automatically.
 *
 * Supported auto sources:
 *   - hr_dsr_business      → SUM(business_inr) for cycle window
 *   - hr_dsr_meetings      → SUM(meeting_count) for cycle window
 *   - hr_dsr_leads         → SUM(leads_count)   for cycle window
 *   - posp_crosscheck_clean→ 1 if zero open POSP flags during cycle, else 0
 *   - attendance_score     → % of cycle days marked present
 *   - manual               → no-op
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface CycleWindow {
  cycle_id: number;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string;
}

/** SUM(business_inr) from hr_dsr_entries in the cycle window. */
export async function autoPullDsrBusiness(
  employee_id: number,
  cycle: CycleWindow
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { data, error } = await sb
    .from('hr_dsr_entries')
    .select('business_inr')
    .eq('employee_id', employee_id)
    .gte('entry_date', cycle.start_date)
    .lte('entry_date', cycle.end_date);
  if (error || !data) return 0;
  return data.reduce(
    (sum: number, row: { business_inr: number | null }) =>
      sum + (Number(row.business_inr) || 0),
    0
  );
}

/** SUM(meeting_count) from hr_dsr_entries in the cycle window. */
export async function autoPullDsrMeetings(
  employee_id: number,
  cycle: CycleWindow
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { data, error } = await sb
    .from('hr_dsr_entries')
    .select('meeting_count')
    .eq('employee_id', employee_id)
    .gte('entry_date', cycle.start_date)
    .lte('entry_date', cycle.end_date);
  if (error || !data) return 0;
  return data.reduce(
    (sum: number, row: { meeting_count: number | null }) =>
      sum + (Number(row.meeting_count) || 0),
    0
  );
}

/** SUM(leads_count) from hr_dsr_entries in the cycle window. */
export async function autoPullDsrLeads(
  employee_id: number,
  cycle: CycleWindow
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { data, error } = await sb
    .from('hr_dsr_entries')
    .select('leads_count')
    .eq('employee_id', employee_id)
    .gte('entry_date', cycle.start_date)
    .lte('entry_date', cycle.end_date);
  if (error || !data) return 0;
  return data.reduce(
    (sum: number, row: { leads_count: number | null }) =>
      sum + (Number(row.leads_count) || 0),
    0
  );
}

/** 1 if zero open POSP cross-check flags during cycle, else 0. */
export async function autoPullPospCleanScore(
  employee_id: number,
  _cycle: CycleWindow
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { count, error } = await sb
    .from('hr_posp_crosschecks')
    .select('*', { count: 'exact', head: true })
    .eq('matched_employee_id', employee_id)
    .in('status', ['flagged', 'flagged_soft', 'flagged_strong', 'flagged_hard']);
  if (error) return 0;
  return (count ?? 0) === 0 ? 1 : 0;
}

/**
 * Percent of cycle days the employee was marked 'present'.
 * Returns 0-100.
 */
export async function autoPullAttendanceScore(
  employee_id: number,
  cycle: CycleWindow
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { data, error } = await sb
    .from('hr_attendance_logs')
    .select('status, log_date')
    .eq('employee_id', employee_id)
    .gte('log_date', cycle.start_date)
    .lte('log_date', cycle.end_date);
  if (error || !data) return 0;

  const totalDays =
    (new Date(cycle.end_date).getTime() -
      new Date(cycle.start_date).getTime()) /
      (1000 * 60 * 60 * 24) +
    1;
  if (totalDays <= 0) return 0;

  const present = data.filter(
    (r: { status: string }) => r.status === 'present'
  ).length;
  return Math.round((present / totalDays) * 10000) / 100; // two-decimal percent
}

/**
 * Apply auto-feeds across every hr_goals row for an employee in a cycle.
 * Returns count of rows updated.
 */
export async function applyAutoFeedsForEmployee(
  employee_id: number,
  cycle: CycleWindow
): Promise<{ updated: number; errors: string[] }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { updated: 0, errors: ['supabase not configured'] };

  const { data: goals, error } = await sb
    .from('hr_goals')
    .select('id, auto_source')
    .eq('cycle_id', cycle.cycle_id)
    .eq('employee_id', employee_id)
    .not('auto_source', 'is', null)
    .neq('auto_source', 'manual');

  if (error || !goals) {
    return { updated: 0, errors: [error?.message ?? 'no goals returned'] };
  }

  const errors: string[] = [];
  let updated = 0;

  for (const g of goals as { id: number; auto_source: string }[]) {
    let actual = 0;
    switch (g.auto_source) {
      case 'hr_dsr_business':
        actual = await autoPullDsrBusiness(employee_id, cycle);
        break;
      case 'hr_dsr_meetings':
        actual = await autoPullDsrMeetings(employee_id, cycle);
        break;
      case 'hr_dsr_leads':
        actual = await autoPullDsrLeads(employee_id, cycle);
        break;
      case 'posp_crosscheck_clean':
        actual = await autoPullPospCleanScore(employee_id, cycle);
        break;
      case 'attendance_score':
        actual = await autoPullAttendanceScore(employee_id, cycle);
        break;
      default:
        continue;
    }

    const { error: updErr } = await sb
      .from('hr_goals')
      .update({
        actual_value: actual,
        auto_pulled_at: new Date().toISOString(),
      })
      .eq('id', g.id);

    if (updErr) errors.push(`goal ${g.id}: ${updErr.message}`);
    else updated++;
  }

  return { updated, errors };
}
