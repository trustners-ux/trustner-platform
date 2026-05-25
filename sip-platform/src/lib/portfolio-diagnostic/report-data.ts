/**
 * Portfolio Diagnostic — Report Data Assembler
 *
 * Fetches and shapes all data needed for the client-facing reports:
 *   - Full Portfolio Review (Tier A/B/C/D verdicts + summary)
 *   - Action Sheet (swaps, liquidations, tax estimate, sign-off)
 *
 * Modeled on the Rohit Jain Family report (22 May 2026) — the
 * reference output Ram wants every diagnostic to match.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

export type Verdict = 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';

export interface ReportHolding {
  id: number;
  entityName: string;
  fundName: string;
  category: string | null;
  investedInr: number;
  currentValueInr: number;
  unrealisedGainInr: number;
  xirrPct: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
  holdingPeriodMonths: number | null;
  verdict: Verdict;
  rationale: string | null;
  preferredReplacementFundName?: string | null;
  preferredReplacementAmfiCode?: string | null;
}

export interface ReportData {
  // Document identity
  diagnosticId: number;
  documentId: string;
  reportDate: string;          // "22 May 2026"
  reportDateIso: string;       // "2026-05-22"

  // Family
  familyId: number;
  familyName: string;
  entitiesCovered: string[];   // ["ANU JAIN", "NEEL KAMAL", ...]

  // KPIs
  totalInvestedInr: number;
  currentValueInr: number;
  totalGainInr: number;
  familyXirrPct: number | null;
  numHoldings: number;
  numUniqueFunds: number;
  numEntities: number;
  numAmcs: number;

  // Tiered holdings (sorted by 3Y CAGR within each tier)
  starHoldings: ReportHolding[];
  keepHoldings: ReportHolding[];
  watchHoldings: ReportHolding[];
  swapHoldings: ReportHolding[];
  liquidateHoldings: ReportHolding[];

  // Tier totals
  tierTotals: {
    star:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    keep:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    watch:     { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    swap:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    liquidate: { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
  };

  // Action-sheet specific
  totalReallocationInr: number;
  swapCount: number;
  liquidateCount: number;

  // RM
  rmName: string;
}

/**
 * Pull a full diagnostic + holdings + scoring data, shape it into
 * report-ready form. Returns null if the diagnostic doesn't exist
 * or has no holdings.
 */
