-- ════════════════════════════════════════════════════════════════════════
-- Migration 042 — SOFT-DELETE + AUDIT HARDENING (deletion protection)
-- ════════════════════════════════════════════════════════════════════════
-- Today a delete is a HARD, unrecoverable cascade (the run + holdings + SIPs +
-- comments + narratives + share-links + its workflow_events all vanish). Ram's
-- concern: "someone may delete the work knowingly or unknowingly." This makes
-- deletion RECOVERABLE and AUDITED:
--   1) is_deleted flag (default false) + who/when/why columns. The DELETE route
--      now flips the flag instead of removing rows — nothing is lost.
--   2) dashboard/list queries filter is_deleted = false (hidden from queues).
--   3) the deletion (and re-score / override / share) is written to the
--      immutable pd_workflow_events log via the shared audit helper.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_diagnostic_runs
  ADD COLUMN IF NOT EXISTS is_deleted             BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_employee_id INT REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS deletion_reason        TEXT;

CREATE INDEX IF NOT EXISTS idx_pd_runs_active ON pd_diagnostic_runs(id) WHERE is_deleted = false;

-- pd_workflow_events.action is VARCHAR(50) so the new action strings
-- (RE_SCORE / VERDICT_OVERRIDE / SHARE / DELETE / RESTORE / RISK_PROFILE_EDIT)
-- need no enum change — they're free-text. No schema change required there.
