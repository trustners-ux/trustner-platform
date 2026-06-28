-- ─────────────────────────────────────────────────────────────────────
-- Migration 023 — Exit & F&F. Authored by Phase 8 build, May 31 2026.
-- Apply via Supabase dashboard SQL editor — apply order matters because
-- hr_separation_checklist references hr_separation.
--
-- Phase 8: Trustner HRMS Exit / Full & Final Settlement module.
--
-- POLICY (Ram-signed-off May 31 2026):
--   • Gratuity: strict 5 yrs continuous service for permanent staff (no
--     4yr+240day lenient rule). Fixed-term contracts: 1 yr pro-rata
--     (Code on Social Security 2020, s.53). Death/permanent-disability:
--     0 yrs minimum. Formula = (basic+da)*15/26*completed_years.
--     Tax-free cap ₹20,00,000 (IT Act s.10(10)(ii)).
--   • Notice shortfall recovery = gross_monthly/30 per shortfall day.
--   • Bonus on F&F: only if explicit clause; default 0.
--   • EL encashable (max 30 day CF), SL/CL not encashable.
--   • POSP handover is a HARD relieving gate.
--   • Settlement window: 45 days from LWD.
-- ─────────────────────────────────────────────────────────────────────

-- ─── (a) Extend hr_employees with contractual notice + retirement + emp type ──
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS notice_period_days_contractual INT DEFAULT 60,
  ADD COLUMN IF NOT EXISTS retirement_age INT DEFAULT 60,
  ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'permanent'
    CHECK (employment_type IN ('permanent','fixed_term','intern','consultant'));

-- ─── (b) hr_separation — the master case row ─────────────────────────
CREATE TABLE IF NOT EXISTS hr_separation (
  id BIGSERIAL PRIMARY KEY,
  case_code TEXT UNIQUE NOT NULL,                         -- e.g. SEP-2026-0001
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,

  -- Type & reason
  separation_type TEXT NOT NULL CHECK (separation_type IN (
    'resignation','termination_with_cause','termination_without_cause',
    'retirement','death','permanent_disability','contract_end',
    'abandonment','mutual_separation'
  )),
  reason_category TEXT,                                   -- enum-ish, free for now
  reason_notes TEXT,

  -- Dates
  intent_date DATE NOT NULL,                              -- date employee gave intent / order issued
  requested_lwd DATE,                                     -- employee-requested last working day
  approved_lwd DATE,                                      -- HR-approved last working day
  lwd DATE,                                               -- final last working day (locked)
  separation_effective_date DATE,                         -- usually = lwd

  -- Notice period tracking (GENERATED shortfall column)
  notice_period_days_contractual INT,                     -- snapshotted from employee row
  notice_period_days_served INT,                          -- updated as case progresses
  notice_period_days_waived INT DEFAULT 0,                -- HR waiver (paid by employer)
  notice_period_days_shortfall INT GENERATED ALWAYS AS (
    GREATEST(
      COALESCE(notice_period_days_contractual,0)
        - COALESCE(notice_period_days_served,0)
        - COALESCE(notice_period_days_waived,0),
      0
    )
  ) STORED,

  -- Case status (drives state machine in src/lib/hr/separation-state.ts)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','manager_review','notice_active','clearance_pending',
    'fnf_pending','fnf_approved','fnf_disbursed','closed',
    'withdrawn','rejected'
  )),

  -- Sign-offs (timestamps)
  initiated_by TEXT NOT NULL,                             -- email/code of initiator
  initiated_at TIMESTAMPTZ DEFAULT now(),
  manager_signoff_by TEXT,
  manager_signoff_at TIMESTAMPTZ,
  hr_signoff_by TEXT,
  hr_signoff_at TIMESTAMPTZ,
  finance_signoff_by TEXT,
  finance_signoff_at TIMESTAMPTZ,
  ceo_signoff_by TEXT,
  ceo_signoff_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,

  -- Manual bonus on F&F (default 0 — only paid if explicit offer-letter clause)
  bonus_clause_present BOOLEAN DEFAULT false,
  bonus_amount NUMERIC(12,2) DEFAULT 0,
  bonus_notes TEXT,

  -- Foreign keys to downstream artefacts
  fnf_id BIGINT,                                          -- set later (FK added after hr_fnf creation)
  exit_interview_id BIGINT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One active separation per employee at a time