export async function loadReportData(
  diagnosticRunId: number,
  rmName: string = 'Sangeeta Shah / Ram Shah, CFP™'
): Promise<ReportData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // ── 1. Diagnostic run + family ─────────────────────────────
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select(`
      id, document_id, family_id, family_name, created_at,
      total_invested_inr, current_value_inr, family_xirr_pct,
      num_holdings, num_active_sips, monthly_sip_flow_inr
    `)
    .eq('id', diagnosticRunId)
    .maybeSingle();
  if (!run) return null;

  // ── 2. Holdings + their categories + preferred replacements ──
  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select(`
      id, fund_name, amfi_code, category,
      invested_inr, current_value_inr, unrealised_gain_inr,
      xirr_pct, cagr_3y, cagr_5y, holding_period_months,
      verdict, verdict_rationale,
      entity:pd_family_entities!pd_diagnostic_holdings_entity_id_fkey(entity_name)
    `)
    .eq('diagnostic_run_id', diagnosticRunId)
    .order('verdict', { ascending: true });

  if (!holdings || holdings.length === 0) return null;

  // ── 3. Preferred replacements per category ─────────────────
  const { data: preferred } = await supabase
    .from('pd_preferred_funds_by_category')
    .select('category, primary_amfi_code, primary_fund_name:pd_fund_master!pd_preferred_funds_by_category_primary_amfi_code_fkey(scheme_name)');

  const replacementByCategory = new Map<string, { fundName: string; amfiCode: string }>();
  for (const p of preferred ?? []) {
    const raw = (p as Record<string, unknown>).primary_fund_name;
    const fundRow = Array.isArray(raw) ? raw[0] as Record<string, unknown> : raw as Record<string, unknown>;
    if (fundRow?.scheme_name && p.primary_amfi_code) {
      replacementByCategory.set(p.category as string, {
        fundName: fundRow.scheme_name as string,
        amfiCode: p.primary_amfi_code as string,
      });
    }
  }

  // ── 4. Shape holdings ──────────────────────────────────────
  const shaped: ReportHolding[] = (holdings ?? []).map((h) => {
    const entRaw = (h as Record<string, unknown>).entity;
    const entRow = Array.isArray(entRaw) ? entRaw[0] as Record<string, unknown> : entRaw as Record<string, unknown>;
    const entityName = (entRow?.entity_name as string) ?? '—';
    const category = h.category as string | null;
    const verdict = (h.verdict as Verdict) ?? 'SWAP';

    let replacement: { fundName: string; amfiCode: string } | undefined;
    if ((verdict === 'SWAP' || verdict === 'LIQUIDATE') && category) {
      replacement = replacementByCategory.get(category);
    }

    return {
      id: h.id as number,
      entityName,
      fundName: h.fund_name as string,
      category,
      investedInr: Number(h.invested_inr ?? 0),
      currentValueInr: Number(h.current_value_inr ?? 0),
      unrealisedGainInr: Number(h.unrealised_gain_inr ?? 0),
      xirrPct: h.xirr_pct as number | null,
      cagr3y: h.cagr_3y as number | null,
      cagr5y: h.cagr_5y as number | null,
      holdingPeriodMonths: h.holding_period_months as number | null,
      verdict,
      rationale: h.verdict_rationale as string | null,
      preferredReplacementFundName: replacement?.fundName,
      preferredReplacementAmfiCode: replacement?.amfiCode,
    };
  });

  // ── 5. Tier the holdings ───────────────────────────────────
  const sortByCagr3y = (a: ReportHolding, b: ReportHolding) =>
    (b.cagr3y ?? -99) - (a.cagr3y ?? -99);

  const starHoldings = shaped.filter((h) => h.verdict === 'STAR').sort(sortByCagr3y);
  const keepHoldings = shaped.filter((h) => h.verdict === 'KEEP').sort(sortByCagr3y);
  const watchHoldings = shaped.filter((h) => h.verdict === 'WATCH').sort(sortByCagr3y);
  const swapHoldings = shaped.filter((h) => h.verdict === 'SWAP').sort(sortByCagr3y);
  const liquidateHoldings = shaped.filter((h) => h.verdict === 'LIQUIDATE').sort(sortByCagr3y);

  // ── 6. KPIs ────────────────────────────────────────────────
  const currentValueInr = Number(run.current_value_inr ?? shaped.reduce((s, h) => s + h.currentValueInr, 0));
  const totalInvestedInr = Number(run.total_invested_inr ?? shaped.reduce((s, h) => s + h.investedInr, 0));
  const totalGainInr = currentValueInr - totalInvestedInr;

  const uniqueFunds = new Set(shaped.map((h) => h.fundName.trim().toLowerCase())).size;
  const uniqueEntities = new Set(shaped.map((h) => h.entityName.trim().toLowerCase())).size;
  const uniqueAmcs = new Set(
    shaped
      .map((h) => h.fundName.split(/\s+/).slice(0, 2).join(' ').trim().toLowerCase())
      .filter((s) => s.length > 0)
  ).size;

  const tierTotal = (rows: ReportHolding[]) => {
    const investedInr = rows.reduce((s, h) => s + h.investedInr, 0);
    const currentInr = rows.reduce((s, h) => s + h.currentValueInr, 0);
    return {
      count: rows.length,
      investedInr,
      currentInr,
      pctOfPortfolio: totalInvestedInr > 0 ? (investedInr / totalInvestedInr) * 100 : 0,
    };
  };

  const tierTotals = {
    star: tierTotal(starHoldings),
    keep: tierTotal(keepHoldings),
    watch: tierTotal(watchHoldings),
    swap: tierTotal(swapHoldings),
    liquidate: tierTotal(liquidateHoldings),
  };

  // ── 7. Action-sheet totals ─────────────────────────────────
  const totalReallocationInr =
    swapHoldings.reduce((s, h) => s + h.currentValueInr, 0) +
    liquidateHoldings.reduce((s, h) => s + h.currentValueInr, 0);

  // ── 8. Format report date ──────────────────────────────────
  const reportDateIso = new Date().toISOString().slice(0, 10);
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const entitiesCovered = Array.from(
    new Set(shaped.map((h) => h.entityName).filter((n) => n && n !== '—'))
  ).map((s) => s.toUpperCase());

  return {
    diagnosticId: run.id as number,
    documentId: run.document_id as string,
    reportDate,
    reportDateIso,

    familyId: run.family_id as number,
    familyName: run.family_name as string,
    entitiesCovered,

    totalInvestedInr,
    currentValueInr,
    totalGainInr,
    familyXirrPct: run.family_xirr_pct as number | null,
    numHoldings: shaped.length,
    numUniqueFunds: uniqueFunds,
    numEntities: uniqueEntities,
    numAmcs: uniqueAmcs,

    starHoldings,
    keepHoldings,
    watchHoldings,
    swapHoldings,
    liquidateHoldings,

    tierTotals,

    totalReallocationInr,
    swapCount: swapHoldings.length,
    liquidateCount: liquidateHoldings.length,

    rmName,
  };
}

/**
 * Format INR using Indian numbering (lakhs / crores).
 * 100000 → "₹1.00 L"
 * 10000000 → "₹1.00 Cr"
 * 35000 → "₹35,000"
 */
export function formatInrShort(inr: number): string {
  const abs = Math.abs(inr);
  const sign = inr < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/** Format full INR with commas, no decimals. 265987 → "₹2,65,987" */
export function formatInrFull(inr: number): string {
  const sign = inr < 0 ? '-' : '';
  return `${sign}₹${Math.abs(Math.round(inr)).toLocaleString('en-IN')}`;
}

/** Format a percentage. null → "NM" (not meaningful) */
export function formatPct(p: number | null | undefined, places = 2): string {
  if (p === null || p === undefined || Number.isNaN(p)) return 'NM';
  return `${p.toFixed(places)}%`;
}
