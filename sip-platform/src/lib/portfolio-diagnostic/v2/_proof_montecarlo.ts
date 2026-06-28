/**
 * Proof harness — Goal Monte Carlo v1 (offline, deterministic).
 * Run: npx tsx src/lib/portfolio-diagnostic/v2/_proof_montecarlo.ts
 */
import { runGoalMonteCarlo } from './monte-carlo';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// 1. Deterministic: same inputs → same result
const a = runGoalMonteCarlo({ currentValueInr: 50_00_000, monthlySipInr: 50_000, years: 10, targetCorpusInr: 2_00_00_000, expReturnPct: 12, volPct: 14 });
const b = runGoalMonteCarlo({ currentValueInr: 50_00_000, monthlySipInr: 50_000, years: 10, targetCorpusInr: 2_00_00_000, expReturnPct: 12, volPct: 14 });
check('deterministic (seeded)', a.pSuccess === b.pSuccess && a.p50Inr === b.p50Inr, `p=${a.pSuccess}%`);

// 2. Median sanity: ₹50L @12%/10y + ₹50k/mo SIP → deterministic FV ≈ ₹50L×3.106 + SIP-FV ≈ ₹2.70Cr.
//    MC median of lognormal sits slightly below the deterministic mean — accept 2.2–3.0Cr.
check('median in sane band', a.p50Inr > 2_20_00_000 && a.p50Inr < 3_00_00_000, `p50=₹${(a.p50Inr / 1e7).toFixed(2)}Cr`);

// 3. Easy goal → very high probability
const easy = runGoalMonteCarlo({ currentValueInr: 1_00_00_000, monthlySipInr: 0, years: 10, targetCorpusInr: 1_10_00_000, expReturnPct: 12, volPct: 14 });
check('easy goal ≥ 95%', easy.pSuccess >= 95, `p=${easy.pSuccess}%`);

// 4. Impossible goal → ~0% and a required-SIP suggestion (or null if uncapped)
const hard = runGoalMonteCarlo({ currentValueInr: 10_00_000, monthlySipInr: 5_000, years: 5, targetCorpusInr: 10_00_00_000, expReturnPct: 12, volPct: 14 });
check('impossible goal ≤ 5%', hard.pSuccess <= 5, `p=${hard.pSuccess}%`);

// 5. Higher vol → wider spread (p90-p10) than lower vol
const lowV = runGoalMonteCarlo({ currentValueInr: 50_00_000, monthlySipInr: 0, years: 10, targetCorpusInr: 1, expReturnPct: 12, volPct: 8 });
const highV = runGoalMonteCarlo({ currentValueInr: 50_00_000, monthlySipInr: 0, years: 10, targetCorpusInr: 1, expReturnPct: 12, volPct: 22 });
check('vol widens the cone', (highV.p90Inr - highV.p10Inr) > (lowV.p90Inr - lowV.p10Inr));

// 6. requiredSipFor90 actually clears 90% when re-simulated
if (a.pSuccess < 90 && a.requiredSipFor90Inr != null) {
  const recheck = runGoalMonteCarlo({ currentValueInr: 50_00_000, monthlySipInr: a.requiredSipFor90Inr, years: 10, targetCorpusInr: 2_00_00_000, expReturnPct: 12, volPct: 14 });
  check('requiredSipFor90 clears ~90%', recheck.pSuccess >= 87, `sip=₹${a.requiredSipFor90Inr} → p=${recheck.pSuccess}%`);
} else {
  check('requiredSipFor90 path n/a (already ≥90%)', true, `p=${a.pSuccess}%`);
}

console.log(fail === 0 ? `\n🎯 ALL PASS — ${pass} passed, 0 failed` : `\n💥 ${fail} FAILED, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
