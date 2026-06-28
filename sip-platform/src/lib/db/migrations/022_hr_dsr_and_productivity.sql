-- Migration 022: DSR + Attendance hardening + Productivity dashboard
-- Custom Trustner HRMS — anti-leakage controls
--
-- Operationalises Handbook v3 Section 15 (Business Reporting Integrity & DSR)
-- and Section 16 (Targets & Performance Discipline). Until now the policy
-- was on paper only; this migration makes it enforceable in the system.
--
-- Three new pillars:
--   1. DSR submission tracking (hr_dsr_entries + hr_dsr_settings)
--   2. Attendance hardening (biometric_required flag, photo capture for field)
--   3. Productivity view + auto-flag when ROI < 1.0

-- ─── 1. DSR Settings — which roles require DSR? ────────────────
-- Levels covered: any grade_band up to and including CDM (L4/L5).
-- Founders + BOD (L1) excluded. Back-office support (L7+) excluded.
CREATE TABLE IF NOT EXISTS hr_dsr_settings (
  id BIGSERIAL PRIMARY KEY,
  entity TEXT CHECK (entity IN ('TAS','TIB')),       -- NULL = both
  required_for_grades TEXT[] DEFAULT ARRAY['L2','L3','L4','L5'],
  -- Deadline: HH:MM (24h IST). Default 20:00 = 8 PM.
  eod_deadline TIME DEFAULT '20:00:00',
  -- Auto-LOP after N consecutive missing days (default 3)
  consecutive_miss_to_lop INT DEFAULT 3,
  -- Reminder schedule: hours past EOD when reminder fires
  reminder_hours TEXT[] DEFAULT ARRAY['18:00','19:30'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO hr_dsr_settings (entity) VALUES (NULL) ON CONFLICT DO NOTHING;

-- ─── 2. Daily Sales Report entries ─────────────────────────────
CREATE TABLE IF NOT EXISTS hr_dsr_entries (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  -- Activity counts (the bare minimum)
  meetings_planned INT DEFAULT 0,
  meetings_done INT DEFAULT 0,
  calls_made INT DEFAULT 0,
  new_leads_added INT DEFAULT 0,
  -- Business numbers (₹)
  business_proposed_inr NUMERIC(15,2) DEFAULT 0,
  business_booked_inr NUMERIC(15,2) DEFAULT 0,
  premium_collected_inr NUMERIC(15,2) DEFAULT 0,         -- TIB
  aum_added_inr NUMERIC(15,2) DEFAULT 0,                 -- TAS
  -- Narrative
  highlights TEXT,
  obstacles TEXT,
  tomorrow_plan TEXT,
  -- Verification flags (manager fills these on review)
  manager_reviewed_by TEXT,
  manager_reviewed_at TIMESTAMPTZ,
  manager_notes TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','flagged','rejected')),
  -- Submission metadata (for audit + late-flagging)
  submitted_at TIMESTAMPTZ DEFAULT now(),
  submitted_ip INET,
  submitted_user_agent TEXT,
  is_late BOOLEAN DEFAULT false,                          -- past EOD deadline
  -- Self-certification (the integrity clause)
  certified_genuine BOOLEAN DEFAULT false,
  certification_text TEXT,
  -- audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, entry_date)
);
CREATE INDEX IF NOT EXISTS hr_dsr_emp_date_idx ON hr_dsr_entries(employee_id, entry_date);
CREATE INDEX IF NOT EXISTS hr_dsr_date_idx ON hr_dsr_entries(entry_date);
CREATE INDEX IF NOT EXISTS hr_dsr_status_idx ON hr_dsr_entries(status);

-- ─── 3. DSR misses — auto-tracked ──────────────────────────────
-- Cron-populated at EOD: for every DSR-required employee with no entry +
-- not on approved leave, insert a miss row. After N consecutive misses
-- the attendance system auto-marks LOP for those days.
CREATE TABLE IF NOT EXISTS hr_dsr_misses (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  miss_date DATE NOT NULL,
  -- Reason (filled by employee if they later justify)
  justification TEXT,
  justified_at TIMESTAMPTZ,
  -- Disposition: 'pending' (default) → 'condoned' (excused) → 'lop' (loss of pay)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','condoned','lop','resolved')),
  reminder_sent_count INT DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, miss_date)
);
CREATE INDEX IF NOT EXISTS hr_dsr_miss_emp_idx ON hr_dsr_misses(employee_id);
CREATE INDEX IF NOT EXISTS hr_dsr_miss_status_idx ON hr_dsr_misses(status);

