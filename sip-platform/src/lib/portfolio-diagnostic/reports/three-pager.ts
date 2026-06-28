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
  riskNotCapturedBanner,
} from '../report-data';
import { REPORT_TABLE_CSS } from './_shared-styles';

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
  @page { size: A4; margin: 16mm 18mm 16mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
    .page-break { page-break-before: always; }
  }
  /* Screen preview: paper-on-grey for breathing room */
  @media screen {
    html { background: #EDEFF2; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 16mm 18mm; box-shadow: 0 6px 28px rgba(21, 35, 59, 0.12); }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1F2937; line-height: 1.34; font-size: 8pt; margin: 0; background: white;
  }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar {
    position: sticky; top: 0; background: #15233B; color: white; padding: 8px 16px;
    margin-bottom: 8mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; z-index: 100;
  }
  .no-print-bar button {
    background: #9A7B4F; color: white; border: 0; padding: 6px 14px;
    font-weight: 700; border-radius: 3px; cursor: pointer; font-size: 10pt;
  }
  /* Masthead — restrained institutional letterhead */
  .header {
    border-bottom: 1px solid #15233B; padding-bottom: 6px; margin-bottom: 2px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .header .firm { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-weight: 700; font-size: 12pt; letter-spacing: 0.2px; }
  .header .sub { color: #6B7280; font-size: 7pt; margin-top: 1px; }
  .header-right { text-align: right; font-size: 7.5pt; color: #6B7280; }
  .header-right .label { font-family: Georgia, serif; font-size: 8.5pt; color: #9A7B4F; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
  .accent-rule { height: 2px; width: 56px; background: #9A7B4F; margin: 6px 0 10px; }
  .doc-title { font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-size: 14pt; font-weight: 700; margin: 0 0 10px; letter-spacing: 0.2px; }
  .doc-title .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8.5pt; font-weight: 400; color: #6B7280; margin-top: 3px; display: block; }
  /* Section headings — serif ink on a faint panel with a thin tier-coloured left rule */
  h2 {
    font-family: Georgia, 'Times New Roman', serif; color: #15233B; font-size: 11pt; margin: 12px 0 6px;
    padding: 5px 12px; border-left: 3px solid #15233B; background: #F4F6F8;
    display: flex; justify-content: space-between; align-items: center; font-weight: 700; letter-spacing: 0.2px;
  }
  h2 .count { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8.5pt; font-weight: 600; color: #6B7280; }
  h2.sec-method { border-left-color: #9A7B4F; }
  h2.sec-summary { border-left-color: #15233B; }
  h2.sec-star { border-left-color: #9A7B4F; }
  h2.sec-keep { border-left-color: #2F6F4F; }
  h2.sec-watch { border-left-color: #B07A2E; }
  h2.sec-swap { border-left-color: #9B2C3A; }
  h2.sec-liq { border-left-color: #6B7280; }
  h2.sec-tax { border-left-color: #15233B; }
  h2.sec-projection { border-left-color: #9A7B4F; }
  h3 { font-family: Georgia, serif; color: #15233B; font-size: 10pt; margin: 8px 0 4px; font-weight: 700; }
  /* Holdings table + verdict badges — shared canonical definition. */
  ${REPORT_TABLE_CSS}
  /* Snapshot KPI — white cards, hairline + navy top rule, serif navy figure */
  .snapshot { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 12px; }
  .tile { background: #fff; border: 1px solid #E5E7EB; border-top: 2px solid #15233B; padding: 8px 9px; text-align: center; }
  .tile .lbl { font-size: 6.6pt; color: #6B7280; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; }
  .tile .val { font-family: Georgia, serif; font-size: 13.5pt; font-weight: 700; color: #15233B; line-height: 1.05; margin-top: 3px; }
  /* Verdict strip — monochrome cards with a thin tier top rule (no loud fills) */
  .summary-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 4px 0 8px; }
  .strip-cell { background: #fff; border: 1px solid #E5E7EB; border-top: 3px solid #6B7280; padding: 8px 6px; text-align: center; }
  .strip-cell .count { font-family: Georgia, serif; font-size: 17pt; font-weight: 700; line-height: 1; color: #15233B; }
  .strip-cell .label { font-size: 7pt; font-weight: 700; margin-top: 5px; letter-spacing: 0.5px; text-transform: uppercase; color: #374151; }
  .strip-cell.star  { border-top-color: #9A7B4F; } .strip-cell.star .label  { color: #9A7B4F; }
  .strip-cell.keep  { border-top-color: #2F6F4F; } .strip-cell.keep .label  { color: #2F6F4F; }
  .strip-cell.watch { border-top-color: #B07A2E; } .strip-cell.watch .label { color: #B07A2E; }
  .strip-cell.swap  { border-top-color: #9B2C3A; } .strip-cell.swap .label  { color: #9B2C3A; }
  .strip-cell.liq   { border-top-color: #6B7280; } .strip-cell.liq .label   { color: #6B7280; }
  .exec-summary { background: #F4F6F8; border-left: 3px solid #15233B; padding: 8px 12px; margin: 6px 0; font-size: 9pt; line-height: 1.45; color: #1F2937; }
  .exec-summary strong { color: #15233B; }
  .methodology { font-size: 8pt; line-height: 1.45; }
  .method-table { width: 100%; margin: 4px 0; }
  .method-table td { padding: 5px 8px; border: 1px solid #E5E7EB; }
  .method-table td:first-child { font-weight: 600; color: #374151; width: 45%; }
  .method-table td:nth-child(2) { width: 12%; text-align: center; font-weight: 700; color: #9A7B4F; }
  .projection-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 6px 0; }
  .proj-card { border: 1px solid #E5E7EB; border-top: 2px solid #9A7B4F; padding: 8px 10px; background: white; }
  .proj-card h4 { margin: 0 0 4px; font-size: 9pt; color: #15233B; font-family: Georgia, serif; }
  .proj-card .big { font-family: Georgia, serif; font-size: 14pt; font-weight: 700; color: #15233B; line-height: 1; margin: 4px 0; }
  .proj-card .small { font-size: 7pt; color: #6B7280; }
  .footer-note { margin-top: 8px; padding: 7px 12px; border-left: 3px solid #9A7B4F; background: #FAF7F2; font-size: 8pt; }
  .footer-note strong { color: #8A6A40; }
  .compliance { margin-top: 8px; padding-top: 5px; border-top: 1px solid #E5E7EB; font-size: 6.5pt; color: #6B7280; line-height: 1.4; text-align: justify; }
  /* 12-Point Fund Selection Checklist — compact inline summary */
  .checklist-line { font-size: 6.5pt; color: #6B7280; margin-top: 2px; line-height: 1.3; }
  .checklist-line .cl-pass { color: #2F6F4F; font-weight: 700; }
  .checklist-line .cl-flag { color: #B07A2E; font-weight: 600; }
  /* Trustner Buy-List provenance marker on a recommended replacement */
  .buylist-tag {
    display: inline-block; font-size: 6.5pt; font-weight: 700; color: #9A7B4F;
    background: #F5EFE3; border: 1px solid #D8C7A6; border-radius: 2px;
    padding: 0 3px; margin-top: 2px; white-space: nowrap;
  }
`;

/**
 * Compact one-line summary of the Trustner 12-Point Fund Selection Checklist
 * for a single holding — "Checklist: N/12 ✓ · flags: <gate names>".
 * Space-tight by design (this is a 3-page doc). Returns '' when no checklist
 * is attached (graceful — renders nothing).
 */
function renderChecklistLine(h: ReportHolding): string {
  const items = h.checklist;
  if (!items || items.length === 0) return '';
  const total = items.length;
  const passed = items.filter((c) => c.status === 'PASS').length;
  // Strip the leading "N. " numbering for a tight flag list.
  const stripNum = (g: string) => g.replace(/^\d+\.\s*/, '');
  const flagged = items
    .filter((c) => c.status === 'FAIL' || c.status === 'FLAG')
    .map((c) => stripNum(c.gate));
  const flagsHtml = flagged.length
    ? ` · flags: <span class="cl-flag">${escapeHtml(flagged.join('; '))}</span>`
    : '';
  return `<div class="checklist-line">12-Point checklist: <span class="cl-pass">${passed}/${total} ✓</span>${flagsHtml}</div>`;
}

/**
 * Buy-List provenance marker for a recommended replacement. The replacement in
 * preferredReplacementFundName already comes buy-list-first; this surfaces when
 * that pick is itself sourced from the Trustner Approved Buy-List.
 */
function buyListTag(h: ReportHolding): string {
  if (h.buyListReplacementFundName) return `<div class="buylist-tag">★ Trustner Buy-List</div>`;
  return '';
}

function renderHoldingRow(h: ReportHolding, idx: number, verdictClass: string, verdictLabel: string, mode: 'standard' | 'swap' | 'liquidate'): string {
  const num = `<td class="ctr">${idx + 1}</td>`;
  const fund = `<td><strong>${escapeHtml(h.fundName)}</strong>${h.category ? `<div style="font-size:7pt; color:#64748B;">${escapeHtml(h.category)}</div>` : ''}</td>`;
  const holder = `<td>${escapeHtml(h.entityName)}</td>`;
  const invested = `<td class="amt">${formatInrFull(h.investedInr)}</td>`;
  const current = `<td class="amt">${formatInrFull(h.currentValueInr)}</td>`;
  // Within the SWAP tier, distinguish the precise v2 action the legacy enum collapses:
  // EXIT_UNSUITABLE ("great fund, wrong seat") vs SWITCH_BETTER (a stronger peer exists).
  const V2_SHORT: Record<string, string> = {
    EXIT_UNSUITABLE: 'EXIT', SWITCH_BETTER: 'SWITCH', SWITCH_MODE: 'SWITCH', REDUCE: 'REDUCE', REDEEM_TINY: 'REDEEM',
  };
  const shownLabel = (mode === 'swap' && h.v2Action && V2_SHORT[h.v2Action]) ? V2_SHORT[h.v2Action] : verdictLabel;
  const verdict = `<td class="ctr"><span class="verdict ${verdictClass}">${shownLabel}</span></td>`;

  if (mode === 'swap') {
    const cagr3 = `<td class="ctr ${pctClass(h.cagr3y)}">${formatPct(h.cagr3y)}</td>`;
    const cagr5 = `<td class="ctr ${pctClass(h.cagr5y)}">${formatPct(h.cagr5y)}</td>`;
    const replace = `<td><strong>${escapeHtml(h.preferredReplacementFundName ?? 'Per preferred list')}</strong>${buyListTag(h)}</td>`;
    const reason = `<td>${escapeHtml(h.rationale ?? '')}${renderChecklistLine(h)}</td>`;
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
  // WATCH holdings carry the compact 12-Point checklist line (EXIT/SWITCH/WATCH set);
  // STAR / KEEP stay clean to save space.
  const checklistLine = h.verdict === 'WATCH' ? renderChecklistLine(h) : '';
  const rationale = `<td>${escapeHtml(h.rationale ?? '')}${checklistLine}</td>`;
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

  // Central finding — capital not pulling its weight = the SWAP + LIQUIDATE current
  // value (misallocated / underperforming book). Computed from existing tier KPIs only.
  const misallocatedInr = data.tierTotals.swap.currentInr + data.tierTotals.liquidate.currentInr;
  const misallocatedPct = data.currentValueInr > 0 ? (misallocatedInr / data.currentValueInr) * 100 : 0;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — Portfolio Diagnostic (3-page)</title><style>${STYLES}</style></head>
<body><div class="container">${riskNotCapturedBanner(data)}
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>📊 Portfolio Diagnostic Report (3-page) — ${escapeHtml(data.familyName)}</span>
  <span style="display:flex; align-items:center; gap:12px;">
    <span style="font-size:7.5pt; opacity:0.85; font-weight:400;">Tip: in the print dialog, untick <strong>“Headers and footers”</strong> for a clean PDF (no web address).</span>
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  </span>
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
<div class="accent-rule"></div>

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

${data.riskGap ? `<div style="padding:8px 13px; margin:6px 0 8px 0; font-size:9.5pt; font-weight:700; line-height:1.4; ${data.riskGap.hasGap ? 'background:#F6E6E9; border:1px solid #DDB3BB; border-left:3px solid #9B2C3A; color:#7A2230;' : 'background:#E8F1EC; border:1px solid #B9D4C5; border-left:3px solid #2F6F4F; color:#1F4E37;'}">
  ${data.riskGap.hasGap
    ? data.riskGap.carriedTier !== data.riskGap.toleratedTier
      ? `THE GAP — comfort level: <u>${escapeHtml(data.riskGap.toleratedTier)}</u> risk · portfolio carries: <u>${escapeHtml(data.riskGap.carriedTier)}</u> risk (${data.riskGap.pctAboveCeiling}% of the equity book above the ceiling). The actions in this report close it.`
      : `PARTIAL GAP — the mix sits at the client's ${escapeHtml(data.riskGap.toleratedTier)} ceiling, but ${data.riskGap.pctAboveCeiling}% of the equity book runs above it. The trims below bring the tail inside.`
    : `RISK ALIGNED — portfolio carries ${escapeHtml(data.riskGap.carriedTier)} risk, within the client's ${escapeHtml(data.riskGap.toleratedTier)} comfort ceiling.`}
</div>` : ''}

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
  ${misallocatedInr > 0
    ? `<strong>Central finding:</strong> ${formatInrFull(misallocatedInr)} (${misallocatedPct.toFixed(0)}% of current value) is parked in funds that are either out-positioned by a stronger peer or are immaterial legacy holdings — capital that can be re-aligned to higher-conviction funds without changing the family's overall risk posture.<br/><br/>`
    : ''}
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
  <strong style="color:#9A7B4F;">STAR ≥ 0.80</strong> (top quartile) ·
  <strong style="color:#2F6F4F;">KEEP 0.60–0.80</strong> (top half) ·
  <strong style="color:#B07A2E;">WATCH &lt; 36 mo track record</strong> ·
  <strong style="color:#9B2C3A;">SWAP &lt; 0.60</strong> (with better alternative available) ·
  <strong style="color:#6B7280;">LIQUIDATE &lt; ₹2,000</strong> (legacy cleanup).
</div>

<div style="font-size:8pt; margin-top:6px;">
  <strong>Second layer — Trustner 12-Point Fund Selection Checklist:</strong> every EXIT / SWITCH / WATCH
  holding is additionally run through our 12-point process (track record, AUM-capacity band, expense ratio,
  volatility, Sharpe, returns vs category &amp; benchmark, holdings count, manager skin-in-the-game, exit load
  &amp; lock-in, consistency across cycles, portfolio overlap, turnover). Each holding below shows its
  <em>N/12 ✓</em> score and any flagged gates, so the recommendation is traceable to evidence, not opinion.
  Recommended replacements are drawn capacity-aware from the <strong style="color:#9A7B4F;">★ Trustner Approved Buy-List</strong> wherever one is available.
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
${data.starHoldings.length === 0 ? '<p style="color:#64748B; font-style:italic; padding:8px;">No STAR-tier holdings in this portfolio.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Why</th></tr></thead>
  <tbody>${data.starHoldings.map((h, i) => renderHoldingRow(h, i, 'v-star', '★ STAR', 'standard')).join('')}</tbody>
</table>`}

<h2 class="sec-keep"><span>Tier B — KEEP (solid; some need J-curve time)</span><span class="count">${data.tierTotals.keep.count} holdings · ${formatInrShort(data.tierTotals.keep.investedInr)} invested</span></h2>
${data.keepHoldings.length === 0 ? '<p style="color:#64748B; font-style:italic; padding:8px;">No KEEP-tier holdings.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Why</th></tr></thead>
  <tbody>${data.keepHoldings.map((h, i) => renderHoldingRow(h, i, 'v-keep', 'KEEP', 'standard')).join('')}</tbody>
</table>`}

<h2 class="sec-watch"><span>Tier B — WATCH (too new to judge — re-assess in 6-12 mo)</span><span class="count">${data.tierTotals.watch.count} holdings · ${formatInrShort(data.tierTotals.watch.investedInr)} invested</span></h2>
${data.watchHoldings.length === 0 ? '<p style="color:#64748B; font-style:italic; padding:8px;">No WATCH-tier holdings.</p>' : `
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
${data.swapHoldings.length === 0 ? '<p style="color:#64748B; font-style:italic; padding:8px;">No SWAP-tier holdings — portfolio is healthy.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund (Exit)</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">3Y CAGR</th><th class="ctr">5Y CAGR</th><th class="ctr">Verdict</th><th>Replace With</th><th>Reason</th></tr></thead>
  <tbody>${data.swapHoldings.map((h, i) => renderHoldingRow(h, i, 'v-swap', 'SWAP', 'swap')).join('')}</tbody>
</table>`}

<h2 class="sec-liq"><span>Tier D — LIQUIDATE (immaterial legacy cleanup)</span><span class="count">${data.tierTotals.liquidate.count} liquidations · ${formatInrFull(data.tierTotals.liquidate.investedInr)} invested</span></h2>
${data.liquidateHoldings.length === 0 ? '<p style="color:#64748B; font-style:italic; padding:8px;">No LIQUIDATE-tier holdings.</p>' : `
<table>
  <thead><tr><th class="ctr" style="width:24px;">#</th><th>Fund</th><th>Held By</th><th>Invested</th><th>Current</th><th class="ctr">XIRR</th><th class="ctr">3Y CAGR</th><th class="ctr">Verdict</th><th>Action</th></tr></thead>
  <tbody>${data.liquidateHoldings.map((h, i) => renderHoldingRow(h, i, 'v-liq', 'LIQUIDATE', 'liquidate')).join('')}</tbody>
</table>`}

${data.consolidationGroups && data.consolidationGroups.length > 0 ? `
<h2 class="sec-swap"><span>Consolidation — Duplicate Funds in the Same Category</span><span class="count">${data.consolidationGroups.reduce((s, g) => s + g.consolidate.length, 0)} duplicates · ${formatInrShort(data.consolidationValueInr)} simplifiable</span></h2>
<table>
  <thead><tr><th>Category</th><th class="ctr">Funds</th><th>Keep (strongest)</th><th>Consolidate Into the Keep</th><th class="ctr">Value</th></tr></thead>
  <tbody>${data.consolidationGroups.map((g) => `<tr><td><strong>${escapeHtml(g.subCategory)}</strong></td><td class="ctr">${g.count}</td><td>${escapeHtml(g.keep.fundName)}</td><td style="font-size:7.5pt;">${g.consolidate.map((c) => escapeHtml(c.fundName)).join(', ')}</td><td class="amt">${formatInrShort(g.totalConsolidatableInr)}</td></tr>`).join('')}</tbody>
</table>
<p style="font-size:7pt; color:#64748B; margin-top:4px;">Holding several funds in one category is duplication, not diversification — consolidating into the strongest one simplifies the book with no loss of exposure.</p>
` : ''}

<h2 class="sec-tax"><span>III. Tax Impact of Recommended Exits</span></h2>
${data.taxSummary && data.taxSummary.exitCount > 0 ? `
<div class="exec-summary">${escapeHtml(data.taxSummary.headline)}</div>
<table>
  <thead><tr><th>Fund (Exit)</th><th class="ctr">Gain</th><th class="ctr">Type</th><th class="ctr">Est. Tax</th><th>Note</th></tr></thead>
  <tbody>${data.taxSummary.lines.map((l) => `<tr><td>${escapeHtml(l.fundName)}</td><td class="amt">${formatInrFull(l.gainInr)}</td><td class="ctr">${l.locked ? 'LOCKED' : l.gainType}</td><td class="amt">${l.estTaxInr != null ? formatInrFull(l.estTaxInr) : '—'}</td><td style="font-size:7pt;">${escapeHtml(l.note)}</td></tr>`).join('')}</tbody>
</table>
<p style="font-size:7pt; color:#64748B; margin-top:4px;">Estimates per FY2025-26 rules (equity LTCG 12.5% above ₹1.25L/yr; STCG 20%; debt at slab; ELSS 3-yr lock-in). Phase exits across financial years to use each year's ₹1.25L exemption. Informational only — confirm exact liability with the family Chartered Accountant before execution.</p>
` : `
<div class="exec-summary">No exits are recommended for this portfolio — there is no exit-tax to plan.</div>
`}

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
    <div class="big" style="color: #2F6F4F;">+${formatInrShort(projectedImproved - projectedCurrent)}</div>
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
  Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI registered Mutual Fund
  distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886. Past performance
  is not indicative of future results. 3Y &amp; 5Y CAGR figures sourced from AMFI / AMC fact-sheets;
  XIRR figures are computed at the family / holding level as of ${escapeHtml(data.reportDate)}.
  Verdicts and the 12-Point Fund Selection Checklist represent our analytical view based on the
  funds&apos; track record, manager quality, and category positioning; this report does NOT constitute
  investment advice as defined under SEBI (Investment Advisers) Regulations, 2013. Final investment
  decisions rest with each PAN holder. Tax estimates are informational — confirm exact liability with
  your Chartered Accountant. Wealth projections assume historical CAGR continues — markets
  may deviate; the projections are illustrative, not guaranteed.
</div>
</div></body></html>`;
}
