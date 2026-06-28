/**
 * PROOF — fund-name matcher guards (AMC + category) so a confident token
 * overlap can never cross a category (Small→Multi, Focused→Liquid) or an
 * AMC (Axis→Union, HDFC→Kotak). All six traps below are REAL mismatches
 * found on Basant Surana's run #21 (every stored amfi_code pointed at the
 * wrong fund). When the right fund is absent, the matcher must return null
 * (an honest "no match"), never a confidently-wrong fund.
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_matcher.ts
 */
import {
  extractCategoryToken,
  isPlausibleCodeMatch,
  fuzzyMatchSchemeName,
} from '../fund-data-client';

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };

// ── 1. category-token extraction (the discriminator) ──
const cat = (s: string) => extractCategoryToken(s);
check('cat: "small cap" → small', cat('Canara Robeco Small Cap Fund') === 'small');
check('cat: "multi cap" → multi', cat('Canara Robeco Multi Cap Fund - Regular Plan') === 'multi');
check('cat: "flexi cap" → flexi', cat('Nippon India Flexi Cap Fund') === 'flexi');
check('cat: "large cap" → large', cat('Nippon India Large Cap Fund') === 'large');
check('cat: "large & mid" → largemid (not large)', cat('Canara Robeco Large and Mid Cap Fund') === 'largemid');
check('cat: "focused" → focused', cat('Mirae Asset Focused Fund') === 'focused');
check('cat: "liquid" → liquid', cat('Mirae Asset Liquid Fund') === 'liquid');
check('cat: "multi asset" → multiasset (not multi)', cat('ICICI Prudential Multi-Asset Fund') === 'multiasset');
check('cat: truncated "ICICI Prudential Multi" → null (ambiguous)', cat('ICICI Prudential Multi') === null);
check('cat: midcap index → mid (consistent both sides)', cat('HDFC NIFTY Midcap 150 Index Fund') === 'mid');
check('cat: pure index → index', cat('HDFC Nifty 50 Index Fund') === 'index');

// ── 2. isPlausibleCodeMatch: the six real run-21 traps must be REJECTED ──
check('REJECT Canara Small Cap ↔ Canara Multi Cap (sub-cat)',
  !isPlausibleCodeMatch('Canara Robeco Small Cap Fund', 'Canara Robeco Multi Cap Fund - Regular Plan - Growth Option'));
check('REJECT Axis Small Cap ↔ Union Small Cap (AMC)',
  !isPlausibleCodeMatch('Axis Small Cap Fund', 'Union Small Cap Fund - Regular Plan - Growth Option'));
check('REJECT Nippon Flexi Cap ↔ Nippon Large Cap (sub-cat)',
  !isPlausibleCodeMatch('Nippon India Flexi Cap Fund', 'Nippon India Large Cap Fund- Growth Plan -Growth Option'));
check('REJECT HDFC Midcap150 Index ↔ Kotak Midcap150 Index (AMC)',
  !isPlausibleCodeMatch('HDFC NIFTY Midcap 150 Index Fund', 'KOTAK NIFTY MIDCAP 150 INDEX FUND-REGULAR PLAN-GROWTH'));
check('REJECT Axis Midcap ↔ JM Midcap (AMC)',
  !isPlausibleCodeMatch('Axis Midcap Fund', 'JM Midcap Fund (Regular) - Growth'));
check('REJECT Mirae Focused ↔ Mirae Liquid (equity→debt)',
  !isPlausibleCodeMatch('Mirae Asset Focused Fund', 'Mirae Asset Liquid Fund - Regular Plan - Growth'));

// ── 3. isPlausibleCodeMatch: genuine matches must be ACCEPTED ──
check('ACCEPT ICICI Pru Large Cap ↔ ICICI Pru Large Cap (erstwhile Bluechip)',
  isPlausibleCodeMatch('ICICI Prudential Large Cap Fund', 'ICICI Prudential Large Cap Fund (erstwhile Bluechip Fund)  - Growth'));
check('ACCEPT Canara L&M ↔ Canara Large and Mid Cap',
  isPlausibleCodeMatch('Canara Robeco Large and Mid Cap Fund', 'CANARA ROBECO LARGE AND MID CAP FUND - REGULAR PLAN - GROWTH OPTION'));
