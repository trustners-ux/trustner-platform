/**
 * Premium Report — shared view-model.
 *
 * Computes EVERY number the premium deliverables show, in one place, from the
 * existing ReportData. The HTML renderer (premium-html.ts) and the Word renderer
 * (docx-premium.ts) both consume this model, so the two outputs can never
 * diverge. All null-handling lives here — a renderer never sees an undefined.
 *
 * Hard rule: real data only. Nothing is recomputed that the scoring engine
 * already produced (tax, allocation, verdicts) — we only read and present.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import {
  ReportData,
  ReportHolding,
  formatInrShort,
  formatInrFull,
  formatPct,
} from '../report-data';
import { BRAND } from './_shared-styles';

export type Tone = 'navy' | 'green' | 'amber' | 'rose' | 'slate';

export interface KpiTile {
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
}

export interface AllocSlice {
  label: string;
  pct: number;
  color: string;
}

export interface TierBar {
  key: 'keepcore' | 'watch' | 'swap' | 'liquidate';
  label: string;
  count: number;
  currentInr: number;
  pct: number;
  color: string;
}

export interface MoveRow {
  idx: number;
  entity: string;
  action: 'EXIT' | 'SWITCH' | 'TRIM' | 'REDEEM';
  actionLabel: string;
  fund: string;
  category: string | null;
  replacement: string | null;
  replacementIsBuyList: boolean;
  amountInr: number;
}

export interface TaxLineRow {
  fundName: string;
  gain: string;
  gainType: string;
  locked: boolean;
  estTax: string;
  note: string;
}

export interface SipPlan {
  hasGoal: boolean;
  years: number;
  assumedReturnPct: number;
  projectedInr: number;
  targetInr: number;
  gapInr: number;
  monthlySipInr: number;
}

export interface PremiumModel {
  // Identity
  familyName: string;
  reportDate: string;
  reportDateIso: string;
  documentId: string;
  rmName: string;
  entitiesLine: string;
  riskProfileCaptured: boolean;

  // Headline
  kpis: KpiTile[];
  honestLead: string;
  honestBody: string;
  showNumbersNote: boolean;

  // §1 verdict
  tierBars: TierBar[];
  tierTable: { label: string; count: number; current: string; pct: string; color: string }[];

  // §3 allocation
  alloc: {
    slices: AllocSlice[];
    effectiveEquityPct: number;
    targetEquityPct: number | null;
    equityGapVerb: string | null;       // "over-weight" | "under-weight" | "well-aligned"
    equityGapPts: number | null;        // |effective - target|
  };

  // §4 moves
  moves: MoveRow[];
  movesTotal: string;
  consolidationNote: string | null;

  // §5 tax
  taxLines: TaxLineRow[] | null;
  taxHeadline: string | null;
  taxExitCount: number;

  // §6 SIP
  sip: SipPlan;

  // The GAP strip (tolerated vs carried risk) — null when profile not captured
  gapStrip: { text: string; aligned: boolean } | null;
  // Behaviour-gap line (indicative, ₹) — null when coverage too thin
  behaviourLine: { text: string; losing: boolean } | null;
  // Portfolio risk KPI tiles (weighted fund stats) — empty when no stats
  riskKpiTiles: { label: string; value: string; sub: string }[];
  // Benchmark block — null when proxies/coverage unavailable
  benchmarkBlock: {
    portfolioPct: number; blendedPct: number; alphaPp: number;
    verdictLine: string; footnote: string;
  } | null;
  // Monte Carlo block — null when no goal captured
  mcBlock: { headline: string; subline: string; coneLine: string; stepUpLine: string | null } | null;
  // Stock-level look-through — null when no held fund has disclosed-holdings data
  lookThroughBlock: {
    headline: string;
    coverageLine: string;
    stocks: { name: string; pct: number; valueShort: string; fundCount: number }[];
    sectorLine: string;
    asOfLine: string;
  } | null;
}

/** Required level monthly SIP to grow `gap` over `months` at annual `annualPct`
 *  (annuity-due). Mirrors investment-proposal.ts. */
