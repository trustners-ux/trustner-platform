/**
 * Narrative Portfolio Review — A4 portrait, running header/footer,
 * matches the hand-crafted Bihani / Dutta / Dhar / Sarkar style.
 *
 * Input: ReportData (the deterministic snapshot) + NarrativeJSON
 * (the LLM-generated advisor layer).
 *
 * Output: full HTML ready for Chrome headless PDF render via the
 * existing report endpoint pipeline.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { ReportData } from '../report-data';
import type { NarrativeJSON } from '../narrative-engine';
import { formatInrShort, formatInrFull, formatPct } from '../report-data';

interface RenderOpts {
  showPrintBar?: boolean;
}

function escape(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function renderNarrativeReviewHtml(
  data: ReportData,
  narrative: NarrativeJSON,
  opts: RenderOpts = {}
): string {
  const familyName = data.familyName;
  // DB names may already end in "Family" (e.g. "Madhuchanda Dhar Family") —
  // strip it so the template's own " Family" suffix doesn't double up.
  const familyBase = familyName.replace(/\s+family\s*$/i, '');
  const reportDate = data.reportDate;
  const docId = `${familyBase.replace(/[^A-Z0-9]+/gi, '').slice(0, 6).toUpperCase()}-NR-${data.reportDateIso}`;

  const printBar = opts.showPrintBar
    ? `<div class="print-bar"><span>Use <strong>Cmd+P / Ctrl+P</strong> and "Save as PDF" — A4 portrait recommended.</span></div>`
    : '';

  // Flatten all tier-bucketed holdings into a single sorted array.
  // ReportData splits into starHoldings / keepHoldings / etc. — we
  // join them back in the standard tier order for the table.
  const allHoldings = [
    ...data.starHoldings,
    ...data.keepHoldings,
    ...data.watchHoldings,
    ...data.swapHoldings,
    ...data.liquidateHoldings,
  ];

  // Top-line table
  const snapshot = `
    <table class="snapshot">
      <tbody>
        <tr><td>PANs covered</td><td>${data.numEntities}</td></tr>
        <tr><td>Total invested</td><td>${formatInrFull(data.totalInvestedInr)}</td></tr>
        <tr><td>Current value</td><td><strong>${formatInrFull(data.currentValueInr)}</strong></td></tr>
        <tr><td>Unrealised gain</td><td><strong>${formatInrFull(data.totalGainInr)}</strong> (${data.totalInvestedInr > 0 ? ((data.totalGainInr / data.totalInvestedInr) * 100).toFixed(2) : '0'}%)</td></tr>
        <tr><td>Family XIRR</td><td><strong>${formatPct(data.familyXirrPct, 2)}</strong></td></tr>
        <tr><td>Holdings</td><td>${data.numHoldings}</td></tr>
        <tr><td>Unique funds / AMCs</td><td>${data.numUniqueFunds} / ${data.numAmcs}</td></tr>
      </tbody>
    </table>
  `;

  // Section 3: Dead-money findings (optional)
  const deadMoney = narrative.deadMoneyFindings
    ? `
      <h2>3 · The dead-money positions — central finding</h2>
      <p><strong>${escape(narrative.deadMoneyFindings.headline)}</strong></p>
      <table class="dead-money">
        <thead><tr><th>Fund</th><th>Impact</th></tr></thead>
        <tbody>
        ${narrative.deadMoneyFindings.perPosition
          .map((p) => `<tr><td><strong>${escape(p.fund)}</strong></td><td>${escape(p.impact)}</td></tr>`)
          .join('')}
        </tbody>
      </table>
      <p><strong>Opportunity cost:</strong> ${escape(narrative.deadMoneyFindings.opportunityCost)}</p>
    `
    : '';

  // Section 4: SIP audit (optional)
  const sipAudit = narrative.sipAudit
    ? `
      <h2>4 · ⚠ SIP Audit</h2>
      <p><strong>${escape(narrative.sipAudit.headline)}</strong></p>
      <ul>
        ${narrative.sipAudit.findings.map((f) => `<li>${escape(f)}</li>`).join('')}
      </ul>
      <p><strong>Recommendation:</strong> ${escape(narrative.sipAudit.recommendation)}</p>
    `
    : '';

  // Section 5: Per-holding tier analysis (built from data + narrative)
  const verdictTone: Record<string, string> = {
    STAR: 'star',
    KEEP: 'keep',
    WATCH: 'watch',
    SWAP: 'swap',
    LIQUIDATE: 'liquidate',
  };

  // Build a holding lookup: id → narrative.perHoldingWhy entry
  const whyByHolding = new Map<number, string>();
  const replaceByHolding = new Map<number, string>();
  for (const h of narrative.perHoldingWhy ?? []) {
    whyByHolding.set(h.holdingId, h.why);
    replaceByHolding.set(h.holdingId, h.replaceWith);
  }

  const holdingsRows = allHoldings
    .map((h) => {
      const why = whyByHolding.get(h.id) ?? h.rationale ?? '';
      const replace = replaceByHolding.get(h.id) ?? h.preferredReplacementFundName ?? '';
      const cls = verdictTone[h.verdict] ?? '';
      return `<tr>
        <td><strong>${escape(h.fundName)}</strong></td>
        <td>${escape(h.entityName)}</td>
        <td class="num">${formatInrShort(h.investedInr)}</td>
        <td class="num">${formatInrShort(h.currentValueInr)}</td>
        <td class="num">${formatPct(h.xirrPct, 2)}</td>
        <td class="verdict ${cls}">${escape(h.verdict)}</td>
        <td class="why">${escape(why)}${replace ? `<br/><em>Replace with: ${escape(replace)}</em>` : ''}</td>
      </tr>`;
    })
    .join('');

  // Section 6: Portfolio overlap (null-safe — engine normalizer guarantees
  // portfolioOverlap is at least `{ summary: '', perCategory: [] }`, but a
  // hand-edited row could still drop one of the keys)
  const overlapSummary = narrative.portfolioOverlap?.summary ?? '';
  const overlapRows = (narrative.portfolioOverlap?.perCategory ?? [])
    .map(
      (c) => `<tr>
        <td><strong>${escape(c.category)}</strong></td>
        <td>${escape(c.observation)}</td>
        <td>${escape(c.recommendation)}</td>
      </tr>`
    )
    .join('');

  // Section 7: International plan (optional)
  const intl = narrative.internationalPlan
    ? `
      <h2>7 · International diversification plan</h2>
      <p><strong>Current exposure:</strong> ${escape(narrative.internationalPlan.currentExposure)}</p>
      <p><strong>Target:</strong> ${escape(narrative.internationalPlan.targetExposure)}</p>
      <p>${escape(narrative.internationalPlan.rationale)}</p>
      <table>
        <thead><tr><th>Fund</th><th>Allocation</th><th>Role</th></tr></thead>
        <tbody>
        ${narrative.internationalPlan.fundPicks
          .map(
            (f) =>
              `<tr><td><strong>${escape(f.name)}</strong></td><td>${escape(f.allocation)}</td><td>${escape(f.role)}</td></tr>`
          )
          .join('')}
        </tbody>
      </table>
    `
    : '';

  // Section 8: Tax impact (null-safe)
  const taxImpact = narrative.taxImpact ?? { perSwap: [], netTax: '', summary: '' };
  const taxRows = (taxImpact.perSwap ?? [])
    .map(
      (t) => `<tr>
        <td><strong>${escape(t.pan)}</strong></td>
        <td>${escape(t.fund)}</td>
        <td>${escape(t.gain)}</td>
        <td>${escape(t.taxType)}</td>
        <td class="num"><strong>${escape(t.tax)}</strong></td>
        <td>${escape(t.phasingNote)}</td>
      </tr>`
    )
    .join('');

  // Section 9: Wealth scenarios (null-safe)
  const scenarioRows = (narrative.wealthScenarios ?? [])
    .map(
      (s, i) => `<tr>
        <td><strong>${String.fromCharCode(65 + i)}</strong></td>
        <td>${escape(s.label)}</td>
        <td class="num"><strong>${escape(s.fiveYearAum)}</strong></td>
        <td class="num">${escape(s.marginalBenefit)}</td>
      </tr>`
    )
    .join('');

  // Section 10/11: Top actions + What NOT to do (null-safe)
  const topActionsList = (narrative.topActions ?? [])
    .map((a, i) => `<li><strong>${i + 1}.</strong> ${escape(a)}</li>`)
    .join('');
  const whatNotList = (narrative.whatNotToDo ?? []).map((a) => `<li>❌ ${escape(a)}</li>`).join('');

  // Section 12: Direct note (null-safe)
  const directNote = narrative.directNote ? paragraphs(narrative.directNote) : '';

  // Section 13: Meeting agenda (null-safe)
  const agendaRows = (narrative.meetingAgenda ?? [])
    .map((a) => `<tr><td><strong>${escape(a.time)}</strong></td><td>${escape(a.topic)}</td></tr>`)
    .join('');

  // Final HTML
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${escape(familyBase)} Family — Portfolio Review · ${escape(reportDate)}</title>
<style>
  @page { size: A4; margin: 24mm 20mm 22mm 20mm; }
  /* Screen-only: render as a centered paper on a soft grey background so the
     on-screen preview has breathing room L/R. Print mode strips this back. */
  @media screen {
    html { background: #f1f5f9; min-height: 100vh; }
    html body { max-width: 210mm; margin: 16px auto; padding: 24mm 20mm 22mm 20mm; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10); border-radius: 4px; background: white; }
  }
  @media print {
    html, body { background: white; }
  }
  * { box-sizing: border-box; }
  html, body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 9.5pt; line-height: 1.5; margin: 0; padding: 0; }
  .running-header { position: fixed; top: 6mm; left: 16mm; right: 16mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #64748b; letter-spacing: 0.4px; border-bottom: 0.5px solid #cbd5e1; padding-bottom: 2mm; }
  .running-header .firm { font-weight: 700; color: #0c4a6e; }
  .running-header .doc { text-align: right; color: #94a3b8; }
  .running-footer { position: fixed; bottom: 6mm; left: 16mm; right: 16mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #94a3b8; border-top: 0.5px solid #cbd5e1; padding-top: 2mm; }
  h1 { color: #0c4a6e; font-size: 19pt; font-weight: 900; border-bottom: 3px solid #0c4a6e; padding-bottom: 5pt; margin: 0 0 8pt 0; }
  h1 + h3 { color: #475569; font-weight: 500; font-size: 10pt; margin: 0 0 12pt 0; border: none; }
  h2 { color: #0c4a6e; font-size: 14pt; font-weight: 800; border-left: 4px solid #0c4a6e; padding-left: 9pt; margin: 20pt 0 8pt 0; page-break-after: avoid; page-break-inside: avoid; }
  h2.new-page { page-break-before: always; }
  h3 { color: #be123c; font-size: 11pt; font-weight: 700; margin: 12pt 0 5pt 0; page-break-after: avoid; }
  p { margin: 5pt 0; orphans: 3; widows: 3; }
  ul { margin: 5pt 0; padding-left: 22pt; }
  li { margin: 2.5pt 0; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 8.5pt; }
  thead { display: table-header-group; }
  th { background: #0c4a6e; color: white; padding: 5pt 6pt; text-align: left; font-weight: 700; border: 1px solid #0c4a6e; }
  td { padding: 4pt 6pt; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr { page-break-inside: avoid; }
  tr:nth-child(even) td { background: #f8fafc; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.verdict { text-align: center; font-weight: 700; }
  td.verdict.star { color: #b45309; }
  td.verdict.keep { color: #047857; }
  td.verdict.watch { color: #b45309; }
  td.verdict.swap { color: #be123c; }
  td.verdict.liquidate { color: #92400e; }
  td.why { font-size: 7.5pt; color: #475569; font-style: italic; }
  table.snapshot td:first-child { width: 35%; color: #64748b; font-weight: 600; }
  table.dead-money td:first-child { width: 30%; }
  blockquote { background: #fef3c7; border-left: 4px solid #b45309; padding: 8pt 12pt; margin: 8pt 0; font-size: 9pt; color: #78350f; }
  strong { color: #0c4a6e; }
  .print-bar { background: #fef3c7; border-left: 4px solid #b45309; padding: 6pt 10pt; margin-bottom: 12pt; font-size: 8.5pt; color: #78350f; }
  @media print { .print-bar { display: none; } }
</style></head>
<body>

<div class="running-header">
  <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD. · ARN-286886</div>
  <div class="doc">${escape(familyBase)} Family · Portfolio Diagnostic Review · ${escape(reportDate)}</div>
</div>

<div class="running-footer">
  <div>Doc-ID: ${docId} · Confidential</div>
  <div>www.trustner.in</div>
</div>

${printBar}

<h1>${escape(familyBase.toUpperCase())} FAMILY — Portfolio Diagnostic Review</h1>
<h3>Report date: ${escape(reportDate)} · Prepared by Trustner Asset Services (ARN-286886)</h3>

<h2>1 · Family snapshot</h2>
${snapshot}
<p><strong>Bottom line:</strong> ${escape(narrative.bottomLine)}</p>
<blockquote><strong>Central finding:</strong> ${escape(narrative.centralFinding)}</blockquote>

${narrative.panLevelObservation ? `<h2>2 · PAN-level observation</h2><p>${escape(narrative.panLevelObservation)}</p>` : ''}

${deadMoney}

${sipAudit}

<h2 class="new-page">5 · Holdings tier analysis</h2>
<p>Per-holding verdict reasoning is generated by Trustner's analytical layer with cross-family context (e.g. fund quality elsewhere in this family's book, peer-median benchmarks, entry-timing penalties).</p>
<table>
  <thead><tr><th>Fund</th><th>Held by</th><th class="num">Invested</th><th class="num">Current</th><th class="num">XIRR</th><th>Verdict</th><th>Why</th></tr></thead>
  <tbody>${holdingsRows}</tbody>
</table>

${overlapRows || overlapSummary ? `<h2>6 · Portfolio overlap analysis</h2>
<p>${escape(overlapSummary)}</p>
${overlapRows ? `<table>
  <thead><tr><th>Category</th><th>Observation</th><th>Recommendation</th></tr></thead>
  <tbody>${overlapRows}</tbody>
</table>` : ''}` : ''}

${intl}

${taxRows || taxImpact.summary ? `<h2>8 · Tax impact</h2>
${taxRows ? `<table>
  <thead><tr><th>PAN</th><th>Fund</th><th>Gain</th><th>Tax type</th><th class="num">Est. tax</th><th>Phasing</th></tr></thead>
  <tbody>${taxRows}</tbody>
  <tfoot><tr><td colspan="4"><strong>NET</strong></td><td class="num"><strong>${escape(taxImpact.netTax)}</strong></td><td></td></tr></tfoot>
</table>` : ''}
${taxImpact.summary ? `<p><strong>${escape(taxImpact.summary)}</strong></p>` : ''}` : ''}

${scenarioRows ? `<h2>9 · Wealth math — 5-year scenarios</h2>
<table>
  <thead><tr><th>Scenario</th><th>Action</th><th class="num">5-yr AUM</th><th class="num">Marginal benefit</th></tr></thead>
  <tbody>${scenarioRows}</tbody>
</table>` : ''}

${topActionsList ? `<h2>10 · What to do FIRST</h2>
<ol style="padding-left:22pt;">${topActionsList}</ol>` : ''}

${whatNotList ? `<h2>11 · What NOT to do</h2>
<ul>${whatNotList}</ul>` : ''}

${directNote ? `<h2>12 · A direct note for the family</h2>
${directNote}` : ''}

${agendaRows ? `<h2 class="new-page">13 · Recommended meeting agenda</h2>
<table>
  <thead><tr><th>Time</th><th>Topic</th></tr></thead>
  <tbody>${agendaRows}</tbody>
</table>
${narrative.toneNote ? `<blockquote><strong>Tone for this meeting:</strong> ${escape(narrative.toneNote)}</blockquote>` : ''}` : ''}

${(narrative.anticipatedQA ?? []).length > 0 ? `<h2>14 · Anticipated Q&amp;A — for the advisor</h2>
${(narrative.anticipatedQA ?? [])
  .map(
    (qa) => `<p><strong>Q: ${escape(qa.question)}</strong><br/>${escape(qa.answer)}</p>`
  )
  .join('')}` : ''}

<hr style="margin-top: 18pt; border: none; border-top: 1px solid #cbd5e1;"/>
<p style="font-size: 7pt; color: #64748b; line-height: 1.4;">
Trustner Asset Services Pvt. Ltd. · AMFI ARN-286886 · CIN: U66301AS2023PTC025505<br/>
Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully. This report is not investment advice within the meaning of SEBI (IA) Regulations 2013; it is the considered analytical opinion of an AMFI-registered MFD prepared for the named family. The "Why" reasoning, tier observations, direct note, and Q&amp;A in this report are produced by Trustner's analytical layer with reviewer oversight and reflect Trustner's house view, not personalised investment advice. Final investment decisions rest with each PAN holder.
</p>

</body></html>`;
}
