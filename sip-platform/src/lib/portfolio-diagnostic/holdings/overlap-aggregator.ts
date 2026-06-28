/**
 * Family stock-overlap aggregator — true look-through.
 *
 * Dissolves each held fund into its underlying stocks (weighted by the rupees
 * the family holds in that fund), then aggregates the SAME stock across every
 * fund. This is the insight investors never see on a statement: "you own ₹X of
 * Reliance, and it reaches you through 4 different funds" — real single-stock
 * concentration that fund-level diversification hides.
 *
 * Pure given an injected holdings getter (so it unit-tests offline). The live
 * caller passes createSupabaseHoldingsProvider().getRichHoldings.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export interface FamilyHolding {
  amfiCode: string;
  valueInr: number;
  fundName?: string;
}

export interface RichHolding {
  stock: string;
  isin: string | null;
  sector: string | null;
  weightPct: number; // % of the fund's AUM (e.g. 9.85)
}

export interface EffectiveStock {
  stock: string;
  isin: string | null;
  sector: string | null;
  effectiveValueInr: number;
  effectivePctOfFamily: number;  // vs the WHOLE family corpus (honest concentration)
  effectivePctOfCovered: number; // vs the look-through-covered equity sleeve
  fundCount: number;             // how many distinct funds carry this stock
  funds: string[];               // names (or codes) of those funds
}

export interface FamilyStockOverlap {
  totalFunds: number;
  coveredFunds: number;          // funds we had look-through data for
  totalValueInr: number;
  coveredValueInr: number;
  coveragePct: number;           // coveredValue / totalValue × 100
  topStocks: EffectiveStock[];
  sectorConcentration: Array<{ sector: string; pctOfCovered: number }>;
  multiFundStocks: number;       // # stocks reached through ≥2 funds
  asOfDate: string | null;
  hasData: boolean;
}

function stockKey(h: RichHolding): string {
  if (h.isin && /^[A-Z0-9]{10,12}$/i.test(h.isin)) return h.isin.toUpperCase();
  return h.stock
    .toLowerCase()
    .replace(/\b(the|limited|ltd|company|co|corporation|corp|india|industries|inc)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function aggregateFamilyStockOverlap(
  holdings: FamilyHolding[],
  getHoldings: (amfiCode: string) => Promise<RichHolding[] | null>,
  opts: { topN?: number; asOfDateByFund?: (amfiCode: string) => Promise<string | null> } = {}
): Promise<FamilyStockOverlap> {
  const topN = opts.topN ?? 12;
  const totalValueInr = holdings.reduce((s, h) => s + (h.valueInr || 0), 0);

  type Agg = { display: string; isin: string | null; sector: string | null; value: number; funds: Set<string> };
  const byStock = new Map<string, Agg>();
  const sectorVal = new Map<string, number>();
  let coveredValueInr = 0;
  let coveredFunds = 0;
  const asOfDates: string[] = [];

  for (const h of holdings) {
    const rows = await getHoldings(h.amfiCode);
    if (!rows || rows.length === 0) continue;
    coveredFunds += 1;
    coveredValueInr += h.valueInr || 0;
    if (opts.asOfDateByFund) {
      const d = await opts.asOfDateByFund(h.amfiCode);
      if (d) asOfDates.push(d);
    }
    const fundLabel = h.fundName || h.amfiCode;
    for (const r of rows) {
      if (r.weightPct == null || r.weightPct <= 0) continue;
      const eff = (h.valueInr || 0) * (r.weightPct / 100);
      if (eff <= 0) continue;
      const key = stockKey(r);
      const prev = byStock.get(key);
      if (prev) {
        prev.value += eff;
        prev.funds.add(fundLabel);
        if (!prev.sector && r.sector) prev.sector = r.sector;
        if (r.stock.length > prev.display.length) prev.display = r.stock; // keep the fuller name
        if (!prev.isin && r.isin) prev.isin = r.isin;
      } else {
        byStock.set(key, { display: r.stock, isin: r.isin, sector: r.sector, value: eff, funds: new Set([fundLabel]) });
      }
      if (r.sector) sectorVal.set(r.sector, (sectorVal.get(r.sector) || 0) + eff);
    }
  }

  const denomFamily = totalValueInr || 1;
  const denomCovered = coveredValueInr || 1;

  const topStocks: EffectiveStock[] = [...byStock.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, topN)
    .map((a) => ({
      stock: a.display,
      isin: a.isin,
      sector: a.sector,
      effectiveValueInr: Math.round(a.value),
      effectivePctOfFamily: Math.round((a.value / denomFamily) * 1000) / 10,
      effectivePctOfCovered: Math.round((a.value / denomCovered) * 1000) / 10,
      fundCount: a.funds.size,
      funds: [...a.funds],
    }));

  const sectorConcentration = [...sectorVal.entries()]
    .map(([sector, v]) => ({ sector, pctOfCovered: Math.round((v / denomCovered) * 1000) / 10 }))
    .sort((a, b) => b.pctOfCovered - a.pctOfCovered)
    .slice(0, 8);

  const multiFundStocks = [...byStock.values()].filter((a) => a.funds.size >= 2).length;

  return {
    totalFunds: holdings.length,
    coveredFunds,
    totalValueInr: Math.round(totalValueInr),
    coveredValueInr: Math.round(coveredValueInr),
    coveragePct: Math.round((coveredValueInr / denomFamily) * 1000) / 10,
    topStocks,
    sectorConcentration,
    multiFundStocks,
    asOfDate: asOfDates.sort().slice(-1)[0] ?? null,
    hasData: coveredFunds > 0 && topStocks.length > 0,
  };
}
