/**
 * PROOF — REEDOS-parity additions: Portfolio Health Score + Allocation Comparison.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_reedos_parity.ts
 */
import { computePortfolioHealthScore } from './portfolio-health-score';
import { buildAllocationComparison } from './allocation-comparison';

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };

// ── Portfolio Health Score ──────────────────────────────────────────────
const allStarKeep = computePortfolioHealthScore({
  tierTotals: {
    star: { pctOfPortfolio: 60 }, keep: { pctOfPortfolio: 40 }, watch: { pctOfPortfolio: 0 },
    swap: { pctOfPortfolio: 0 }, liquidate: { pctOfPortfolio: 0 },
  },
  riskGap: { hasGap: false, pctAboveCeiling: 0 },
  consolidationValueInr: 0,
  currentValueInr: 1_000_000,
  behaviourGap: null,
});
check('All STAR/KEEP + aligned + no overlap → green band', allStarKeep.band === 'green', `score=${allStarKeep.score}`);
check('All STAR/KEEP → verdict-quality component near 100', allStarKeep.components.verdictQuality >= 90, String(allStarKeep.components.verdictQuality));

const mostlySwap = computePortfolioHealthScore({
  tierTotals: {
    star: { pctOfPortfolio: 0 }, keep: { pctOfPortfolio: 10 }, watch: { pctOfPortfolio: 0 },
    swap: { pctOfPortfolio: 70 }, liquidate: { pctOfPortfolio: 20 },
  },
  riskGap: { hasGap: true, pctAboveCeiling: 45 },
  consolidationValueInr: 300_000,
  currentValueInr: 1_000_000,
  behaviourGap: { gapPp: 3 },
});
check('Mostly SWAP/LIQUIDATE + risk gap + overlap + behaviour gap → red/orange band', mostlySwap.score < 60, `score=${mostlySwap.score}, band=${mostlySwap.band}`);
check('Score is monotonic — healthy book scores well above unhealthy book', allStarKeep.score > mostlySwap.score);

const noProfile = computePortfolioHealthScore({
  tierTotals: {
    star: { pctOfPortfolio: 50 }, keep: { pctOfPortfolio: 50 }, watch: { pctOfPortfolio: 0 },
    swap: { pctOfPortfolio: 0 }, liquidate: { pctOfPortfolio: 0 },
  },
  riskGap: null,
  consolidationValueInr: 0,
  currentValueInr: 1_000_000,
  behaviourGap: null,
});
check('No risk profile captured → risk-alignment held neutral, not penalised', noProfile.components.riskAlignment === 70);
check('Score always clamped to [0,100]', allStarKeep.score >= 0 && allStarKeep.score <= 100 && mostlySwap.score >= 0 && mostlySwap.score <= 100);

// ── Allocation Comparison ────────────────────────────────────────────────
const ac = buildAllocationComparison([
  { fundName: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', currentValueInr: 600_000, verdict: 'STAR' },
  { fundName: 'Bajaj Finserv Flexi Cap', category: 'Flexi Cap', currentValueInr: 400_000, verdict: 'SWAP', preferredReplacementFundName: 'Parag Parikh Flexi Cap' },
  { fundName: 'Quant Small Cap', category: 'Small Cap', currentValueInr: 300_000, verdict: 'SWAP' }, // no replacement → redeploy bucket
  { fundName: 'HDFC Liquid Fund', category: 'Liquid Fund', currentValueInr: 100_000, verdict: 'KEEP' },
]);

check('Total existing = sum of all holdings', ac.totalExistingInr === 1_400_000, String(ac.totalExistingInr));
check('Equity Funds asset-type row exists', ac.rows.some((r) => r.assetType === 'Equity Funds'));
check('Debt Funds asset-type row exists (Liquid Fund)', ac.rows.some((r) => r.assetType === 'Debt Funds'));
check('Redeploy bucket exists for the SWAP with no named replacement', ac.rows.some((r) => r.assetType === 'Pending Reinvestment'));

const equityRow = ac.rows.find((r) => r.assetType === 'Equity Funds')!;
const flexiCat = equityRow.categories.find((c) => c.category === 'Flexi Cap')!;
const parag = flexiCat.funds.find((f) => f.fundName === 'Parag Parikh Flexi Cap')!;
check('Parag Parikh existing = 6L, new = 6L (kept) + 4L (absorbed swap) = 10L', parag.existingInr === 600_000 && parag.newInr === 1_000_000, `existing=${parag.existingInr}, new=${parag.newInr}`);
check('Parag Parikh change = +4L (absorbed the SWAP)', parag.changeInr === 400_000, String(parag.changeInr));

const bajaj = flexiCat.funds.find((f) => f.fundName === 'Bajaj Finserv Flexi Cap')!;
check('Bajaj Finserv (swapped out) — existing=4L, new=0', bajaj.existingInr === 400_000 && bajaj.newInr === 0);

const redeployRow = ac.rows.find((r) => r.assetType === 'Pending Reinvestment')!;
check('Redeploy bucket carries the unmatched Quant Small Cap value (3L)', redeployRow.newInr === 300_000, String(redeployRow.newInr));

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