check('ACCEPT legacy Reliance Large Cap ↔ Nippon India Large Cap',
  isPlausibleCodeMatch('Reliance Large Cap Fund', 'Nippon India Large Cap Fund - Growth'));
check('ACCEPT truncated "ICICI Prudential Multi" ↔ Multi-Asset (cat ambiguous, AMC ok)',
  isPlausibleCodeMatch('ICICI Prudential Multi', 'ICICI Prudential Multi-Asset Fund - Regular - Growth'));

// ── 4. fuzzyMatchSchemeName: re-match lands on the RIGHT fund ──
const universe = [
  { amfiCode: '146127', schemeName: 'CANARA ROBECO SMALL CAP FUND - REGULAR PLAN - GROWTH OPTION' },
  { amfiCode: '151821', schemeName: 'Canara Robeco Multi Cap Fund - Regular Plan - Growth Option' },
  { amfiCode: '125350', schemeName: 'Axis Small Cap Fund - Regular Plan - Growth' },
  { amfiCode: '129647', schemeName: 'Union Small Cap Fund - Regular Plan - Growth Option' },
  { amfiCode: '147203', schemeName: 'Mirae Asset Focused Fund Regular Plan Growth' },
  { amfiCode: '111646', schemeName: 'Mirae Asset Liquid Fund - Regular Plan - Growth' },
  { amfiCode: '149089', schemeName: 'Nippon India Flexi Cap Fund - Regular Plan - Growth Plan - Growth Option' },
  { amfiCode: '106235', schemeName: 'Nippon India Large Cap  Fund- Growth Plan -Growth Option' },
  { amfiCode: '151725', schemeName: 'HDFC NIFTY Midcap 150 Index Fund - Growth Option' },
  { amfiCode: '153399', schemeName: 'KOTAK NIFTY MIDCAP 150 INDEX FUND-REGULAR PLAN-GROWTH' },
  { amfiCode: '114564', schemeName: 'Axis Midcap Fund - Regular Plan - Growth' },
  { amfiCode: '150812', schemeName: 'JM Midcap Fund (Regular) - Growth' },
];
const m = (name: string) => fuzzyMatchSchemeName(name, universe)?.amfiCode ?? 'NULL';
check('fuzzy: Canara Small Cap → 146127 (not 151821 Multi)', m('Canara Robeco Small Cap Fund') === '146127', m('Canara Robeco Small Cap Fund'));
check('fuzzy: Axis Small Cap → 125350 (not 129647 Union)', m('Axis Small Cap Fund') === '125350', m('Axis Small Cap Fund'));
check('fuzzy: Mirae Focused → 147203 (not 111646 Liquid)', m('Mirae Asset Focused Fund') === '147203', m('Mirae Asset Focused Fund'));
check('fuzzy: Nippon Flexi → 149089 (not 106235 Large)', m('Nippon India Flexi Cap Fund') === '149089', m('Nippon India Flexi Cap Fund'));
check('fuzzy: HDFC Midcap150 Index → 151725 (not 153399 Kotak)', m('HDFC NIFTY Midcap 150 Index Fund') === '151725', m('HDFC NIFTY Midcap 150 Index Fund'));
check('fuzzy: Axis Midcap → 114564 (not 150812 JM)', m('Axis Midcap Fund') === '114564', m('Axis Midcap Fund'));

// ── 5. honest no-match: right fund absent → NULL, never a wrong same-AMC fund ──
const noAxisSmall = universe.filter((u) => u.amfiCode !== '125350');
check('fuzzy: Axis Small Cap absent → NULL (NOT Union Small Cap)',
  fuzzyMatchSchemeName('Axis Small Cap Fund', noAxisSmall) === null,
  String(fuzzyMatchSchemeName('Axis Small Cap Fund', noAxisSmall)?.amfiCode));
const noMiraeFocused = universe.filter((u) => u.amfiCode !== '147203');
check('fuzzy: Mirae Focused absent → NULL (NOT Mirae Liquid)',
  fuzzyMatchSchemeName('Mirae Asset Focused Fund', noMiraeFocused) === null,
  String(fuzzyMatchSchemeName('Mirae Asset Focused Fund', noMiraeFocused)?.amfiCode));

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
