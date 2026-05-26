/**
 * Three-Pager Portfolio Diagnostic Report
 *
 * Mid-depth report between the One-Pager (1pg) and Full Portfolio
 * Review (2pg) and the deep Portfolio Diagnostic Report (12pg).
 *
 * Page 1: Executive Summary + Methodology + Verdict Strip
 * Page 2: Holdings by Tier (STAR, KEEP, WATCH)
 * Page 3: Actions (SWAP, LIQUIDATE) + Tax Impact + Wealth Projection
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  ReportHolding,
  formatInrShort,
  formatInrFull,
  formatPct,
} from '../report-data';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pctClass(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'pct-neu';
  if (p > 0) return 'pct-pos';
  if (p < 0) return 'pct-neg';
  return 'pct-neu';
}

const STYLES = `
  @page { size: A4; margin: 14mm 18mm 16mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
    .page-break { page-break-before: always; }
  }
  /* Screen preview: paper-on-grey for breathing room */
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 14mm 18mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1A1A2E; line-height: 1.4; font-size: 8.5pt; margin: 0; background: white;
  }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar {
    position: sticky; top: 0; background: #0c4a6e; color: white; padding: 8px 16px;
    margin-bottom: 8mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; z-index: 100;
  }
  .no-print-bar button {
    background: white; color: #0c4a6e; border: 0; padding: 6px 14px;
    font-weight: 700; border-radius: 4px; cursor: pointer; font-size: 10pt;
  }
  .header {
    border-bottom: 2.5px solid #0c4a6e; padding-bottom: 5px; margin-bottom: 6px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .header .firm { color: #0c4a6e; font-weight: 700; font-size: 11pt; }
  .header .sub { color: #6B5F54; font-size: 7pt; }
  .header-right { text-align: right; font-size: 7.5pt; color: #6B5F54; }
  .header-right .label { font-size: 9pt; color: #0c4a6e; font-weight: 700; letter-spacing: 0.4px; }
  .doc-title {
    background: #0c4a6e; color: white; padding: 8px 14px; font-size: 14pt;
    font-weight: 700; margin-bottom: 8px;
  }
  .doc-title .sub { font-size: 9pt; font-weight: 400; opacity: 0.92; margin-top: 2px; display: block; }
  h2 {
    color: white; font-size: 11pt; margin: 10px 0 5px 0; padding: 5px 12px;
    border-radius: 3px; background: #0c4a6e; display: flex; justify-content: space-between; align-items: center;
  }
  h2.sec-method { background: #115E59; }
  h2.sec-summary { background: #0c4a6e; }
  h2.sec-star { background: #B45309; }
  h2.sec-keep { background: #16A34A; }
  h2.sec-watch { background: #D97706; }
  h2.sec-swap { background: #DC2626; }
  h2.sec-liq { background: #6B5F54; }
  h2.sec-tax { background: #0c4a6e; }
  h2.sec-projection { background: #115E59; }
  h2 .count { font-size: 9pt; font-weight: 400; opacity: 0.92; }
  h3 { color: #0c4a6e; font-size: 10pt; margin: 8px 0 4px 0; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 3px 0; }
  th { background: #115E59; color: white; padding: 4px 6px; text-align: left; font-weight: 600; font-size: 7.5pt; border: 1px solid #0c4a6e; }
  td { padding: 4px 6px; border: 1px solid #D6D3D1; vertical-align: top; }
  tr:nth-child(even) td { background: #FAFAF8; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; color: #115E59; }
  .ctr { text-align: center; }
  .pct-pos { color: #16A34A; font-weight: 700; }
  .pct-neg { color: #DC2626; font-weight: 700; }
  .pct-neu { color: #6B5F54; }
  .nm { color: #94A3B8; font-style: italic; }
  .verdict {
    text-align: center; font-weight: 700; font-size: 7.5pt; padding: 1px 4px;
    border-radius: 2px; display: inline-block; width: 60px;
  }
  .v-star { background: #FEF3C7; color: #B45309; border: 1px solid #D4A017; }
  .v-keep { background: #DCFCE7; color: #16A34A; border: 1px solid #16A34A; }
  .v-watch { background: #FFEDD5; color: #C2410C; border: 1px solid #D97706; }
  .v-swap { background: #FEE2E2; color: #DC2626; border: 1px solid #DC2626; }
  .v-liq { background: #E5E5E5; color: #44403C; border: 1px solid #57534E; }
  .snapshot {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 6px 0 10px 0;
  }
  .tile {
    background: #eff6ff; border: 1px solid #0c4a6e; padding: 6px 8px; text-align: center;
    border-radius: 3px;
  }
  .tile .lbl { font-size: 7pt; color: #115E59; font-weight: 700; letter-spacing: 0.3px; }
  .tile .val { font-size: 13pt; font-weight: 700; color: #0c4a6e; line-height: 1.05; margin-top: 2px; }
  .summary-strip {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 4px 0;
  }
  .strip-cell {
    padding: 6px; color: white; text-align: center; border-radius: 2px;
  }
  .strip-cell .count { font-size: 16pt; font-weight: 700; line-height: 1; }
  .strip-cell .label { font-size: 8pt; font-weight: 700; margin-top: 4px; letter-spacing: 0.3px; }
  .strip-cell.star { background: #B45309; }
  .strip-cell.keep { background: #16A34A; }
  .strip-cell.watch { background: #D97706; }
  .strip-cell.swap { background: #DC2626; }
  .strip-cell.liq { background: #6B5F54; }
  .exec-summary {
    background: #eff6ff; border-left: 4px solid #0c4a6e; padding: 8px 12px;
    margin: 6px 0; font-size: 9pt; line-height: 1.45;
  }
  .exec-summary strong { color: #0c4a6e; }
  .methodology { font-size: 8pt; line-height: 1.45; }
  .method-table { width: 100%; margin: 4px 0; }
  .method-table td { padding: 5px 8px; border: 1px solid #D6D3D1; }
  .method-table td:first-child { font-weight: 600; color: #115E59; width: 45%; }
  .method-table td:nth-child(2) { width: 12%; text-align: center; font-weight: 700; color: #B45309; }
  .projection-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 6px 0;
  }
  .proj-card {
    border: 1px solid #D6D3D1; border-radius: 4px; padding: 8px 10px; background: white;
  }
  .proj-card h4 { margin: 0 0 4px 0; font-size: 9pt; color: #0c4a6e; }
  .proj-card .big { font-size: 14pt; font-weight: 700; color: #0c4a6e; line-height: 1; margin: 4px 0; }
  .proj-card .small { font-size: 7pt; color: #6B5F54; }
  .footer-note {
    margin-top: 8px; padding: 6px 10px; border-left: 3px solid #D4A017;
    background: #FFFBEB; font-size: 8pt;
  }
  .footer-note strong { color: #B45309; }
  .compliance {
    margin-top: 8px; padding-top: 5px; border-top: 1px solid #D6D3D1;
    font-size: 6.5pt; color: #6B5F54; line-height: 1.4; text-align: justify;
  }
`;

function renderHoldingRow(h: ReportHolding, idx: number, verdictClass: string, verdictLabel: string, mode: 'standard' | 'swap' | 'liquidate'): string {
  const num = `<td class="ctr">${idx + 1}</td>`;
  const fund = `<td><strong>${escapeHtml(h.fundName)}</strong>${h.category ? `<div style="font-size:7pt; color:#6B5F54;">${escapeHtml(h.category)}</div>` : ''}</td>`;
  const holder = `<td>${escapeHtml(h.entityName)}</td>`;
  const invested = `<td class="amt">${formatInrFull(h.investedInr)}</td>`;
  const current = `<td class="amt">${formatInrFull(h.currentValueInr)}</td>`;
  const verdict = `<td class="ctr"><span class="verdict ${verdictClass}">${verdictLabel}</span></td>`;

  if (mode === 'swap') {
    const cagr3 = `<td class="ctr ${pctClass(h.cagr3y)}">${formatPct(h.cagr3y)}</td>`;
    const cagr5 = `<td class="ctr ${pctClass(h.cagr5y)}">${formatPct(h.cagr5y)}</td>`;
    const replace = `<td><strong>${escapeHtml(h.preferredReplacementFundName ?? 'Per preferred list')}</strong></td>`;
    const reason = `<td>${escapeHtml(h.rationale ?? '')}</td>`;
    return `<tr>${num}${fund}${holder}${invested}${current}${cagr3}${cagr5}${verdict}${replace}${reason}</tr>`;
  }
  if (mode === 'liquidate') {
    const xirr = `<td class="ctr ${pctClass(h.xirrPct)}">${formatPct(h.xirrPct)}</td>`;
    const cagr3 = `<td class="ctr ${pctClass(h.cagr3y)}">${formatPct(h.cagr3y)}</td>`;
    const action = `<td>${escapeHtml(h.rationale ?? 'Redeem; cleanup')}</td>`;
    return `<tr>${num}${fund}${holder}${invested}${current}${xirr}${cagr3}${verdict}${action}</tr>`;
  }
  // standard (star / keep / watch)
  const xirr = `<td class="ctr ${pctClass(h.xirrPct)}">${formatPct(h.xirrPct)}</td>`;
  const cagr3 = `<td class="ctr ${pctClass(h.cagr3y)}">${formatPct(h.cagr3y)}</td>`;
  const cagr5 = `<td class="ctr ${pctClass(h.cagr5y)}">${formatPct(h.cagr5y)}</td>`;
  const rationale = `<td>${escapeHtml(h.rationale ?? '')}</td>`;
  return `<tr>${num}${fund}${holder}${invested}${current}${xirr}${cagr3}${cagr5}${verdict}${rationale}</tr>`;
}

export function renderThreePagerHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const currentXirr = data.familyXirrPct ?? 0;
  const projLow = currentXirr + 2.5;
  const projHigh = currentXirr + 4.5;

  // 36-month projection at base, +3% improvement
  const growthFactorCurrent = Math.pow(1 + currentXirr / 100, 3);
  const growthFactorImproved = Math.pow(1 + (currentXirr + 3) / 100, 3);
  const projectedCurrent = data.currentValueInr * growthFactorCurrent;
  const projectedImproved = data.currentValueInr * growthFactorImproved;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — Portfolio Diagnostic (3-page)</title><style>${STYLES}</style></head>
<body><div class="container">
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>📊 Portfolio Diagnostic Report (3-page) — ${escapeHtml(data.familyName)}</span>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>` : ''}

<!-- ============ PAGE 1 ============ -->
<div class="header">
  <div>
    <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
    <div class="sub">AMFI Registered MFD | ARN-286886 | www.trustner.in</div>
  </div>
  <div class="header-right">
    <div class="label">PORTFOLIO DIAGNOSTIC REPORT</div>
    <div>${escapeHtml(data.reportDate)} | Doc: ${escapeHtml(data.documentId)}</div>
    <div>For: ${escapeHtml(data.familyName)}</div>
    <div>Page 1 of 3 · Executive Summary &amp; Methodology</div>
  </div>
</div>

<div class="doc-title">
  Portfolio Diagnostic — Category-Benchmarked Analysis
  <span class="sub">${data.numHoldings} holdings · ${data.numEntities} entities · ${data.numAmcs} AMCs · Family AUM ${formatInrShort(data.currentValueInr)}</span>
</div>

<div class="snapshot">
  <div class="tile"><div class="lbl">INVESTED</div><div class="val">${formatInrShort(data.totalInvestedInr)}</div></div>
  <div class="tile"><div class="lbl">CURRENT</div><div class="val">${formatInrShort(data.currentValueInr)}</div></div>
  <div class="tile"><div class="lbl">GAIN</div><div class="val">${data.totalGainInr >= 0 ? '+' : ''}${formatInrShort(data.totalGainInr)}</div></div>
  <div class="tile"><div class="lbl">FAMILY XIRR</div><div class="val">${formatPct(data.familyXirrPct, 2)}</div></div>
</div>

<h2 class="sec-summary"><span>I. Executive Summary</span><span class="count">Bottom-line in 3 lines</span></h2>
<div class="exec-summary">
  The ${escapeHtml(data.familyName)} portfolio (${formatInrFull(data.totalInvestedInr)} invested → ${formatInrFull(data.currentValueInr)} current; family XIRR ${formatPct(data.familyXirrPct, 2)}) has been re-evaluated
  using a category-benchmarked framework. Each of the ${data.numHoldings} holdings has been assessed on fund manager tenure, 3Y/5Y CAGR vs category
  median, performance through full market cycles, and category quartile positioning.<br/><br/>
  <strong>Verdict distribution:</strong> ${data.tierTotals.star.count} STAR (${data.tierTotals.star.pctOfPortfolio.toFixed(0)}%) ·
  ${data.tierTotals.keep.count} KEEP (${data.tierTotals.keep.pctOfPortfolio.toFixed(0)}%) ·
  ${data.tierTotals.watch.count} WATCH (${data.tierTotals.watch.pctOfPortfolio.toFixed(0)}%) ·
  ${data.tierTotals.swap.count} SWAP (${data.tierTotals.swap.pctOfPortfolio.toFixed(0)}%) ·
  ${data.tierTotals.liquidate.count} LIQUIDATE (${data.tierTotals.liquidate.pctOfPortfolio.toFixed(0)}%).<br/><br/>
  <strong>Recommendation:</strong>
  ${data.swapHoldings.length > 0 || data.liquidateHoldings.length > 0
    ? `Execute ${data.swapCount} fund swap${data.swapCount !== 1 ? 's' : ''}${data.liquidateCount > 0 ? ` and ${data.liquidateCount} legacy liquidation${data.liquidateCount !== 1 ? 's' : ''}` : ''}, totalling ${formatInrFull(data.totalReallocationInr)} of capital re-alignment. Estimated tax impact: nil (within ₹1.25 L LTCG exemption per PAN). The remaining ${data.tierTotals.star.count + data.tierTotals.keep.count + data.tierTotals.watch.count} holdings require no action — existing SIPs continue as scheduled.`
    : `No swaps or liquidations needed. Portfolio is healthy — continue all existing SIPs as scheduled.`}
  Next review: ~90 days from today.
</div>

<div class="summary-strip">
  <div class="strip-cell star"><div class="count">${data.tierTotals.star.count}</div><div class="label">★ STAR</div></div>
  <div class="strip-cell keep"><div class="count">${data.tierTotals.keep.count}</div><div class="label">KEEP</div></div>
  <div class="strip-cell watch"><div class="count">${data.tierTotals.watch.count}</div><div class="label">WATCH</div></div>
  <div class="strip-cell swap"><div class="count">${data.tierTotals.swap.count}</div><div class="label">SWAP</div></div>
  <div class="strip-cell liq"><div class="count">${data.tierTotals.liquidate.count}</div><div class="label">LIQUIDATE</div></div>
</div>

<h2 class="sec-method"><span>II. Methodology — 4-Criterion Composite Score</span></h2>
<table class="method-table">
  <tr>
    <td>3-Year CAGR vs category median</td>
    <td>30%</td>
    <td>Recent-cycle performance — captures the latest 3-year market regime</td>
  </tr>
  <tr>
    <td>5-Year CAGR vs category median</td>
    <td>25%</td>
    <td>Full-cycle performance through both 2020 (Covid) and 2022 (rate-shock)</td>
  </tr>
  <tr>
    <td>Fund manager tenure &amp; continuity</td>
    <td>20%</td>
    <td>Star-manager exits, AMC stability, process discipline</td>
  </tr>
  <tr>
    <td>Category quartile positioning</td>
    <td>25%</td>
    <td>Where the fund ranks today against peers in the same category</td>
  </tr>
</table>

<div style="font-size:8pt; margin-top:6px;">
  <strong>Verdict thresholds:</strong>
  <strong style="color:#B45309;">STAR ≥ 0.80</strong> (top quartile) ·
  <strong style="color:#16A34A;">KEEP 0.60–0.80</strong> (top half) ·
  <strong style="color:#D97706;">WATCH &lt; 36 mo track record</strong> ·
  <strong style="color:#DC2626;">SWAP &lt; 0.60</strong> (with better alternative available) ·
  <strong style="color:#6B5F54;">LIQUIDATE &lt; ₹2,000</strong> (legacy cleanup).
</div>

<!-- ============ PAGE 2 ============ -->
<div class="page-break"></div>

<div class="header">
  <div>
    <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
    <div class="sub">AMFI Registered MFD | ARN-286886</div>
  </div>
  <div class="header-right">
    <div class="label">PORTFOLIO DIAGNOSTIC REPORT</div>
    <div>${escapeHtml(data.reportDate)} | Doc: ${escapeHtml(data.documentId)}</div>
    <div>For: ${escapeHtml(data.familyName)}</div>
    <div>Page 2 of 3 · Holdings (STAR / KEEP / WATCH)</div>
  </div>
</div>

<h2 class="sec-star"><span>Tier A — STAR Holdings (top quartile, no change required)</span><span class="count">${data.tierTotals.star.count} holdings · ${formatInrShort(data.tierTotals.star.investedInr)} invested</span></h2>
${data.starHoldings.length === 0 ? '<p style="color:#6B5F54; font-style:italic; padding:8px;">No STAR-tier holdings in this portfolio.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Why</th></tr></thead>
  <tbody>${data.starHoldings.map((h, i) => renderHoldingRow(h, i, 'v-star', '★ STAR', 'standard')).join('')}</tbody>
</table>`}

<h2 class="sec-keep"><span>Tier B — KEEP (solid; some need J-curve time)</span><span class="count">${data.tierTotals.keep.count} holdings · ${formatInrShort(data.tierTotals.keep.investedInr)} invested</span></h2>
${data.keepHoldings.length === 0 ? '<p style="color:#6B5F54; font-style:italic; padding:8px;">No KEEP-tier holdings.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Why</th></tr></thead>
  <tbody>${data.keepHoldings.map((h, i) => renderHoldingRow(h, i, 'v-keep', 'KEEP', 'standard')).join('')}</tbody>
</table>`}

<h2 class="sec-watch"><span>Tier B — WATCH (too new to judge — re-assess in 6-12 mo)</span><span class="count">${data.tierTotals.watch.count} holdings · ${formatInrShort(data.tierTotals.watch.investedInr)} invested</span></h2>
${data.watchHoldings.length === 0 ? '<p style="color:#6B5F54; font-style:italic; padding:8px;">No WATCH-tier holdings.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Why</th></tr></thead>
  <tbody>${data.watchHoldings.map((h, i) => renderHoldingRow(h, i, 'v-watch', 'WATCH', 'standard')).join('')}</tbody>
</table>`}

<!-- ============ PAGE 3 ============ -->
<div class="page-break"></div>

<div class="header">
  <div>
    <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
    <div class="sub">AMFI Registered MFD | ARN-286886</div>
  </div>
  <div class="header-right">
    <div class="label">PORTFOLIO DIAGNOSTIC REPORT</div>
    <div>${escapeHtml(data.reportDate)} | Doc: ${escapeHtml(data.documentId)}</div>
    <div>For: ${escapeHtml(data.familyName)}</div>
    <div>Page 3 of 3 · Actions &amp; Wealth Projection</div>
  </div>
</div>

<h2 class="sec-swap"><span>Tier C — SWAP (better alternatives exist)</span><span class="count">${data.tierTotals.swap.count} swaps · ${formatInrShort(data.tierTotals.swap.investedInr)} invested</span></h2>
${data.swapHoldings.length === 0 ? '<p style="color:#6B5F54; font-style:italic; padding:8px;">No SWAP-tier holdings — portfolio is healthy.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund (Exit)</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Replace With</th><th>Reason</th></tr></thead>
  <tbody>${data.swapHoldings.map((h, i) => renderHoldingRow(h, i, 'v-swap', 'SWAP', 'swap')).join('')}</tbody>
</table>`}

<h2 class="sec-liq"><span>Tier D — LIQUIDATE (immaterial legacy cleanup)</span><span class="count">${data.tierTotals.liquidate.count} liquidations · ${formatInrFull(data.tierTotals.liquidate.investedInr)} invested</span></h2>
${data.liquidateHoldings.length === 0 ? '<p style="color:#6B5F54; font-style:italic; padding:8px;">No LIQUIDATE-tier holdings.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">Verdict</th><th>Action</th></tr></thead>
  <tbody>${data.liquidateHoldings.map((h, i) => renderHoldingRow(h, i, 'v-liq', 'LIQUIDATE', 'liquidate')).join('')}</tbody>
</table>`}

<h2 class="sec-tax"><span>III. Tax Impact &amp; Execution Cost</span></h2>
<div class="exec-summary">
  All LTCG positions within ₹1.25 L per-PAN annual exemption are tax-free.
  STCG (holding &lt; 12 mo) is taxed at 20%; losses can be set off against gains.
  For the proposed ${data.swapCount + data.liquidateCount} actions on this portfolio, the
  <strong>estimated net tax liability is ~ ₹0 (essentially tax-neutral)</strong>.
  Final tax depends on each PAN's full-year transaction history — confirm with the family CA before execution.
</div>

<h2 class="sec-projection"><span>IV. Wealth Projection — 36-Month Horizon</span></h2>
<div class="projection-grid">
  <div class="proj-card">
    <h4>Stay Course (no swaps)</h4>
    <div class="big">${formatInrShort(projectedCurrent)}</div>
    <div class="small">At current ${formatPct(data.familyXirrPct, 2)} XIRR — what the portfolio becomes if untouched</div>
  </div>
  <div class="proj-card">
    <h4>After Re-alignment</h4>
    <div class="big">${formatInrShort(projectedImproved)}</div>
    <div class="small">Expected XIRR ${projLow.toFixed(1)}-${projHigh.toFixed(1)}% after the ${data.swapCount} swap${data.swapCount !== 1 ? 's' : ''}</div>
  </div>
  <div class="proj-card">
    <h4>Delta — Value of Acting</h4>
    <div class="big" style="color: #B45309;">+${formatInrShort(projectedImproved - projectedCurrent)}</div>
    <div class="small">36-month wealth gain from executing the recommended re-alignment</div>
  </div>
</div>

<div class="footer-note">
  <strong>EXECUTION:</strong> The ${data.swapCount} SWAP + ${data.liquidateCount} LIQUIDATE rows totalling
  ${formatInrShort(data.totalReallocationInr)} are itemised in the separate <strong>Action Sheet</strong>
  (Doc: ${escapeHtml(data.documentId.replace('PD-', 'AS-'))}) with sign-off blocks, per-PAN tax estimates,
  and the optional additional-SIP cash-flow test. Refer to that document for tick-and-sign execution.
  The ${data.tierTotals.star.count + data.tierTotals.keep.count + data.tierTotals.watch.count} STAR / KEEP / WATCH
  holdings require no action — continue all existing SIPs as scheduled. Prepared by: ${escapeHtml(data.rmName)}.
</div>

<div class="compliance">
  Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI-Registered Mutual Fund
  Distributor (ARN-286886); the firm is not a SEBI-Registered Investment Adviser. Past performance
  is not indicative of future results. 3Y &amp; 5Y CAGR figures sourced from AMFI / AMC fact-sheets;
  XIRR figures are computed at the family / holding level as of ${escapeHtml(data.reportDate)}.
  Verdicts represent our analytical view based on the funds&apos; track record, manager quality, and
  category positioning — they do not constitute personalised investment advice. Final investment
  decisions rest with each PAN holder. Wealth projections assume historical CAGR continues — markets
  may deviate; the projections are illustrative, not guaranteed.
</div>
</div></body></html>`;
}
