/**
 * Trustner Verdict Engine v2 — BACKTEST OVERLAY (REEDOS-parity)
 * ================================================================
 * REEDOS's product deck shows a "what if you had held the suggested
 * portfolio instead" historical NAV-indexed overlay chart. This computes
 * the equivalent: index the CURRENT portfolio's weights and the SUGGESTED
 * (post-rebalance) portfolio's weights against the SAME historical NAV
 * series for every fund involved, over a shared trailing window, both
 * starting at 100.
 *
 * This is a historical SIMULATION assuming static weights held throughout
 * the window (no trade timing/costs modelled) — it answers "how would these
 * two baskets of funds have compared", not "what you'd have actually
 * earned net of switching". Funds with no fetchable NAV history covering
 * the full window are dropped and the remaining weights renormalised; the
 * result carries a coverage% so the caller can decide whether to show it.
 */
import { getNavHistory } from '@/lib/services/mfapi';

export interface BacktestWeight {
  amfiCode: string | null;
  valueInr: number;
}
export interface BacktestPoint {
  date: string;             // YYYY-MM-DD, month-end grid point
  currentIndexed: number;   // indexed to 100 at the start of the window
  suggestedIndexed: number;
}
export interface BacktestResult {
  points: BacktestPoint[];
  startDate: string;
  endDate: string;
  currentTotalReturnPct: number;
  suggestedTotalReturnPct: number;
  currentCoveragePct: number;
  suggestedCoveragePct: number;
}

interface NavSeriesPoint { t: number; nav: number }

function monthEndGrid(monthsBack: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  for (let i = monthsBack; i >= 0; i--) {
    out.push(new Date(now.getFullYear(), now.getMonth() - i + 1, 0)); // last day of that month
  }
  return out;
}

/** Binary search: latest NAV at-or-before `targetMs` in an ascending-by-time series. */
function navOnOrBefore(series: NavSeriesPoint[], targetMs: number): number | null {
  let lo = 0, hi = series.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].t <= targetMs) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans >= 0 ? series[ans].nav : null;
}

export async function computeBacktest(
  currentWeights: BacktestWeight[],
  suggestedWeights: BacktestWeight[],
  monthsBack = 18
): Promise<BacktestResult | null> {
  const codes = Array.from(
    new Set([...currentWeights, ...suggestedWeights].map((w) => w.amfiCode).filter((c): c is string => !!c))
  );
  if (codes.length === 0) return null;

  const histories = new Map<string, NavSeriesPoint[]>();
  await Promise.all(
    codes.map(async (code) => {
      const n = parseInt(code, 10);
      if (!Number.isFinite(n)) return;
      try {
        const hist = await getNavHistory(n, 'MAX');
        if (!hist || hist.length < 30) return;
        const series = hist
          .map((p) => ({ t: new Date(p.date).getTime(), nav: p.nav }))
          .filter((p) => Number.isFinite(p.t) && p.nav > 0)
          .sort((a, b) => a.t - b.t);
        if (series.length >= 30) histories.set(code, series);
      } catch { /* leave this fund uncovered — dropped from the simulation below */ }
    })
  );

  const grid = monthEndGrid(monthsBack);
  const startMs = grid[0].getTime();

  const usable = (weights: BacktestWeight[]) =>
    weights.filter((w) => {
      if (!w.amfiCode) return false;
      const s = histories.get(w.amfiCode);
      return !!s && s[0].t <= startMs;
    });
  const curUsable = usable(currentWeights);
  const sugUsable = usable(suggestedWeights);

  const curTotal = currentWeights.reduce((s, w) => s + w.valueInr, 0);
  const sugTotal = suggestedWeights.reduce((s, w) => s + w.valueInr, 0);
  const curUsableTotal = curUsable.reduce((s, w) => s + w.valueInr, 0);
  const sugUsableTotal = sugUsable.reduce((s, w) => s + w.valueInr, 0);
  const currentCoveragePct = curTotal > 0 ? Math.round((curUsableTotal / curTotal) * 100) : 0;
  const suggestedCoveragePct = sugTotal > 0 ? Math.round((sugUsableTotal / sugTotal) * 100) : 0;

  // Require reasonable coverage on BOTH baskets — a low-coverage chart would
  // mislead more than it informs.
  if (currentCoveragePct < 40 || suggestedCoveragePct < 40 || curUsableTotal <= 0 || sugUsableTotal <= 0) return null;

  const startNav = new Map<string, number>();
  for (const [code, series] of histories.entries()) {
    const nav = navOnOrBefore(series, startMs);
    if (nav != null) startNav.set(code, nav);
  }

  const indexFor = (weights: BacktestWeight[], usableTotal: number, atMs: number): number => {
    let acc = 0;
    for (const w of weights) {
      if (!w.amfiCode) continue;
      const series = histories.get(w.amfiCode);
      const sNav = startNav.get(w.amfiCode);
      if (!series || sNav == null) continue;
      const nav = navOnOrBefore(series, atMs);
      if (nav == null) continue;
      acc += (w.valueInr / usableTotal) * (nav / sNav) * 100;
    }
    return acc;
  };

  const points: BacktestPoint[] = grid.map((d) => {
    const ms = d.getTime();
    return {
      date: d.toISOString().slice(0, 10),
      currentIndexed: Math.round(indexFor(curUsable, curUsableTotal, ms) * 10) / 10,
      suggestedIndexed: Math.round(indexFor(sugUsable, sugUsableTotal, ms) * 10) / 10,
    };
  });

  const first = points[0];
  const last = points[points.length - 1];
  return {
    points,
    startDate: first.date,
    endDate: last.date,
    currentTotalReturnPct: Math.round((last.currentIndexed - first.currentIndexed) * 10) / 10,
    suggestedTotalReturnPct: Math.round((last.suggestedIndexed - first.suggestedIndexed) * 10) / 10,
    currentCoveragePct,
    suggestedCoveragePct,
  };
}

