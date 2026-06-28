-- ─────────────────────────────────────────────────────────────────────
-- Migration 026 — Probation lifecycle for hr_employees.
-- Authored May 31 2026 for the 2 Jun 2026 joiner.
--
-- Adds a lifecycle stage to every employee that's SEPARATE from
-- employment_type. Employment type is the CONTRACT shape (permanent /
-- fixed_term / intern / consultant); employment_status is the STAGE
-- (probation / confirmed / notice / exited).
--
-- Default new permanent hires start on PROBATION for 6 months. Admin
-- (or any user with can_manage_probation perm) can:
--   - extend probation by N months
--   - confirm early (probation → confirmed)
--   - mark not-confirmed (probation → exited, triggers Phase 8 separation)
--
-- Probation gating downstream:
--   - Leave entitlement (EL/SL/CL) is blocked while status = 'probation'
--   - Gratuity tenure clock STILL ticks from DOJ (per Payment of Gratuity
--     Act — probation counts as continuous service)
--   - Salary / payroll runs normally during probation
--   - Performance Mgmt cycle excludes probation employees until confirmed
--
-- Interns + Consultants don't have a probation concept — they start
-- 'confirmed' with employment_type='intern'/'consultant'. Their tenure
-- limits are governed by their contract end-date instead.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'probation'
    CHECK (employment_status IN ('probation','confirmed','notice','exited')),
  ADD COLUMN IF NOT EXISTS probation_months INT DEFAULT 6,
  ADD COLUMN IF NOT EXISTS probation_end_date DATE,
  ADD COLUMN IF NOT EXISTS probation_extended_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmation_date DATE,
  ADD COLUMN IF NOT EXISTS confirmation_by TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

-- Existing employees (Ram + Sangeeta) are already past probation —
-- mark them confirmed using their DOJ as the confirmation date.
UPDATE hr_employees
  SET employment_status = 'confirmed',
      confirmation_date = date_of_joining,
      probation_end_date = date_of_joining + INTERVAL '6 months'
  WHERE id IN (1, 2);

-- Interns + consultants never have probation — set them confirmed.
UPDATE hr_employees
  SET employment_status = 'confirmed',
      confirmation_date = COALESCE(confirmation_date, date_of_joining)
  WHERE employment_type IN ('intern','consultant')
    AND employment_status = 'probation';

-- Backfill probation_end_date for any rows where it's NULL but DOJ + months
-- can be computed.
UPDATE hr_employees
  SET probation_end_date = date_of_joining + (probation_months || ' months')::interval
  WHERE probation_end_date IS NULL
    AND date_of_joining IS NOT NULL
    AND probation_months IS NOT NULL;

-- Index for the probation-expiry cron query.
CREATE INDEX IF NOT EXISTS hr_emp_probation_end_idx
  ON hr_employees(probation_end_date)
  WHERE employment_status = 'probation';

-- ─── Mirror probation fields onto hr_onboarding so HR can set the
-- probation period during the initial intake form. The approve-flow
-- copies these into hr_employees when creating the employee record.
ALTER TABLE hr_onboarding
  ADD COLUMN IF NOT EXISTS probation_months INT DEFAULT 6;

-- ─── Permission flag for probation actions (extend / confirm).
-- Defaults to false; super-admin gets it automatically via allOn() in
-- src/lib/hr/permissions.ts.
ALTER TABLE hr_user_permissions
  ADD COLUMN IF NOT EXISTS can_manage_probation BOOLEAN NOT NULL DEFAULT false;

-- ─── End of migration 026 ────────────────────────────────────────────
