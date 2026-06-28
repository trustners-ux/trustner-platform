/**
 * Client Review Deck — landscape, presentation-style Portfolio Review.
 *
 * The primary CLIENT-facing deliverable: easy to read in a meeting or on
 * WhatsApp. Modelled on the clean "deck" layout clients understand at a
 * glance, but powered entirely by the Trustner v2 engine and carrying our
 * STAR / KEEP / WATCH intelligence.
 *
 * Flow (one landscape A4 page each, mostly):
 *   1. Cover
 *   2. Snapshot + the GAP + what we recommend
 *   3. Current portfolio — per entity, with 1Y/3Y/5Y scheme returns,
 *      a colour action chip and a SHORT remark (long "why" → annexure)
 *   4. Allocation now → proposed  +  Reconstruction plan (sell → buy)
 *   5. Proposed portfolio
 *   6. Annexure — the detailed "why redeem / why stay" notes + disclaimer
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  ReportHolding,
  formatInrShort,
  formatPct,
  riskNotCapturedBanner,
} from '../report-data';
import { BRAND } from './_shared-styles';
import { LOGO_BASE64 } from '@/lib/constants/logo-base64';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pctClass(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'r-neu';
  if (p > 0) return 'r-pos';
  if (p < 0) return 'r-neg';
  return 'r-neu';
}

function retCell(p: number | null | undefined): string {
  if (p === null || p === undefined) return `<td class="num r-neu">—</td>`;
  return `<td class="num ${pctClass(p)}">${p >= 0 ? '' : ''}${p.toFixed(1)}%</td>`;
}

/** Coarse asset class for the allocation roll-up (mirrors report-data.assetClassOf). */
function assetBucket(category: string | null): 'Equity' | 'Hybrid' | 'Debt' {
  const c = (category || '').toLowerCase();
  if (/aggressive hybrid|balanced advantage|dynamic asset|multi[\s-]*asset|equity savings|conservative hybrid|hybrid/.test(c)) return 'Hybrid';
  if (/debt|liquid|gilt|arbitrage|duration|bond|money market|overnight|psu|credit/.test(c)) return 'Debt';
  return 'Equity';
}

/** Plain-English action chip per verdict. */
function actionChip(v: ReportHolding['verdict']): string {
  const m: Record<string, [string, string]> = {
    STAR: ['<i class="ti" style="font-style:normal;">★</i> Continue', 'c-star'],
    KEEP: ['Continue', 'c-keep'],
    WATCH: ['Review', 'c-watch'],
    SWAP: ['Switch', 'c-swap'],
    LIQUIDATE: ['Redeem', 'c-liq'],
  };
  const [label, cls] = m[v] ?? ['Review', 'c-watch'];
  return `<span class="chip ${cls}">${label}</span>`;
}

/** Short ≤8-word remark for the table cell (the long version lives in the annexure). */
function shortRemark(h: ReportHolding): string {
  const repl = h.buyListReplacementFundName ?? h.preferredReplacementFundName;
  switch (h.verdict) {
    case 'STAR': return h.onBuyList ? 'Top-rated, on our buy-list — keep adding' : 'Top-rated — keep and add';
    case 'KEEP': return 'Solid core holding — continue';
    case 'WATCH': return 'On watch — hold, no fresh money';
    case 'SWAP': return repl ? `Lagging — switch to ${escapeHtml(repl)}` : 'Lagging peers — switch to a stronger fund';
    case 'LIQUIDATE': return repl ? `Exit — redeploy into ${escapeHtml(repl)}` : 'Exit — redeem and redeploy';
    default: return '';
  }
}

const fmtInr = (n: number): string => formatInrShort(n);

