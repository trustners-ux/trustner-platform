/**
 * Client Orientation — client-facing financial orientation summary (HTML → PDF).
 *
 * Premium onboarding deliverable built to the PD report standard with the shared
 * SEBI riskometer + MFD compliance footer. Shows the captured profile, the risk
 * category, and the goal plan (required SIP per goal). Companion to the Periodic
 * Review note (lib/periodic-review/note.ts).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import {
  buildComplianceFooter,
  buildRiskometerSvg,
  toRiskometerLevel,
  draftBanner,
  COMPLIANCE_CSS,
} from '@/lib/advisory/compliance';
import { compareBarSvg, provenanceChip } from '@/lib/advisory/charts';
import { esc, inrShort } from '@/lib/advisory/format';
import { DELIVERABLE_SHELL_CSS, renderMasthead } from '@/lib/advisory/deliverable-shell';
import { COMPANY } from '@/lib/constants/company';

export interface OrientationRow {
  document_id: string;
  family_name: string;
  monthly_household_income_inr: number | null;
  monthly_household_expenses_inr: number | null;
  monthly_existing_sips_inr: number | null;
  monthly_emis_inr: number | null;
  emergency_fund_months: number | null;
  surplus_for_new_sips_inr: number | null;
  num_dependents: number | null;
  investment_experience_years: number | null;
  pref_review_frequency: string | null;
  pref_channel: string | null;
  risk_score: number | null;
  risk_category: string | null;
}

export interface OrientationGoal {
  goal_type: string | null;
  custom_goal_name: string | null;
  target_year: number | null;
  target_corpus_today_value_inr: number | null;
  target_corpus_future_value_inr: number | null;
  expected_return_pct: number | null;
  required_monthly_sip_inr: number | null;
  existing_corpus_inr: number | null;
  priority: string | null;
}

export interface SummaryOpts {
  rmName?: string;
  showPrintBar?: boolean;
  reportDate?: string;
  status?: string | null;
}

const STYLES = `
  ${DELIVERABLE_SHELL_CSS}
  ${COMPLIANCE_CSS}
`;

function kpi(label: string, value: string): string {
  return `<div class="kpi-tile"><div class="lbl">${esc(label)}</div><div class="val">${value}</div></div>`;
}

function goalName(g: OrientationGoal): string {
  if (g.custom_goal_name) return esc(g.custom_goal_name);
  return esc(g.goal_type ?? 'Goal');
}

export function renderOrientationSummaryHtml(
  o: OrientationRow,
  goals: OrientationGoal[],
  opts: SummaryOpts = {}
): string {
  const level = toRiskometerLevel(o.risk_category);
  const printBar = opts.showPrintBar
    ? `<div class="no-print-bar no-print"><span>Orientation Summary — ${esc(o.family_name)}</span><button onclick="window.print()">Download / Print PDF</button></div>`
    : '';

  const surplus =
    o.surplus_for_new_sips_inr ??
    (o.monthly_household_income_inr != null && o.monthly_household_expenses_inr != null
      ? o.monthly_household_income_inr - o.monthly_household_expenses_inr - (o.monthly_existing_sips_inr ?? 0) - (o.monthly_emis_inr ?? 0)
      : null);

  const totalRequiredSip = goals.reduce((s, g) => s + (g.required_monthly_sip_inr ?? 0), 0);

  const goalRows =
    goals.length > 0
      ? goals
          .map(
            (g) =>
              `<tr><td>${goalName(g)}</td><td class="amt">${g.target_year ?? '—'}</td><td class="amt">${inrShort(g.target_corpus_future_value_inr ?? g.target_corpus_today_value_inr)}</td><td class="amt">${inrShort(g.existing_corpus_inr)}</td><td class="amt">${inrShort(g.required_monthly_sip_inr)}</td><td>${esc(g.priority ?? '')}</td></tr>`
          )
          .join('')
      : `<tr><td colspan="6" style="color:#9CA3AF;font-style:italic">No goals captured yet.</td></tr>`;

  const affordability =
    surplus != null && totalRequiredSip > 0
      ? `<p class="prose">Your goals call for about <strong>${inrShort(totalRequiredSip)}/month</strong> of fresh investment. Your estimated monthly surplus available for new SIPs is <strong>${inrShort(surplus)}</strong>${surplus >= totalRequiredSip ? ' — comfortably within reach.' : ` — currently short of the requirement, so we will prioritise goals and phase the plan with a step-up.`}</p>
       ${compareBarSvg(totalRequiredSip, surplus, { startLabel: 'Need', currentLabel: 'Surplus', fmt: inrShort })}`
      : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Orientation Summary — ${esc(o.family_name)}</title><style>${STYLES}</style></head><body>
${printBar}
${draftBanner(opts.status)}
${renderMasthead({ firmName: COMPANY.mfEntity.name, arn: COMPANY.mfEntity.amfiArn, docLabel: 'Financial Orientation', docId: o.document_id })}

<div class="doc-title">Your financial orientation summary</div>
<div class="for-line" style="margin-bottom:5px">Prepared for the ${esc(o.family_name)} family</div>
<div style="margin:0 0 12px">${provenanceChip(`Risk profile: ${esc(o.risk_category ?? 'not captured')}`)} ${provenanceChip(`${goals.length} goal${goals.length === 1 ? '' : 's'} planned`)}</div>

<div class="kpi-grid">
  ${kpi('Monthly income', inrShort(o.monthly_household_income_inr))}
  ${kpi('Monthly surplus', inrShort(surplus))}
  ${kpi('Risk profile', esc(o.risk_category ?? 'Not captured'))}
  ${kpi('Active goals', String(goals.length))}
</div>

<div class="sec-title">Your profile</div>
<p class="prose">Monthly household income ${inrShort(o.monthly_household_income_inr)}, expenses ${inrShort(o.monthly_household_expenses_inr)}${o.monthly_existing_sips_inr ? `, existing SIPs ${inrShort(o.monthly_existing_sips_inr)}` : ''}${o.monthly_emis_inr ? `, EMIs ${inrShort(o.monthly_emis_inr)}` : ''}.${o.num_dependents != null ? ` ${o.num_dependents} dependent(s).` : ''}${o.emergency_fund_months != null ? ` Emergency cover: ~${o.emergency_fund_months} months.` : ''}${o.investment_experience_years != null ? ` Investing experience: ${o.investment_experience_years} year(s).` : ''}</p>

<div class="sec-title">Your goals</div>
<table><thead><tr><th>Goal</th><th style="text-align:right">By</th><th style="text-align:right">Target corpus</th><th style="text-align:right">Already saved</th><th style="text-align:right">Monthly SIP</th><th>Priority</th></tr></thead><tbody>${goalRows}</tbody></table>
${affordability}

<div class="tas-riskometer">${buildRiskometerSvg(level)}<div class="cap">Your risk profile is <strong>${esc(o.risk_category ?? '—')}</strong>. The funds we recommend will be selected to match this profile; each carries its own SEBI riskometer in its scheme documents.</div></div>
${buildComplianceFooter({
  preparedBy: opts.rmName,
  documentId: o.document_id,
  reportDate: opts.reportDate,
  assumedReturnPct: goals.find((g) => g.expected_return_pct != null)?.expected_return_pct ?? 12,
})}
</body></html>`;
}