/** Render the backtest as a self-contained inline SVG line chart (current vs suggested). */
export function renderBacktestSvg(bt: BacktestResult, opts?: { width?: number; height?: number }): string {
  const width = opts?.width ?? 640;
  const height = opts?.height ?? 220;
  const padL = 42, padR = 10, padT = 12, padB = 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = bt.points.flatMap((p) => [p.currentIndexed, p.suggestedIndexed]);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const span = Math.max(1, maxV - minV);
  const yFor = (v: number) => padT + plotH - ((v - minV) / span) * plotH;
  const xFor = (i: number) => padL + (i / Math.max(1, bt.points.length - 1)) * plotW;

  const pathFor = (key: 'currentIndexed' | 'suggestedIndexed') =>
    bt.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p[key]).toFixed(1)}`).join(' ');

  // 4 horizontal gridlines + value labels
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const v = minV + (span * i) / 3;
    const y = yFor(v);
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#E5E7EB" stroke-width="1"/>
      <text x="${padL - 4}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="7" fill="#94A3B8" font-family="Helvetica Neue, Arial, sans-serif">${v.toFixed(0)}</text>`;
  }).join('');

  // sparse date labels (start, mid, end)
  const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  const midIdx = Math.floor((bt.points.length - 1) / 2);
  const dateLabels = [0, midIdx, bt.points.length - 1]
    .map((i) => `<text x="${xFor(i).toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="7" fill="#94A3B8" font-family="Helvetica Neue, Arial, sans-serif">${dateLabel(bt.points[i].date)}</text>`)
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:${width}px; display:block; margin:0 auto;">
    ${gridLines}
    <path d="${pathFor('currentIndexed')}" fill="none" stroke="#E0115F" stroke-width="2"/>
    <path d="${pathFor('suggestedIndexed')}" fill="none" stroke="#0D9488" stroke-width="2"/>
    ${dateLabels}
    <circle cx="${padL + 8}" cy="${padT + 6}" r="3" fill="#E0115F"/>
    <text x="${padL + 15}" y="${padT + 9}" font-size="7.5" font-weight="700" fill="#1F2937" font-family="Helvetica Neue, Arial, sans-serif">Current Portfolio</text>
    <circle cx="${padL + 110}" cy="${padT + 6}" r="3" fill="#0D9488"/>
    <text x="${padL + 117}" y="${padT + 9}" font-size="7.5" font-weight="700" fill="#1F2937" font-family="Helvetica Neue, Arial, sans-serif">Suggested Portfolio</text>
  </svg>`;
}
