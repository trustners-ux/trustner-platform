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
  riskNotCapturedBanner,
} from '../report-data';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STYLES = `
  @page { size: A4; margin: 16mm 18mm 14mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
  }
  /* Screen preview: paper-on-grey for breathing room */
  @media screen {
    html { background: #EDEFF2; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 16mm 18mm; box-shadow: 0 6px 28px rgba(21, 35, 59, 0.12); }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1F2937; line-height: 1.4; font-size: 9pt; margin: 0; background: white;
  }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar {
    position: sticky; top: 0; background: #15233B; color: white;
    padding: 8px 16px; margin-bottom: 8mm; display: flex; justify-content: space-between;
    align-items: center; font-size: 10pt;
  }
  .no-print-bar button {
    background: #9A7B4F; color: white; border: 0; padding: 6px 14px; font-weight: 700;
    border-radius: 3px; cursor: pointer; font-size: 10pt;
  }
  /* Masthead — restrained institutional letterhead */
  .header {
    border-bottom: 1px solid #15233B; padding-bottom: 8px; margin-bottom: 2px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .header .firm { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-weight: 700; font-size: 13.5pt; letter-spacing: 0.2px; }
  .header .sub { color: #6B7280; font-size: 7.5pt; margin-top: 1px; letter-spacing: 0.3px; }
  .header-right { text-align: right; font-size: 8pt; color: #6B7280; }
  .header-right .label { font-family: Georgia, serif; font-size: 9pt; color: #9A7B4F; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }
  .accent-rule { height: 2px; width: 60px; background: #9A7B4F; margin: 0 0 12px 0; }
  .doc-title { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-size: 15pt; font-weight: 700; margin: 2px 0 1px; letter-spacing: 0.2px; }
  .for-line { font-size: 8.5pt; font-weight: 400; color: #6B7280; margin: 0 0 12px; }
  /* KPI strip — white cards, hairline border, navy serif value */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .kpi-tile { background: #fff; border: 1px solid #E5E7EB; border-top: 2px solid #15233B; padding: 9px 10px; }
  .kpi-tile .lbl { font-size: 6.6pt; color: #6B7280; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; }
  .kpi-tile .val { font-family: Georgia, serif; font-size: 16pt; font-weight: 700; color: #15233B; line-height: 1.05; margin-top: 4px; }
  .kpi-tile .sub-val { font-size: 7pt; color: #6B7280; margin-top: 3px; }
  /* Verdict tiles — monochrome cards with a thin tier rule (no loud fills) */
  .tier-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
  .tier-tile { background: #fff; border: 1px solid #E5E7EB; border-top: 3px solid #6B7280; padding: 9px 6px 8px; text-align: center; }
  .tier-tile .count { font-family: Georgia, serif; font-size: 21pt; font-weight: 700; line-height: 1; color: #15233B; }
  .tier-tile .label { font-size: 7.2pt; font-weight: 700; margin-top: 5px; letter-spacing: 0.6px; text-transform: uppercase; color: #374151; }
  .tier-tile .amt { font-size: 7pt; margin-top: 3px; color: #6B7280; }
  .tier-tile.star  { border-top-color: #9A7B4F; } .tier-tile.star .label  { color: #9A7B4F; }
  .tier-tile.keep  { border-top-color: #2F6F4F; } .tier-tile.keep .label  { color: #2F6F4F; }
  .tier-tile.watch { border-top-color: #B07A2E; } .tier-tile.watch .label { color: #B07A2E; }
  .tier-tile.swap  { border-top-color: #9B2C3A; } .tier-tile.swap .label  { color: #9B2C3A; }
  .tier-tile.liq   { border-top-color: #6B7280; } .tier-tile.liq .label   { color: #6B7280; }
  /* Section heading — serif, thin hairline */
  h2 { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-size: 11pt; margin: 14px 0 7px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; font-weight: 700; letter-spacing: 0.2px; }
  /* Callouts — subtle panel + restrained left rule */
  .verdict-line { background: #F4F6F8; border-left: 3px solid #15233B; padding: 9px 12px; font-size: 9.5pt; margin-bottom: 10px; color: #1F2937; }
  .verdict-line strong { color: #15233B; font-weight: 700; }
  .action-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 6px 0 8px; }
  .action-table th { background: #15233B; color: white; padding: 5px 8px; text-align: left; font-size: 7.4pt; font-weight: 600; letter-spacing: 0.3px; }
  .action-table td { padding: 5px 8px; border: 1px solid #E5E7EB; vertical-align: top; }
  .action-table .amt { text-align: right; font-weight: 700; color: #15233B; white-space: nowrap; }
  .action-table tr:nth-child(even) td { background: #F9FAFB; }
  .act-badge { display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 6.8pt; font-weight: 700; white-space: nowrap; border: 1px solid transparent; }
  .act-badge.exit { background: #FBEDEF; color: #9B2C3A; border-color: #E3B7BE; }
  .act-badge.switch { background: #FBF2E6; color: #B07A2E; border-color: #E6CFA6; }
  .buylist-tag { display: inline-block; margin-left: 4px; color: #9A7B4F; font-size: 6.8pt; font-weight: 700; white-space: nowrap; }
  .v2-callout { background: #FAF7F2; border-left: 3px solid #9A7B4F; padding: 8px 12px; font-size: 8.5pt; margin: 6px 0 10px; color: #1F2937; }
  .v2-callout strong { color: #8A6A40; }
  .no-action { text-align: center; background: #F4F6F8; border: 1px solid #E5E7EB; border-top: 3px solid #2F6F4F; padding: 18px; margin: 10px 0; }
  .no-action .icon { font-size: 22pt; color: #2F6F4F; }
  .no-action .msg { font-family: Georgia, serif; font-size: 12pt; font-weight: 700; color: #15233B; margin-top: 4px; letter-spacing: 0.3px; }
  .compliance { margin-top: 14px; padding-top: 7px; border-top: 1px solid #E5E7EB; font-size: 6.6pt; color: #6B7280; line-height: 1.45; text-align: justify; }
  .footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 7px 12px; background: #15233B; color: white; font-size: 8pt; letter-spacing: 0.2px; }
`;

