/**
 * PROOF HARNESS — run the v2 verdict engine on Jaideep Singh's REAL portfolio and
 * print the engine's verdicts side-by-side with Ram's hand-done verdicts.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_jaideep.ts
 * (local only — no deploy, no writes)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { runRiskModel, ClientRiskInputs } from './risk-model';
import { synthesizeVerdict, computePeerMedians, FundStats, HoldingInput, subCategoryKey } from './fund-engine';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.replace(/^["']|["']$/g, '').trim() || '';
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));

// ── Jaideep's 11 funds: REAL research-stats (pulled from pd_fund_universe_latest)
//    + holding value + Ram's FINAL (05-Jun) verdict for comparison.
type Row = { h: HoldingInput; f: FundStats; ram: string };
const rows: Row[] = [
  { ram: 'HOLD half / switch half (PARTIAL)', h: { schemeName: 'ICICI Pru Focused Equity', currentValueInr: 393861, xirrPct: 0.158, fundOption: 'growth' },
    f: { schemeName: 'ICICI Pru Focused Equity', category: 'Focused Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1753, return5yPct: 0.1556, return10yPct: 0.1463, sharpe: 0.4515, sortino: 0.6043, volatilityPct: 0.1537, aumInrCr: 16009, terPct: null } },
  { ram: 'HOLD (YES)', h: { schemeName: 'UTI Large Cap', currentValueInr: 625000, xirrPct: 0.10, fundOption: 'growth' },
    f: { schemeName: 'UTI Large Cap', category: 'Large Cap Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.0848, return5yPct: 0.0816, return10yPct: 0.1097, sharpe: 0.0563, sortino: 0.0576, volatilityPct: 0.2134, aumInrCr: 12053, terPct: null } },
  { ram: 'EXIT FULLY (NO!)', h: { schemeName: 'ICICI Pru India Opportunities', currentValueInr: 401940, xirrPct: 0.167, fundOption: 'growth' },
    f: { schemeName: 'ICICI Pru India Opportunities', category: 'Sectoral: Business Cycle & Opportunities', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1853, return5yPct: 0.1878, return10yPct: 0, sharpe: 0.6713, sortino: 0.7673, volatilityPct: 0.1709, aumInrCr: 36083, terPct: null } },
  { ram: 'EXIT FULLY (NO!)', h: { schemeName: 'ICICI Pru Smallcap', currentValueInr: 333484, xirrPct: 0.088, fundOption: 'growth' },
    f: { schemeName: 'ICICI Pru Smallcap', category: 'Small Cap Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1302, return5yPct: 0.1529, return10yPct: 0.1602, sharpe: 0.3532, sortino: 0.4125, volatilityPct: 0.164, aumInrCr: 8741, terPct: null } },
  { ram: 'HOLD (PARTIAL)', h: { schemeName: 'ICICI Pru Value (Value Discovery)', currentValueInr: 64141, xirrPct: 0.179, fundOption: 'growth' },
    f: { schemeName: 'ICICI Pru Value Discovery', category: 'Value Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1587, return5yPct: 0.1623, return10yPct: 0.1469, sharpe: 0.6924, sortino: 0.8245, volatilityPct: 0.1714, aumInrCr: 59588, terPct: null } },
  { ram: 'HOLD 60% / switch 40% (PARTIAL)', h: { schemeName: 'UTI Value', currentValueInr: 736650, xirrPct: 0.137, fundOption: 'growth' },
    f: { schemeName: 'UTI Value', category: 'Value Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1434, return5yPct: 0.1226, return10yPct: 0.1308, sharpe: 0.4297, sortino: 0.5255, volatilityPct: 0.182, aumInrCr: 9433, terPct: null } },
  { ram: 'HOLD & ADD (YES, best for retiree)', h: { schemeName: 'ICICI Pru Dynamic Asset Alloc FOF', currentValueInr: 345852, xirrPct: 0.103, fundOption: 'growth' },
    f: { schemeName: 'ICICI Pru Dynamic Asset Allocation Active FOF', category: 'FoFs Domestic', riskometer: 'High', rolling3yPct: null, return3yPct: 0.1108, return5yPct: 0.1062, return10yPct: 0.1183, sharpe: 0.4417, sortino: 0.4902, volatilityPct: 0.0999, aumInrCr: 28311, terPct: null } },
  // Nabanita's 4 IDCW hybrids — holder has NO other income → IDCW is tax-free → KEEP
  { ram: 'KEEP (tax-free income engine)', h: { schemeName: 'Canara Robeco Equity Hybrid IDCW', currentValueInr: 425804, xirrPct: -0.022, fundOption: 'idcw' },
    f: { schemeName: 'Canara Robeco Equity Hybrid', category: 'Aggressive Hybrid Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1085, return5yPct: 0.0961, return10yPct: 0.1204, sharpe: 0.3807, sortino: 0.454, volatilityPct: 0.1409, aumInrCr: 11024, terPct: null } },
  { ram: 'KEEP / monitor (weakest)', h: { schemeName: 'DSP Aggressive Hybrid IDCW', currentValueInr: 424335, xirrPct: -0.040, fundOption: 'idcw' },
    f: { schemeName: 'DSP Aggressive Hybrid', category: 'Aggressive Hybrid Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1137, return5yPct: 0.0937, return10yPct: 0.117, sharpe: 0.4867, sortino: 0.5908, volatilityPct: 0.144, aumInrCr: 11582, terPct: null } },
  { ram: 'KEEP', h: { schemeName: 'UTI Aggressive Hybrid IDCW', currentValueInr: 422615, xirrPct: -0.027, fundOption: 'idcw' },
    f: { schemeName: 'UTI Aggressive Hybrid', category: 'Aggressive Hybrid Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1254, return5yPct: 0.1196, return10yPct: 0.1172, sharpe: 0.1337, sortino: 0.0949, volatilityPct: 0.215, aumInrCr: 6524, terPct: null } },
  { ram: 'KEEP (best of the four)', h: { schemeName: 'ICICI Pru Multi-Asset IDCW', currentValueInr: 496209, xirrPct: 0.051, fundOption: 'idcw' },
    f: { schemeName: 'ICICI Pru Multi-Asset', category: 'Multi Asset Allocation', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1647, return5yPct: 0.1701, return10yPct: 0.1575, sharpe: 0.7678, sortino: 0.8978, volatilityPct: 0.1677, aumInrCr: 83547, terPct: null } },
  // two tiny tax-harvest lots
  { ram: 'REDEEM (tax loss)', h: { schemeName: 'UTI Large Cap (tax-harvest lot)', currentValueInr: 4657, xirrPct: -0.056, fundOption: 'growth' },
    f: { schemeName: 'UTI Large Cap', category: 'Large Cap Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.0848, return5yPct: 0.0816, return10yPct: 0.1097, sharpe: 0.0563, sortino: 0.0576, volatilityPct: 0.2134, aumInrCr: 12053, terPct: null } },
  { ram: 'REDEEM (tax loss)', h: { schemeName: 'UTI Value (tax-harvest lot)', currentValueInr: 4650, xirrPct: -0.057, fundOption: 'growth' },
    f: { schemeName: 'UTI Value', category: 'Value Fund', riskometer: 'Very High', rolling3yPct: null, return3yPct: 0.1434, return5yPct: 0.1226, return10yPct: 0.1308, sharpe: 0.4297, sortino: 0.5255, volatilityPct: 0.182, aumInrCr: 9433, terPct: null } },
];

async function fetchUniverse(): Promise<FundStats[]> {
  const all: FundStats[] = [];
  for (let from = 0; from < 6000; from += 1000) {
    const { data, error } = await sb.from('pd_fund_universe_latest')
      .select('scheme_name, external_category, returns_3y, returns_5y, returns_10y, sharpe, sortino, volatility, aum_inr_cr')
      .not('returns_5y', 'is', null).range(from, from + 999);
    if (error) { console.error(error.message); break; }
    if (!data?.length) break;
    for (const r of data) all.push({ schemeName: r.scheme_name, category: r.external_category, riskometer: null,
      rolling3yPct: null, return3yPct: r.returns_3y, return5yPct: r.returns_5y, return10yPct: r.returns_10y,
      sharpe: r.sharpe, sortino: r.sortino, volatilityPct: r.volatility, aumInrCr: r.aum_inr_cr, terPct: null });
    if (data.length < 1000) break;
  }
  return all;
}

(async () => {
  const universe = await fetchUniverse();
  console.log(`\nUniverse loaded: ${universe.length} Regular-plan funds with return history.\n`);

  // ── Jaideep & Nabanita — retiree, capital-first, but living NOT dependent on this corpus
  const profile: ClientRiskInputs = {
    primaryAge: 60, lifeStage: 'retirement',
    monthlyGuaranteedIncomeInr: 110000,   // pension + rental + SCSS + RBI bonds post-deployment
    monthlyEssentialExpenseInr: 57800,
    livingDependsOnThisPortfolio: false,    // ← the capacity-override switch
    liquidNetWorthBufferInr: 10000000,      // PPF + super + FD outside the MF book
    longestHorizonYears: 25,
    questionnaireScore0to100: null,
    statedPriority: 'capital_first',
    pastDrawdownBehaviour: 'stayed_invested',
    targetCorpusInr: null, currentInvestableInr: 4800000, yearsToGoal: null,
  };
  const rm = runRiskModel(profile);
  console.log('═══ CLIENT RISK MODEL ═══');
  console.log(`Profile: ${rm.profileLabel}`);
  console.log(`Capacity ${rm.capacityScore}/100 · Tolerance ${rm.toleranceScore}/100 · Binding: ${rm.bindingConstraint}`);
  console.log(`Target equity: ${rm.targetEquityPct}%  (naive 100−age = ${rm.ageRuleEquityPct}%)  capacity-overrode-age: ${rm.capacityOverrodeAge}`);
  console.log(`WITHIN-EQUITY CEILING: ${rm.withinEquityCeiling}`);
  console.log('Reasoning:'); rm.rationale.forEach(r => console.log('  • ' + r));

  console.log('\n═══ PER-FUND VERDICTS — ENGINE vs RAM ═══\n');
  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
  console.log(pad('Fund', 34) + pad('Qual', 7) + pad('Suit', 11) + pad('ENGINE ACTION', 30) + 'RAM (final)');
  console.log('─'.repeat(120));
  let agree = 0;
  for (const row of rows) {
    const peers = computePeerMedians(universe, row.f.category);
    const posture: 'preservation' | 'balanced' | 'growth' =
      rm.toleranceScore <= 35 ? 'preservation' : rm.toleranceScore <= 55 ? 'balanced' : 'growth';
    const v = synthesizeVerdict(row.h, row.f, peers, {
      withinEquityCeiling: rm.withinEquityCeiling,
      clientPosture: posture,
      holderHasOtherIncome: row.h.fundOption === 'idcw' ? false : undefined, // Nabanita: no other income
    });
    // crude agreement check (direction)
    const eng = v.action; const ram = row.ram.toLowerCase();
    const dir =
      (eng === 'EXIT_UNSUITABLE' && ram.includes('exit')) ||
      (eng === 'HOLD_PARTIAL' && ram.includes('partial')) ||
      ((eng === 'KEEP' || eng === 'STAR_KEEP' || eng === 'KEEP_MONITOR') && ram.includes('keep')) ||
      ((eng === 'KEEP' || eng === 'STAR_KEEP' || eng === 'KEEP_MONITOR') && ram.includes('hold') && !ram.includes('partial')) ||
      (eng === 'REDEEM_TINY' && ram.includes('redeem'));
    if (dir) agree++;
    console.log(pad(row.h.schemeName, 34) + pad(v.quality, 7) + pad(`${v.suitability}(${v.fundRiskTier})`, 11) + pad(v.actionLabel, 30) + (dir ? '✓ ' : '✗ ') + row.ram);
  }
  console.log('─'.repeat(120));
  console.log(`\nDirectional agreement: ${agree}/${rows.length}\n`);

  // Show one full rationale as a sample
  const sample = rows.find(r => r.h.schemeName.includes('Smallcap'))!;
  const sv = synthesizeVerdict(sample.h, sample.f, computePeerMedians(universe, sample.f.category), { withinEquityCeiling: rm.withinEquityCeiling });
  console.log('SAMPLE RATIONALE — ' + sample.h.schemeName + ':\n  ' + sv.rationale + '\n');
})();
