-- ════════════════════════════════════════════════════════════════════════
-- Migration 034 — PD Verdict Engine v2: activate the REQUIRED-RETURN leg
-- ════════════════════════════════════════════════════════════════════════
-- The v2 risk model is a 3-dimension engine (Capacity × Tolerance × Required),
-- but the third leg was dormant in production because the intake captured no
-- goal/target-corpus, so `computeRequiredReturn` always returned null.
--
-- These two columns let the wizard capture an (optional) goal target corpus and
-- horizon, so the engine can compute the required CAGR and let it bind the
-- equity band when goals are already funded with less risk.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_target_corpus_inr  BIGINT;    -- optional goal target corpus (rupees)
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_years_to_goal      INTEGER;   -- optional years to that goal (defaults to longest horizon when blank)

COMMENT ON COLUMN pd_diagnostic_runs.rp_target_corpus_inr IS 'Optional goal target corpus (rupees). Drives the REQUIRED-RETURN leg of the v2 risk model; when goals are met with less risk the engine trims the equity band toward need.';
COMMENT ON COLUMN pd_diagnostic_runs.rp_years_to_goal IS 'Optional years to the target corpus. When blank, the engine falls back to rp_longest_horizon_years.';
