-- ════════════════════════════════════════════════════════════════════════
-- Migration 044 — DATA-HEALTH LOG (scheduled engine monitoring)
-- ════════════════════════════════════════════════════════════════════════
-- A nightly cron snapshots the PD engine's data health (research-stats freshness,
-- feed-garbage counts, unmatched-fund log size) so drift is caught proactively
-- instead of surfacing during a live client review. One row per run; metrics in
-- JSONB so the shape can evolve without migrations.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pd_data_health_log (
  id          SERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics     JSONB NOT NULL,
  alerts      TEXT[]   -- non-empty when something needs attention
);
CREATE INDEX IF NOT EXISTS idx_pd_health_captured ON pd_data_health_log(captured_at DESC);
