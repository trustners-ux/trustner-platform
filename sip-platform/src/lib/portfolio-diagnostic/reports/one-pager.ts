/**
 * One-Pager Portfolio Snapshot
 *
 * Single-A4-page condensed report for client meetings where the full
 * 2-page Full Portfolio Review is too detailed. Shows KPI strip,
 * tier counts, top 3 actions, and bottom-line verdict.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  formatInrShort,
  formatInrFull,
  formatPct,
} from '../report-data';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STYLES = `
  @page { size: A4; margin: 14mm 18mm 14mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
  }
  /* Screen preview: paper-on-grey for breathing room */
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    body { max-width: 210mm; margin: 16px auto; padding: 14mm 18mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1A1A2E; line-height: 1.35; font-size: 9pt; margin: 0; background: white;
  }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar {
    position: sticky; top: 0; background: #0F766E; color: white;
    padding: 8px 16px; margin-bottom: 8mm; display: flex; justify-content: space-between;
    align-items: center; font-size: 10pt;
  }
  .no-print-bar button {
    background: white; color: #0F766E; border: 0; padding: 6px 14px; font-weight: 700;
    border-radius: 4px; cursor: pointer; font-size: 10pt;
  }
  .header {
    border-bottom: 3px solid #0F766E; padding-bottom: 6px; margin-bottom: 8px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .header .firm { color: #0F766E; font-weight: 700; font-size: 12pt; }
  .header .sub { color: #6B5F54; font-size: 7.5pt; }
  .header-right { text-align: right; font-size: 8pt; color: #6B5F54; }
  .header-right .label { font-size: 10pt; color: #0F766E; font-weight: 700; }
  .doc-title {
    background: #0F766E; color: white; padding: 8px 14px; font-size: 14pt;
    font-weight: 700; margin-bottom: 8px; text-align: center;
  }
  .for-line { font-size: 10pt; font-weight: 400; margin-top: 3px; opacity: 0.92; }
  .kpi-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px;
  }
  .kpi-tile {
    background: #F0FDFA; border: 1.5px solid #0F766E; padding: 8px;
    text-align: center; border-radius: 4px;
  }
  .kpi-tile .lbl { font-size: 7pt; color: #115E59; font-weight: 700; letter-spacing: 0.4px; }
  .kpi-tile .val { font-size: 16pt; font-weight: 700; color: #0F766E; line-height: 1.05; margin-top: 3px; }
  .kpi-tile .sub-val { font-size: 7pt; color: #6B5F54; margin-top: 2px; }
  .tier-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 10px;
  }
  .tier-tile {
    padding: 8px 6px; text-align: center; border-radius: 3px; color: white;
  }
  .tier-tile .count { font-size: 22pt; font-weight: 700; line-height: 1; }
  .tier-tile .label { font-size: 9pt; font-weight: 700; margin-top: 4px; letter-spacing: 0.3px; }
  .tier-tile .amt { font-size: 7.5pt; margin-top: 2px; opacity: 0.92; }
  .tier-tile.star { background: #B45309; }
  .tier-tile.keep { background: #16A34A; }
  .tier-tile.watch { background: #D97706; }
  .tier-tile.swap { background: #DC2626; }
  .tier-tile.liq { background: #6B5F54; }
  h2 {
    color: #0F766E; font-size: 11pt; margin: 8px 0 4px 0; padding-bottom: 2px;
    border-bottom: 2px solid #0F766E; font-weight: 700;
  }
  .verdict-line {
    background: #F0FDFA; border-left: 4px solid #0F766E; padding: 8px 12px;
    font-size: 10pt; margin-bottom: 8px;
  }
  .verdict-line strong { color: #0F766E; font-weight: 700; }
  .action-table {
    width: 100%; border-collapse: collapse; font-size: 8pt; margin: 4px 0 8px 0;
  }
  .action-table th { background: #B45309; color: white; padding: 5px 8px; text-align: left; font-size: 8pt; }
  .action-table td { padding: 5px 8px; border: 1px solid #D6D3D1; vertical-align: top; }
  .action-table .amt { text-align: right; font-weight: 700; color: #B45309; white-space: nowrap; }
  .action-table tr:nth-child(even) td { background: #FFFBEB; }
  .no-action {
    text-align: center; background: #F0FDF4; border: 2px solid #16A34A;
    padding: 18px; border-radius: 6px; margin: 8px 0;
  }
  .no-action .icon { font-size: 24pt; color: #16A34A; }
  .no-action .msg { font-size: 11pt; font-weight: 700; color: #15803D; margin-top: 4px; }
  .compliance {
    margin-top: 12px; padding-top: 6px; border-top: 1px solid #D6D3D1;
    font-size: 6.8pt; color: #6B5F54; line-height: 1.4; text-align: justify;
  }
  .footer-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 8px; padding: 6px 10px; background: #1A1A2E; color: white; font-size: 8pt;
  }
`;

export function renderOnePagerHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const hasActions = data.swapHoldings.length + data.liquidateHoldings.length > 0;

  // Top 3 swap actions (most impactful)
  const topActions = data.swapHoldings.slice(0, 3);

  const currentXirr = data.familyXirrPct ?? 0;
  const projectedLow = (currentXirr + 2.5).toFixed(1);
  const projectedHigh = (currentXirr + 4.5).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — One-Pager Snapshot</title><style>${STYLES}</style></head>
<body><div class="container">
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>📄 One-Pager Snapshot — ${escapeHtml(data.familyName)}</span>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>` : ''}

<div class="header">
  <div>
    <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
    <div class="sub">AMFI Registered MFD | ARN-286886 | www.trustner.in</div>
  </div>
  <div class="header-right">
    <div class="label">ONE-PAGER SNAPSHOT</div>
    <div>${escapeHtml(data.reportDate)}</div>
    <div>Doc: ${escapeHtml(data.documentId)}</div>
  </div>
</div>

<div class="doc-title">
  Portfolio Diagnostic — Bottom Line
  <div class="for-line">For: ${escapeHtml(data.familyName)} · ${data.numHoldings} holdings · ${data.numEntities} entities</div>
</div>

<div class="kpi-grid">
  <div class="kpi-tile">
    <div class="lbl">TOTAL INVESTED</div>
    <div class="val">${formatInrShort(data.totalInvestedInr)}</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">CURRENT VALUE</div>
    <div class="val">${formatInrShort(data.currentValueInr)}</div>
    <div class="sub-val">${data.totalGainInr >= 0 ? '▲' : '▼'} ${formatInrShort(data.totalGainInr)} (${data.totalInvestedInr > 0 ? ((data.totalGainInr / data.totalInvestedInr) * 100).toFixed(1) : '0'}%)</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">FAMILY XIRR</div>
    <div class="val">${formatPct(data.familyXirrPct, 2)}</div>
    <div class="sub-val">After re-alignment: ${projectedLow}-${projectedHigh}%</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">REALLOCATION</div>
    <div class="val">${data.swapCount + data.liquidateCount > 0 ? formatInrShort(data.totalReallocationInr) : '₹0'}</div>
    <div class="sub-val">${data.swapCount} swaps + ${data.liquidateCount} cleanups</div>
  </div>
</div>

<h2>Portfolio Verdict at a Glance</h2>
<div class="tier-grid">
  <div class="tier-tile star">
    <div class="count">${data.tierTotals.star.count}</div>
    <div class="label">★ STAR</div>
    <div class="amt">${formatInrShort(data.tierTotals.star.investedInr)}</div>
  </div>
  <div class="tier-tile keep">
    <div class="count">${data.tierTotals.keep.count}</div>
    <div class="label">KEEP</div>
    <div class="amt">${formatInrShort(data.tierTotals.keep.investedInr)}</div>
  </div>
  <div class="tier-tile watch">
    <div class="count">${data.tierTotals.watch.count}</div>
    <div class="label">WATCH</div>
    <div class="amt">${formatInrShort(data.tierTotals.watch.investedInr)}</div>
  </div>
  <div class="tier-tile swap">
    <div class="count">${data.tierTotals.swap.count}</div>
    <div class="label">SWAP</div>
    <div class="amt">${formatInrShort(data.tierTotals.swap.investedInr)}</div>
  </div>
  <div class="tier-tile liq">
    <div class="count">${data.tierTotals.liquidate.count}</div>
    <div class="label">LIQUIDATE</div>
    <div class="amt">${formatInrShort(data.tierTotals.liquidate.investedInr)}</div>
  </div>
</div>

<div class="verdict-line">
  <strong>Bottom line:</strong>
  ${
    data.tierTotals.star.count + data.tierTotals.keep.count >= data.numHoldings * 0.7
      ? `${(((data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio)).toFixed(0))}% of portfolio is in top-quartile or solid funds — <strong>continue all existing SIPs</strong>. `
      : ''
  }
  ${
    hasActions
      ? `Execute <strong>${data.swapCount} swap${data.swapCount !== 1 ? 's' : ''}${data.liquidateCount > 0 ? ` + ${data.liquidateCount} cleanup${data.liquidateCount !== 1 ? 's' : ''}` : ''}</strong> totaling <strong>${formatInrShort(data.totalReallocationInr)}</strong> for ${projectedLow}-${projectedHigh}% XIRR over 36 months.`
      : 'No SWAP/LIQUIDATE actions needed — portfolio is healthy.'
  }
</div>

${
  hasActions
    ? `<h2>Top Priority Actions (this week)</h2>
       <table class="action-table">
         <thead><tr>
           <th style="width:24px;">#</th>
           <th>PAN / Entity</th>
           <th>Exit</th>
           <th>Replace With</th>
           <th class="amt" style="text-align:right;">Amount</th>
           <th>Why</th>
         </tr></thead>
         <tbody>
           ${topActions
             .map(
               (h, i) => `<tr>
                 <td>${i + 1}</td>
                 <td>${escapeHtml(h.entityName)}</td>
                 <td>${escapeHtml(h.fundName)}</td>
                 <td>${escapeHtml(h.preferredReplacementFundName ?? 'Per preferred list')}</td>
                 <td class="amt">${formatInrFull(h.currentValueInr)}</td>
                 <td>${escapeHtml(h.rationale ?? '')}</td>
               </tr>`
             )
             .join('')}
         </tbody>
       </table>
       ${data.swapHoldings.length + data.liquidateHoldings.length > 3
         ? `<p style="font-size:8pt; color:#6B5F54; margin: 4px 0 0 0;">+${data.swapHoldings.length + data.liquidateHoldings.length - 3} more actions detailed in the full Action Sheet.</p>`
         : ''}
      `
    : `<div class="no-action">
         <div class="icon">✓</div>
         <div class="msg">NO ACTIONS REQUIRED</div>
         <div style="font-size:9pt; color:#15803D; margin-top:4px;">Portfolio is healthy. Continue all existing SIPs as scheduled. Next review: ~90 days.</div>
       </div>`
}

<div class="footer-row">
  <div>Prepared by: ${escapeHtml(data.rmName)}</div>
  <div>Document: ${escapeHtml(data.documentId)} · ${escapeHtml(data.reportDate)}</div>
</div>

<div class="compliance">
  Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI-Registered Mutual Fund
  Distributor (ARN-286886); the firm is not a SEBI-Registered Investment Adviser. Past performance is
  not indicative of future returns. Verdicts (STAR / KEEP / WATCH / SWAP / LIQUIDATE) represent the
  firm&apos;s analytical view based on the funds&apos; track record, manager quality, and category
  positioning — they do not constitute personalised investment advice. Final investment decisions
  rest with each PAN holder. This one-pager is a summary; refer to the Full Portfolio Review and
  Action Sheet for execution-level detail.
</div>
</div></body></html>`;
}
