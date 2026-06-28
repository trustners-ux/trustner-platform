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
  COMPLIANCE_CSS,
} from '@/lib/advisory/compliance';
import { donutSvg, donutLegend, provenanceChip, type DonutSegment } from '@/lib/advisory/charts';
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

const SLEEVES: Array<[keyof ProposalRow, string, string]> = [
  ['alloc_large_cap_pct', 'Large Cap', '#15233B'],
  ['alloc_large_and_mid_pct', 'Large & Mid Cap', '#2F6F4F'],
  ['alloc_flexi_cap_pct', 'Flexi Cap', '#9A7B4F'],
  ['alloc_multi_cap_pct', 'Multi Cap', '#B07A2E'],
  ['alloc_mid_cap_pct', 'Mid Cap', '#4F86C6'],
  ['alloc_small_cap_pct', 'Small Cap', '#9B5B6B'],
  ['alloc_hybrid_pct', 'Hybrid', '#C9A227'],
  ['alloc_debt_pct', 'Debt', '#6B7280'],
  ['alloc_international_pct', 'International', '#2F8F8F'],
  ['alloc_gold_pct', 'Gold', '#D4AF37'],
];

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
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: #15233B; color: #fff; padding: 4px 7px; text-align: left; font-weight: 600; font-size: 7pt; }
  td { padding: 4px 7px; border: 1px solid #E5E7EB; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; }
  .bar { height: 7px; background: #15233B; border-radius: 2px; }
  .alloc-wrap { display: flex; align-items: center; gap: 22px; margin: 8px 0; }
  .alloc-donut { flex: 0 0 auto; }
  .alloc-legend { flex: 1; }
  .prose { font-size: 9pt; color: #374151; line-height: 1.5; margin: 4px 0 0; }
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
<div class="header">
  <div>
    <div class="firm">${esc(COMPANY.mfEntity.name)}</div>
    <div class="sub">AMFI Registered Mutual Fund Distributor · ${COMPANY.mfEntity.amfiArn}</div>
  </div>
  <div class="header-right">
    <div class="label">Investment Proposal</div>
    <div>${esc(p.document_id)}</div>
  </div>
</div>

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
