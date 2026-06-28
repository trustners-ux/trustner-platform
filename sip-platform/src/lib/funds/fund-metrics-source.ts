/**
 * Fetch + identity-verify + compute one fund's metrics from authoritative NAV.
 * Shared by the daily cron (/api/cron/universe-metrics) and the backfill script,
 * so there is ONE source of truth for the pipeline. Part of the self-maintaining
 * universe engine (memory project-funds-auto-engine).
 *
 * Source: MFAPI (api.mfapi.in) — keyed by AMFI scheme code, mirrors the official
 * AMFI NAV. Returns full history + meta. We verify the code maps to the fund we
 * think it does (an identity gate) before trusting the computed numbers.
 */
import { toNavSeries, trailingReturns, riskMetrics } from './fund-metrics';

export interface ComputedFundMetrics {
  amfi_code: string;
  asof_date: string | null;
  ret_1d: number | null; ret_1w: number | null; ret_1m: number | null;
  ret_3m: number | null; ret_6m: number | null; ret_1y: number | null;
  ret_3y: number | null; ret_5y: number | null; ret_si: number | null;
  volatility: number | null; sharpe: number | null; sortino: number | null;
  max_drawdown: number | null;
  identity_ok: boolean;
  identity_note: string | null;
  nav_points: number;
}

const STOP = new Set([
  'fund', 'plan', 'option', 'growth', 'idcw', 'dividend', 'payout', 'reinvestment',
  'regular', 'direct', 'scheme', 'the', 'of', 'and', 'mutual', 'open', 'ended', 'g',
]);
const tokens = (s: string) =>
  new Set(
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
  );

/**
 * Identity gate: does the MFAPI scheme name plausibly match OUR scheme name,
 * and is it the right (regular, not direct) plan? Lenient — flags only clear
 * mismatches, since amfi_code is normally exact.
 */
function checkIdentity(mfapiName: string, ourName: string): { ok: boolean; note: string | null } {
  const m = (mfapiName || '').toLowerCase();
  if (!m) return { ok: false, note: 'MFAPI returned no scheme name' };
  // Our universe is Regular plans; a Direct-plan NAV would be wrong.
  if (/\bdirect\b/.test(m) && !/\bregular\b/.test(m)) {
    return { ok: false, note: `MFAPI code is a DIRECT plan: "${mfapiName}"` };
  }
  const a = tokens(ourName), b = tokens(mfapiName);
  if (a.size === 0) return { ok: true, note: null };
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  const overlap = hit / a.size;
  if (overlap < 0.5) {
    return { ok: false, note: `name mismatch (${Math.round(overlap * 100)}% overlap): ours "${ourName}" vs MFAPI "${mfapiName}"` };
  }
  return { ok: true, note: null };
}

const NULLS = {
  ret_1d: null, ret_1w: null, ret_1m: null, ret_3m: null, ret_6m: null,
  ret_1y: null, ret_3y: null, ret_5y: null, ret_si: null,
  volatility: null, sharpe: null, sortino: null, max_drawdown: null,
};

export async function fetchAndComputeFund(
  amfiCode: string,
  ourSchemeName: string,
  opts?: { riskFree?: number; timeoutMs?: number }
): Promise<ComputedFundMetrics> {
  const base: ComputedFundMetrics = {
    amfi_code: amfiCode, asof_date: null, ...NULLS,
    identity_ok: false, identity_note: null, nav_points: 0,
  };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 9000);
    const res = await fetch(`https://api.mfapi.in/mf/${amfiCode}`, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) return { ...base, identity_note: `MFAPI HTTP ${res.status}` };
    const json = (await res.json()) as {
      status?: string;
      meta?: { scheme_name?: string };
      data?: Array<{ date: string; nav: string }>;
    };
    if (json.status !== 'SUCCESS' || !Array.isArray(json.data) || json.data.length === 0) {
      return { ...base, identity_note: 'MFAPI: no NAV data' };
    }

    const id = checkIdentity(json.meta?.scheme_name || '', ourSchemeName);
    const series = toNavSeries(json.data);
    const tr = trailingReturns(series);
    const rk = riskMetrics(series, { riskFree: opts?.riskFree });
    const asof = series.length ? new Date(series[0].t).toISOString().slice(0, 10) : null;

    return {
      amfi_code: amfiCode,
      asof_date: asof,
      ret_1d: tr?.ret_1d ?? null, ret_1w: tr?.ret_1w ?? null, ret_1m: tr?.ret_1m ?? null,
      ret_3m: tr?.ret_3m ?? null, ret_6m: tr?.ret_6m ?? null, ret_1y: tr?.ret_1y ?? null,
      ret_3y: tr?.ret_3y ?? null, ret_5y: tr?.ret_5y ?? null, ret_si: tr?.ret_si ?? null,
      volatility: rk.volatility, sharpe: rk.sharpe, sortino: rk.sortino, max_drawdown: rk.maxDrawdown,
      identity_ok: id.ok,
      identity_note: id.note,
      nav_points: series.length,
    };
  } catch (e) {
    return { ...base, identity_note: `fetch error: ${(e as Error).name}` };
  }
}
