-- ═══════════════════════════════════════════════════════════════
-- Migration 016 — pd_fund_research_stats
-- ═══════════════════════════════════════════════════════════════
-- Snapshot-keyed table for rich per-fund research stats (returns
-- across 16 time horizons, risk metrics, allocation breakdown,
-- valuation, debt-specific fields).
--
-- pd_fund_master continues to hold identity + daily NAV + AMFI
-- cron-computed CAGRs. This table is the periodic snapshot of
-- richer research data sourced from external feeds, refreshed
-- on-demand by the admin via /admin/funds/import-research-stats.
--
-- The composite PK (amfi_code, snapshot_date) keeps historical
-- snapshots so we can chart how a fund's metrics evolved.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pd_fund_research_stats (
  -- Identity (FK to pd_fund_master.amfi_code)
  amfi_code TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'amfi' | 'mfapi' | future feeds

  -- Origin metadata
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_category TEXT,                  -- granular category label from source (e.g. "Equity Index: Smart Beta: Momentum")

  -- Basic facts
  launch_date DATE,
  current_nav NUMERIC(12, 4),
  nav_date DATE,
  aum_inr_cr NUMERIC(12, 4),
  riskometer TEXT,                          -- 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderately High' | 'High' | 'Very High'

  -- Returns (%, decimal — i.e. 0.085 = 8.5%)
  returns_1d NUMERIC(8, 6),
  returns_5d NUMERIC(8, 6),
  returns_mtd NUMERIC(8, 6),
  returns_ytd NUMERIC(8, 6),
  returns_1m NUMERIC(8, 6),
  returns_3m NUMERIC(8, 6),
  returns_6m NUMERIC(8, 6),
  returns_1y NUMERIC(8, 6),
  returns_2y NUMERIC(8, 6),
  returns_3y NUMERIC(8, 6),
  returns_5y NUMERIC(8, 6),
  returns_7y NUMERIC(8, 6),
  returns_10y NUMERIC(8, 6),
  returns_15y NUMERIC(8, 6),
  returns_since_launch NUMERIC(8, 6),

  -- Calendar-year returns
  annual_2025 NUMERIC(8, 6),
  annual_2024 NUMERIC(8, 6),
  annual_2023 NUMERIC(8, 6),
  annual_2022 NUMERIC(8, 6),
  annual_2021 NUMERIC(8, 6),

  -- Risk metrics
  volatility NUMERIC(8, 6),
  sharpe NUMERIC(8, 4),
  sortino NUMERIC(8, 4),
  hist_var NUMERIC(8, 6),
  imp_var NUMERIC(8, 6),

  -- Cost
  ter NUMERIC(6, 4),                        -- expense ratio %

  -- Equity allocation
  equity_pct NUMERIC(6, 3),
  debt_pct NUMERIC(6, 3),
  cash_pct NUMERIC(6, 3),
  net_equity_pct NUMERIC(6, 3),
  large_cap_pct NUMERIC(6, 3),
  mid_cap_pct NUMERIC(6, 3),
  small_cap_pct NUMERIC(6, 3),

  -- Holdings concentration
  holdings_count INT,
  top_3_pct NUMERIC(6, 3),
  top_5_pct NUMERIC(6, 3),
  top_10_pct NUMERIC(6, 3),
  top_20_pct NUMERIC(6, 3),

  -- Valuation (equity)
  pe NUMERIC(8, 2),
  pb NUMERIC(8, 2),
  mkt_cap_cr NUMERIC(14, 4),

  -- Debt-specific
  ytm NUMERIC(8, 6),
  net_ytm NUMERIC(8, 6),
  avg_maturity NUMERIC(8, 4),               -- years
  duration NUMERIC(8, 4),                   -- years
  turnover_cost NUMERIC(8, 6),
  aaa_pct NUMERIC(6, 3),
  aa_pct NUMERIC(6, 3),
  a_pct NUMERIC(6, 3),
  sov_pct NUMERIC(6, 3),

  -- Proprietary feed scores (NOT exposed publicly; internal-only)
  feed_fund_score NUMERIC(8, 4),
  feed_risk_score NUMERIC(8, 4),
  feed_return_score NUMERIC(8, 4),

  PRIMARY KEY (amfi_code, snapshot_date)
);

-- Indexes for the explorer page filters
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_category ON pd_fund_research_stats (external_category, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_snapshot ON pd_fund_research_stats (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_aum ON pd_fund_research_stats (aum_inr_cr DESC) WHERE aum_inr_cr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_returns_1y ON pd_fund_research_stats (returns_1y DESC) WHERE returns_1y IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_returns_3y ON pd_fund_research_stats (returns_3y DESC) WHERE returns_3y IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_returns_5y ON pd_fund_research_stats (returns_5y DESC) WHERE returns_5y IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pd_fund_research_stats_sharpe ON pd_fund_research_stats (sharpe DESC) WHERE sharpe IS NOT NULL;

-- Convenience view — latest snapshot only per fund, joined to pd_fund_master
CREATE OR REPLACE VIEW pd_fund_universe_latest AS
SELECT
  m.amfi_code,
  m.scheme_name,
  m.amc_name,
  m.category AS amfi_category,
  m.sub_category AS amfi_sub_category,
  m.current_nav AS live_nav,
  m.last_refreshed_at AS live_nav_at,
  m.cagr_1y AS amfi_cagr_1y,
  m.cagr_3y AS amfi_cagr_3y,
  m.cagr_5y AS amfi_cagr_5y,
  m.trustner_preferred,
  s.*
FROM pd_fund_master m
LEFT JOIN LATERAL (
  SELECT * FROM pd_fund_research_stats
  WHERE amfi_code = m.amfi_code
  ORDER BY snapshot_date DESC
  LIMIT 1
) s ON true;

-- Unmatched-import log (helps debug fuzzy-match failures during import)
CREATE TABLE IF NOT EXISTS pd_fund_research_unmatched (
  id SERIAL PRIMARY KEY,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_scheme_name TEXT NOT NULL,
  source_amc TEXT,
  source_category TEXT,
  source_snapshot_date DATE,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_unmatched_imported_at ON pd_fund_research_unmatched (imported_at DESC);
