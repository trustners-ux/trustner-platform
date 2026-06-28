/**
 * ANTI-OVERFIT PROOF — run the SAME engine on an OPPOSITE-profile client
 * (Nikhil Pasari, 37, accumulator) and confirm the small/mid/thematic funds that
 * EXITED for retiree Jaideep are now SUITABLE — with quality (not suitability)
 * discriminating which to keep vs exit.
 * Run: npx tsx src/lib/portfolio-diagnostic/v2/_proof_nikhil.ts
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { runRiskModel, ClientRiskInputs } from './risk-model';
import { synthesizeVerdict, computePeerMedians, FundStats, HoldingInput } from './fund-engine';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.replace(/^["']|["']$/g, '').trim() || '';
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));

type Row = { h: HoldingInput; f: FundStats; ram: string };
const F = (schemeName: string, category: string, r3: number, r5: number, r10: number, sharpe: number, sortino: number, vol: number, aum: number): FundStats =>
  ({ schemeName, category, riskometer: 'Very High', rolling3yPct: null, return3yPct: r3, return5yPct: r5, return10yPct: r10, sharpe, sortino, volatilityPct: vol, aumInrCr: aum, terPct: null });

const rows: Row[] = [
  { ram: 'KEEP (core compounder)', h: { schemeName: 'Canara Robeco Small Cap', currentValueInr: 500000, fundOption: 'growth' }, f: F('Canara Robeco Small Cap', 'Small Cap Fund', 0.1358, 0.1586, 0, 0.7277, 0.7878, 0.1749, 13276) },
  { ram: 'EXIT (worst performer)', h: { schemeName: 'Tata Small Cap', currentValueInr: 366990, fundOption: 'growth' }, f: F('Tata Small Cap', 'Small Cap Fund', 0.1124, 0.1494, 0, 0.6708, 0.7364, 0.1663, 11330) },
  { ram: 'EXIT (small/weak)', h: { schemeName: 'Quant Mid Cap', currentValueInr: 90000, fundOption: 'growth' }, f: F('Quant Mid Cap', 'Mid Cap Fund', 0.1672, 0.1649, 0.1683, 0.4414, 0.4719, 0.1384, 7905) },
  { ram: 'KEEP (core)', h: { schemeName: 'Parag Parikh Flexi Cap', currentValueInr: 900000, fundOption: 'growth' }, f: F('Parag Parikh Flexi Cap', 'Flexi Cap Fund', 0.1449, 0.1447, 0.1684, 0.826, 1.0046, 0.118, 140950) },
  { ram: 'KEEP', h: { schemeName: 'Mirae Asset ELSS Tax Saver', currentValueInr: 400000, fundOption: 'growth' }, f: F('Mirae Asset ELSS Tax Saver', 'ELSS', 0.1398, 0.1171, 0.1636, 0.5763, 0.6625, 0.1614, 25267) },
  { ram: 'KEEP (15.3% strong)', h: { schemeName: 'Kotak Multicap', currentValueInr: 350000, fundOption: 'growth' }, f: F('Kotak Multicap', 'Multi Cap Fund', 0.1998, 0, 0, 0.5303, 0.6222, 0.1546, 25769) },
  { ram: 'KEEP (thematic conviction)', h: { schemeName: 'ICICI Energy Opportunities', currentValueInr: 150000, fundOption: 'growth' }, f: F('ICICI Energy Opportunities', 'Sectoral: Energy & Resources (Sectoral / Thematic)', 0, 0, 0, 0.1054, 0.1406, 0.1451, 8851) },
  { ram: 'EXIT (weak, sharpe<0)', h: { schemeName: 'Canara Robeco Balanced Advantage', currentValueInr: 200000, fundOption: 'growth' }, f: F('Canara Robeco Balanced Advantage', 'Dynamic Asset Allocation or Balanced Advantage', 0.07, 0.07, 0.075, -0.7857, -1.089, 0.0909, 1165) },
  { ram: 'EXIT (laggard 6.5%)', h: { schemeName: 'Mirae Asset Focused', currentValueInr: 180000, fundOption: 'growth' }, f: F('Mirae Asset Focused', 'Focused Fund', 0.0645, 0.0661, 0, 0.3707, 0.4152, 0.17, 6596) },
  { ram: 'EXIT (redundant w/ Parag — OVERLAP layer)', h: { schemeName: 'Franklin India Flexi Cap', currentValueInr: 300000, xirrPct: 0.018, fundOption: 'growth' }, f: F('Franklin India Flexi Cap', 'Flexi Cap Fund', 0.1403, 0.1313, 0.1292, 0.5625, 0.7076, 0.1978, 19049) },
];

async function fetchUniverse(): Promise<FundStats[]> {
  const all: FundStats[] = [];
  for (let from = 0; from < 6000; from += 1000) {
    const { data } = await sb.from('pd_fund_universe_latest')
      .select('scheme_name, external_category, returns_3y, returns_5y, returns_10y, sharpe, sortino, volatility, aum_inr_cr')
      .not('returns_5y', 'is', null).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) all.push(F(r.scheme_name, r.external_category, r.returns_3y, r.returns_5y, r.returns_10y, r.sharpe, r.sortino, r.volatility, r.aum_inr_cr));
    if (data.length < 1000) break;
  }
  return all;
}

(async () => {
  const universe = await fetchUniverse();
  console.log(`\nUniverse: ${universe.length} funds.\n`);

  const nikhil: ClientRiskInputs = {
    primaryAge: 37, lifeStage: 'accumulation',
    monthlyGuaranteedIncomeInr: 150000, monthlyEssentialExpenseInr: 80000,
    livingDependsOnThisPortfolio: false, liquidNetWorthBufferInr: 3000000,
    longestHorizonYears: 20, questionnaireScore0to100: null,
    statedPriority: 'growth_first',            // revealed by a 92%-equity, small-cap-heavy book held for years
    pastDrawdownBehaviour: 'stayed_invested',  // built & held the aggressive book; the "sell 75%" was a coached wobble
    targetCorpusInr: null, currentInvestableInr: 6600000, yearsToGoal: null,
  };
  const rm = runRiskModel(nikhil);
  const posture: 'preservation' | 'balanced' | 'growth' = rm.toleranceScore <= 35 ? 'preservation' : rm.toleranceScore <= 55 ? 'balanced' : 'growth';
  console.log('═══ NIKHIL RISK MODEL ═══');
  console.log(`Profile: ${rm.profileLabel} · posture=${posture}`);
  console.log(`Capacity ${rm.capacityScore} · Tolerance ${rm.toleranceScore} · Target equity ${rm.targetEquityPct}% (naive 100-age=${rm.ageRuleEquityPct}%)`);
  console.log(`WITHIN-EQUITY CEILING: ${rm.withinEquityCeiling}  ← (Jaideep's was 'Moderate')\n`);

  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
  console.log(pad('Fund', 30) + pad('Qual', 6) + pad('Suit', 13) + pad('ENGINE', 26) + 'RAM');
  console.log('─'.repeat(118));
  let agree = 0;
  for (const row of rows) {
    const peers = computePeerMedians(universe, row.f.category);
    const v = synthesizeVerdict(row.h, row.f, peers, { withinEquityCeiling: rm.withinEquityCeiling, clientPosture: posture });
    const eng = v.action, ram = row.ram.toLowerCase();
    const dir =
      ((eng === 'EXIT_UNSUITABLE' || eng === 'SWITCH_BETTER') && ram.includes('exit')) ||
      ((eng === 'KEEP' || eng === 'STAR_KEEP' || eng === 'KEEP_MONITOR') && ram.includes('keep'));
    if (dir) agree++;
    console.log(pad(row.h.schemeName, 30) + pad(v.quality, 6) + pad(`${v.suitability}(${v.fundRiskTier})`, 13) + pad(v.actionLabel, 26) + (dir ? '✓ ' : '✗ ') + row.ram);
  }
  console.log('─'.repeat(118));
  console.log(`\nDirectional agreement: ${agree}/${rows.length}`);

  // ════ THE KILLER CONTRAST: identical Canara Small Cap, two clients ════
  const canara = rows[0];
  const peers = computePeerMedians(universe, canara.f.category);
  const jaideepCeiling = 'Moderate' as const;
  const vJai = synthesizeVerdict(canara.h, canara.f, peers, { withinEquityCeiling: jaideepCeiling, clientPosture: 'preservation' });
  const vNik = synthesizeVerdict(canara.h, canara.f, peers, { withinEquityCeiling: rm.withinEquityCeiling, clientPosture: posture });
  console.log('\n═══ SAME FUND, TWO CLIENTS — Canara Robeco Small Cap ═══');
  console.log(`  Jaideep (retiree,  ceiling Moderate):  ${vJai.actionLabel}  →  ${vJai.rationale}`);
  console.log(`  Nikhil  (accumulator, ceiling ${rm.withinEquityCeiling}): ${vNik.actionLabel}  →  ${vNik.rationale}`);
})();
