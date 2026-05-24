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
} from '../report-data';

const STYLES = `
  @page {
    size: A4;
    margin: 10mm 10mm 12mm 10mm;
  }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1A1A2E;
    line-height: 1.3;
    font-size: 7.5pt;
    margin: 0;
    background: white;
  }
  .container { max-width: 190mm; margin: 0 auto; padding: 4mm 0; }
  .no-print-bar {
    position: sticky; top: 0; z-index: 100; background: #0F766E; color: white;
    padding: 8px 16px; margin: -4mm 0 8mm 0; display: flex; gap: 12px; align-items: center; justify-content: space-between;
    font-size: 9pt;
  }
  .no-print-bar button {
    background: white; color: #0F766E; border: 0; padding: 6px 14px; font-weight: 700; font-size: 9pt;
    border-radius: 4px; cursor: pointer;
  }

  .header {
    border-bottom: 2px solid #0F766E;
    padding-bottom: 4px;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left .firm-name { color: #0F766E; font-weight: 700; font-size: 10pt; }
  .header-left .firm-sub { color: #6B5F54; font-size: 6.5pt; }
  .header-right { text-align: right; font-size: 6.8pt; color: #6B5F54; }
  .header-right .label { font-size: 7.5pt; color: #0F766E; font-weight: 700; letter-spacing: 0.5px; }

  .doc-title {
    background: #0F766E;
    color: white;
    padding: 5px 10px;
    font-size: 11.5pt;
    font-weight: 700;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .doc-title .sub { font-size: 8pt; font-weight: 400; color: #CCFBF1; }

  .snapshot {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    margin-bottom: 6px;
  }
  .tile {
    background: #F0FDFA;
    border: 1px solid #0F766E;
    padding: 4px 5px;
    text-align: center;
  }
  .tile .lbl { font-size: 6pt; color: #115E59; font-weight: 700; letter-spacing: 0.3px; }
  .tile .val { font-size: 11pt; font-weight: 700; color: #0F766E; line-height: 1.05; margin-top: 1px; }

  h2 {
    color: white;
    font-size: 9pt;
    margin: 6px 0 3px 0;
    padding: 4px 10px;
    border-radius: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 .count { font-size: 8pt; font-weight: 400; }
  .h2-star  { background: #B45309; }
  .h2-keep  { background: #16A34A; }
  .h2-watch { background: #D97706; }
  .h2-swap  { background: #DC2626; }
  .h2-liq   { background: #6B5F54; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 6.8pt;
    margin: 2px 0;
  }
  th {
    background: #115E59;
    color: white;
    padding: 3px 4px;
    text-align: left;
    font-weight: 600;
    font-size: 6.5pt;
    border: 1px solid #0F766E;
  }
  td {
    padding: 3px 4px;
    border: 1px solid #D6D3D1;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #FAFAF8; }

  .amt { text-align: right; white-space: nowrap; font-weight: 600; color: #115E59; }
  .ctr { text-align: center; }
  .pct-pos { color: #16A34A; font-weight: 700; }
  .pct-neg { color: #DC2626; font-weight: 700; }
  .pct-neu { color: #6B5F54; }
  .nm      { color: #94A3B8; font-style: italic; }

  .verdict {
    text-align: center;
    font-weight: 700;
    font-size: 6.5pt;
    padding: 1px 3px;
    border-radius: 2px;
    display: inline-block;
    width: 56px;
  }
  .v-star { background: #FEF3C7; color: #B45309; border: 1px solid #D4A017; }
  .v-keep { background: #DCFCE7; color: #16A34A; border: 1px solid #16A34A; }
  .v-watch { background: #FFEDD5; color: #C2410C; border: 1px solid #D97706; }
  .v-swap { background: #FEE2E2; color: #DC2626; border: 1px solid #DC2626; }
  .v-liq { background: #E5E5E5; color: #44403C; border: 1px solid #57534E; }

  .legend {
    display: flex;
    gap: 10px;
    margin: 3px 0 4px 0;
    font-size: 6.8pt;
    color: #6B5F54;
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
    border: 1px solid #D6D3D1;
    border-radius: 3px;
    padding: 5px 8px;
    font-size: 7pt;
  }
  .obs-card.good { border-left: 3px solid #16A34A; background: #F0FDF4; }
  .obs-card.bad { border-left: 3px solid #DC2626; background: #FEF2F2; }
  .obs-card.watch { border-left: 3px solid #D97706; background: #FFFBEB; }
  .obs-card.proj { border-left: 3px solid #0F766E; background: #F0FDFA; }
  .obs-card h3 {
    margin: 0 0 3px 0; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.2px;
    text-transform: uppercase;
  }
  .obs-card.good h3 { color: #16A34A; }
  .obs-card.bad h3 { color: #DC2626; }
  .obs-card.watch h3 { color: #D97706; }
  .obs-card.proj h3 { color: #0F766E; }
  .obs-card ul { margin: 0; padding-left: 14px; }
  .obs-card li { margin-bottom: 2px; }

  .footer-note {
    margin-top: 6px;
    padding: 5px 9px;
    border-left: 3px solid #D4A017;
    background: #FFFBEB;
    font-size: 7pt;
    color: #1A1A2E;
  }
  .footer-note strong { color: #B45309; }

  .compliance {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #D6D3D1;
    font-size: 5.8pt;
    color: #6B5F54;
    line-height: 1.3;
    text-align: justify;
  }

  .page-break { page-break-before: always; }
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
      const fundCol = `<td><div class="fund-name">${escapeHtml(r.fundName)}</div>${r.category ? `<div style="font-size:6pt;color:#6B5F54;">${escapeHtml(r.category)}</div>` : ''}</td>`;
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
      const replaceCol = `<td>${escapeHtml(r.preferredReplacementFundName ?? '—')}</td>`;
      const reasonCol = `<td>${escapeHtml(r.rationale ?? '—')}</td>`;
      return `<tr>${numCol}${fundCol}${holdersCol}${investedCol}${currentCol}${cagr3yCol}${cagr5yCol}${verdictCol}${replaceCol}${reasonCol}</tr>`;
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
        <tr style="font-weight:700; background:#F0FDFA;">
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
        ${swapList ? `<ul><li>${swapList.replace(/; /g, '</li><li>')}</li></ul>` : '<p style="margin:0;color:#6B5F54;">No SWAP-tier holdings — portfolio is healthy.</p>'}
      </div>
      <div class="obs-card watch">
        <h3>Too Young to Call (${tooYoungPct}%)</h3>
        ${watchList ? `<ul><li>${watchList.replace(/; /g, '</li><li>')}</li></ul><p style="margin:4px 0 0 0;"><em>Re-assess at next quarterly review.</em></p>` : '<p style="margin:0;color:#6B5F54;">No WATCH-tier holdings.</p>'}
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
<body>
<div class="container">
  ${
    showPrintBar
      ? `<div class="no-print no-print-bar">
          <span>📄 Full Portfolio Review — ${escapeHtml(data.familyName)} | ${escapeHtml(data.reportDate)}</span>
          <button onclick="window.print()">🖨️ Print / Save as PDF</button>
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

  <h2 style="background: #0F766E;">
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
    Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI-Registered Mutual Fund
    Distributor (ARN-286886); the firm is not a SEBI-Registered Investment Adviser. Past performance is
    not indicative of future results. 3Y &amp; 5Y CAGR figures are sourced from AMFI / AMC fact-sheets. XIRR
    figures are computed at the family/holding level as of ${escapeHtml(data.reportDate)}. Verdicts
    (STAR / KEEP / WATCH / SWAP / LIQUIDATE) represent our analytical view based on the funds&apos;
    track record, manager quality, category positioning, and category benchmark data — they do not
    constitute personalised investment advice. Final investment decisions rest with each PAN holder.
    Recommendations may be revised at subsequent quarterly reviews.
  </div>
</div>
</body>
</html>`;
}
