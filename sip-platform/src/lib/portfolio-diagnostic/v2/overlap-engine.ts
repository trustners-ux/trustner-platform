/**
 * Trustner Verdict Engine v2 — OVERLAP / CONSOLIDATION LAYER (Pillar 6)
 * =====================================================================
 * Indian retail investors routinely hold 8-15 funds, with 3-5 piled into the
 * SAME sub-category — paying for "diversification" that is really duplication.
 * This layer detects same-sub-category duplicate holdings and recommends a
 * KEEP-THE-BETTER consolidation, so a review can say:
 *
 *   "You hold 3 Flexi Cap funds. Keep <best by quality + suitability>;
 *    consolidate the other two (₹X) into it — same exposure, fewer moving parts."
 *
 * It needs NO external holdings feed — it runs on data the engine already has
 * (the research-universe sub-category, the v2 quality verdict, suitability,
 * Sharpe / 5Y return, and the current value). True STOCK-LEVEL look-through
 * overlap (the same underlying stock across funds) is a separate, future layer
 * that requires a fund→holdings data feed; see HoldingsProvider below.
 *
 * Trustner is an AMFI MFD (ARN-286886). No "advisor/advisory" terminology.
 */
import { subCategoryKey, type QualityVerdict, type SuitVerdict } from './fund-engine';

// ── Input: one item per scored holding ───────────────────────────────────────
export interface ConsolidationCandidate {
  holdingId: number;
  fundName: string;
  category: string | null;        // the MATCHED research-universe category (not the raw upload)
  currentValueInr: number;
  quality: QualityVerdict | null; // STAR | PASS | FLAG | FAIL | INSUFFICIENT
  suitability: SuitVerdict | null;// SUITABLE | PARTIAL | UNSUITABLE
  sharpe: number | null;
  return5yPct: number | null;
  onBuyList?: boolean;            // on the Trustner Approved Buy-List — preferred as the keeper
}

export interface ConsolidationMember {
  holdingId: number;
  fundName: string;
  currentValueInr: number;
  quality: QualityVerdict | null;
  suitability: SuitVerdict | null;
}

export interface ConsolidationGroup {
  subCategory: string;            // human label, e.g. "Flexi Cap"
  subKey: string;                 // internal key, e.g. "flexi"
  count: number;                  // funds in this sub-category
  keep: ConsolidationMember;      // the recommended one to retain
  consolidate: ConsolidationMember[]; // the duplicates to fold in
  totalGroupInr: number;
  totalConsolidatableInr: number; // sum of the consolidate members' current value
  confidence: 'high' | 'review';  // 'review' = themes may genuinely differ (thematic/ELSS lock-in)
  rationale: string;
}

export interface ConsolidationResult {
  groups: ConsolidationGroup[];
  duplicateFundCount: number;     // total funds that could be folded away
  totalConsolidatableInr: number; // total rupees that could be simplified
}

// Lower rank = better (preferred to KEEP).
const QUALITY_RANK: Record<QualityVerdict, number> = {
  STAR: 0, PASS: 1, FLAG: 2, INSUFFICIENT: 3, FAIL: 4,
};
const SUIT_RANK: Record<SuitVerdict, number> = {
  SUITABLE: 0, PARTIAL: 1, UNSUITABLE: 2,
};

// Human labels for the sub-category keys produced by subCategoryKey().
const SUBCAT_LABEL: Record<string, string> = {
  small_cap: 'Small Cap', mid_cap: 'Mid Cap', large_mid: 'Large & Mid Cap',
  large_cap: 'Large Cap', flexi: 'Flexi Cap', multi_cap: 'Multi Cap',
  value: 'Value / Contra', focused: 'Focused', elss: 'ELSS (tax-saver)',
  thematic: 'Sectoral / Thematic', aggressive_hybrid: 'Aggressive Hybrid',
  baf: 'Balanced Advantage', multi_asset: 'Multi Asset',
};