export function renderClientDeckHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;

  const all: ReportHolding[] = [
    ...data.starHoldings, ...data.keepHoldings, ...data.watchHoldings,
    ...data.swapHoldings, ...data.liquidateHoldings,
  ];
  const total = data.currentValueInr || all.reduce((s, h) => s + h.currentValueInr, 0) || 1;
  const wt = (v: number): string => `${((v / total) * 100).toFixed(0)}%`;

  // ── Annexure notes — only for holdings that need a "why" (the changes & watches) ──
  const noteHoldings = all.filter((h) => h.verdict !== 'KEEP' && (h.rationale || '').trim().length > 0);
  const noteNo = new Map<number, number>();
  noteHoldings.forEach((h, i) => noteNo.set(h.id, i + 1));

  // ── Reconstruction: consolidations + switches/exits → buys ──
  const consolidateAway = new Set<string>();
  const keepBoost = new Map<string, number>();
  for (const g of data.consolidationGroups) {
    for (const c of g.consolidate) { consolidateAway.add(c.fundName); keepBoost.set(g.keep.fundName, (keepBoost.get(g.keep.fundName) ?? 0) + c.currentValueInr); }
  }

  // ── Proposed book (deterministic from the actions) ──
  let reinvestPool = 0;
  const proposed: { entity: string; fund: string; category: string | null; value: number; note?: string }[] = [];
  for (const h of all) {
    if (consolidateAway.has(h.fundName)) continue;               // folded into its keep
    const repl = h.buyListReplacementFundName ?? h.preferredReplacementFundName ?? null;
    // Include any value folded INTO this fund by a consolidation (keepBoost) in
    // EVERY branch — otherwise a fund that is both a consolidation "keep" AND a
    // switch/exit would silently drop the folded-in rupees (capital must be preserved).
    const value = h.currentValueInr + (keepBoost.get(h.fundName) ?? 0);
    if (h.verdict === 'LIQUIDATE') {
      if (repl) proposed.push({ entity: h.entityName, fund: repl, category: h.category, value, note: 'replaces ' + h.fundName });
      else reinvestPool += value;
      continue;
    }
    if (h.verdict === 'SWAP' && repl) {
      proposed.push({ entity: h.entityName, fund: repl, category: h.category, value, note: 'switched from ' + h.fundName });
      continue;
    }
    proposed.push({ entity: h.entityName, fund: h.fundName, category: h.category, value });
  }
  if (reinvestPool > 0) proposed.push({ entity: '—', fund: 'Reinvest as per Approved Buy-List', category: null, value: reinvestPool });
  proposed.sort((a, b) => b.value - a.value);
  const proposedFundCount = new Set(proposed.filter((p) => !/Reinvest as per/.test(p.fund)).map((p) => p.fund)).size;

  // ── Allocation now → proposed (asset class) ──
  const bucketNow: Record<string, number> = { Equity: 0, Hybrid: 0, Debt: 0 };
  for (const h of all) bucketNow[assetBucket(h.category)] += h.currentValueInr;
  const eqNow = data.forwardPlan.effectiveEquityPct;
  // Only show the proposed equity target when a REAL risk profile was captured —
  // otherwise the target is the engine's generic default and would mislead.
  const eqTarget = data.riskProfileCaptured ? data.forwardPlan.targetEquityPct : null;

  // ── Per-entity current-portfolio rows ──
  const entities = data.entitiesCovered.length ? data.entitiesCovered : Array.from(new Set(all.map((h) => h.entityName)));
  const rowFor = (h: ReportHolding): string => {
    const n = noteNo.get(h.id);
    const gainPct = h.investedInr > 0 ? (h.unrealisedGainInr / h.investedInr) * 100 : null;
    return `<tr>
      <td class="fund">${escapeHtml(h.fundName)}${h.onBuyList ? ' <span class="star">★</span>' : ''}</td>
      <td class="cat">${escapeHtml(h.category ?? '—')}</td>
      <td class="num amt">${fmtInr(h.currentValueInr)}</td>
      <td class="num">${wt(h.currentValueInr)}</td>
      <td class="num ${pctClass(gainPct)}">${gainPct === null ? '—' : (gainPct >= 0 ? '+' : '') + gainPct.toFixed(0) + '%'}</td>
      ${retCell(h.fundRet1yPct)}${retCell(h.fundRet3yPct)}${retCell(h.fundRet5yPct)}
      <td class="act">${actionChip(h.verdict)}<div class="rmk">${shortRemark(h)}${n ? ` <sup class="ref">[${n}]</sup>` : ''}</div></td>
    </tr>`;
  };
  const entityBlocks = entities.map((e) => {
    const rows = all.filter((h) => h.entityName === e);
    if (!rows.length) return '';
    const sub = rows.reduce((s, h) => s + h.currentValueInr, 0);
    return `<tr class="grp"><td colspan="9">${escapeHtml(e)} <span class="grp-sub">· ${fmtInr(sub)} · ${wt(sub)} of family</span></td></tr>` +
      rows.map(rowFor).join('');
  }).join('');

  // ── Reconstruction plan rows ──
  const reconRows: string[] = [];
  for (const g of data.consolidationGroups) {
    reconRows.push(`<tr><td class="sell">Consolidate ${g.consolidate.length} ${escapeHtml(g.subCategory)} funds<div class="sub">${g.consolidate.map((c) => escapeHtml(c.fundName)).join(', ')}</div></td>
      <td class="num">${fmtInr(g.totalConsolidatableInr)}</td>
      <td class="buy">→ add to ${escapeHtml(g.keep.fundName)}<div class="sub">one strong fund per category</div></td></tr>`);
  }
  for (const h of [...data.swapHoldings, ...data.liquidateHoldings]) {
    const repl = h.buyListReplacementFundName ?? h.preferredReplacementFundName ?? 'Approved Buy-List fund';
    reconRows.push(`<tr><td class="sell">${h.verdict === 'LIQUIDATE' ? 'Redeem' : 'Switch'} ${escapeHtml(h.fundName)}<div class="sub">${escapeHtml(h.category ?? '')}</div></td>
      <td class="num">${fmtInr(h.currentValueInr)}</td>
      <td class="buy">→ ${escapeHtml(repl)}</td></tr>`);
  }

  // ── Annexure ──
  const annexure = noteHoldings.map((h) => {
    const n = noteNo.get(h.id);
    return `<div class="note"><span class="note-n">${n}</span><div><div class="note-h">${escapeHtml(h.fundName)} — ${actionChip(h.verdict)}</div><div class="note-b">${escapeHtml(h.rationale ?? '')}</div></div></div>`;
  }).join('');

  const taxNote = data.taxSummary && data.taxSummary.exitCount > 0
    ? `<div class="tax"><i class="ti ti-receipt-2" aria-hidden="true" style="font-style:normal;"></i> Tax note: ${escapeHtml(data.taxSummary.headline)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(data.familyName)} — Portfolio Review</title><style>${STYLES}</style></head>
<body>${riskNotCapturedBanner(data)}
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>Portfolio Review — ${escapeHtml(data.familyName)}</span>
  <span style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:8pt;opacity:0.85;">Tip: in the print dialog choose <strong>Landscape</strong> and untick “Headers and footers”.</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </span>
</div>` : ''}

