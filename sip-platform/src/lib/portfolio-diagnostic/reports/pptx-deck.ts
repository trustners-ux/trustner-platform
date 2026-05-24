/**
 * Family Meeting Deck — PowerPoint deliverable
 *
 * Mirrors the Rohit Jain Family May 2026 reference:
 *   /Portfolio Review/Rohit Jain Family May 2026/04_Family_Meeting_Deck.pptx
 *
 * 10 slides (16:9):
 *   1. Title — branded cover
 *   2. Agenda
 *   3. The Big Picture — KPI snapshot
 *   4. Verdict at a Glance — tier counts
 *   5. STAR holdings
 *   6. KEEP / WATCH holdings
 *   7. SWAP recommendations
 *   8. LIQUIDATE recommendations
 *   9. Wealth Projection — stay vs realign
 *   10. Next Steps + closing
 *
 * Uses pptxgenjs (works in Node serverless). Returns a Buffer.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import PptxGenJS from 'pptxgenjs';
import { ReportData, ReportHolding, formatInrShort, formatInrFull, formatPct } from '../report-data';

// Trustner brand colors (without #)
const C = {
  teal: '0F766E',
  tealDark: '115E59',
  tealLight: 'CCFBF1',
  teal50: 'F0FDFA',
  amber: 'B45309',
  amberLight: 'FEF3C7',
  green: '16A34A',
  greenLight: 'DCFCE7',
  red: 'DC2626',
  redLight: 'FEE2E2',
  watch: 'D97706',
  watchLight: 'FFEDD5',
  gray: '6B5F54',
  grayLight: 'E5E5E5',
  navy: '1A1A2E',
  white: 'FFFFFF',
  cream: 'FAFAF8',
};

const SLIDE_W = 13.333; // 16:9 widescreen
const SLIDE_H = 7.5;

function fontL(bold = false) { return { fontFace: 'Calibri', fontSize: 14, color: C.navy, bold }; }

function addHeader(slide: PptxGenJS.Slide, pptx: PptxGenJS, pageNum: number, total: number, sectionTitle: string): void {
  // Top header bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: 0.5, fill: { color: C.teal }, line: { color: C.teal },
  });
  slide.addText('TRUSTNER ASSET SERVICES PVT. LTD.', {
    x: 0.4, y: 0.05, w: 6, h: 0.4,
    fontFace: 'Calibri', fontSize: 11, color: C.white, bold: true, valign: 'middle',
  });
  slide.addText(`${sectionTitle}  •  Slide ${pageNum} of ${total}`, {
    x: SLIDE_W - 5, y: 0.05, w: 4.6, h: 0.4,
    fontFace: 'Calibri', fontSize: 10, color: C.tealLight, align: 'right', valign: 'middle',
  });
}

function addFooter(slide: PptxGenJS.Slide, pptx: PptxGenJS, data: ReportData): void {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.35, fill: { color: C.navy }, line: { color: C.navy },
  });
  slide.addText(`ARN-286886  •  ${data.reportDate}  •  Doc: ${data.documentId}`, {
    x: 0.4, y: SLIDE_H - 0.32, w: 6, h: 0.28,
    fontFace: 'Calibri', fontSize: 8, color: C.white, valign: 'middle',
  });
  slide.addText(`Prepared by ${data.rmName}`, {
    x: SLIDE_W - 5, y: SLIDE_H - 0.32, w: 4.6, h: 0.28,
    fontFace: 'Calibri', fontSize: 8, color: C.tealLight, align: 'right', valign: 'middle',
  });
}

function kpiTile(slide: PptxGenJS.Slide, pptx: PptxGenJS, x: number, y: number, w: number, h: number, label: string, value: string, bg = C.teal50, fg = C.teal): void {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h, fill: { color: bg }, line: { color: fg, width: 1.5 },
  });
  slide.addText(label, {
    x: x + 0.1, y: y + 0.15, w: w - 0.2, h: 0.3,
    fontFace: 'Calibri', fontSize: 10, color: fg, bold: true, align: 'center',
  });
  slide.addText(value, {
    x: x + 0.1, y: y + 0.5, w: w - 0.2, h: h - 0.6,
    fontFace: 'Calibri', fontSize: 24, color: fg, bold: true, align: 'center', valign: 'middle',
  });
}

function tierTile(slide: PptxGenJS.Slide, pptx: PptxGenJS, x: number, y: number, w: number, h: number, count: number, label: string, amt: string, bg: string): void {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h, fill: { color: bg }, line: { color: bg },
  });
  slide.addText(String(count), {
    x, y: y + 0.2, w, h: 1.4,
    fontFace: 'Calibri', fontSize: 48, color: C.white, bold: true, align: 'center', valign: 'middle',
  });
  slide.addText(label, {
    x, y: y + 1.7, w, h: 0.4,
    fontFace: 'Calibri', fontSize: 14, color: C.white, bold: true, align: 'center',
  });
  slide.addText(amt, {
    x, y: y + 2.15, w, h: 0.3,
    fontFace: 'Calibri', fontSize: 11, color: C.white, align: 'center',
  });
}

function holdingsTable(slide: PptxGenJS.Slide, pptx: PptxGenJS, rows: ReportHolding[], x: number, y: number, w: number, h: number, mode: 'standard' | 'swap'): void {
  const headers: string[] = mode === 'swap'
    ? ['Fund (Exit)', 'Held By', 'Invested', 'Current', '3Y CAGR', 'Replace With']
    : ['Fund', 'Held By', 'Invested', 'Current', 'XIRR', '3Y CAGR'];

  const headerRow: PptxGenJS.TableRow = headers.map((h) => ({
    text: h,
    options: {
      bold: true, fontFace: 'Calibri', fontSize: 11, color: C.white,
      fill: { color: C.tealDark }, align: 'center', valign: 'middle',
    },
  }));

  const dataRows: PptxGenJS.TableRow[] = rows.slice(0, 8).map((r, idx) => {
    const altBg = idx % 2 === 1 ? C.cream : C.white;
    if (mode === 'swap') {
      return [
        { text: r.fundName, options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg } } },
        { text: r.entityName, options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg } } },
        { text: formatInrFull(r.investedInr), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'right' } },
        { text: formatInrFull(r.currentValueInr), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'right' } },
        { text: formatPct(r.cagr3y), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'center' } },
        { text: r.preferredReplacementFundName ?? 'Per preferred list', options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, bold: true, color: C.amber } },
      ];
    }
    return [
      { text: r.fundName, options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg } } },
      { text: r.entityName, options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg } } },
      { text: formatInrFull(r.investedInr), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'right' } },
      { text: formatInrFull(r.currentValueInr), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'right' } },
      { text: formatPct(r.xirrPct), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'center' } },
      { text: formatPct(r.cagr3y), options: { fontFace: 'Calibri', fontSize: 9, fill: { color: altBg }, align: 'center' } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x, y, w,
    colW: mode === 'swap'
      ? [w * 0.28, w * 0.16, w * 0.13, w * 0.13, w * 0.10, w * 0.20]
      : [w * 0.32, w * 0.18, w * 0.13, w * 0.13, w * 0.12, w * 0.12],
    border: { type: 'solid', color: 'D6D3D1', pt: 0.5 },
  });

  if (rows.length > 8) {
    slide.addText(`+ ${rows.length - 8} more holdings — see Full Portfolio Review PDF`, {
      x, y: y + h - 0.3, w, h: 0.25,
      fontFace: 'Calibri', fontSize: 9, italic: true, color: C.gray, align: 'center',
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

export async function buildFamilyMeetingDeckPptx(data: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5
  pptx.author = data.rmName;
  pptx.company = 'Trustner Asset Services Pvt. Ltd.';
  pptx.title = `${data.familyName} — Portfolio Review Meeting Deck`;
  pptx.subject = data.documentId;

  const TOTAL_SLIDES = 10;

  // ── SLIDE 1 — TITLE ──
  const s1 = pptx.addSlide();
  s1.background = { color: C.teal };
  // Logo / brand band
  s1.addText('TRUSTNER', {
    x: 0.5, y: 0.6, w: 12, h: 0.7,
    fontFace: 'Calibri', fontSize: 36, color: C.white, bold: true, charSpacing: 12,
  });
  s1.addText('ASSET SERVICES PVT. LTD.', {
    x: 0.5, y: 1.3, w: 12, h: 0.4,
    fontFace: 'Calibri', fontSize: 14, color: C.tealLight, charSpacing: 6,
  });
  // Title block
  s1.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 2.8, w: 12.3, h: 2.4, fill: { color: C.white }, line: { color: C.tealLight, width: 2 },
  });
  s1.addText('Portfolio Diagnostic Review', {
    x: 0.7, y: 3, w: 12, h: 0.7,
    fontFace: 'Calibri', fontSize: 28, color: C.teal, bold: true,
  });
  s1.addText(`Family Meeting Pack — ${data.familyName}`, {
    x: 0.7, y: 3.65, w: 12, h: 0.5,
    fontFace: 'Calibri', fontSize: 18, color: C.navy,
  });
  s1.addText(`${data.numHoldings} holdings · ${data.numEntities} entities · AUM ${formatInrShort(data.currentValueInr)} · Family XIRR ${formatPct(data.familyXirrPct, 2)}`, {
    x: 0.7, y: 4.2, w: 12, h: 0.4,
    fontFace: 'Calibri', fontSize: 12, color: C.gray,
  });
  s1.addText(`Prepared by ${data.rmName}`, {
    x: 0.7, y: 4.65, w: 12, h: 0.3,
    fontFace: 'Calibri', fontSize: 11, color: C.gray, italic: true,
  });

  // Footer line
  s1.addText('AMFI Registered Mutual Fund Distributor  •  ARN-286886  •  www.trustner.in', {
    x: 0.5, y: 6.5, w: 12.3, h: 0.4,
    fontFace: 'Calibri', fontSize: 10, color: C.tealLight, align: 'center',
  });
  s1.addText(`${data.reportDate}  •  Document: ${data.documentId}`, {
    x: 0.5, y: 6.9, w: 12.3, h: 0.4,
    fontFace: 'Calibri', fontSize: 10, color: C.white, align: 'center', bold: true,
  });

  // ── SLIDE 2 — AGENDA ──
  const s2 = pptx.addSlide();
  s2.background = { color: C.white };
  addHeader(s2, pptx, 2, TOTAL_SLIDES, 'Meeting Agenda');
  s2.addText("Today's Agenda", {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 26, color: C.teal, bold: true,
  });
  const agenda = [
    { num: '1', topic: 'The Big Picture — your portfolio in one snapshot' },
    { num: '2', topic: 'Verdict at a glance — STAR / KEEP / WATCH / SWAP / LIQUIDATE' },
    { num: '3', topic: 'Your STAR holdings — what we keep doing' },
    { num: '4', topic: 'Solid keeps + new funds in the J-curve' },
    { num: '5', topic: 'SWAP recommendations — better alternatives available' },
    { num: '6', topic: 'Legacy LIQUIDATE — cleanup with no tax impact' },
    { num: '7', topic: 'Wealth projection — Stay vs Re-align over 36 months' },
    { num: '8', topic: 'Next steps — Action Sheet sign-off' },
  ];
  agenda.forEach((a, i) => {
    s2.addShape(pptx.ShapeType.ellipse, {
      x: 0.7, y: 1.65 + i * 0.55, w: 0.5, h: 0.5, fill: { color: C.teal }, line: { color: C.teal },
    });
    s2.addText(a.num, {
      x: 0.7, y: 1.65 + i * 0.55, w: 0.5, h: 0.5,
      fontFace: 'Calibri', fontSize: 16, color: C.white, bold: true, align: 'center', valign: 'middle',
    });
    s2.addText(a.topic, {
      x: 1.4, y: 1.65 + i * 0.55, w: 11, h: 0.5,
      fontFace: 'Calibri', fontSize: 14, color: C.navy, valign: 'middle',
    });
  });
  addFooter(s2, pptx, data);

  // ── SLIDE 3 — THE BIG PICTURE (KPI snapshot) ──
  const s3 = pptx.addSlide();
  s3.background = { color: C.white };
  addHeader(s3, pptx, 3, TOTAL_SLIDES, 'The Big Picture');
  s3.addText(`${data.familyName} — Portfolio Snapshot`, {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 24, color: C.teal, bold: true,
  });
  s3.addText(`As of ${data.reportDate}`, {
    x: 0.5, y: 1.4, w: 12.3, h: 0.3,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  // Row 1: 4 main KPIs
  kpiTile(s3, pptx, 0.5, 2.0, 3.0, 1.6, 'TOTAL INVESTED', formatInrShort(data.totalInvestedInr));
  kpiTile(s3, pptx, 3.7, 2.0, 3.0, 1.6, 'CURRENT VALUE', formatInrShort(data.currentValueInr));
  kpiTile(
    s3, pptx, 6.9, 2.0, 3.0, 1.6, 'GAIN',
    `${data.totalGainInr >= 0 ? '+' : ''}${formatInrShort(data.totalGainInr)}`,
    data.totalGainInr >= 0 ? C.greenLight : C.redLight,
    data.totalGainInr >= 0 ? C.green : C.red
  );
  kpiTile(s3, pptx, 10.1, 2.0, 2.7, 1.6, 'FAMILY XIRR', formatPct(data.familyXirrPct, 2));

  // Row 2: 4 structural KPIs
  kpiTile(s3, pptx, 0.5, 3.85, 3.0, 1.6, 'HOLDINGS', String(data.numHoldings));
  kpiTile(s3, pptx, 3.7, 3.85, 3.0, 1.6, 'UNIQUE FUNDS', String(data.numUniqueFunds));
  kpiTile(s3, pptx, 6.9, 3.85, 3.0, 1.6, 'ENTITIES / PANs', String(data.numEntities));
  kpiTile(s3, pptx, 10.1, 3.85, 2.7, 1.6, 'AMCs', String(data.numAmcs));

  // Big "What this means" callout
  s3.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 5.65, w: 12.3, h: 1.3, fill: { color: C.teal50 }, line: { color: C.teal, width: 2 },
  });
  s3.addText('Bottom line:', {
    x: 0.7, y: 5.75, w: 2, h: 0.4,
    fontFace: 'Calibri', fontSize: 14, color: C.teal, bold: true,
  });
  const bottomLine = data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio >= 70
    ? `${(data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio).toFixed(0)}% of the portfolio is in top-quartile or solid funds — continue the existing SIPs.`
    : data.tierTotals.swap.pctOfPortfolio > 25
    ? `${data.tierTotals.swap.pctOfPortfolio.toFixed(0)}% of the portfolio is in below-median funds — re-align ${data.swapCount} holdings into category-better alternatives.`
    : 'Portfolio is broadly healthy. Small re-alignment available; see the action plan in subsequent slides.';
  s3.addText(bottomLine, {
    x: 0.7, y: 6.1, w: 11.9, h: 0.8,
    fontFace: 'Calibri', fontSize: 13, color: C.navy, valign: 'top',
  });

  addFooter(s3, pptx, data);

  // ── SLIDE 4 — VERDICT AT A GLANCE ──
  const s4 = pptx.addSlide();
  s4.background = { color: C.white };
  addHeader(s4, pptx, 4, TOTAL_SLIDES, 'Verdict at a Glance');
  s4.addText('Where your holdings stand', {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 24, color: C.teal, bold: true,
  });
  s4.addText('Each holding scored on 4 criteria: 3Y CAGR (30%), 5Y CAGR (25%), Manager continuity (20%), Category quartile (25%).', {
    x: 0.5, y: 1.45, w: 12.3, h: 0.4,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  // 5 tier tiles
  const tileW = 2.45;
  const tileGap = 0.05;
  const tileStartX = 0.5;
  tierTile(s4, pptx, tileStartX + 0 * (tileW + tileGap), 2.2, tileW, 2.5,
    data.tierTotals.star.count, '★ STAR', formatInrShort(data.tierTotals.star.investedInr), C.amber);
  tierTile(s4, pptx, tileStartX + 1 * (tileW + tileGap), 2.2, tileW, 2.5,
    data.tierTotals.keep.count, 'KEEP', formatInrShort(data.tierTotals.keep.investedInr), C.green);
  tierTile(s4, pptx, tileStartX + 2 * (tileW + tileGap), 2.2, tileW, 2.5,
    data.tierTotals.watch.count, 'WATCH', formatInrShort(data.tierTotals.watch.investedInr), C.watch);
  tierTile(s4, pptx, tileStartX + 3 * (tileW + tileGap), 2.2, tileW, 2.5,
    data.tierTotals.swap.count, 'SWAP', formatInrShort(data.tierTotals.swap.investedInr), C.red);
  tierTile(s4, pptx, tileStartX + 4 * (tileW + tileGap), 2.2, tileW, 2.5,
    data.tierTotals.liquidate.count, 'LIQUIDATE', formatInrFull(data.tierTotals.liquidate.investedInr), C.gray);

  // What each verdict means
  const meanings = [
    { tier: '★ STAR', what: 'Top-quartile fund. Continue SIP — no action.', color: C.amber },
    { tier: 'KEEP', what: 'Solid; in J-curve for young SIPs. Hold.', color: C.green },
    { tier: 'WATCH', what: 'Too new (< 36 mo). Re-assess at next review.', color: C.watch },
    { tier: 'SWAP', what: 'Better alternative exists. Action this week.', color: C.red },
    { tier: 'LIQUIDATE', what: 'Immaterial legacy. Cleanup with no tax cost.', color: C.gray },
  ];
  meanings.forEach((m, i) => {
    s4.addText(m.tier, {
      x: 0.5, y: 5.05 + i * 0.32, w: 2, h: 0.3,
      fontFace: 'Calibri', fontSize: 11, color: m.color, bold: true,
    });
    s4.addText(m.what, {
      x: 2.5, y: 5.05 + i * 0.32, w: 10.3, h: 0.3,
      fontFace: 'Calibri', fontSize: 11, color: C.navy,
    });
  });

  addFooter(s4, pptx, data);

  // ── SLIDE 5 — STAR HOLDINGS ──
  const s5 = pptx.addSlide();
  s5.background = { color: C.white };
  addHeader(s5, pptx, 5, TOTAL_SLIDES, 'Tier A — STAR Holdings');
  s5.addText(`Your top-quartile holdings — keep doing what works`, {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 22, color: C.amber, bold: true,
  });
  s5.addText(`${data.tierTotals.star.count} holdings · ${formatInrShort(data.tierTotals.star.investedInr)} invested · ${data.tierTotals.star.pctOfPortfolio.toFixed(0)}% of the portfolio`, {
    x: 0.5, y: 1.4, w: 12.3, h: 0.3,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  if (data.starHoldings.length > 0) {
    holdingsTable(s5, pptx, data.starHoldings, 0.5, 1.9, 12.3, 5.0, 'standard');
  } else {
    s5.addText('No STAR-tier holdings in this portfolio yet.', {
      x: 0.5, y: 3, w: 12.3, h: 0.6,
      fontFace: 'Calibri', fontSize: 16, italic: true, color: C.gray, align: 'center',
    });
  }
  addFooter(s5, pptx, data);

  // ── SLIDE 6 — KEEP + WATCH ──
  const s6 = pptx.addSlide();
  s6.background = { color: C.white };
  addHeader(s6, pptx, 6, TOTAL_SLIDES, 'Tier B — KEEP + WATCH');
  s6.addText(`Solid funds + new entries in the J-curve`, {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 22, color: C.green, bold: true,
  });
  s6.addText(`${data.keepHoldings.length} KEEP · ${data.watchHoldings.length} WATCH · ${formatInrShort(data.tierTotals.keep.investedInr + data.tierTotals.watch.investedInr)} combined`, {
    x: 0.5, y: 1.4, w: 12.3, h: 0.3,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  const keepWatchRows = [...data.keepHoldings, ...data.watchHoldings];
  if (keepWatchRows.length > 0) {
    holdingsTable(s6, pptx, keepWatchRows, 0.5, 1.9, 12.3, 5.0, 'standard');
  } else {
    s6.addText('No KEEP / WATCH holdings.', {
      x: 0.5, y: 3, w: 12.3, h: 0.6,
      fontFace: 'Calibri', fontSize: 16, italic: true, color: C.gray, align: 'center',
    });
  }
  addFooter(s6, pptx, data);

  // ── SLIDE 7 — SWAP RECOMMENDATIONS ──
  const s7 = pptx.addSlide();
  s7.background = { color: C.white };
  addHeader(s7, pptx, 7, TOTAL_SLIDES, 'Tier C — SWAP');
  s7.addText(`Re-allocation Plan — better alternatives available`, {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 22, color: C.red, bold: true,
  });
  s7.addText(`${data.swapHoldings.length} swaps · ${formatInrShort(data.tierTotals.swap.investedInr)} to be re-allocated`, {
    x: 0.5, y: 1.4, w: 12.3, h: 0.3,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  if (data.swapHoldings.length > 0) {
    holdingsTable(s7, pptx, data.swapHoldings, 0.5, 1.9, 12.3, 5.0, 'swap');
  } else {
    s7.addShape(pptx.ShapeType.rect, {
      x: 3, y: 3, w: 7.3, h: 1.5, fill: { color: C.greenLight }, line: { color: C.green, width: 2 },
    });
    s7.addText('✓ NO SWAPS REQUIRED', {
      x: 3, y: 3.2, w: 7.3, h: 0.5,
      fontFace: 'Calibri', fontSize: 20, color: C.green, bold: true, align: 'center',
    });
    s7.addText('All holdings are STAR / KEEP / WATCH. Continue all existing SIPs.', {
      x: 3, y: 3.8, w: 7.3, h: 0.5,
      fontFace: 'Calibri', fontSize: 12, color: C.green, align: 'center',
    });
  }
  addFooter(s7, pptx, data);

  // ── SLIDE 8 — LIQUIDATE + GRAND TOTAL ──
  const s8 = pptx.addSlide();
  s8.background = { color: C.white };
  addHeader(s8, pptx, 8, TOTAL_SLIDES, 'Tier D — LIQUIDATE');
  s8.addText(`Legacy Cleanup — immaterial positions`, {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 22, color: C.gray, bold: true,
  });
  s8.addText(`${data.liquidateHoldings.length} cleanups · ${formatInrFull(data.tierTotals.liquidate.investedInr)} total`, {
    x: 0.5, y: 1.4, w: 12.3, h: 0.3,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  if (data.liquidateHoldings.length > 0) {
    holdingsTable(s8, pptx, data.liquidateHoldings, 0.5, 1.9, 12.3, 3.0, 'standard');
  } else {
    s8.addText('No legacy positions to clean up.', {
      x: 0.5, y: 2.5, w: 12.3, h: 0.5,
      fontFace: 'Calibri', fontSize: 14, italic: true, color: C.gray, align: 'center',
    });
  }

  // Grand total bar
  s8.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 5.5, w: 12.3, h: 1.0, fill: { color: C.amber }, line: { color: C.amber },
  });
  s8.addText('GRAND TOTAL — REALLOCATION', {
    x: 0.7, y: 5.6, w: 6, h: 0.4,
    fontFace: 'Calibri', fontSize: 13, color: C.white, bold: true, valign: 'middle',
  });
  s8.addText(formatInrFull(data.totalReallocationInr), {
    x: 7, y: 5.6, w: 5.7, h: 0.4,
    fontFace: 'Calibri', fontSize: 18, color: C.white, bold: true, align: 'right', valign: 'middle',
  });
  s8.addText(`${data.swapCount} swaps + ${data.liquidateCount} liquidations · Estimated tax: ~ ₹0 (within ₹1.25L LTCG exemption)`, {
    x: 0.7, y: 6.05, w: 12, h: 0.4,
    fontFace: 'Calibri', fontSize: 11, color: C.amberLight, valign: 'middle',
  });

  addFooter(s8, pptx, data);

  // ── SLIDE 9 — WEALTH PROJECTION ──
  const s9 = pptx.addSlide();
  s9.background = { color: C.white };
  addHeader(s9, pptx, 9, TOTAL_SLIDES, 'Wealth Projection');
  s9.addText('What the next 36 months could look like', {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 24, color: C.teal, bold: true,
  });
  s9.addText('Projections assume the portfolio continues compounding at the current / improved XIRR. No additional cash injection.', {
    x: 0.5, y: 1.4, w: 12.3, h: 0.4,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true,
  });

  const currentXirr = (data.familyXirrPct ?? 0) / 100;
  const improvedXirr = currentXirr + 0.03;
  const stayValue = data.currentValueInr * Math.pow(1 + currentXirr, 3);
  const realignValue = data.currentValueInr * Math.pow(1 + improvedXirr, 3);
  const fdValue = data.currentValueInr * Math.pow(1.065, 3);

  // 3 scenario tiles
  const projTileH = 3.0;
  const projY = 2.1;
  const projTileW = 4.0;
  const projGap = 0.15;

  // Exit / FD
  s9.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: projY, w: projTileW, h: projTileH, fill: { color: C.redLight }, line: { color: C.red, width: 2 },
  });
  s9.addText('Exit → FD @ 6.5%', { x: 0.5, y: projY + 0.2, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: C.red, bold: true, align: 'center' });
  s9.addText(formatInrShort(fdValue), { x: 0.5, y: projY + 0.7, w: projTileW, h: 1.0, fontFace: 'Calibri', fontSize: 36, color: C.red, bold: true, align: 'center', valign: 'middle' });
  s9.addText('Conservative — no equity exposure', { x: 0.5, y: projY + 1.9, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 10, color: C.red, align: 'center' });
  s9.addText(`vs Stay: ${fdValue - stayValue >= 0 ? '+' : ''}${formatInrShort(fdValue - stayValue)}`, { x: 0.5, y: projY + 2.3, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 12, color: C.navy, align: 'center', bold: true });

  // Stay course
  s9.addShape(pptx.ShapeType.rect, {
    x: 0.5 + projTileW + projGap, y: projY, w: projTileW, h: projTileH, fill: { color: C.teal50 }, line: { color: C.teal, width: 2 },
  });
  s9.addText('Stay Course', { x: 0.5 + projTileW + projGap, y: projY + 0.2, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: C.teal, bold: true, align: 'center' });
  s9.addText(formatInrShort(stayValue), { x: 0.5 + projTileW + projGap, y: projY + 0.7, w: projTileW, h: 1.0, fontFace: 'Calibri', fontSize: 36, color: C.teal, bold: true, align: 'center', valign: 'middle' });
  s9.addText(`At ${formatPct(data.familyXirrPct, 2)} XIRR`, { x: 0.5 + projTileW + projGap, y: projY + 1.9, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 10, color: C.teal, align: 'center' });
  s9.addText('Baseline', { x: 0.5 + projTileW + projGap, y: projY + 2.3, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 12, color: C.navy, align: 'center', bold: true });

  // Re-align (recommended)
  s9.addShape(pptx.ShapeType.rect, {
    x: 0.5 + 2 * (projTileW + projGap), y: projY, w: projTileW, h: projTileH, fill: { color: C.greenLight }, line: { color: C.green, width: 3 },
  });
  s9.addText('Re-align (recommended)', { x: 0.5 + 2 * (projTileW + projGap), y: projY + 0.2, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: C.green, bold: true, align: 'center' });
  s9.addText(formatInrShort(realignValue), { x: 0.5 + 2 * (projTileW + projGap), y: projY + 0.7, w: projTileW, h: 1.0, fontFace: 'Calibri', fontSize: 36, color: C.green, bold: true, align: 'center', valign: 'middle' });
  s9.addText(`At ${((currentXirr + 0.03) * 100).toFixed(2)}% XIRR (current +3%)`, { x: 0.5 + 2 * (projTileW + projGap), y: projY + 1.9, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 10, color: C.green, align: 'center' });
  s9.addText(`vs Stay: +${formatInrShort(realignValue - stayValue)}`, { x: 0.5 + 2 * (projTileW + projGap), y: projY + 2.3, w: projTileW, h: 0.4, fontFace: 'Calibri', fontSize: 12, color: C.green, align: 'center', bold: true });

  // Bottom takeaway
  s9.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 5.4, w: 12.3, h: 1.6, fill: { color: C.teal }, line: { color: C.teal },
  });
  s9.addText('Why this matters:', { x: 0.7, y: 5.5, w: 4, h: 0.4, fontFace: 'Calibri', fontSize: 14, color: C.white, bold: true });
  s9.addText(
    `Re-aligning ${data.swapCount} mid-pack holdings into category-better alternatives adds ` +
    `~${formatInrShort(realignValue - stayValue)} in 36 months. Cost: ~ ₹0 in tax (LTCG within ₹1.25L exemption).`,
    { x: 0.7, y: 5.9, w: 11.9, h: 1.0, fontFace: 'Calibri', fontSize: 13, color: C.white, valign: 'top' }
  );

  addFooter(s9, pptx, data);

  // ── SLIDE 10 — NEXT STEPS ──
  const s10 = pptx.addSlide();
  s10.background = { color: C.white };
  addHeader(s10, pptx, 10, TOTAL_SLIDES, 'Next Steps');
  s10.addText('Next Steps', {
    x: 0.5, y: 0.8, w: 12.3, h: 0.6,
    fontFace: 'Calibri', fontSize: 28, color: C.teal, bold: true,
  });

  const steps = [
    {
      title: 'This week',
      items: data.swapHoldings.length > 0 || data.liquidateHoldings.length > 0
        ? [
            `Sign the Action Sheet for ${data.swapCount} swap${data.swapCount !== 1 ? 's' : ''}${data.liquidateCount > 0 ? ` + ${data.liquidateCount} cleanup${data.liquidateCount !== 1 ? 's' : ''}` : ''}`,
            'Get co-authorisation from any joint-PAN holders',
            `Execute via Trustner — settles T+1 to T+3`,
          ]
        : [
            'Continue all existing SIPs as scheduled',
            'No action required — portfolio is healthy',
          ],
    },
    {
      title: 'Next 3 months',
      items: [
        'Trustner monitors new SIPs through J-curve',
        'Monthly NAV check via WhatsApp / email',
        data.watchHoldings.length > 0
          ? `Re-assess ${data.watchHoldings.length} WATCH-tier holding${data.watchHoldings.length !== 1 ? 's' : ''} at the 12-month mark`
          : 'Quarterly health-check in 3 months',
      ],
    },
    {
      title: 'Next quarterly review',
      items: [
        `Scheduled ~90 days from today`,
        'Full re-evaluation against latest category benchmarks',
        'Adjust SIP amounts if cash flow changes',
      ],
    },
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + i * 4.27;
    s10.addShape(pptx.ShapeType.rect, {
      x, y: 1.8, w: 4.15, h: 4.5, fill: { color: C.teal50 }, line: { color: C.teal, width: 1.5 },
    });
    s10.addText(s.title, {
      x: x + 0.1, y: 1.95, w: 3.95, h: 0.5,
      fontFace: 'Calibri', fontSize: 16, color: C.teal, bold: true, align: 'center',
    });
    s.items.forEach((item, j) => {
      s10.addText(`• ${item}`, {
        x: x + 0.2, y: 2.6 + j * 0.85, w: 3.75, h: 0.8,
        fontFace: 'Calibri', fontSize: 11, color: C.navy, valign: 'top',
      });
    });
  });

  // Closing line
  s10.addText('Questions? Call Trustner — we answer in under 4 hours on business days.', {
    x: 0.5, y: 6.5, w: 12.3, h: 0.4,
    fontFace: 'Calibri', fontSize: 12, color: C.gray, italic: true, align: 'center',
  });

  addFooter(s10, pptx, data);

  // Serialize
  const arrayBuffer = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(arrayBuffer as ArrayBuffer);
}
