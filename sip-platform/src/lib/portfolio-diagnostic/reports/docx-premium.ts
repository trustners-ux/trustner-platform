/**
 * Premium Portfolio Review & Action Plan — editable Word (.docx).
 *
 * The Beriwal-grade deliverable as a real, editable Word file (pure-JS via the
 * `docx` library — Vercel-native, no chromium, no image rasterisation). Mirrors
 * the section order of premium-html.ts and consumes the same view-model
 * (premium-shared.ts), so the two outputs never diverge. Charts are rendered as
 * native shaded Word tables (segmented allocation bar, equity bars) — premium
 * and zero-image. The client can edit in Word/Google Docs and Save-as-PDF for a
 * guaranteed clean PDF (no browser footer).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
} from 'docx';
import { ReportData, ReportHolding, formatInrShort, formatInrFull, formatPct } from '../report-data';
import { BRAND } from './_shared-styles';
import { buildPremiumModel, COMPLIANCE, PremiumModel, Tone } from './premium-shared';

// docx wants hex WITHOUT '#'.
const hx = (c: string) => c.replace('#', '').toUpperCase();
const NAVY = hx(BRAND.navy);
const SLATE = hx(BRAND.slate);
const SLATE_MUTE = hx(BRAND.slateMute);
const INK = hx(BRAND.ink);
const LINE = hx(BRAND.line);
const POS = hx(BRAND.pos);
const NEG = hx(BRAND.neg);
const GOLD = hx(BRAND.star);
const TEAL = hx(BRAND.teal);

const TONE_FILL: Record<Tone, string> = { navy: 'EFF6FF', green: 'F0FDF4', amber: 'FEFCE8', rose: 'FFF1F2', slate: 'F8FAFC' };
const TONE_INK: Record<Tone, string> = { navy: NAVY, green: POS, amber: GOLD, rose: NEG, slate: SLATE };
const VERDICT_FILL: Record<string, string> = { STAR: hx(BRAND.star), KEEP: hx(BRAND.keep), WATCH: hx(BRAND.watch), SWAP: hx(BRAND.swap), LIQUIDATE: hx(BRAND.liq) };

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const HAIRLINE = { style: BorderStyle.SINGLE, size: 2, color: LINE };
const noBorders = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };
const hairlineBorders = { top: HAIRLINE, bottom: HAIRLINE, left: HAIRLINE, right: HAIRLINE, insideHorizontal: HAIRLINE, insideVertical: HAIRLINE };

function run(text: string, opts: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, color: opts.color, size: opts.size ?? 18, italics: opts.italics, font: 'Arial' });
}
function para(children: TextRun[], opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number } = {}): Paragraph {
  return new Paragraph({ children, alignment: opts.align, spacing: { before: opts.before ?? 0, after: opts.after ?? 60 } });
}
function cell(children: (Paragraph | Table)[], opts: { fill?: string; width?: number; valign?: 'center' | 'top' | 'bottom'; colSpan?: number } = {}): TableCell {
  return new TableCell({
    children,
    shading: opts.fill ? { type: ShadingType.SOLID, color: opts.fill, fill: opts.fill } : undefined,
    width: opts.width != null ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: opts.valign ?? VerticalAlign.CENTER,
    columnSpan: opts.colSpan,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}
function tcellText(text: string, opts: { bold?: boolean; color?: string; size?: number; fill?: string; width?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  return cell([para([run(text, { bold: opts.bold, color: opts.color, size: opts.size })], { align: opts.align })], { fill: opts.fill, width: opts.width });
}

/** Section heading "n  Title". */
function sectionHeading(n: number, title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 260, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } },
    children: [run(`${n}.  `, { bold: true, color: GOLD, size: 24 }), run(title, { bold: true, color: NAVY, size: 24 })],
  });
}

