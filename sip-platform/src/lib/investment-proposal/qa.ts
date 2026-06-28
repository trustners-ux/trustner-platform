/**
 * Investment Proposal — pre-publish QA gate.
 *
 * Mirrors the PD pre-publish gate (lib/portfolio-diagnostic/qa.ts): hard issues
 * (blockers) stop the publish; soft issues (warnings) are surfaced. Enforces the
 * MFD compliance basics before a proposal can go to a client.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProposalQa {
  ready: boolean;
  blockers: string[];
  warnings: string[];
}

const PROHIBITED = /\b(advisor|adviser|advisory)\b/i;

const ALLOC_KEYS = [
  'alloc_large_cap_pct', 'alloc_mid_cap_pct', 'alloc_small_cap_pct',
  'alloc_flexi_cap_pct', 'alloc_multi_cap_pct', 'alloc_large_and_mid_pct',
  'alloc_hybrid_pct', 'alloc_debt_pct', 'alloc_international_pct', 'alloc_gold_pct',
];

export async function runProposalQa(
  sb: SupabaseClient,
  proposalId: number
): Promise<ProposalQa> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const { data: p } = await sb
    .from('ip_investment_proposals')
    .select('*')
    .eq('id', proposalId)
    .maybeSingle();
  if (!p) return { ready: false, blockers: ['Proposal not found.'], warnings: [] };

  const row = p as Record<string, unknown>;
  const total = ALLOC_KEYS.reduce((s, k) => s + (Number(row[k]) || 0), 0);
  if (total < 98 || total > 102) {
    blockers.push(`Asset allocation totals ${total}% — it must sum to ~100% before publishing.`);
  }

  if (!row.proposed_amount_inr || Number(row.proposed_amount_inr) <= 0) {
    blockers.push('Proposed amount is missing or zero.');
  }
  if (!row.horizon) blockers.push('Investment horizon is not set.');
  if (!row.risk_profile) blockers.push('Risk profile is not set.');

  const textFields: Array<[string, unknown]> = [
    ['goal statement', row.goal_statement],
    ['purpose note', row.custom_purpose_note],
    ['purpose', row.purpose],
  ];
  for (const [label, val] of textFields) {
    if (val && PROHIBITED.test(String(val))) {
      blockers.push(`Prohibited term "advisor/advisory" found in ${label} — MFDs must use "Relationship Manager"; rephrase before publishing.`);
    }
  }

  const sip = Number(row.proposed_monthly_sip_inr) || 0;
  const lump = Number(row.proposed_lump_sum_inr) || 0;
  if (sip === 0 && lump === 0) {
    warnings.push('Neither a lump sum nor a monthly SIP is specified — confirm the funding plan.');
  }
  if (!row.goal_statement) {
    warnings.push('No goal statement captured — the proposal reads better with the client objective stated.');
  }

  return { ready: blockers.length === 0, blockers, warnings };
}
