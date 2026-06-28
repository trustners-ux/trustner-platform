/**
 * Supabase-backed HoldingsProvider — reads the latest disclosed equity holdings
 * for a fund from pd_fund_holdings_latest. Implements the interface the overlap
 * engine declared as a stub; this is what unblocks stock-level look-through.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { HoldingsProvider } from '@/lib/portfolio-diagnostic/v2/overlap-engine';

export interface RichHolding {
  stock: string;
  isin: string | null;
  sector: string | null;
  weightPct: number;
}

export interface SupabaseHoldingsProvider extends HoldingsProvider {
  /** Like getUnderlyingHoldings but with ISIN + sector (for the aggregator). */
  getRichHoldings(amfiCode: string): Promise<RichHolding[] | null>;
  /** Latest disclosed month for a fund (yyyy-mm-dd), or null if none. */
  getAsOfDate(amfiCode: string): Promise<string | null>;
}

export function createSupabaseHoldingsProvider(): SupabaseHoldingsProvider {
  const fetchRows = async (amfiCode: string) => {
    const supabase = getSupabaseAdmin();
    if (!supabase || !/^[0-9]{4,7}$/.test(amfiCode)) return null;
    const { data, error } = await supabase
      .from('pd_fund_holdings_latest')
      .select('stock_name, isin, sector, pct_of_aum, instrument_type, as_of_date')
      .eq('amfi_code', amfiCode)
      .eq('instrument_type', 'equity');
    if (error || !data || data.length === 0) return null;
    return data as Array<{
      stock_name: string; isin: string | null; sector: string | null;
      pct_of_aum: number | null; instrument_type: string; as_of_date: string;
    }>;
  };

  return {
    async getUnderlyingHoldings(amfiCode: string) {
      const rows = await fetchRows(amfiCode);
      if (!rows) return null;
      return rows
        .filter((r) => r.pct_of_aum != null)
        .map((r) => ({ stock: r.stock_name, weightPct: r.pct_of_aum as number }));
    },
    async getRichHoldings(amfiCode: string) {
      const rows = await fetchRows(amfiCode);
      if (!rows) return null;
      return rows
        .filter((r) => r.pct_of_aum != null)
        .map((r) => ({ stock: r.stock_name, isin: r.isin, sector: r.sector, weightPct: r.pct_of_aum as number }));
    },
    async getAsOfDate(amfiCode: string) {
      const rows = await fetchRows(amfiCode);
      return rows?.[0]?.as_of_date ?? null;
    },
  };
}
