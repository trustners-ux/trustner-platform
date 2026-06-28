-- Migration 018: HR Modules Expansion
-- Custom Trustner HRMS — Phase 2 schema
--
-- Adds the foundation tables for full Keka/GreytHR/Zoho feature parity:
--   - hr_user_permissions    — per-user module toggle (Ram's explicit ask)
--   - hr_holidays            — national/regional/restricted holiday calendar
--   - hr_leave_types         — leave master per entity (CL/SL/EL/ML/CompOff/LWP)
--   - hr_leave_balances      — per employee, per type, per FY
--   - hr_leave_applications  — apply-approve workflow
--   - hr_attendance_logs     — daily punch-in/out
--   - hr_attendance_regularization — forgot-to-punch flow
--   - hr_salary_runs         — monthly payroll batch
--   - hr_salary_slips        — individual employee slip per run
--   - hr_reimbursements      — expense claims
--   - hr_helpdesk_tickets    — HR query / ticket flow
--   - hr_announcements       — internal communication
--
-- Performance / Onboarding / Exit / Engagement tables added in
-- migration 019 once the foundation is verified.

-- ────────────────────────────────────────────────────────────────
-- Module M13 — User Permissions (Ram's explicit ask)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_user_permissions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  -- Module-level toggles (default off — opt-in security model)
  can_access_letters BOOLEAN DEFAULT false,
  can_access_employees BOOLEAN DEFAULT false,
  can_access_payroll BOOLEAN DEFAULT false,
  can_access_attendance_admin BOOLEAN DEFAULT false,
  can_access_leave_admin BOOLEAN DEFAULT false,
  can_access_compliance BOOLEAN DEFAULT false,
  can_access_reports BOOLEAN DEFAULT false,
  can_access_onboarding BOOLEAN DEFAULT false,
  can_access_performance BOOLEAN DEFAULT false,
  can_access_engagement BOOLEAN DEFAULT false,
  -- Standard employee features (default ON)
  can_apply_leave BOOLEAN DEFAULT true,
  can_punch_attendance BOOLEAN DEFAULT true,
  can_view_payslips BOOLEAN DEFAULT true,
  -- Manager features (default OFF, granted to managers)
  can_approve_leave BOOLEAN DEFAULT false,
  can_approve_attendance_reg BOOLEAN DEFAULT false,
  can_view_team_data BOOLEAN DEFAULT false,
  -- Audit
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- Module M6 — Holiday calendar
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_holidays (
  id BIGSERIAL PRIMARY KEY,
  fy TEXT NOT NULL,                              -- 'FY2026' / 'FY2027'
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('national','festival','regional','restricted')),
  -- Scope: applies to all entities by default; can be narrowed
  entity TEXT CHECK (entity IN ('TAS','TIB')),   -- NULL = both
  state TEXT,                                    -- e.g. 'Assam' for regional
  office_location TEXT,                          -- e.g. 'Guwahati'
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_holiday_fy_idx        ON hr_holidays(fy);
CREATE INDEX IF NOT EXISTS hr_holiday_date_idx      ON hr_holidays(holiday_date);

-- ────────────────────────────────────────────────────────────────
-- Module M4 — Leave types + balances + applications
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_leave_types (
  id BIGSERIAL PRIMARY KEY,
  entity TEXT NOT NULL CHECK (entity IN ('TAS','TIB')),
  code TEXT NOT NULL,                            -- 'CL','SL','EL','ML','CO','LWP'
  name TEXT NOT NULL,                            -- 'Casual Leave', 'Sick Leave', etc.
  annual_credit NUMERIC(5,2) DEFAULT 0,          -- days credited per FY
  max_carry_forward NUMERIC(5,2) DEFAULT 0,      -- max days that can roll over
  is_encashable BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT true,
  applies_to_gender TEXT CHECK (applies_to_gender IN ('all','male','female')) DEFAULT 'all',
  min_tenure_months INT DEFAULT 0,               -- min months of service to use
  notice_days_required INT DEFAULT 0,            -- min notice before applying
  max_consecutive_days INT,                      -- cap on consecutive
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity, code)
);

CREATE TABLE IF NOT EXISTS hr_leave_balances (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type_id BIGINT NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
  fy TEXT NOT NULL,                              -- 'FY2026'
  credited NUMERIC(5,2) DEFAULT 0,
  carried_forward NUMERIC(5,2) DEFAULT 0,
  used NUMERIC(5,2) DEFAULT 0,
  -- Available = credited + carried_forward - used
  available NUMERIC(5,2) GENERATED ALWAYS AS (credited + carried_forward - used) STORED,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, fy)
);
CREATE INDEX IF NOT EXISTS hr_leave_bal_emp_idx ON hr_leave_balances(employee_id);

