/**
 * Investment Proposal — Forward Plan (auto-generated from the PD run)
 *
 * Where the other reports DIAGNOSE the book as it stands, this one looks
 * FORWARD. It answers three client questions in one page:
 *   1. "Is my equity mix right for my goal?" — current effective equity %
 *      (with hybrid look-through) vs the risk model's target equity %.
 *   2. "What do I actually change?" — the consolidated EXIT/SWITCH moves,
 *      sell-this → buy-that, leaning on the Approved Buy-List.
 *   3. "How much do I invest each month to get there?" — a step-up SIP plan
 *      that funds the gap between the goal corpus and what the current book
 *      will grow to on its own.
 *
 * Pure presentation: every input comes from ReportData (forwardPlan added in
 * report-data.ts). The SIP math is the standard future-value-of-annuity model.
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
import { renderBacktestSvg } from '../v2/backtest';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Required level monthly SIP to grow `gap` over `months` at monthly rate `i`
 *  (annuity-due — contributions at start of month). Returns 0 if gap ≤ 0. */
function requiredMonthlySip(gap: number, months: number, annualPct: number): number {
  if (gap <= 0 || months <= 0) return 0;
  const i = annualPct / 100 / 12;
  if (i <= 0) return gap / months;
  const factor = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  return gap / factor;
}

