-- ════════════════════════════════════════════════════════════════════════
-- Migration 036 — PD Verdict Engine v2: INDIA TAX-AWARE EXIT layer
-- ════════════════════════════════════════════════════════════════════════
-- Persists the estimated tax impact of acting on the engine's SWAP/EXIT/REDUCE
-- recommendations (LTCG/STCG + ₹1.25L exemption + ELSS lock-in flags), so the
-- review UI and client report can present every exit net-of-tax.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS v2_tax_summary  JSONB;   -- {lines[], totals, headline, hasLockedElss, hasDebtSlab}
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS v2_tax_est_inr  BIGINT;  -- estimated total tax on recommended exits (rupees)

COMMENT ON COLUMN pd_diagnostic_runs.v2_tax_summary IS 'India tax-aware exit estimate (FY2025-26 rules) for the recommended sells. Computed by tax-engine.ts. Informational only — confirm with CA.';
