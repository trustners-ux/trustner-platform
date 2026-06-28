/**
 * SIF editorial layer — the Trustner Research Desk's qualitative view per fund:
 * the Trustner Fund Score (TFS) and Verdict (★ Buy / Accumulate / Hold / Monitor),
 * plus the fund's identity (name, AMC, category, inception) and a seed of the
 * Value-Research figures (m1/m3/AUM/risk/TER/face) used as a graceful fallback.
 *
 * Live NAV / 1D / 5D / SI / 1M / 3M come from the merasif engine at runtime
 * (see sif-data.ts → getSifUniverseRich); these seeds only render if that engine
 * is briefly unreachable, so the page never shows a blank table.
 *
 * Source of record: the Mera SIF universe (sif-nav-data.json + the
 * fund-universe editorial table). Keep in sync when the desk re-rates a fund.
 * TFS/AUM/risk/TER seeds as of 2026-06-13 (Value Research SIF screener).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886 (MF & SIF Distributor)
 */

export type SifCat = 'hybrid' | 'equity' | 'ex100' | 'aaa' | 'sector';
export type SifVerdict = '★ Buy' | '★ Buy (sat.)' | 'Accumulate' | 'Hold' | 'Monitor';

export interface SifEditorial {
  /** Stable fund id — the key shared with the merasif engine payload. */
  id: string;
  name: string;
  amc: string;
  cat: SifCat;
  incept: string; // ISO yyyy-mm-dd (inception / NFO allotment)
  tfs: number | null; // Trustner Fund Score 0–100 (null until rated)
  verdict: SifVerdict;
  /** NFO face value (₹10, or ₹1,000 for Diviniti & Sapphire) — for SI = nav/face−1. */
  face: number;
  /** Value-Research seed figures (fallback only). */
  seed: { m1: number | null; m3: number | null; aum: number | null; risk: number | null; ter: number | null };
}

export const SIF_CAT_LABEL: Record<SifCat, string> = {
  hybrid: 'Hybrid Long-Short',
  equity: 'Equity Long-Short',
  ex100: 'Equity Ex-Top 100 LS',
  aaa: 'Active Asset Allocator',
  sector: 'Sector Rotation LS',
};

export const SIF_CAT_ORDER: SifCat[] = ['hybrid', 'equity', 'ex100', 'aaa', 'sector'];

/** Value-Research seed "as of" date (returns/AUM/risk/TER). */
export const SIF_VR_AS_OF = '2026-06-13';