function requiredMonthlySip(gap: number, months: number, annualPct: number): number {
  if (gap <= 0 || months <= 0) return 0;
  const i = annualPct / 100 / 12;
  if (i <= 0) return gap / months;
  const factor = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  return gap / factor;
}

/** Map a v2 action / verdict to a short action token + label for the moves table. */
function actionFor(h: ReportHolding): { action: MoveRow['action']; label: string } {
  const a = (h.v2Action ?? '').toUpperCase();
  if (h.verdict === 'LIQUIDATE' || a.includes('REDEEM')) return { action: 'REDEEM', label: 'Redeem' };
  if (a.includes('EXIT')) return { action: 'EXIT', label: 'Exit' };
  if (a.includes('REDUCE') || a.includes('PARTIAL') || a.includes('TRIM')) return { action: 'TRIM', label: 'Trim' };
  if (a.includes('SWITCH')) return { action: 'SWITCH', label: 'Switch' };
  return { action: 'SWITCH', label: 'Switch' };
}

export function buildPremiumModel(data: ReportData): PremiumModel {
  const tt = data.tierTotals;
  const keepCoreCount = tt.star.count + tt.keep.count;
  const actCount = data.swapCount + data.liquidateCount;
  const gain = data.totalGainInr;

  // ── KPI banner (5 tiles, all real) ──────────────────────────────
  const kpis: KpiTile[] = [
    { label: 'Family corpus', value: formatInrShort(data.currentValueInr), sub: `${formatInrShort(data.totalInvestedInr)} invested`, tone: 'navy' },
    { label: 'Net gain', value: `${gain >= 0 ? '+' : ''}${formatInrShort(gain)}`, sub: data.totalInvestedInr > 0 ? formatPct((gain / data.totalInvestedInr) * 100, 1) + ' absolute' : '', tone: gain >= 0 ? 'green' : 'rose' },
    { label: 'Family XIRR', value: data.familyXirrPct != null ? formatPct(data.familyXirrPct, 1) : 'NM', sub: 'money-weighted', tone: 'navy' },
    { label: 'Keep as-is', value: String(keepCoreCount), sub: `${data.numUniqueFunds} funds held`, tone: 'green' },
    { label: 'To re-align', value: String(actCount), sub: actCount > 0 ? `${formatInrShort(data.totalReallocationInr)} to move` : 'nothing to sell', tone: actCount > 0 ? 'amber' : 'green' },
  ];

  // ── Honest View (exec summary), data-templated ──────────────────
  const honestLead =
    'Our job here is judgement, not just a screen — what to keep, what to fold together, and the order to act in so tax never leads the decision.';
  const consolPart = data.consolidationGroups.length
    ? ` and ${data.consolidationGroups.length} duplicate set${data.consolidationGroups.length > 1 ? 's' : ''} to consolidate (${formatInrShort(data.consolidationValueInr)})`
    : '';
  const taxPart = data.taxSummary && data.taxSummary.exitCount > 0
    ? ' — sequenced so the family pays the minimum tax legally due, not a rupee more.'
    : ' — and nothing here forces a taxable sale.';
  const honestBody =
    `The ${data.familyName} book is ${formatInrFull(data.currentValueInr)} across ${data.numHoldings} holding${data.numHoldings > 1 ? 's' : ''} ` +
    `(${formatInrFull(data.totalInvestedInr)} invested → ${gain >= 0 ? 'a gain of ' : 'down '}${formatInrFull(Math.abs(gain))}). ` +
    `${keepCoreCount} fund${keepCoreCount === 1 ? '' : 's'} ${keepCoreCount === 1 ? 'is' : 'are'} solid and stay as they are. ` +
    `We flag ${actCount} to re-align${consolPart}${taxPart}`;

  const showNumbersNote = actCount > 0 || !!data.taxSummary;

  // ── §1 verdict — tier bars + table ──────────────────────────────
  const tierBars: TierBar[] = ([
    { key: 'keepcore', label: 'Keep core (Star + Keep)', count: keepCoreCount, currentInr: tt.star.currentInr + tt.keep.currentInr, pct: tt.star.pctOfPortfolio + tt.keep.pctOfPortfolio, color: BRAND.keep },
    { key: 'watch', label: 'Watch (too new to judge)', count: tt.watch.count, currentInr: tt.watch.currentInr, pct: tt.watch.pctOfPortfolio, color: BRAND.watch },
    { key: 'swap', label: 'Swap (better option exists)', count: tt.swap.count, currentInr: tt.swap.currentInr, pct: tt.swap.pctOfPortfolio, color: BRAND.swap },
    { key: 'liquidate', label: 'Liquidate (cleanup)', count: tt.liquidate.count, currentInr: tt.liquidate.currentInr, pct: tt.liquidate.pctOfPortfolio, color: BRAND.liq },
  ] as TierBar[]).filter((b) => b.count > 0);

  const tierTable = [
    { label: '★ Star', count: tt.star.count, current: formatInrShort(tt.star.currentInr), pct: formatPct(tt.star.pctOfPortfolio, 0), color: BRAND.star },
    { label: 'Keep', count: tt.keep.count, current: formatInrShort(tt.keep.currentInr), pct: formatPct(tt.keep.pctOfPortfolio, 0), color: BRAND.keep },
    { label: 'Watch', count: tt.watch.count, current: formatInrShort(tt.watch.currentInr), pct: formatPct(tt.watch.pctOfPortfolio, 0), color: BRAND.watch },
    { label: 'Swap', count: tt.swap.count, current: formatInrShort(tt.swap.currentInr), pct: formatPct(tt.swap.pctOfPortfolio, 0), color: BRAND.swap },
    { label: 'Liquidate', count: tt.liquidate.count, current: formatInrShort(tt.liquidate.currentInr), pct: formatPct(tt.liquidate.pctOfPortfolio, 0), color: BRAND.liq },
  ];

  // ── §3 allocation donut + equity bars ───────────────────────────
  const fp = data.forwardPlan;
  const slices: AllocSlice[] = [
    { label: 'Equity', pct: Math.max(0, fp.currentEquityPct), color: BRAND.navy },
    { label: 'Hybrid', pct: Math.max(0, fp.currentHybridPct), color: BRAND.star },
    { label: 'Debt / Other', pct: Math.max(0, fp.currentDebtOtherPct), color: BRAND.teal },
  ].filter((s) => s.pct > 0.5);
  let equityGapVerb: string | null = null;
  let equityGapPts: number | null = null;
  if (fp.targetEquityPct != null) {
    const diff = fp.effectiveEquityPct - fp.targetEquityPct;
    equityGapPts = Math.abs(diff);
    equityGapVerb = Math.abs(diff) < 5 ? 'well-aligned' : diff > 0 ? 'over-weight on equity' : 'under-weight on equity';
  }

  // ── §4 moves — consolidated swaps + liquidations, by amount ──────
  const moveSrc = [...data.swapHoldings, ...data.liquidateHoldings].sort(
    (a, b) => b.currentValueInr - a.currentValueInr
  );
  const moves: MoveRow[] = moveSrc.map((h, i) => {
    const { action, label } = actionFor(h);
    const repl = h.preferredReplacementFundName ?? null;
    const replIsBuyList = !!h.buyListReplacementFundName && h.buyListReplacementFundName === h.preferredReplacementFundName;
    return {
      idx: i + 1,
      entity: h.entityName,
      action,
      actionLabel: h.v2ActionLabel || label,
      fund: h.fundName,
      category: h.category,
      replacement: repl,
      replacementIsBuyList: replIsBuyList,
      amountInr: h.currentValueInr,
    };
  });
  // NOTE: consolidationValueInr counts duplicate holdings across ALL tiers (incl.
  // KEEPs being folded together) — it is a SEPARATE measure from the sell-side
  // reallocation total, not a subset of it. Phrase it as a distinct housekeeping item.
  const consolidationNote = data.consolidationGroups.length
    ? `Separately, ${formatInrShort(data.consolidationValueInr)} sits in ${data.consolidationGroups.length} duplicate set${data.consolidationGroups.length > 1 ? 's' : ''} (held across tiers) — same-category overlaps to fold into the stronger fund in each pair; largely tax-neutral housekeeping, distinct from the moves above.`
    : null;

  // ── §5 tax ──────────────────────────────────────────────────────
  let taxLines: TaxLineRow[] | null = null;
  let taxHeadline: string | null = null;
  let taxExitCount = 0;
  if (data.taxSummary && data.taxSummary.exitCount > 0) {
    taxExitCount = data.taxSummary.exitCount;
    taxHeadline = data.taxSummary.headline;
    taxLines = data.taxSummary.lines.map((l) => ({
      fundName: l.fundName,
      gain: `${l.gainInr >= 0 ? '' : '−'}${formatInrShort(Math.abs(l.gainInr))}`,
      gainType: l.gainType,
      locked: l.locked,
      estTax: l.estTaxInr != null ? formatInrShort(l.estTaxInr) : '—',
      note: l.note,
    }));
  }

  // ── §6 SIP plan (illustrative) ──────────────────────────────────
  const rawReq = fp.requiredReturnPct;
  const assumedReturnPct = rawReq != null && rawReq >= 8 && rawReq <= 15 ? rawReq : 12;
  const hasGoal = fp.targetCorpusInr != null && fp.targetCorpusInr > 0 && fp.yearsToGoal != null && fp.yearsToGoal > 0;
  let sip: SipPlan = { hasGoal: false, years: 0, assumedReturnPct, projectedInr: 0, targetInr: 0, gapInr: 0, monthlySipInr: 0 };
  if (hasGoal) {
    const years = fp.yearsToGoal!;
    const months = years * 12;
    const projectedInr = data.currentValueInr * Math.pow(1 + assumedReturnPct / 100, years);
    const gapInr = Math.max(0, fp.targetCorpusInr! - projectedInr);
    sip = {
      hasGoal: true,
      years,
      assumedReturnPct,
      projectedInr,
      targetInr: fp.targetCorpusInr!,
      gapInr,
      monthlySipInr: requiredMonthlySip(gapInr, months, assumedReturnPct),
    };
  }

  // ── The GAP strip — the one sentence the whole engine exists to produce ──
  let gapStrip: PremiumModel['gapStrip'] = null;
  if (data.riskGap) {
    const g = data.riskGap;
    if (g.hasGap && g.carriedTier !== g.toleratedTier) {
      gapStrip = {
        aligned: false,
        text: `THE GAP — You are comfortable with ${g.toleratedTier} risk, but this portfolio carries ${g.carriedTier} risk: ${g.pctAboveCeiling}% of the equity book sits above your ceiling. The moves in this review close that gap, tax-sequenced.`,
      };
    } else if (g.hasGap) {
      // Weighted average rounds inside the ceiling, but a material tail breaches it.
      gapStrip = {
        aligned: false,
        text: `PARTIAL GAP — The overall mix sits at your ${g.toleratedTier} comfort ceiling, but ${g.pctAboveCeiling}% of the equity book runs ABOVE it. The trims in this review bring that tail back inside without disturbing the core.`,
      };
    } else {
      gapStrip = {
        aligned: true,
        text: `RISK ALIGNED — Your portfolio carries ${g.carriedTier} risk, matching your ${g.toleratedTier} comfort ceiling${g.pctAboveCeiling > 0 ? ` (a small ${g.pctAboveCeiling}% tail sits above it)` : ''}. No forced realignment.`,
      };
    }
  }

  // ── Money-weighted vs time-weighted return (honest, non-alarming) ──
  // We do NOT call the gap a "loss to timing" — our investor return is a
  // lump-sum-equivalent approximation, so for anyone investing via SIP it
  // understates the true money-weighted return by design. A lower number than
  // the fund's 3Y point-to-point return is NORMAL for steady investors (you
  // were buying along the way), not a mistake. We only surface this when the
  // gap is material, and we frame it as context, never as a rupee loss.
  let behaviourLine: PremiumModel['behaviourLine'] = null;
  if (data.behaviourGap) {
    const b = data.behaviourGap;
    if (b.gapPp < -2) {
      behaviourLine = {
        losing: false,
        text: `Your money's annualised return (${formatPct(b.weightedInvestorXirrPct, 1)}) is running ahead of your funds' 3Y point-to-point return (${formatPct(b.weightedFundCagr3yPct, 1)}) — the mark of steady, well-timed contributions. Keep the SIPs automated; this is exactly the behaviour that compounds wealth. (Covers ${b.coveragePct}% of the book.)`,
      };
    } else if (b.gapPp > 6) {
      behaviourLine = {
        losing: false,
        text: `A note on returns: your funds' 3Y point-to-point return is ${formatPct(b.weightedFundCagr3yPct, 1)}, while your invested money's annualised return is about ${formatPct(b.weightedInvestorXirrPct, 1)}. A gap like this is usually because money went in gradually or recently (SIP averaging) — not mis-timing. What protects returns is staying invested through dips; if past corrections ever tempted you to pause SIPs, that's the one habit worth locking down. (Indicative — money-weighted vs time-weighted, different periods.)`,
      };
    }
  }

  // ── Risk KPI tiles ──
  const riskKpiTiles: PremiumModel['riskKpiTiles'] = [];
  if (data.riskKpis) {
    const k = data.riskKpis;
    if (k.weightedVolPct != null) riskKpiTiles.push({ label: 'Portfolio volatility', value: formatPct(k.weightedVolPct, 1), sub: 'weighted fund 3Y annualised' });
    if (k.weightedSharpe != null) riskKpiTiles.push({ label: 'Risk-adjusted (Sharpe)', value: k.weightedSharpe.toFixed(2), sub: 'weighted fund Sharpe ratio' });
    if (riskKpiTiles.length) riskKpiTiles.push({ label: 'Data coverage', value: `${k.coveragePct}%`, sub: 'of current value with stats' });
  }

  // ── Benchmark block ──
  let benchmarkBlock: PremiumModel['benchmarkBlock'] = null;
  if (data.benchmark) {
    const bm = data.benchmark;
    const verb = bm.alphaPp >= 1 ? `AHEAD of the blended index path by ${bm.alphaPp} pp a year` : bm.alphaPp <= -1 ? `BEHIND the blended index path by ${Math.abs(bm.alphaPp)} pp a year` : 'broadly in line with the blended index path';
    benchmarkBlock = {
      portfolioPct: bm.portfolioCagr3yPct,
      blendedPct: bm.blendedBenchmarkPct,
      alphaPp: bm.alphaPp,
      verdictLine: `Your funds' weighted 3Y return is ${verb}.`,
      footnote: `Benchmark blended to your ${formatPct(bm.equityWeightPct, 0)} effective equity mix: ${bm.equityProxyName} ${formatPct(bm.equityProxyCagr3yPct, 1)} + ${bm.debtProxyName} ${formatPct(bm.debtProxyCagr3yPct, 1)}. Time-weighted vs time-weighted (3Y CAGR both sides); covers ${bm.coveragePct}% of current value. Family XIRR (${data.familyXirrPct != null ? formatPct(data.familyXirrPct, 1) : 'NM'}) is money-weighted and not directly comparable.`,
    };
  }

  // ── Monte Carlo block ──
  let mcBlock: PremiumModel['mcBlock'] = null;
  if (data.monteCarlo && sip.hasGoal) {
    const m2 = data.monteCarlo;
    mcBlock = {
      headline: `${m2.pSuccess.toFixed(0)}% probability of reaching ${formatInrShort(sip.targetInr)} in ${sip.years} years`,
      subline: `On the current ₹${Math.round(fp.monthlySipInr).toLocaleString('en-IN')}/month SIP — 10,000 market scenarios at ${formatPct(m2.assumedReturnPct, 0)} expected return, ${formatPct(m2.assumedVolPct, 0)} volatility.`,
      coneLine: `Outcomes range ${formatInrShort(m2.p10Inr)} (weak markets) · ${formatInrShort(m2.p50Inr)} (median) · ${formatInrShort(m2.p90Inr)} (strong markets).`,
      stepUpLine: m2.requiredSipFor90Inr != null
        ? `For ~90% confidence, step the SIP up to ₹${m2.requiredSipFor90Inr.toLocaleString('en-IN')}/month.`
        : m2.pSuccess >= 90 ? 'Already at ≥90% confidence on the current path.' : null,
    };
  }

  // ── Stock-level look-through block ──
  let lookThroughBlock: PremiumModel['lookThroughBlock'] = null;
  const lt = data.stockLookThrough;
  if (lt && lt.hasData && lt.topStocks.length > 0) {
    const top = lt.topStocks.slice(0, 8);
    const topConc = top.reduce((s, x) => s + x.effectivePctOfFamily, 0);
    const multi = top.filter((x) => x.fundCount >= 2);
    lookThroughBlock = {
      headline: `Your top ${top.length} underlying stocks make up ${topConc.toFixed(1)}% of the portfolio${multi.length ? `, and ${multi.length} of them reach you through 2+ funds at once` : ''}.`,
      coverageLine: `Looked through ${lt.coveredFunds} of ${lt.totalFunds} funds (${lt.coveragePct.toFixed(0)}% of corpus has disclosed holdings). Fund-level diversification can hide this single-stock concentration.`,
      stocks: top.map((x) => ({
        name: x.stock,
        pct: x.effectivePctOfFamily,
        valueShort: formatInrShort(x.effectiveValueInr),
        fundCount: x.fundCount,
      })),
      sectorLine: lt.sectorConcentration.length
        ? 'Sector tilt (of looked-through equity): ' + lt.sectorConcentration.slice(0, 4).map((s) => `${s.sector} ${s.pctOfCovered.toFixed(0)}%`).join(' · ')
        : '',
      asOfLine: lt.asOfDate ? `Underlying holdings as disclosed by the AMCs for ${lt.asOfDate}.` : '',
    };
  }

  const entitiesLine = data.entitiesCovered && data.entitiesCovered.length
    ? data.entitiesCovered.join(' · ')
    : `${data.numEntities} PAN${data.numEntities > 1 ? 's' : ''}`;

  return {
    familyName: data.familyName,
    reportDate: data.reportDate,
    reportDateIso: data.reportDateIso,
    documentId: data.documentId,
    rmName: data.rmName,
    entitiesLine,
    riskProfileCaptured: data.riskProfileCaptured,
    kpis,
    honestLead,
    honestBody,
    showNumbersNote,
    tierBars,
    tierTable,
    alloc: {
      slices,
      effectiveEquityPct: fp.effectiveEquityPct,
      targetEquityPct: fp.targetEquityPct,
      equityGapVerb,
      equityGapPts,
    },
    moves,
    movesTotal: formatInrShort(data.totalReallocationInr),
    consolidationNote,
    taxLines,
    taxHeadline,
    taxExitCount,
    sip,
    gapStrip,
    behaviourLine,
    riskKpiTiles,
    benchmarkBlock,
    mcBlock,
    lookThroughBlock,
  };
}

/** Verbatim, compliance-locked strings. Imported (not inlined) so the exact
 *  SEBI wording can never be paraphrased by accident. The words advisor/adviser/
 *  advisory appear ONLY inside the regulation's official name. */
export const COMPLIANCE = {
  credential:
    'Trustner Asset Services Pvt. Ltd. — AMFI registered Mutual Fund Distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886.',
  cin: 'CIN: U66301AS2023PTC025505',
  marketRisk:
    'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.',
  pastPerf: 'Past performance is not indicative of future results.',
  taxIndicative:
    'Tax estimates are indicative only — please confirm the final liability with your Chartered Accountant before acting.',
  notAdvice:
    'The verdicts (STAR / KEEP / WATCH / SWAP / LIQUIDATE), consolidation groupings and fund-selection observations in this report reflect Trustner’s house analytical and distribution view based on each fund’s track record, manager quality, category positioning and category-benchmark data. This report does NOT constitute investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013. Final investment decisions rest with each PAN holder.',
  firmLine: 'Trustner Asset Services Pvt. Ltd. · ARN-286886 · trustner.in · merasip.com',
} as const;
