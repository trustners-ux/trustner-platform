/**
 * Portfolio Diagnostic — Sort & Filter Utilities
 *
 * Pure functions for sorting and filtering tabular data (holdings,
 * SIPs) in the review UI. Designed to be table-agnostic — the UI
 * layer passes a SortSpec and FilterSpec, this module applies them.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  AnalyzedHolding,
  AnalyzedSip,
  HoldingSortField,
  SipSortField,
  SortSpec,
  FilterSpec,
  Verdict,
} from './types';

// ─────────────────────────────────────────────────────────────────
// VERDICT SORT ORDER (custom, not alphabetical)
// ─────────────────────────────────────────────────────────────────

/**
 * When sorting by verdict, this is the natural ordering:
 *   STAR (best) → KEEP → WATCH → SWAP → LIQUIDATE (worst)
 */
const VERDICT_ORDER: Record<Verdict, number> = {
  STAR: 1,
  KEEP: 2,
  WATCH: 3,
  SWAP: 4,
  LIQUIDATE: 5,
};

// ─────────────────────────────────────────────────────────────────
// HOLDING SORT
// ─────────────────────────────────────────────────────────────────

export function sortHoldings(
  holdings: AnalyzedHolding[],
  sort: SortSpec<HoldingSortField>
): AnalyzedHolding[] {
  return [...holdings].sort((a, b) => {
    const primary = compareHoldings(a, b, sort.field);
    if (primary !== 0) {
      return sort.direction === 'asc' ? primary : -primary;
    }
    // Tie-breaker: secondary sort or stable fallback
    if (sort.secondaryField) {
      const secondary = compareHoldings(a, b, sort.secondaryField);
      return sort.secondaryDirection === 'asc' ? secondary : -secondary;
    }
    return 0;
  });
}

function compareHoldings(
  a: AnalyzedHolding,
  b: AnalyzedHolding,
  field: HoldingSortField
): number {
  switch (field) {
    case 'fundName':
      return a.fundName.localeCompare(b.fundName);
    case 'category':
      return a.category.localeCompare(b.category);
    case 'entityName':
      return a.entityName.localeCompare(b.entityName);
    case 'investedInr':
      return a.investedInr - b.investedInr;
    case 'currentValueInr':
      return a.currentValueInr - b.currentValueInr;
    case 'unrealisedGainInr':
      return a.unrealisedGainInr - b.unrealisedGainInr;
    case 'xirrPct':
      return (a.xirrPct ?? -Infinity) - (b.xirrPct ?? -Infinity);
    case 'cagr3y':
      return (a.cagr3y ?? -Infinity) - (b.cagr3y ?? -Infinity);
    case 'cagr5y':
      return (a.cagr5y ?? -Infinity) - (b.cagr5y ?? -Infinity);
    case 'categoryQuartile':
      return (a.categoryQuartile ?? 5) - (b.categoryQuartile ?? 5);
    case 'compositeScore':
      return (a.compositeScore ?? -Infinity) - (b.compositeScore ?? -Infinity);
    case 'verdict':
      return VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict];
    case 'holdingPeriodMonths':
      return a.holdingPeriodMonths - b.holdingPeriodMonths;
  }
}

// ─────────────────────────────────────────────────────────────────
// HOLDING FILTER
// ─────────────────────────────────────────────────────────────────

export function filterHoldings(
  holdings: AnalyzedHolding[],
  filter: FilterSpec
): AnalyzedHolding[] {
  return holdings.filter((h) => {
    if (filter.verdicts && filter.verdicts.length > 0) {
      if (!filter.verdicts.includes(h.verdict)) return false;
    }
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(h.category)) return false;
    }
    if (filter.entityIds && filter.entityIds.length > 0) {
      if (!filter.entityIds.includes(h.entityId)) return false;
    }
    if (filter.entityTypes && filter.entityTypes.length > 0) {
      if (!filter.entityTypes.includes(h.entityType)) return false;
    }
    if (filter.minInvestedInr !== undefined) {
      if (h.investedInr < filter.minInvestedInr) return false;
    }
    if (filter.maxInvestedInr !== undefined) {
      if (h.investedInr > filter.maxInvestedInr) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// SIP SORT
// ─────────────────────────────────────────────────────────────────

export function sortSips(
  sips: AnalyzedSip[],
  sort: SortSpec<SipSortField>
): AnalyzedSip[] {
  return [...sips].sort((a, b) => {
    const primary = compareSips(a, b, sort.field);
    if (primary !== 0) {
      return sort.direction === 'asc' ? primary : -primary;
    }
    if (sort.secondaryField) {
      const secondary = compareSips(a, b, sort.secondaryField);
      return sort.secondaryDirection === 'asc' ? secondary : -secondary;
    }
    return 0;
  });
}

function compareSips(
  a: AnalyzedSip,
  b: AnalyzedSip,
  field: SipSortField
): number {
  switch (field) {
    case 'fundName':
      return a.fundName.localeCompare(b.fundName);
    case 'entityName':
      return a.entityName.localeCompare(b.entityName);
    case 'monthlyAmountInr':
      return a.monthlyAmountInr - b.monthlyAmountInr;
    case 'startDate':
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    case 'ageInMonths':
      return a.ageInMonths - b.ageInMonths;
    case 'status':
      return a.status.localeCompare(b.status);
    case 'nextInstallmentDate': {
      if (!a.nextInstallmentDate) return 1;
      if (!b.nextInstallmentDate) return -1;
      return (
        new Date(a.nextInstallmentDate).getTime() -
        new Date(b.nextInstallmentDate).getTime()
      );
    }
    case 'expected5YInflowInr':
      return a.expected5YInflowInr - b.expected5YInflowInr;
  }
}

// ─────────────────────────────────────────────────────────────────
// SIP FILTER
// ─────────────────────────────────────────────────────────────────

export function filterSips(
  sips: AnalyzedSip[],
  filter: FilterSpec
): AnalyzedSip[] {
  return sips.filter((s) => {
    if (filter.onlyActiveSips && s.status !== 'Active') return false;
    if (filter.entityIds && filter.entityIds.length > 0) {
      if (!filter.entityIds.includes(s.entityId)) return false;
    }
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(s.category)) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// COMMON DEFAULT SORTS (for first-render in UI)
// ─────────────────────────────────────────────────────────────────

export const DEFAULT_HOLDING_SORT: SortSpec<HoldingSortField> = {
  field: 'verdict',
  direction: 'asc',         // STAR first, LIQUIDATE last
  secondaryField: 'currentValueInr',
  secondaryDirection: 'desc',  // within each verdict, largest first
};

export const DEFAULT_SIP_SORT: SortSpec<SipSortField> = {
  field: 'monthlyAmountInr',
  direction: 'desc',        // largest SIPs first
  secondaryField: 'startDate',
  secondaryDirection: 'asc', // older SIPs first
};