export const SIF_EDITORIAL: SifEditorial[] = [
  { id: 'isif-hybrid', name: 'iSIF Hybrid Long-Short', amc: 'ICICI Prudential MF', cat: 'hybrid', incept: '2026-02-04', tfs: 78, verdict: '★ Buy', face: 10, seed: { m1: 1.55, m3: 4.08, aum: 844, risk: 5, ter: 2.64 } },
  { id: 'altiva-hybrid', name: 'Altiva Hybrid Long-Short', amc: 'Edelweiss MF', cat: 'hybrid', incept: '2025-10-22', tfs: 76, verdict: 'Accumulate', face: 10, seed: { m1: 1.52, m3: 4.01, aum: 4466, risk: 1, ter: 2.18 } },
  { id: 'magnum-hybrid', name: 'Magnum Hybrid Long-Short', amc: 'SBI MF', cat: 'hybrid', incept: '2025-10-20', tfs: 75, verdict: 'Accumulate', face: 10, seed: { m1: 0.9, m3: 2.09, aum: 3462, risk: 1, ter: 2.06 } },
  { id: 'isif-equity-ex-top-100', name: 'iSIF Equity Ex-Top 100 LS', amc: 'ICICI Prudential MF', cat: 'ex100', incept: '2026-02-04', tfs: 74, verdict: '★ Buy (sat.)', face: 10, seed: { m1: 0.82, m3: 4.89, aum: 1707, risk: 5, ter: 2.86 } },
  { id: 'titanium-hybrid', name: 'Titanium Hybrid Long-Short', amc: 'Tata MF', cat: 'hybrid', incept: '2025-12-11', tfs: 70, verdict: 'Accumulate', face: 10, seed: { m1: 1.08, m3: 2.13, aum: 483, risk: 5, ter: 2.53 } },
  { id: 'dynasif-equity', name: 'DynaSIF Equity Long-Short', amc: '360 ONE Asset', cat: 'equity', incept: '2026-02-25', tfs: 70, verdict: 'Accumulate', face: 10, seed: { m1: 0.48, m3: 3.18, aum: 277, risk: 5, ter: 3.68 } },
  { id: 'apex-hybrid', name: 'Apex Hybrid Long-Short', amc: 'Aditya Birla SL MF', cat: 'hybrid', incept: '2026-03-25', tfs: 68, verdict: 'Accumulate', face: 10, seed: { m1: 1.1, m3: null, aum: 76, risk: 2, ter: 4.15 } },
  { id: 'arudha-hybrid', name: 'Arudha Hybrid Long-Short', amc: 'Bandhan MF', cat: 'hybrid', incept: '2026-01-28', tfs: 66, verdict: 'Accumulate', face: 10, seed: { m1: 0.75, m3: 1.43, aum: 130, risk: 1, ter: 0.73 } },
  { id: 'dynasif-aaa', name: 'DynaSIF Active Asset Allocator', amc: '360 ONE Asset', cat: 'aaa', incept: '2026-03-25', tfs: 65, verdict: 'Accumulate', face: 10, seed: { m1: -0.35, m3: null, aum: 195, risk: 3, ter: 2.67 } },
  { id: 'qsif-hybrid', name: 'qSIF Hybrid Long-Short', amc: 'Quant MF', cat: 'hybrid', incept: '2025-10-15', tfs: 64, verdict: 'Hold', face: 10, seed: { m1: 0.24, m3: 5.74, aum: 158, risk: 3, ter: 2.86 } },
  { id: 'qsif-equity', name: 'qSIF Equity Long-Short', amc: 'Quant MF', cat: 'equity', incept: '2025-10-07', tfs: 62, verdict: 'Hold', face: 10, seed: { m1: 3.07, m3: 10.37, aum: 484, risk: 4, ter: 2.99 } },
  { id: 'diviniti', name: 'Diviniti Equity Long-Short', amc: 'ITI MF', cat: 'equity', incept: '2025-12-01', tfs: 57, verdict: 'Hold', face: 1000, seed: { m1: 0.06, m3: -3.98, aum: 402, risk: 3, ter: 3.34 } },
  { id: 'qsif-ex-top-100', name: 'qSIF Equity Ex-Top 100', amc: 'Quant MF', cat: 'ex100', incept: '2025-11-12', tfs: 63, verdict: 'Hold', face: 10, seed: { m1: 1.32, m3: 11.52, aum: 233, risk: 4, ter: 2.68 } },
  { id: 'qsif-aaa', name: 'qSIF Active Asset Allocator', amc: 'Quant MF', cat: 'aaa', incept: '2026-04-21', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: 2.02, m3: null, aum: 64, risk: 3, ter: 3.19 } },
  { id: 'titanium-equity', name: 'Titanium Equity Long-Short', amc: 'Tata MF', cat: 'equity', incept: '2026-05-14', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 5, ter: 4.09 } },
  { id: 'arudha-equity', name: 'Arudha Equity Long-Short', amc: 'Bandhan MF', cat: 'equity', incept: '2026-03-24', tfs: 61, verdict: 'Hold', face: 10, seed: { m1: 0.17, m3: null, aum: 81, risk: 5, ter: 2.43 } },
  { id: 'sapphire', name: 'Sapphire Equity Long-Short', amc: 'Franklin Templeton', cat: 'equity', incept: '2026-04-29', tfs: null, verdict: 'Monitor', face: 1000, seed: { m1: 1.08, m3: null, aum: null, risk: 5, ter: 3.9 } },
  { id: 'wsif-equity', name: 'WSIF Equity Long-Short', amc: 'The Wealth Company MF', cat: 'equity', incept: '2026-05-06', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: 1.45, m3: null, aum: null, risk: 5, ter: 6.67 } },
  { id: 'wsif-ex-top-100', name: 'WSIF Equity Ex-Top 100', amc: 'The Wealth Company MF', cat: 'ex100', incept: '2026-05-06', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: 1.92, m3: null, aum: null, risk: 5, ter: 6.64 } },
  { id: 'arthaya-equity', name: 'Arthaya Equity Long-Short', amc: 'Union MF', cat: 'equity', incept: '2026-05-25', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: 117, risk: 1, ter: 3.14 } },
  { id: 'altiva-ex-top-100', name: 'Altiva Equity Ex-Top 100 LS', amc: 'Edelweiss MF', cat: 'ex100', incept: '2026-06-08', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 5, ter: null } },
  { id: 'isif-equity', name: 'iSIF Equity Long-Short', amc: 'ICICI Prudential MF', cat: 'equity', incept: '2026-06-05', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 5, ter: 2.46 } },
  { id: 'isif-aaa', name: 'iSIF Active Asset Allocator', amc: 'ICICI Prudential MF', cat: 'aaa', incept: '2026-06-05', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 5, ter: 2.17 } },
  { id: 'platinum-hybrid', name: 'Platinum Hybrid Long-Short', amc: 'Mirae Asset MF', cat: 'hybrid', incept: '2026-06-09', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 2, ter: 1.53 } },
  { id: 'qsif-sector-rotation', name: 'qSIF Sector Rotation LS', amc: 'Quant MF', cat: 'sector', incept: '2026-05-15', tfs: null, verdict: 'Monitor', face: 10, seed: { m1: null, m3: null, aum: null, risk: 5, ter: 3.46 } },
];
