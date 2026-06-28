-- ─────────────────────────────────────────────────────────────────────────────
-- 032 — Widen NUMERIC columns in pd_fund_research_stats
--
-- Bug found Jun 4 2026: NGEN XLSX upload failed with "numeric field overflow"
-- at batch 1000. Root cause: return columns were declared NUMERIC(8,6) which
-- caps the value at 99.999999. Realistic fund returns regularly exceed that:
--   - Since-launch returns for old funds (e.g., 1996 NFOs): 1,000% – 8,000%+
--   - Sector funds in a single rally year: 100% – 300%
--   - Inverse / leveraged products: occasional huge swings
--
-- Fix: widen all percentage / return / risk columns to NUMERIC(14,6) which
-- accommodates up to 99,999,999.999999 — comfortably above any realistic
-- value while preserving 6 decimal-place precision.
--
-- Idempotent: each ALTER COLUMN runs unconditionally; widening a NUMERIC is
-- a no-op metadata change at the row level. Existing data is preserved bit-
-- for-bit.
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns across time horizons
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_1d            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_5d            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_mtd           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_ytd           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_1m            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_3m            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_6m            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_1y            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_2y            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_3y            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_5y            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_7y            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_10y           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_15y           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN returns_since_launch  TYPE NUMERIC(14, 6);

-- Calendar-year returns
ALTER TABLE pd_fund_research_stats ALTER COLUMN annual_2025           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN annual_2024           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN annual_2023           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN annual_2022           TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN annual_2021           TYPE NUMERIC(14, 6);

-- Risk metrics — also % based, can exceed 100
ALTER TABLE pd_fund_research_stats ALTER COLUMN volatility            TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN hist_var              TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN imp_var               TYPE NUMERIC(14, 6);

-- Sharpe / Sortino can be large negative or positive
ALTER TABLE pd_fund_research_stats ALTER COLUMN sharpe                TYPE NUMERIC(14, 4);
ALTER TABLE pd_fund_research_stats ALTER COLUMN sortino               TYPE NUMERIC(14, 4);

-- Debt YTM / turnover — rare edge cases
ALTER TABLE pd_fund_research_stats ALTER COLUMN ytm                   TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN net_ytm               TYPE NUMERIC(14, 6);
ALTER TABLE pd_fund_research_stats ALTER COLUMN turnover_cost         TYPE NUMERIC(14, 6);

-- TER — already a small % but widen for safety
ALTER TABLE pd_fund_research_stats ALTER COLUMN ter                   TYPE NUMERIC(8, 4);

-- AUM — some AMCs may have very large mandates
ALTER TABLE pd_fund_research_stats ALTER COLUMN aum_inr_cr            TYPE NUMERIC(16, 4);

-- Proprietary feed scores (internal-only, NEVER expose vendor brand)
ALTER TABLE pd_fund_research_stats ALTER COLUMN feed_fund_score       TYPE NUMERIC(14, 4);
ALTER TABLE pd_fund_research_stats ALTER COLUMN feed_risk_score       TYPE NUMERIC(14, 4);
ALTER TABLE pd_fund_research_stats ALTER COLUMN feed_return_score     TYPE NUMERIC(14, 4);

-- Comment for future devs
COMMENT ON TABLE pd_fund_research_stats IS 'Snapshot-keyed per-fund research stats. Migration 032 widened NUMERIC(8,6) return columns to NUMERIC(14,6) to handle since-launch returns >100% (e.g., 1996 NFOs with cumulative 4000%+ returns).';
