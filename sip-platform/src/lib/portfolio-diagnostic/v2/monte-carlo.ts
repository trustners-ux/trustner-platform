/**
 * Goal Monte Carlo v1 — probability of reaching the family's goal corpus.
 *
 * 10,000 lognormal monthly paths of (current corpus + monthly SIP), seeded so
 * the same inputs always produce the same probability (reports must be
 * reproducible — a re-render can't show a different number to the client).
 *
 * Deliberately simple v1 (per the locked Do-NOT-Do list: no regime models, no
 * fat tails until the simple number has been in client hands for a quarter):
 *   monthly log-return ~ N(mu_m - sigma_m^2/2, sigma_m), GBM discretisation.
 *
 * Pure function, no I/O — covered by _proof_montecarlo.ts.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export interface GoalMcInput {
  currentValueInr: number;
  monthlySipInr: number;       // current ongoing SIP flow (0 is fine)
  years: number;               // horizon to the goal
  targetCorpusInr: number;     // the goal
  expReturnPct: number;        // expected annual return, e.g. 12
  volPct: number;              // annual volatility, e.g. 14
  paths?: number;              // default 10,000
  seed?: number;               // default 42
}

export interface GoalMcResult {
  pSuccess: number;            // 0-100, % of paths ending >= target
  p10Inr: number;              // pessimistic (10th percentile) ending corpus
  p50Inr: number;              // median ending corpus
  p90Inr: number;              // optimistic (90th percentile) ending corpus
  requiredSipFor90Inr: number | null; // monthly SIP for ~90% success (null if unreachable/already met)
}

/** Deterministic PRNG (mulberry32) — stable across Node versions. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box-Muller (uses two uniforms per draw). */
function makeNormal(rand: () => number): () => number {
  return () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
}

function simulateEndings(input: Required<Pick<GoalMcInput, 'currentValueInr' | 'monthlySipInr' | 'years' | 'expReturnPct' | 'volPct' | 'paths' | 'seed'>>): Float64Array {
  const { currentValueInr, monthlySipInr, years, expReturnPct, volPct, paths, seed } = input;
  const months = Math.max(1, Math.round(years * 12));
  const muM = Math.log(1 + expReturnPct / 100) / 12;     // monthly log drift (so e^(12*muM)-1 = annual)
  const sigM = (volPct / 100) / Math.sqrt(12);
  const drift = muM - (sigM * sigM) / 2;
  const normal = makeNormal(mulberry32(seed));
  const endings = new Float64Array(paths);
  for (let p = 0; p < paths; p++) {
    let v = currentValueInr;
    for (let m = 0; m < months; m++) {
      v = v * Math.exp(drift + sigM * normal()) + monthlySipInr;
      if (v < 0) v = 0;
    }
    endings[p] = v;
  }
  return endings.sort();
}

function percentile(sorted: Float64Array, q: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
  return sorted[idx];
}

export function runGoalMonteCarlo(input: GoalMcInput): GoalMcResult {
  const paths = input.paths ?? 10_000;
  const seed = input.seed ?? 42;
  const base = {
    currentValueInr: Math.max(0, input.currentValueInr),
    monthlySipInr: Math.max(0, input.monthlySipInr),
    years: input.years,
    expReturnPct: input.expReturnPct,
    // Clamp to a plausible annual-equity-vol band. Guards against a unit
    // error (a fraction like 0.14 slipping through → near-deterministic paths,
    // or a percent like 1400) silently producing false confidence.
    volPct: Math.min(60, Math.max(2, input.volPct)),
    paths,
    seed,
  };
  const endings = simulateEndings(base);
  const target = input.targetCorpusInr;
  // count successes (sorted array → first index >= target)
  let lo = 0, hi = endings.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (endings[mid] < target) lo = mid + 1; else hi = mid; }
  const pSuccess = ((endings.length - lo) / endings.length) * 100;

  // Required SIP for ~90% success — bisection on monthlySip with fewer paths
  // (2,000) for speed; null when even a very large SIP can't reach 90% or when
  // the goal is already ≥90% funded by the current trajectory.
  let requiredSipFor90Inr: number | null = null;
  if (pSuccess < 90) {
    const probeP = (sip: number) => {
      const e = simulateEndings({ ...base, monthlySipInr: sip, paths: 2_000 });
      let l = 0, h = e.length;
      while (l < h) { const m = (l + h) >> 1; if (e[m] < target) l = m + 1; else h = m; }
      return ((e.length - l) / e.length) * 100;
    };
    const cap = Math.max(50_000, input.targetCorpusInr / Math.max(1, input.years * 12) * 2);
    if (probeP(cap) >= 90) {
      let loSip = base.monthlySipInr, hiSip = cap;
      for (let i = 0; i < 14; i++) {
        const mid = (loSip + hiSip) / 2;
        if (probeP(mid) >= 90) hiSip = mid; else loSip = mid;
      }
      requiredSipFor90Inr = Math.round(hiSip / 500) * 500; // round to ₹500
    }
  } else {
    requiredSipFor90Inr = null; // already ≥90% on the current path
  }

  return {
    pSuccess: Math.round(pSuccess * 10) / 10,
    p10Inr: Math.round(percentile(endings, 0.10)),
    p50Inr: Math.round(percentile(endings, 0.50)),
    p90Inr: Math.round(percentile(endings, 0.90)),
    requiredSipFor90Inr,
  };
}
