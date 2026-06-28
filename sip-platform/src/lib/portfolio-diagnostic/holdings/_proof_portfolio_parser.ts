import * as XLSX from 'xlsx';
import { parseAmcPortfolioWorkbook } from './portfolio-parser';

// Synthetic SEBI-format monthly portfolio sheet (mimics HDFC/ICICI/SBI layout)
const aoa = [
  ['HDFC Flexi Cap Fund'],
  ['Monthly Portfolio Statement as on May 31, 2026'],
  [],
  ['Name of the Instrument', 'ISIN', 'Industry / Rating', 'Quantity', 'Market Value (Rs. in Lakhs)', '% to NAV'],
  ['EQUITY & EQUITY RELATED'],
  ['HDFC Bank Limited', 'INE040A01034', 'Banks', 1200000, 215000, 9.85],
  ['ICICI Bank Limited', 'INE090A01021', 'Banks', 900000, 102000, 4.67],
  ['Reliance Industries Limited', 'INE002A01018', 'Petroleum Products', 350000, 98000, 4.49],
  ['Infosys Limited', 'INE009A01021', 'IT - Software', 600000, 91200, 4.18],
  ['Sub Total', '', '', '', 506200, 23.19],
  ['DEBT INSTRUMENTS'],
  ['7.10% GOI 2034', 'IN0020230069', 'Sovereign', 50000, 5000, 0.23],
  ['MONEY MARKET INSTRUMENTS'],
  ['TREPS / Reverse Repo', '', '', '', 12000, 0.55],
  ['Net Current Assets', '', '', '', -2000, -0.09],
  ['Grand Total', '', '', '', 2183000, 100.00],
];
const ws = XLSX.utils.aoa_to_sheet(aoa);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const rows = parseAmcPortfolioWorkbook(buf);
let pass = 0, fail = 0;
const chk = (n: string, c: boolean, d = '') => { c ? pass++ : fail++; console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); };

chk('parsed expected count (4 eq + 1 debt + treps)', rows.length === 6, `got ${rows.length}`);
const hdfc = rows.find(r => r.stockName.includes('HDFC Bank'));
chk('HDFC Bank: equity + ISIN + 9.85%', !!hdfc && hdfc.instrumentType === 'equity' && hdfc.isin === 'INE040A01034' && hdfc.pctOfAum === 9.85);
chk('GOI bond classified debt', rows.find(r => r.stockName.includes('GOI'))?.instrumentType === 'debt');
chk('TREPS classified cash', rows.find(r => r.stockName.includes('TREPS'))?.instrumentType === 'cash');
chk('totals rows excluded', !rows.some(r => /total/i.test(r.stockName)));
chk('net current assets excluded', !rows.some(r => /net current/i.test(r.stockName)));
const eqWeight = rows.filter(r => r.instrumentType === 'equity').reduce((s, r) => s + (r.pctOfAum ?? 0), 0);
chk('equity weight sums ~23%', Math.abs(eqWeight - 23.19) < 0.1, `${eqWeight.toFixed(2)}%`);
console.log(fail === 0 ? `\n🎯 ALL PASS — ${pass}/${pass}` : `\n💥 ${fail} failed`);
