/**
 * On-demand 3-Year ROLLING returns — the methodology's #1 rule ("rolling only,
 * never point-to-point"). Fetches a fund's full NAV history (MFAPI, cached) and
 * averages every 3-year return window, sampled monthly.
 *
 * Used by the v2 adapter to fill FundStats.rolling3yPct for the funds in a
 * client's portfolio (bounded N ≈ 15-25 per diagnostic). Falls back silently to
 * null (→ engine uses point-to-point proxy) on any fetch/compute failure.
 */
import { getNavHistory } from '@/lib/services/mfapi';
import type { NavHistoryPoint } from '@/types/live-fund';

/** Average of all 3-year annualised return windows, sampled ~monthly. */
export function compute3yRollingAvg(points: NavHistoryPoint[]): number | null {
  if (!points || points.length < 50) return null;
  // ensure ascending by date
  const pts = [...points].sort((a, b) => a.date.localeCompare(b.date));
  // index by time for fast "≈3y earlier" lookup
  const asTime = pts.map(p => ({ t: new Date(p.date).getTime(), nav: p.nav }));
  const THREE_Y = 3 * 365.25 * 86400000;
  const windows: number[] = [];
  // sample end-points ~monthly: step through pts every ~21 trading days
  const step = Math.max(1, Math.floor(pts.length / 240)); // ~ monthly over up to 20y
  for (let i = 0; i < asTime.length; i += step) {
    const end = asTime[i];
    const targetStart = end.t - THREE_Y;
    // find the point closest to 3y before `end` (binary-ish linear back-scan)
    let startIdx = -1;
    for (let j = i; j >= 0; j--) {
      if (asTime[j].t <= targetStart) { startIdx = j; break; }
    }
    if (startIdx < 0) continue;
    const start = asTime[startIdx];
    if (start.nav > 0 && end.nav > 0) {
      const yrs = (end.t - start.t) / (365.25 * 86400000);
      if (yrs >= 2.8 && yrs <= 3.3) {
        windows.push(Math.pow(end.nav / start.nav, 1 / yrs) - 1);
      }
    }
  }
  if (windows.length < 6) return null; // not enough 3y windows for a stable average
  const avg = windows.reduce((s, x) => s + x, 0) / windows.length;
  return avg; // decimal (0.15 = 15%)
}

/** Fetch + compute 3Y rolling avg for a single AMFI scheme code. */
export async function fetchRolling3y(amfiCode: string): Promise<number | null> {
  const code = parseInt(amfiCode, 10);
  if (!Number.isFinite(code)) return null;
  try {
    const hist = await getNavHistory(code, 'MAX');
    return compute3yRollingAvg(hist);
  } catch {
    return null;
  }
}

/** Batch — resolve rolling returns for many funds in parallel (bounded). */
export async function fetchRolling3yBatch(amfiCodes: (string | null)[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const unique = [...new Set(amfiCodes.filter((c): c is string => !!c))];
  const results = await Promise.all(unique.map(async (c) => [c, await fetchRolling3y(c)] as const));
  for (const [c, v] of results) if (v != null) out.set(c, v);
  return out;
}
