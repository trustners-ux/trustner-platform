-- ════════════════════════════════════════════════════════════════════════
-- Migration 035 — PD Verdict Engine v2: OVERLAP / CONSOLIDATION layer (Pillar 6)
-- ════════════════════════════════════════════════════════════════════════
-- Persists the same-sub-category duplicate-fund detection + keep-the-better
-- consolidation groups computed by the engine, so the review UI and client
-- report can surface "you hold 3 Flexi Caps — keep the best, consolidate the
-- rest" without recomputation.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS v2_consolidation            JSONB;     -- [{subCategory, keep, consolidate[], totalConsolidatableInr, confidence, rationale}]
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS v2_consolidation_dupes      INTEGER;   -- count of duplicate funds that could be folded away
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS v2_consolidation_value_inr  BIGINT;    -- total rupees that could be simplified

COMMENT ON COLUMN pd_diagnostic_runs.v2_consolidation IS 'Pillar 6 consolidation groups: same-sub-category duplicate holdings with a keep-the-better recommendation. Computed by overlap-engine.ts.';
