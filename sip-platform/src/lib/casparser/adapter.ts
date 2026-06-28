/**
 * CASParser.in → PD Engine adapter
 *
 * Maps the CASParser.in Smart Parse response to our internal
 * RawHolding[] / RawSip[] types so the PD engine can score them
 * identically whether the CAS came from PDF upload or PAN+OTP pull.
 */

import type { SmartParseResponse, CasParserScheme, CasParserTransaction } from './client';
import type { RawHolding, RawSip, SipFrequency } from '@/lib/portfolio-diagnostic/types';
import type { CasParseResult } from '@/lib/portfolio-diagnostic/cas-parser';

export function adaptCasParserResponse(parsed: SmartParseResponse): CasParseResult {
  const holdings: RawHolding[] = [];
  const sips: RawSip[] = [];
  let totalFolios = 0;
  const amcSet = new Set<string>();

  for (const folio of parsed.mutual_funds || []) {
    totalFolios++;
    amcSet.add(folio.amc);

    const entityName = folio.linked_holders?.[0]?.name
      || parsed.investor?.name
      || 'Unknown';

    for (const scheme of folio.schemes || []) {
      if (scheme.units <= 0 && scheme.value <= 0) continue;

      holdings.push({
        entityName,
        fundName: scheme.name,
        folioNumber: folio.folio_number,
        amcName: folio.amc,
        units: scheme.units,
        currentNav: scheme.nav,
        currentValue: scheme.value,
        investedAmount: scheme.cost,
        firstInvestmentDate: findFirstTransactionDate(scheme.transactions),
        lastTransactionDate: findLastTransactionDate(scheme.transactions),
      });

      const derivedSip = deriveSipFromTransactions(scheme, folio.folio_number, folio.amc, entityName);
      if (derivedSip) sips.push(derivedSip);
    }
  }

  return {
    success: true,
    investorName: parsed.investor?.name || undefined,
    pan: parsed.investor?.pan || undefined,
    statementPeriod: parseStatementPeriod(parsed.meta?.statement_period),
    holdings,
    sips,
    totalFoliosFound: totalFolios,
    totalAmcsFound: amcSet.size,
  };
}

function findFirstTransactionDate(txns: CasParserTransaction[] | undefined): string | undefined {
  if (!txns || txns.length === 0) return undefined;
  const sorted = txns
    .filter(t => t.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  return sorted[0]?.date;
}

function findLastTransactionDate(txns: CasParserTransaction[] | undefined): string | undefined {
  if (!txns || txns.length === 0) return undefined;
  const sorted = txns
    .filter(t => t.date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.date;
}

/**
 * Derive SIP info from PURCHASE_SIP transactions.
 * Groups by month, takes the most recent recurring amount.
 */
function deriveSipFromTransactions(
  scheme: CasParserScheme,
  folioNumber: string,
  amcName: string,
  entityName: string
): RawSip | null {
  const sipTxns = (scheme.transactions || []).filter(
    t => t.type === 'PURCHASE_SIP' && t.amount && t.amount > 0
  );

  if (sipTxns.length < 2) return null;

  const sorted = sipTxns.sort((a, b) => b.date.localeCompare(a.date));
  const latestAmount = sorted[0].amount!;
  const latestDate = sorted[0].date;

  // Check if SIP is likely still active (last SIP within ~45 days)
  const lastSipDate = new Date(latestDate);
  const now = new Date();
  const daysSinceLast = (now.getTime() - lastSipDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLast > 45) return null;

  // Detect frequency from gaps between transactions
  const frequency = detectFrequency(sorted);

  // Detect SIP day
  const sipDay = new Date(latestDate).getDate();

  const monthlyAmount = normalizeToMonthly(latestAmount, frequency);

  return {
    entityName,
    fundName: scheme.name,
    folioNumber,
    amcName,
    monthlyAmountInr: monthlyAmount,
    actualAmountInr: latestAmount,
    frequency,
    sipDayOfMonth: sipDay <= 28 ? sipDay : undefined,
    startDate: sorted[sorted.length - 1].date,
    status: 'Active',
    hasStepUp: false,
  };
}

function detectFrequency(sortedTxns: CasParserTransaction[]): SipFrequency {
  if (sortedTxns.length < 2) return 'Monthly';

  const gaps: number[] = [];
  for (let i = 0; i < Math.min(sortedTxns.length - 1, 5); i++) {
    const d1 = new Date(sortedTxns[i].date);
    const d2 = new Date(sortedTxns[i + 1].date);
    gaps.push(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  if (avgGap <= 10) return 'Weekly';
  if (avgGap <= 45) return 'Monthly';
  if (avgGap <= 120) return 'Quarterly';
  return 'Monthly';
}

function normalizeToMonthly(amount: number, frequency: SipFrequency): number {
  switch (frequency) {
    case 'Weekly': return Math.round(amount * 4.33);
    case 'Daily': return Math.round(amount * 22);
    case 'Quarterly': return Math.round(amount / 3);
    default: return Math.round(amount);
  }
}

function parseStatementPeriod(period: string | undefined): { from: string; to: string } | undefined {
  if (!period) return undefined;
  const parts = period.split(/\s*(?:to|-)\s*/i);
  if (parts.length >= 2) {
    return { from: parts[0].trim(), to: parts[1].trim() };
  }
  return undefined;
}
