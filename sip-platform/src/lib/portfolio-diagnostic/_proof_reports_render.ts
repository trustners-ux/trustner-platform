/**
 * Runtime render check — confirm the report generators produce HTML without
 * throwing and now include the v2 sections (consolidation / tax / checklist /
 * buy-list / exit-vs-switch). Renders against run 9 (the only run with full v2
 * data persisted). Run: npx tsx src/lib/portfolio-diagnostic/_proof_reports_render.ts
 */
import { loadReportData } from './report-data';
import { renderThreePagerHtml } from './reports/three-pager';
import { renderFullPortfolioReviewHtml } from './reports/full-portfolio-review';
import { renderActionSheetHtml } from './reports/action-sheet';
import { renderOnePagerHtml } from './reports/one-pager';

const RUN_ID = 9;
const probes: Record<string, RegExp[]> = {
  'three-pager':  [/consolidat/i, /tax/i, /buy-?list/i, /checklist|12-?point/i],
  'full-review':  [/consolidat/i, /tax/i, /buy-?list/i, /EXIT|SWITCH/i], // 12-pt checklist appendix removed per Ram (Jun 2026)
  'action-sheet': [/consolidat/i, /tax/i, /buy-?list|★/i, /EXIT|SWITCH/i],
  'one-pager':    [/EXIT|SWITCH|buy-?list|★|consolidat|tax/i],
};

(async () => {
  const data = await loadReportData(RUN_ID);
  if (!data) { console.error('no report data for run', RUN_ID); process.exit(1); }
  console.log(`Loaded run ${RUN_ID}: ${data.familyName} — ${data.numHoldings} holdings | consolidationGroups=${data.consolidationGroups.length} | taxSummary=${data.taxSummary ? data.taxSummary.exitCount + ' exits' : 'null'} | onBuyList holdings=${[...data.starHoldings, ...data.keepHoldings, ...data.watchHoldings, ...data.swapHoldings, ...data.liquidateHoldings].filter(h => h.onBuyList).length} | with checklist=${[...data.starHoldings, ...data.keepHoldings, ...data.watchHoldings, ...data.swapHoldings, ...data.liquidateHoldings].filter(h => h.checklist && h.checklist.length).length}\n`);

  const gens: Record<string, () => string> = {
    'three-pager':  () => renderThreePagerHtml(data),
    'full-review':  () => renderFullPortfolioReviewHtml(data),
    'action-sheet': () => renderActionSheetHtml(data),
    'one-pager':    () => renderOnePagerHtml(data),
  };

  let fail = 0;
  for (const [name, fn] of Object.entries(gens)) {
    try {
      const html = fn();
      const ok = html.length > 1000;
      const hits = probes[name].map((re) => re.test(html));
      const missing = probes[name].filter((_, i) => !hits[i]).map((re) => re.source);
      // compliance: no prohibited title (allow the SEBI Regs phrase)
      const compBad = /advis[oe]r|advisory/i.test(html.replace(/Investment Advisers\)? Regulations, 2013/gi, ''));
      const pass = ok && missing.length === 0 && !compBad;
      if (!pass) fail++;
      console.log(`${pass ? '✅' : '❌'} ${name.padEnd(13)} ${html.length} chars | sections: ${hits.map((h,i)=>(h?'✓':'✗')+probes[name][i].source.slice(0,10)).join(' ')}${compBad ? ' | ⚠ COMPLIANCE' : ''}${missing.length ? ' | MISSING: '+missing.join(',') : ''}`);
    } catch (e) {
      fail++; console.log(`❌ ${name.padEnd(13)} THREW: ${(e as Error).message}`);
    }
  }
  console.log(`\n${fail === 0 ? '🎯 ALL RENDER + v2 sections + compliance OK' : '⚠ '+fail+' failed'}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
