-- Migration 017: HR Foundation
-- Custom Trustner HRMS — Phase 1 schema
-- See: ~/.claude/projects/-Users-ram-Documents-Trustner-Tech-Project/memory/project_hrms.md
--
-- This migration creates the foundation for the in-house HRMS:
--   - hr_employees             — full employee master with Section A9 KYC
--   - hr_employee_family       — family member roster (POSP cross-check backbone)
--   - hr_letter_archive        — every generated letter persisted (audit grade)
--   - hr_documents             — uploaded employee documents (Vercel Blob refs)
--   - hr_attestations          — Phase 6 tenure-stage signatures (COI etc.)
--   - hr_posp_crosschecks      — Phase 6 fraud-prevention audit log
--
-- All tables enforce CASCADE on employee delete so an exiting employee's
-- audit trail follows them.

-- ─── Employee master ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('TAS', 'TIB')),

  -- Identity (Brief Section A9)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  parent_spouse_name TEXT,
  dob DATE,
  gender TEXT,
  marital_status TEXT,

  -- KYC (full PAN stored — Aadhaar only last 4 stored at rest per DPDP)
  pan TEXT,
  aadhaar_last4 TEXT,
  passport_or_dl TEXT,

  -- Address (current + permanent separate per Brief Section A9)
  current_address TEXT,
  permanent_address TEXT,
  city TEXT,
  state TEXT,
  pin TEXT,

  -- Bank (account encrypted at app layer before write)
  bank_branch TEXT,
  account_number_encrypted TEXT,
  ifsc TEXT,

  -- Role
  designation TEXT,
  department TEXT,
  grade_band TEXT,
  reporting_manager_id BIGINT REFERENCES hr_employees(id),
  reporting_manager_name TEXT,
  location TEXT,
  date_of_joining DATE,

  -- Lifecycle status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('new', 'active', 'on_notice', 'exited')),
  exit_date DATE,

  -- Current compensation snapshot (history goes to a separate hr_comp_history later)
  basic_monthly NUMERIC(12,2),
  hra_monthly NUMERIC(12,2),
  special_allowance_monthly NUMERIC(12,2),
  pf_monthly NUMERIC(12,2),
  variable_pay_monthly NUMERIC(12,2),
  total_ctc_monthly NUMERIC(12,2) GENERATED ALWAYS AS (
    COALESCE(basic_monthly, 0) + COALESCE(hra_monthly, 0)
    + COALESCE(special_allowance_monthly, 0) + COALESCE(pf_monthly, 0)
    + COALESCE(variable_pay_monthly, 0)
  ) STORED,

  -- Contact
  email TEXT,
  phone TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_emp_entity_idx       ON hr_employees(entity);
CREATE INDEX IF NOT EXISTS hr_emp_status_idx       ON hr_employees(status);
CREATE INDEX IF NOT EXISTS hr_emp_pan_idx          ON hr_employees(pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_emp_phone_idx        ON hr_employees(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_emp_lowername_idx    ON hr_employees(lower(full_name));

-- ─── Family members (POSP cross-check backbone) ───────────────────
CREATE TABLE IF NOT EXISTS hr_employee_family (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  relation TEXT NOT NULL CHECK (relation IN (
    'spouse','father','mother','child','sibling',
    'father_in_law','mother_in_law','other'
  )),
  name TEXT NOT NULL,
  pan TEXT,
  aadhaar_last4 TEXT,
  dob DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_fam_pan_idx     ON hr_employee_family(pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_fam_name_idx    ON hr_employee_family(lower(name));
CREATE INDEX IF NOT EXISTS hr_fam_employee_idx ON hr_employee_family(employee_id);

-- ─── HR letter archive ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_letter_archive (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr_employees(id) ON DELETE SET NULL,
  letter_type TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('TAS', 'TIB')),
  recipient_name TEXT,
  -- Form data at generation time (full snapshot — for re-render & audit)
  data_snapshot JSONB NOT NULL,
  generated_html TEXT,
  pdf_blob_url TEXT,
  docx_blob_url TEXT,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  serial_number TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','signed','superseded'))
);

CREATE INDEX IF NOT EXISTS hr_letter_emp_idx     ON hr_letter_archive(employee_id);
CREATE INDEX IF NOT EXISTS hr_letter_type_idx    ON hr_letter_archive(letter_type);
CREATE INDEX IF NOT EXISTS hr_letter_genat_idx   ON hr_letter_archive(generated_at DESC);

-- ─── Documents (private blob URLs) ────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr_employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_doc_emp_idx ON hr_documents(employee_id);
CREATE INDEX IF NOT EXISTS hr_doc_cat_idx ON hr_documents(category);

-- ─── Tenure-stage attestations (Phase 6) ──────────────────────────
CREATE TABLE IF NOT EXISTS hr_attestations (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  attestation_type TEXT NOT NULL CHECK (attestation_type IN (
    'annual_coi','quarterly_business','midyear_coi','manager_signoff'
  )),
  cycle_label TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','signed','overdue','exception')),
  signed_at TIMESTAMPTZ,
  signed_ip INET,
  data_snapshot JSONB,
  exception_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, attestation_type, cycle_label)
);

CREATE INDEX IF NOT EXISTS hr_attest_cycle_idx ON hr_attestations(cycle_label);
CREATE INDEX IF NOT EXISTS hr_attest_status_idx ON hr_attestations(status);

-- ─── POSP cross-check audit (Phase 6, the fraud-prevention crown jewel) ──
-- Every POSP onboarding attempt is logged with whatever match was found
-- against the employee+family roster. Status remains 'flagged' until a
-- human compliance reviewer either approves (with exception reason) or
-- rejects the POSP creation. This is the control that would have caught
-- the Zakir / Gourab / Sukanta cases.
CREATE TABLE IF NOT EXISTS hr_posp_crosschecks (
  id BIGSERIAL PRIMARY KEY,
  posp_candidate_pan TEXT,
  posp_candidate_name TEXT,
  posp_candidate_mobile TEXT,
  posp_candidate_address TEXT,
  matched_employee_id BIGINT REFERENCES hr_employees(id) ON DELETE SET NULL,
  matched_family_id BIGINT REFERENCES hr_employee_family(id) ON DELETE SET NULL,
  match_type TEXT NOT NULL CHECK (match_type IN (
    'pan_exact','name_fuzzy','mobile_exact','address_fuzzy','no_match'
  )),
  match_score NUMERIC(5,2),
  status TEXT DEFAULT 'flagged'
    CHECK (status IN ('flagged','approved_exception','rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_posp_status_idx ON hr_posp_crosschecks(status);
CREATE INDEX IF NOT EXISTS hr_posp_pan_idx    ON hr_posp_crosschecks(posp_candidate_pan);

-- ─── updated_at auto-touch trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION hr_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hr_emp_touch ON hr_employees;
CREATE TRIGGER hr_emp_touch BEFORE UPDATE ON hr_employees
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();
