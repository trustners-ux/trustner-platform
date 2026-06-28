/**
 * PROOF — AUM capacity bands: OPEN (add) / SOFT-CLOSED (hold-only) / AVOID.
 * Encodes Ram's rule: a large flexi cap that is performing may be HELD, but no
 * fresh additions above the add-ceiling (flexi add 75k / avoid 120k).
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_aum.ts
 */
import { synthesizeVerdict, computePeerMedians, FundStats } from './fund-engine';

const flexi = (schemeName: string, aumInrCr: number): FundStats => ({
  schemeName, category: 'Flexi Cap', riskometer: 'Very High', rolling3yPct: null,
  return3yPct: 16, return5yPct: 18, return10yPct: 15, sharpe: 1.2, sortino: 1.6,
  volatilityPct: 0.14, aumInrCr, terPct: 1.3,
});
// peer universe (deliberately weaker so the target clears gates 1-5; only AUM differs)
const peersUniverse: FundStats[] = Array.from({ length: 6 }, (_, i) => ({
  schemeName: `Peer Flexi ${i}`, category: 'Flexi Cap', riskometer: 'Very High', rolling3yPct: null,
  return3yPct: 12, return5yPct: 13, return10yPct: 12, sharpe: 0.8, sortino: 1.0,
  volatilityPct: 0.15, aumInrCr: 12000, terPct: 1.6,
}));
const peers = computePeerMedians(peersUniverse, 'Flexi Cap');
const ctx = { withinEquityCeiling: 'Very High' as const, clientPosture: 'growth' as const };
const hold = (n: string) => ({ schemeName: n, currentValueInr: 600000, investedInr: 500000, xirrPct: 18, fundOption: 'growth' as const });

const open = synthesizeVerdict(hold('Franklin Flexi (₹19k OPEN)'), flexi('Franklin Flexi', 19000), peers, ctx);
const soft = synthesizeVerdict(hold('HDFC Flexi (₹91k SOFT)'), flexi('HDFC Flexi', 91000), peers, ctx);
const avoid = synthesizeVerdict(hold('PPFAS Flexi (₹1.4L AVOID)'), flexi('PPFAS Flexi', 140000), peers, ctx);

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };
const holdOnly = (v: { rationale: string }) => /hold-only|no fresh money/i.test(v.rationale);

check('OPEN flexi (₹19k) → can ADD (STAR_KEEP)', open.action === 'STAR_KEEP', open.action);
check('OPEN flexi → NOT flagged hold-only', !holdOnly(open));
check('SOFT-CLOSED flexi (₹91k) → KEEP, not STAR', soft.action === 'KEEP', soft.action);
check('SOFT-CLOSED flexi → flagged HOLD-ONLY (no fresh money)', holdOnly(soft), soft.rationale.slice(-90));
check('AVOID flexi (₹1.4L) → held but NOT a core-add', avoid.action !== 'STAR_KEEP', avoid.action);
check('AVOID flexi → flagged HOLD-ONLY (no fresh money)', holdOnly(avoid), avoid.action);

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
console.log('\nSOFT-CLOSED rationale:\n  ' + soft.rationale);
process.exit(fail === 0 ? 0 : 1);
