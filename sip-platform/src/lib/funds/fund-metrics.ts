/**
 * Fund metrics engine — SEBI/AMFI-standard returns & risk, computed from a NAV
 * series. This is the "brain" of the self-maintaining universe data engine
 * (Jun 2026): it lets merasip.com compute its OWN authoritative numbers from
 * AMFI NAV history, with zero dependence on any vendor export.
 *
 * Methodology (the industry standard — what AMFI factsheets / Value Research /
 * Morningstar use):
 *  • Trailing returns are point-to-point: r = NAV_now / NAV_then − 1, where
 *    NAV_then is the latest NAV on or before the exact calendar anchor date
 *    (today minus N days/months/years). Holidays/weekends roll back to the last
 *    traded NAV — never forward.
 *  • Periods ≤ 1 year are ABSOLUTE returns; periods > 1 year are ANNUALISED
 *    (CAGR): (NAV_now / NAV_then)^(1/years) − 1. This is the SEBI convention.
 *  • Risk metrics use DAILY log-or-simple returns over a trailing window
 *    (default 3y, capped to available history), annualised by √252:
 *      – volatility  = stdev(daily) × √252
 *      – Sharpe      = (annualised return − riskFree) / volatility
 *      – Sortino     = (annualised return − riskFree) / downsideDeviation×√252
 *      – maxDrawdown = worst peak-to-trough decline over the window
 *
 * Returns are DECIMAL fractions (0.1364 = 13.64%), null when history is too
 * short for a window. Pure & deterministic — unit-tested in _proof_fund_metrics.
 */

const DAY_MS = 86_400_000;
const TRADING_DAYS_PER_YEAR = 252;

export interface NavPoint {
  /** epoch ms (UTC midnight) of the NAV date */
  t: number;
  nav: number;
}

/** Parse AMFI/MFAPI "DD-MM-YYYY" → epoch ms (UTC). */
export function parseDmyMs(dateStr: string): number {
  const [dd, mm, yyyy] = dateStr.split('-');
  return Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd));
}

