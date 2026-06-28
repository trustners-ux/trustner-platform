/**
 * Live check — the "remains" funds now score end-to-end through scoreDiagnosticV2
 * against the live universe: 3 Dividend-Yield funds (newly added to master) + the
 * previously-unmatched in-feed funds (Kotak Focused, Motilal BAF, Baroda L&M,
 * Nippon Vision). Confirms each resolves to stats and gets a real verdict.
 * Run: npx tsx src/lib/portfolio-diagnostic/v2/_proof_remains_live.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { scoreDiagnosticV2, type V2HoldingInput } from './adapter';
import type { ClientRiskInputs } from './risk-model';

const here = dirname(fileURLToPath(import.meta.url));
const envTxt = readFileSync(resolve(here, '../../../../.env.local'), 'utf8');
const env = (k: string) => (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm'))?.[1] || '').replace(/^["']|["']$/g, '').trim();
const sb = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

const holdings: V2HoldingInput[] = [
  { holdingId: 'd1', fundName: 'ICICI Prudential Dividend Yield Equity Fund', amfiCode: '129310', currentValueInr: 300000, investedInr: 240000, xirrPct: 16, fundOption: 'Growth' },
  { holdingId: 'd2', fundName: 'HDFC Dividend Yield Fund', amfiCode: '148610', currentValueInr: 200000, investedInr: 170000, xirrPct: 14, fundOption: 'Growth' },
  { holdingId: 'd3', fundName: 'SBI Dividend Yield Fund', amfiCode: '151476', currentValueInr: 150000, investedInr: 140000, xirrPct: 9, fundOption: 'Growth' },
  { holdingId: 'k1', fundName: 'Kotak Focused Fund', amfiCode: '147477', currentValueInr: 250000, investedInr: 210000, xirrPct: 11, fundOption: 'Growth' },
  { holdingId: 'm1', fundName: 'Motilal Oswal Balanced Advantage Fund', amfiCode: '139870', currentValueInr: 150000, investedInr: 145000, xirrPct: 5, fundOption: 'Growth' },
  { holdingId: 'b1', fundName: 'Baroda BNP Paribas Large & Mid Cap Fund', amfiCode: '148471', currentValueInr: 180000, investedInr: 150000, xirrPct: 13, fundOption: 'Growth' },
  { holdingId: 'n1', fundName: 'Nippon India Vision Large & Mid Cap Fund', amfiCode: '100380', currentValueInr: 220000, investedInr: 170000, xirrPct: 14, fundOption: 'Growth' },
];

const risk = { age: 42, yearsToGoal: 14, monthlyInvestableInr: 60000, currentInvestableInr: 1450000, targetCorpusInr: null, selfRatedRisk: 'aggressive', maxDrawdownToleratedPct: 40, dependents: 1, jobStability: 'stable', emergencyMonths: 6 } as unknown as ClientRiskInputs;

(async () => {
  const res = await scoreDiagnosticV2(sb, holdings, risk);
  let ok = 0;
  for (const h of res.holdings) {
    const nm = holdings.find((x) => x.holdingId === h.holdingId)!.fundName;
    const fs = h.fundStats;
    const stats = fs ? `cat="${fs.category}" 5Y=${fs.return5yPct != null ? (fs.return5yPct * 100).toFixed(1) + '%' : 'NA'} TER=${fs.terPct ?? 'NA'} AUM=${fs.aumInrCr ?? 'NA'}` : 'NO STATS';
    const good = !!fs && fs.return5yPct != null;
    if (good) ok++;
    console.log(`${good ? '✓' : '✗'} ${nm.padEnd(42)} verdict=${(h.verdict?.action ?? 'none').padEnd(14)} ${stats}`);
  }
  console.log(`\n${ok}/${holdings.length} scored with real stats.`);
})().catch((e) => { console.error(e); process.exit(1); });