<section class="page cover">
  <div class="cover-left">
    <div class="cover-kicker">PORTFOLIO REVIEW &amp; ACTION PLAN</div>
    <div class="cover-name">${escapeHtml(data.familyName)}</div>
    <div class="cover-meta">${escapeHtml(data.reportDate)}</div>
  </div>
  <div class="cover-right">
    <img src="${LOGO_BASE64}" alt="Trustner" class="cover-logo"/>
    <div class="cover-firm">TRUSTNER ASSET SERVICES</div>
    <div class="cover-sub">AMFI Registered Mutual Fund Distributor · ARN-286886</div>
    <div class="cover-tag">Creating confident, goal-led investors</div>
  </div>
</section>

<section class="page">
  ${head('Snapshot &amp; what we recommend')}
  <div class="kpis">
    <div class="kpi"><div class="k-l">Family value</div><div class="k-v">${fmtInr(data.currentValueInr)}</div></div>
    <div class="kpi"><div class="k-l">Invested</div><div class="k-v">${fmtInr(data.totalInvestedInr)}</div></div>
    <div class="kpi"><div class="k-l">Gain</div><div class="k-v ${data.totalGainInr >= 0 ? 'r-pos' : 'r-neg'}">${data.totalGainInr >= 0 ? '+' : ''}${fmtInr(data.totalGainInr)}</div></div>
    <div class="kpi"><div class="k-l">Family XIRR</div><div class="k-v">${formatPct(data.familyXirrPct, 1)}</div></div>
    <div class="kpi gold"><div class="k-l">Funds</div><div class="k-v">${all.length} → ${proposedFundCount}</div></div>
  </div>
  ${data.riskGap ? `<div class="gap ${data.riskGap.hasGap ? 'gap-on' : 'gap-ok'}">
    ${data.riskGap.hasGap
      ? `<strong>The gap:</strong> your comfort is <u>${escapeHtml(data.riskGap.toleratedTier)}</u> risk, but the portfolio currently carries <u>${escapeHtml(data.riskGap.carriedTier)}</u> risk — ${data.riskGap.pctAboveCeiling}% of the equity book sits above your comfort line. The actions below close that gap.`
      : `<strong>Risk aligned:</strong> the portfolio carries ${escapeHtml(data.riskGap.carriedTier)} risk, within your ${escapeHtml(data.riskGap.toleratedTier)} comfort level.`}
  </div>` : ''}
  <div class="verdict-strip">
    ${chipStat('★ Continue', 'c-star', data.tierTotals.star.count + data.tierTotals.keep.count, data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio)}
    ${chipStat('Review', 'c-watch', data.tierTotals.watch.count, data.tierTotals.watch.pctOfPortfolio)}
    ${chipStat('Switch', 'c-swap', data.tierTotals.swap.count, data.tierTotals.swap.pctOfPortfolio)}
    ${chipStat('Redeem', 'c-liq', data.tierTotals.liquidate.count, data.tierTotals.liquidate.pctOfPortfolio)}
  </div>
  ${taxNote}
  <div class="legend">★ = on the Trustner Approved Buy-List · 1Y / 3Y / 5Y are the scheme’s returns (how the fund performed), shown next to your own gain.</div>