/** Clean + sort a raw NAV array to a NEWEST-first NavPoint[]. */
export function toNavSeries(raw: Array<{ date: string; nav: string | number }>): NavPoint[] {
  return raw
    .map((r) => ({ t: parseDmyMs(String(r.date)), nav: Number(r.nav) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.nav) && p.nav > 0)
    .sort((a, b) => b.t - a.t);
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Latest NAV on or before `targetMs` (series is newest-first). null if none. */
function navOnOrBefore(series: NavPoint[], targetMs: number): number | null {
  for (const p of series) if (p.t <= targetMs) return p.nav;
  return null;
}

/** Subtract `months` calendar months from an epoch-ms date (clamps day-of-month). */
function minusMonths(ms: number, months: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months, d.getUTCDate());
}

export interface TrailingReturns {
  ret_1d: number | null;
  ret_1w: number | null;
  ret_1m: number | null;
  ret_3m: number | null;
  ret_6m: number | null;
  ret_1y: number | null;   // absolute
  ret_3y: number | null;   // CAGR
  ret_5y: number | null;   // CAGR
  ret_si: number | null;   // since inception, CAGR if ≥1y else absolute
  asofMs: number;
}

/** SEBI-standard trailing returns from a NAV series. */
export function trailingReturns(series: NavPoint[]): TrailingReturns | null {
  if (series.length < 2) return null;
  const latest = series[0];
  const now = latest.nav;

  const absOver = (anchorMs: number): number | null => {
    const base = navOnOrBefore(series, anchorMs);
    return base ? round6(now / base - 1) : null;
  };
  const cagrOver = (anchorMs: number, years: number): number | null => {
    const base = navOnOrBefore(series, anchorMs);
    return base ? round6(Math.pow(now / base, 1 / years) - 1) : null;
  };

  // Since inception = oldest point; CAGR if ≥ 1y of history, else absolute.
  const oldest = series[series.length - 1];
  const siYears = (latest.t - oldest.t) / (365.25 * DAY_MS);
  const ret_si = oldest.nav
    ? round6(siYears >= 1 ? Math.pow(now / oldest.nav, 1 / siYears) - 1 : now / oldest.nav - 1)
    : null;

  return {
    ret_1d: series[1] ? round6(now / series[1].nav - 1) : null, // previous traded NAV
    ret_1w: absOver(latest.t - 7 * DAY_MS),
    ret_1m: absOver(minusMonths(latest.t, 1)),
    ret_3m: absOver(minusMonths(latest.t, 3)),
    ret_6m: absOver(minusMonths(latest.t, 6)),
    ret_1y: absOver(minusMonths(latest.t, 12)),
    ret_3y: cagrOver(minusMonths(latest.t, 36), 3),
    ret_5y: cagrOver(minusMonths(latest.t, 60), 5),
    ret_si,
    asofMs: latest.t,
  };
}

export interface RiskMetrics {
  volatility: number | null;   // annualised
  sharpe: number | null;
  sortino: number | null;
  maxDrawdown: number | null;  // negative fraction, e.g. -0.32
  sampleDays: number;
}

/**
 * Risk metrics over the trailing `windowYears` (default 3y), using daily simple
 * returns of the chronological NAV series. `riskFree` is the annual risk-free
 * rate (decimal, e.g. 0.065). Needs ≥ ~60 daily points to be meaningful.
 */
export function riskMetrics(series: NavPoint[], opts?: { windowYears?: number; riskFree?: number }): RiskMetrics {
  const windowYears = opts?.windowYears ?? 3;
  const riskFree = opts?.riskFree ?? 0.065;
  const empty: RiskMetrics = { volatility: null, sharpe: null, sortino: null, maxDrawdown: null, sampleDays: 0 };
  if (series.length < 30) return empty;

  const latest = series[0];
  const cutoff = latest.t - windowYears * 365.25 * DAY_MS;
  // chronological (oldest→newest), within the window
  const chron = series.filter((p) => p.t >= cutoff).sort((a, b) => a.t - b.t);
  if (chron.length < 30) return empty;

  const daily: number[] = [];
  for (let i = 1; i < chron.length; i++) {
    const prev = chron[i - 1].nav;
    if (prev > 0) daily.push(chron[i].nav / prev - 1);
  }
  if (daily.length < 20) return empty;

  const mean = daily.reduce((s, x) => s + x, 0) / daily.length;
  const variance = daily.reduce((s, x) => s + (x - mean) ** 2, 0) / (daily.length - 1);
  const sd = Math.sqrt(variance);
  const vol = sd * Math.sqrt(TRADING_DAYS_PER_YEAR);

  const downside = daily.filter((x) => x < 0);
  const downVar = downside.length
    ? downside.reduce((s, x) => s + x ** 2, 0) / downside.length
    : 0;
  const downDev = Math.sqrt(downVar) * Math.sqrt(TRADING_DAYS_PER_YEAR);

  // annualised return of the window (CAGR) for the ratios
  const years = (chron[chron.length - 1].t - chron[0].t) / (365.25 * DAY_MS) || 1;
  const annReturn = Math.pow(chron[chron.length - 1].nav / chron[0].nav, 1 / years) - 1;

  // max drawdown over the window
  let peak = chron[0].nav, maxDd = 0;
  for (const p of chron) {
    if (p.nav > peak) peak = p.nav;
    const dd = p.nav / peak - 1;
    if (dd < maxDd) maxDd = dd;
  }

  return {
    volatility: round6(vol),
    sharpe: vol > 0 ? round6((annReturn - riskFree) / vol) : null,
    sortino: downDev > 0 ? round6((annReturn - riskFree) / downDev) : null,
    maxDrawdown: round6(maxDd),
    sampleDays: daily.length,
  };
}
