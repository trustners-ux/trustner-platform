import { loadReportData, riskNotCapturedBanner } from './report-data';
import { renderThreePagerHtml } from './reports/three-pager';
(async () => {
  const d = await loadReportData(9);
  if (!d) { console.log('no data'); return; }
  console.log('run 9 riskProfileCaptured =', d.riskProfileCaptured, '(expect false → banner)');
  console.log('banner helper non-empty:', riskNotCapturedBanner(d).length > 0);
  console.log('three-pager contains banner:', /Risk profile not captured/i.test(renderThreePagerHtml(d)));
})().catch((e) => { console.error(e); process.exit(1); });
