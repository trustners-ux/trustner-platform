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
  draftBanner,
  COMPLIANCE_CSS,
  type RiskometerLevel,
} from '@/lib/advisory/compliance';
import { compareBarSvg, provenanceChip } from '@/lib/advisory/charts';
import { esc, inrShort } from '@/lib/advisory/format';
import { DELIVERABLE_SHELL_CSS, renderMasthead } from '@/lib/advisory/deliverable-shell';
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
  status?: string | null;
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
  ${DELIVERABLE_SHELL_CSS}
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
  const level = opts.riskometerLevel ?? toRiskometerLevel(r.risk_category);
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
${draftBanner(opts.status)}
${renderMasthead({ firmName: COMPANY.mfEntity.name, arn: COMPANY.mfEntity.amfiArn, docLabel: 'Periodic Review', docId: r.document_id })}

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
