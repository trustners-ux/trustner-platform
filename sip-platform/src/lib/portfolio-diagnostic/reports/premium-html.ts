/**
 * Premium Portfolio Review & Action Plan — HTML (= clean print-to-PDF).
 *
 * The Beriwal-grade client deliverable. A Trustner-branded, consultant-quality
 * document built from the existing ReportData (via premium-shared.ts). Doubles
 * as the on-screen preview and the print-to-PDF source — there is no browser
 * footer URL when the user prints with "Headers and footers" off (the print bar
 * says so), and the editable .docx is the guaranteed-clean alternative.
 *
 * Real data only. Every figure traces to a ReportData field; null cases render
 * a graceful note, never "undefined".
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
import { BRAND, REPORT_TABLE_CSS } from './_shared-styles';
import {
  buildPremiumModel,
  COMPLIANCE,
  PremiumModel,
  AllocSlice,
  TierBar,
  Tone,
} from './premium-shared';

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function pctClass(p: number | null | undefined): string {
  if (p == null) return 'pct-neu';
  return p > 0 ? 'pct-pos' : p < 0 ? 'pct-neg' : 'pct-neu';
}
const TONE_BG: Record<Tone, string> = { navy: '#EFF6FF', green: '#F0FDF4', amber: '#FEFCE8', rose: '#FFF1F2', slate: '#F8FAFC' };
const TONE_FG: Record<Tone, string> = { navy: BRAND.navy, green: BRAND.pos, amber: BRAND.star, rose: BRAND.neg, slate: BRAND.slate };

const LOGO = '/Trustner%20Logo-blue.png';

const STYLES = `
  @page { size: A4; margin: 13mm 16mm 14mm 16mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
    .sec, h2, h3 { page-break-after: avoid; }
    table, .kpi, .honest, .callout, .moves, .donut-wrap { page-break-inside: avoid; }
  }
  @media screen {
    html { background: #eef2f6; min-height: 100vh; }
    html body { max-width: 210mm; margin: 18px auto; padding: 13mm 16mm; box-shadow: 0 6px 30px rgba(15,23,42,0.12); border-radius: 5px; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${BRAND.ink}; line-height: 1.42; font-size: 9pt; margin: 0; background: white; }
  .container { max-width: 178mm; margin: 0 auto; }

  .no-print-bar { position: sticky; top: 0; z-index: 100; background: ${BRAND.navy}; color: white; padding: 9px 16px; margin-bottom: 9mm; display: flex; justify-content: space-between; align-items: center; gap: 14px; border-radius: 4px; }
  .no-print-bar button { background: white; color: ${BRAND.navy}; border: 0; padding: 7px 16px; font-weight: 700; border-radius: 4px; cursor: pointer; font-size: 10pt; }

  /* Letterhead */
  .letterhead { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid ${BRAND.navy}; padding-bottom: 9px; }
  .lh-left { display: flex; align-items: center; gap: 12px; }
  .lh-left img { height: 42px; width: auto; }
  .lh-firm { color: ${BRAND.navy}; font-weight: 800; font-size: 12.5pt; letter-spacing: 0.2px; line-height: 1.1; }
  .lh-sub { color: ${BRAND.slateMute}; font-size: 7pt; letter-spacing: 0.3px; margin-top: 2px; }
  .lh-right { text-align: right; font-size: 7.6pt; color: ${BRAND.slateMute}; }
  .lh-right .lbl { font-size: 8.4pt; color: ${BRAND.navy}; font-weight: 800; letter-spacing: 0.6px; }

  .doctitle { text-align: center; margin: 14px 0 12px 0; }
  .doctitle .t { font-size: 21pt; font-weight: 800; color: ${BRAND.navy}; letter-spacing: 0.2px; }
  .doctitle .for { font-size: 10pt; color: ${BRAND.slate}; margin-top: 3px; }
  .doctitle .ents { font-size: 8pt; color: ${BRAND.slateMute}; margin-top: 2px; }
  .doctitle .rule { height: 3px; width: 78px; background: ${BRAND.star}; margin: 8px auto 0 auto; border-radius: 2px; }

  /* KPI banner */
  .kpi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 14px 0 4px 0; }
  .kpi .tile { border: 1.4px solid; border-radius: 6px; padding: 9px 8px; text-align: center; }
  .kpi .tile .val { font-size: 15.5pt; font-weight: 800; line-height: 1.05; }
  .kpi .tile .lbl { font-size: 7pt; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 3px; opacity: 0.92; }
  .kpi .tile .sub { font-size: 6.6pt; color: ${BRAND.slateMute}; margin-top: 2px; }

  /* Section headers */
  .sec { display: flex; align-items: center; gap: 9px; margin: 18px 0 7px 0; padding-bottom: 4px; border-bottom: 1.6px solid ${BRAND.line}; }
  .sec .num { background: ${BRAND.navy}; color: white; width: 21px; height: 21px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 800; flex: none; }
  .sec .ttl { font-size: 12.5pt; font-weight: 800; color: ${BRAND.navy}; }
  .sec .hint { margin-left: auto; font-size: 7.6pt; color: ${BRAND.slateMute}; font-weight: 600; }
  h3.sub { font-size: 9.5pt; font-weight: 800; color: ${BRAND.navy}; margin: 10px 0 3px 0; display: flex; align-items: center; gap: 7px; }
  h3.sub .chip { font-size: 7pt; font-weight: 700; padding: 1px 7px; border-radius: 10px; color: white; }

  /* THE GAP strip — the headline band */
  .gap-strip { border-radius: 6px; padding: 10px 14px; margin: 12px 0 4px 0; font-size: 10pt; font-weight: 700; line-height: 1.4; }
  .gap-strip.gap { background: #FFF1F2; border: 1.5px solid #FECDD3; border-left: 6px solid ${BRAND.neg}; color: #9F1239; }
  .gap-strip.ok { background: #F0FDF4; border: 1.5px solid #BBF7D0; border-left: 6px solid ${BRAND.pos}; color: #166534; }

  /* Behaviour-gap callout */
  .behaviour { border-radius: 6px; padding: 8px 13px; margin: 8px 0; font-size: 8.4pt; line-height: 1.45; }
  .behaviour.losing { background: #FFFBEB; border: 1.2px solid #FDE68A; border-left: 5px solid ${BRAND.star}; color: #713F12; }
  .behaviour.winning { background: #F0FDF4; border: 1.2px solid #BBF7D0; border-left: 5px solid ${BRAND.pos}; color: #166534; }

  /* Honest View green box */
  .honest { background: #F0FDF4; border: 1.4px solid #BBF7D0; border-left: 5px solid ${BRAND.pos}; border-radius: 6px; padding: 11px 14px; margin: 12px 0; }
  .honest .lead { color: #047857; font-weight: 800; font-size: 10pt; margin-bottom: 4px; }
  .honest .body { color: #334155; font-size: 9pt; }

  /* Amber callout */
  .callout { background: #FEFCE8; border: 1.2px solid #FDE68A; border-left: 5px solid ${BRAND.star}; border-radius: 6px; padding: 9px 13px; margin: 10px 0; font-size: 8.2pt; color: #713F12; }
  .callout strong { color: ${BRAND.star}; }

  /* Bars */
  .bar-row { display: flex; align-items: center; gap: 9px; margin: 5px 0; font-size: 8.4pt; }
  .bar-row .lbl { width: 165px; font-weight: 700; color: ${BRAND.slate}; flex: none; }
  .bar-row .track { display: block; flex: 1; background: #EEF2F6; border-radius: 4px; height: 17px; overflow: hidden; }
  .bar-row .fill { display: block; height: 17px; border-radius: 4px; }
  .bar-row .amt { width: 88px; text-align: right; font-weight: 800; color: ${BRAND.navy}; flex: none; }

  /* Donut */
  .donut-wrap { display: flex; align-items: center; gap: 22px; margin: 8px 0; }
  .donut-legend { font-size: 8.6pt; }
  .donut-legend .li { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .donut-legend .sw { width: 12px; height: 12px; border-radius: 3px; flex: none; }
  .donut-legend .nm { font-weight: 700; color: ${BRAND.slate}; }
  .donut-legend .pc { margin-left: auto; font-weight: 800; color: ${BRAND.navy}; }

  /* Moves table */
  .moves { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 6px 0; }
  .moves th { background: ${BRAND.star}; color: white; padding: 5px 7px; text-align: left; font-size: 7.6pt; }
  .moves td { padding: 5px 7px; border: 1px solid ${BRAND.line}; vertical-align: top; }
  .moves tr:nth-child(even) td { background: #FFFBEB; }
  .moves .amt { text-align: right; font-weight: 800; color: ${BRAND.star}; white-space: nowrap; }
  .act-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 6.8pt; font-weight: 800; color: white; white-space: nowrap; }
  .act-exit { background: ${BRAND.neg}; } .act-switch { background: #D97706; } .act-trim { background: #B45309; } .act-redeem { background: ${BRAND.slate}; }
  .bl-star { color: ${BRAND.star}; font-weight: 800; font-size: 6.8pt; }

  ul.tight { margin: 5px 0; padding-left: 18px; } ul.tight li { margin: 3px 0; font-size: 8.6pt; }
  .note-soft { color: ${BRAND.slateMute}; font-style: italic; font-size: 8.2pt; padding: 6px 0; }

  /* SIP cards */
  .sip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin: 7px 0; }
  .sip-card { border: 1.4px solid ${BRAND.navy}; border-radius: 6px; padding: 9px 11px; text-align: center; }
  .sip-card.hero { background: ${BRAND.navy}; color: white; }
  .sip-card .v { font-size: 15pt; font-weight: 800; line-height: 1.05; }
  .sip-card .l { font-size: 7pt; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; margin-top: 3px; opacity: 0.9; }

  /* Compliance */
  .reg { margin-top: 16px; padding-top: 8px; border-top: 2px solid ${BRAND.navy}; }
  .reg .h { color: ${BRAND.slate}; font-weight: 800; font-size: 8.5pt; letter-spacing: 0.4px; margin-bottom: 4px; }
  .reg p { font-size: 6.9pt; color: ${BRAND.slateMute}; line-height: 1.5; text-align: justify; margin: 3px 0; }
  .reg .firm { text-align: center; font-weight: 800; color: ${BRAND.navy}; font-size: 8pt; margin-top: 7px; }

  ${REPORT_TABLE_CSS}
`;

/** Robust donut via stroke-dasharray rings (no arc-path math to get wrong). */
function donutSvg(slices: AllocSlice[], top: string, bot: string): string {
  const cx = 100, cy = 100, r = 66, sw = 30;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const rings = slices
    .map((s) => {
      const len = (Math.min(100, s.pct) / 100) * C;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += len;
      return seg;
    })
    .join('');
  return `<svg viewBox="0 0 200 200" width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EEF2F6" stroke-width="${sw}"/>
    ${rings}
    <text x="100" y="96" text-anchor="middle" font-size="30" font-weight="800" fill="${BRAND.neg}">${esc(top)}</text>
    <text x="100" y="116" text-anchor="middle" font-size="9" font-weight="700" fill="${BRAND.slate}">${esc(bot)}</text>
  </svg>`;
}

function tierBarsHtml(bars: TierBar[]): string {
  const max = Math.max(1, ...bars.map((b) => b.currentInr));
  return bars
    .map(
      (b) => `<div class="bar-row">
        <span class="lbl">${esc(b.label)} · ${b.count}</span>
        <span class="track"><span class="fill" style="width:${Math.max(2, (b.currentInr / max) * 100).toFixed(1)}%; background:${b.color};"></span></span>
        <span class="amt">${formatInrShort(b.currentInr)} <span style="color:${BRAND.slateMute}; font-weight:600;">${formatPct(b.pct, 0)}</span></span>
      </div>`
    )
    .join('');
}

function holdingsTier(rows: ReportHolding[], label: string, cls: string, color: string): string {
  if (!rows.length) return '';
  const isAction = cls === 'v-swap' || cls === 'v-liq';
  const head = `<tr><th>#</th><th>Held By</th><th>Fund</th><th class="ctr">Current</th><th class="ctr">3Y CAGR</th><th class="ctr">Verdict</th><th>Why${isAction ? ' &amp; replacement' : ''}</th></tr>`;
  const body = rows
    .map((h, i) => {
      const repl = isAction && h.preferredReplacementFundName
        ? ` <span style="color:${BRAND.star}; font-weight:700;">→ ${esc(h.preferredReplacementFundName)}${h.buyListReplacementFundName === h.preferredReplacementFundName ? ' ★' : ''}</span>`
        : '';
      const cat = h.category ? `<div style="font-size:6.6pt;color:${BRAND.slateMute};">${esc(h.category)}</div>` : '';
      return `<tr>
        <td class="ctr">${i + 1}</td>
        <td>${esc(h.entityName)}</td>
        <td><strong>${esc(h.fundName)}</strong>${cat}</td>
        <td class="amt">${formatInrFull(h.currentValueInr)}</td>
        <td class="ctr ${pctClass(h.cagr3y)}">${formatPct(h.cagr3y)}</td>
        <td class="ctr"><span class="verdict ${cls}">${esc(label)}</span></td>
        <td>${esc(h.rationale ?? '—')}${repl}</td>
      </tr>`;
    })
    .join('');
  return `<h3 class="sub"><span class="chip" style="background:${color};">${esc(label)}</span> ${rows.length} holding${rows.length > 1 ? 's' : ''}</h3>
    <table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export function renderPremiumHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const m: PremiumModel = buildPremiumModel(data);

  // KPI tiles
  const kpiHtml = m.kpis
    .map(
      (t) => `<div class="tile" style="border-color:${TONE_FG[t.tone]}; background:${TONE_BG[t.tone]};">
        <div class="val" style="color:${TONE_FG[t.tone]};">${esc(t.value)}</div>
        <div class="lbl" style="color:${TONE_FG[t.tone]};">${esc(t.label)}</div>
        ${t.sub ? `<div class="sub">${esc(t.sub)}</div>` : ''}
      </div>`
    )
    .join('');

  // §2 fund-by-fund
  const fundByFund =
    holdingsTier(data.starHoldings, 'STAR', 'v-star', BRAND.star) +
    holdingsTier(data.keepHoldings, 'KEEP', 'v-keep', BRAND.keep) +
    holdingsTier(data.watchHoldings, 'WATCH', 'v-watch', BRAND.watch) +
    holdingsTier(data.swapHoldings, 'SWAP', 'v-swap', BRAND.swap) +
    holdingsTier(data.liquidateHoldings, 'LIQUIDATE', 'v-liq', BRAND.liq);

  // §3 allocation donut + equity bars
  const donut = m.alloc.slices.length
    ? `<div class="donut-wrap">
        ${donutSvg(m.alloc.slices, formatPct(m.alloc.effectiveEquityPct, 0), 'eff. equity')}
        <div class="donut-legend">
          ${m.alloc.slices
            .map((s) => `<div class="li"><span class="sw" style="background:${s.color};"></span><span class="nm">${esc(s.label)}</span><span class="pc">${formatPct(s.pct, 0)}</span></div>`)
            .join('')}
          <div style="font-size:7.4pt;color:${BRAND.slateMute}; margin-top:6px; max-width:170px;">Effective equity counts ~60% of hybrid as equity (look-through).</div>
        </div>
      </div>`
    : '<div class="note-soft">Allocation breakdown unavailable for this run.</div>';

  const equityBars =
    m.alloc.targetEquityPct != null
      ? `<div class="bar-row"><span class="lbl">Equity today</span><span class="track"><span class="fill" style="width:${Math.min(100, m.alloc.effectiveEquityPct).toFixed(1)}%; background:${BRAND.navy};"></span></span><span class="amt">${formatPct(m.alloc.effectiveEquityPct, 0)}</span></div>
         <div class="bar-row"><span class="lbl">Target for this client</span><span class="track"><span class="fill" style="width:${Math.min(100, m.alloc.targetEquityPct).toFixed(1)}%; background:${BRAND.pos};"></span></span><span class="amt">${formatPct(m.alloc.targetEquityPct, 0)}</span></div>
         <div class="callout" style="margin-top:6px;">Equity stands <strong>${m.alloc.equityGapVerb}</strong> — a gap of about <strong>${formatPct(m.alloc.equityGapPts ?? 0, 0)}</strong> vs the risk-model target. The moves below close it without forcing a taxable sale.</div>`
      : `<div class="note-soft">Target equity not set — capture the client's risk profile to show the today-vs-target gap and the glide path.</div>`;

  // §4 moves
  const movesHtml = m.moves.length
    ? `<table class="moves"><thead><tr><th>#</th><th>Held By</th><th>Action</th><th>Exit / trim</th><th>Redeploy into</th><th class="amt">Amount</th></tr></thead>
        <tbody>${m.moves
          .map(
            (mv) => `<tr>
            <td class="ctr">${mv.idx}</td>
            <td>${esc(mv.entity)}</td>
            <td><span class="act-badge act-${mv.action.toLowerCase()}">${esc(mv.actionLabel)}</span></td>
            <td><strong>${esc(mv.fund)}</strong>${mv.category ? `<div style="font-size:6.6pt;color:${BRAND.slateMute};">${esc(mv.category)}</div>` : ''}</td>
            <td>${mv.replacement ? esc(mv.replacement) + (mv.replacementIsBuyList ? ' <span class="bl-star">★ Buy-List</span>' : '') : '<span style="color:#94A3B8;">per preferred list</span>'}</td>
            <td class="amt">${formatInrFull(mv.amountInr)}</td>
          </tr>`
          )
          .join('')}</tbody></table>
        <div style="font-size:8.2pt; color:${BRAND.slate}; margin-top:5px;"><strong>${m.movesTotal}</strong> re-allocated in total.${m.consolidationNote ? ' ' + esc(m.consolidationNote) : ''}${m.taxExitCount ? ` Indicative exit tax is shown in §5 — confirm with your CA before executing.` : ''}</div>`
    : `<div class="honest" style="background:#F0FDF4;"><div class="lead">Nothing to sell.</div><div class="body">Every holding is suitable and worth keeping — the book needs no re-allocation today. Continue the existing SIPs as scheduled.</div></div>`;

  // §5 tax
  const taxHtml = m.taxLines
    ? `<table><thead><tr><th>Fund</th><th class="ctr">Gain</th><th class="ctr">Type</th><th class="ctr">Locked?</th><th class="ctr">Est. tax</th><th>Note</th></tr></thead>
        <tbody>${m.taxLines
          .map(
            (l) => `<tr><td><strong>${esc(l.fundName)}</strong></td><td class="ctr">${esc(l.gain)}</td><td class="ctr">${esc(l.gainType)}</td><td class="ctr">${l.locked ? '🔒 Yes' : 'No'}</td><td class="ctr amt">${esc(l.estTax)}</td><td>${esc(l.note)}</td></tr>`
          )
          .join('')}</tbody></table>
        ${m.taxHeadline ? `<div class="callout" style="margin-top:6px;"><strong>${esc(m.taxHeadline)}</strong></div>` : ''}`
    : `<div class="note-soft">No taxable exits in this plan — the re-alignment can be done without triggering capital-gains tax.</div>`;

  // §6 SIP
  const sipHtml = m.sip.hasGoal
    ? `<div class="sip-grid">
        <div class="sip-card"><div class="v">${formatInrShort(m.sip.projectedInr)}</div><div class="l">Current book grows to (${m.sip.years}y @ ${formatPct(m.sip.assumedReturnPct, 0)})</div></div>
        <div class="sip-card"><div class="v">${formatInrShort(m.sip.targetInr)}</div><div class="l">Goal corpus</div></div>
        <div class="sip-card hero"><div class="v">${m.sip.gapInr > 0 ? formatInrShort(m.sip.monthlySipInr) + '/mo' : '✓ On track'}</div><div class="l">${m.sip.gapInr > 0 ? 'Step-up SIP to close the gap' : 'No fresh SIP needed'}</div></div>
      </div>
      ${m.mcBlock ? `
      <div class="honest" style="margin-top:8px;">
        <div class="lead">🎲 ${esc(m.mcBlock.headline)}</div>
        <div class="body">${esc(m.mcBlock.subline)}<br/>${esc(m.mcBlock.coneLine)}${m.mcBlock.stepUpLine ? `<br/><strong>${esc(m.mcBlock.stepUpLine)}</strong>` : ''}</div>
      </div>` : ''}
      <div class="note-soft">Illustrative at ${formatPct(m.sip.assumedReturnPct, 0)} p.a.; a 10% annual step-up reduces the starting amount. Markets do not move in a straight line — the probability above comes from 10,000 simulated paths, not a single straight-line projection.</div>`
    : `<div class="note-soft">Goal corpus / horizon not captured — set the family's target and timeframe in the risk profile to generate the funding plan.</div>`;

  // §7 Stock-level look-through (only when holdings data exists)
  const lt = m.lookThroughBlock;
  const lookThroughHtml = lt ? `
    <div class="lead" style="margin-bottom:4px;">${esc(lt.headline)}</div>
    <div class="note-soft" style="margin-top:0; margin-bottom:6px;">${esc(lt.coverageLine)}</div>
    <table class="lt-tbl" style="width:100%; border-collapse:collapse; font-size:8.4pt;">
      <thead><tr style="color:${BRAND.slate};">
        <th style="text-align:left; padding:3px 4px; border-bottom:1px solid ${BRAND.line};">Underlying stock</th>
        <th style="text-align:right; padding:3px 4px; border-bottom:1px solid ${BRAND.line};">Effective value</th>
        <th style="text-align:right; padding:3px 4px; border-bottom:1px solid ${BRAND.line};">% of portfolio</th>
        <th style="text-align:center; padding:3px 4px; border-bottom:1px solid ${BRAND.line};">Via funds</th>
      </tr></thead>
      <tbody>
        ${lt.stocks.map((s) => `<tr>
          <td style="padding:2.5px 4px; border-bottom:1px solid ${BRAND.line};">${esc(s.name)}</td>
          <td style="padding:2.5px 4px; text-align:right; border-bottom:1px solid ${BRAND.line};">${esc(s.valueShort)}</td>
          <td style="padding:2.5px 4px; text-align:right; font-weight:700; border-bottom:1px solid ${BRAND.line};">${s.pct.toFixed(1)}%</td>
          <td style="padding:2.5px 4px; text-align:center; border-bottom:1px solid ${BRAND.line};">${s.fundCount >= 2 ? `<strong style="color:${BRAND.navy};">${s.fundCount}</strong>` : s.fundCount}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${lt.sectorLine ? `<div class="note-soft" style="margin-top:5px;">${esc(lt.sectorLine)}</div>` : ''}
    ${lt.asOfLine ? `<div class="note-soft" style="font-size:7pt;">${esc(lt.asOfLine)}</div>` : ''}` : '';

  // §8 NOT doing
  const notDoing = `<ul class="tight" style="color:${BRAND.slate};">
      <li><strong>No fire-sales.</strong> We never dump a fund for short-term noise; a sell needs a structural reason (wrong risk, weak process, or a clearly better same-category fund).</li>
      <li><strong>No tax-blind churn.</strong> Exits are sequenced to keep capital-gains tax at the legal minimum — we don't trigger LTCG to chase a few basis points.</li>
      <li><strong>Not acting on a raw screen.</strong> Every flag here is to be cross-checked against the family's live statement before any order is placed.</li>
      <li><strong>No Direct-to-Regular switching.</strong> Trustner is your distributor of record; we do not move you off your existing plan structure.</li>
      <li><strong>Scope-limited.</strong> This review covers only the named ${esc(m.familyName)} holdings shared with us — not any account held away.</li>
    </ul>`;

  const riskBanner = riskNotCapturedBanner(data);

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${esc(m.familyName)} — Portfolio Review &amp; Action Plan</title><style>${STYLES}</style></head>
<body><div class="container">
${showPrintBar ? `<div class="no-print no-print-bar">
  <span>📄 Portfolio Review &amp; Action Plan — ${esc(m.familyName)}</span>
  <span style="display:flex; align-items:center; gap:12px;">
    <span style="font-size:7.6pt; opacity:0.9; font-weight:400;">For a clean PDF, untick <strong>“Headers and footers”</strong> in the print dialog — or download the Word version.</span>
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  </span>
</div>` : ''}
${riskBanner}

<div class="letterhead">
  <div class="lh-left">
    <img src="${LOGO}" alt="Trustner" onerror="this.style.display='none'"/>
    <div>
      <div class="lh-firm">TRUSTNER ASSET SERVICES PVT. LTD.</div>
      <div class="lh-sub">AMFI Registered Mutual Fund &amp; SIF Distributor · APMI Registered PMS Distributor · ARN-286886</div>
    </div>
  </div>
  <div class="lh-right">
    <div class="lbl">PORTFOLIO REVIEW</div>
    <div>${esc(m.reportDate)}</div>
    <div>Doc: ${esc(m.documentId)}</div>
  </div>
</div>

<div class="doctitle">
  <div class="t">Portfolio Review &amp; Action Plan</div>
  <div class="for">Prepared for the <strong>${esc(m.familyName)}</strong></div>
  <div class="ents">${esc(m.entitiesLine)}</div>
  <div class="rule"></div>
</div>

${m.gapStrip ? `<div class="gap-strip ${m.gapStrip.aligned ? 'ok' : 'gap'}">${esc(m.gapStrip.text)}</div>` : ''}

<div class="kpi">${kpiHtml}</div>

<div class="honest">
  <div class="lead">${esc(m.honestLead)}</div>
  <div class="body">${esc(m.honestBody)}</div>
</div>

${m.behaviourLine ? `<div class="behaviour ${m.behaviourLine.losing ? 'losing' : 'winning'}"><strong>${m.behaviourLine.losing ? '⏱ ' : '✓ '}</strong>${esc(m.behaviourLine.text)}</div>` : ''}

${m.showNumbersNote ? `<div class="callout"><strong>A note on the numbers.</strong> Gains and any tax shown are as of ${esc(m.reportDate)} and are indicative; the exact embedded gain and liability must be confirmed with your Chartered Accountant before any order is placed. Verdicts reflect Trustner's house view, not personalised advice.</div>` : ''}

<div class="sec"><span class="num">1</span><span class="ttl">The Verdict</span><span class="hint">where the money sits, by call</span></div>
${tierBarsHtml(m.tierBars)}
<table style="margin-top:7px;"><thead><tr><th>Tier</th><th class="ctr">Funds</th><th class="ctr">Current value</th><th class="ctr">% of book</th></tr></thead>
<tbody>${m.tierTable
    .filter((r) => r.count > 0)
    .map((r) => `<tr><td><span class="verdict" style="background:${r.color}; color:white; width:auto; padding:1px 8px;">${esc(r.label)}</span></td><td class="ctr">${r.count}</td><td class="amt">${esc(r.current)}</td><td class="ctr">${esc(r.pct)}</td></tr>`)
    .join('')}</tbody></table>

${m.riskKpiTiles.length ? `
<h3 class="sub" style="margin-top:10px;">Portfolio risk profile</h3>
<div class="kpi" style="grid-template-columns: repeat(${m.riskKpiTiles.length}, 1fr); margin: 4px 0;">
  ${m.riskKpiTiles.map((t) => `<div class="tile" style="border-color:${BRAND.navy}; background:#EFF6FF;"><div class="val" style="color:${BRAND.navy}; font-size:13pt;">${esc(t.value)}</div><div class="lbl" style="color:${BRAND.navy};">${esc(t.label)}</div><div class="sub">${esc(t.sub)}</div></div>`).join('')}
</div>` : ''}
${m.benchmarkBlock ? `
<h3 class="sub" style="margin-top:10px;">Relative performance (3Y, time-weighted)</h3>
<div class="bar-row"><span class="lbl">Your funds (weighted)</span><span class="track"><span class="fill" style="width:${Math.max(2, Math.min(100, m.benchmarkBlock.portfolioPct * 4)).toFixed(1)}%; background:${BRAND.navy};"></span></span><span class="amt">${formatPct(m.benchmarkBlock.portfolioPct, 1)}</span></div>
<div class="bar-row"><span class="lbl">Blended index path</span><span class="track"><span class="fill" style="width:${Math.max(2, Math.min(100, m.benchmarkBlock.blendedPct * 4)).toFixed(1)}%; background:${BRAND.slateMute};"></span></span><span class="amt">${formatPct(m.benchmarkBlock.blendedPct, 1)}</span></div>
<div class="callout" style="margin-top:5px; ${m.benchmarkBlock.alphaPp >= 0 ? `background:#F0FDF4; border-color:#BBF7D0; border-left-color:${BRAND.pos}; color:#166534;` : ''}"><strong>${esc(m.benchmarkBlock.verdictLine)}</strong></div>
<div class="note-soft" style="font-size:7pt;">${esc(m.benchmarkBlock.footnote)}</div>` : ''}

<div class="sec"><span class="num">2</span><span class="ttl">Fund by Fund</span><span class="hint">every holding, with the reason</span></div>
${fundByFund}

<div class="sec"><span class="num">3</span><span class="ttl">The Things to Fix</span><span class="hint">allocation &amp; equity gap</span></div>
${donut}
${equityBars}

<div class="sec"><span class="num">4</span><span class="ttl">The Moves</span><span class="hint">trades execute per PAN</span></div>
${movesHtml}

<div class="sec"><span class="num">5</span><span class="ttl">Tax-Sequenced Glide</span><span class="hint">minimum legal tax</span></div>
${taxHtml}

<div class="sec"><span class="num">6</span><span class="ttl">Funding the Goal</span><span class="hint">illustrative SIP plan</span></div>
${sipHtml}

${lookThroughHtml ? `<div class="sec"><span class="num">7</span><span class="ttl">Look-Through: What You Actually Own</span><span class="hint">true single-stock concentration</span></div>
${lookThroughHtml}` : ''}

<div class="sec"><span class="num">${lookThroughHtml ? '8' : '7'}</span><span class="ttl">What We Are <em>Not</em> Doing</span><span class="hint">how we protect you</span></div>
${notDoing}

<div class="reg">
  <div class="h">REGULATORY &amp; COMMERCIAL NOTES</div>
  <p>${esc(COMPLIANCE.notAdvice)}</p>
  <p>${esc(COMPLIANCE.marketRisk)} ${esc(COMPLIANCE.pastPerf)} ${esc(COMPLIANCE.taxIndicative)}</p>
  <p>${esc(COMPLIANCE.credential)} ${esc(COMPLIANCE.cin)}. Prepared by ${esc(m.rmName)} · ${esc(m.reportDate)} · Doc ${esc(m.documentId)}.</p>
  <div class="firm">${esc(COMPLIANCE.firmLine)}</div>
</div>

</div></body></html>`;
}