</section>

<section class="page">
  ${head('Current portfolio — with our view')}
  <table class="deck">
    <thead><tr>
      <th style="width:26%">Scheme</th><th style="width:13%">Category</th>
      <th class="num" style="width:11%">Value</th><th class="num" style="width:6%">Wt</th>
      <th class="num" style="width:8%">Your gain</th>
      <th class="num" style="width:7%">1Y</th><th class="num" style="width:7%">3Y</th><th class="num" style="width:7%">5Y</th>
      <th style="width:21%">Our view</th>
    </tr></thead>
    <tbody>
      ${entityBlocks}
      <tr class="tot"><td>Grand total</td><td></td><td class="num amt">${fmtInr(total)}</td><td class="num">100%</td><td colspan="5"></td></tr>
    </tbody>
  </table>
  <div class="legend">Returns are the scheme’s trailing CAGR (source: AMFI/AMC, as on ${escapeHtml(data.reportDate)}). Past performance does not guarantee future returns.</div>
</section>

<section class="page">
  ${head('What changes — allocation &amp; the plan')}
  <div class="two-col">
    <div>
      <div class="sub-h">Equity exposure: now → proposed</div>
      ${allocBar('Equity (incl. hybrid look-through)', eqNow, eqTarget)}
      ${allocBar('Equity', (bucketNow.Equity / total) * 100, null)}
      ${allocBar('Hybrid', (bucketNow.Hybrid / total) * 100, null)}
      ${allocBar('Debt / other', (bucketNow.Debt / total) * 100, null)}
      <div class="legend">${eqTarget != null ? `Target equity ${eqTarget}% comes from your risk profile &amp; goal horizon.` : 'Target equity will be set once your risk profile is captured.'}</div>
    </div>
    <div>
      <div class="sub-h">Reconstruction plan — sell → buy</div>
      ${reconRows.length ? `<table class="recon"><thead><tr><th>Action</th><th class="num">Amount</th><th>Redeploy into</th></tr></thead><tbody>${reconRows.join('')}</tbody></table>` : `<div class="none">No switches or exits needed — the book is well-aligned. Continue all holdings.</div>`}
      ${taxNote}
    </div>
  </div>