CREATE UNIQUE INDEX IF NOT EXISTS hr_sep_active_one_idx
  ON hr_separation(employee_id)
  WHERE status IN ('draft','manager_review','notice_active',
                   'clearance_pending','fnf_pending','fnf_approved');

CREATE INDEX IF NOT EXISTS hr_sep_emp_idx       ON hr_separation(employee_id);
CREATE INDEX IF NOT EXISTS hr_sep_status_idx    ON hr_separation(status);
CREATE INDEX IF NOT EXISTS hr_sep_case_code_idx ON hr_separation(case_code);
CREATE INDEX IF NOT EXISTS hr_sep_created_idx   ON hr_separation(created_at DESC);

-- ─── (c) hr_separation_checklist — exit clearance items ──────────────
CREATE TABLE IF NOT EXISTS hr_separation_checklist (
  id BIGSERIAL PRIMARY KEY,
  separation_id BIGINT NOT NULL REFERENCES hr_separation(id) ON DELETE CASCADE,

  category TEXT NOT NULL CHECK (category IN (
    'assets','it_access','nda','kt','knowledge_base','manager_signoff',
    'finance_clearance','admin_clearance','it_clearance','posp_handover',
    'client_handover','statutory'
  )),
  item_label TEXT NOT NULL,
  item_order INT NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','done','na','blocked'
  )),
  required BOOLEAN NOT NULL DEFAULT true,

  proof_blob_url TEXT,                                    -- e.g. POSP transfer screenshot
  recovery_amount NUMERIC(12,2) DEFAULT 0,                -- e.g. lost laptop charge

  done_by TEXT,
  done_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_sep_chk_sep_idx     ON hr_separation_checklist(separation_id);
CREATE INDEX IF NOT EXISTS hr_sep_chk_status_idx  ON hr_separation_checklist(status);
CREATE INDEX IF NOT EXISTS hr_sep_chk_cat_idx     ON hr_separation_checklist(category);

-- ─── (d) hr_fnf — full settlement snapshot ───────────────────────────
CREATE TABLE IF NOT EXISTS hr_fnf (
  id BIGSERIAL PRIMARY KEY,
  separation_id BIGINT NOT NULL REFERENCES hr_separation(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id),

  -- Dates
  doj DATE,                                               -- snapshot
  lwd DATE NOT NULL,                                      -- snapshot
  fnf_month TEXT,                                         -- 'YYYY-MM' settlement month
  payable_by_date DATE GENERATED ALWAYS AS (lwd + INTERVAL '45 days') STORED,

  -- Days
  paid_days NUMERIC(5,2),
  lop_days NUMERIC(5,2) DEFAULT 0,

  -- Earnings (final partial-month + carryover)
  final_basic NUMERIC(12,2) DEFAULT 0,
  final_hra NUMERIC(12,2) DEFAULT 0,
  final_special NUMERIC(12,2) DEFAULT 0,
  final_variable NUMERIC(12,2) DEFAULT 0,
  bonus_prorate NUMERIC(12,2) DEFAULT 0,                  -- per offer-letter clause only; default 0

  -- Leave encashment
  el_balance_days NUMERIC(5,2) DEFAULT 0,
  el_encash_amount NUMERIC(12,2) DEFAULT 0,

  -- Gratuity (computed by fnf-engine, NOT db trigger)
  gratuity_applicable BOOLEAN DEFAULT false,
  gratuity_years NUMERIC(5,2),                            -- completed years used in formula
  gratuity_amount NUMERIC(12,2) DEFAULT 0,
  gratuity_taxable_excess NUMERIC(12,2) DEFAULT 0,        -- amount > ₹20L cap

  -- Reimbursements pending (snapshot from hr_reimbursements at compute time)
  reimbursement_pending NUMERIC(12,2) DEFAULT 0,

  -- Deductions
  pf_deduction NUMERIC(12,2) DEFAULT 0,
  esi_deduction NUMERIC(12,2) DEFAULT 0,
  pt_deduction NUMERIC(12,2) DEFAULT 0,
  tds_deduction NUMERIC(12,2) DEFAULT 0,
  loan_recovery NUMERIC(12,2) DEFAULT 0,
  notice_shortfall_recovery NUMERIC(12,2) DEFAULT 0,
  asset_recovery NUMERIC(12,2) DEFAULT 0,                 -- from checklist recovery_amounts
  other_recovery NUMERIC(12,2) DEFAULT 0,

  -- Totals
  gross_payable NUMERIC(12,2) DEFAULT 0,
  net_payable NUMERIC(12,2) DEFAULT 0,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','computed','approved','disbursed','reversed'
  )),
  computed_at TIMESTAMPTZ,
  computed_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  disbursed_by TEXT,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,

  -- Artefacts
  payslip_blob_url TEXT,
  fnf_statement_blob_url TEXT,

  -- Engine input snapshot (full input bag for re-compute / audit)
  input_snapshot JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_fnf_sep_idx    ON hr_fnf(separation_id);