// Sub-categories where holding 2+ funds may be INTENTIONAL, not duplication:
//  - thematic/sectoral: two funds can target genuinely different themes
//  - elss: each tranche has its own 3-yr lock-in, so a blind merge isn't free
const REVIEW_ONLY_KEYS = new Set(['thematic', 'elss']);

// ONLY these diversified-equity sub-categories are meaningfully "duplicates"
// when held 2+. Hybrids, BAF, multi-asset, FoF, index and debt are excluded —
// holding more than one of those is usually structural, not redundant.
const CONSOLIDATABLE_KEYS = new Set([
  'small_cap', 'mid_cap', 'large_mid', 'large_cap', 'flexi', 'multi_cap', 'value', 'focused', 'elss', 'thematic',
]);

// Indian MF names almost always state the true category ("X Small Cap Fund"),
// which is MORE reliable than an upload's stored category (often mislabelled).
// Trust the NAME when it yields a specific consolidatable bucket; else the category.
function resolveSubKey(fundName: string, category: string | null): string {
  const fromName = subCategoryKey(fundName);
  if (CONSOLIDATABLE_KEYS.has(fromName)) return fromName;
  return subCategoryKey(category);
}

/**
 * Rank candidates within a group: suitability first, then quality, then prefer
 * a Trustner Approved Buy-List fund, then Sharpe/return, then size.
 * Buy-list sits AFTER suitability+quality so it only breaks ties among comparable
 * funds — it never keeps an unsuitable or clearly-weaker fund just for being listed.
 */
function betterToKeep(a: ConsolidationCandidate, b: ConsolidationCandidate): number {
  const sa = a.suitability ? SUIT_RANK[a.suitability] : 1;
  const sb = b.suitability ? SUIT_RANK[b.suitability] : 1;
  if (sa !== sb) return sa - sb;
  const qa = a.quality ? QUALITY_RANK[a.quality] : 3;
  const qb = b.quality ? QUALITY_RANK[b.quality] : 3;
  if (qa !== qb) return qa - qb;
  const ba = a.onBuyList ? 0 : 1;
  const bb = b.onBuyList ? 0 : 1;
  if (ba !== bb) return ba - bb;                              // prefer the buy-list fund as the keeper
  if ((b.sharpe ?? -99) !== (a.sharpe ?? -99)) return (b.sharpe ?? -99) - (a.sharpe ?? -99);
  if ((b.return5yPct ?? -99) !== (a.return5yPct ?? -99)) return (b.return5yPct ?? -99) - (a.return5yPct ?? -99);
  return (b.currentValueInr ?? 0) - (a.currentValueInr ?? 0); // keep the larger position if all else equal
}

const toMember = (c: ConsolidationCandidate): ConsolidationMember => ({
  holdingId: c.holdingId, fundName: c.fundName, currentValueInr: c.currentValueInr,
  quality: c.quality, suitability: c.suitability,
});

