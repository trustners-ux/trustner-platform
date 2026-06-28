/**
 * Action Sheet HTML report
 *
 * Mirrors the Rohit Jain Family May 2026 reference:
 *   /Portfolio Review/Rohit Jain Family May 2026/07_Action_Sheet.pdf
 *
 * Itemised swaps + liquidations with sign-off blocks and tax estimate.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  ReportHolding,
  formatInrFull,
  formatInrShort,
  riskNotCapturedBanner,
} from '../report-data';

const STYLES = `
  @page { size: A4; margin: 14mm 18mm 16mm 18mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
    html { background: white; }
  }
  /* Screen preview: paper-on-grey for breathing room */
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 14mm 18mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1F2937;
    line-height: 1.35;
    font-size: 8pt;
    margin: 0;
    background: white;
  }
  .container { max-width: 174mm; margin: 0 auto; }
  .no-print-bar {
    position: sticky; top: 0; z-index: 100; background: #15233B; color: white;
    padding: 8px 16px; margin: 0 0 8mm 0; display: flex; gap: 12px; align-items: center; justify-content: space-between;
    font-size: 9pt;
  }
  .no-print-bar button {
    background: white; color: #15233B; border: 0; padding: 6px 14px; font-weight: 700; font-size: 9pt;
    border-radius: 4px; cursor: pointer;
  }

  .header {
    border-bottom: 2px solid #15233B;
    padding-bottom: 5px;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left .firm-name { color: #15233B; font-weight: 700; font-size: 10pt; }
  .header-left .firm-sub { color: #64748B; font-size: 6.8pt; }
  .header-right { text-align: right; font-size: 7pt; color: #64748B; }
  .header-right .label { font-size: 8pt; color: #15233B; font-weight: 700; letter-spacing: 0.5px; }

  .doc-title {
    background: #15233B;
    color: white;
    padding: 6px 12px;
    font-size: 12pt;
    font-weight: 700;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .doc-title .sub { font-size: 8.5pt; font-weight: 400; opacity: 0.92; }

  .meta-strip {
    background: #FAF7F2;
    border: 1px solid #E0C99E;
    padding: 6px 10px;
    margin-bottom: 8px;
    font-size: 7.5pt;
    color: #1F2937;
  }
  .meta-strip strong { color: #15233B; }

  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    color: #15233B;
    font-size: 9.5pt;
    margin: 10px 0 4px 0;
    padding: 5px 12px;
    border-left: 3px solid #15233B;
    background: #F4F6F8;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  h2.sec-swap { border-left-color: #9B2C3A; }
  h2.sec-liq { border-left-color: #6B7280; }
  h2.sec-tax { border-left-color: #9A7B4F; }
  h2.sec-followup { border-left-color: #2F6F4F; }
  h2.sec-signoff { border-left-color: #15233B; }
  h2 .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5pt; font-weight: 600; color: #6B7280; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin: 2px 0 6px 0;
  }
  th {
    background: #15233B;
    color: white;
    padding: 4px 6px;
    text-align: left;
    font-weight: 600;
    font-size: 7pt;
    border: 1px solid #15233B;
  }
  td {
    padding: 4px 6px;
    border: 1px solid #E5E7EB;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #FAFAF8; }

  .amt { text-align: right; white-space: nowrap; font-weight: 600; color: #15233B; }
  .ctr { text-align: center; }
  .checkbox { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #1F2937; vertical-align: middle; margin-right: 4px; }

  /* Buy-List provenance + EXIT/SWITCH action badges */
  .bl-tag {
    display: inline-block; font-size: 6pt; font-weight: 700; color: #2F6F4F;
    background: #F5EFE3; border: 1px solid #D8C7A6; border-radius: 8px;
    padding: 0 4px; margin-left: 4px; white-space: nowrap; letter-spacing: 0.2px;
  }
  .act-tag {
    display: inline-block; font-size: 6.5pt; font-weight: 700; color: white;
    border-radius: 3px; padding: 1px 5px; letter-spacing: 0.3px; white-space: nowrap;
  }
  .act-exit { background: #9B2C3A; }
  .act-switch { background: #9A7B4F; }
  .act-redeem { background: #64748B; }
  .act-reduce, .act-trim { background: #2F6F4F; }

  .consol-table td { font-size: 7.2pt; }
  .consol-keep { color: #2F6F4F; font-weight: 700; }
  .consol-into { color: #64748B; font-size: 6.6pt; }

  .subtotal-row td { background: #F5EFE3 !important; font-weight: 700; }
  .grand-total {
    background: #15233B;
    color: white;
    padding: 6px 12px;
    margin: 4px 0;
    font-size: 10pt;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .signoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }
  .signoff-block {
    border: 1px solid #E5E7EB;
    border-radius: 3px;
    padding: 8px 10px;
  }
  .signoff-block .role { font-size: 7pt; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
  .signoff-block .name { font-size: 9pt; font-weight: 700; color: #1F2937; margin-top: 2px; }
  .signoff-block .note { font-size: 6.8pt; color: #64748B; margin-top: 2px; }
  .signature-line {
    border-bottom: 1px solid #1F2937;
    margin-top: 22px;
    margin-bottom: 4px;
    height: 16px;
  }
  .signoff-block .date { font-size: 6.8pt; color: #64748B; }

  .checklist {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    padding: 8px 12px;
    border-radius: 3px;
    margin-top: 4px;
  }
  .checklist-item { padding: 3px 0; font-size: 7.8pt; }
  .checklist .yesno { font-weight: 700; margin-left: 6px; }

  .compliance {
    margin-top: 10px;
    padding-top: 5px;
    border-top: 1px solid #E5E7EB;
    font-size: 6pt;
    color: #64748B;
    line-height: 1.4;
    text-align: justify;
  }

  .auth-statement {
    background: #F0FDFA;
    border-left: 3px solid #2F6F4F;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 7.5pt;
    line-height: 1.4;
  }
`;

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Within the SWAP/LIQUIDATE tier, distinguish the precise v2 action the legacy
// enum collapses: EXIT_UNSUITABLE ("right fund, wrong seat") vs SWITCH_BETTER
// (a stronger same-category peer exists). Mirrors the three-pager mapping.
const V2_ACTION_SHORT: Record<string, string> = {
  EXIT_UNSUITABLE: 'EXIT',
  SWITCH_BETTER: 'SWITCH',
  SWITCH_MODE: 'SWITCH',
  REDUCE: 'REDUCE',
  REDEEM_TINY: 'REDEEM',
  HOLD_PARTIAL: 'TRIM',
};

function renderTransactionRow(h: ReportHolding, idx: number, isLiquidation: boolean): string {
  // Buy-List-first replacement (preferredReplacementFundName is already
  // committee-shortlist-first); flag when the suggested fund is on the
  // Trustner Approved Buy-List so the client sees the provenance.
  const replFund = h.preferredReplacementFundName ?? null;
  const fromBuyList = !!h.buyListReplacementFundName &&
    h.buyListReplacementFundName === h.preferredReplacementFundName;
  const replaceWith = replFund
    ? `${escapeHtml(replFund)}${fromBuyList ? ' <span class="bl-tag">★ Buy-List</span>' : ''}`
    : (isLiquidation ? 'Top-up best-in-class fund (per RM)' : 'Per Trustner preferred list');

  // EXIT vs SWITCH is explicit on each row via the v2 action.
  const actBadge = h.v2Action && V2_ACTION_SHORT[h.v2Action]
    ? `<span class="act-tag act-${V2_ACTION_SHORT[h.v2Action].toLowerCase()}">${V2_ACTION_SHORT[h.v2Action]}</span>`
    : (isLiquidation ? '<span class="act-tag act-redeem">REDEEM</span>' : '<span class="act-tag act-switch">SWITCH</span>');

  const reason = h.rationale ?? (isLiquidation ? 'Immaterial — cleanup' : 'Mid-pack; better alternative exists');

  return `
    <tr>
      <td class="ctr">${idx + 1}</td>
      <td class="ctr"><span class="checkbox"></span></td>
      <td>${escapeHtml(h.entityName)}</td>
      <td>${escapeHtml(h.fundName)}${h.category ? `<div style="font-size:6.5pt;color:#64748B;">${escapeHtml(h.category)}</div>` : ''}</td>
      <td class="ctr">${actBadge}</td>
      <td class="amt">${formatInrFull(h.currentValueInr)}</td>
      <td>${replaceWith}</td>
      <td>${escapeHtml(reason)}</td>
    </tr>
  `;
}

export function renderActionSheetHtml(data: ReportData, opts?: { showPrintBar?: boolean }): string {
  const showPrintBar = opts?.showPrintBar ?? true;
  const swaps = data.swapHoldings;
  const liqs = data.liquidateHoldings;
  const swapTotal = swaps.reduce((s, h) => s + h.currentValueInr, 0);
  const liqTotal = liqs.reduce((s, h) => s + h.currentValueInr, 0);
  const grandTotal = swapTotal + liqTotal;
  const actionDocId = data.documentId.replace('PD-', 'AS-');

  // Tax impact. Prefer the v2 India tax-aware estimate from the engine
  // (taxSummary) — it models LTCG 12.5% over ₹1.25L per FY, STCG 20%, debt
  // at slab, and ELSS lock-in — and falls back to a crude inline estimate
  // only when the v2 summary is absent (older runs).
  type TaxRow = {
    entityName: string;
    fundName: string;
    holding: string;
    gainOrLoss: string;
    taxType: string;
    estTax: string;
  };

  // ── v2 tax-aware path ──────────────────────────────────────
  const tax = data.taxSummary;
  // Map exited holdings by name so we can attach the PAN/holding-period the
  // v2 summary doesn't carry per line.
  const exitByName = new Map<string, ReportHolding>();
  for (const h of [...swaps, ...liqs]) exitByName.set(h.fundName, h);

  const v2GainType = (t: string): string => {
    switch (t) {
      case 'LTCG': return 'LTCG @ 12.5% (over ₹1.25L/FY)';
      case 'STCG': return 'STCG @ 20%';
      case 'DEBT': return 'Debt — taxed at slab';
      case 'LOSS': return 'Capital loss (set-off)';
      default: return t;
    }
  };

  const taxRowsV2: TaxRow[] = (tax?.lines ?? []).map((ln) => {
    const h = exitByName.get(ln.fundName);
    const months = h?.holdingPeriodMonths ?? null;
    const holdingStr = ln.locked
      ? 'ELSS · locked'
      : months == null
        ? '—'
        : months >= 12
          ? `${(months / 12).toFixed(months % 12 === 0 ? 0 : 1)} yr`
          : `~${months} mo`;
    const estTaxStr = ln.locked
      ? 'Locked — no exit'
      : ln.estTaxInr == null
        ? '—'
        : ln.estTaxInr === 0
          ? '₹0'
          : ln.estTaxInr > 0
            ? `~${formatInrFull(ln.estTaxInr)}`
            : `${formatInrFull(ln.estTaxInr)} (set-off)`;
    return {
      entityName: escapeHtml(h?.entityName ?? '—'),
      fundName: escapeHtml(ln.fundName),
      holding: holdingStr,
      gainOrLoss: `${ln.gainInr >= 0 ? '+' : ''}${formatInrFull(ln.gainInr)}`,
      taxType: escapeHtml(v2GainType(ln.gainType) + (ln.note ? ` · ${ln.note}` : '')),
      estTax: estTaxStr,
    };
  });

  // ── Legacy fallback (only when v2 summary absent) ──────────
  const taxRowsLegacy: TaxRow[] = [...swaps, ...liqs].map((h) => {
    const months = h.holdingPeriodMonths ?? 12;
    const gain = h.unrealisedGainInr ?? 0;
    let taxType: string;
    let estTax = 0;
    if (months >= 12) {
      taxType = 'LTCG (within ₹1.25L exemption)';
      estTax = 0;
    } else if (gain > 0) {
      taxType = 'STCG @ 20%';
      estTax = gain * 0.2;
    } else {
      taxType = 'STCG loss (set-off)';
      estTax = Math.abs(gain) * 0.2 * -1;
    }
    return {
      entityName: escapeHtml(h.entityName),
      fundName: escapeHtml(h.fundName),
      holding: months >= 12 ? `${(months / 12).toFixed(months % 12 === 0 ? 0 : 1)} yr` : `~${months} mo`,
      gainOrLoss: `${gain >= 0 ? '+' : ''}${formatInrFull(gain)}`,
      taxType,
      estTax: estTax === 0 ? '₹0' : estTax > 0 ? `~${formatInrFull(estTax)}` : `${formatInrFull(estTax)} (set-off)`,
    };
  });

  const usingV2Tax = !!tax && tax.lines.length > 0;
  const taxRows = usingV2Tax ? taxRowsV2 : taxRowsLegacy;

  const netTaxLegacy = taxRowsLegacy.reduce((s, _r, idx) => {
    const h = idx < swaps.length ? swaps[idx] : liqs[idx - swaps.length];
    const months = h.holdingPeriodMonths ?? 12;
    const gain = h.unrealisedGainInr ?? 0;
    if (months >= 12) return s;
    return s + gain * 0.2;
  }, 0);
  const netTax = usingV2Tax ? tax!.estTotalTaxInr : netTaxLegacy;

  const noActionsBanner = (swaps.length === 0 && liqs.length === 0)
    ? `<div style="padding:30px; text-align:center; background:#E8F1EC; border:2px solid #2F6F4F; border-radius:6px; margin: 20px 0;">
         <h2 style="color:#2F6F4F; background:transparent; padding:0; margin:0 0 8px 0; font-size:14pt;">✓ NO ACTIONS REQUIRED</h2>
         <p style="color:#2F6F4F; margin:0; font-size:9pt;">Portfolio is healthy. All ${data.numHoldings} holdings are STAR / KEEP / WATCH tier. Continue all existing SIPs as scheduled.</p>
       </div>`
    : '';

  // ── Section numbering (kept stable as optional sections appear) ──
  const hasActions = swaps.length > 0 || liqs.length > 0;
  const hasConsolidation = (data.consolidationGroups?.length ?? 0) > 0;
  let sec = 0;
  if (swaps.length > 0) sec++;          // Section: Fund Swaps
  if (liqs.length > 0) sec++;           // Section: Liquidations
  const secTax = hasActions ? ++sec : 0;
  const secConsol = hasConsolidation ? ++sec : 0;
  const secFollowup = ++sec;            // Post-Action Review (always)
  const secSignoff = ++sec;             // Authorization & Sign-off (always)

  // ── Consolidation action block (Pillar-6 duplicate cleanup) ──
  const consolidationBlock = hasConsolidation
    ? `
      <h2 class="sec-liq">
        <span>SECTION ${secConsol} — CONSOLIDATION (${data.consolidationGroups.length} duplicate group${data.consolidationGroups.length !== 1 ? 's' : ''})</span>
        <span class="sub">Merge same-category overlaps · ${formatInrShort(data.consolidationValueInr)} to redeploy</span>
      </h2>
      <table class="consol-table">
        <thead>
          <tr>
            <th class="ctr" style="width:24px;">✓</th>
            <th style="width:130px;">Category</th>
            <th>Keep (stronger fund)</th>
            <th>Merge in (redeem &amp; move)</th>
            <th class="ctr" style="width:80px;">Value to move</th>
          </tr>
        </thead>
        <tbody>
          ${data.consolidationGroups
            .map(
              (g) => `<tr>
                <td class="ctr"><span class="checkbox"></span></td>
                <td>${escapeHtml(g.subCategory)}${g.confidence ? `<div class="consol-into">${escapeHtml(g.confidence)} confidence</div>` : ''}</td>
                <td><span class="consol-keep">${escapeHtml(g.keep.fundName)}</span></td>
                <td>${g.consolidate
                  .map((c) => `${escapeHtml(c.fundName)} <span class="consol-into">(${formatInrFull(c.currentValueInr)})</span>`)
                  .join('<br/>')}</td>
                <td class="amt">${formatInrFull(g.totalConsolidatableInr)}</td>
              </tr>`
            )
            .join('')}
          <tr class="subtotal-row">
            <td colspan="4" style="text-align:right; font-weight:700;">CONSOLIDATION SUBTOTAL</td>
            <td class="amt">${formatInrFull(data.consolidationValueInr)}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:6.5pt; color:#64748B; margin-top:4px; font-style:italic;">
        These holdings sit in the same sub-category. Merging the weaker duplicate into the stronger fund
        simplifies tracking and concentrates conviction without changing the family&apos;s overall asset mix.
        Tax on any gains realised by this merge is captured in the Tax Impact section above.
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.familyName)} — Action Sheet</title>
<style>${STYLES}</style>
</head>
<body>${riskNotCapturedBanner(data)}
<div class="container">
  ${
    showPrintBar
      ? `<div class="no-print no-print-bar">
          <span>📋 Action Sheet — ${escapeHtml(data.familyName)} | ${escapeHtml(data.reportDate)}</span>
          <button onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>`
      : ''
  }

  <div class="header">
    <div class="header-left">
      <div class="firm-name">TRUSTNER ASSET SERVICES PVT. LTD.</div>
      <div class="firm-sub">AMFI Registered MFD | ARN-286886 | CIN: U66301AS2023PTC025505 | www.trustner.in</div>
    </div>
    <div class="header-right">
      <div class="label">PORTFOLIO ACTION SHEET</div>
      <div>${escapeHtml(data.reportDate)}</div>
      <div>Doc-ID: ${escapeHtml(actionDocId)}</div>
    </div>
  </div>

  <div class="doc-title">
    ${escapeHtml(data.familyName)} — Portfolio Re-alignment
    <span class="sub">${swaps.length} Swap${swaps.length !== 1 ? 's' : ''} • ${liqs.length} Liquidation${liqs.length !== 1 ? 's' : ''} • ${formatInrShort(grandTotal)} Reallocation</span>
  </div>

  <div class="meta-strip">
    <strong>Family:</strong> ${escapeHtml(data.familyName)} &nbsp;|&nbsp;
    <strong>Entities Covered:</strong> ${data.entitiesCovered.length > 0 ? escapeHtml(data.entitiesCovered.join(', ')) : '—'} &nbsp;|&nbsp;
    <strong>AUM:</strong> ${formatInrShort(data.currentValueInr)} &nbsp;|&nbsp;
    <strong>Total Reallocation:</strong> ${formatInrFull(grandTotal)} &nbsp;|&nbsp;
    <strong>RM:</strong> ${escapeHtml(data.rmName)}
  </div>

  ${noActionsBanner}

  ${
    swaps.length > 0
      ? `
        <h2 class="sec-swap">
          <span>SECTION 1 — FUND SWAPS (${swaps.length} transaction${swaps.length !== 1 ? 's' : ''})</span>
          <span class="sub">Tick ☐ to authorize each</span>
        </h2>
        <table>
          <thead>
            <tr>
              <th class="ctr" style="width:24px;">#</th>
              <th class="ctr" style="width:24px;">✓</th>
              <th style="width:90px;">PAN / Entity</th>
              <th>REDEEM (Exit)</th>
              <th class="ctr" style="width:52px;">Action</th>
              <th style="width:90px; text-align:right;">Amount →</th>
              <th>REINVEST INTO</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${swaps.map((h, i) => renderTransactionRow(h, i, false)).join('')}
            <tr class="subtotal-row">
              <td colspan="5" style="text-align:right; font-weight:700;">SWAPS SUBTOTAL</td>
              <td class="amt">${formatInrFull(swapTotal)}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      `
      : ''
  }

  ${
    liqs.length > 0
      ? `
        <h2 class="sec-liq">
          <span>SECTION ${swaps.length > 0 ? '2' : '1'} — LIQUIDATIONS (${liqs.length} transaction${liqs.length !== 1 ? 's' : ''} — cleanup)</span>
          <span class="sub">Immaterial legacy positions</span>
        </h2>
        <table>
          <thead>
            <tr>
              <th class="ctr" style="width:24px;">#</th>
              <th class="ctr" style="width:24px;">✓</th>
              <th style="width:90px;">PAN / Entity</th>
              <th>REDEEM</th>
              <th class="ctr" style="width:52px;">Action</th>
              <th style="width:90px; text-align:right;">Amount →</th>
              <th>REINVEST INTO</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${liqs.map((h, i) => renderTransactionRow(h, swaps.length + i, true)).join('')}
            <tr class="subtotal-row">
              <td colspan="5" style="text-align:right; font-weight:700;">LIQUIDATIONS SUBTOTAL</td>
              <td class="amt">${formatInrFull(liqTotal)}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      `
      : ''
  }

  ${
    swaps.length > 0 || liqs.length > 0
      ? `
        <div class="grand-total">
          <span>GRAND TOTAL — REALLOCATION</span>
          <span>${formatInrFull(grandTotal)}</span>
        </div>

        <h2 class="sec-tax">
          <span>SECTION ${secTax} — TAX IMPACT</span>
          <span class="sub">${usingV2Tax ? 'India tax-aware estimate (LTCG 12.5% over ₹1.25L/FY · STCG 20% · debt at slab · ELSS lock-in)' : 'Estimated capital gains liability'}</span>
        </h2>
        ${usingV2Tax && tax!.headline ? `<div class="auth-statement" style="background:#F0FDFA;border-left-color:#2F6F4F;">${escapeHtml(tax!.headline)}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>PAN / Entity</th>
              <th>Fund Exited</th>
              <th class="ctr">Holding</th>
              <th class="ctr">Gain / Loss</th>
              <th>Tax Type</th>
              <th class="ctr">Estimated Tax</th>
            </tr>
          </thead>
          <tbody>
            ${taxRows
              .map(
                (t) => `<tr>
                  <td>${t.entityName}</td>
                  <td>${t.fundName}</td>
                  <td class="ctr">${t.holding}</td>
                  <td class="amt">${t.gainOrLoss}</td>
                  <td>${t.taxType}</td>
                  <td class="amt">${t.estTax}</td>
                </tr>`
              )
              .join('')}
            <tr class="subtotal-row">
              <td colspan="5" style="text-align:right; font-weight:700;">NET ESTIMATED TAX FROM THIS REALIGNMENT</td>
              <td class="amt">${netTax === 0 ? '~ ₹0 (tax-neutral)' : '~' + formatInrFull(netTax)}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:6.5pt; color:#64748B; margin-top:4px; font-style:italic;">
          ${usingV2Tax
            ? `Note: Equity LTCG is taxed at 12.5% on gains above the ₹1.25 L per-PAN annual exemption; equity STCG at 20%; debt funds at the holder&apos;s income-tax slab. ELSS units inside the 3-year lock-in are flagged as "locked — no exit". Capital losses can be set off per Income-Tax rules.`
            : `Note: All LTCG positions within ₹1.25 L per-PAN annual exemption are treated as ₹0 tax. STCG losses can be set off against any STCG gains.`}
          Final tax computation depends on each PAN&apos;s full-year transaction history; figures above are
          illustrative based on this re-allocation only and should be confirmed with your CA before filing.
        </p>
      `
      : ''
  }

  ${consolidationBlock}

  <h2 class="sec-followup">
    <span>SECTION ${secFollowup} — POST-ACTION REVIEW</span>
    <span class="sub">Optional cash-flow check before any additional SIP</span>
  </h2>
  <div class="checklist">
    <div style="font-weight:700; margin-bottom:6px;">Three-step cash-flow test — answer YES/NO:</div>
    <div class="checklist-item">
      <span class="checkbox"></span> 1. I have ≥ 6 months of family expenses in liquid (FD / savings).
      <span class="yesno">YES ☐&nbsp;&nbsp;NO ☐</span>
    </div>
    <div class="checklist-item">
      <span class="checkbox"></span> 2. After all SIPs / EMIs / family expenses, additional SIP amount is genuine surplus.
      <span class="yesno">YES ☐&nbsp;&nbsp;NO ☐</span>
    </div>
    <div class="checklist-item">
      <span class="checkbox"></span> 3. I am OK if this new money drops -20% in next 12 months.
      <span class="yesno">YES ☐&nbsp;&nbsp;NO ☐</span>
    </div>
    <div style="font-size:7pt; color:#64748B; margin-top:6px;">
      <strong>If all 3 = YES</strong> → propose additional monthly SIP split across STAR/KEEP holdings (consult RM for specifics).<br/>
      <strong>If any = NO</strong> → skip additional SIP for now; re-assess at next quarterly review.
    </div>
  </div>

  <h2 class="sec-signoff">
    <span>SECTION ${secSignoff} — AUTHORIZATION &amp; SIGN-OFF</span>
    <span class="sub">All parties must sign before execution</span>
  </h2>

  <div class="auth-statement">
    I, the undersigned, authorize Trustner Asset Services Pvt. Ltd. (ARN-286886) to execute the
    swaps and liquidations marked ✓ above on behalf of the PAN/entity I am authorized to represent.
    I understand that:
    <ul style="margin: 3px 0 0 0; padding-left: 18px;">
      <li>Trustner acts as a Mutual Fund Distributor (ARN-286886).</li>
      <li>Past performance does not guarantee future returns.</li>
      <li>Final execution requires NEFT/UPI mandate validation and AMC processing time (T+1 to T+3 business days).</li>
      <li>Tax estimates above are illustrative; final liability is each holder&apos;s responsibility.</li>
    </ul>
  </div>

  <div class="signoff-grid">
    <div class="signoff-block">
      <div class="role">Client Sign-off</div>
      <div class="signature-line"></div>
      <div class="name">${escapeHtml(data.entitiesCovered[0] ?? data.familyName.toUpperCase())}</div>
      <div class="note">Primary PAN holder; coordinating for family</div>
      <div class="date">Date: ____ / ____ / ${new Date().getFullYear()}</div>
    </div>
    ${
      data.entitiesCovered.length > 1
        ? `<div class="signoff-block">
            <div class="role">Co-Authorization</div>
            <div class="signature-line"></div>
            <div class="name">${escapeHtml(data.entitiesCovered[1])}</div>
            <div class="note">Required for joint-folio transactions</div>
            <div class="date">Date: ____ / ____ / ${new Date().getFullYear()}</div>
          </div>`
        : `<div class="signoff-block">
            <div class="role">Co-Authorization (if applicable)</div>
            <div class="signature-line"></div>
            <div class="name">_______________________________</div>
            <div class="note">Required for joint-folio transactions</div>
            <div class="date">Date: ____ / ____ / ${new Date().getFullYear()}</div>
          </div>`
    }
    <div class="signoff-block">
      <div class="role">Trustner Countersign</div>
      <div class="signature-line"></div>
      <div class="name">${escapeHtml(data.rmName)}</div>
      <div class="note">Trustner Asset Services Pvt. Ltd.</div>
      <div class="date">Date: ____ / ____ / ${new Date().getFullYear()}</div>
    </div>
  </div>

  <div class="compliance">
    Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
    Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI registered Mutual Fund
    distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886. Recommendations
    in this document are scheme-distribution recommendations based on the family&apos;s stated financial
    situation and goals as of ${escapeHtml(data.reportDate)}, and do NOT constitute investment advice
    as defined under SEBI (Investment Advisers) Regulations, 2013. Final execution is subject to KYC verification,
    signed mandates, and AMC processing. Tax computations are illustrative — final tax liability
    rests with each PAN holder and should be confirmed with their CA before filing. This Action
    Sheet supersedes any prior recommendation where the two conflict.
  </div>
</div>
</body>
</html>`;
}
