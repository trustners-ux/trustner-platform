/**
 * Live integration check — TER sanitiser + despace-recovered coverage end to end.
 * Runs scoreDiagnosticV2 against the LIVE Supabase universe for a handful of real
 * funds and prints each one's TER checklist line. Confirms:
 *   (a) despace-recovered funds (SBI/Kotak Flexicap) now resolve to research stats,
 *   (b) TER prints as a correct percent (e.g. "2.29%") not the old fraction "0.02%",
 *   (c) feed-garbage TER (>3%, e.g. Sundaram L&M 9.43%) is treated as NA, not trusted.
 * Run: npx tsx src/lib/portfolio-diagnostic/v2/_proof_ter_live.ts
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
  { holdingId: 'h1', fundName: 'SBI Flexicap Fund', amfiCode: '103215', currentValueInr: 500000, investedInr: 400000, xirrPct: 12, fundOption: 'Growth' },
  { holdingId: 'h2', fundName: 'Kotak Flexicap Fund', amfiCode: '112090', currentValueInr: 500000, investedInr: 420000, xirrPct: 11, fundOption: 'Growth' },
  { holdingId: 'h3', fundName: 'Sundaram Large & Midcap Fund', amfiCode: '105001', currentValueInr: 300000, investedInr: 250000, xirrPct: 10, fundOption: 'Growth' },
  { holdingId: 'h4', fundName: 'Nippon India Large Cap Fund', amfiCode: '118632', currentValueInr: 300000, investedInr: 250000, xirrPct: 13, fundOption: 'Growth' },
];

const risk: ClientRiskInputs = {
  age: 40, yearsToGoal: 15, monthlyInvestableInr: 50000, currentInvestableInr: 1600000,
  targetCorpusInr: null, selfRatedRisk: 'aggressive', maxDrawdownToleratedPct: 40,
  dependents: 1, jobStability: 'stable', emergencyMonths: 6,
} as unknown as ClientRiskInputs;

(async () => {
  const res = await scoreDiagnosticV2(sb, holdings, risk);
  // locate the checklist array anywhere on the verdict object
  const findChecklist = (v: unknown): { gate: string; status?: string; detail?: string }[] | null => {
    const seen = new Set<unknown>();
    const walk = (o: unknown): unknown[] | null => {
      if (!o || typeof o !== 'object' || seen.has(o)) return null;
      seen.add(o);
      if (Array.isArray(o)) {
        if (o.some((x) => x && typeof x === 'object' && 'gate' in (x as object) && /TER|Expense/i.test((x as { gate: string }).gate))) return o;
        for (const x of o) { const r = walk(x); if (r) return r; }
        return null;
      }
      for (const val of Object.values(o as Record<string, unknown>)) { const r = walk(val); if (r) return r; }
      return null;
    };
    return walk(v) as { gate: string; status?: string; detail?: string }[] | null;
  };
  for (const h of res.holdings) {
    const ck = findChecklist(h.verdict);
    const ter = ck?.find((c) => /TER|Expense ratio/i.test(c.gate));
    const nm = holdings.find((x) => x.holdingId === h.holdingId)!.fundName;
    console.log(`\n${nm}  [${h.fundStats ? 'stats ✓' : 'NO STATS'}]  terPct(loaded)=${h.fundStats?.terPct ?? 'null'}  action=${h.verdict?.action ?? 'n/a'}`);
    if (ter) console.log(`   TER check → [${ter.status}] ${ter.detail}`);
    else console.log('   (no TER line in checklist; checklist len=' + (ck?.length ?? 0) + ')');
  }
  console.log('\n— interpretation —');
  console.log('SBI/Kotak Flexicap should show a real % (e.g. 2.29% / 1.42%), proving fraction→percent fix + despace coverage.');
  console.log('Sundaram L&M (feed TER 9.43%) should read "no TER data" (NA), proving bad-data is dropped.');
})().catch((e) => { console.error(e); process.exit(1); });