const STYLES = `
  @page { size: A4; margin: 14mm 18mm 14mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
  }
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 14mm 18mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A2E; line-height: 1.35; font-size: 9pt; margin: 0; background: white; }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar { position: sticky; top: 0; background: #0c4a6e; color: white; padding: 8px 16px; margin-bottom: 8mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; }
  .no-print-bar button { background: white; color: #0c4a6e; border: 0; padding: 6px 14px; font-weight: 700; border-radius: 4px; cursor: pointer; font-size: 10pt; }
  .header { border-bottom: 3px solid #0c4a6e; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header .firm { color: #0c4a6e; font-weight: 700; font-size: 12pt; }
  .header .sub { color: #64748B; font-size: 7.5pt; }
  .header-right { text-align: right; font-size: 8pt; color: #64748B; }
  .header-right .label { font-size: 10pt; color: #0c4a6e; font-weight: 700; }
  .doc-title { background: #0c4a6e; color: white; padding: 8px 14px; font-size: 14pt; font-weight: 700; margin-bottom: 8px; text-align: center; }
  .for-line { font-size: 10pt; font-weight: 400; margin-top: 3px; opacity: 0.92; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
  .kpi-tile { background: #eff6ff; border: 1.5px solid #0c4a6e; padding: 8px; text-align: center; border-radius: 4px; }
  .kpi-tile .lbl { font-size: 7pt; color: #115E59; font-weight: 700; letter-spacing: 0.4px; }
  .kpi-tile .val { font-size: 15pt; font-weight: 700; color: #0c4a6e; line-height: 1.05; margin-top: 3px; }
  .kpi-tile .sub-val { font-size: 7pt; color: #64748B; margin-top: 2px; }
  h2 { color: #0c4a6e; font-size: 11pt; margin: 12px 0 4px 0; padding-bottom: 2px; border-bottom: 2px solid #0c4a6e; font-weight: 700; }
  .alloc-row { display: flex; align-items: center; gap: 8px; margin: 5px 0; font-size: 8.5pt; }
  .alloc-row .alloc-label { width: 110px; font-weight: 700; color: #115E59; }
  .alloc-row .bar-track { flex: 1; background: #E7E5E4; border-radius: 3px; height: 16px; position: relative; overflow: hidden; }
  .alloc-row .bar-fill { height: 100%; border-radius: 3px; }
  .alloc-row .bar-fill.cur { background: #0c4a6e; }
  .alloc-row .bar-fill.tgt { background: #16A34A; }
  .alloc-row .alloc-val { width: 52px; text-align: right; font-weight: 700; }
  .gap-note { background: #FEFCE8; border-left: 4px solid #B45309; padding: 7px 12px; font-size: 8.5pt; margin: 6px 0 4px 0; }
  .gap-note strong { color: #B45309; }
  .gap-note.ok { background: #F0FDF4; border-left-color: #16A34A; }
  .gap-note.ok strong { color: #15803D; }
  .action-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 4px 0 8px 0; }
  .action-table th { background: #B45309; color: white; padding: 5px 8px; text-align: left; font-size: 8pt; }
  .action-table td { padding: 5px 8px; border: 1px solid #D6D3D1; vertical-align: top; }
  .action-table .amt { text-align: right; font-weight: 700; color: #B45309; white-space: nowrap; }
  .action-table tr:nth-child(even) td { background: #FFFBEB; }
  .act-badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 6.8pt; font-weight: 700; color: white; white-space: nowrap; }
  .act-badge.exit { background: #BE123C; }
  .act-badge.switch { background: #D97706; }
  .buylist-tag { display: inline-block; margin-left: 4px; color: #B45309; font-size: 6.8pt; font-weight: 700; white-space: nowrap; }
  .sip-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 6px 0; }
  .sip-card { border: 1.5px solid #0c4a6e; border-radius: 5px; padding: 10px 12px; }
  .sip-card.hero { background: #0c4a6e; color: white; border-color: #0c4a6e; }
  .sip-card .sip-lbl { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.3px; opacity: 0.85; }
  .sip-card .sip-val { font-size: 19pt; font-weight: 700; line-height: 1.1; margin-top: 2px; }
  .sip-card .sip-sub { font-size: 7.5pt; margin-top: 3px; opacity: 0.9; }
  .sip-steps { font-size: 8.5pt; margin: 6px 0; }
  .sip-steps li { margin: 2px 0; }
  .no-goal { text-align: center; background: #FEF3C7; border: 2px solid #B45309; padding: 14px; border-radius: 6px; margin: 8px 0; font-size: 9pt; color: #92400E; }
  .compliance { margin-top: 12px; padding-top: 6px; border-top: 1px solid #D6D3D1; font-size: 6.8pt; color: #64748B; line-height: 1.4; text-align: justify; }
  .footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 6px 10px; background: #1A1A2E; color: white; font-size: 8pt; }

  /* Merged Asset-Type / Category / Fund allocation drill-down (REEDOS-parity) */
  .alloc-drilldown { width: 100%; border-collapse: collapse; font-size: 7.3pt; margin: 4px 0 10px 0; }
  .alloc-drilldown th { background: #0c4a6e; color: white; padding: 4px 6px; text-align: center; font-size: 6.8pt; }
  .alloc-drilldown th.grp { border-right: 2px solid white; }
  .alloc-drilldown td { padding: 3px 6px; border: 1px solid #D6D3D1; vertical-align: middle; font-size: 7.2pt; }
  .alloc-drilldown td.amt { text-align: right; white-space: nowrap; }
  .alloc-drilldown td.change-pos { color: #16A34A; font-weight: 700; }
  .alloc-drilldown td.change-neg { color: #B45309; font-weight: 700; }
  .alloc-drilldown td.change-zero { color: #94A3B8; }
  .alloc-drilldown tr:nth-child(even) td { background: #F8FAFC; }
  .alloc-drilldown td.grp-cell { font-weight: 700; background: #EFF6FF !important; border-right: 2px solid #0c4a6e; }

  /* Backtest overlay — current vs suggested portfolio, NAV-indexed */
  .backtest-summary { display: flex; gap: 10px; margin: 4px 0 8px 0; }
  .backtest-tile { flex: 1; border: 1px solid #D6D3D1; border-radius: 4px; padding: 6px 10px; text-align: center; }
  .backtest-tile .lbl { font-size: 6.8pt; font-weight: 700; letter-spacing: 0.3px; }
  .backtest-tile .val { font-size: 13pt; font-weight: 700; margin-top: 2px; }
  .backtest-tile.cur .lbl { color: #E0115F; } .backtest-tile.cur .val { color: #E0115F; }
  .backtest-tile.sug .lbl { color: #0D9488; } .backtest-tile.sug .val { color: #0D9488; }
`;