export function renderOnePagerHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const hasActions = data.swapHoldings.length + data.liquidateHoldings.length > 0;

  // Top 3 swap actions (most impactful)
  const topActions = data.swapHoldings.slice(0, 3);

  const currentXirr = data.familyXirrPct ?? 0;
  const projectedLow = (currentXirr + 2.5).toFixed(1);
  const projectedHigh = (currentXirr + 4.5).toFixed(1);

  // Exit-vs-Switch badge: the v2 engine distinguishes a clean EXIT (unsuitable,
  // no like-for-like replacement) from a SWITCH (move to a better fund in-category).
  const actionBadge = (h: (typeof topActions)[number]): string => {
    const a = h.v2Action ?? '';
    if (a.startsWith('SWITCH')) return `<span class="act-badge switch">SWITCH</span>`;
    if (a.startsWith('EXIT') || h.verdict === 'LIQUIDATE') return `<span class="act-badge exit">EXIT</span>`;
    // Fall back to the precise v2 label when present, else the legacy verdict.
    const label = h.v2ActionLabel ?? h.verdict;
    return `<span class="act-badge exit">${escapeHtml(label)}</span>`;
  };

  // ★ Buy-List marker — the replacement is on the Trustner Approved Buy-List.
  const replacementCell = (h: (typeof topActions)[number]): string => {
    const name = h.preferredReplacementFundName ?? 'Per preferred list';
    const onList = h.buyListReplacementFundName != null;
    return `${escapeHtml(name)}${onList ? `<span class="buylist-tag">★ Buy-List</span>` : ''}`;
  };

  // Single combined consolidation + tax callout (only if either signal exists).
  const tax = data.taxSummary;
  const consolGroups = data.consolidationGroups ?? [];
  const hasConsol = consolGroups.length > 0 && data.consolidationValueInr > 0;
  const hasTax = !!tax && tax.exitCount > 0 && tax.estTotalTaxInr > 0;
  let v2Callout = '';
  if (hasConsol || hasTax) {
    const dupeCount = consolGroups.reduce((s, g) => s + g.count, 0);
    const parts: string[] = [];
    if (hasConsol) {
      parts.push(`<strong>${dupeCount} overlapping fund${dupeCount !== 1 ? 's' : ''}</strong> can be consolidated (${formatInrShort(data.consolidationValueInr)})`);
    }
    if (hasTax) {
      parts.push(`est. exit tax <strong>${formatInrShort(tax!.estTotalTaxInr)}</strong> — confirm with your CA`);
    }
    v2Callout = `<div class="v2-callout">${parts.join('; ')}.</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — One-Pager Snapshot</title><style>${STYLES}</style></head>
<body><div class="container">${riskNotCapturedBanner(data)}
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

<div class="accent-rule"></div>
<div class="doc-title">Portfolio Diagnostic — Bottom Line</div>
<div class="for-line">Prepared for ${escapeHtml(data.familyName)} · ${data.numHoldings} holdings · ${data.numEntities} ${data.numEntities === 1 ? 'entity' : 'entities'}</div>

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
           <th style="width:48px;">Action</th>
           <th>Fund</th>
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
                 <td>${actionBadge(h)}</td>
                 <td>${escapeHtml(h.fundName)}</td>
                 <td>${replacementCell(h)}</td>
                 <td class="amt">${formatInrFull(h.currentValueInr)}</td>
                 <td>${escapeHtml(h.rationale ?? '')}</td>
               </tr>`
             )
             .join('')}
         </tbody>
       </table>
       ${v2Callout}
       ${data.swapHoldings.length + data.liquidateHoldings.length > 3
         ? `<p style="font-size:8pt; color:#64748B; margin: 4px 0 0 0;">+${data.swapHoldings.length + data.liquidateHoldings.length - 3} more actions detailed in the full Action Sheet.</p>`
         : ''}
      `
    : `<div class="no-action">
         <div class="icon">✓</div>
         <div class="msg">No Actions Required</div>
         <div style="font-size:9pt; color:#6B7280; margin-top:4px;">Portfolio is healthy. Continue all existing SIPs as scheduled. Next review: ~90 days.</div>
       </div>`
}

<div class="footer-row">
  <div>Prepared by: ${escapeHtml(data.rmName)}</div>
  <div>Document: ${escapeHtml(data.documentId)} · ${escapeHtml(data.reportDate)}</div>
</div>

<div class="compliance">
  Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI registered Mutual Fund
  distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886. Past performance is
  not indicative of future returns. Verdicts (STAR / KEEP / WATCH / SWAP / LIQUIDATE) represent the
  firm&apos;s analytical view based on the funds&apos; track record, manager quality, and category
  positioning — they do not constitute personalised investment advice. Final investment decisions
  rest with each PAN holder. This one-pager is a summary; refer to the Full Portfolio Review and
  Action Sheet for execution-level detail.
</div>
</div></body></html>`;
}
