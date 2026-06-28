/**
 * Trustner Verdict Engine v2 — FUND-SIDE BRAIN
 * =============================================
 * Three layers, combined into one defensible verdict per holding:
 *
 *   LAYER A  QUALITY  — Is this a GOOD fund? (regime-robust 6-gate pre-screen)
 *   LAYER B  FORWARD  — How will it likely BEHAVE? (AUM headroom, downside, consistency)
 *   LAYER C  SUITABILITY — Is it right for THIS client? (category-risk vs ceiling, tax-mode, role)
 *
 * Verdict = combine(A, B, C). The crucial property: a fund can be Quality=STAR
 * yet still EXIT, because Suitability is an independent gate. That reproduces the
 * "great fund, wrong seat" call (e.g., a small-cap for a capital-first retiree).
 *
 * Two calibration choices make this hard to fault:
 *  1. Risk-adjusted gates are RELATIVE (vs sub-category median), not absolute
 *     Sharpe≥1.0 — because in a flat market every Sharpe compresses and an
 *     absolute gate would fail even excellent funds. Absolute Sharpe≥1.0 is kept
 *     only as an "elite" BONUS, never a fail.
 *  2. Within-equity risk is driven by CATEGORY (which reproduces the human risk
 *     label exactly), not the SEBI riskometer (which is uniformly "Very High").
 */

import { RiskTier, tierRank } from './risk-model';

// ── Research-stats shape the engine consumes (from pd_fund_research_stats) ───
export interface FundStats {
  schemeName: string;
  category: string | null;        // external_category (granular)
  riskometer: string | null;
  rolling3yPct: number | null;    // TRUE 3y rolling avg (from MFAPI on-demand); falls back to point r3 if null
  return3yPct: number | null;     // point-to-point 3y (fallback / display)
  return5yPct: number | null;
  return10yPct: number | null;
  sharpe: number | null;
  sortino: number | null;
  volatilityPct: number | null;
  aumInrCr: number | null;
  terPct: number | null;
}

