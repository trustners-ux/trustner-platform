/**
 * Investment Proposal — client-facing proposal document (HTML → print-to-PDF).
 *
 * Premium standalone deliverable for the IP module, built to the PD report
 * standard with the shared SEBI riskometer + MFD compliance footer. Companion
 * to the Periodic Review note and Client Orientation summary.
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
import { donutSvg, donutLegend, provenanceChip, type DonutSegment } from '@/lib/advisory/charts';
import { esc, inrShort } from '@/lib/advisory/format';
import { DELIVERABLE_SHELL_CSS, renderMasthead } from '@/lib/advisory/deliverable-shell';
import { BRAND } from '@/lib/portfolio-diagnostic/reports/_shared-styles';
import { COMPANY } from '@/lib/constants/company';

export interface ProposalRow {
  document_id: string;
  family_name: string;
  purpose: string | null;
  custom_purpose_note: string | null;
  goal_statement: string | null;
  risk_profile: string | null;
  horizon: string | null;
  proposed_amount_inr: number | null;
  proposed_lump_sum_inr: number | null;
  proposed_monthly_sip_inr: number | null;
  alloc_large_cap_pct: number | null;
  alloc_mid_cap_pct: number | null;
  alloc_small_cap_pct: number | null;
  alloc_flexi_cap_pct: number | null;
  alloc_multi_cap_pct: number | null;
  alloc_large_and_mid_pct: number | null;
  alloc_hybrid_pct: number | null;
  alloc_debt_pct: number | null;
  alloc_international_pct: number | null;
  alloc_gold_pct: number | null;
  expected_5y_conservative_inr: number | null;
  expected_5y_base_inr: number | null;
  expected_5y_optimistic_inr: number | null;
  expected_10y_base_inr: number | null;
}

export interface ProposalDocOpts {
  rmName?: string;
  showPrintBar?: boolean;
  reportDate?: string;
  status?: string | null;
}

// Sleeve → BRAND color mapping. Seven of ten reuse existing BRAND tokens
// (navy/teal/gold/watch/navyDeep/goldDeep/slateMute); three sub-asset-classes
// PD's own reports never chart as distinct donut slices get a small, muted
// BRAND.sleeve addition (see _shared-styles.ts) — no invented saturated hex.
const SLEEVES: Array<[keyof ProposalRow, string, string]> = [
  ['alloc_large_cap_pct', 'Large Cap', BRAND.navy],
  ['alloc_large_and_mid_pct', 'Large & Mid Cap', BRAND.teal],
  ['alloc_flexi_cap_pct', 'Flexi Cap', BRAND.gold],
  ['alloc_multi_cap_pct', 'Multi Cap', BRAND.watch],
  ['alloc_mid_cap_pct', 'Mid Cap', BRAND.navyDeep],
  ['alloc_small_cap_pct', 'Small Cap', BRAND.sleeve.smallCap],
  ['alloc_hybrid_pct', 'Hybrid', BRAND.sleeve.hybrid],
  ['alloc_debt_pct', 'Debt', BRAND.slateMute],
  ['alloc_international_pct', 'International', BRAND.sleeve.international],
  ['alloc_gold_pct', 'Gold', BRAND.goldDeep],
];

const STYLES = `
  ${DELIVERABLE_SHELL_CSS}
  .bar { height: 7px; background: ${BRAND.navy}; border-radius: 2px; }
  .alloc-wrap { display: flex; align-items: center; gap: 22px; margin: 8px 0; }
  .alloc-donut { flex: 0 0 auto; }
  .alloc-legend { flex: 1; }
  ${COMPLIANCE_CSS}
`;

function kpi(label: string, value: string): string {
  return `<div class="kpi-tile"><div class="lbl">${esc(label)}</div><div class="val">${value}</div></div>`;
}

export function renderInvestmentProposalDocHtml(
  p: ProposalRow,
  opts: ProposalDocOpts = {}
): string {
  const level = toRiskometerLevel(p.risk_profile);
  const printBar = opts.showPrintBar
    ? `<div class="no-print-bar no-print"><span>Investment Proposal — ${esc(p.family_name)}</span><button onclick="window.print()">Download / Print PDF</button></div>`
    : '';

  const sleeves = SLEEVES
    .map(([k, label, color]) => ({ label, color, pct: (p[k] as number | null) ?? 0 }))
    .filter((s) => s.pct > 0);
  const segments: DonutSegment[] = sleeves.map((s) => ({ label: s.label, value: s.pct, color: s.color }));
  const EQUITY = new Set(['Large Cap', 'Large & Mid Cap', 'Flexi Cap', 'Multi Cap', 'Mid Cap', 'Small Cap', 'International']);
  const equityPct = sleeves.filter((s) => EQUITY.has(s.label)).reduce((a, s) => a + s.pct, 0);

  const hasProjection =
    p.expected_5y_base_inr != null || p.expected_10y_base_inr != null;
  const projection = hasProjection
    ? `<div class="sec-title">Illustrative outcomes</div>
       <table><thead><tr><th>Horizon</th><th style="text-align:right">Conservative</th><th style="text-align:right">Base</th><th style="text-align:right">Optimistic</th></tr></thead><tbody>
       <tr><td>In 5 years</td><td class="amt">${inrShort(p.expected_5y_conservative_inr)}</td><td class="amt">${inrShort(p.expected_5y_base_inr)}</td><td class="amt">${inrShort(p.expected_5y_optimistic_inr)}</td></tr>
       ${p.expected_10y_base_inr != null ? `<tr><td>In 10 years</td><td class="amt">—</td><td class="amt">${inrShort(p.expected_10y_base_inr)}</td><td class="amt">—</td></tr>` : ''}
       </tbody></table>
       <p class="prose">These are illustrative projections, not guarantees — actual returns vary with markets.</p>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Investment Proposal — ${esc(p.family_name)}</title><style>${STYLES}</style></head><body>
${printBar}
${draftBanner(opts.status)}
${renderMasthead({ firmName: COMPANY.mfEntity.name, arn: COMPANY.mfEntity.amfiArn, docLabel: 'Investment Proposal', docId: p.document_id })}

<div class="doc-title">Investment proposal</div>
<div class="for-line" style="margin-bottom:5px">Prepared for the ${esc(p.family_name)} family${p.purpose ? ` · ${esc(p.purpose)}` : ''}</div>
<div style="margin:0 0 12px">${provenanceChip(`Risk profile: ${esc(p.risk_profile ?? '—')}`)} ${provenanceChip('Allocation aligned to your diagnostic')}</div>

<div class="kpi-grid">
  ${kpi('Amount', inrShort(p.proposed_amount_inr))}
  ${kpi('Lump sum', inrShort(p.proposed_lump_sum_inr))}
  ${kpi('Monthly SIP', inrShort(p.proposed_monthly_sip_inr))}
  ${kpi('Horizon', esc(p.horizon ?? '—'))}
</div>

${p.goal_statement ? `<div class="sec-title">Objective</div><p class="prose">${esc(p.goal_statement)}</p>` : ''}
${p.custom_purpose_note ? `<p class="prose">${esc(p.custom_purpose_note)}</p>` : ''}

<div class="sec-title">Proposed allocation</div>
<div class="alloc-wrap">
  <div class="alloc-donut">${segments.length ? donutSvg(segments, { centerLabel: `${equityPct}%`, centerSub: 'EQUITY' }) : '<span style="color:#9CA3AF;font-style:italic;font-size:9pt">Allocation to be finalised.</span>'}</div>
  <div class="alloc-legend">${donutLegend(segments)}</div>
</div>
<p class="prose">This allocation is matched to your <strong>${esc(p.risk_profile ?? '—')}</strong> risk profile (~${equityPct}% equity, ${100 - equityPct}% defensive). Specific fund recommendations (Regular plans) accompany this proposal.</p>

${projection}

<div class="tas-riskometer">${buildRiskometerSvg(level)}<div class="cap">This proposal's overall product risk is <strong>${level}</strong> (SEBI riskometer). Each recommended scheme carries its own riskometer in its scheme documents.</div></div>
${buildComplianceFooter({
  preparedBy: opts.rmName,
  documentId: p.document_id,
  reportDate: opts.reportDate,
  assumedReturnPct: hasProjection ? 12 : undefined,
})}
</body></html>`;
}
