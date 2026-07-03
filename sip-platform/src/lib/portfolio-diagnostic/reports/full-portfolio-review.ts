/**
 * Full Portfolio Review HTML report
 *
 * Mirrors the Rohit Jain Family May 2026 reference output:
 *   /Portfolio Review/Rohit Jain Family May 2026/09_Full_Portfolio_Review.pdf
 *
 * Renders an A4-print-styled HTML document with verdict-tiered holdings
 * tables, KPI strip, and key observations. User clicks "Download PDF"
 * in the UI, which opens this in a new tab and triggers window.print().
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  ReportHolding,
  formatInrShort,
  formatInrFull,
  formatPct,
  riskNotCapturedBanner,
} from '../report-data';
import { REPORT_TABLE_CSS } from './_shared-styles';
import { renderHealthGaugeSvg } from '../v2/portfolio-health-score';

const STYLES = `
  @page {
    size: A4;
    margin: 14mm 16mm 16mm 16mm;
  }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
  }
  /* Screen-only: render the report as a centered "paper" on a soft grey
     background so the on-screen preview has breathing room L/R.
     Print mode strips this back to plain @page margins. */
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    /* html body is more specific than plain body — wins over later body{margin:0} */
    html body { max-width: 210mm; margin: 16px auto; padding: 14mm 16mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1F2937;
    line-height: 1.3;
    font-size: 7.5pt;
    margin: 0;
    background: white;
  }
  .container { max-width: 178mm; margin: 0 auto; padding: 4mm 0; }
  .no-print-bar {
    position: sticky; top: 0; z-index: 100; background: #15233B; color: white;
    padding: 8px 16px; margin: -4mm 0 8mm 0; display: flex; gap: 12px; align-items: center; justify-content: space-between;
    font-size: 9pt;
  }
  .no-print-bar button {
    background: white; color: #15233B; border: 0; padding: 6px 14px; font-weight: 700; font-size: 9pt;
    border-radius: 4px; cursor: pointer;
  }

  .header {
    border-bottom: 2px solid #15233B;
    padding-bottom: 4px;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left .firm-name { color: #15233B; font-weight: 700; font-size: 10pt; }
  .header-left .firm-sub { color: #64748B; font-size: 6.5pt; }
  .header-right { text-align: right; font-size: 6.8pt; color: #64748B; }
  .header-right .label { font-size: 7.5pt; color: #15233B; font-weight: 700; letter-spacing: 0.5px; }

  .doc-title {
    background: #15233B;
    color: white;
    padding: 5px 10px;
    font-size: 11.5pt;
    font-weight: 700;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .doc-title .sub { font-size: 8pt; font-weight: 400; color: #C9D2DD; }

  .snapshot {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    margin-bottom: 6px;
  }
  .tile {
    background: #F4F6F8;
    border: 1px solid #15233B;
    padding: 4px 5px;
    text-align: center;
  }
  .tile .lbl { font-size: 6pt; color: #15233B; font-weight: 700; letter-spacing: 0.3px; }
  .tile .val { font-size: 11pt; font-weight: 700; color: #15233B; line-height: 1.05; margin-top: 1px; }

  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    color: #15233B;
    font-size: 9.5pt;
    margin: 8px 0 4px 0;
    padding: 4px 10px;
    border-left: 3px solid #15233B;
    background: #F4F6F8;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  h2 .count { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5pt; font-weight: 600; color: #6B7280; }
  .h2-star  { border-left-color: #9A7B4F; }
  .h2-keep  { border-left-color: #2F6F4F; }
  .h2-watch { border-left-color: #B07A2E; }
  .h2-swap  { border-left-color: #9B2C3A; }
  .h2-liq   { border-left-color: #6B7280; }

  /* Holdings table + verdict badges — shared canonical definition. */
  ${REPORT_TABLE_CSS}

  .legend {
    display: flex;
    gap: 10px;
    margin: 3px 0 4px 0;
    font-size: 6.8pt;
    color: #64748B;
    flex-wrap: wrap;
  }
  .legend .verdict { width: auto; padding: 1px 6px; }

  .summary-table {
    margin-top: 8px;
  }
  .summary-table th, .summary-table td {
    text-align: center;
  }
  .summary-table .tier-label { text-align: left; font-weight: 700; }

  .observations {
    margin-top: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .obs-card {
    border: 1px solid #E5E7EB;
    border-radius: 3px;
    padding: 5px 8px;
    font-size: 7pt;
  }
  .obs-card.good { border-left: 3px solid #2F6F4F; background: #E8F1EC; }
  .obs-card.bad { border-left: 3px solid #9B2C3A; background: #F6E6E9; }
  .obs-card.watch { border-left: 3px solid #B07A2E; background: #FAF7F2; }
  .obs-card.proj { border-left: 3px solid #15233B; background: #F4F6F8; }
  .obs-card h3 {
    margin: 0 0 3px 0; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.2px;
    text-transform: uppercase;
  }
  .obs-card.good h3 { color: #2F6F4F; }
  .obs-card.bad h3 { color: #9B2C3A; }
  .obs-card.watch h3 { color: #B07A2E; }
  .obs-card.proj h3 { color: #15233B; }
  .obs-card ul { margin: 0; padding-left: 14px; }
  .obs-card li { margin-bottom: 2px; }

  .footer-note {
    margin-top: 6px;
    padding: 5px 9px;
    border-left: 3px solid #9A7B4F;
    background: #FAF7F2;
    font-size: 7pt;
    color: #1F2937;
  }
  .footer-note strong { color: #9A7B4F; }

  .compliance {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #E5E7EB;
    font-size: 5.8pt;
    color: #64748B;
    line-height: 1.3;
    text-align: justify;
  }

  .page-break { page-break-before: always; }

  /* v2 intelligence — buy-list marker, exit/switch tags, consolidation & tax sections */
  .buylist-mark {
    display: inline-block;
    font-size: 5.6pt;
    font-weight: 700;
    color: #9A7B4F;
    background: #F5EFE3;
    border: 1px solid #9A7B4F;
    border-radius: 2px;
    padding: 0 3px;
    letter-spacing: 0.2px;
  }
  .v2-tag {
    margin-top: 2px;
    font-size: 5.6pt;
    font-weight: 700;
    border-radius: 2px;
    padding: 0 3px;
    display: inline-block;
    letter-spacing: 0.2px;
  }
  .v2-exit { background: #F6E6E9; color: #9B2C3A; border: 1px solid #9B2C3A; }
  .v2-switch { background: #EAEEF3; color: #15233B; border: 1px solid #15233B; }

  .keep-cell { color: #2F6F4F; font-weight: 700; }
  .fold-cell { color: #9B2C3A; }

  .tax-headline {
    margin: 2px 0 4px 0;
    padding: 4px 8px;
    background: #F4F6F8;
    border-left: 3px solid #15233B;
    font-size: 7pt;
    font-weight: 600;
    color: #15233B;
  }
  .gain-type {
    display: inline-block;
    font-size: 5.8pt;
    font-weight: 700;
    border-radius: 2px;
    padding: 0 3px;
  }
  .gt-ltcg { background: #E8F1EC; color: #1F4E37; border: 1px solid #2F6F4F; }
  .gt-stcg { background: #F6EEDF; color: #B07A2E; border: 1px solid #B07A2E; }
  .gt-debt { background: #E5E5E5; color: #44403C; border: 1px solid #57534E; }
  .gt-locked { background: #F6E6E9; color: #9B2C3A; border: 1px solid #9B2C3A; }

  /* Portfolio Health Score — top-line gauge panel */
  .health-panel {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 10px;
    align-items: center;
    background: #F4F6F8;
    border: 1px solid #15233B;
    border-radius: 4px;
    padding: 8px 14px;
    margin-bottom: 6px;
  }
  .health-panel .gauge-col { text-align: center; }
  .health-panel .gauge-title { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.4px; color: #15233B; margin-top: 2px; }
  .health-components { font-size: 7pt; }
  .health-components .comp-row { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
  .health-components .comp-label { width: 130px; color: #15233B; font-weight: 600; }
  .health-components .comp-bar-track { flex: 1; background: #E5E7EB; border-radius: 3px; height: 8px; overflow: hidden; }
  .health-components .comp-bar-fill { height: 100%; border-radius: 3px; background: #15233B; }
  .health-components .comp-val { width: 30px; text-align: right; font-weight: 700; color: #15233B; }
  .health-rationale { font-size: 6.8pt; color: #64748B; margin-top: 4px; }
  .health-rationale li { margin: 1px 0; }
`;

function pctClass(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'pct-neu';
  if (p > 0) return 'pct-pos';
  if (p < 0) return 'pct-neg';
  return 'pct-neu';
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTierTable(
  rows: ReportHolding[],
  tier: 'star' | 'keep' | 'watch' | 'swap' | 'liquidate'
): string {
  if (rows.length === 0) return '';

  const headers = {
    star: ['#', 'Fund', 'Held By', 'Invested', 'Current', 'XIRR', '3Y CAGR', '5Y CAGR', 'Verdict', 'Why'],
    keep: ['#', 'Fund', 'Held By', 'Invested', 'Current', 'XIRR', '3Y CAGR', '5Y CAGR', 'Verdict', 'Why'],
    watch: ['#', 'Fund', 'Held By', 'Invested', 'Current', 'XIRR', '3Y CAGR', 'Hold (mo)', 'Verdict', 'Why'],
    swap: ['#', 'Fund (Exit)', 'Held By', 'Invested', 'Current', '3Y CAGR', '5Y CAGR', 'Verdict', 'Replace With', 'Reason'],
    liquidate: ['#', 'Fund', 'Held By', 'Invested', 'Current', 'XIRR', '3Y CAGR', '5Y CAGR', 'Verdict', 'Action'],
  }[tier];

  const verdictClass = tier === 'liquidate' ? 'v-liq' : `v-${tier}`;
  const verdictLabel = {
    star: '★ STAR',
    keep: 'KEEP',
    watch: 'WATCH',
    swap: 'SWAP',
    liquidate: 'LIQUIDATE',
  }[tier];

  const headHtml = headers.map((h) => `<th>${h}</th>`).join('');

  const rowsHtml = rows
    .map((r, idx) => {
      const numCol = `<td class="ctr">${idx + 1}</td>`;
      // ★ marker when this held fund is itself on the Trustner Buy-List (committee shortlist).
      const buyListMark = r.onBuyList ? ' <span class="buylist-mark" title="On Trustner Buy-List">★ Buy-List</span>' : '';
      const fundCol = `<td><div class="fund-name">${escapeHtml(r.fundName)}${buyListMark}</div>${r.category ? `<div style="font-size:6pt;color:#64748B;">${escapeHtml(r.category)}</div>` : ''}</td>`;
      const holdersCol = `<td>${escapeHtml(r.entityName)}</td>`;
      const investedCol = `<td class="amt">${formatInrFull(r.investedInr)}</td>`;
      const currentCol = `<td class="amt">${formatInrFull(r.currentValueInr)}</td>`;
      const verdictCol = `<td class="ctr"><span class="verdict ${verdictClass}">${verdictLabel}</span></td>`;

      if (tier === 'star' || tier === 'keep' || tier === 'liquidate') {
        const xirrCol = `<td class="ctr ${pctClass(r.xirrPct)}">${formatPct(r.xirrPct)}</td>`;
        const cagr3yCol = `<td class="ctr ${pctClass(r.cagr3y)}">${formatPct(r.cagr3y)}</td>`;
        const cagr5yCol = `<td class="ctr ${pctClass(r.cagr5y)}">${formatPct(r.cagr5y)}</td>`;
        const lastCol = `<td>${escapeHtml(r.rationale ?? '—')}</td>`;
        return `<tr>${numCol}${fundCol}${holdersCol}${investedCol}${currentCol}${xirrCol}${cagr3yCol}${cagr5yCol}${verdictCol}${lastCol}</tr>`;
      }

      if (tier === 'watch') {
        const xirrCol = `<td class="ctr ${pctClass(r.xirrPct)}">${formatPct(r.xirrPct)}</td>`;
        const cagr3yCol = `<td class="ctr ${pctClass(r.cagr3y)}">${formatPct(r.cagr3y)}</td>`;
        const monthsCol = `<td class="ctr">${r.holdingPeriodMonths ?? '—'}</td>`;
        const lastCol = `<td>${escapeHtml(r.rationale ?? '—')}</td>`;
        return `<tr>${numCol}${fundCol}${holdersCol}${investedCol}${currentCol}${xirrCol}${cagr3yCol}${monthsCol}${verdictCol}${lastCol}</tr>`;
      }

      // swap
      const cagr3yCol = `<td class="ctr ${pctClass(r.cagr3y)}">${formatPct(r.cagr3y)}</td>`;
      const cagr5yCol = `<td class="ctr ${pctClass(r.cagr5y)}">${formatPct(r.cagr5y)}</td>`;
      // v2 precise action — distinguish a clean EXIT (unsuitable) from a SWITCH (better fund
      // exists). The legacy verdict collapses both to "SWAP"; show the v2 nuance beneath it.
      const isExit = (r.v2Action ?? '').toUpperCase().includes('EXIT');
      const v2Tag = r.v2ActionLabel
        ? `<div class="v2-tag ${isExit ? 'v2-exit' : 'v2-switch'}">${escapeHtml(r.v2ActionLabel)}</div>`
        : '';
      const verdictColV2 = `<td class="ctr"><span class="verdict ${verdictClass}">${verdictLabel}</span>${v2Tag}</td>`;
      // Replacement provenance — flag when the replacement is sourced from the Trustner Buy-List.
      const replName = r.preferredReplacementFundName ?? '—';
      const replIsBuyList = !!r.buyListReplacementFundName && r.buyListReplacementFundName === r.preferredReplacementFundName;
      const replProvenance = replIsBuyList ? '<div class="buylist-mark" style="margin-top:1px;">★ Trustner Buy-List</div>' : '';
      const replaceCol = `<td>${escapeHtml(replName)}${replProvenance}</td>`;
      const reasonCol = `<td>${escapeHtml(r.rationale ?? '—')}</td>`;
      return `<tr>${numCol}${fundCol}${holdersCol}${investedCol}${currentCol}${cagr3yCol}${cagr5yCol}${verdictColV2}${replaceCol}${reasonCol}</tr>`;
    })
    .join('');

  const tierTitle = {
    star: 'TIER A — STAR HOLDINGS',
    keep: 'TIER B — SOLID KEEPS',
    watch: 'TIER B — WATCH',
    swap: 'TIER C — SWAP',
    liquidate: 'TIER D — LIQUIDATE',
  }[tier];

  const tierSub = {
    star: 'top quartile, no change needed',
    keep: 'good funds; some need J-curve time',
    watch: 'too new to judge — re-assess in 6-12 mo',
    swap: 'mid-pack; objectively better alternatives exist',
    liquidate: 'immaterial legacy; cleanup',
  }[tier];

  const totalInvested = rows.reduce((s, r) => s + r.investedInr, 0);

  const h2Class = tier === 'liquidate' ? 'h2-liq' : `h2-${tier}`;
  return `
    <h2 class="${h2Class}">
      <span>${tierTitle} <span style="font-weight: 400; opacity: 0.85;">(${tierSub})</span></span>
      <span class="count">${rows.length} holdings • ${formatInrShort(totalInvested)} invested</span>
    </h2>
    <table>
      <thead><tr>${headHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * Pillar-6 Consolidation — KEEP vs FOLD-IN per same-sub-category duplicate group.
 * Renders nothing when there are no consolidation groups.
 */
function renderConsolidationSection(data: ReportData): string {
  const groups = data.consolidationGroups ?? [];
  if (groups.length === 0) return '';

  const rowsHtml = groups
    .map((g, idx) => {
      const foldNames = g.consolidate
        .map((c) => `${escapeHtml(c.fundName)} (${formatInrShort(c.currentValueInr)})`)
        .join('; ');
      return `
        <tr>
          <td class="ctr">${idx + 1}</td>
          <td>${escapeHtml(g.subCategory)} <span style="color:#64748B;">(${g.count} funds)</span></td>
          <td class="keep-cell">${escapeHtml(g.keep.fundName)}</td>
          <td class="fold-cell">${foldNames || '—'}</td>
          <td class="amt">${formatInrFull(g.totalConsolidatableInr)}</td>
          <td>${escapeHtml(g.rationale)}</td>
        </tr>`;
    })
    .join('');

  return `
    <h2 style="border-left-color: #15233B;">
      <span>PILLAR 6 — CONSOLIDATION <span style="font-weight:400; opacity:0.85;">(same-category duplicates; keep the stronger fund)</span></span>
      <span class="count">${groups.length} group${groups.length === 1 ? '' : 's'} • ${formatInrShort(data.consolidationValueInr)} to redeploy</span>
    </h2>
    <table>
      <thead>
        <tr>
          <th style="width:14px;">#</th>
          <th>Sub-Category</th>
          <th>Keep (stronger)</th>
          <th>Fold In (redeploy)</th>
          <th style="text-align:right;">Consolidatable ₹</th>
          <th>Rationale</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * v2 Tax-Aware Exit estimate — per-fund gain / gain-type / lock status / estimated tax.
 * India rules already applied upstream (LTCG 12.5% over ₹1.25L / STCG 20% / debt-slab /
 * ELSS lock-in). Renders nothing when there are no taxable exits.
 */
function renderTaxSection(data: ReportData): string {
  const tax = data.taxSummary;
  if (!tax || tax.exitCount <= 0) return '';

  const gainTypeBadge = (gt: string, locked: boolean): string => {
    if (locked) return '<span class="gain-type gt-locked">LOCKED</span>';
    const t = (gt || '').toUpperCase();
    if (t.includes('LTCG')) return '<span class="gain-type gt-ltcg">LTCG</span>';
    if (t.includes('STCG')) return '<span class="gain-type gt-stcg">STCG</span>';
    if (t.includes('DEBT')) return '<span class="gain-type gt-debt">DEBT</span>';
    return `<span class="gain-type gt-debt">${escapeHtml(gt || '—')}</span>`;
  };

  const rowsHtml = tax.lines
    .map((ln, idx) => `
      <tr>
        <td class="ctr">${idx + 1}</td>
        <td>${escapeHtml(ln.fundName)}</td>
        <td class="amt ${ln.gainInr >= 0 ? 'pct-pos' : 'pct-neg'}">${formatInrFull(ln.gainInr)}</td>
        <td class="ctr">${gainTypeBadge(ln.gainType, ln.locked)}</td>
        <td class="amt">${ln.locked ? '—' : (ln.estTaxInr === null ? 'NM' : formatInrFull(ln.estTaxInr))}</td>
        <td>${escapeHtml(ln.note ?? '—')}</td>
      </tr>`)
    .join('');

  return `
    <h2 style="border-left-color: #9A7B4F;">
      <span>TAX-AWARE EXIT ESTIMATE <span style="font-weight:400; opacity:0.85;">(India rules applied — confirm with your CA)</span></span>
      <span class="count">${tax.exitCount} exit${tax.exitCount === 1 ? '' : 's'} • est. tax ${formatInrShort(tax.estTotalTaxInr)}</span>
    </h2>
    ${tax.headline ? `<div class="tax-headline">${escapeHtml(tax.headline)}</div>` : ''}
    <table>
      <thead>
        <tr>
          <th style="width:14px;">#</th>
          <th>Fund (Exit)</th>
          <th style="text-align:right;">Gain ₹</th>
          <th class="ctr">Type</th>
          <th style="text-align:right;">Est. Tax ₹</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer-note" style="border-left-color:#9A7B4F;">
      <strong>NOTE:</strong> Tax figures are indicative estimates using current India capital-gains
      rules (LTCG 12.5% above the ₹1.25 L per-FY equity exemption / STCG 20% / debt taxed at slab /
      ELSS three-year lock-in). They are not a tax computation — please confirm the final liability
      with your Chartered Accountant before any redemption.
    </div>
  `;
}

/** Portfolio Health Score panel — REEDOS-parity top-line gauge + component breakdown. */
function renderHealthPanel(data: ReportData): string {
  const h = data.portfolioHealthScore;
  const compRow = (label: string, val: number) => `
    <div class="comp-row">
      <div class="comp-label">${label}</div>
      <div class="comp-bar-track"><div class="comp-bar-fill" style="width:${Math.max(0, Math.min(100, val))}%;"></div></div>
      <div class="comp-val">${val}</div>
    </div>`;
  return `
    <div class="health-panel">
      <div class="gauge-col">
        ${renderHealthGaugeSvg(h, { size: 180 })}
        <div class="gauge-title">PORTFOLIO HEALTH SCORE</div>
      </div>
      <div>
        <div class="health-components">
          ${compRow('Verdict Quality (55%)', h.components.verdictQuality)}
          ${compRow('Risk Alignment (20%)', h.components.riskAlignment)}
          ${compRow('Consolidation (15%)', h.components.consolidationEfficiency)}
          ${compRow('Behaviour Discipline (10%)', h.components.behaviourDiscipline)}
        </div>
        <ul class="health-rationale">
          ${h.rationale.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

export function renderFullPortfolioReviewHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const fyId = `${data.documentId.replace(/-/g, '').slice(-8)}`.toUpperCase();

  const summaryRows = [
    { tier: 'A — STAR', tierClass: 'v-star', label: '★ STAR', t: data.tierTotals.star, bottomLine: 'Best-in-class — continue all SIPs' },
    { tier: 'B — KEEP', tierClass: 'v-keep', label: 'KEEP', t: data.tierTotals.keep, bottomLine: 'Solid; needs 24-36 mo for J-curve' },
    { tier: 'B — WATCH', tierClass: 'v-watch', label: 'WATCH', t: data.tierTotals.watch, bottomLine: 'Too new; re-assess in 6-12 mo' },
    { tier: 'C — SWAP', tierClass: 'v-swap', label: 'SWAP', t: data.tierTotals.swap, bottomLine: 'Better alternatives exist — execute this week' },
    { tier: 'D — LIQUIDATE', tierClass: 'v-liq', label: 'LIQUIDATE', t: data.tierTotals.liquidate, bottomLine: 'Legacy cleanup; redeploy' },
  ];

  const totalInvested = data.totalInvestedInr;
  const totalCurrent = data.currentValueInr;

  const summaryHtml = `
    <table class="summary-table">
      <thead>
        <tr>
          <th style="text-align:left;">Tier</th>
          <th>Holdings</th>
          <th>₹ Invested</th>
          <th>₹ Current</th>
          <th>% of Portfolio</th>
          <th>Verdict</th>
          <th style="text-align:left;">Bottom Line</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows
          .filter((r) => r.t.count > 0)
          .map(
            (r) => `
            <tr>
              <td class="tier-label">${r.tier}</td>
              <td>${r.t.count}</td>
              <td class="amt">${formatInrFull(r.t.investedInr)}</td>
              <td class="amt">${formatInrFull(r.t.currentInr)}</td>
              <td>${r.t.pctOfPortfolio.toFixed(0)}%</td>
              <td class="ctr"><span class="verdict ${r.tierClass}">${r.label}</span></td>
              <td>${r.bottomLine}</td>
            </tr>
          `
          )
          .join('')}
        <tr style="font-weight:700; background:#F4F6F8;">
          <td class="tier-label">TOTAL</td>
          <td>${data.numHoldings}</td>
          <td class="amt">${formatInrFull(totalInvested)}</td>
          <td class="amt">${formatInrFull(totalCurrent)}</td>
          <td>100%</td>
          <td colspan="2" style="text-align:left;">Tax-neutral re-alignment</td>
        </tr>
      </tbody>
    </table>
  `;

  // Observations — derive from tiers
  const workingPct = (
    (data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio).toFixed(0)
  );
  const needsFixingPct = data.tierTotals.swap.pctOfPortfolio.toFixed(0);
  const tooYoungPct = data.tierTotals.watch.pctOfPortfolio.toFixed(0);

  const swapList = data.swapHoldings
    .slice(0, 4)
    .map((h) => `${escapeHtml(h.fundName)} (${escapeHtml(h.entityName)} ${formatInrShort(h.currentValueInr)})`)
    .join('; ');

  const watchList = data.watchHoldings
    .slice(0, 3)
    .map((h) => `${escapeHtml(h.fundName)} (${escapeHtml(h.entityName)}, ${h.holdingPeriodMonths ?? '?'} mo old)`)
    .join('; ');

  const currentXirr = data.familyXirrPct ?? 0;
  const projectedXirrLow = (currentXirr + 2.5).toFixed(1);
  const projectedXirrHigh = (currentXirr + 4.5).toFixed(1);
  const monthlyGrowthFactor = Math.pow(1 + (currentXirr + 3) / 100, 3);
  const projectedAum = data.currentValueInr * monthlyGrowthFactor;

  const observationsHtml = `
    <div class="observations">
      <div class="obs-card good">
        <h3>What's Working (${workingPct}% of the portfolio)</h3>
        <ul>
          ${data.starHoldings.slice(0, 4).map((h) => `<li>${escapeHtml(h.fundName)} — ${escapeHtml(h.rationale ?? 'STAR holding')}</li>`).join('')}
        </ul>
      </div>
      <div class="obs-card bad">
        <h3>What Needs Fixing (${needsFixingPct}% of the portfolio)</h3>
        ${swapList ? `<ul><li>${swapList.replace(/; /g, '</li><li>')}</li></ul>` : '<p style="margin:0;color:#64748B;">No SWAP-tier holdings — portfolio is healthy.</p>'}
      </div>
      <div class="obs-card watch">
        <h3>Too Young to Call (${tooYoungPct}%)</h3>
        ${watchList ? `<ul><li>${watchList.replace(/; /g, '</li><li>')}</li></ul><p style="margin:4px 0 0 0;"><em>Re-assess at next quarterly review.</em></p>` : '<p style="margin:0;color:#64748B;">No WATCH-tier holdings.</p>'}
      </div>
      <div class="obs-card proj">
        <h3>Wealth Projection (36 months)</h3>
        <ul style="list-style:none; padding-left:0; margin:0;">
          <li>Current family XIRR: <strong>${formatPct(data.familyXirrPct, 2)}</strong></li>
          <li>Expected XIRR after re-alignment: <strong>${projectedXirrLow}-${projectedXirrHigh}%</strong></li>
          <li>Projected AUM at 36 mo (existing SIPs only): <strong>${formatInrShort(projectedAum)}</strong></li>
        </ul>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.familyName)} — Full Portfolio Review</title>
<style>${STYLES}</style>
</head>
<body>${riskNotCapturedBanner(data)}
<div class="container">
  ${
    showPrintBar
      ? `<div class="no-print no-print-bar">
          <span>📄 Full Portfolio Review — ${escapeHtml(data.familyName)} | ${escapeHtml(data.reportDate)}</span>
          <span style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:7.5pt; opacity:0.85; font-weight:400;">Tip: in the print dialog, untick <strong>“Headers and footers”</strong> for a clean PDF (no web address).</span>
            <button onclick="window.print()">🖨️ Print / Save as PDF</button>
          </span>
        </div>`
      : ''
  }

  <div class="header">
    <div class="header-left">
      <div class="firm-name">TRUSTNER ASSET SERVICES PVT. LTD.</div>
      <div class="firm-sub">AMFI Registered MFD | ARN-286886 | www.trustner.in</div>
    </div>
    <div class="header-right">
      <div class="label">FULL PORTFOLIO REVIEW</div>
      <div>${escapeHtml(data.reportDate)} | Doc: ${escapeHtml(data.documentId)}</div>
      <div>For: ${escapeHtml(data.familyName)}</div>
    </div>
  </div>

  <div class="doc-title">
    Portfolio Diagnostic Review — All ${data.numHoldings} Holdings
    <span class="sub">Category-Benchmarked Verdicts &amp; Re-alignment Plan • Tax-Neutral</span>
  </div>

  <div class="snapshot">
    <div class="tile"><div class="lbl">TOTAL INVESTED</div><div class="val">${formatInrShort(data.totalInvestedInr)}</div></div>
    <div class="tile"><div class="lbl">CURRENT VALUE</div><div class="val">${formatInrShort(data.currentValueInr)}</div></div>
    <div class="tile"><div class="lbl">GAIN</div><div class="val">${data.totalGainInr >= 0 ? '+' : ''}${formatInrShort(data.totalGainInr)}</div></div>
    <div class="tile"><div class="lbl">FAMILY XIRR</div><div class="val">${formatPct(data.familyXirrPct, 2)}</div></div>
    <div class="tile"><div class="lbl">HOLDINGS</div><div class="val">${data.numHoldings}</div></div>
    <div class="tile"><div class="lbl">UNIQUE FUNDS</div><div class="val">${data.numUniqueFunds}</div></div>
    <div class="tile"><div class="lbl">PANs / ENTITIES</div><div class="val">${data.numEntities}</div></div>
    <div class="tile"><div class="lbl">AMCs</div><div class="val">${data.numAmcs}</div></div>
  </div>

  ${renderHealthPanel(data)}

  <div class="legend">
    <span><span class="verdict v-star">★ STAR</span> = best-in-class</span>
    <span><span class="verdict v-keep">KEEP</span> = top quartile / solid; no change</span>
    <span><span class="verdict v-watch">WATCH</span> = too new to judge; re-assess</span>
    <span><span class="verdict v-swap">SWAP</span> = mid-pack; better alternative exists</span>
    <span><span class="verdict v-liq">LIQUIDATE</span> = immaterial legacy</span>
  </div>

  ${renderTierTable(data.starHoldings, 'star')}
  ${renderTierTable(data.keepHoldings, 'keep')}
  ${renderTierTable(data.watchHoldings, 'watch')}
  ${renderTierTable(data.swapHoldings, 'swap')}
  ${renderTierTable(data.liquidateHoldings, 'liquidate')}

  ${renderConsolidationSection(data)}
  ${renderTaxSection(data)}

  <h2 style="border-left-color: #15233B;">
    <span>PORTFOLIO HEALTH SUMMARY</span>
    <span class="count">Bottom-line by tier</span>
  </h2>
  ${summaryHtml}

  ${observationsHtml}

  ${
    data.swapCount > 0 || data.liquidateCount > 0
      ? `<div class="footer-note">
          <strong>EXECUTION:</strong> The ${data.swapCount} SWAP rows + ${data.liquidateCount} LIQUIDATE rows
          (total ${formatInrShort(data.totalReallocationInr)}) are itemised in the separate
          <strong>Action Sheet</strong> with sign-off blocks and tax estimates. The
          ${data.tierTotals.star.count + data.tierTotals.keep.count} STAR/KEEP holdings require no action — continue all existing SIPs as scheduled.
          Next portfolio review: ~90 days from today.
        </div>`
      : ''
  }

  <div class="compliance">
    Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
    AMFI registered Mutual Fund distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886.
    Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505). Past performance is
    not indicative of future results. 3Y &amp; 5Y CAGR figures are sourced from AMFI / AMC fact-sheets. XIRR
    figures are computed at the family/holding level as of ${escapeHtml(data.reportDate)}. Tax estimates
    are indicative only — please confirm the final liability with your Chartered Accountant. Verdicts
    (STAR / KEEP / WATCH / SWAP / LIQUIDATE) and consolidation groupings represent our analytical and
    distribution view based on the funds&apos; track record, manager
    quality, category positioning, and category benchmark data — this report does NOT constitute investment
    advice as defined under SEBI (Investment Advisers) Regulations, 2013. Final investment decisions rest
    with each PAN holder. Recommendations may be revised at subsequent reviews.
  </div>
</div>
</body>
</html>`;
}
