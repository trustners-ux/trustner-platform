/**
 * PROOF — same-fund folio reconciliation. The Mohua case: Nippon India Small Cap
 * held across 4 folios in ONE name got KEEP on three and LIQUIDATE on the tiny
 * lot — contradictory advice. After reconciliation all four are KEEP and the
 * tiny lot becomes a folio-MERGE suggestion (consolidate, don't redeem).
 * Run:  npx tsx src/lib/portfolio-diagnostic/v2/_proof_folio_reconcile.ts
 */
import { reconcileSameFundFolios, type FolioReconcileItem } from './overlap-engine';

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = '') => { console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };

const mk = (id: number, amfi: string, ent: string, cur: number, verdict: FolioReconcileItem['verdict'], action: string | null): FolioReconcileItem =>
  ({ holdingId: id, amfiCode: amfi, entityId: ent, entityName: 'Mohua Roy Choudhury', currentValueInr: cur, fundName: 'Nippon India Small Cap Fund', verdict, action, rationale: verdict === 'KEEP' ? 'Suitable and quality passes — hold.' : 'tiny lot' });

// ── 1. The Mohua / Nippon Small Cap case — 4 folios, one is a tiny REDEEM ──
const nippon = [
  mk(1, '100380', 'E1', 66600, 'KEEP', 'KEEP'),
  mk(2, '100380', 'E1', 46400, 'KEEP', 'KEEP'),
  mk(3, '100380', 'E1', 66600, 'KEEP', 'KEEP'),
  mk(4, '100380', 'E1', 3000,  'LIQUIDATE', 'REDEEM_TINY'),
];
const r1 = reconcileSameFundFolios(nippon);
const tinyOverride = r1.overrides.find((o) => o.holdingId === 4);
check('Nippon: tiny lot is overridden', !!tinyOverride, String(r1.overrides.length) + ' overrides');
check('Nippon: tiny lot → KEEP (no longer LIQUIDATE)', tinyOverride?.verdict === 'KEEP', tinyOverride?.verdict);
check('Nippon: tiny lot rationale says CONSOLIDATE not redeem', /consolidate/i.test(tinyOverride?.rationale ?? '') && /rather than redeeming/i.test(tinyOverride?.rationale ?? ''));
check('Nippon: a merge group is recorded', r1.mergeGroups.length === 1 && r1.mergeGroups[0].folioCount === 4);
check('Nippon: no override flips a KEEP folio to anything else', !r1.overrides.some((o) => [1,2,3].includes(o.holdingId) && o.verdict !== 'KEEP'));

// ── 2. Two WATCH folios (HDFC Multi Cap) — stay WATCH, smallest gets a soft merge note ──
const hdfc = [
  { holdingId: 10, amfiCode: '120505', entityId: 'E1', entityName: 'Mohua Roy Choudhury', currentValueInr: 133000, fundName: 'HDFC Multi Cap Fund', verdict: 'WATCH' as const, action: 'REDUCE', rationale: 'watching' },
  { holdingId: 11, amfiCode: '120505', entityId: 'E1', entityName: 'Mohua Roy Choudhury', currentValueInr: 49600, fundName: 'HDFC Multi Cap Fund', verdict: 'WATCH' as const, action: 'REDUCE', rationale: 'watching' },
];
const r2 = reconcileSameFundFolios(hdfc);
check('HDFC: both stay WATCH (no verdict flip)', !r2.overrides.some((o) => o.verdict !== 'WATCH'));
check('HDFC: smallest folio gets a "consider consolidating" note', /consider consolidating/i.test(r2.overrides.find((o) => o.holdingId === 11)?.rationale ?? ''));

// ── 3. Fund being EXITED across two folios — verdicts stay consistent, NO merge ──
const exiting = [
  { holdingId: 20, amfiCode: '999', entityId: 'E1', currentValueInr: 90000, fundName: 'Weak Fund', verdict: 'SWAP' as const, action: 'SWITCH_BETTER', rationale: 'switch to better' },
  { holdingId: 21, amfiCode: '999', entityId: 'E1', currentValueInr: 1000,  fundName: 'Weak Fund', verdict: 'LIQUIDATE' as const, action: 'REDEEM_TINY', rationale: 'tiny' },
];
const r3 = reconcileSameFundFolios(exiting);
check('Exit: tiny folio aligns to the fund SWAP verdict (consistent exit)', r3.overrides.find((o) => o.holdingId === 21)?.verdict === 'SWAP');
check('Exit: no merge group (fund is leaving, not staying)', r3.mergeGroups.length === 0);

// ── 4. Same fund, DIFFERENT holders — never merged across names ──
const crossName = [
  mk(30, '100380', 'E1', 66600, 'KEEP', 'KEEP'),
  mk(31, '100380', 'E2', 3000, 'LIQUIDATE', 'REDEEM_TINY'),
];
const r4 = reconcileSameFundFolios(crossName);
check('Cross-name: not grouped → tiny lot in OTHER name keeps its own verdict', r4.overrides.length === 0 && r4.mergeGroups.length === 0);

// ── 5. Single folio — untouched ──
const single = reconcileSameFundFolios([mk(40, '100380', 'E1', 50000, 'KEEP', 'KEEP')]);
check('Single folio: no overrides, no merge', single.overrides.length === 0 && single.mergeGroups.length === 0);

console.log(`\n${fail === 0 ? '🎯 ALL PASS' : '⚠️  SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
