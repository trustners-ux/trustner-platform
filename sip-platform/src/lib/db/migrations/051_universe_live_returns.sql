-- 051 — Universe live short-window returns (Path B, Jun 2026)  ⚠️ REVERTED / DORMANT
-- These columns were applied but are NO LONGER USED. Self-computing the short
-- windows could not reproduce ngen's numbers (ngen anchors 3M/6M to month-ends
-- but 1M/1Y to calendar dates — no uniform rule matches), so the overlay was
-- removed and the cron deleted. Returns come from the NGEN snapshot instead.
-- The columns are left in place (harmless, all NULL); drop them if desired.
--

-- Decouples the SHORT return windows (1D/5D/1M/3M/6M/1Y) on /funds/universe from
-- the manually-imported NGEN research-stats snapshot. A daily cron
-- (/api/cron/universe-live-returns) recomputes these from live MFAPI NAV history
-- and writes them here; the universe route prefers them (COALESCE) and falls back
-- to the NGEN snapshot when a live value isn't available. Longer windows (2Y+) and
-- risk metrics still come from NGEN.
--
-- Stored as DECIMAL fractions (e.g. 0.136359 = 13.64%), matching pd_fund_research_stats.
-- Safe additive change — adding NULL columns; nothing reads them until the cron runs.

ALTER TABLE pd_fund_master
  ADD COLUMN IF NOT EXISTS live_ret_1d   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_5d   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_1m   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_3m   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_6m   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_1y   NUMERIC,
  ADD COLUMN IF NOT EXISTS live_ret_asof DATE;
