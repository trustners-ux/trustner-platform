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
  COMPLIANCE_CSS,
} from '@/lib/advisory/compliance';
import { compareBarSvg, provenanceChip } from '@/lib/advisory/charts';
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
}

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inrShort(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

const STYLES = `
  @page { size: A4; margin: 15mm 18mm 14mm 18mm; }
  @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } html { background: white; } }
  @media screen { html { background: #EDEFF2; min-height: 100vh; } html body { max-width: 210mm; margin: 16px auto; padding: 15mm 18mm; box-shadow: 0 6px 28px rgba(21,35,59,0.12); } }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; line-height: 1.45; font-size: 9.5pt; margin: 0; background: white; }
  .no-print-bar { position: sticky; top: 0; background: #15233B; color: #fff; padding: 8px 16px; margin: -15mm -18mm 8mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; }
  .no-print-bar button { background: #9A7B4F; color: #fff; border: 0; padding: 6px 14px; font-weight: 700; border-radius: 3px; cursor: pointer; font-size: 10pt; }
  .header { border-bottom: 1px solid #15233B; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header .firm { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-weight: 700; font-size: 13.5pt; }
  .header .sub { color: #6B7280; font-size: 7.5pt; margin-top: 1px; letter-spacing: .3px; }
  .header-right { text-align: right; font-size: 8pt; color: #6B7280; }
  .header-right .label { font-family: Georgia, serif; font-size: 9pt; color: #9A7B4F; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
  .doc-title { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-size: 16pt; font-weight: 700; margin: 12px 0 1px; }
  .for-line { font-size: 8.5pt; color: #6B7280; margin: 0 0 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .kpi-tile { background: #fff; border: 1px solid #E5E7EB; border-top: 2px solid #15233B; padding: 9px 10px; }
  .kpi-tile .lbl { font-size: 6.6pt; color: #6B7280; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
  .kpi-tile .val { font-family: Georgia, serif; font-size: 14pt; font-weight: 700; color: #15233B; line-height: 1.05; margin-top: 4px; }
  .sec-title { font-family: Georgia, serif; color: #15233B; font-size: 11pt; font-weight: 700; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #E5E7EB; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: #15233B; color: #fff; padding: 4px 7px; text-align: left; font-weight: 600; font-size: 7pt; }
  td { padding: 4px 7px; border: 1px solid #E5E7EB; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; }
  .prose { font-size: 9pt; color: #374151; line-height: 1.5; margin: 4px 0 0; }
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
<div class="header">
  <div>
    <div class="firm">${esc(COMPANY.mfEntity.name)}</div>
    <div class="sub">AMFI Registered Mutual Fund Distributor · ${COMPANY.mfEntity.amfiArn}</div>
  </div>
  <div class="header-right">
    <div class="label">Financial Orientation</div>
    <div>${esc(o.document_id)}</div>
  </div>
</div>

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
