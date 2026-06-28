/**
 * AMC monthly-portfolio source registry — the best-effort auto-resolver.
 *
 * Most AMC disclosure pages gate the file behind a JS dropdown, so the RELIABLE
 * path is the admin upload (holdings-upload route). This registry covers the AMCs
 * whose consolidated monthly Excel sits at a CONSTRUCTIBLE static URL — verified
 * by actually fetching the file. The monthly cron iterates these, substitutes the
 * target month-end into the template, fetches, and ingests. A 404 just means that
 * AMC hasn't published yet (or changed its URL) — it's logged, not fatal, and the
 * team uploads it manually.
 *
 * Each URL is verified for the May-2026 month-end; the month-name / ordinal
 * conventions are a best-effort guess for other months until re-verified.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export interface AmcSource {
  amc: string;
  source: string;       // provenance tag stored on each holding row
  enabled: boolean;
  /** URL template with {DD} {Do} {MM} {MMM} {mmm} {Month} {month} {YYYY} {YY} tokens. */
  urlTemplate: string;
  notes?: string;
}

export const AMC_SOURCES: AmcSource[] = [
  {
    amc: 'SBI', source: 'amc:SBI', enabled: true,
    urlTemplate: 'https://www.sbimf.com/docs/default-source/scheme-portfolios/All-Schemes-Monthly-Portfolio---as-on-{Do}-{Month}-{YYYY}.xlsx',
    notes: 'Bare path works without the ?sfvrsn cache-buster. {Do}=31st, {Month}=May. Verified May-2026.',
  },
  {
    amc: 'NipponIndia', source: 'amc:NipponIndia', enabled: true,
    urlTemplate: 'https://mf.nipponindiaim.com/InvestorServices/FactsheetsDocuments/NIMF-MONTHLY-PORTFOLIO-{DD}-{MMM}-{YY}.xls',
    notes: '{DD}=31, {MMM}=May, {YY}=26. XLSX bytes despite the .xls extension. Verified May-2026.',
  },
];

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ordinal(d: number): string {
  if (d >= 11 && d <= 13) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
}

/** ISO yyyy-mm-dd of the last calendar day of a given year/month (1-indexed month). */
export function monthEndIso(year: number, month1to12: number): string {
  const last = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  return `${year}-${String(month1to12).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

/** Build a concrete file URL for an AMC source at a given month-end (yyyy-mm-dd). */
export function resolveSourceUrl(template: string, asOfDate: string): string {
  const [y, m, d] = asOfDate.split('-').map(Number);
  const full = MONTHS_FULL[m - 1];
  const tokens: Record<string, string> = {
    DD: String(d).padStart(2, '0'),
    Do: ordinal(d),
    MM: String(m).padStart(2, '0'),
    MMM: full.slice(0, 3),
    mmm: full.slice(0, 3).toLowerCase(),
    Month: full,
    month: full.toLowerCase(),
    YYYY: String(y),
    YY: String(y).slice(-2),
  };
  return template.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? `{${k}}`);
}

/** The portfolio month-end the cron should target — last day of the PREVIOUS month
 *  (AMCs publish the prior month's portfolio by ~10th of the next month). */
export function defaultTargetMonthEnd(now: Date): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12, current month
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  return monthEndIso(prevYear, prevMonth);
}
