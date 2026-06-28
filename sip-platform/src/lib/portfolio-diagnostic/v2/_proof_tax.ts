/**
 * PROOF — India tax-aware exit estimator.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_tax.ts
 */
import { estimateExitTax, ExitTaxInput } from './tax-engine';

const I = (holdingId: number, fundName: string, subKey: string, investedInr: number, currentValueInr: number, holdingPeriodMonths: number | null, recommendedExit: boolean): ExitTaxInput =>
  ({ holdingId, fundName, subKey, investedInr, currentValueInr, holdingPeriodMonths, recommendedExit });

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };

// Case 1: equity LTCG within ₹1.25L exemption → ~0 tax
const a = estimateExitTax([I(1, 'X Flexi', 'flexi', 500000, 600000, 30, true)]); // ₹1L LTCG
check('LTCG within exemption → ₹0 tax', a.estTotalTaxInr === 0, `tax=${a.estTotalTaxInr}, exemptUsed=${a.ltcgExemptionUsedInr}`);

// Case 2: equity LTCG above exemption → 12.5% on excess
// gain ₹3.25L → taxable ₹2L → tax ₹25,000
const b = estimateExitTax([I(1, 'Y Midcap', 'mid_cap', 500000, 825000, 40, true)]);
check('LTCG above exemption → 12.5% on excess', b.estTotalTaxInr === 25000, `tax=${b.estTotalTaxInr} (expect 25000)`);

// Case 3: equity STCG → 20%, no exemption. gain ₹1L → ₹20,000
const c = estimateExitTax([I(1, 'Z Smallcap', 'small_cap', 500000, 600000, 8, true)]);
check('STCG → 20% no exemption', c.estTotalTaxInr === 20000, `tax=${c.estTotalTaxInr} (expect 20000)`);
check('STCG line flags wait-past-12mo', /12 mo|LTCG/.test(c.lines[0].note), c.lines[0].note.slice(0, 60));

// Case 4: ELSS locked (<36mo) → locked, deferred, no tax computed
const d = estimateExitTax([I(1, 'ELSS Saver', 'elss', 100000, 150000, 20, true)]);
check('ELSS <36mo locked → not redeemable', d.lines[0].locked === true && d.hasLockedElss, d.lines[0].note.slice(0, 50));

// Case 5: debt → slab note, tax not computed
const e = estimateExitTax([I(1, 'Debt Fund', 'debt', 500000, 560000, 40, true)]);
check('Debt → slab (tax null) + flag', e.lines[0].gainType === 'SLAB' && e.lines[0].estTaxInr === null && e.hasDebtSlab);

// Case 6: loss → 0 tax + set-off note
const f = estimateExitTax([I(1, 'Dud Fund', 'flexi', 500000, 420000, 40, true)]);
check('Loss → ₹0 tax + set-off note', f.estTotalTaxInr === 0 && /set off/i.test(f.lines[0].note), f.lines[0].note.slice(0, 50));

// Case 7: non-exit holdings ignored
const g = estimateExitTax([I(1, 'Keep me', 'flexi', 500000, 900000, 40, false)]);
check('Non-exit holdings ignored', g.exitCount === 0 && g.estTotalTaxInr === 0);

// Case 8: portfolio exemption shared across multiple LTCG exits
// two LTCG gains ₹1L + ₹1L = ₹2L → exempt ₹1.25L → taxable ₹0.75L → ₹9,375
const h = estimateExitTax([
  I(1, 'A Flexi', 'flexi', 400000, 500000, 30, true),
  I(2, 'B Largecap', 'large_cap', 400000, 500000, 30, true),
]);
check('Shared exemption across exits', h.estTotalTaxInr === 9375, `tax=${h.estTotalTaxInr} (expect 9375)`);

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
console.log('\nSAMPLE HEADLINE:\n  ' + h.headline);
process.exit(fail === 0 ? 0 : 1);
