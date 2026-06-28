import * as XLSX from 'xlsx';
import { parseAmcPortfolioWorkbookGrouped, detectAsOfDate } from './portfolio-parser';

let pass = 0, fail = 0;
const chk = (n: string, c: boolean, d = '') => { c ? pass++ : fail++; console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); };

const HEADER = ['Name of the Instrument', 'ISIN', 'Industry / Rating', 'Quantity', 'Market Value (Rs. in Lakhs)', '% to NAV'];

// ── Shape (a): one sheet = one scheme, title + as-on row ──────────────────────
const sheetA = [
  ['HDFC Flexi Cap Fund'],
  ['Monthly Portfolio Statement as on 31-May-2026'],
  [],
  HEADER,
  ['EQUITY & EQUITY RELATED'],
  ['HDFC Bank Limited', 'INE040A01034', 'Banks', 1200000, 215000, 9.85],
  ['ICICI Bank Limited', 'INE090A01021', 'Banks', 900000, 102000, 4.67],
  ['Reliance Industries Limited', 'INE002A01018', 'Petroleum Products', 350000, 98000, 4.49],
  ['Sub Total', '', '', '', 415000, 19.01],
  ['Grand Total', '', '', '', 2183000, 100.0],
];

// ── Shape (b): one sheet, TWO schemes stacked, each with its own title+header ──
const sheetB = [
  ['Acme Large Cap Fund'],
  ['Portfolio as on May 31, 2026'],
  HEADER,
  ['TCS Limited', 'INE467B01029', 'IT - Software', 100000, 38000, 8.10],
  ['Infosys Limited', 'INE009A01021', 'IT - Software', 120000, 22000, 4.69],
  ['Grand Total', '', '', '', 470000, 100.0],
  [],
  ['Acme Mid Cap Fund'],
  HEADER,
  ['Persistent Systems Limited', 'INE262H01021', 'IT - Software', 40000, 18000, 6.20],
  ['Coforge Limited', 'INE591G01017', 'IT - Software', 15000, 12000, 4.13],
  ['Grand Total', '', '', '', 290000, 100.0],
];

function wbFrom(...sheets: Array<{ name: string; aoa: unknown[][] }>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa), s.name);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// Test 1 — single-scheme sheet
{
  const g = parseAmcPortfolioWorkbookGrouped(wbFrom({ name: 'Portfolio', aoa: sheetA }));
  chk('shape-a: 1 group', g.length === 1, `got ${g.length}`);
  chk('shape-a: scheme name from title row', g[0]?.schemeName === 'HDFC Flexi Cap Fund', g[0]?.schemeName);
  chk('shape-a: asOfDate 2026-05-31', g[0]?.asOfDate === '2026-05-31', String(g[0]?.asOfDate));
  chk('shape-a: 3 holdings (totals dropped)', g[0]?.rows.length === 3, `got ${g[0]?.rows.length}`);
  chk('shape-a: HDFC Bank equity 9.85%', g[0]?.rows.some(r => r.stockName.includes('HDFC Bank') && r.instrumentType === 'equity' && r.pctOfAum === 9.85));
}

// Test 2 — stacked two-scheme sheet
{
  const g = parseAmcPortfolioWorkbookGrouped(wbFrom({ name: 'Equity Schemes', aoa: sheetB }));
  chk('shape-b: 2 groups', g.length === 2, `got ${g.length}`);
  chk('shape-b: group1 = Acme Large Cap Fund', g[0]?.schemeName === 'Acme Large Cap Fund', g[0]?.schemeName);
  chk('shape-b: group2 = Acme Mid Cap Fund', g[1]?.schemeName === 'Acme Mid Cap Fund', g[1]?.schemeName);
  chk('shape-b: g1 has TCS+Infosys (2)', g[0]?.rows.length === 2, `got ${g[0]?.rows.length}`);
  chk('shape-b: g2 has Persistent+Coforge (2)', g[1]?.rows.length === 2, `got ${g[1]?.rows.length}`);
  chk('shape-b: no totals leaked', !g.some(s => s.rows.some(r => /total/i.test(r.stockName))));
}

// Test 3 — workbook with one sheet per scheme (sheet name carries the scheme)
{
  const g = parseAmcPortfolioWorkbookGrouped(wbFrom(
    { name: 'Acme Large Cap Fund', aoa: [['Portfolio as on 31/05/2026'], HEADER, ['TCS Limited', 'INE467B01029', 'IT', 100000, 38000, 8.10], ['Grand Total', '', '', '', 0, 100]] },
    { name: 'Acme Small Cap Fund', aoa: [['Portfolio as on 31/05/2026'], HEADER, ['Some Smallco Limited', 'INE111A01011', 'Misc', 50000, 9000, 3.10], ['Grand Total', '', '', '', 0, 100]] },
  ));
  chk('shape-c: 2 groups (one per sheet)', g.length === 2, `got ${g.length}`);
  chk('shape-c: scheme names from sheet', g.map(s => s.schemeName).sort().join('|') === 'Acme Large Cap Fund|Acme Small Cap Fund', g.map(s => s.schemeName).join('|'));
}

// Test 4 — detectAsOfDate variants
chk('date: "as on 31-May-2026"', detectAsOfDate([['x as on 31-May-2026']]) === '2026-05-31');
chk('date: "as on May 31, 2026"', detectAsOfDate([['Portfolio as on May 31, 2026']]) === '2026-05-31');
chk('date: "31/05/2026"', detectAsOfDate([['Statement 31/05/2026']]) === '2026-05-31');
chk('date: none → null', detectAsOfDate([['no date here']]) === null);

console.log(fail === 0 ? `\n🎯 ALL PASS — ${pass}/${pass}` : `\n💥 ${fail} failed (${pass} passed)`);
if (fail > 0) process.exit(1);