/** Merged Asset Type → Category → Fund drill-down: Existing vs New vs Change (REEDOS "Scheme-Level Comparison" parity). */
function renderAllocationDrilldown(data: ReportData): string {
  const ac = data.allocationComparison;
  if (!ac.rows.length) return '';

  const changeClass = (n: number) => (n > 0 ? 'change-pos' : n < 0 ? 'change-neg' : 'change-zero');
  const fmt = (n: number) => formatInrFull(n);

  const bodyRows: string[] = [];
  for (const at of ac.rows) {
    const atFundCount = at.categories.reduce((s, c) => s + Math.max(1, c.funds.length), 0);
    let atFirst = true;
    for (const cat of at.categories) {
      const catFundCount = Math.max(1, cat.funds.length);
      let catFirst = true;
      for (const f of cat.funds) {
        bodyRows.push(`<tr>
          ${atFirst ? `<td class="grp-cell" rowspan="${atFundCount}">${escapeHtml(at.assetType)}</td>` : ''}
          ${atFirst ? `<td class="amt" rowspan="${atFundCount}">${fmt(at.existingInr)}</td>` : ''}
          ${atFirst ? `<td class="amt" rowspan="${atFundCount}">${fmt(at.newInr)}</td>` : ''}
          ${atFirst ? `<td class="amt ${changeClass(at.changeInr)}" rowspan="${atFundCount}">${at.changeInr >= 0 ? '+' : ''}${fmt(at.changeInr)}</td>` : ''}
          ${catFirst ? `<td rowspan="${catFundCount}">${escapeHtml(cat.category)}</td>` : ''}
          ${catFirst ? `<td class="amt" rowspan="${catFundCount}">${fmt(cat.existingInr)}</td>` : ''}
          ${catFirst ? `<td class="amt" rowspan="${catFundCount}">${fmt(cat.newInr)}</td>` : ''}
          ${catFirst ? `<td class="amt ${changeClass(cat.changeInr)}" rowspan="${catFundCount}">${cat.changeInr >= 0 ? '+' : ''}${fmt(cat.changeInr)}</td>` : ''}
          <td>${escapeHtml(f.fundName)}</td>
          <td class="amt">${fmt(f.existingInr)}</td>
          <td class="amt">${fmt(f.newInr)}</td>
          <td class="amt ${changeClass(f.changeInr)}">${f.changeInr >= 0 ? '+' : ''}${fmt(f.changeInr)}</td>
        </tr>`);
        atFirst = false;
        catFirst = false;
      }
    }
  }

  return `
<h2>1b · Allocation Drill-Down — Asset Type → Category → Fund</h2>
<table class="alloc-drilldown">
  <thead>
    <tr>
      <th class="grp" colspan="4">Asset Type</th>
      <th class="grp" colspan="4">Category</th>
      <th colspan="4">Fund</th>
    </tr>
    <tr>
      <th class="grp">Name</th><th>Existing</th><th>New</th><th class="grp">Change</th>
      <th class="grp">Name</th><th>Existing</th><th>New</th><th class="grp">Change</th>
      <th>Name</th><th>Existing</th><th>New</th><th>Change</th>
    </tr>
  </thead>
  <tbody>${bodyRows.join('')}</tbody>
</table>
`;
}

/** Back-tested performance overlay — current vs suggested portfolio (REEDOS parity). */
function renderBacktestSection(data: ReportData): string {
  const bt = data.backtestOverlay;
  if (!bt) return '';
  return `
<h2>1c · Back-Tested Performance — Current vs Suggested</h2>
<div style="font-size:7.5pt; color:#64748B; margin-bottom:4px;">
  Historical simulation, ${new Date(bt.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} to ${new Date(bt.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} —
  both baskets indexed to 100 at the start. Assumes static weights held throughout (no trade timing or costs modelled);
  covers ${bt.currentCoveragePct}% of the current book and ${bt.suggestedCoveragePct}% of the suggested book by value.
</div>
${renderBacktestSvg(bt)}
<div class="backtest-summary">
  <div class="backtest-tile cur">
    <div class="lbl">CURRENT PORTFOLIO</div>
    <div class="val">${bt.currentTotalReturnPct >= 0 ? '+' : ''}${bt.currentTotalReturnPct}%</div>
  </div>
  <div class="backtest-tile sug">
    <div class="lbl">SUGGESTED PORTFOLIO</div>
    <div class="val">${bt.suggestedTotalReturnPct >= 0 ? '+' : ''}${bt.suggestedTotalReturnPct}%</div>
  </div>
</div>
`;
}

