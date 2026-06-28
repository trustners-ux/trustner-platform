-- ════════════════════════════════════════════════════════════════════════
-- Migration 040 — DEMO / TEST DATA HYGIENE (pre-team-handover)
-- ════════════════════════════════════════════════════════════════════════
-- The team must not see fabricated/test data in their live PD queues. This:
--  1) adds an is_demo flag so smoke-test runs can be hidden from the dashboard
--     (non-destructive — preserves the audit trail; the dashboard query filters
--     is_demo = false);
--  2) flags run #7 "Mohit Gulati Family (SMOKE TEST)" (PUBLISHED smoke artifact)
--     as is_demo;
--  3) RESETS run #9 (AASHISH JALAN — a REAL family that carried a FABRICATED
--     "capital-first retiree" risk profile used only to exercise the engine, per
--     project memory). We null the fabricated rp_* intake, set
--     risk_profile_captured = false, and move it back to DRAFT so the team must
--     re-capture the family's REAL profile (a human conversation) and re-score
--     before it can be reviewed/published. The JALAN family/holdings are real and
--     are preserved.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- 1) hide the smoke-test run from team queues
UPDATE pd_diagnostic_runs SET is_demo = true WHERE id = 7;

-- 2) reset run #9's fabricated risk profile → honest "not captured" DRAFT
UPDATE pd_diagnostic_runs SET
  rp_primary_age              = NULL,
  rp_life_stage              = NULL,
  rp_stated_priority         = NULL,
  rp_living_depends_on_this  = NULL,
  rp_past_drawdown_behaviour = NULL,
  rp_monthly_income_inr      = NULL,
  rp_monthly_expense_inr     = NULL,
  rp_net_worth_buffer_inr    = NULL,
  rp_longest_horizon_years   = NULL,
  rp_target_corpus_inr       = NULL,
  rp_years_to_goal           = NULL,
  rp_questionnaire_score     = NULL,
  risk_profile_captured      = false,
  status                     = 'DRAFT'
WHERE id = 9;