</section>

${proposed.length ? `<section class="page">
  ${head('Proposed portfolio')}
  <table class="deck">
    <thead><tr><th style="width:46%">Scheme</th><th style="width:20%">Category</th><th class="num" style="width:16%">Value</th><th class="num" style="width:8%">Wt</th><th style="width:10%"></th></tr></thead>
    <tbody>
      ${proposed.map((p) => `<tr><td class="fund">${escapeHtml(p.fund)}${p.note ? ` <span class="pnote">(${escapeHtml(p.note)})</span>` : ''}</td><td class="cat">${escapeHtml(p.category ?? '—')}</td><td class="num amt">${fmtInr(p.value)}</td><td class="num">${wt(p.value)}</td><td></td></tr>`).join('')}
      <tr class="tot"><td>Grand total</td><td></td><td class="num amt">${fmtInr(proposed.reduce((s, p) => s + p.value, 0))}</td><td class="num">100%</td><td></td></tr>
    </tbody>
  </table>
  <div class="legend">Proposed values keep your invested capital intact — switches and consolidations move money between funds, not out of the market.</div>
</section>` : ''}

${annexure ? `<section class="page">
  ${head('Annexure — the detailed “why”')}
  <div class="notes">${annexure}</div>
</section>` : ''}

<section class="page closing">
  <div class="thanks">Thank you</div>
  <div class="disc">This document is prepared for ${escapeHtml(data.familyName)} for private circulation and discussion with your Trustner Relationship Manager. Trustner Asset Services Pvt. Ltd. is an AMFI-registered Mutual Fund Distributor (ARN-286886) and earns distribution commission on Regular plans; it is not a SEBI Registered Investment Adviser and this is not investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013. Verdicts (STAR / KEEP / WATCH / Switch / Redeem) and the proposed plan reflect our analytical and distribution view based on each fund’s track record, manager quality, category positioning, AUM capacity, cost and category-benchmark data. Mutual fund investments are subject to market risks; read all scheme-related documents carefully. Past performance is not indicative of future returns. Tax estimates are indicative — confirm the final liability with your Chartered Accountant.</div>
  <div class="closing-firm">TRUSTNER ASSET SERVICES PVT. LTD. · ARN-286886 · www.trustner.in</div>
</section>

