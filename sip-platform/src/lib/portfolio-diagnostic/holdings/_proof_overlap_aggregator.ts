import { aggregateFamilyStockOverlap, type RichHolding, type FamilyHolding } from './overlap-aggregator';

let pass = 0, fail = 0;
const chk = (n: string, c: boolean, d = '') => { c ? pass++ : fail++; console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); };

async function main() {

// Two funds, each ₹5,00,000. Both hold HDFC Bank + Reliance; one also holds Infosys.
const DB: Record<string, RichHolding[]> = {
  '111111': [ // Fund A
    { stock: 'HDFC Bank Limited', isin: 'INE040A01034', sector: 'Banks', weightPct: 10 },
    { stock: 'Reliance Industries Limited', isin: 'INE002A01018', sector: 'Petroleum Products', weightPct: 8 },
    { stock: 'Infosys Limited', isin: 'INE009A01021', sector: 'IT - Software', weightPct: 6 },
  ],
  '222222': [ // Fund B — same HDFC Bank (by ISIN), Reliance by slightly different NAME (must still merge via ISIN)
    { stock: 'HDFC Bank Ltd', isin: 'INE040A01034', sector: 'Banks', weightPct: 12 },
    { stock: 'Reliance Industries Ltd', isin: 'INE002A01018', sector: 'Petroleum Products', weightPct: 4 },
    { stock: 'TCS Limited', isin: 'INE467B01029', sector: 'IT - Software', weightPct: 5 },
  ],
  '333333': [], // Fund C — no look-through data (returns [] → treated as uncovered)
};

const getHoldings = async (code: string): Promise<RichHolding[] | null> => {
  const rows = DB[code];
  return rows && rows.length ? rows : null;
};

const family: FamilyHolding[] = [
  { amfiCode: '111111', valueInr: 500000, fundName: 'Fund A' },
  { amfiCode: '222222', valueInr: 500000, fundName: 'Fund B' },
  { amfiCode: '333333', valueInr: 500000, fundName: 'Fund C (no data)' },
];

const r = await aggregateFamilyStockOverlap(family, getHoldings);

// HDFC Bank effective: 500k×10% + 500k×12% = 50,000 + 60,000 = 1,10,000
const hdfc = r.topStocks.find(s => /hdfc bank/i.test(s.stock));
chk('HDFC Bank merged across 2 funds by ISIN', !!hdfc && hdfc.fundCount === 2, `fundCount=${hdfc?.fundCount}`);
chk('HDFC Bank effective ₹1,10,000', hdfc?.effectiveValueInr === 110000, `got ${hdfc?.effectiveValueInr}`);
// vs whole family corpus 15,00,000 → 110000/1500000 = 7.33%
chk('HDFC Bank effectivePctOfFamily ~7.3%', Math.abs((hdfc?.effectivePctOfFamily ?? 0) - 7.3) < 0.2, `${hdfc?.effectivePctOfFamily}%`);
// vs covered sleeve 10,00,000 → 110000/1000000 = 11%
chk('HDFC Bank effectivePctOfCovered ~11%', Math.abs((hdfc?.effectivePctOfCovered ?? 0) - 11.0) < 0.2, `${hdfc?.effectivePctOfCovered}%`);

// Reliance: 500k×8% + 500k×4% = 40,000 + 20,000 = 60,000, across 2 funds (name differs, ISIN same)
const ril = r.topStocks.find(s => /reliance/i.test(s.stock));
chk('Reliance merged via ISIN despite name diff', !!ril && ril.fundCount === 2, `fundCount=${ril?.fundCount}`);
chk('Reliance effective ₹60,000', ril?.effectiveValueInr === 60000, `got ${ril?.effectiveValueInr}`);

chk('top stock is HDFC Bank (highest effective)', r.topStocks[0]?.stock.includes('HDFC Bank'));
chk('coverage: 2 of 3 funds covered', r.coveredFunds === 2 && r.totalFunds === 3, `${r.coveredFunds}/${r.totalFunds}`);
chk('coverage value ₹10,00,000 (Fund C excluded)', r.coveredValueInr === 1000000, `got ${r.coveredValueInr}`);
chk('coveragePct ~66.7%', Math.abs(r.coveragePct - 66.7) < 0.2, `${r.coveragePct}%`);
chk('multiFundStocks = 2 (HDFC Bank + Reliance)', r.multiFundStocks === 2, `got ${r.multiFundStocks}`);

// Sector: Banks = 110000; IT = Infosys 30000 + TCS 25000 = 55000; Petroleum = 60000
const banks = r.sectorConcentration.find(s => s.sector === 'Banks');
chk('Banks sector top, ~11% of covered', banks?.pctOfCovered === 11, `${banks?.pctOfCovered}%`);
chk('hasData true', r.hasData === true);

// Empty-family guard
const empty = await aggregateFamilyStockOverlap([{ amfiCode: '999999', valueInr: 100000 }], getHoldings);
chk('no-data family → hasData false, no NaN', empty.hasData === false && empty.coveragePct === 0);

  console.log(fail === 0 ? `\n🎯 ALL PASS — ${pass}/${pass}` : `\n💥 ${fail} failed (${pass} passed)`);
  if (fail > 0) process.exit(1);
}

main();