export function renderInvestmentProposalHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const fp = data.forwardPlan;

  // ── Forward SIP math ──────────────────────────────────────────────
  // Assumed return: the risk model's required return when sensible (clamp 8–15%),
  // else a neutral 12% long-run equity assumption.
  const rawReq = fp.requiredReturnPct;
  const assumedReturn = rawReq != null && rawReq >= 8 && rawReq <= 15 ? rawReq : 12;
  const hasGoal = fp.targetCorpusInr != null && fp.targetCorpusInr > 0 && fp.yearsToGoal != null && fp.yearsToGoal > 0;
  let projectedFromCurrent = 0, gap = 0, reqSip = 0, months = 0;
  if (hasGoal) {
    months = fp.yearsToGoal! * 12;
    projectedFromCurrent = data.currentValueInr * Math.pow(1 + assumedReturn / 100, fp.yearsToGoal!);
    gap = Math.max(0, fp.targetCorpusInr! - projectedFromCurrent);
    reqSip = requiredMonthlySip(gap, months, assumedReturn);
  }
  const sipDelta = reqSip - fp.monthlySipInr;
  const onTrack = hasGoal && gap <= 0;

  // ── Allocation bars ───────────────────────────────────────────────
  const tgt = fp.targetEquityPct;
  const cur = fp.effectiveEquityPct;
  const allocGap = tgt != null ? Math.round((cur - tgt) * 10) / 10 : null;
  const allocVerb = allocGap == null ? '' : allocGap > 5 ? 'over-exposed to equity' : allocGap < -5 ? 'under-exposed to equity' : 'well-aligned';
  const allocClass = allocGap != null && Math.abs(allocGap) <= 5 ? 'ok' : '';

  // ── The moves: consolidated EXIT/SWITCH (sell → buy) ──────────────
  const moves = [...data.swapHoldings, ...data.liquidateHoldings];
  const actionBadge = (h: (typeof moves)[number]): string => {
    const a = h.v2Action ?? '';
    if (a.startsWith('SWITCH')) return `<span class="act-badge switch">SWITCH</span>`;
    if (a.startsWith('EXIT') || h.verdict === 'LIQUIDATE') return `<span class="act-badge exit">EXIT</span>`;
    return `<span class="act-badge exit">${escapeHtml(h.v2ActionLabel ?? h.verdict)}</span>`;
  };
  const replacementCell = (h: (typeof moves)[number]): string => {
    if (h.verdict === 'LIQUIDATE' && !h.preferredReplacementFundName) return '<em>Redeem to goal / debt</em>';
    const name = h.preferredReplacementFundName ?? 'Per preferred list';
    const onList = h.buyListReplacementFundName != null;
    return `${escapeHtml(name)}${onList ? `<span class="buylist-tag">★ Buy-List</span>` : ''}`;
  };

  const tax = data.taxSummary;
  const hasTax = !!tax && tax.exitCount > 0 && tax.estTotalTaxInr > 0;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — Investment Proposal</title><style>${STYLES}</style></head>
<body><div class="container">${riskNotCapturedBanner(data)}
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>🎯 Investment Proposal — ${escapeHtml(data.familyName)}</span>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>` : ''}

<div class="header">
  <div>
    <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
    <div class="sub">AMFI Registered MFD | ARN-286886 | www.trustner.in</div>
  </div>
  <div class="header-right">
    <div class="label">INVESTMENT PROPOSAL</div>
    <div>${escapeHtml(data.reportDate)}</div>
    <div>Doc: ${escapeHtml(data.documentId)}</div>
  </div>
</div>

<div class="doc-title">
  Forward Plan — From Today to Your Goal
  <div class="for-line">For: ${escapeHtml(data.familyName)} · ${data.numHoldings} holdings · ${data.numEntities} entities</div>
</div>

<div class="kpi-grid">
  <div class="kpi-tile">
    <div class="lbl">CURRENT CORPUS</div>
    <div class="val">${formatInrShort(data.currentValueInr)}</div>
    <div class="sub-val">Across all PANs</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">GOAL CORPUS</div>
    <div class="val">${hasGoal ? formatInrShort(fp.targetCorpusInr!) : '—'}</div>
    <div class="sub-val">${hasGoal ? `in ${fp.yearsToGoal} year${fp.yearsToGoal !== 1 ? 's' : ''}` : 'goal not set'}</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">CURRENT MONTHLY SIP</div>
    <div class="val">${fp.monthlySipInr > 0 ? formatInrShort(fp.monthlySipInr) : '₹0'}</div>
    <div class="sub-val">Across active SIPs</div>
  </div>
  <div class="kpi-tile">
    <div class="lbl">EQUITY EXPOSURE</div>
    <div class="val">${cur.toFixed(0)}%</div>
    <div class="sub-val">${tgt != null ? `target ${tgt.toFixed(0)}%` : 'target not set'}</div>
  </div>
</div>

<h2>1 · Where You Are vs Where You Should Be</h2>
<div class="alloc-row">
  <div class="alloc-label">Equity today</div>
  <div class="bar-track"><div class="bar-fill cur" style="width:${Math.min(100, cur)}%;"></div></div>
  <div class="alloc-val">${cur.toFixed(0)}%</div>
</div>
${tgt != null ? `<div class="alloc-row">
  <div class="alloc-label">Target equity</div>
  <div class="bar-track"><div class="bar-fill tgt" style="width:${Math.min(100, tgt)}%;"></div></div>
  <div class="alloc-val">${tgt.toFixed(0)}%</div>
