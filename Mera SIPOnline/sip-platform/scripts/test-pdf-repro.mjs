import { generateFinancialReport } from '../src/lib/utils/financial-planning-pdf.ts';
import { generateFullReport } from '../src/lib/utils/financial-planning-calc.ts';

const planningRes = await fetch('https://t5fcpdqiy43k9qwb.public.blob.vercel-storage.com/reports/data/rpt-1777445293712-0vkgye.json');
const data = await planningRes.json();
console.log('Loaded planning data, goals:', (data.goals||[]).map(g => `${g.name} (${g.costType || 'present'})`).join(', '));

const report = generateFullReport(data);
console.log('Report computed, score=', report.score?.totalScore);

try {
  const pdf = generateFinancialReport({...report, claudeNarrative: 'test narrative'}, data, 'Randeep Das', 'comprehensive');
  console.log('PDF rendered ok, bytes=', pdf.length);
} catch (e) {
  console.error('PDF FAIL:', e.message);
  console.error(e.stack?.split('\n').slice(0, 15).join('\n'));
}
