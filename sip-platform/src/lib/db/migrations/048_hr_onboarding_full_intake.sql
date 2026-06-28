-- Migration 048: Full new-joiner intake (Apps Script portal parity)
-- ---------------------------------------------------------------------------
-- Brings the public /onboarding/<token> flow up to the data set the standalone
-- Google Apps Script "Trustner Joiner Portal" collected, so HR stops keying it
-- in by hand. The candidate self-fills everything on the tokenised link; on HR
-- approval it is copied into hr_employees (most of these target columns were
-- being left NULL before this migration).
--
-- Scope: personal details, full KYC, current + permanent address (granular),
-- bank details, education history, employment history (+ fresher), two
-- emergency contacts, and NDA / Declaration / COI consents.
--
-- All ADDs are idempotent (ADD COLUMN IF NOT EXISTS) so this is safe to re-run.

-- ─── hr_onboarding: candidate-supplied intake fields ─────────────────────────
ALTER TABLE hr_onboarding
  -- Personal
  ADD COLUMN IF NOT EXISTS father_spouse_name   TEXT,
  ADD COLUMN IF NOT EXISTS dob                  DATE,
  ADD COLUMN IF NOT EXISTS gender               TEXT,
  ADD COLUMN IF NOT EXISTS blood_group          TEXT,
  ADD COLUMN IF NOT EXISTS marital_status       TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp             TEXT,
  ADD COLUMN IF NOT EXISTS reporting_manager    TEXT,

  -- Identity / KYC (full PAN + full Aadhaar captured at intake; on approval only
  -- the last 4 of Aadhaar are persisted to hr_employees per the DPDP note in 017)
  ADD COLUMN IF NOT EXISTS pan                  TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar              TEXT,

  -- Current address (granular)
  ADD COLUMN IF NOT EXISTS curr_address_line1   TEXT,
  ADD COLUMN IF NOT EXISTS curr_address_line2   TEXT,
  ADD COLUMN IF NOT EXISTS curr_city            TEXT,
  ADD COLUMN IF NOT EXISTS curr_state           TEXT,
  ADD COLUMN IF NOT EXISTS curr_pin             TEXT,

  -- Permanent address (granular) + "same as current" flag
  ADD COLUMN IF NOT EXISTS perm_same            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS perm_address_line1   TEXT,
  ADD COLUMN IF NOT EXISTS perm_address_line2   TEXT,
  ADD COLUMN IF NOT EXISTS perm_city            TEXT,
  ADD COLUMN IF NOT EXISTS perm_state           TEXT,
  ADD COLUMN IF NOT EXISTS perm_pin             TEXT,

  -- Bank
  ADD COLUMN IF NOT EXISTS bank_name            TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch          TEXT,
  ADD COLUMN IF NOT EXISTS account_number       TEXT,
  ADD COLUMN IF NOT EXISTS ifsc                 TEXT,
  ADD COLUMN IF NOT EXISTS account_type         TEXT,

  -- Education history — JSONB array of
  --   { qualification, institution, board, year, score }
  ADD COLUMN IF NOT EXISTS education            JSONB DEFAULT '[]'::jsonb,

  -- Employment history — JSONB array of
  --   { company, designation, fromDate, toDate, lastCTC, reason }
  ADD COLUMN IF NOT EXISTS is_fresher           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS employment           JSONB DEFAULT '[]'::jsonb,

  -- Emergency contacts — JSONB array of
  --   { name, relationship, mobile, email }   (UI captures up to 2)
  ADD COLUMN IF NOT EXISTS emergency_contacts   JSONB DEFAULT '[]'::jsonb,

  -- Consents (audit-grade — timestamp set when the candidate ticks the box)
  ADD COLUMN IF NOT EXISTS nda_agreed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declaration_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coi_agreed_at         TIMESTAMPTZ;

-- ─── hr_employees: columns the richer intake needs a home for ────────────────
-- (Most intake targets — parent_spouse_name, dob, gender, marital_status, pan,
--  aadhaar_last4, addresses, bank_branch/ifsc — already exist from 017. These
--  are the genuinely-new ones.)
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS blood_group          TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp             TEXT,
  ADD COLUMN IF NOT EXISTS bank_name            TEXT,
  ADD COLUMN IF NOT EXISTS account_type         TEXT,
  ADD COLUMN IF NOT EXISTS education            JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS employment           JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS emergency_contacts   JSONB DEFAULT '[]'::jsonb;