/** Bar row with an actual filled segment: label | [filled|empty] | value. */
function barRow(label: string, pct: number, fill: string, valueText: string): Table {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const innerRows = [
    new TableRow({
      children: [
        ...(p > 0 ? [new TableCell({ children: [new Paragraph({ children: [] })], shading: { type: ShadingType.SOLID, color: fill, fill }, width: { size: p, type: WidthType.PERCENTAGE }, margins: { top: 30, bottom: 30 } })] : []),
        ...(p < 100 ? [new TableCell({ children: [new Paragraph({ children: [] })], shading: { type: ShadingType.SOLID, color: 'EEF2F6', fill: 'EEF2F6' }, width: { size: 100 - p, type: WidthType.PERCENTAGE }, margins: { top: 30, bottom: 30 } })] : []),
      ],
    }),
  ];
  const innerBar = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders, rows: innerRows });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    columnWidths: [2900, 4700, 1400],
    rows: [
      new TableRow({
        children: [
          cell([para([run(label, { bold: true, color: SLATE, size: 16 })])], { width: 32, valign: VerticalAlign.CENTER }),
          cell([innerBar], { width: 52, valign: VerticalAlign.CENTER }),
          cell([para([run(valueText, { bold: true, color: NAVY, size: 16 })], { align: AlignmentType.RIGHT })], { width: 16, valign: VerticalAlign.CENTER }),
        ],
      }),
    ],
  });
}

function headerRow(labels: { t: string; w?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l) => cell([para([run(l.t, { bold: true, color: 'FFFFFF', size: 15 })], { align: l.align })], { fill: NAVY, width: l.w })),
  });
}

function holdingsTable(rows: ReportHolding[], label: string, isAction: boolean): (Paragraph | Table)[] {
  if (!rows.length) return [];
  const out: (Paragraph | Table)[] = [];
  out.push(new Paragraph({ spacing: { before: 130, after: 50 }, children: [run(`${label} — ${rows.length} holding${rows.length > 1 ? 's' : ''}`, { bold: true, color: hx(BRAND.navy), size: 19 })] }));
  const head = headerRow([
    { t: '#', w: 4, align: AlignmentType.CENTER },
    { t: 'Held By', w: 13 },
    { t: 'Fund', w: 27 },
    { t: 'Current', w: 11, align: AlignmentType.RIGHT },
    { t: '3Y', w: 8, align: AlignmentType.CENTER },
    { t: 'Verdict', w: 10, align: AlignmentType.CENTER },
    { t: isAction ? 'Why & replacement' : 'Why', w: 27 },
  ]);
  const body = rows.map((h, i) => {
    const zebra = i % 2 === 1 ? 'F8FAFC' : undefined;
    const why = (h.rationale ?? '—') + (isAction && h.preferredReplacementFundName ? `  →  ${h.preferredReplacementFundName}${h.buyListReplacementFundName === h.preferredReplacementFundName ? ' ★ Buy-List' : ''}` : '');
    const cagrColor = h.cagr3y == null ? SLATE_MUTE : h.cagr3y >= 0 ? POS : NEG;
    return new TableRow({
      children: [
        tcellText(String(i + 1), { size: 15, align: AlignmentType.CENTER, fill: zebra }),
        tcellText(h.entityName, { size: 15, fill: zebra }),
        cell([para([run(h.fundName, { bold: true, size: 15 })]), ...(h.category ? [para([run(h.category, { color: SLATE_MUTE, size: 13 })])] : [])], { fill: zebra, width: 27 }),
        tcellText(formatInrFull(h.currentValueInr), { size: 15, color: NAVY, bold: true, align: AlignmentType.RIGHT, fill: zebra }),
        tcellText(formatPct(h.cagr3y), { size: 15, color: cagrColor, align: AlignmentType.CENTER, fill: zebra }),
        cell([para([run(label, { bold: true, color: 'FFFFFF', size: 13 })], { align: AlignmentType.CENTER })], { fill: VERDICT_FILL[label] ?? NAVY }),
        tcellText(why, { size: 14, fill: zebra }),
      ],
    });
  });
  out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: hairlineBorders, rows: [head, ...body] }));
  return out;
}