// Identity of a FUND irrespective of folio/entity/plan wording — so the same
// fund held across two family members counts as ONE fund, not a duplicate.
const fundIdentity = (name: string) => (name || '').toLowerCase()
  .replace(/\b(growth|regular|direct|idcw|payout|reinvestment|reinvest|dividend|plan|option|fund|scheme)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const inr = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

/**
 * Detect same-sub-category duplicate holdings and recommend keep-the-better
 * consolidation. Returns one group per sub-category that has 2+ funds.
 */
export function detectConsolidation(candidates: ConsolidationCandidate[]): ConsolidationResult {
  const byKey = new Map<string, ConsolidationCandidate[]>();
  for (const c of candidates) {
    const key = resolveSubKey(c.fundName, c.category);
    if (!CONSOLIDATABLE_KEYS.has(key)) continue;   // only genuine diversified-equity duplicates
    (byKey.get(key) ?? byKey.set(key, []).get(key)!).push(c);
  }

  const groups: ConsolidationGroup[] = [];
  for (const [key, rawMembers] of byKey) {
    // Collapse the same fund held across multiple folios/entities into ONE fund
    // (sum its value). Only DISTINCT funds count toward duplication.
    const distinct = new Map<string, ConsolidationCandidate>();
    for (const m of rawMembers) {
      const id = fundIdentity(m.fundName);
      const ex = distinct.get(id);
      if (!ex) distinct.set(id, { ...m });
      else ex.currentValueInr = (ex.currentValueInr || 0) + (m.currentValueInr || 0);
    }
    const members = [...distinct.values()];
    if (members.length < 2) continue;   // multiple folios of ONE fund is not duplicate FUNDS
    const ranked = [...members].sort(betterToKeep);
    const keep = ranked[0];
    // betterToKeep sorts most-suitable first, so if the TOP candidate is UNSUITABLE,
    // every fund in the group is unsuitable for this client → the holdings table
    // already says EXIT all of them. Emitting a "keep the best, fold the rest in"
    // card here would directly contradict those exit verdicts, so suppress the
    // group — there is no suitable fund to consolidate INTO.
    if (keep.suitability === 'UNSUITABLE') continue;
    const consolidate = ranked.slice(1);
    const totalGroupInr = members.reduce((s, m) => s + (m.currentValueInr || 0), 0);
    const totalConsolidatableInr = consolidate.reduce((s, m) => s + (m.currentValueInr || 0), 0);
    const label = SUBCAT_LABEL[key] ?? key;
    const confidence: ConsolidationGroup['confidence'] = REVIEW_ONLY_KEYS.has(key) ? 'review' : 'high';

    const keepWhy = keep.suitability === 'SUITABLE' && (keep.quality === 'STAR' || keep.quality === 'PASS')
      ? `${keep.fundName} is the strongest fit (${keep.quality}, suitable for this client)`
      : `${keep.fundName} ranks highest on quality + suitability in this group`;
    const rationale = confidence === 'review'
      ? `${members.length} ${label} funds held. These can target different themes/lock-ins, so confirm before merging — but if they overlap, ${keepWhy} and the rest (${inr(totalConsolidatableInr)}) are candidates to fold in.`
      : `${members.length} ${label} funds is duplication, not diversification — they own broadly the same opportunity set. Keep ${keepWhy}; consolidating the other ${consolidate.length} (${inr(totalConsolidatableInr)}) into it removes overlap and simplifies the book with no loss of exposure.`;

    groups.push({
      subCategory: label, subKey: key, count: members.length,
      keep: toMember(keep), consolidate: consolidate.map(toMember),
      totalGroupInr, totalConsolidatableInr, confidence, rationale,
    });
  }

  // Largest simplification opportunity first.
  groups.sort((a, b) => b.totalConsolidatableInr - a.totalConsolidatableInr);

  return {
    groups,
    duplicateFundCount: groups.reduce((s, g) => s + g.consolidate.length, 0),
    totalConsolidatableInr: groups.reduce((s, g) => s + g.totalConsolidatableInr, 0),
  };
}

// ─────────────────────────────────────────────────────────────────
// SAME-FUND FOLIO RECONCILIATION
// ─────────────────────────────────────────────────────────────────
//
// A fund held across multiple folios IN THE SAME NAME is ONE position, so it
// must get ONE consistent verdict — never "KEEP on the big folio, LIQUIDATE on
// the tiny one". The per-holding engine doesn't see siblings, so the tiny-lot
// cleanup rule can fire on a small folio of an otherwise-KEEP fund. That reads
// as contradictory advice to the client. This pass fixes it:
//   • the fund's verdict (from its largest folio) is applied to ALL its folios;
//   • a tiny-lot redeem on a KEPT fund becomes a folio-MERGE suggestion
//     (consolidate into the main folio — same fund, no exit, no tax);
//   • when the fund itself is being exited, every folio exits consistently.

const KEEP_VERDICT_SET = new Set(['STAR', 'KEEP', 'WATCH']);
const inrIN = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export interface FolioReconcileItem {
  holdingId: number;
  amfiCode: string | null;
  entityId: string | number | null;
  entityName?: string | null;
  currentValueInr: number;
  fundName: string;
  verdict: 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';
  action: string | null;   // v2 FinalAction
  rationale: string;
}
export interface FolioOverride {
  holdingId: number;
  verdict: FolioReconcileItem['verdict'];
  action: string | null;
  rationale: string;
}
export interface FolioMergeGroup {
  amfiCode: string;
  fundName: string;
  entityName: string;
  folioCount: number;
  totalValueInr: number;
  verdict: string;
}

/**
 * Reconcile multiple folios of the same fund held by the same entity. Pure.
 * Returns the holding verdict/rationale OVERRIDES to apply, plus the merge
 * groups (2+ folios of a kept fund) for reporting.
 */
export function reconcileSameFundFolios(
  items: FolioReconcileItem[]
): { overrides: FolioOverride[]; mergeGroups: FolioMergeGroup[] } {
  const groups = new Map<string, FolioReconcileItem[]>();
  for (const it of items) {
    if (!it.amfiCode) continue;                       // can't identify the fund — leave alone
    const key = `${it.amfiCode}|||${it.entityId ?? '?'}`;
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }

  const overrides: FolioOverride[] = [];
  const mergeGroups: FolioMergeGroup[] = [];

  for (const members of groups.values()) {
    if (members.length < 2) continue;                 // single folio — nothing to reconcile
    members.sort((a, b) => b.currentValueInr - a.currentValueInr);
    const main = members[0];
    const smallest = members[members.length - 1];
    const holder = main.entityName || 'the same name';
    const totalValueInr = members.reduce((s, m) => s + m.currentValueInr, 0);
    const fundKept = KEEP_VERDICT_SET.has(main.verdict);

    if (fundKept) {
      for (const m of members) {
        let verdict = m.verdict;
        let action = m.action;
        let rationale = m.rationale;
        let changed = false;
        // (a) align every folio to the fund's (largest-folio) verdict
        if (m.verdict !== main.verdict) {
          verdict = main.verdict; action = main.action; rationale = main.rationale; changed = true;
        }
        // (b) one merge suggestion, attached to the smallest folio
        if (m.holdingId === smallest.holdingId && !/consolidat/i.test(rationale)) {
          const wasTinyExit = m.verdict === 'LIQUIDATE' || m.action === 'REDEEM_TINY';
          const note = wasTinyExit
            ? `Held across ${members.length} folios of this fund in ${holder} — consolidate this ${inrIN(m.currentValueInr)} lot into the main folio rather than redeeming it (same fund, no exit, no tax).`
            : `Held across ${members.length} folios of this fund in ${holder} — consider consolidating into one folio for simplicity (same fund, no exit, no tax).`;
          rationale = `${rationale} ${note}`.trim();
          changed = true;
        }
        if (changed) overrides.push({ holdingId: m.holdingId, verdict, action, rationale });
      }
      mergeGroups.push({
        amfiCode: main.amfiCode as string, fundName: main.fundName, entityName: holder,
        folioCount: members.length, totalValueInr, verdict: main.verdict,
      });
    } else {
      // fund itself is being exited → keep every folio's EXIT verdict consistent, no merge
      for (const m of members) {
        if (m.verdict !== main.verdict) {
          overrides.push({ holdingId: m.holdingId, verdict: main.verdict, action: main.action, rationale: main.rationale });
        }
      }
    }
  }

  return { overrides, mergeGroups };
}

// ── FUTURE: stock-level look-through overlap (needs a fund→holdings feed) ─────
// When a holdings data source is wired in, implement this provider and a
// `detectStockOverlap()` that dissolves each fund into its underlying stocks
// and aggregates the same stock across funds to surface true effective weights
// ("you hold HDFC Bank at 8.1% across 4 funds"). Kept as an interface so the
// rest of the engine and UI can light up the moment a feed is chosen.
export interface HoldingsProvider {
  /** Return [{ stock, weightPct }] for a fund's latest disclosed portfolio, or null if unavailable. */
  getUnderlyingHoldings(amfiCode: string): Promise<{ stock: string; weightPct: number }[] | null>;
}
