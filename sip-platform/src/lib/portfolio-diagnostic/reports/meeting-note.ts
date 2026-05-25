/**
 * Meeting Note — internal advisor brief.
 *
 * NOT for client circulation. Rendered as a compact A4 portrait PDF
 * with the central finding, top actions, anticipated Q&A, and tone
 * calibration — the document Sangeeta/Ram reads in the 5 minutes
 * before the client meeting.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { ReportData } from '../report-data';
import type { NarrativeJSON } from '../narrative-engine';
import { formatInrFull, formatPct } from '../report-data';

function escape(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMeetingNoteHtml(
  data: ReportData,
  narrative: NarrativeJSON
): string {
  const familyName = data.familyName;
  // DB names may already end in "Family" (e.g. "Madhuchanda Dhar Family") —
  // strip it so the template's own " Family" suffix doesn't double up.
  const familyBase = familyName.replace(/\s+family\s*$/i, '');
  const reportDate = data.reportDate;
  const docId = `${familyBase.replace(/[^A-Z0-9]+/gi, '').slice(0, 6).toUpperCase()}-MN-${data.reportDateIso}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Meeting Note · ${escape(familyBase)} Family · ${escape(reportDate)}</title>
<style>
  @page { size: A4; margin: 22mm 16mm 22mm 16mm; }
  * { box-sizing: border-box; }
  html, body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 9.5pt; line-height: 1.5; margin: 0; padding: 0; }
  .running-header { position: fixed; top: 6mm; left: 16mm; right: 16mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #64748b; letter-spacing: 0.4px; border-bottom: 0.5px solid #cbd5e1; padding-bottom: 2mm; }
  .running-header .firm { font-weight: 700; color: #0c4a6e; }
  .running-header .doc { text-align: right; color: #be123c; font-weight: 700; }
  .running-footer { position: fixed; bottom: 6mm; left: 16mm; right: 16mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #94a3b8; border-top: 0.5px solid #cbd5e1; padding-top: 2mm; }
  h1 { color: #0c4a6e; font-size: 18pt; font-weight: 900; border-bottom: 3px solid #0c4a6e; padding-bottom: 5pt; margin: 0 0 4pt 0; }
  h1 + .subtitle { color: #be123c; font-weight: 700; font-size: 9pt; margin-bottom: 16pt; text-transform: uppercase; letter-spacing: 1px; }
  h2 { color: #0c4a6e; font-size: 13pt; font-weight: 800; border-left: 4px solid #0c4a6e; padding-left: 9pt; margin: 18pt 0 6pt 0; page-break-after: avoid; }
  h3 { color: #be123c; font-size: 10pt; font-weight: 700; margin: 10pt 0 4pt 0; page-break-after: avoid; }
  p { margin: 4pt 0; }
  ul, ol { margin: 4pt 0; padding-left: 22pt; }
  li { margin: 2.5pt 0; page-break-inside: avoid; }
  .lede { background: linear-gradient(135deg, #0c4a6e 0%, #1e40af 100%); color: white; padding: 12pt 14pt; border-radius: 4px; margin: 12pt 0; }
  .lede p { color: white; font-size: 10.5pt; line-height: 1.55; margin: 0; }
  .qa { background: #f8fafc; border-left: 3px solid #0c4a6e; padding: 8pt 12pt; margin: 6pt 0; page-break-inside: avoid; }
  .qa .q { color: #be123c; font-weight: 700; font-size: 9.5pt; }
  .qa .a { font-size: 9pt; margin-top: 3pt; color: #1a1a2e; }
  .tone-box { background: #fef3c7; border-left: 4px solid #b45309; padding: 8pt 12pt; margin: 12pt 0; font-size: 9pt; color: #78350f; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #e2e8f0; margin: 8pt 0; }
  .kpis .kpi { padding: 6pt; text-align: center; border-right: 1px solid #e2e8f0; }
  .kpis .kpi:last-child { border-right: none; }
  .kpis .label { font-size: 6.5pt; color: #64748b; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
  .kpis .value { font-size: 12pt; font-weight: 900; color: #0c4a6e; margin-top: 2pt; }
  .confidential { background: #be123c; color: white; padding: 4pt 8pt; font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-align: center; margin-bottom: 8pt; border-radius: 2px; }
  strong { color: #0c4a6e; }
</style></head>
<body>

<div class="running-header">
  <div class="firm">TRUSTNER ASSET SERVICES PVT. LTD. · ARN-286886</div>
  <div class="doc">INTERNAL — DO NOT CIRCULATE</div>
</div>

<div class="running-footer">
  <div>Doc-ID: ${docId} · Internal meeting brief</div>
  <div>www.trustner.in</div>
</div>

<div class="confidential">⚠ Internal — pre-meeting brief for Sangeeta &amp; Ram only · ${escape(reportDate)}</div>

<h1>MEETING NOTE — ${escape(familyBase)} Family</h1>
<div class="subtitle">Pre-call brief · ${escape(reportDate)} · For: Sangeeta &amp; Ram</div>

<div class="kpis">
  <div class="kpi"><div class="label">Family AUM</div><div class="value">${formatInrFull(data.currentValueInr)}</div></div>
  <div class="kpi"><div class="label">Gain</div><div class="value">${formatInrFull(data.totalGainInr)}</div></div>
  <div class="kpi"><div class="label">Family XIRR</div><div class="value">${formatPct(data.familyXirrPct, 2)}</div></div>
  <div class="kpi"><div class="label">PANs</div><div class="value">${data.numEntities}</div></div>
</div>

<h2>The central finding — open the meeting with this</h2>
<div class="lede"><p>${escape(narrative.centralFinding)}</p></div>

<h2>The story to tell — in order</h2>
<p><strong>1. Open with the win (5 min)</strong></p>
<p>${escape(narrative.bottomLine)}</p>

${narrative.deadMoneyFindings ? `
<p><strong>2. Surface the dead-money positions (10-15 min)</strong></p>
<p>${escape(narrative.deadMoneyFindings.headline)} · ${escape(narrative.deadMoneyFindings.opportunityCost)}</p>
` : ''}

${narrative.sipAudit ? `
<p><strong>3. ⚠ TOP OF AGENDA — SIP audit findings (5 min)</strong></p>
<p>${escape(narrative.sipAudit.headline)} · Recommendation: ${escape(narrative.sipAudit.recommendation)}</p>
` : ''}

<p><strong>4. The top actions (15 min)</strong></p>
<ol>
${(narrative.topActions ?? []).map((a) => `<li>${escape(a)}</li>`).join('')}
</ol>

<h2>Tone calibration — read this before the meeting</h2>
<div class="tone-box">${escape(narrative.toneNote)}</div>

<h2 style="page-break-before: always;">Anticipated client questions — scripted answers</h2>
<p style="font-size:8.5pt;color:#64748b;font-style:italic;">Use these verbatim or as starting points. They're written in the advisor's voice.</p>
${(narrative.anticipatedQA ?? [])
  .map(
    (qa) => `<div class="qa">
      <div class="q">Q: ${escape(qa.question)}</div>
      <div class="a">A: ${escape(qa.answer)}</div>
    </div>`
  )
  .join('')}

<h2>What NOT to discuss yet</h2>
<ul>
${(narrative.whatNotToDo ?? []).map((w) => `<li>${escape(w)}</li>`).join('')}
</ul>

<h2>Recommended meeting agenda</h2>
<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-top:6pt;">
  <thead><tr style="background:#0c4a6e;color:white;"><th style="padding:5pt 6pt;text-align:left;width:20%;">Time</th><th style="padding:5pt 6pt;text-align:left;">Topic</th></tr></thead>
  <tbody>
  ${(narrative.meetingAgenda ?? [])
    .map(
      (a) =>
        `<tr><td style="padding:4pt 6pt;border-bottom:1px solid #e2e8f0;"><strong>${escape(a.time)}</strong></td><td style="padding:4pt 6pt;border-bottom:1px solid #e2e8f0;">${escape(a.topic)}</td></tr>`
    )
    .join('')}
  </tbody>
</table>

<h2>Documents to take to the meeting</h2>
<ol>
  <li><strong>Full Portfolio Review (2-pp tabular)</strong> — project on screen during the discussion</li>
  <li><strong>Action Sheet (1-pp portrait)</strong> — print, get the family to tick + sign each row</li>
  <li><strong>Narrative Review (this report's sibling)</strong> — hand the family to read after the meeting</li>
  <li><strong>This Meeting Note</strong> — DO NOT hand to client. Internal only.</li>
</ol>

<hr style="margin-top: 18pt; border: none; border-top: 1px solid #cbd5e1;"/>
<p style="font-size: 7pt; color: #64748b; line-height: 1.4; text-align: center;">
⚠ <strong>INTERNAL DOCUMENT</strong> — Trustner Asset Services Pvt. Ltd. · ARN-286886<br/>
Pre-meeting brief. Not for client circulation. Do not forward, print, or email outside Trustner.
</p>

</body></html>`;
}
