-- 052 — Self-computed fund metrics (world-class auto-engine, Jun 2026)
-- merasip.com computes its OWN SEBI-standard returns + risk from authoritative
-- NAV (via MFAPI, which mirrors AMFI), keyed by amfi_code. A daily cron
-- (/api/cron/universe-metrics) recomputes these; the /funds/universe route
-- serves them as the PRIMARY numbers, keeping the NGEN snapshot only as an
-- optional comparison. Decimals (0.1364 = 13.64%); NULL where history is short.
-- See memory project-funds-auto-engine. Additive + safe.

CREATE TABLE IF NOT EXISTS pd_fund_metrics (
  amfi_code      TEXT PRIMARY KEY,
  asof_date      DATE,
  -- trailing returns (absolute ≤1y, CAGR >1y)
  ret_1d         NUMERIC,
  ret_1w         NUMERIC,
  ret_1m         NUMERIC,
  ret_3m         NUMERIC,
  ret_6m         NUMERIC,
  ret_1y         NUMERIC,
  ret_3y         NUMERIC,
  ret_5y         NUMERIC,
  ret_si         NUMERIC,
  -- risk metrics (trailing window, annualised)
  volatility     NUMERIC,
  sharpe         NUMERIC,
  sortino        NUMERIC,
  max_drawdown   NUMERIC,
  -- data-quality / identity gate
  identity_ok    BOOLEAN DEFAULT TRUE,
  identity_note  TEXT,
  nav_points     INTEGER,
  updated_at     TIMESTAMPTZ DEFAULT now()
);