-- ─── 4. Attendance hardening — biometric + photo fields ───────
-- Adds enforcement columns to hr_attendance_logs. The PUNCH API will
-- require these per-employee based on hr_employees.attendance_mode:
--   'office'   = mandatory biometric/facial at the office device
--   'field'    = mandatory geo + selfie + DSR submitted same day
--   'remote'   = WFH (HR-approved on a per-day basis)
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS attendance_mode TEXT
    DEFAULT 'office' CHECK (attendance_mode IN ('office','field','remote','hybrid'));

ALTER TABLE hr_attendance_logs
  ADD COLUMN IF NOT EXISTS attendance_mode TEXT,           -- copy of employee.attendance_mode at punch time
  ADD COLUMN IF NOT EXISTS biometric_method TEXT,          -- 'face','fingerprint','none'
  ADD COLUMN IF NOT EXISTS biometric_device_id TEXT,
  ADD COLUMN IF NOT EXISTS punch_in_photo_url TEXT,        -- selfie at punch-in (field staff)
  ADD COLUMN IF NOT EXISTS punch_out_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS geofence_distance_m INT,        -- distance from registered office at punch
  ADD COLUMN IF NOT EXISTS geofence_compliant BOOLEAN,     -- within radius?
  ADD COLUMN IF NOT EXISTS dsr_submitted BOOLEAN,          -- did they submit a DSR today?
  ADD COLUMN IF NOT EXISTS validation_notes TEXT;          -- any anomalies for HR review

-- ─── 5. Productivity Salary Anchors ────────────────────────────
-- Stores per-employee "salary cost vs business contribution" benchmarks
-- so the productivity view can flag whether someone is earning back their
-- compensation. Updated monthly by the payroll engine + business cron.
CREATE TABLE IF NOT EXISTS hr_productivity_snapshots (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  pay_month TEXT NOT NULL,                                 -- 'YYYY-MM'
  -- Costs
  salary_cost_inr NUMERIC(15,2),                           -- gross paid this month
  -- Output
  business_booked_inr NUMERIC(15,2) DEFAULT 0,
  premium_collected_inr NUMERIC(15,2) DEFAULT 0,
  aum_added_inr NUMERIC(15,2) DEFAULT 0,
  commission_earned_inr NUMERIC(15,2) DEFAULT 0,           -- to Trustner from this employee's books
  -- Activity rollups
  working_days INT,
  present_days NUMERIC(5,2),
  dsr_submitted_days INT,
  dsr_missed_days INT,
  -- Computed
  attendance_pct NUMERIC(5,2),                             -- present / working * 100
  dsr_pct NUMERIC(5,2),                                    -- submitted / expected * 100
  roi_ratio NUMERIC(8,4),                                  -- commission_earned / salary_cost
  is_flagged BOOLEAN DEFAULT false,                        -- auto-flag if roi < threshold for N consecutive months
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, pay_month)
);
CREATE INDEX IF NOT EXISTS hr_prod_emp_month_idx ON hr_productivity_snapshots(employee_id, pay_month);
CREATE INDEX IF NOT EXISTS hr_prod_flagged_idx ON hr_productivity_snapshots(is_flagged) WHERE is_flagged = true;

-- ─── 6. Touch triggers ─────────────────────────────────────────
DROP TRIGGER IF EXISTS hr_dsr_touch ON hr_dsr_entries;
CREATE TRIGGER hr_dsr_touch BEFORE UPDATE ON hr_dsr_entries
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();
DROP TRIGGER IF EXISTS hr_dsr_set_touch ON hr_dsr_settings;
CREATE TRIGGER hr_dsr_set_touch BEFORE UPDATE ON hr_dsr_settings
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

-- ─── 7. Helper view — productivity rollup by employee ──────────
CREATE OR REPLACE VIEW hr_productivity_summary AS
SELECT
  e.id AS employee_id,
  e.employee_code,
  e.full_name,
  e.entity,
  e.designation,
  e.grade_band,
  e.office_code,
  -- Last 6 months aggregates
  COALESCE(SUM(p.salary_cost_inr),0) AS total_salary_6mo,
  COALESCE(SUM(p.business_booked_inr),0) AS total_business_6mo,
  COALESCE(SUM(p.commission_earned_inr),0) AS total_commission_6mo,
  -- Average ROI
  COALESCE(AVG(p.roi_ratio),0) AS avg_roi_6mo,
  COALESCE(AVG(p.attendance_pct),0) AS avg_attendance_6mo,
  COALESCE(AVG(p.dsr_pct),0) AS avg_dsr_6mo,
  -- Flags
  COUNT(*) FILTER (WHERE p.is_flagged) AS months_flagged,
  COUNT(*) AS months_in_period
FROM hr_employees e
LEFT JOIN hr_productivity_snapshots p ON p.employee_id = e.id
  AND p.pay_month >= to_char(CURRENT_DATE - INTERVAL '6 months', 'YYYY-MM')
WHERE e.status IN ('active','on_notice')
GROUP BY e.id;
