-- ─────────────────────────────────────────────────────────────────────
-- Migration 025 — hr_onboarding.employment_type column.
-- Authored May 31 2026 for the 2 Jun 2026 joiner.
--
-- Tags incoming candidates as permanent / fixed_term / intern / consultant
-- so the downstream employee record (created when the candidate completes
-- the tokenized upload) inherits the correct employment_type tag — which
-- drives leave defaults, gratuity eligibility, notice-period rules, and
-- F&F engine branching (see fnf-engine.ts computeGratuity()).
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE hr_onboarding
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'permanent'
    CHECK (employment_type IN ('permanent','fixed_term','intern','consultant'));

-- Backfill existing pending invites as permanent (current behaviour pre-fix)
UPDATE hr_onboarding SET employment_type = 'permanent' WHERE employment_type IS NULL;