CREATE INDEX IF NOT EXISTS hr_fnf_emp_idx    ON hr_fnf(employee_id);
CREATE INDEX IF NOT EXISTS hr_fnf_status_idx ON hr_fnf(status);
CREATE INDEX IF NOT EXISTS hr_fnf_created_idx ON hr_fnf(created_at DESC);

-- Wire the deferred FK from hr_separation → hr_fnf
ALTER TABLE hr_separation
  ADD CONSTRAINT hr_sep_fnf_fk
  FOREIGN KEY (fnf_id) REFERENCES hr_fnf(id) ON DELETE SET NULL;

-- ─── (e) hr_exit_interview ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_exit_interview (
  id BIGSERIAL PRIMARY KEY,
  separation_id BIGINT NOT NULL REFERENCES hr_separation(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id),

  conducted_by TEXT,                                      -- HR email
  conducted_at TIMESTAMPTZ,
  mode TEXT CHECK (mode IN ('form','call','in_person')),

  -- 12 structured questions — answers JSONB keyed by question id
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Convenience columns mirrored from answers for fast filtering
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  would_rejoin BOOLEAN,
  would_recommend BOOLEAN,
  learnings TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_exit_int_sep_idx ON hr_exit_interview(separation_id);
CREATE INDEX IF NOT EXISTS hr_exit_int_emp_idx ON hr_exit_interview(employee_id);

-- Wire deferred FK from hr_separation → hr_exit_interview
ALTER TABLE hr_separation
  ADD CONSTRAINT hr_sep_exit_int_fk
  FOREIGN KEY (exit_interview_id) REFERENCES hr_exit_interview(id) ON DELETE SET NULL;

-- ─── (f) hr_letter_archive ← link letters to a separation ────────────
ALTER TABLE hr_letter_archive
  ADD COLUMN IF NOT EXISTS separation_id BIGINT REFERENCES hr_separation(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hr_letter_sep_idx ON hr_letter_archive(separation_id);

-- ─── (g) updated_at touch triggers ───────────────────────────────────
DROP TRIGGER IF EXISTS hr_sep_touch ON hr_separation;
CREATE TRIGGER hr_sep_touch BEFORE UPDATE ON hr_separation
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_sep_chk_touch ON hr_separation_checklist;
CREATE TRIGGER hr_sep_chk_touch BEFORE UPDATE ON hr_separation_checklist
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_fnf_touch ON hr_fnf;
CREATE TRIGGER hr_fnf_touch BEFORE UPDATE ON hr_fnf
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_exit_int_touch ON hr_exit_interview;
CREATE TRIGGER hr_exit_int_touch BEFORE UPDATE ON hr_exit_interview
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

-- ─── (h) Row-level security — parity with hr_policy_acknowledgements ─
-- Policy: HR + finance + admins see everything (enforced at app layer via
-- getEffectivePermissions); the employee sees their own rows only.
-- We enable RLS but keep policies open here so the app layer remains the
-- single source of truth (same pattern as hr_policy_acknowledgements,
-- which is checked via supabase service-role from server routes only).
ALTER TABLE hr_separation              ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_separation_checklist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_fnf                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_exit_interview           ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (matches existing HR table convention)
DO $$ BEGIN
  CREATE POLICY hr_sep_service_all ON hr_separation FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_sep_chk_service_all ON hr_separation_checklist FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_fnf_service_all ON hr_fnf FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_exit_int_service_all ON hr_exit_interview FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── End of migration 023 ────────────────────────────────────────────
