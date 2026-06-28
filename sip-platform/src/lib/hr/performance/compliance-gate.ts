/**
 * Performance — Compliance Gate.
 *
 * Hard-caps any performance rating at 3 ("Meets Expectations") when ANY
 * of the following is true:
 *   - Open POSP cross-check flag exists
 *   - Open compliance helpdesk ticket exists
 *   - LOP days in cycle > 8
 *   - Missed DSR > 5 days in last 30 days
 *
 * This is policy, not warning. The rating engine MUST consult this
 * before persisting hr_rating.final_performance_rating.
 *
 * Reads the hr_compliance_check view created in migration 024.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { CycleWindow } from './auto-feeds';

export interface ComplianceCapResult {
  capped: boolean;
  reason: string[];
  details: {
    posp_open_flags: number;
    compliance_open_tickets: number;
    lop_days_cycle: number;
    missed_dsr_last_30: number;
  };
}

const LOP_THRESHOLD = 8;
const MISSED_DSR_THRESHOLD = 5;

/**
 * Returns { capped, reason[] } where capped=true means the rating
 * MUST be limited to a max of 3.
 *
 * `cycle` is currently used only for forward-compatibility — the view
 * `hr_compliance_check` already uses a rolling 365-day proxy. When
 * cycle-precise LOP is needed, replace the view read with an explicit
 * SELECT over hr_attendance_logs bounded by cycle.start_date / end_date.
 */
export async function computeComplianceCap(
  employee_id: number,
  _cycle?: CycleWindow
): Promise<ComplianceCapResult> {
  const sb = getSupabaseAdmin();
  const empty: ComplianceCapResult = {
    capped: false,
    reason: [],
    details: {
      posp_open_flags: 0,
      compliance_open_tickets: 0,
      lop_days_cycle: 0,
      missed_dsr_last_30: 0,
    },
  };
  if (!sb) return empty;

  const { data, error } = await sb
    .from('hr_compliance_check')
    .select(
      'posp_open_flags, compliance_open_tickets, lop_days_cycle, missed_dsr_last_30, compliance_clear'
    )
    .eq('employee_id', employee_id)
    .maybeSingle();

  if (error || !data) return empty;

  const reason: string[] = [];
  const d = data as {
    posp_open_flags: number;
    compliance_open_tickets: number;
    lop_days_cycle: number;
    missed_dsr_last_30: number;
    compliance_clear: boolean;
  };

  if ((d.posp_open_flags ?? 0) > 0) {
    reason.push(
      `${d.posp_open_flags} open POSP cross-check flag(s) — hard cap`
    );
  }
  if ((d.compliance_open_tickets ?? 0) > 0) {
    reason.push(
      `${d.compliance_open_tickets} open compliance ticket(s) — hard cap`
    );
  }
  if ((d.lop_days_cycle ?? 0) > LOP_THRESHOLD) {
    reason.push(
      `LOP ${d.lop_days_cycle} days in cycle > ${LOP_THRESHOLD} threshold — hard cap`
    );
  }
  if ((d.missed_dsr_last_30 ?? 0) > MISSED_DSR_THRESHOLD) {
    reason.push(
      `Missed DSR ${d.missed_dsr_last_30} days in last 30 > ${MISSED_DSR_THRESHOLD} — hard cap`
    );
  }

  return {
    capped: reason.length > 0,
    reason,
    details: {
      posp_open_flags: d.posp_open_flags ?? 0,
      compliance_open_tickets: d.compliance_open_tickets ?? 0,
      lop_days_cycle: d.lop_days_cycle ?? 0,
      missed_dsr_last_30: d.missed_dsr_last_30 ?? 0,
    },
  };
}

/**
 * Convenience: applies the cap to a proposed rating.
 * If capped, returns 3. Otherwise returns the proposed rating unchanged.
 */
export function applyCap(
  proposedRating: number,
  cap: ComplianceCapResult
): number {
  if (cap.capped) return Math.min(proposedRating, 3);
  return proposedRating;
}
