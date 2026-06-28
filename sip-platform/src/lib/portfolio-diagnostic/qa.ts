/**
 * Portfolio Diagnostic — Pre-publish QA gate ("deliverable lint").
 *
 * Runs an automated set of checks BEFORE a diagnostic can be published to a
 * client. Hard issues (blockers) stop the publish; soft issues (warnings) are
 * surfaced for the reviewer's eye. This is the last line of defence before a
 * client sees a deliverable — it enforces, in code, the things the team used to
 * have to remember by hand.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PrePublishQa {
  ready: boolean;        // true ⇢ no blockers
  blockers: string[];    // must be fixed before publish
  warnings: string[];    // surface, but don't block
}

// Strip the ONE allowed occurrence (the SEBI regulatory disclaimer phrase) before
// scanning for prohibited adviser/advisory terminology.
function stripAllowedAdvice(s: string): string {
  return (s || '')
    .replace(/Investment Advisers\)?\s*Regulations,?\s*2013/gi, '')
    .replace(/SEBI\s*\(Investment Advisers\)/gi, '');
}
function findProhibited(s: string | null | undefined): string | null {
  const m = stripAllowedAdvice(s || '').match(/advis[oe]rs?\b|advisory/i);
  return m ? m[0] : null;
}

export async function runPrePublishQa(sb: SupabaseClient, runId: number): Promise<PrePublishQa> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const { data: run } = await sb
    .from('pd_diagnostic_runs')
    .select('id, family_name, status, total_invested_inr, current_value_inr, rp_primary_age, rp_stated_priority, rp_life_stage')
    .eq('id', runId)
    .maybeSingle();
  if (!run) return { ready: false, blockers: ['Diagnostic not found.'], warnings: [] };

  // 1) Risk profile must be captured (no publishing default-profile verdicts as final)
  const captured = run.rp_primary_age != null || run.rp_stated_priority != null || run.rp_life_stage != null;
  if (!captured) {
    blockers.push('Risk profile not captured — verdicts ran on a generic default. Capture the client profile and re-score before publishing.');
  }

  // 2) Every holding must be scored (no leftover "Pending analysis" placeholders)
  const { data: holdings } = await sb
    .from('pd_diagnostic_holdings')
    .select('id, fund_name, verdict, verdict_rationale, override_reason, current_value_inr')
    .eq('diagnostic_run_id', runId);
  const rows = holdings ?? [];
  const unscored = rows.filter((h) => !h.verdict || /pending analysis/i.test((h.verdict_rationale as string) || ''));
  if (unscored.length > 0) {
    blockers.push(`${unscored.length} holding(s) not yet scored — run scoring before publishing.`);
  }

  // 3) Compliance scan — no prohibited adviser/advisory terms in any human-entered
  //    text (the generators are already clean; this guards free text + the narrative).
  const scanTargets: { label: string; text: string }[] = [{ label: 'family name', text: (run.family_name as string) || '' }];
  for (const h of rows) {
    if (h.verdict_rationale) scanTargets.push({ label: `rationale for ${h.fund_name}`, text: h.verdict_rationale as string });
    if (h.override_reason) scanTargets.push({ label: `override note for ${h.fund_name}`, text: h.override_reason as string });
  }
  const { data: comments } = await sb
    .from('pd_diagnostic_comments').select('comment').eq('diagnostic_run_id', runId);
  for (const c of comments ?? []) if (c.comment) scanTargets.push({ label: 'a review comment', text: c.comment as string });
  const { data: narr } = await sb
    .from('pd_diagnostic_narratives').select('*').eq('diagnostic_run_id', runId).maybeSingle();
  if (narr) scanTargets.push({ label: 'the narrative', text: JSON.stringify(narr) });

  const seen = new Set<string>();
  for (const t of scanTargets) {
    const hit = findProhibited(t.text);
    if (hit && !seen.has(t.label)) {
      seen.add(t.label);
      blockers.push(`Prohibited term "${hit}" found in ${t.label} — MFDs must not use advisor/advisory; rephrase before publishing.`);
    }
  }

  // 4) WARNING — holdings total should reconcile with the run total (within 2%)
  const sumCurrent = rows.reduce((s, h) => s + (Number(h.current_value_inr) || 0), 0);
  const runCurrent = Number(run.current_value_inr) || 0;
  if (runCurrent > 0 && Math.abs(sumCurrent - runCurrent) / runCurrent > 0.02) {
    warnings.push(`Holdings total (₹${Math.round(sumCurrent).toLocaleString('en-IN')}) differs from the run total (₹${Math.round(runCurrent).toLocaleString('en-IN')}) — verify the figures.`);
  }

  return { ready: blockers.length === 0, blockers, warnings };
}
