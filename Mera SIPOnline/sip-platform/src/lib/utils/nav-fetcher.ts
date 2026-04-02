/**
 * NAV Fetcher — Fetches mutual fund NAV data from api.mfapi.in
 * and calculates trailing returns for all standard periods.
 *
 * Indian MF return convention:
 *   ≤ 1 year: Absolute return = (current - past) / past
 *   > 1 year: CAGR = (current / past)^(1/years) - 1
 */

import type { FundNavData, NavUpdateResult } from '@/types/funds';

interface MfApiNavEntry {
  date: string; // DD-MM-YYYY
  nav: string;  // decimal as string
}

interface MfApiResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: MfApiNavEntry[];
  status: string;
}

// ─── Date helpers ───

function parseNavDate(dateStr: string): Date {
  // DD-MM-YYYY → Date
  const [dd, mm, yyyy] = dateStr.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function subtractMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() - months);
  return result;
}

function subtractYears(d: Date, years: number): Date {
  const result = new Date(d);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function lastDayOfPreviousMonth(d: Date): Date {
  // Last calendar day of the month before d's month
  return new Date(d.getFullYear(), d.getMonth(), 0);
}

/**
 * Find the NAV closest to (but not after) a target date.
 * NAV data is sorted newest-first from the API.
 */
function findNavNearDate(
  navData: MfApiNavEntry[],
  targetDate: Date,
  toleranceDays: number = 7
): { nav: number; date: Date } | null {
  const targetTime = targetDate.getTime();
  let bestMatch: { nav: number; date: Date; diff: number } | null = null;

  for (const entry of navData) {
    const entryDate = parseNavDate(entry.date);
    const diff = Math.abs(entryDate.getTime() - targetTime);

    // Only consider entries within tolerance window
    if (diff <= toleranceDays * 24 * 60 * 60 * 1000) {
      if (!bestMatch || diff < bestMatch.diff) {
        bestMatch = { nav: parseFloat(entry.nav), date: entryDate, diff };
      }
    }

    // Optimization: if we've passed the target by more than tolerance, stop
    if (entryDate.getTime() < targetTime - toleranceDays * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return bestMatch ? { nav: bestMatch.nav, date: bestMatch.date } : null;
}

/**
 * Calculate return between two NAV values.
 * ≤ 1 year: absolute return
 * > 1 year: CAGR
 */
function calculateReturn(
  currentNav: number,
  pastNav: number,
  years: number
): number {
  if (pastNav <= 0 || currentNav <= 0) return 0;

  if (years <= 1) {
    // Absolute return
    return (currentNav - pastNav) / pastNav;
  } else {
    // CAGR
    return Math.pow(currentNav / pastNav, 1 / years) - 1;
  }
}

// ─── Main fetch function ───

export async function fetchNavForScheme(schemeCode: number): Promise<MfApiResponse> {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`MFAPI returned ${res.status} for scheme ${schemeCode}`);
  }

  return res.json();
}

export function calculateReturns(navData: MfApiNavEntry[]): FundNavData['returns'] {
  if (!navData || navData.length < 2) {
    return {
      mtd: null, oneMonth: null, threeMonth: null, sixMonth: null, ytd: null,
      oneYear: null, threeYear: null, fiveYear: null, tenYear: null,
    };
  }

  // Latest NAV is first entry
  const latestNav = parseFloat(navData[0].nav);
  const latestDate = parseNavDate(navData[0].date);

  const periods: {
    key: keyof FundNavData['returns'];
    targetDate: Date;
    years: number;
  }[] = [
    // MTD: from last business day of previous month (absolute return)
    { key: 'mtd', targetDate: lastDayOfPreviousMonth(latestDate), years: 0 },
    { key: 'oneMonth', targetDate: subtractMonths(latestDate, 1), years: 1 / 12 },
    { key: 'threeMonth', targetDate: subtractMonths(latestDate, 3), years: 0.25 },
    { key: 'sixMonth', targetDate: subtractMonths(latestDate, 6), years: 0.5 },
    { key: 'ytd', targetDate: startOfYear(latestDate), years: 0 }, // special
    { key: 'oneYear', targetDate: subtractYears(latestDate, 1), years: 1 },
    { key: 'threeYear', targetDate: subtractYears(latestDate, 3), years: 3 },
    { key: 'fiveYear', targetDate: subtractYears(latestDate, 5), years: 5 },
    { key: 'tenYear', targetDate: subtractYears(latestDate, 10), years: 10 },
  ];

  const returns: FundNavData['returns'] = {
    mtd: null, oneMonth: null, threeMonth: null, sixMonth: null, ytd: null,
    oneYear: null, threeYear: null, fiveYear: null, tenYear: null,
  };

  for (const period of periods) {
    const pastEntry = findNavNearDate(navData, period.targetDate);
    if (pastEntry) {
      if (period.key === 'mtd') {
        // MTD: absolute return from last day of previous month
        returns.mtd = (latestNav - pastEntry.nav) / pastEntry.nav;
      } else if (period.key === 'ytd') {
        // YTD: absolute return from Jan 1
        returns.ytd = (latestNav - pastEntry.nav) / pastEntry.nav;
      } else {
        returns[period.key] = calculateReturn(latestNav, pastEntry.nav, period.years);
      }
    }
  }

  return returns;
}

// ─── Batch update for all funds ───

export interface FundToUpdate {
  schemeCode: number;
  fundName: string;
}

export async function updateAllFundNavs(
  funds: FundToUpdate[]
): Promise<NavUpdateResult> {
  const results: FundNavData[] = [];
  const errors: NavUpdateResult['errors'] = [];

  // Process in batches of 5 to avoid rate limiting
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second

  for (let i = 0; i < funds.length; i += BATCH_SIZE) {
    const batch = funds.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (fund) => {
        const apiData = await fetchNavForScheme(fund.schemeCode);

        if (!apiData.data || apiData.data.length === 0) {
          throw new Error('No NAV data returned');
        }

        const returns = calculateReturns(apiData.data);
        const latestNav = parseFloat(apiData.data[0].nav);
        const latestNavDate = apiData.data[0].date;

        return {
          schemeCode: fund.schemeCode,
          fundName: fund.fundName,
          latestNav,
          latestNavDate,
          returns,
          updatedAt: new Date().toISOString(),
        } satisfies FundNavData;
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          schemeCode: batch[j].schemeCode,
          fundName: batch[j].fundName,
          error: result.reason?.message || 'Unknown error',
        });
      }
    }

    // Delay between batches (except last batch)
    if (i + BATCH_SIZE < funds.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    totalFunds: funds.length,
    successCount: results.length,
    failedCount: errors.length,
    funds: results,
    errors,
  };
}