export async function buildPremiumDocx(data: ReportData): Promise<Buffer> {
  const m: PremiumModel = buildPremiumModel(data);
  const body: (Paragraph | Table)[] = [];

  // ── Title block ──
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 20 }, children: [run('Portfolio Review & Action Plan', { bold: true, color: NAVY, size: 40 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [run('Prepared for the ', { color: SLATE, size: 21 }), run(m.familyName, { bold: true, color: SLATE, size: 21 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [run(m.entitiesLine, { color: SLATE_MUTE, size: 16, italics: true })] }));

  // ── THE GAP strip — tolerated vs carried risk, the headline band ──
  if (m.gapStrip) {
    const fill = m.gapStrip.aligned ? 'F0FDF4' : 'FFF1F2';
    const edge = m.gapStrip.aligned ? POS : NEG;
    const ink = m.gapStrip.aligned ? '166534' : '9F1239';
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: edge }, bottom: { style: BorderStyle.SINGLE, size: 4, color: edge }, right: { style: BorderStyle.SINGLE, size: 4, color: edge }, left: { style: BorderStyle.SINGLE, size: 36, color: edge }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [new TableRow({ children: [cell([para([run(m.gapStrip.text, { bold: true, color: ink, size: 20 })])], { fill })] })],
    }));
    body.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
  }

  // ── Risk-not-captured banner ──
  if (!m.riskProfileCaptured) {
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD }, bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD }, left: { style: BorderStyle.SINGLE, size: 6, color: GOLD }, right: { style: BorderStyle.SINGLE, size: 6, color: GOLD }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [new TableRow({ children: [cell([para([run('⚠ Risk profile not captured — verdicts ran on a generic default. Capture the family’s real risk profile and re-score before relying on the suitability calls.', { color: '92400E', size: 16, bold: true })])], { fill: 'FEF3C7' })] })],
    }));
    body.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }

  // ── KPI banner (5 tiles) ──
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: { style: BorderStyle.SINGLE, size: 6, color: 'FFFFFF' } },
    rows: [new TableRow({
      children: m.kpis.map((t) => cell([
        para([run(t.value, { bold: true, color: TONE_INK[t.tone], size: 30 })], { align: AlignmentType.CENTER, after: 10 }),
        para([run(t.label.toUpperCase(), { bold: true, color: TONE_INK[t.tone], size: 13 })], { align: AlignmentType.CENTER, after: 6 }),
        ...(t.sub ? [para([run(t.sub, { color: SLATE_MUTE, size: 12 })], { align: AlignmentType.CENTER })] : []),
      ], { fill: TONE_FILL[t.tone], width: 20 })),
    })],
  }));
  body.push(new Paragraph({ spacing: { after: 120 }, children: [] }));

  // ── Honest View ──
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, left: { style: BorderStyle.SINGLE, size: 30, color: POS }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [new TableRow({ children: [cell([
      para([run(m.honestLead, { bold: true, color: '047857', size: 20 })], { after: 60 }),
      para([run(m.honestBody, { color: '334155', size: 18 })]),
    ], { fill: 'F0FDF4' })] })],
  }));
  body.push(new Paragraph({ spacing: { after: 100 }, children: [] }));

  // ── Behaviour-gap line (indicative) ──
  if (m.behaviourLine) {
    const fill = m.behaviourLine.losing ? 'FFFBEB' : 'F0FDF4';
    const edge = m.behaviourLine.losing ? GOLD : POS;
    const ink = m.behaviourLine.losing ? '713F12' : '166534';
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: edge }, bottom: { style: BorderStyle.SINGLE, size: 4, color: edge }, right: { style: BorderStyle.SINGLE, size: 4, color: edge }, left: { style: BorderStyle.SINGLE, size: 30, color: edge }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [new TableRow({ children: [cell([para([run(m.behaviourLine.text, { color: ink, size: 16 })])], { fill })] })],
    }));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  // ── Note on numbers ──
  if (m.showNumbersNote) {
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'FDE68A' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FDE68A' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'FDE68A' }, left: { style: BorderStyle.SINGLE, size: 30, color: GOLD }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [new TableRow({ children: [cell([para([
        run('A note on the numbers. ', { bold: true, color: GOLD, size: 16 }),
        run(`Gains and any tax shown are as of ${m.reportDate} and are indicative; the exact embedded gain and liability must be confirmed with your Chartered Accountant before any order is placed. Verdicts reflect Trustner’s house view, not personalised advice.`, { color: '713F12', size: 16 }),
      ])], { fill: 'FEFCE8' })] })],
    }));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  // ── §1 The Verdict ──
  body.push(sectionHeading(1, 'The Verdict'));
  for (const b of m.tierBars) body.push(barRow(`${b.label} · ${b.count}`, b.pct, hx(b.color), `${formatInrShort(b.currentInr)}  ${formatPct(b.pct, 0)}`));
  body.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: hairlineBorders,
    rows: [
      headerRow([{ t: 'Tier', w: 34 }, { t: 'Funds', w: 18, align: AlignmentType.CENTER }, { t: 'Current value', w: 28, align: AlignmentType.RIGHT }, { t: '% of book', w: 20, align: AlignmentType.CENTER }]),
      ...m.tierTable.filter((r) => r.count > 0).map((r) => new TableRow({ children: [
        cell([para([run(r.label, { bold: true, color: 'FFFFFF', size: 15 })])], { fill: hx(r.color) }),
        tcellText(String(r.count), { size: 16, align: AlignmentType.CENTER }),
        tcellText(r.current, { size: 16, bold: true, color: NAVY, align: AlignmentType.RIGHT }),
        tcellText(r.pct, { size: 16, align: AlignmentType.CENTER }),
      ] })),
    ],
  }));

  // §1b — portfolio risk KPIs + benchmark (when data supports them)
  if (m.riskKpiTiles.length) {
    body.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [run('Portfolio risk profile', { bold: true, color: NAVY, size: 19 })] }));
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: { style: BorderStyle.SINGLE, size: 6, color: 'FFFFFF' } },
      rows: [new TableRow({
        children: m.riskKpiTiles.map((t) => cell([
          para([run(t.value, { bold: true, color: NAVY, size: 26 })], { align: AlignmentType.CENTER, after: 8 }),
          para([run(t.label.toUpperCase(), { bold: true, color: NAVY, size: 12 })], { align: AlignmentType.CENTER, after: 4 }),
          para([run(t.sub, { color: SLATE_MUTE, size: 11 })], { align: AlignmentType.CENTER }),
        ], { fill: 'EFF6FF', width: Math.floor(100 / m.riskKpiTiles.length) })),
      })],
    }));
  }
  if (m.benchmarkBlock) {
    body.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [run('Relative performance (3Y, time-weighted)', { bold: true, color: NAVY, size: 19 })] }));
    body.push(barRow('Your funds (weighted)', Math.min(100, m.benchmarkBlock.portfolioPct * 4), NAVY, formatPct(m.benchmarkBlock.portfolioPct, 1)));
    body.push(barRow('Blended index path', Math.min(100, m.benchmarkBlock.blendedPct * 4), SLATE_MUTE, formatPct(m.benchmarkBlock.blendedPct, 1)));
    body.push(new Paragraph({ spacing: { before: 50, after: 30 }, children: [run(m.benchmarkBlock.verdictLine, { bold: true, color: m.benchmarkBlock.alphaPp >= 0 ? POS : GOLD, size: 17 })] }));
    body.push(new Paragraph({ spacing: { after: 60 }, children: [run(m.benchmarkBlock.footnote, { color: SLATE_MUTE, size: 12, italics: true })] }));
  }

  // ── §2 Fund by Fund ──
  body.push(sectionHeading(2, 'Fund by Fund'));
  body.push(...holdingsTable(data.starHoldings, 'STAR', false));
  body.push(...holdingsTable(data.keepHoldings, 'KEEP', false));
  body.push(...holdingsTable(data.watchHoldings, 'WATCH', false));
  body.push(...holdingsTable(data.swapHoldings, 'SWAP', true));
  body.push(...holdingsTable(data.liquidateHoldings, 'LIQUIDATE', true));

  // ── §3 The Things to Fix — allocation ──
  body.push(sectionHeading(3, 'The Things to Fix'));
  if (m.alloc.slices.length) {
    // segmented allocation bar
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders,
      rows: [new TableRow({ children: m.alloc.slices.map((s) => new TableCell({
        children: [para([run(`${s.label} ${formatPct(s.pct, 0)}`, { color: 'FFFFFF', bold: true, size: 14 })], { align: AlignmentType.CENTER })],
        shading: { type: ShadingType.SOLID, color: hx(s.color), fill: hx(s.color) },
        width: { size: Math.max(8, Math.round(s.pct)), type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 60 },
      })) })],
    }));
    body.push(new Paragraph({ spacing: { before: 40, after: 80 }, children: [run(`Effective equity ${formatPct(m.alloc.effectiveEquityPct, 0)} (counts ~60% of hybrid as equity, look-through).`, { color: SLATE_MUTE, size: 15, italics: true })] }));
  }
  if (m.alloc.targetEquityPct != null) {
    body.push(barRow('Equity today', m.alloc.effectiveEquityPct, NAVY, formatPct(m.alloc.effectiveEquityPct, 0)));
    body.push(barRow('Target for this client', m.alloc.targetEquityPct, POS, formatPct(m.alloc.targetEquityPct, 0)));
    body.push(new Paragraph({ spacing: { before: 50, after: 60 }, children: [run(`Equity stands ${m.alloc.equityGapVerb} — a gap of about ${formatPct(m.alloc.equityGapPts ?? 0, 0)} vs the risk-model target. The moves below close it without forcing a taxable sale.`, { color: '713F12', size: 16 })] }));
  } else {
    body.push(new Paragraph({ children: [run('Target equity not set — capture the client’s risk profile to show the today-vs-target gap and glide path.', { color: SLATE_MUTE, size: 16, italics: true })] }));
  }

  // ── §4 The Moves ──
  body.push(sectionHeading(4, 'The Moves — trades execute per PAN'));
  if (m.moves.length) {
    const head = headerRow([
      { t: '#', w: 4, align: AlignmentType.CENTER }, { t: 'Held By', w: 14 }, { t: 'Action', w: 18 },
      { t: 'Exit / trim', w: 24 }, { t: 'Redeploy into', w: 26 }, { t: 'Amount', w: 14, align: AlignmentType.RIGHT },
    ]);
    const rows = m.moves.map((mv, i) => {
      const zebra = i % 2 === 1 ? 'FFFBEB' : undefined;
      const actFill = mv.action === 'EXIT' || mv.action === 'REDEEM' ? hx(BRAND.neg) : GOLD;
      return new TableRow({ children: [
        tcellText(String(mv.idx), { size: 15, align: AlignmentType.CENTER, fill: zebra }),
        tcellText(mv.entity, { size: 15, fill: zebra }),
        cell([para([run(mv.actionLabel, { bold: true, color: 'FFFFFF', size: 13 })])], { fill: actFill }),
        cell([para([run(mv.fund, { bold: true, size: 15 })]), ...(mv.category ? [para([run(mv.category, { color: SLATE_MUTE, size: 13 })])] : [])], { fill: zebra }),
        cell([para([run(mv.replacement ?? 'per preferred list', { size: 15, color: mv.replacement ? INK : SLATE_MUTE }), ...(mv.replacementIsBuyList ? [run('  ★ Buy-List', { color: GOLD, bold: true, size: 13 })] : [])])], { fill: zebra }),
        tcellText(formatInrFull(mv.amountInr), { size: 15, bold: true, color: GOLD, align: AlignmentType.RIGHT, fill: zebra }),
      ] });
    });
    body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: hairlineBorders, rows: [head, ...rows] }));
    body.push(new Paragraph({ spacing: { before: 60 }, children: [run(`${m.movesTotal} re-allocated in total.`, { bold: true, color: SLATE, size: 16 }), ...(m.consolidationNote ? [run(' ' + m.consolidationNote, { color: SLATE, size: 16 })] : [])] }));
  } else {
    body.push(new Paragraph({ children: [run('Nothing to sell — every holding is suitable and worth keeping. Continue the existing SIPs as scheduled.', { color: POS, size: 17, bold: true })] }));
  }

  // ── §5 Tax-Sequenced Glide ──
  body.push(sectionHeading(5, 'Tax-Sequenced Glide'));
  if (m.taxLines) {
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, borders: hairlineBorders,
      rows: [
        headerRow([{ t: 'Fund', w: 30 }, { t: 'Gain', w: 13, align: AlignmentType.CENTER }, { t: 'Type', w: 12, align: AlignmentType.CENTER }, { t: 'Locked?', w: 11, align: AlignmentType.CENTER }, { t: 'Est. tax', w: 13, align: AlignmentType.RIGHT }, { t: 'Note', w: 21 }]),
        ...m.taxLines.map((l, i) => { const z = i % 2 === 1 ? 'F8FAFC' : undefined; return new TableRow({ children: [
          tcellText(l.fundName, { size: 15, bold: true, fill: z }),
          tcellText(l.gain, { size: 15, align: AlignmentType.CENTER, fill: z }),
          tcellText(l.gainType, { size: 14, align: AlignmentType.CENTER, fill: z }),
          tcellText(l.locked ? 'Yes' : 'No', { size: 14, align: AlignmentType.CENTER, fill: z }),
          tcellText(l.estTax, { size: 15, bold: true, color: NAVY, align: AlignmentType.RIGHT, fill: z }),
          tcellText(l.note, { size: 13, fill: z }),
        ] }); }),
      ],
    }));
    if (m.taxHeadline) body.push(new Paragraph({ spacing: { before: 60 }, children: [run(m.taxHeadline, { bold: true, color: GOLD, size: 16 })] }));
  } else {
    body.push(new Paragraph({ children: [run('No taxable exits in this plan — the re-alignment can be done without triggering capital-gains tax.', { color: SLATE_MUTE, size: 16, italics: true })] }));
  }

  // ── §6 Funding the Goal ──
  body.push(sectionHeading(6, 'Funding the Goal'));
  if (m.sip.hasGoal) {
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders,
      rows: [new TableRow({ children: [
        cell([para([run(formatInrShort(m.sip.projectedInr), { bold: true, color: NAVY, size: 28 })], { align: AlignmentType.CENTER, after: 10 }), para([run(`CURRENT BOOK GROWS TO (${m.sip.years}Y @ ${formatPct(m.sip.assumedReturnPct, 0)})`, { color: SLATE, size: 12, bold: true })], { align: AlignmentType.CENTER })], { fill: 'EFF6FF', width: 33 }),
        cell([para([run(formatInrShort(m.sip.targetInr), { bold: true, color: NAVY, size: 28 })], { align: AlignmentType.CENTER, after: 10 }), para([run('GOAL CORPUS', { color: SLATE, size: 12, bold: true })], { align: AlignmentType.CENTER })], { fill: 'EFF6FF', width: 33 }),
        cell([para([run(m.sip.gapInr > 0 ? `${formatInrShort(m.sip.monthlySipInr)}/mo` : '✓ On track', { bold: true, color: 'FFFFFF', size: 26 })], { align: AlignmentType.CENTER, after: 10 }), para([run(m.sip.gapInr > 0 ? 'STEP-UP SIP TO CLOSE THE GAP' : 'NO FRESH SIP NEEDED', { color: 'FFFFFF', size: 12, bold: true })], { align: AlignmentType.CENTER })], { fill: NAVY, width: 34 }),
      ] })],
    }));
    if (m.mcBlock) {
      body.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'BBF7D0' }, left: { style: BorderStyle.SINGLE, size: 30, color: POS }, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows: [new TableRow({ children: [cell([
          para([run('🎲 ' + m.mcBlock.headline, { bold: true, color: '047857', size: 20 })], { after: 50 }),
          para([run(m.mcBlock.subline, { color: '334155', size: 16 })], { after: 30 }),
          para([run(m.mcBlock.coneLine, { color: '334155', size: 16 })], { after: m.mcBlock.stepUpLine ? 30 : 0 }),
          ...(m.mcBlock.stepUpLine ? [para([run(m.mcBlock.stepUpLine, { bold: true, color: '047857', size: 17 })])] : []),
        ], { fill: 'F0FDF4' })] })],
      }));
      body.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    }
    body.push(new Paragraph({ spacing: { before: 50 }, children: [run(`Illustrative at ${formatPct(m.sip.assumedReturnPct, 0)} p.a.; a 10% annual step-up reduces the starting amount. Markets do not move in a straight line — the probability above comes from 10,000 simulated paths, not a single straight-line projection.`, { color: SLATE_MUTE, size: 14, italics: true })] }));
  } else {
    body.push(new Paragraph({ children: [run('Goal corpus / horizon not captured — set the family’s target and timeframe in the risk profile to generate the funding plan.', { color: SLATE_MUTE, size: 16, italics: true })] }));
  }

  // ── §7 What We Are Not Doing ──
  body.push(sectionHeading(7, 'What We Are Not Doing'));
  const notDoing: [string, string][] = [
    ['No fire-sales.', 'We never dump a fund for short-term noise; a sell needs a structural reason (wrong risk, weak process, or a clearly better same-category fund).'],
    ['No tax-blind churn.', 'Exits are sequenced to keep capital-gains tax at the legal minimum — we don’t trigger LTCG to chase a few basis points.'],
    ['Not acting on a raw screen.', 'Every flag here is to be cross-checked against the family’s live statement before any order is placed.'],
    ['No Direct-to-Regular switching.', 'Trustner is your distributor of record; we do not move you off your existing plan structure.'],
    [`Scope-limited.`, `This review covers only the named ${m.familyName} holdings shared with us — not any account held away.`],
  ];
  for (const [lead, rest] of notDoing) {
    body.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [run(lead + ' ', { bold: true, color: SLATE, size: 17 }), run(rest, { color: SLATE, size: 17 })] }));
  }

  // ── Regulatory & Commercial Notes ──
  body.push(new Paragraph({ spacing: { before: 220, after: 50 }, border: { top: { style: BorderStyle.SINGLE, size: 12, color: NAVY } }, children: [run('REGULATORY & COMMERCIAL NOTES', { bold: true, color: SLATE, size: 17 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 50 }, children: [run(COMPLIANCE.notAdvice, { color: SLATE_MUTE, size: 14 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 50 }, children: [run(`${COMPLIANCE.marketRisk} ${COMPLIANCE.pastPerf} ${COMPLIANCE.taxIndicative}`, { color: SLATE_MUTE, size: 14 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, children: [run(`${COMPLIANCE.credential} ${COMPLIANCE.cin}. Prepared by ${m.rmName} · ${m.reportDate} · Doc ${m.documentId}.`, { color: SLATE_MUTE, size: 14 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [run(COMPLIANCE.firmLine, { bold: true, color: NAVY, size: 16 })] }));

  // ── Header / Footer ──
  const header = new Header({ children: [new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: NAVY } }, spacing: { after: 60 },
    children: [run('TRUSTNER ASSET SERVICES PVT. LTD.', { bold: true, color: NAVY, size: 19 }), run('   AMFI Registered Mutual Fund & SIF Distributor · APMI Registered PMS Distributor · ARN-286886', { color: SLATE_MUTE, size: 13 })],
  })] });
  const footer = new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, spacing: { before: 40 },
    children: [run('trustner.in · merasip.com   ·   Page ', { color: SLATE_MUTE, size: 13 }), new TextRun({ children: [PageNumber.CURRENT], color: SLATE_MUTE, size: 13, font: 'Arial' })],
  })] });

  const doc = new Document({
    creator: 'Trustner Asset Services Pvt. Ltd.',
    title: `${m.familyName} — Portfolio Review & Action Plan`,
    styles: { default: { document: { run: { font: 'Arial', size: 18, color: INK } } } },
    sections: [{
      properties: { page: { size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, margin: { top: convertInchesToTwip(0.7), bottom: convertInchesToTwip(0.7), left: convertInchesToTwip(0.65), right: convertInchesToTwip(0.65) } } },
      headers: { default: header },
      footers: { default: footer },
      children: body,
    }],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
