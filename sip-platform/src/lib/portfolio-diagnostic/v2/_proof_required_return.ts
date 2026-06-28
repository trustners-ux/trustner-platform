/**
 * PROOF — the REQUIRED-RETURN leg of the v2 risk model now binds.
 * Verifies the fix for the "marketed 3-dimension, actually 2-dimension" gap:
 * before, adapter hardcoded targetCorpus/yearsToGoal = null so requiredReturnPct
 * was always null. Now the intake captures a goal corpus and the third leg works.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_required_return.ts
 */
import { runRiskModel, ClientRiskInputs } from './risk-model';

const base: ClientRiskInputs = {
  primaryAge: 45, lifeStage: 'accumulation',
  monthlyGuaranteedIncomeInr: 0, monthlyEssentialExpenseInr: 80_000,
  livingDependsOnThisPortfolio: true, liquidNetWorthBufferInr: 0,
  longestHorizonYears: 15,
  questionnaireScore0to100: null, statedPriority: 'growth_first',
  pastDrawdownBehaviour: 'stayed_invested',
  targetCorpusInr: null, currentInvestableInr: 1_00_00_000, yearsToGoal: null,
};

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail: string) => {
  console.log(`${cond ? '✅' : '❌'} ${name} — ${detail}`);
  cond ? pass++ : fail++;
};

// A) No goal → required leg stays dormant (preserves prior behaviour)
const a = runRiskModel({ ...base });
check('No-goal: required leg dormant', a.requiredReturnPct === null && a.bindingConstraint !== 'required',
  `requiredReturnPct=${a.requiredReturnPct}, binding=${a.bindingConstraint}, equity=${a.targetEquityPct}%`);

// B) Goal already met with LESS risk → required binds and TRIMS the band
//    ₹1Cr → ₹2Cr in 15y needs ~4.7% p.a. (below the 7% debt floor) → low equity need
const b = runRiskModel({ ...base, targetCorpusInr: 2_00_00_000, yearsToGoal: 15 });
check('Funded goal: required leg computes', b.requiredReturnPct !== null,
  `requiredReturnPct=${b.requiredReturnPct?.toFixed(1)}%`);
check('Funded goal: required becomes binding + trims equity', b.bindingConstraint === 'required' && b.targetEquityPct < a.targetEquityPct,
  `binding=${b.bindingConstraint}, equity ${a.targetEquityPct}% → ${b.targetEquityPct}%`);

// C) Stretch goal → required computes but tolerance still caps (no over-reach)
//    ₹1Cr → ₹5Cr in 10y needs ~17.5% p.a. → demands >100% equity, but tolerance caps
const c = runRiskModel({ ...base, targetCorpusInr: 5_00_00_000, yearsToGoal: 10 });
check('Stretch goal: required leg computes a high number', c.requiredReturnPct !== null && c.requiredReturnPct > 12,
  `requiredReturnPct=${c.requiredReturnPct?.toFixed(1)}%`);
check('Stretch goal: tolerance still caps equity (≤90)', c.targetEquityPct <= 90,
  `equity=${c.targetEquityPct}%, binding=${c.bindingConstraint}`);

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
