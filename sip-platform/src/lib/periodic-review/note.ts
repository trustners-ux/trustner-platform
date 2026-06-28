/**
 * Periodic Review — client-facing performance note (HTML → print-to-PDF).
 *
 * The first premium client deliverable for the Advisory Workbench's Periodic
 * Review module, built to the PD report standard (navy/gold masthead, KPI strip)
 * with the shared SEBI riskometer + MFD compliance footer baked in. Performance
 * numbers come from the data-grounded review row (auto-pulled from the PD run).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import {
  buildComplianceFooter,
  buildRiskometerSvg,
  toRiskometerLevel,
  COMPLIANCE_CSS,
  type RiskometerLevel,
} from '@/lib/advisory/compliance';
import { compareBarSvg, provenanceChip } from '@/lib/advisory/charts';
import { COMPANY } from '@/lib/constants/company';

export interface PeriodicReviewRow {
  document_id: string;
  family_name: string;
  cadence: string | null;
  review_period_start: string | null;
  review_period_end: string | null;
  current_aum_inr: number | null;
  period_start_aum_inr: number | null;
  period_gain_inr: number | null;
  period_return_pct: number | null;
  family_xirr_pct: number | null;
  benchmark_return_pct: number | null;
  alpha_pct: number | null;
  top_contributor_1: string | null; top_contributor_1_contribution_inr: number | null;
  top_contributor_2: string | null; top_contributor_2_contribution_inr: number | null;
  top_contributor_3: string | null; top_contributor_3_contribution_inr: number | null;
  top_detractor_1: string | null; top_detractor_1_contribution_inr: number | null;
  top_detractor_2: string | null; top_detractor_2_contribution_inr: number | null;
  top_detractor_3: string | null; top_detractor_3_contribution_inr: number | null;
  num_active_goals: number | null;
  num_goals_on_track: number | null;
  num_goals_behind: number | null;
  market_summary: string | null;
  outlook_next_period: string | null;
  risk_category?: string | null;
}

export interface PeriodicReviewActionItem {
  description: string;
  owner: string | null;
  status: string | null;
  due_date: string | null;
}

export interface NoteOpts {
  rmName?: string;
  showPrintBar?: boolean;
  riskometerLevel?: RiskometerLevel;
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

function pct(v: number | null | undefined, sign = false): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${sign && v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return esc(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  .kpi-tile .val { font-family: Georgia, serif; font-size: 15pt; font-weight: 700; color: #15233B; line-height: 1.05; margin-top: 4px; }
  .kpi-tile .val.pos { color: #1E6B43; } .kpi-tile .val.neg { color: #9B2C3A; }
  .sec-title { font-family: Georgia, serif; color: #15233B; font-size: 11pt; font-weight: 700; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #E5E7EB; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: #15233B; color: #fff; padding: 4px 7px; text-align: left; font-weight: 600; font-size: 7pt; letter-spacing: .3px; }
  td { padding: 4px 7px; border: 1px solid #E5E7EB; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; }
  .pos { color: #1E6B43; } .neg { color: #9B2C3A; }
  .prose { font-size: 9pt; color: #374151; line-height: 1.5; margin: 4px 0 0; }
  ${COMPLIANCE_CSS}
`;

function kpi(label: string, value: string, tone?: 'pos' | 'neg'): string {
  return `<div class="kpi-tile"><div class="lbl">${esc(label)}</div><div class="val ${tone ?? ''}">${value}</div></div>`;
}

function contributorRows(
  rows: Array<{ name: string | null; v: number | null }>,
  emptyLabel: string
): string {
  const present = rows.filter((r) => r.name);
  if (present.length === 0) return `<tr><td colspan="2" style="color:#9CA3AF;font-style:italic">${emptyLabel}</td></tr>`;
  return present
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td class="amt ${(r.v ?? 0) >= 0 ? 'pos' : 'neg'}">${inrShort(r.v)}</td></tr>`
    )
    .join('');
}

export function renderPeriodicReviewNoteHtml(
  r: PeriodicReviewRow,
  actionItems: PeriodicReviewActionItem[],
  opts: NoteOpts = {}
): string {
  const level = opts.riskometerLevel ?? toRiskometerLevel(r.risk_category ?? 'Very High');
  const printBar = opts.showPrintBar
    ? `<div class="no-print-bar no-print"><span>Periodic Review — ${esc(r.family_name)}</span><button onclick="window.print()">Download / Print PDF</button></div>`
    : '';

  const cadence = r.cadence ? `${esc(r.cadence)} review` : 'Portfolio review';
  const periodReturnTone = (r.period_return_pct ?? 0) >= 0 ? 'pos' : 'neg';

  const contributors = contributorRows(
    [
      { name: r.top_contributor_1, v: r.top_contributor_1_contribution_inr },
      { name: r.top_contributor_2, v: r.top_contributor_2_contribution_inr },
      { name: r.top_contributor_3, v: r.top_contributor_3_contribution_inr },
    ],
    'To be discussed in your review meeting.'
  );
  const detractors = contributorRows(
    [
      { name: r.top_detractor_1, v: r.top_detractor_1_contribution_inr },
      { name: r.top_detractor_2, v: r.top_detractor_2_contribution_inr },
      { name: r.top_detractor_3, v: r.top_detractor_3_contribution_inr },
    ],
    'To be discussed in your review meeting.'
  );

  const actionRows =
    actionItems.length > 0
      ? actionItems
          .map(
            (a) =>
              `<tr><td>${esc(a.description)}</td><td>${esc(a.owner ?? '')}</td><td>${esc(a.status ?? '')}</td><td>${fmtDate(a.due_date)}</td></tr>`
          )
          .join('')
      : `<tr><td colspan="4" style="color:#9CA3AF;font-style:italic">No open action items for this period.</td></tr>`;

  const goalsLine =
    r.num_active_goals != null && r.num_active_goals > 0
      ? `<p class="prose"><strong>Goals:</strong> ${r.num_goals_on_track ?? 0} of ${r.num_active_goals} on track${(r.num_goals_behind ?? 0) > 0 ? `, ${r.num_goals_behind} need attention` : ''}.</p>`
      : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Periodic Review — ${esc(r.family_name)}</title><style>${STYLES}</style></head><body>
${printBar}
<div class="header">
  <div>
    <div class="firm">${esc(COMPANY.mfEntity.name)}</div>
    <div class="sub">AMFI Registered Mutual Fund Distributor · ${COMPANY.mfEntity.amfiArn}</div>
  </div>
  <div class="header-right">
    <div class="label">Periodic Review</div>
    <div>${esc(r.document_id)}</div>
  </div>
</div>

<div class="doc-title">${esc(cadence)}</div>
<div class="for-line" style="margin-bottom:5px">Prepared for the ${esc(r.family_name)} family · Period ${fmtDate(r.review_period_start)} – ${fmtDate(r.review_period_end)}</div>
<div style="margin:0 0 12px">${provenanceChip(`Valued as of ${fmtDate(r.review_period_end)}`)} ${provenanceChip('Source: your portfolio diagnostic')}</div>

<div class="kpi-grid">
  ${kpi('Current value', inrShort(r.current_aum_inr))}
  ${kpi('Return this period', pct(r.period_return_pct, true), periodReturnTone)}
  ${kpi('Portfolio XIRR', pct(r.family_xirr_pct))}
  ${kpi('vs Benchmark', pct(r.alpha_pct, true), (r.alpha_pct ?? 0) >= 0 ? 'pos' : 'neg')}
</div>

<div class="sec-title">Performance this period</div>
<p class="prose">Your portfolio moved from <strong>${inrShort(r.period_start_aum_inr)}</strong> at the start of the period to <strong>${inrShort(r.current_aum_inr)}</strong> now — a change of <strong class="${periodReturnTone}">${inrShort(r.period_gain_inr)}</strong> (${pct(r.period_return_pct, true)}).${r.benchmark_return_pct != null ? ` Over the same period the benchmark returned ${pct(r.benchmark_return_pct)}, so your portfolio's excess return was ${pct(r.alpha_pct, true)}.` : ''} Your portfolio's since-inception XIRR is ${pct(r.family_xirr_pct)}.</p>
${r.period_start_aum_inr != null && r.current_aum_inr != null ? compareBarSvg(r.period_start_aum_inr, r.current_aum_inr, { startLabel: 'Start', currentLabel: 'Now', fmt: inrShort }) : ''}
${goalsLine}

<div class="two-col">
  <div>
    <div class="sec-title">Top contributors</div>
    <table><thead><tr><th>Holding</th><th style="text-align:right">Gain</th></tr></thead><tbody>${contributors}</tbody></table>
  </div>
  <div>
    <div class="sec-title">Detractors</div>
    <table><thead><tr><th>Holding</th><th style="text-align:right">Impact</th></tr></thead><tbody>${detractors}</tbody></table>
  </div>
</div>

${r.market_summary ? `<div class="sec-title">Market context</div><p class="prose">${esc(r.market_summary)}</p>` : ''}
${r.outlook_next_period ? `<div class="sec-title">Outlook for the period ahead</div><p class="prose">${esc(r.outlook_next_period)}</p>` : ''}

<div class="sec-title">Action items</div>
<table><thead><tr><th>Action</th><th>Owner</th><th>Status</th><th>By</th></tr></thead><tbody>${actionRows}</tbody></table>

<div class="tas-riskometer">${buildRiskometerSvg(level)}<div class="cap">Most equity mutual fund schemes carry ${level} product risk (SEBI riskometer). Read scheme documents for each fund's own riskometer.</div></div>
${buildComplianceFooter({
  preparedBy: opts.rmName,
  documentId: r.document_id,
  reportDate: fmtDate(r.review_period_end),
  hasTaxEstimates: false,
})}
</body></html>`;
}
