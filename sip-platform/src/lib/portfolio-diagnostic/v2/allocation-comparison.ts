/**
 * Trustner Verdict Engine v2 — MERGED ALLOCATION COMPARISON (REEDOS-parity)
 * ===========================================================================
 * REEDOS's "Scheme-Level Comparison" screen shows Asset Type → Category →
 * Fund, Existing vs New vs Change, all in ONE nested table. Trustner already
 * computes the three underlying layers (asset-class allocation in
 * forwardPlan, sub-category consolidation, and fund-level buy-list
 * replacement) but had never merged them into a single drill-down view —
 * this module does that merge, purely from data ReportData already carries.
 *
 * "New" allocation is a SIMULATION, not an executed trade: KEEP/STAR/WATCH
 * holdings stay put; SWAP/EXIT holdings move their value to their preferred
 * buy-list replacement (same sub-category, per buylist.ts); anything with no
 * named replacement (LIQUIDATE, or a SWAP with no buy-list match) moves to a
 * "Redeploy — Not Yet Allocated" bucket rather than being guessed at.
 */

export interface AllocationHoldingInput {
  fundName: string;
  category: string | null;
  currentValueInr: number;
  verdict: 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';
  preferredReplacementFundName?: string | null;
}

export interface AllocationFundRow {
  fundName: string;
  existingInr: number;
  newInr: number;
  changeInr: number;
}
export interface AllocationCategoryRow {
  category: string;
  existingInr: number;
  newInr: number;
  changeInr: number;
  funds: AllocationFundRow[];
}
export interface AllocationAssetTypeRow {
  assetType: string;
  existingInr: number;
  newInr: number;
  changeInr: number;
  categories: AllocationCategoryRow[];
}
export interface AllocationComparison {
  rows: AllocationAssetTypeRow[];
  totalExistingInr: number;
  totalNewInr: number;
}

const REDEPLOY_CATEGORY = 'Redeploy — Not Yet Allocated';
const REDEPLOY_ASSET_TYPE = 'Pending Reinvestment';

/** Coarse asset-class label for the top drill-down tier. */
export function assetTypeLabel(category: string | null): string {
  const c = (category || '').toLowerCase();
  if (/aggressive hybrid|balanced advantage|dynamic asset|multi[\s-]*asset|equity savings|conservative hybrid|hybrid/.test(c)) return 'Hybrid Funds';
  if (/debt|liquid|gilt|arbitrage|duration|bond|money market|overnight|psu|credit/.test(c)) return 'Debt Funds';
  if (/gold|silver|reit|invit/.test(c)) return 'Other (Gold/REIT)';
  return 'Equity Funds';
}

function addTo<K extends string>(map: Map<K, { existingInr: number; newInr: number }>, key: K, existingDelta: number, newDelta: number) {
  const cur = map.get(key) ?? { existingInr: 0, newInr: 0 };
  cur.existingInr += existingDelta;
  cur.newInr += newDelta;
  map.set(key, cur);
}

export function buildAllocationComparison(holdings: AllocationHoldingInput[]): AllocationComparison {
  // level maps keyed by "assetType||category||fund" collapsed progressively
  const assetMap = new Map<string, { existingInr: number; newInr: number }>();
  const catMap = new Map<string, { existingInr: number; newInr: number }>(); // key: assetType||category
  const fundMap = new Map<string, { existingInr: number; newInr: number }>(); // key: assetType||category||fund

  for (const h of holdings) {
    const value = h.currentValueInr || 0;
    if (value <= 0) continue;
    const assetType = assetTypeLabel(h.category);
    const category = h.category || 'Uncategorised';

    // Existing side always lands on the holding's own bucket.
    addTo(assetMap, assetType, value, 0);
    addTo(catMap, `${assetType}||${category}`, value, 0);
    addTo(fundMap, `${assetType}||${category}||${h.fundName}`, value, 0);

    // New side: STAR/KEEP/WATCH stay put; SWAP/LIQUIDATE move to the
    // replacement fund (same asset-type/category) or the redeploy bucket.
    const stays = h.verdict === 'STAR' || h.verdict === 'KEEP' || h.verdict === 'WATCH';
    if (stays) {
      addTo(assetMap, assetType, 0, value);
      addTo(catMap, `${assetType}||${category}`, 0, value);
      addTo(fundMap, `${assetType}||${category}||${h.fundName}`, 0, value);
    } else if (h.preferredReplacementFundName) {
      addTo(assetMap, assetType, 0, value);
      addTo(catMap, `${assetType}||${category}`, 0, value);
      addTo(fundMap, `${assetType}||${category}||${h.preferredReplacementFundName}`, 0, value);
    } else {
      addTo(assetMap, REDEPLOY_ASSET_TYPE, 0, value);
      addTo(catMap, `${REDEPLOY_ASSET_TYPE}||${REDEPLOY_CATEGORY}`, 0, value);
      addTo(fundMap, `${REDEPLOY_ASSET_TYPE}||${REDEPLOY_CATEGORY}||Awaiting RM allocation`, 0, value);
    }
  }

  // Reassemble the nested structure from the flat maps.
  const assetTypes = Array.from(assetMap.keys());
  const rows: AllocationAssetTypeRow[] = assetTypes.map((assetType) => {
    const a = assetMap.get(assetType)!;
    const catKeys = Array.from(catMap.keys()).filter((k) => k.startsWith(`${assetType}||`));
    const categories: AllocationCategoryRow[] = catKeys.map((catKey) => {
      const category = catKey.split('||')[1];
      const c = catMap.get(catKey)!;
      const fundKeys = Array.from(fundMap.keys()).filter((k) => k.startsWith(`${catKey}||`));
      const funds: AllocationFundRow[] = fundKeys
        .map((fundKey) => {
          const fundName = fundKey.split('||')[2];
          const f = fundMap.get(fundKey)!;
          return { fundName, existingInr: f.existingInr, newInr: f.newInr, changeInr: f.newInr - f.existingInr };
        })
        .sort((x, y) => y.existingInr - x.existingInr);
      return { category, existingInr: c.existingInr, newInr: c.newInr, changeInr: c.newInr - c.existingInr, funds };
    }).sort((x, y) => y.existingInr - x.existingInr);
    return { assetType, existingInr: a.existingInr, newInr: a.newInr, changeInr: a.newInr - a.existingInr, categories };
  }).sort((x, y) => y.existingInr - x.existingInr);

  const totalExistingInr = rows.reduce((s, r) => s + r.existingInr, 0);
  const totalNewInr = rows.reduce((s, r) => s + r.newInr, 0);

  return { rows, totalExistingInr, totalNewInr };
}