// ── Sub-category peer medians (computed per run over the research-stats universe)
export interface PeerMedians {
  return5y: number | null;
  return10y: number | null;
  sharpe: number | null;
  sortino: number | null;
  terPct: number | null;
  volatilityPct: number | null;
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY → RISK TIER  (the spine — reverse-engineered to match Ram's labels)
// ════════════════════════════════════════════════════════════════════════════
export function categoryRiskTier(category: string | null): RiskTier {
  const c = (category || '').toLowerCase();
  if (!c) return 'High'; // unknown equity → conservative default = High
  // Very High — structural high-drawdown categories
  if (/small\s*cap|sectoral|thematic|sector/.test(c)) return 'Very High';
  if (/micro/.test(c)) return 'Very High';
  // High — large&mid MUST be tested BEFORE pure mid-cap (the substring "mid cap"
  // lives inside "large & mid cap", so /mid cap/ would otherwise mis-grade L&M as
  // Very High). An L&M manager carries large-cap ballast → High, not Very High
  // (matches Ram's locked preference: L&M is a moderate-aggression anchor).
  if (/large\s*(?:&|and|\+|-)?\s*mid/.test(c)) return 'High';
  if (/mid\s*cap/.test(c)) return 'Very High';            // pure mid-cap → Very High for capital-pres clients
  // High — value, focused, flexi, multicap, ELSS, contra, dividend-yield
  if (/value|contra|focused|flexi|multi\s*cap|elss|dividend yield/.test(c)) return 'High';
  // Moderate — large cap, aggressive hybrid, multi-asset, BAF/dynamic, asset-allocator FoF, index-largecap
  if (/large\s*cap|aggressive hybrid|multi asset|multi-asset|balanced advantage|dynamic asset|fofs domestic|index.*(nifty 50|sensex|large)/.test(c)) return 'Moderate';
  // Low-Moderate — conservative/equity-savings/balanced hybrid, children
  if (/conservative hybrid|equity savings|balanced hybrid|children/.test(c)) return 'Low-Moderate';
  // Low — debt, liquid, arbitrage, overnight, gilt
  if (/debt|liquid|arbitrage|overnight|gilt|money market|ultra short|low duration|short duration|corporate bond|banking and psu|gold|silver/.test(c)) return 'Low';
  return 'High';
}

// equity vs debt-ish classification (for asset-allocation roll-up)
export function isEquityish(category: string | null): boolean {
  const t = categoryRiskTier(category);
  return tierRank(t) >= tierRank('Moderate'); // Moderate+ counts toward "equity sleeve"
}

// equity-style categories that the rolling-return floor applies to
function rollingFloorForCategory(category: string | null): number | null {
  const c = (category || '').toLowerCase();
  if (/small\s*cap|mid\s*cap|sectoral|thematic|micro/.test(c)) return 18;       // SC/MC/thematic
  if (/large\s*cap|value|contra|focused|flexi|multi\s*cap|large\s*&?\s*mid|elss/.test(c)) return 14; // large/flexi
  if (/hybrid|multi asset|balanced advantage|dynamic asset|equity savings|fofs/.test(c)) return 11;  // hybrid
  return null; // debt/liquid/arbitrage → rolling-return equity floor not applicable
}

// ════════════════════════════════════════════════════════════════════════════
// LAYER A — QUALITY (regime-robust 6-gate Numerical Pre-Screen)
// ════════════════════════════════════════════════════════════════════════════
export type GateStatus = 'PASS' | 'FAIL' | 'NA';
export interface GateResult { gate: string; status: GateStatus; detail: string; }
export type QualityVerdict = 'STAR' | 'PASS' | 'FLAG' | 'FAIL' | 'INSUFFICIENT';

export type ChecklistStatus = 'PASS' | 'FLAG' | 'FAIL' | 'NA' | 'MANUAL';
export interface ChecklistItem { gate: string; status: ChecklistStatus; source: 'AUTO' | 'MANUAL'; detail: string; }

export interface QualityResult {
  verdict: QualityVerdict;
  gates: GateResult[];
  checklist: ChecklistItem[];   // Trustner 12-parameter selection checklist (display superset; verdict still driven by the 6 scoring gates)
  passes: number; fails: number; nas: number;
  eliteSharpe: boolean;
  notes: string[];
}

/**
 * Trustner 12-Parameter Fund Selection Checklist — the transparent superset shown
 * to the reviewer. 8 params are AUTO-screened from data; 4 (holdings count, skin-
 * in-the-game, exit load, turnover) are flagged "Manual DD" for analyst verification.
 * Reuses the already-computed 6 scoring gates so the keep/swap verdict is unchanged.
 */
function buildSelectionChecklist(f: FundStats, peers: PeerMedians, gates: GateResult[]): ChecklistItem[] {
  const g = (kw: string) => gates.find(x => x.gate.toLowerCase().includes(kw));
  const out: ChecklistItem[] = [];

  // 1. Age / track record (≥3y)
  const age = f.return10yPct != null ? { s: 'PASS' as ChecklistStatus, d: '10y+ track record' }
    : f.return5yPct != null ? { s: 'PASS' as ChecklistStatus, d: '5y+ track record' }
    : (f.return3yPct != null || f.rolling3yPct != null) ? { s: 'PASS' as ChecklistStatus, d: '~3y track record' }
    : { s: 'FLAG' as ChecklistStatus, d: '<3y record — too new for a track-record call' };
  out.push({ gate: '1. Age / track record (>=3y)', status: age.s, source: 'AUTO', detail: age.d });

  // 2. AUM within capacity band
  const ag = g('aum');
  out.push({ gate: '2. AUM within capacity band', source: 'AUTO',
    status: ag?.status === 'FAIL' ? 'FAIL' : ag?.detail.includes('SOFT-CLOSED') ? 'FLAG' : ag?.status === 'NA' ? 'NA' : 'PASS',
    detail: ag?.detail ?? 'no AUM data' });

  // 3. Expense ratio (TER) vs peers — lower is better
  if (f.terPct != null && peers.terPct != null && peers.terPct > 0) {
    const r = f.terPct / peers.terPct;
    out.push({ gate: '3. Expense ratio (TER) vs peers', source: 'AUTO',
      status: r <= 1.0 ? 'PASS' : r <= 1.15 ? 'FLAG' : 'FAIL',
      detail: `${f.terPct.toFixed(2)}% vs ${peers.terPct.toFixed(2)}% peer median` });
  } else out.push({ gate: '3. Expense ratio (TER) vs peers', status: 'NA', source: 'AUTO', detail: 'no TER data' });

  // 4. Volatility (Std Dev) vs peers — lower is better
  if (f.volatilityPct != null && peers.volatilityPct != null && peers.volatilityPct > 0) {
    const fv = f.volatilityPct * 100, pv = peers.volatilityPct * 100, r = fv / pv;
    out.push({ gate: '4. Volatility (Std Dev) vs peers', source: 'AUTO',
      status: r <= 1.0 ? 'PASS' : r <= 1.15 ? 'FLAG' : 'FAIL',
      detail: `${fv.toFixed(1)}% vs ${pv.toFixed(1)}% peer median (lower = better)` });
  } else out.push({ gate: '4. Volatility (Std Dev) vs peers', status: 'NA', source: 'AUTO', detail: 'no volatility data' });

  // 5. Sharpe (risk-adjusted) vs peers
  const sh = g('sharpe');
  out.push({ gate: '5. Sharpe (risk-adjusted) vs peers', status: (sh?.status as ChecklistStatus) ?? 'NA', source: 'AUTO', detail: sh?.detail ?? 'no data' });

  // 6. Returns vs category & benchmark (rolling floor + 5Y/10Y vs peers)
  const rets = [g('rolling'), g('5y'), g('10y')].filter(Boolean) as GateResult[];
  const retScored = rets.some(x => x.status !== 'NA');
  out.push({ gate: '6. Returns vs category & benchmark', source: 'AUTO',
    status: !retScored ? 'NA' : rets.some(x => x.status === 'FAIL') ? 'FAIL' : 'PASS',
    detail: rets.map(x => x.detail).join('  |  ') || 'no return data' });

  // 7. Number of holdings (35-65 ideal) — MANUAL
  out.push({ gate: '7. No. of holdings (35-65 ideal)', status: 'MANUAL', source: 'MANUAL', detail: 'Verify from latest factsheet (>120 in multi-cap = caution; 25-30 OK for focused).' });
  // 8. Skin in the game — MANUAL
  out.push({ gate: '8. Skin in the game (mgr/AMC investment)', status: 'MANUAL', source: 'MANUAL', detail: 'Verify manager/AMC own investment in the scheme vs AUM.' });
  // 9. Exit load & lock-in
  const isElss = subCategoryKey(f.category) === 'elss';
  out.push({ gate: '9. Exit load & lock-in', status: isElss ? 'FLAG' : 'MANUAL', source: 'MANUAL',
    detail: isElss ? 'ELSS — 3-year lock-in per installment; verify exit load.' : 'Verify exit load & any lock-in vs the client goal.' });
  // 10. Consistency across market cycles (rolling + downside)
  const so = g('sortino');
  out.push({ gate: '10. Consistency across cycles', source: 'AUTO',
    status: (f.rolling3yPct != null && so?.status === 'PASS') ? 'PASS' : so?.status === 'FAIL' ? 'FLAG' : f.rolling3yPct != null ? 'PASS' : 'NA',
    detail: `${f.rolling3yPct != null ? '3Y rolling-return based' : 'point-to-point'}; downside (Sortino) ${so?.detail ?? 'n/a'}` });
  // 11. Portfolio overlap — AUTO at portfolio level
  out.push({ gate: '11. Portfolio overlap', status: 'NA', source: 'AUTO', detail: 'Checked at portfolio level — see the Consolidation card (Pillar 6).' });
  // 12. Portfolio turnover ratio — MANUAL
  out.push({ gate: '12. Portfolio turnover ratio', status: 'MANUAL', source: 'MANUAL', detail: 'Verify — very high churn raises cost drag.' });

  return out;
}

// Per-category AUM CAPACITY BANDS (₹ Cr): [floor, addCeiling, avoidCeiling]
//   AUM ≤ addCeiling            → OPEN        : fine to recommend for fresh money
//   addCeiling < AUM ≤ avoid    → SOFT-CLOSED : hold existing if performing, but NO fresh additions
//   AUM > avoidCeiling          → AVOID       : size impairs the manager's agility (alpha-kill) — exit candidate
// Raised Jun 2026 to ≈2× the 2023 comfort-zone doc (AUMs have roughly doubled since), aligned to
// Trustner's May-2026 research shortlist working thresholds (e.g. flexi ~75k add / PPFAS ₹1.4L = avoid;
// HDFC Flexi ₹91k = soft-closed). Small-cap kept tightest — capacity is most constrained there.
const AUM_CEILINGS: Record<string, [number, number, number]> = {
  'small cap':          [2000,  48000,  65000],
  'mid cap':            [3000,  65000,  95000],
  'large cap':          [4000, 100000, 175000],
  'large & mid':        [4000,  85000, 130000],
  'flexi cap':          [4000,  75000, 120000],
  'multi cap':          [4000,  70000, 110000],
  'value':              [4000,  80000, 120000],
  'focused':            [2000,  55000,  80000],
  'aggressive hybrid':  [4000,  85000, 130000],
  'balanced advantage': [6000, 175000, 275000],
  'dynamic asset':      [6000, 175000, 275000],
  'multi asset':        [4000, 125000, 200000],
  'fofs domestic':      [2000,  75000, 120000],
  'sectoral':           [1500,  40000,  60000],
  'thematic':           [1500,  40000,  60000],
  'elss':               [2000,  60000,  90000],
};
function aumCeiling(category: string | null): [number, number, number] | null {
  const c = (category || '').toLowerCase();
  for (const key of Object.keys(AUM_CEILINGS)) if (c.includes(key)) return AUM_CEILINGS[key];
  return null;
}
type AumState = 'OPEN' | 'SOFT_CLOSED' | 'AVOID' | 'NA';
/** Where a fund's size sits vs its category capacity bands. */
function aumState(f: FundStats): { state: AumState; addCeil: number; avoidCeil: number } {
  const ceil = aumCeiling(f.category);
  if (!ceil || f.aumInrCr == null) return { state: 'NA', addCeil: 0, avoidCeil: 0 };
  const [, addCeil, avoidCeil] = ceil;
  const aum = f.aumInrCr;
  const state: AumState = aum > avoidCeil ? 'AVOID' : aum > addCeil ? 'SOFT_CLOSED' : 'OPEN';
  return { state, addCeil, avoidCeil };
}

// The NGEN feed encodes "no history" as 0 — a 0% return for a 1996 fund is real,
// but 0 on a young fund means "not available". Treat non-positive returns as
// missing so a brand-new fund is judged INSUFFICIENT (defer to conviction), not
// failed as if it returned 0%.
const nz = (x: number | null): number | null => (x == null || x <= 0 ? null : x);

export function assessQuality(f0: FundStats, peers: PeerMedians): QualityResult {
  const f: FundStats = { ...f0, return3yPct: nz(f0.return3yPct), return5yPct: nz(f0.return5yPct), return10yPct: nz(f0.return10yPct), rolling3yPct: nz(f0.rolling3yPct) };
  const gates: GateResult[] = [];
  const notes: string[] = [];
  const rolling = f.rolling3yPct ?? f.return3yPct; // prefer true rolling, fall back to point
  const usingPoint = f.rolling3yPct == null;

  // GATE 1 — rolling-return floor (category-aware). Regime note: in flat markets
  // this is the gate that legitimately fails; we keep it but never let it alone
  // condemn a fund that beats peers (handled in verdict synthesis).
  const floor = rollingFloorForCategory(f.category);
  if (floor == null) {
    gates.push({ gate: '3Y rolling return', status: 'NA', detail: 'non-equity category — equity rolling floor N/A' });
  } else if (rolling == null) {
    gates.push({ gate: '3Y rolling return', status: 'NA', detail: 'no return history' });
  } else {
    const pass = rolling * 100 >= floor;
    gates.push({ gate: '3Y rolling return', status: pass ? 'PASS' : 'FAIL', detail: `${(rolling * 100).toFixed(1)}% vs ≥${floor}% floor${usingPoint ? ' (point-to-point proxy)' : ' (rolling)'}` });
  }

  // GATE 2 — 5y ≥ 1.25× peer median
  if (f.return5yPct == null || peers.return5y == null) gates.push({ gate: '5Y vs peers', status: 'NA', detail: 'insufficient peer/fund 5Y data' });
  else { const ratio = f.return5yPct / peers.return5y; gates.push({ gate: '5Y vs peers', status: ratio >= 1.25 ? 'PASS' : 'FAIL', detail: `${(ratio).toFixed(2)}× peer median (need ≥1.25×)` }); }

  // GATE 3 — 10y ≥ 1.25× peer median (NA if <10y history → return10y null/0)
  if (!f.return10yPct || !peers.return10y) gates.push({ gate: '10Y vs peers', status: 'NA', detail: 'fund <10Y old or no peer data' });
  else { const ratio = f.return10yPct / peers.return10y; gates.push({ gate: '10Y vs peers', status: ratio >= 1.25 ? 'PASS' : 'FAIL', detail: `${ratio.toFixed(2)}× peer median` }); }

  // GATE 4 — Sharpe RELATIVE to peer median (regime-robust). Absolute ≥1.0 = elite bonus.
  let eliteSharpe = false;
  if (f.sharpe == null || peers.sharpe == null) gates.push({ gate: 'Sharpe vs peers', status: 'NA', detail: 'no Sharpe/peer data' });
  else {
    const pass = f.sharpe >= peers.sharpe;
    eliteSharpe = f.sharpe >= 1.0;
    gates.push({ gate: 'Sharpe vs peers', status: pass ? 'PASS' : 'FAIL', detail: `${f.sharpe.toFixed(2)} vs ${peers.sharpe.toFixed(2)} peer median${eliteSharpe ? ' · ELITE (≥1.0)' : ''}` });
  }

  // GATE 5 — Sortino ≥ peer median (Info Ratio deferred — not in feed)
  if (f.sortino == null || peers.sortino == null) gates.push({ gate: 'Sortino vs peers', status: 'NA', detail: 'no Sortino/peer data' });
  else gates.push({ gate: 'Sortino vs peers', status: f.sortino >= peers.sortino ? 'PASS' : 'FAIL', detail: `${f.sortino.toFixed(2)} vs ${peers.sortino.toFixed(2)} peer median` });

  // GATE 6 — AUM capacity band: OPEN (add) / SOFT-CLOSED (hold-only) / AVOID (alpha-kill)
  if (f.aumInrCr == null) gates.push({ gate: 'AUM headroom', status: 'NA', detail: 'no AUM data' });
  else {
    const a = aumState(f);
    const aumCr = Math.round(f.aumInrCr);
    if (a.state === 'NA') gates.push({ gate: 'AUM headroom', status: 'PASS', detail: `₹${aumCr}Cr (no category ceiling)` });
    else if (a.state === 'AVOID') { gates.push({ gate: 'AUM headroom', status: 'FAIL', detail: `₹${aumCr}Cr > avoid-ceiling ₹${a.avoidCeil}Cr → size impairs agility` }); notes.push('AUM breached a HARD alpha-kill ceiling → stop fresh inflows'); }
    else if (a.state === 'SOFT_CLOSED') { gates.push({ gate: 'AUM headroom', status: 'PASS', detail: `₹${aumCr}Cr > add-ceiling ₹${a.addCeil}Cr → SOFT-CLOSED (hold-only)` }); notes.push('SOFT-CLOSED: above the add-ceiling — hold if performing, but no fresh additions'); }
    else gates.push({ gate: 'AUM headroom', status: 'PASS', detail: `₹${aumCr}Cr ≤ add-ceiling ₹${a.addCeil}Cr (open)` });
  }

  const passes = gates.filter(g => g.status === 'PASS').length;
  const fails = gates.filter(g => g.status === 'FAIL').length;
  const nas = gates.filter(g => g.status === 'NA').length;
  const scored = passes + fails;
  const passRate = scored > 0 ? passes / scored : 0;
  // a fund with NO scored RETURN gate (g1/g2/g3 all NA) has no track record to
  // judge — even if Sharpe exists. That is a forward-conviction call, not a fail.
  const returnGatesScored = gates.slice(0, 3).filter(g => g.status !== 'NA').length;

  // Verdict: relative pass-rate over SCORED gates (NA excluded), + elite bonus.
  let verdict: QualityVerdict;
  // Too little history to judge (e.g. a fund <1y old, returns all NA) → defer to
  // forward-conviction rather than fail it. This is the boundary between what
  // software scores (track record) and what research decides (forward thesis).
  if (scored < 2 || returnGatesScored === 0) verdict = 'INSUFFICIENT';
  else if (passRate >= 0.8 && eliteSharpe) verdict = 'STAR';
  else if (passRate >= 0.6) verdict = 'PASS';
  else if (passRate >= 0.34) verdict = 'FLAG';
  else verdict = 'FAIL';
  // hard-ceiling breach can never be STAR
  if (notes.some(n => n.includes('HARD alpha-kill')) && verdict === 'STAR') verdict = 'PASS';

  // Build the transparent Trustner 12-parameter checklist (display superset).
  const checklist = buildSelectionChecklist(f, peers, gates);

  return { verdict, gates, checklist, passes, fails, nas, eliteSharpe, notes };
}

// ════════════════════════════════════════════════════════════════════════════
// LAYER B — FORWARD LENS (how it will likely behave)
// ════════════════════════════════════════════════════════════════════════════
export interface ForwardResult { aumHeadroom: 'AMPLE' | 'WATCH' | 'TIGHT' | 'BREACHED' | 'NA'; downside: 'LOW' | 'MODERATE' | 'HIGH' | 'NA'; notes: string[]; }
export function assessForward(f: FundStats): ForwardResult {
  const notes: string[] = [];
  let aumHeadroom: ForwardResult['aumHeadroom'] = 'NA';
  if (f.aumInrCr != null) {
    const a = aumState(f);
    if (a.state === 'AVOID') aumHeadroom = 'BREACHED';
    else if (a.state === 'SOFT_CLOSED') aumHeadroom = 'TIGHT';
    else if (a.state === 'OPEN') { const pct = (f.aumInrCr / a.addCeil) * 100; aumHeadroom = pct >= 75 ? 'WATCH' : 'AMPLE'; }
    if (aumHeadroom === 'TIGHT') notes.push(`Fund size ₹${Math.round(f.aumInrCr)}Cr is past the add-ceiling — hold-only; avoid fresh money (large size limits trading agility)`);
    else if (aumHeadroom === 'BREACHED') notes.push(`Fund size ₹${Math.round(f.aumInrCr)}Cr exceeds the capacity ceiling — forward alpha likely impaired`);
  }
  // downside character from volatility (forward suitability driver)
  let downside: ForwardResult['downside'] = 'NA';
  if (f.volatilityPct != null) {
    const v = f.volatilityPct * 100;
    downside = v >= 18 ? 'HIGH' : v >= 13 ? 'MODERATE' : 'LOW';
  }
  return { aumHeadroom, downside, notes };
}

// ════════════════════════════════════════════════════════════════════════════
// LAYER C — SUITABILITY (is this good fund right for THIS client?)
// ════════════════════════════════════════════════════════════════════════════
export type SuitVerdict = 'SUITABLE' | 'PARTIAL' | 'UNSUITABLE';
export interface SuitabilityResult {
  verdict: SuitVerdict;
  fundRiskTier: RiskTier;
  ceiling: RiskTier;
  taxModeFlag: string | null;
  notes: string[];
}
export interface SuitabilityContext {
  withinEquityCeiling: RiskTier;
  // tax-mode context
  holderHasOtherIncome?: boolean;      // for IDCW assessment
  fundOption?: 'growth' | 'idcw' | null;
}
export function assessSuitability(f: FundStats, ctx: SuitabilityContext): SuitabilityResult {
  const notes: string[] = [];
  const fundTier = categoryRiskTier(f.category);
  const gap = tierRank(fundTier) - tierRank(ctx.withinEquityCeiling);

  let verdict: SuitVerdict;
  if (gap <= 0) { verdict = 'SUITABLE'; }
  else if (gap === 1) { verdict = 'PARTIAL'; notes.push(`${fundTier}-risk vs ${ctx.withinEquityCeiling} ceiling → one notch above; hold a partial, trim the rest into the band`); }
  else { verdict = 'UNSUITABLE'; notes.push(`${fundTier}-risk vs ${ctx.withinEquityCeiling} ceiling → ${gap} notches above → wrong risk for this client (exit even if the fund is excellent)`); }

  // tax-mode appropriateness (the Nabanita IDCW case): IDCW is GOOD when the
  // holder has no other income (dividends tax-free under the rebate ceiling),
  // and BAD when the holder is in a high slab (dividend taxed at slab).
  let taxModeFlag: string | null = null;
  if (ctx.fundOption === 'idcw') {
    if (ctx.holderHasOtherIncome === false) { taxModeFlag = 'IDCW-OK'; notes.push('IDCW held by a no-other-income holder → dividends are tax-free income → KEEP the mode'); }
    else if (ctx.holderHasOtherIncome === true) { taxModeFlag = 'IDCW-TAXED'; notes.push('IDCW held by a taxable-slab holder → dividends taxed at slab → switch to Growth/SWP'); }
  }

  return { verdict, fundRiskTier: fundTier, ceiling: ctx.withinEquityCeiling, taxModeFlag, notes };
}

// ════════════════════════════════════════════════════════════════════════════
// VERDICT SYNTHESIS — combine A × B × C
// ════════════════════════════════════════════════════════════════════════════
export type FinalAction =
  | 'STAR_KEEP' | 'KEEP' | 'KEEP_MONITOR' | 'HOLD_PARTIAL'
  | 'SWITCH_BETTER' | 'EXIT_UNSUITABLE' | 'SWITCH_MODE' | 'REDUCE' | 'REDEEM_TINY';

export interface HoldingInput {
  schemeName: string;
  currentValueInr: number;
  investedInr?: number;
  xirrPct?: number | null;
  fundOption?: 'growth' | 'idcw' | null;
}

export interface Verdict {
  scheme: string;
  action: FinalAction;
  actionLabel: string;
  quality: QualityVerdict;
  suitability: SuitVerdict;
  fundRiskTier: RiskTier;
  rationale: string;
  detail: { quality: QualityResult; forward: ForwardResult; suit: SuitabilityResult };
}

const ACTION_LABEL: Record<FinalAction, string> = {
  STAR_KEEP: 'KEEP (top-rated)', KEEP: 'HOLD', KEEP_MONITOR: 'HOLD / monitor',
  HOLD_PARTIAL: 'HOLD part · trim rest into band', SWITCH_BETTER: 'SWITCH to better same-category',
  EXIT_UNSUITABLE: 'EXIT (wrong risk for this client)', SWITCH_MODE: 'SWITCH option (IDCW→Growth/SWP)',
  REDUCE: 'REDUCE (over-allocated)', REDEEM_TINY: 'REDEEM (tiny / tax-loss lot)',
};

export interface SynthContext extends SuitabilityContext {
  tinyLotThresholdInr?: number;   // default 12000
  // Life-stage posture governs the SWITCH threshold. For preservation clients a
  // suitable, stable ballast fund is HELD even on soft flat-market numbers (you
  // don't trigger LTCG to chase a few bps); switching needs a process failure.
  clientPosture?: 'preservation' | 'balanced' | 'growth';
}

export function synthesizeVerdict(h: HoldingInput, f: FundStats, peers: PeerMedians, ctx: SynthContext): Verdict {
  const quality = assessQuality(f, peers);
  const forward = assessForward(f);
  const suit = assessSuitability(f, { ...ctx, fundOption: h.fundOption });

  const tiny = ctx.tinyLotThresholdInr ?? 12000;
  let action: FinalAction;
  const why: string[] = [];

  // 0) tiny / tax-loss lots
  if (h.currentValueInr < tiny) {
    action = 'REDEEM_TINY';
    why.push(`Holding ₹${Math.round(h.currentValueInr).toLocaleString('en-IN')} is a tiny lot — redeem (harvest any loss).`);
  }
  // 1) tax-mode mismatch overrides (IDCW in taxable hands)
  else if (suit.taxModeFlag === 'IDCW-TAXED') {
    action = 'SWITCH_MODE';
    why.push('In dividend (IDCW) mode but the holder is taxed at slab on those dividends — switch to Growth (or Growth+SWP) to stop the tax leak.');
  }
  // 2) SUITABILITY is the dominant gate for capital-preservation clients
  else if (suit.verdict === 'UNSUITABLE') {
    action = 'EXIT_UNSUITABLE';
    const qnote = quality.verdict === 'STAR' || quality.verdict === 'PASS'
      ? 'It is a strong fund — but the wrong risk for this client (great fund, wrong seat).'
      : 'It is both too risky for this client and weak on quality.';
    why.push(`${suit.notes[0] || ''} ${qnote}`);
  }
  else if (suit.verdict === 'PARTIAL') {
    action = 'HOLD_PARTIAL';
    // suit.notes[0] already reads "…one notch above; hold a partial, trim the rest
    // into the band" — do NOT append a second "trim the rest into the band" clause
    // (that duplication is what bloated the report rows). One crisp sentence only.
    why.push(suit.notes[0]
      ? `${suit.notes[0]}.`
      : "One notch above the client's risk ceiling — hold a measured allocation and trim the excess into the band.");
    if (quality.verdict === 'FAIL' || quality.verdict === 'FLAG') why.push('Quality is also soft — lean to the lower end of the hold.');
  }
  // 3) suitable → quality decides
  else {
    if (suit.taxModeFlag === 'IDCW-OK') {
      action = 'KEEP';
      why.push('Suitable, and the IDCW mode is a deliberate tax-free income engine for this holder — keep it.');
    } else if (quality.verdict === 'INSUFFICIENT') {
      action = 'KEEP_MONITOR';
      why.push('Suitable, but too new for a track-record verdict — this is a forward-conviction hold; keep and monitor (the thesis, not the trailing numbers, decides here).');
    }
    else if (quality.verdict === 'STAR') { action = 'STAR_KEEP'; why.push('Suitable AND top-rated on quality — a core hold (consider adding).'); }
    else if (quality.verdict === 'PASS') { action = 'KEEP'; why.push('Suitable and quality passes — hold.'); }
    else if (quality.verdict === 'FLAG') { action = 'KEEP_MONITOR'; why.push('Suitable but quality is soft (likely flat-market drag) — hold and monitor against a better same-category option.'); }
    else {
      // quality === FAIL on a SUITABLE fund. The switch decision is life-stage dependent.
      const hardProcessFailure = quality.notes.some(n => n.includes('HARD alpha-kill'));
      if ((ctx.clientPosture === 'preservation' || ctx.clientPosture === 'balanced') && !hardProcessFailure) {
        action = 'KEEP_MONITOR';
        why.push('Right risk for the client and a stable ballast — recent numbers are soft (flat-market drag), but with no process failure we HOLD and monitor rather than trigger LTCG to chase a few bps. Switch only if a clearly superior same-category fund justifies the tax.');
      } else {
        action = 'SWITCH_BETTER';
        why.push(hardProcessFailure
          ? 'Quality fails AND a process red-flag (AUM alpha-kill breach) is present — switch to a stronger same-category fund.'
          : 'Growth-stage client and quality fails the screen — switch to a stronger fund in the same category.');
      }
    }
  }

  // AUM SOFT-CLOSE: a fine fund that is past its add-ceiling (SOFT-CLOSED) — or above
  // the avoid-ceiling but still held & performing (alpha-kill) — may be HELD, but must
  // NOT be recommended for fresh money. Never blocks an exit/switch already decided.
  const aumConstrained = quality.notes.some(n => n.includes('SOFT-CLOSED') || n.includes('HARD alpha-kill'));
  if (aumConstrained && (action === 'STAR_KEEP' || action === 'KEEP' || action === 'KEEP_MONITOR' || action === 'HOLD_PARTIAL')) {
    if (action === 'STAR_KEEP') action = 'KEEP';
    // strip any "consider adding" phrasing — it contradicts the hold-only rule
    for (let i = 0; i < why.length; i++) why[i] = why[i].replace(/\s*\(consider adding\)/gi, '');
    why.push('Hold-only: fund size is past our add-ceiling — keep the existing units while it performs, but do NOT add fresh money (large size limits the manager\'s agility). Direct new SIPs to a smaller same-category fund.');
  }

  // Forward-lens colour — but DON'T restate something already said. When the AUM
  // hold-only clause is present, the forward note ("Fund size ₹X Cr is past the
  // add-ceiling — hold-only; avoid fresh money…") just repeats it, which bloated
  // the report rows. Append the forward note only when it adds new information.
  const alreadySaidAum = why.some((w) => /add-ceiling|hold-only|fresh money/i.test(w));
  if (
    forward.notes.length &&
    !(alreadySaidAum && /add-ceiling|hold-only|fresh money|fund size/i.test(forward.notes[0]))
  ) {
    why.push(forward.notes[0]);
  }

  return {
    scheme: h.schemeName,
    action,
    actionLabel: ACTION_LABEL[action],
    quality: quality.verdict,
    suitability: suit.verdict,
    fundRiskTier: suit.fundRiskTier,
    rationale: why.join(' '),
    detail: { quality, forward, suit },
  };
}

// Normalised sub-category key for true like-vs-like peer comparison
// (methodology says "vs SUB-CATEGORY", e.g. Large Cap vs Large Cap — NOT all
//  Moderate-risk funds lumped together).
export function subCategoryKey(category: string | null): string {
  const c = (category || '').toLowerCase();
  if (/small\s*cap/.test(c)) return 'small_cap';
  if (/large\s*(?:&|and|\+|-)?\s*mid/.test(c)) return 'large_mid';   // MUST precede mid_cap; handle "Large & Mid" / "Large and Mid" / "Large-Mid"
  if (/mid\s*cap/.test(c)) return 'mid_cap';
  if (/large\s*cap/.test(c)) return 'large_cap';
  if (/flexi/.test(c)) return 'flexi';
  if (/multi\s*cap/.test(c)) return 'multi_cap';
  if (/value|contra|dividend\s*yield/.test(c)) return 'value';  // dividend-yield = value-style; peer with value/contra
  if (/focused/.test(c)) return 'focused';
  if (/elss/.test(c)) return 'elss';
  if (/sectoral|thematic|sector/.test(c)) return 'thematic';
  if (/aggressive hybrid/.test(c)) return 'aggressive_hybrid';
  if (/balanced advantage|dynamic asset/.test(c)) return 'baf';
  if (/multi asset|multi-asset/.test(c)) return 'multi_asset';
  if (/conservative hybrid/.test(c)) return 'conservative_hybrid';
  if (/equity savings/.test(c)) return 'equity_savings';
  if (/fofs|fof/.test(c)) return 'fof';
  if (/index|nifty|sensex/.test(c)) return 'index';
  if (/debt|liquid|arbitrage|gilt|duration|bond|money market/.test(c)) return 'debt';
  return 'other_equity';
}

// ── Peer-median helper: compute medians within the SUB-CATEGORY from a universe ─
export function computePeerMedians(universe: FundStats[], category: string | null): PeerMedians {
  const key = subCategoryKey(category);
  const peers = universe.filter(u => subCategoryKey(u.category) === key);
  const med = (xs: (number | null)[]): number | null => {
    const v = xs.filter((x): x is number => x != null && x > 0).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };
  return {
    return5y: med(peers.map(p => p.return5yPct)),
    return10y: med(peers.map(p => p.return10yPct)),
    sharpe: med(peers.map(p => p.sharpe)),
    sortino: med(peers.map(p => p.sortino)),
    terPct: med(peers.map(p => p.terPct)),
    volatilityPct: med(peers.map(p => p.volatilityPct)),
  };
}
