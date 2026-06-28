/**
 * PROOF — same-sub-category duplicate detection + keep-the-better consolidation.
 * Models a real "8-15 overlapping funds" book (Jalan-style): 3 Flexi Caps,
 * 2 Large & Mid, plus singletons that must NOT be flagged.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_consolidation.ts
 */
import { detectConsolidation, ConsolidationCandidate } from './overlap-engine';
import { categoryRiskTier } from './fund-engine';

const C = (
  holdingId: number, fundName: string, category: string, currentValueInr: number,
  quality: ConsolidationCandidate['quality'], suitability: ConsolidationCandidate['suitability'],
  sharpe: number | null, return5yPct: number | null,
): ConsolidationCandidate => ({ holdingId, fundName, category, currentValueInr, quality, suitability, sharpe, return5yPct });

const book: ConsolidationCandidate[] = [
  // 3 Flexi Caps — Parag Parikh is STAR+suitable → must be the KEEP
  C(1, 'Parag Parikh Flexi Cap', 'Flexi Cap', 1_500_000, 'STAR', 'SUITABLE', 1.2, 22),
  C(2, 'Bajaj Finserv Flexi Cap', 'Flexi Cap', 600_000, 'PASS', 'SUITABLE', 0.9, 18),
  C(3, 'Mahindra Manulife Flexi Cap', 'Flexi Cap', 400_000, 'FLAG', 'SUITABLE', 0.7, 15),
  // 2 Large & Mid — "and" spelling MUST key as large_mid, NOT leak into mid_cap
  C(4, 'Axis Large and Mid Cap Fund', 'Large & Mid Cap', 800_000, 'PASS', 'PARTIAL', 1.0, 19),
  C(5, 'Invesco India Large and Mid Cap Fund', 'Large & Mid Cap', 500_000, 'FLAG', 'PARTIAL', 0.8, 16),
  // 3 Small Caps ALL UNSUITABLE (capital-first client) — must NOT emit a
  // "keep the best, fold the rest" group (that would contradict EXIT-all verdicts)
  C(6, 'SBI Small Cap', 'Small Cap', 700_000, 'PASS', 'UNSUITABLE', 1.1, 24),
  C(10, 'Nippon India Small Cap', 'Small Cap', 500_000, 'PASS', 'UNSUITABLE', 1.0, 23),
  C(11, 'Quant Small Cap', 'Small Cap', 400_000, 'FLAG', 'UNSUITABLE', 0.9, 21),
  C(7, 'ICICI Pru Balanced Advantage', 'Balanced Advantage', 900_000, 'PASS', 'SUITABLE', 0.8, 12),
  // 2 thematic — different themes → confidence 'review', not hard-consolidate
  C(8, 'Nippon India Pharma', 'Sectoral/Thematic', 300_000, 'PASS', 'PARTIAL', 0.9, 20),
  C(9, 'ICICI Pru Technology', 'Sectoral/Thematic', 300_000, 'FLAG', 'PARTIAL', 0.6, 17),
];

const r = detectConsolidation(book);
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => { console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`); cond ? pass++ : fail++; };

const flexi = r.groups.find(g => g.subKey === 'flexi');
const lm = r.groups.find(g => g.subKey === 'large_mid');
const thematic = r.groups.find(g => g.subKey === 'thematic');
const small = r.groups.find(g => g.subKey === 'small_cap');
const baf = r.groups.find(g => g.subKey === 'baf');

check('Flexi group detected (3 funds)', !!flexi && flexi.count === 3, flexi && `count=${flexi.count}`);
check('Flexi keeps Parag Parikh (STAR+suitable)', flexi?.keep.fundName === 'Parag Parikh Flexi Cap', flexi?.keep.fundName);
check('Flexi consolidates the other 2', flexi?.consolidate.length === 2, flexi && `consolidate=${flexi.consolidate.map(c=>c.fundName).join(', ')}`);
check('Flexi consolidatable = ₹10L (6L+4L)', flexi?.totalConsolidatableInr === 1_000_000, flexi && `₹${flexi.totalConsolidatableInr}`);
check('Large&Mid group formed from "and" spelling (not leaked to mid_cap)', !!lm && lm.count === 2 && !r.groups.find(g => g.subKey === 'mid_cap'), lm && `count=${lm.count}`);
check('Large&Mid keeps Axis (better)', lm?.keep.fundName === 'Axis Large and Mid Cap Fund', lm?.keep.fundName);
check('Thematic flagged as REVIEW (themes differ)', thematic?.confidence === 'review', thematic?.confidence);
check('All-UNSUITABLE small-cap group SUPPRESSED (exit-all, not keep-and-fold)', !small, '3 small caps all UNSUITABLE → no consolidation card');
check('Singletons NOT grouped (BAF absent)', !baf);
check('duplicateFundCount = 4 (2 flexi + 1 L&M + 1 thematic)', r.duplicateFundCount === 4, `count=${r.duplicateFundCount}`);

// risk-tier ordering: Large & Mid must be 'High' (not mis-graded 'Very High' via the
// "mid cap" substring), pure Mid Cap stays 'Very High', Small Cap 'Very High'.
check("categoryRiskTier('Large & Mid Cap') = High", categoryRiskTier('Large & Mid Cap') === 'High', categoryRiskTier('Large & Mid Cap'));
check("categoryRiskTier('Large and Mid Cap') = High", categoryRiskTier('Large and Mid Cap') === 'High', categoryRiskTier('Large and Mid Cap'));
check("categoryRiskTier('Mid Cap') = Very High", categoryRiskTier('Mid Cap') === 'Very High', categoryRiskTier('Mid Cap'));
check("categoryRiskTier('Small Cap') = Very High", categoryRiskTier('Small Cap') === 'Very High', categoryRiskTier('Small Cap'));
check("categoryRiskTier('Dividend Yield') = High", categoryRiskTier('Dividend Yield') === 'High', categoryRiskTier('Dividend Yield'));

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
console.log('\nSAMPLE RATIONALE (flexi):\n  ' + (flexi?.rationale ?? '—'));
process.exit(fail === 0 ? 0 : 1);