CREATE TABLE IF NOT EXISTS hr_leave_applications (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type_id BIGINT NOT NULL REFERENCES hr_leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  is_half_day BOOLEAN DEFAULT false,
  half_day_session TEXT CHECK (half_day_session IN ('first','second')),
  days NUMERIC(5,2) NOT NULL,                    -- e.g. 0.5 for half-day
  reason TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled','withdrawn')),
  approved_by TEXT,                              -- email of approver
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_leave_app_emp_idx     ON hr_leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS hr_leave_app_status_idx  ON hr_leave_applications(status);
CREATE INDEX IF NOT EXISTS hr_leave_app_dates_idx   ON hr_leave_applications(from_date, to_date);

-- ────────────────────────────────────────────────────────────────
-- Module M3 — Attendance
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  punch_in TIMESTAMPTZ,
  punch_out TIMESTAMPTZ,
  punch_in_lat NUMERIC(10,7),
  punch_in_lng NUMERIC(10,7),
  punch_out_lat NUMERIC(10,7),
  punch_out_lng NUMERIC(10,7),
  punch_in_location TEXT,                        -- resolved office name or 'WFH'
  punch_out_location TEXT,
  -- Computed at app layer:
  status TEXT CHECK (status IN ('present','half_day','absent','late','wfh','holiday','leave','weekly_off')),
  total_hours NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, log_date)
);
CREATE INDEX IF NOT EXISTS hr_att_emp_date_idx ON hr_attendance_logs(employee_id, log_date);

CREATE TABLE IF NOT EXISTS hr_attendance_regularization (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  requested_punch_in TIMESTAMPTZ,
  requested_punch_out TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- Module M5 — Payroll
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_salary_runs (
  id BIGSERIAL PRIMARY KEY,
  fy TEXT NOT NULL,                              -- 'FY2026'
  pay_month TEXT NOT NULL,                       -- '2026-04' (YYYY-MM)
  entity TEXT NOT NULL CHECK (entity IN ('TAS','TIB')),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','calculating','calculated','approved','disbursed','locked')),
  total_employees INT,
  total_gross NUMERIC(15,2),
  total_deductions NUMERIC(15,2),
  total_net NUMERIC(15,2),
  total_pf NUMERIC(12,2),
  total_esi NUMERIC(12,2),
  total_pt NUMERIC(12,2),
  total_tds NUMERIC(12,2),
  bank_advice_blob_url TEXT,                     -- generated bank file
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity, pay_month)
);

CREATE TABLE IF NOT EXISTS hr_salary_slips (
  id BIGSERIAL PRIMARY KEY,
  salary_run_id BIGINT NOT NULL REFERENCES hr_salary_runs(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id),
  -- Earnings
  basic NUMERIC(12,2) DEFAULT 0,
  hra NUMERIC(12,2) DEFAULT 0,
  special_allowance NUMERIC(12,2) DEFAULT 0,
  variable_pay NUMERIC(12,2) DEFAULT 0,
  other_earnings NUMERIC(12,2) DEFAULT 0,
  gross NUMERIC(12,2) DEFAULT 0,
  -- Deductions
  pf_employee NUMERIC(12,2) DEFAULT 0,
  esi_employee NUMERIC(12,2) DEFAULT 0,
  professional_tax NUMERIC(12,2) DEFAULT 0,
  tds NUMERIC(12,2) DEFAULT 0,
  loan_recovery NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  -- Net
  net_pay NUMERIC(12,2) DEFAULT 0,
  -- Attendance basis
  paid_days NUMERIC(5,2),
  lop_days NUMERIC(5,2) DEFAULT 0,
  -- Generated slip
  slip_blob_url TEXT,                            -- PDF
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','generated','sent','viewed')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salary_run_id, employee_id)
);
CREATE INDEX IF NOT EXISTS hr_slip_emp_idx ON hr_salary_slips(employee_id);

