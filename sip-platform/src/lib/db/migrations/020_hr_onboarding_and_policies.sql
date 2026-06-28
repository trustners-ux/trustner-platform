-- Migration 020: HR Onboarding flow + Policy Documents
-- Custom Trustner HRMS — Phase 3 schema

-- ─── Onboarding tokens (new joiners, pre-employee) ───────────────
-- A new-hire workflow:
--   1. HR creates an onboarding record with email + phone + entity + designation
--      → token auto-generated, status='invited'
--   2. WhatsApp + email invite sent with /onboarding/<token> link
--   3. Candidate uploads documents → status='in_progress' / 'submitted'
--   4. HR reviews documents → status='under_review' → 'approved'
--   5. On approval, employee record auto-created in hr_employees
CREATE TABLE IF NOT EXISTS hr_onboarding (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('TAS','TIB')),
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  department TEXT,
  office_code TEXT REFERENCES hr_offices(code),
  date_of_joining DATE,
  -- Workflow status
  status TEXT DEFAULT 'invited' CHECK (status IN (
    'invited',       -- invite sent, not yet opened
    'in_progress',   -- candidate opened the link, uploading
    'submitted',     -- candidate marked submission complete
    'under_review',  -- HR is reviewing
    'changes_requested', -- HR wants something redone
    'approved',      -- HR approved, employee created
    'rejected',      -- HR rejected the candidate
    'expired'        -- token expired without completion
  )),
  -- Related-party + IRDAI declarations captured during onboarding
  related_party_yn BOOLEAN,
  related_party_details TEXT,
  other_intermediary_yn BOOLEAN,
  other_intermediary_details TEXT,
  -- HR action
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  changes_requested_note TEXT,
  -- On approval, link to the created employee
  employee_id BIGINT REFERENCES hr_employees(id),
  -- Token lifecycle
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_onb_token_idx     ON hr_onboarding(token);
CREATE INDEX IF NOT EXISTS hr_onb_status_idx    ON hr_onboarding(status);
CREATE INDEX IF NOT EXISTS hr_onb_email_idx     ON hr_onboarding(email);
CREATE INDEX IF NOT EXISTS hr_onb_expires_idx   ON hr_onboarding(expires_at);

-- ─── Onboarding document uploads ─────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_onboarding_documents (
  id BIGSERIAL PRIMARY KEY,
  onboarding_id BIGINT NOT NULL REFERENCES hr_onboarding(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'pan','aadhaar_front','aadhaar_back','photo','cancelled_cheque',
    'education_10th','education_12th','education_grad','education_pg',
    'prior_employment_offer','prior_employment_relieving','prior_employment_salary_slip',
    'bgv_consent','related_party_form','irdai_form','self_declaration',
    'resume','other'
  )),
  filename TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS hr_onb_doc_onb_idx ON hr_onboarding_documents(onboarding_id);

-- ─── Policy Documents (employee handbook, POSH, COI, etc.) ───────
CREATE TABLE IF NOT EXISTS hr_policies (
  id BIGSERIAL PRIMARY KEY,
  -- Categories align with the 12 HR redesign-brief categories
  category TEXT NOT NULL CHECK (category IN (
    'foundational',         -- A: Handbook, SOP, Org Structure
    'hiring_onboarding',    -- B
    'compensation_benefits',-- C
    'attendance_leave',     -- D
    'performance_growth',   -- E
    'conduct_ethics',       -- F
    'data_it_security',     -- G
    'disciplinary',         -- H
    'separation',           -- I
    'statutory',            -- J: EPF, ESI, Gratuity, Bonus, etc.
    'engagement',           -- K
    'governance'            -- L
  )),
  title TEXT NOT NULL,
  description TEXT,
  doc_code TEXT,               -- e.g. '01' for Employee Handbook, '38' for POSH
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE,
  board_approval_date DATE,
  -- Storage (Vercel Blob)
  blob_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  -- Which entities does this policy apply to?
  entities TEXT[] DEFAULT ARRAY['TAS','TIB'],
  -- Does it require employee acknowledgement?
  requires_acknowledgement BOOLEAN DEFAULT false,
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','superseded','archived')),
  superseded_by BIGINT REFERENCES hr_policies(id),
  -- Audit
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_pol_category_idx ON hr_policies(category);
CREATE INDEX IF NOT EXISTS hr_pol_status_idx ON hr_policies(status);

-- ─── Policy acknowledgements (audit-grade) ───────────────────────
CREATE TABLE IF NOT EXISTS hr_policy_acknowledgements (
  id BIGSERIAL PRIMARY KEY,
  policy_id BIGINT NOT NULL REFERENCES hr_policies(id),
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id),
  policy_version TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_ip INET,
  acknowledged_user_agent TEXT,
  UNIQUE(policy_id, employee_id, policy_version)
);
CREATE INDEX IF NOT EXISTS hr_pol_ack_emp_idx ON hr_policy_acknowledgements(employee_id);

-- ─── Touch trigger ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS hr_onb_touch ON hr_onboarding;
CREATE TRIGGER hr_onb_touch BEFORE UPDATE ON hr_onboarding
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_pol_touch ON hr_policies;
CREATE TRIGGER hr_pol_touch BEFORE UPDATE ON hr_policies
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();
