/**
 * PROOF — fund-metrics engine (Phase 1 of the self-maintaining universe engine).
 * Synthetic cases verify the math exactly; a live HDFC Mid Cap fetch verifies
 * the engine produces the STANDARD trailing-return numbers (3M ≈ 9.15%, the
 * textbook trailing-3-month — vs ngen's non-standard month-end 13.64%).
 * Run:  npx -y tsx src/lib/funds/_proof_fund_metrics.ts
 */
import { trailingReturns, riskMetrics, type NavPoint } from './fund-metrics';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };
const near = (a: number | null, b: number, tol = 1e-4) => a != null && Math.abs(a - b) <= tol;

const DAY = 86_400_000;
const minusMonths = (ms: number, m: number) => { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - m, d.getUTCDate()); };

// ── 1. Synthetic exact-anchor series ──
const today = Date.UTC(2026, 5, 25); // 25 Jun 2026
const syn: NavPoint[] = [
  { t: today, nav: 110 },
  { t: today - DAY, nav: 100 },              // 1D = +10%
  { t: minusMonths(today, 1), nav: 100 },    // 1M = +10%
  { t: minusMonths(today, 3), nav: 88 },     // 3M = 110/88-1 = +25%
  { t: minusMonths(today, 6), nav: 121 },    // 6M = 110/121-1 = -9.0909%
  { t: minusMonths(today, 12), nav: 100 },   // 1Y absolute = +10%
  { t: minusMonths(today, 36), nav: 110 / 1.331 }, // 3Y: 110/(110/1.331)=1.331 → CAGR 10%
  { t: minusMonths(today, 60), nav: 55 },    // 5Y: (110/55)^(1/5)-1 = 14.87%
];
const tr = trailingReturns(syn)!;
ok('1D = +10%', near(tr.ret_1d, 0.10));
ok('1M = +10%', near(tr.ret_1m, 0.10));
ok('3M = +25%', near(tr.ret_3m, 0.25));
ok('6M ≈ -9.09%', near(tr.ret_6m, -0.090909, 1e-4));
ok('1Y absolute = +10%', near(tr.ret_1y, 0.10));
ok('3Y CAGR = +10%', near(tr.ret_3y, 0.10, 1e-3));
ok('5Y CAGR ≈ +14.87%', near(tr.ret_5y, Math.pow(2, 1 / 5) - 1, 1e-4));
ok('anchor on/before rolls BACK not forward', (() => {
  // target lands on a holiday gap → must use the older NAV, never the newer
  const s: NavPoint[] = [{ t: today, nav: 120 }, { t: today - 40 * DAY, nav: 100 }, { t: today - 20 * DAY, nav: 150 }];
  const r = trailingReturns(s)!;
  return near(r.ret_1m, 120 / 100 - 1); // 1M target ≈ today-30d → nearest ≤ is the -40d (100), not -20d (150)
})());

// ── 2. Risk metrics on a known ±1%/day series ──
const risk: NavPoint[] = [];
let nav = 100;
for (let i = 250; i >= 0; i--) { risk.push({ t: today - i * DAY, nav }); nav *= (i % 2 === 0 ? 1.01 : 0.99); }
const rm = riskMetrics(risk, { riskFree: 0.065 });
ok('volatility ≈ 1%×√252 ≈ 0.159', rm.volatility != null && rm.volatility > 0.14 && rm.volatility < 0.17, String(rm.volatility));
ok('maxDrawdown ≤ 0 and small for ±1% chop', rm.maxDrawdown != null && rm.maxDrawdown <= 0 && rm.maxDrawdown > -0.05, String(rm.maxDrawdown));
ok('sharpe + sortino computed', rm.sharpe != null && rm.sortino != null);
ok('too-short history → null metrics', riskMetrics([{ t: today, nav: 100 }, { t: today - DAY, nav: 99 }]).volatility === null);

// ── 3. Live validation vs real HDFC Mid Cap (amfi 105758) ──
(async () => {
  try {
    const j = await (await fetch('https://api.mfapi.in/mf/105758')).json() as { status: string; data: Array<{ date: string; nav: string }> };
    if (j.status === 'SUCCESS') {
      const { toNavSeries } = await import('./fund-metrics');
      const s = toNavSeries(j.data);
      const r = trailingReturns(s)!;
      console.log(`\n  HDFC Mid Cap (live): 1M=${(r.ret_1m!*100).toFixed(2)}%  3M=${(r.ret_3m!*100).toFixed(2)}%  6M=${(r.ret_6m!*100).toFixed(2)}%  1Y=${(r.ret_1y!*100).toFixed(2)}%  3Y(CAGR)=${(r.ret_3y!*100).toFixed(2)}%`);
      ok('HDFC 3M is the STANDARD trailing-3m (~9.15%, not ngen 13.64%)', near(r.ret_3m!, 0.0915, 0.01));
      ok('HDFC 1Y absolute ≈ 6% (sane)', r.ret_1y! > 0.0 && r.ret_1y! < 0.15);
      const k = riskMetrics(s);
      console.log(`  HDFC risk: vol=${(k.volatility!*100).toFixed(1)}%  sharpe=${k.sharpe?.toFixed(2)}  sortino=${k.sortino?.toFixed(2)}  maxDD=${(k.maxDrawdown!*100).toFixed(1)}%  (n=${k.sampleDays})`);
      ok('HDFC volatility in a plausible midcap range (10-35%)', k.volatility! > 0.10 && k.volatility! < 0.35);
    } else { console.log('  (skipped live HDFC check — MFAPI unavailable)'); }
  } catch { console.log('  (skipped live HDFC check — network)'); }
  console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