CREATE TABLE IF NOT EXISTS hr_reimbursements (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                        -- 'travel','telecom','meal','other'
  expense_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  receipt_blob_url TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','paid')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_in_salary_run_id BIGINT REFERENCES hr_salary_runs(id),
  applied_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- Module M2 — ESS Help Desk + M11 Engagement
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_helpdesk_tickets (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                        -- 'payroll','leave','attendance','document','other'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed','reopened')),
  assigned_to TEXT,                              -- HR email
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_ticket_emp_idx     ON hr_helpdesk_tickets(employee_id);
CREATE INDEX IF NOT EXISTS hr_ticket_status_idx  ON hr_helpdesk_tickets(status);

CREATE TABLE IF NOT EXISTS hr_announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,                                 -- 'policy','event','urgent','general'
  entity TEXT CHECK (entity IN ('TAS','TIB')),   -- NULL = both
  pinned BOOLEAN DEFAULT false,
  publish_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- Seed default leave types per entity
-- (Adjust quantities later to match policy 25_Comprehensive_Leave_Policy.docx)
-- ────────────────────────────────────────────────────────────────
-- Trustner Employee Handbook v3 Section 11:
--   EL 10 / SL 7 / CL 7 (total 24 paid leave days per calendar year)
--   ML = Maternity Benefit Act, 1961 (2017 amendment) = 26 weeks = 182 days
--   CO + LWP = zero default; case-by-case
INSERT INTO hr_leave_types (entity, code, name, annual_credit, max_carry_forward, is_encashable, notice_days_required)
VALUES
  ('TAS','CL','Casual Leave',7,0,false,1),
  ('TAS','SL','Sick Leave',7,0,false,0),
  ('TAS','EL','Earned Leave',10,30,true,15),
  ('TAS','CO','Comp-Off',0,0,false,1),
  ('TAS','ML','Maternity Leave',182,0,false,30),
  ('TAS','LWP','Loss of Pay',0,0,false,0),
  ('TIB','CL','Casual Leave',7,0,false,1),
  ('TIB','SL','Sick Leave',7,0,false,0),
  ('TIB','EL','Earned Leave',10,30,true,15),
  ('TIB','CO','Comp-Off',0,0,false,1),
  ('TIB','ML','Maternity Leave',182,0,false,30),
  ('TIB','LWP','Loss of Pay',0,0,false,0)
ON CONFLICT (entity, code) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- Seed FY2026 holiday calendar (India common + national)
-- ────────────────────────────────────────────────────────────────
INSERT INTO hr_holidays (fy, holiday_date, name, type, entity, state) VALUES
  ('FY2026','2026-04-14','Dr. Ambedkar Jayanti / Bihu Day 1','national',NULL,NULL),
  ('FY2026','2026-04-15','Bohag Bihu Day 2','regional',NULL,'Assam'),
  ('FY2026','2026-05-01','Labour Day','national',NULL,NULL),
  ('FY2026','2026-08-15','Independence Day','national',NULL,NULL),
  ('FY2026','2026-10-02','Gandhi Jayanti','national',NULL,NULL),
  ('FY2026','2026-10-20','Diwali','festival',NULL,NULL),
  ('FY2026','2026-11-25','Guru Nanak Jayanti','festival',NULL,NULL),
  ('FY2026','2026-12-25','Christmas','festival',NULL,NULL),
  ('FY2027','2027-01-26','Republic Day','national',NULL,NULL),
  ('FY2027','2027-03-04','Holi','festival',NULL,NULL)
ON CONFLICT DO NOTHING;