</body></html>`;
}

function head(title: string): string {
  return `<div class="head"><div class="head-t">${title}</div><img src="${LOGO_BASE64}" class="head-logo" alt="Trustner"/></div>`;
}

function chipStat(label: string, cls: string, count: number, pct: number): string {
  return `<div class="vstat"><span class="chip ${cls}">${label}</span><div class="vstat-n">${count} fund${count === 1 ? '' : 's'}</div><div class="vstat-p">${pct.toFixed(0)}% of value</div></div>`;
}

function allocBar(label: string, now: number, target: number | null): string {
  const n = Math.max(0, Math.min(100, now));
  const t = target == null ? null : Math.max(0, Math.min(100, target));
  return `<div class="ab">
    <div class="ab-l">${label}</div>
    <div class="ab-track"><div class="ab-now" style="width:${n.toFixed(0)}%"></div></div>
    <div class="ab-v">${n.toFixed(0)}%</div>
    ${t == null ? '<div class="ab-arrow"></div><div class="ab-track ghost"></div><div class="ab-v"></div>'
      : `<div class="ab-arrow"><i class="ti ti-arrow-right" aria-hidden="true"></i></div><div class="ab-track"><div class="ab-prop" style="width:${t.toFixed(0)}%"></div></div><div class="ab-v gold">${t.toFixed(0)}%</div>`}
  </div>`;
}

const STYLES = `
  @page { size: A4 landscape; margin: 0; }
  @media print { .no-print { display:none !important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#fff; } .page { page-break-after: always; } .page:last-child { page-break-after: auto; } }
  * { box-sizing: border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#1A1A2E; margin:0; background:#e2e8f0; font-size:10pt; }
  .no-print-bar { position:sticky; top:0; background:${BRAND.navy}; color:#fff; padding:8px 16px; display:flex; justify-content:space-between; align-items:center; font-size:10pt; z-index:100; }
  .no-print-bar button { background:#fff; color:${BRAND.navy}; border:0; padding:6px 14px; border-radius:5px; font-weight:700; cursor:pointer; }
  .page { position:relative; width:297mm; background:#fff; margin:10px auto; padding:13mm 15mm; box-shadow:0 4px 20px rgba(15,23,42,.12); }
  .cover, .closing { min-height:200mm; }
  @media print { .page { margin:0; box-shadow:none; width:auto; } }

  .head { display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid ${BRAND.navy}; padding-bottom:7px; margin-bottom:12px; }
  .head-t { font-size:16pt; font-weight:800; color:${BRAND.navy}; }
  .head-logo { height:26px; }

  .cover { background:${BRAND.navy}; color:#fff; display:flex; justify-content:space-between; align-items:flex-end; padding:24mm 20mm; }
  .cover-kicker { font-size:11pt; letter-spacing:3px; color:#cfe3f1; }
  .cover-name { font-size:34pt; font-weight:800; margin-top:8px; line-height:1.05; }
  .cover-meta { font-size:12pt; color:#cfe3f1; margin-top:10px; }
  .cover-right { text-align:right; }
  .cover-logo { height:46px; filter:brightness(0) invert(1); margin-bottom:8px; }
  .cover-firm { font-size:14pt; font-weight:800; letter-spacing:1px; }
  .cover-sub { font-size:9pt; color:#cfe3f1; margin-top:3px; }
  .cover-tag { font-size:10pt; color:#e8c887; margin-top:14px; font-style:italic; }

  .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:12px; }
  .kpi { background:#f1f5f9; border-radius:8px; padding:11px 14px; }
  .kpi.gold { background:#fef3c7; }
  .k-l { font-size:9pt; color:${BRAND.slateMute}; }
  .kpi.gold .k-l { color:#92400e; }
  .k-v { font-size:18pt; font-weight:800; color:${BRAND.navy}; margin-top:2px; }
  .kpi.gold .k-v { color:#b45309; }

  .gap { border-radius:6px; padding:10px 14px; font-size:10.5pt; line-height:1.45; margin-bottom:12px; }
  .gap-on { background:#FFF1F2; border:1.4px solid #FECDD3; border-left:5px solid ${BRAND.neg}; color:#9F1239; }
  .gap-ok { background:#F0FDF4; border:1.4px solid #BBF7D0; border-left:5px solid ${BRAND.pos}; color:#166534; }

  .verdict-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
  .vstat { border:1px solid ${BRAND.line}; border-radius:8px; padding:10px 12px; text-align:center; }
  .vstat-n { font-size:13pt; font-weight:800; color:${BRAND.navy}; margin-top:6px; }
  .vstat-p { font-size:8.5pt; color:${BRAND.slateMute}; }

  .chip { display:inline-block; padding:2px 9px; border-radius:11px; font-size:9pt; font-weight:800; line-height:1.5; }
  .c-star { background:#fef3c7; color:#b45309; }
  .c-keep { background:#dcfce7; color:#047857; }
  .c-watch { background:#fef9c3; color:#92400e; }
  .c-swap { background:#dbeafe; color:#1e40af; }
  .c-liq { background:#fee2e2; color:#b91c1c; }

  table.deck { width:100%; border-collapse:collapse; font-size:8pt; }
  table.deck thead { display:table-header-group; }
  table.deck tr { break-inside:avoid; }
  table.recon thead { display:table-header-group; }
  table.deck th { background:${BRAND.navy}; color:#fff; text-align:left; padding:5px 7px; font-weight:700; font-size:7.6pt; }
  table.deck td { padding:3.5px 7px; border-bottom:0.5px solid ${BRAND.line}; vertical-align:top; }
  table.deck tr:nth-child(even of :not(.grp):not(.tot)) td { background:#f8fafc; }
  .deck .fund { font-weight:700; color:#0f172a; }
  .deck .cat { color:${BRAND.slate}; }
  .deck .num { text-align:right; white-space:nowrap; }
  .deck .amt { font-weight:700; color:${BRAND.navy}; }
  .deck .star { color:#b45309; }
  .deck .grp td { background:${BRAND.navy}; color:#fff; font-weight:800; font-size:8.5pt; padding:5px 7px; }
  .deck .grp-sub { font-weight:400; color:#cfe3f1; font-size:8pt; }
  .deck .tot td { background:#eef4f8; font-weight:800; color:${BRAND.navy}; border-top:1.5px solid ${BRAND.navy}; }
  .act .rmk { font-size:7.2pt; color:${BRAND.slate}; margin-top:2px; line-height:1.25; }
  .ref { color:${BRAND.navy}; font-weight:800; font-size:6.5pt; }
  .r-pos { color:${BRAND.pos}; font-weight:700; } .r-neg { color:${BRAND.neg}; font-weight:700; } .r-neu { color:${BRAND.slateMute}; }

  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .sub-h { font-size:11pt; font-weight:800; color:${BRAND.navy}; border-left:3px solid #b45309; padding-left:8px; margin-bottom:10px; }
  .ab { display:flex; align-items:center; gap:8px; margin-bottom:9px; font-size:9pt; }
  .ab-l { width:130px; color:${BRAND.slate}; }
  .ab-track { flex:1; height:9px; background:#eef2f7; border-radius:5px; overflow:hidden; }
  .ab-track.ghost { background:transparent; }
  .ab-now { height:100%; background:#94a3b8; }
  .ab-prop { height:100%; background:${BRAND.navy}; }
  .ab-v { width:34px; text-align:right; font-weight:700; color:${BRAND.slate}; }
  .ab-v.gold { color:#b45309; }
  .ab-arrow { width:16px; text-align:center; color:#cbd5e1; }

  table.recon { width:100%; border-collapse:collapse; font-size:8.5pt; }
  table.recon th { background:#eef4f8; color:${BRAND.navy}; text-align:left; padding:5px 7px; font-weight:700; font-size:8pt; }
  table.recon td { padding:6px 7px; border-bottom:0.5px solid ${BRAND.line}; vertical-align:top; }
  table.recon .sell { color:${BRAND.neg}; font-weight:700; }
  table.recon .buy { color:#1e40af; font-weight:700; }
  table.recon .num { text-align:right; font-weight:700; color:${BRAND.navy}; white-space:nowrap; }
  table.recon .sub { color:${BRAND.slateMute}; font-weight:400; font-size:7.6pt; margin-top:2px; }
  .none { background:#F0FDF4; border:1px solid #BBF7D0; border-radius:6px; padding:12px; color:#166534; font-size:9.5pt; }

  .pnote { color:${BRAND.slateMute}; font-weight:400; font-size:7.8pt; font-style:italic; }
  .tax { background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; padding:8px 11px; font-size:8.8pt; color:#9a3412; margin-top:10px; }

  .notes { columns:2; column-gap:24px; }
  .note { display:flex; gap:9px; break-inside:avoid; margin-bottom:11px; }
  .note-n { flex:0 0 20px; height:20px; background:${BRAND.navy}; color:#fff; border-radius:50%; text-align:center; font-size:8.5pt; font-weight:800; line-height:20px; }
  .note-h { font-size:9pt; font-weight:800; color:#0f172a; margin-bottom:2px; }
  .note-b { font-size:8.3pt; color:${BRAND.slate}; line-height:1.4; }

  .closing { background:${BRAND.navy}; color:#fff; display:flex; flex-direction:column; justify-content:center; }
  .thanks { font-size:30pt; font-weight:800; margin-bottom:14px; }
  .disc { font-size:7.6pt; color:#cfe3f1; line-height:1.5; max-width:230mm; }
  .closing-firm { font-size:9pt; color:#e8c887; margin-top:16px; }

  .legend { font-size:7.6pt; color:${BRAND.slateMute}; margin-top:8px; line-height:1.4; }
`;