</div>` : ''}
<div style="font-size:8pt; color:#64748B; margin:4px 0;">
  Composition today: <strong>${fp.currentEquityPct.toFixed(0)}%</strong> pure equity ·
  <strong>${fp.currentHybridPct.toFixed(0)}%</strong> hybrid ·
  <strong>${fp.currentDebtOtherPct.toFixed(0)}%</strong> debt / other.
  Equity-today figure applies a ~60% look-through on the hybrid sleeve.
</div>
${tgt != null ? `<div class="gap-note ${allocClass}">
  Your portfolio is <strong>${allocVerb}</strong>${allocGap !== 0 ? ` (${allocGap! > 0 ? '+' : ''}${allocGap}% vs target)` : ''}.
  ${allocGap! > 5 ? 'Trimming equity into the targeted mix lowers downside in a correction.' : allocGap! < -5 ? 'Stepping up equity (via the SIP plan below) closes the gap toward your return need.' : 'No major rebalancing of asset-mix needed — focus on the fund-level moves below.'}
</div>` : `<div class="gap-note">Capture the client's target equity % in the risk profile to show the alignment gap here.</div>`}

${renderAllocationDrilldown(data)}
${renderBacktestSection(data)}

<h2>2 · The Moves — What Changes</h2>
${
  moves.length > 0
    ? `<table class="action-table">
        <thead><tr>
          <th style="width:24px;">#</th>
          <th>PAN / Entity</th>
          <th style="width:48px;">Action</th>
          <th>Exit / Trim</th>
          <th>Redeploy Into</th>
          <th class="amt" style="text-align:right;">Amount</th>
        </tr></thead>
        <tbody>
          ${moves
            .map(
              (h, i) => `<tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(h.entityName)}</td>
                <td>${actionBadge(h)}</td>
                <td>${escapeHtml(h.fundName)}</td>
                <td>${replacementCell(h)}</td>
                <td class="amt">${formatInrFull(h.currentValueInr)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div style="font-size:8pt; color:#64748B;">
        Total redeployment: <strong>${formatInrShort(data.totalReallocationInr)}</strong>${data.consolidationValueInr > 0 ? `, of which ${formatInrShort(data.consolidationValueInr)} consolidates overlapping funds` : ''}.
        ${hasTax ? `Estimated exit tax <strong>${formatInrShort(tax!.estTotalTaxInr)}</strong> — confirm with your CA before executing. Net proceeds after tax: <strong>${formatInrShort(data.totalReallocationInr - tax!.estTotalTaxInr)}</strong>.` : ''}
        ★ Buy-List = on the Trustner Approved Buy-List.
      </div>`
    : `<div class="gap-note ok">No fund-level switches or exits required — the holdings are sound. The plan below is purely about <strong>funding the goal</strong>.</div>`
}

<h2>3 · Funding the Goal — Your SIP Plan</h2>
${
  !hasGoal
    ? `<div class="no-goal">Set a <strong>target corpus</strong> and <strong>time horizon</strong> in the client's risk profile to generate the step-up SIP plan that reaches the goal.</div>`
    : onTrack
      ? `<div class="gap-note ok">At an assumed <strong>${assumedReturn}%</strong> p.a., your current corpus of ${formatInrShort(data.currentValueInr)} alone is projected to reach <strong>${formatInrShort(projectedFromCurrent)}</strong> in ${fp.yearsToGoal} years — already at or above the ${formatInrShort(fp.targetCorpusInr!)} goal. Continue existing SIPs; any addition builds a cushion.</div>`
      : `<div class="sip-grid">
          <div class="sip-card">
            <div class="sip-lbl">CURRENT CORPUS GROWS TO</div>
            <div class="sip-val" style="font-size:16pt;">${formatInrShort(projectedFromCurrent)}</div>
            <div class="sip-sub">at ${assumedReturn}% p.a. over ${fp.yearsToGoal} yr · gap to goal ${formatInrShort(gap)}</div>
          </div>
          <div class="sip-card hero">
            <div class="sip-lbl">SIP NEEDED TO CLOSE THE GAP</div>
            <div class="sip-val">${formatInrFull(Math.round(reqSip / 500) * 500)}/mo</div>
            <div class="sip-sub">${fp.monthlySipInr > 0 ? (sipDelta > 0 ? `step up by ${formatInrShort(sipDelta)} from today's ${formatInrShort(fp.monthlySipInr)}` : `current ${formatInrShort(fp.monthlySipInr)} already covers this`) : 'fresh SIP to start'}</div>
          </div>
        </div>
        <ul class="sip-steps">
          <li>Goal: <strong>${formatInrShort(fp.targetCorpusInr!)}</strong> in <strong>${fp.yearsToGoal} years</strong> at an assumed <strong>${assumedReturn}% p.a.</strong>${rawReq != null && (rawReq < 8 || rawReq > 15) ? ' (neutral assumption — risk-model required return out of band)' : ''}.</li>
          <li>Current ${formatInrShort(data.currentValueInr)} compounds to ${formatInrShort(projectedFromCurrent)}; a monthly SIP of <strong>${formatInrFull(Math.round(reqSip / 500) * 500)}</strong> funds the remaining ${formatInrShort(gap)}.</li>
          <li>Consider a <strong>10% annual step-up</strong> — it starts lower and tracks income growth, reaching the same goal with a lighter early outlay.</li>
        </ul>`
}
${hasGoal && data.monteCarlo ? `
<div style="background:#F0FDF4; border:1.4px solid #BBF7D0; border-left:5px solid #16A34A; border-radius:6px; padding:10px 13px; margin:8px 0;">
  <div style="font-weight:800; color:#047857; font-size:10pt;">🎲 ${data.monteCarlo.pSuccess.toFixed(0)}% probability of reaching ${formatInrShort(fp.targetCorpusInr!)} in ${fp.yearsToGoal} years</div>
  <div style="font-size:8.4pt; color:#334155; margin-top:4px;">
    On the current ₹${Math.round(fp.monthlySipInr).toLocaleString('en-IN')}/month SIP — 10,000 simulated market paths at ${data.monteCarlo.assumedReturnPct.toFixed(0)}% expected return, ${data.monteCarlo.assumedVolPct.toFixed(0)}% volatility.
    Outcomes range ${formatInrShort(data.monteCarlo.p10Inr)} (weak) · ${formatInrShort(data.monteCarlo.p50Inr)} (median) · ${formatInrShort(data.monteCarlo.p90Inr)} (strong).
    ${data.monteCarlo.requiredSipFor90Inr != null ? `<strong>For ~90% confidence, step up to ₹${data.monteCarlo.requiredSipFor90Inr.toLocaleString('en-IN')}/month.</strong>` : data.monteCarlo.pSuccess >= 90 ? '<strong>Already at ≥90% confidence on the current path.</strong>' : ''}
  </div>
</div>` : ''}

<div class="footer-row">
  <div>Prepared by: ${escapeHtml(data.rmName)}</div>
  <div>Document: ${escapeHtml(data.documentId)} · ${escapeHtml(data.reportDate)}</div>
</div>

<div class="compliance">
  Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI registered Mutual Fund
  distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886. Past performance is
  not indicative of future returns. The corpus projection and required SIP are illustrative
  calculations based on an assumed constant rate of return (${hasGoal ? `${assumedReturn}% p.a.` : 'n/a'}); actual returns
  will vary and are not guaranteed. These projections do not constitute investment advice as defined
  under the SEBI (Investment Advisers) Regulations, 2013. Tax estimates are indicative — confirm with
  your Chartered Accountant. Final investment decisions rest with each PAN holder.
</div>
</div></body></html>`;
}
