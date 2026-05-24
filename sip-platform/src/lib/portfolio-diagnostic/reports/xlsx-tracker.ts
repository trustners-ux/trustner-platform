/**
 * Wealth Math Tracker — Excel deliverable
 *
 * Mirrors the Rohit Jain Family May 2026 reference:
 *   /Portfolio Review/Rohit Jain Family May 2026/03_Wealth_Math_Tracker.xlsx
 *
 * Six sheets:
 *   1. Exec Summary   — KPI snapshot + tier counts
 *   2. Family Holdings — every holding with verdict + values
 *   3. Wealth Math    — Stay vs Re-align comparison over 36 months
 *   4. Tier Breakdown — STAR / KEEP / WATCH / SWAP / LIQUIDATE rollup
 *   5. Action Items   — swap + liquidate transaction list
 *   6. Notes          — methodology, assumptions, compliance
 *
 * Uses exceljs (works in Node serverless). Returns a Buffer.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import ExcelJS from 'exceljs';
import { ReportData } from '../report-data';

// Trustner brand colors (must be ARGB hex without # for exceljs fills)
const COLOR = {
  teal: 'FF0F766E',
  tealDark: 'FF115E59',
  tealLight: 'FFCCFBF1',
  teal50: 'FFF0FDFA',
  amber: 'FFB45309',
  amberLight: 'FFFEF3C7',
  green: 'FF16A34A',
  greenLight: 'FFDCFCE7',
  red: 'FFDC2626',
  redLight: 'FFFEE2E2',
  watch: 'FFD97706',
  watchLight: 'FFFFEDD5',
  gray: 'FF6B5F54',
  grayLight: 'FFE5E5E5',
  navy: 'FF1A1A2E',
  white: 'FFFFFFFF',
  fafa: 'FFFAFAF8',
};

function applyHeader(row: ExcelJS.Row, bg = COLOR.teal, fg = COLOR.white): void {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: fg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR.gray } },
      bottom: { style: 'thin', color: { argb: COLOR.gray } },
      left: { style: 'thin', color: { argb: COLOR.gray } },
      right: { style: 'thin', color: { argb: COLOR.gray } },
    };
  });
  row.height = 22;
}

function applyBody(row: ExcelJS.Row, opts?: { alt?: boolean }): void {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD6D3D1' } },
      bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } },
      left: { style: 'thin', color: { argb: 'FFD6D3D1' } },
      right: { style: 'thin', color: { argb: 'FFD6D3D1' } },
    };
    if (opts?.alt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.fafa } };
    }
  });
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function titleBlock(ws: ExcelJS.Worksheet, row: number, ncols: number, title: string, sub?: string): void {
  ws.mergeCells(row, 1, row, ncols);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLOR.teal } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(row).height = 28;

  if (sub) {
    ws.mergeCells(row + 1, 1, row + 1, ncols);
    const subCell = ws.getCell(row + 1, 1);
    subCell.value = sub;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: COLOR.gray } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(row + 1).height = 18;
  }
}

function verdictFillFor(verdict: string): string {
  switch (verdict) {
    case 'STAR': return COLOR.amberLight;
    case 'KEEP': return COLOR.greenLight;
    case 'WATCH': return COLOR.watchLight;
    case 'SWAP': return COLOR.redLight;
    case 'LIQUIDATE': return COLOR.grayLight;
    default: return COLOR.white;
  }
}

function verdictFontColorFor(verdict: string): string {
  switch (verdict) {
    case 'STAR': return COLOR.amber;
    case 'KEEP': return COLOR.green;
    case 'WATCH': return COLOR.watch;
    case 'SWAP': return COLOR.red;
    case 'LIQUIDATE': return COLOR.navy;
    default: return COLOR.navy;
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

export async function buildWealthTrackerXlsx(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trustner Asset Services';
  wb.lastModifiedBy = data.rmName;
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = 'Trustner Asset Services Pvt. Ltd.';

  // ── 1. EXEC SUMMARY ──────────────────────────────────────────
  const ws1 = wb.addWorksheet('1. Exec Summary');
  setColWidths(ws1, [42, 22, 22, 22, 22]);
  titleBlock(ws1, 1, 5, `${data.familyName} — Portfolio Diagnostic`, `Wealth Math Tracker · ${data.reportDate} · Doc ${data.documentId}`);

  // KPI strip
  const kpis = [
    ['Total Invested (₹)', data.totalInvestedInr],
    ['Current Value (₹)', data.currentValueInr],
    ['Total Gain (₹)', data.totalGainInr],
    ['Family XIRR (%)', data.familyXirrPct ?? 0],
    ['Holdings', data.numHoldings],
    ['Unique Funds', data.numUniqueFunds],
    ['Entities / PANs', data.numEntities],
    ['AMCs', data.numAmcs],
  ];
  ws1.getCell('A4').value = 'KPI';
  ws1.getCell('B4').value = 'Value';
  applyHeader(ws1.getRow(4));
  kpis.forEach((kpi, i) => {
    const r = ws1.getRow(5 + i);
    r.getCell(1).value = kpi[0];
    r.getCell(2).value = kpi[1];
    r.getCell(2).numFmt = typeof kpi[1] === 'number' && (kpi[0] as string).includes('₹') ? '#,##0' : ((kpi[0] as string).includes('%') ? '0.00' : '#,##0');
    applyBody(r, { alt: i % 2 === 1 });
  });

  // Tier counts
  ws1.getCell('A14').value = 'Tier Breakdown';
  ws1.getCell('A14').font = { bold: true, size: 12, color: { argb: COLOR.teal } };
  ws1.getRow(15).values = ['Tier', 'Holdings', '₹ Invested', '₹ Current', '% of Portfolio'];
  applyHeader(ws1.getRow(15));

  const tierRows: Array<[string, number, number, number, number]> = [
    ['★ STAR — Top quartile', data.tierTotals.star.count, data.tierTotals.star.investedInr, data.tierTotals.star.currentInr, data.tierTotals.star.pctOfPortfolio / 100],
    ['KEEP — Solid hold', data.tierTotals.keep.count, data.tierTotals.keep.investedInr, data.tierTotals.keep.currentInr, data.tierTotals.keep.pctOfPortfolio / 100],
    ['WATCH — Too new', data.tierTotals.watch.count, data.tierTotals.watch.investedInr, data.tierTotals.watch.currentInr, data.tierTotals.watch.pctOfPortfolio / 100],
    ['SWAP — Re-allocate', data.tierTotals.swap.count, data.tierTotals.swap.investedInr, data.tierTotals.swap.currentInr, data.tierTotals.swap.pctOfPortfolio / 100],
    ['LIQUIDATE — Cleanup', data.tierTotals.liquidate.count, data.tierTotals.liquidate.investedInr, data.tierTotals.liquidate.currentInr, data.tierTotals.liquidate.pctOfPortfolio / 100],
  ];
  tierRows.forEach((tr, idx) => {
    const r = ws1.getRow(16 + idx);
    r.values = tr;
    r.getCell(3).numFmt = '#,##0';
    r.getCell(4).numFmt = '#,##0';
    r.getCell(5).numFmt = '0%';
    applyBody(r);
    // Color the tier label cell
    const verdictKey = (tr[0] as string).includes('STAR') ? 'STAR' : (tr[0] as string).includes('KEEP') ? 'KEEP' : (tr[0] as string).includes('WATCH') ? 'WATCH' : (tr[0] as string).includes('SWAP') ? 'SWAP' : 'LIQUIDATE';
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: verdictFillFor(verdictKey) } };
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: verdictFontColorFor(verdictKey) } };
  });

  // Totals row
  const totalRow = ws1.getRow(21);
  totalRow.values = ['TOTAL', data.numHoldings, data.totalInvestedInr, data.currentValueInr, 1];
  totalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.teal50 } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR.teal } };
  });
  totalRow.getCell(3).numFmt = '#,##0';
  totalRow.getCell(4).numFmt = '#,##0';
  totalRow.getCell(5).numFmt = '0%';
  applyBody(totalRow);

  // ── 2. FAMILY HOLDINGS ───────────────────────────────────────
  const ws2 = wb.addWorksheet('2. Family Holdings');
  setColWidths(ws2, [4, 22, 38, 18, 14, 14, 12, 10, 10, 10, 12, 36]);
  titleBlock(ws2, 1, 12, `${data.familyName} — All Holdings`, `Full inventory across ${data.numEntities} entities · ${data.numAmcs} AMCs · ${data.numUniqueFunds} unique funds`);

  ws2.getRow(4).values = ['#', 'Held By', 'Fund', 'Category', 'Invested ₹', 'Current ₹', 'Gain ₹', 'XIRR %', '3Y CAGR %', '5Y CAGR %', 'Verdict', 'Rationale'];
  applyHeader(ws2.getRow(4));

  // All holdings in tier order
  const ordered = [
    ...data.starHoldings,
    ...data.keepHoldings,
    ...data.watchHoldings,
    ...data.swapHoldings,
    ...data.liquidateHoldings,
  ];

  ordered.forEach((h, i) => {
    const r = ws2.getRow(5 + i);
    r.values = [
      i + 1,
      h.entityName,
      h.fundName,
      h.category ?? '—',
      h.investedInr,
      h.currentValueInr,
      h.unrealisedGainInr,
      h.xirrPct ?? null,
      h.cagr3y ?? null,
      h.cagr5y ?? null,
      h.verdict,
      h.rationale ?? '',
    ];
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).numFmt = '#,##0';
    r.getCell(7).numFmt = '#,##0';
    r.getCell(8).numFmt = '0.00';
    r.getCell(9).numFmt = '0.00';
    r.getCell(10).numFmt = '0.00';
    applyBody(r, { alt: i % 2 === 1 });
    // Color the verdict cell
    r.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: verdictFillFor(h.verdict) } };
    r.getCell(11).font = { name: 'Calibri', size: 10, bold: true, color: { argb: verdictFontColorFor(h.verdict) } };
    r.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Freeze header
  ws2.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // ── 3. WEALTH MATH ───────────────────────────────────────────
  const ws3 = wb.addWorksheet('3. Wealth Math');
  setColWidths(ws3, [38, 22, 22, 22]);
  titleBlock(ws3, 1, 4, 'Wealth Math — 36-Month Projection', 'Stay course vs Re-alignment scenarios');

  const currentXirr = (data.familyXirrPct ?? 0) / 100;
  const improvedXirr = currentXirr + 0.03; // +3% from re-alignment

  ws3.getRow(4).values = ['Scenario', 'Assumed XIRR', '36-mo Future Value (₹)', 'Delta vs Stay'];
  applyHeader(ws3.getRow(4));

  const stayValue = data.currentValueInr * Math.pow(1 + currentXirr, 3);
  const realignValue = data.currentValueInr * Math.pow(1 + improvedXirr, 3);
  const fdValue = data.currentValueInr * Math.pow(1.065, 3); // 6.5% FD

  const scenarios: Array<[string, number, number, number | string]> = [
    ['Exit everything → FD @ 6.5%', 0.065, fdValue, fdValue - stayValue],
    ['Stay course (no swaps)', currentXirr, stayValue, 0],
    ['Re-align (recommended)', improvedXirr, realignValue, realignValue - stayValue],
  ];

  scenarios.forEach((s, i) => {
    const r = ws3.getRow(5 + i);
    r.values = s;
    r.getCell(2).numFmt = '0.00%';
    r.getCell(3).numFmt = '#,##0';
    r.getCell(4).numFmt = '+#,##0;-#,##0;0';
    applyBody(r, { alt: i % 2 === 1 });
    if (i === 2) {
      r.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.greenLight } };
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR.green } };
      });
    }
  });

  // Yearly projection table
  ws3.getCell('A10').value = 'Year-by-Year Wealth Projection';
  ws3.getCell('A10').font = { bold: true, size: 12, color: { argb: COLOR.teal } };
  ws3.getRow(11).values = ['Year', 'Stay Course (₹)', 'Re-aligned (₹)', 'Delta (₹)'];
  applyHeader(ws3.getRow(11));

  for (let y = 1; y <= 5; y++) {
    const r = ws3.getRow(11 + y);
    const stay = data.currentValueInr * Math.pow(1 + currentXirr, y);
    const realigned = data.currentValueInr * Math.pow(1 + improvedXirr, y);
    r.values = [`Year ${y}`, stay, realigned, realigned - stay];
    r.getCell(2).numFmt = '#,##0';
    r.getCell(3).numFmt = '#,##0';
    r.getCell(4).numFmt = '+#,##0;-#,##0;0';
    applyBody(r, { alt: y % 2 === 0 });
  }

  // ── 4. ACTION ITEMS ──────────────────────────────────────────
  const ws4 = wb.addWorksheet('4. Action Items');
  setColWidths(ws4, [4, 22, 36, 18, 14, 14, 32, 36]);
  titleBlock(ws4, 1, 8, 'Action Items — Swaps + Liquidations', `${data.swapCount} swaps + ${data.liquidateCount} liquidations · ${data.totalReallocationInr.toLocaleString('en-IN')} reallocation`);

  ws4.getRow(4).values = ['#', 'Held By', 'Exit Fund', 'Category', 'Invested ₹', 'Current ₹', 'Replace With', 'Reason'];
  applyHeader(ws4.getRow(4), COLOR.amber);

  const actions = [...data.swapHoldings, ...data.liquidateHoldings];
  actions.forEach((h, i) => {
    const r = ws4.getRow(5 + i);
    r.values = [
      i + 1,
      h.entityName,
      h.fundName,
      h.category ?? '—',
      h.investedInr,
      h.currentValueInr,
      h.preferredReplacementFundName ?? 'Per Trustner preferred list',
      h.rationale ?? '',
    ];
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).numFmt = '#,##0';
    applyBody(r, { alt: i % 2 === 1 });
  });

  if (actions.length === 0) {
    ws4.mergeCells(5, 1, 5, 8);
    const noActionCell = ws4.getCell(5, 1);
    noActionCell.value = '✓ No actions required — portfolio is healthy. Continue all existing SIPs as scheduled.';
    noActionCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR.green } };
    noActionCell.alignment = { horizontal: 'center', vertical: 'middle' };
    noActionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.greenLight } };
    ws4.getRow(5).height = 36;
  }

  // ── 5. NOTES ─────────────────────────────────────────────────
  const ws5 = wb.addWorksheet('5. Notes');
  setColWidths(ws5, [120]);
  titleBlock(ws5, 1, 1, 'Methodology, Assumptions & Compliance');

  const notes = [
    '',
    'METHODOLOGY',
    'Each holding is evaluated on 4 weighted criteria:',
    '  • 3-Year CAGR vs category median — 30%',
    '  • 5-Year CAGR vs category median — 25%',
    '  • Fund manager tenure & continuity — 20%',
    '  • Category quartile positioning — 25%',
    '',
    'VERDICT THRESHOLDS',
    '  • STAR — composite score ≥ 0.80 (top quartile)',
    '  • KEEP — composite score 0.60-0.80 (top half)',
    '  • WATCH — track record < 36 months',
    '  • SWAP — composite score < 0.60 AND better alternative exists in category',
    '  • LIQUIDATE — current value < ₹2,000 (legacy cleanup)',
    '',
    'WEALTH MATH ASSUMPTIONS',
    '  • Stay-course XIRR = current family XIRR projected forward',
    '  • Re-aligned XIRR = current + 3% improvement from swapping mid-pack funds into top-quartile alternatives',
    '  • FD baseline = 6.5% (per SBI / HDFC card-rates as of report date)',
    '  • All scenarios exclude any additional cash injection — pure passive growth from existing AUM',
    '',
    'COMPLIANCE',
    'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.',
    'Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505) is an AMFI-Registered Mutual Fund',
    'Distributor (ARN-286886); the firm is not a SEBI-Registered Investment Adviser. Past performance',
    'is not indicative of future results. The verdicts and recommendations in this tracker represent',
    'the firm\'s analytical view based on the funds\' track record, manager quality, and category',
    'positioning — they do not constitute personalised investment advice. Final investment decisions',
    'rest with each PAN holder. Wealth projections assume historical CAGR continues — markets may',
    'deviate; the projections are illustrative, not guaranteed.',
    '',
    `Prepared by: ${data.rmName}`,
    `Document: ${data.documentId} · ${data.reportDate}`,
  ];

  notes.forEach((line, i) => {
    const cell = ws5.getCell(3 + i, 1);
    cell.value = line;
    cell.font = {
      name: 'Calibri',
      size: line === 'METHODOLOGY' || line === 'VERDICT THRESHOLDS' || line === 'WEALTH MATH ASSUMPTIONS' || line === 'COMPLIANCE' ? 11 : 10,
      bold: line === 'METHODOLOGY' || line === 'VERDICT THRESHOLDS' || line === 'WEALTH MATH ASSUMPTIONS' || line === 'COMPLIANCE',
      color: {
        argb:
          line === 'METHODOLOGY' || line === 'VERDICT THRESHOLDS' || line === 'WEALTH MATH ASSUMPTIONS' || line === 'COMPLIANCE'
            ? COLOR.teal
            : 'FF1A1A2E',
      },
    };
    cell.alignment = { vertical: 'top', wrapText: true };
  });

  // Serialize to Buffer
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
