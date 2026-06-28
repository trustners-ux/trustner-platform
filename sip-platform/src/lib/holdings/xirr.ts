/**
 * XIRR — annualized internal rate of return on irregular cash flows.
 *
 * Cash flow convention: investments are NEGATIVE, redemptions/withdrawals
 * are POSITIVE, current market value is POSITIVE at "today".
 *
 * Newton-Raphson with bisection fallback. Converges in <20 iterations for
 * typical Indian MF cashflow patterns.
 */

export interface Cashflow {
  amount: number; // ₹; negative = invested, positive = received
  date: Date;
}

/** Year fraction between two dates (365-day basis, matches Excel XIRR). */
function yearFraction(d1: Date, d2: Date): number {
  return (d2.getTime() - d1.getTime()) / (365 * 86400000);
}

/** NPV at given rate. */
function npv(rate: number, flows: Cashflow[], anchor: Date): number {
  let sum = 0;
  for (const f of flows) {
    const t = yearFraction(anchor, f.date);
    sum += f.amount / Math.pow(1 + rate, t);
  }
  return sum;
}

/** NPV derivative. */
function npvPrime(rate: number, flows: Cashflow[], anchor: Date): number {
  let sum = 0;
  for (const f of flows) {
    const t = yearFraction(anchor, f.date);
    sum += -t * f.amount / Math.pow(1 + rate, t + 1);
  }
  return sum;
}

/**
 * Compute XIRR. Returns annualized rate as decimal (0.12 = 12%).
 * Returns null if cashflows are degenerate (e.g., all same sign, single flow).
 */
export function xirr(flows: Cashflow[], guess = 0.1): number | null {
  if (flows.length < 2) return null;

  const hasPos = flows.some((f) => f.amount > 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg) return null;

  // Anchor at the earliest date
  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const anchor = sorted[0].date;

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < 50; i++) {
    const f = npv(rate, flows, anchor);
    if (Math.abs(f) < 1e-7) return rate;
    const fp = npvPrime(rate, flows, anchor);
    if (Math.abs(fp) < 1e-10) break;
    const newRate = rate - f / fp;
    if (Math.abs(newRate - rate) < 1e-9) return newRate;
    if (!Number.isFinite(newRate) || newRate <= -1) break;
    rate = newRate;
  }

  // Bisection fallback over [-0.99, 10]
  let lo = -0.99;
  let hi = 10;
  let fLo = npv(lo, flows, anchor);
  let fHi = npv(hi, flows, anchor);
  if (fLo * fHi > 0) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows, anchor);
    if (Math.abs(fMid) < 1e-7 || (hi - lo) < 1e-9) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** Build XIRR cashflows from a simple invested-vs-current pair (no txn history). */
export function simpleXirr(
  invested: number,
  currentValue: number,
  investedOn: Date,
  asOf: Date = new Date(),
): number | null {
  return xirr([
    { amount: -Math.abs(invested), date: investedOn },
    { amount: Math.abs(currentValue), date: asOf },
  ]);
}
