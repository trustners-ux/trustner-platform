-- ─────────────────────────────────────────────────────────────────────
-- Migration 024 — Performance Management / Appraisals.
-- Authored by Phase 9 build, May 31 2026.
-- Apply via Supabase dashboard SQL editor. Apply order matters because
-- hr_pip references hr_rating which references hr_appraisal_cycle.
--
-- Phase 9: Trustner HRMS Performance Management module.
--
-- POLICY (Ram-signed-off May 31 2026):
--   • Annual fiscal-year cycle (Apr-Mar). Optional mid-year check-in.
--   • Rating scale 1-5
--     (1=Below, 2=Partial, 3=Meets, 4=Exceeds, 5=Outstanding).
--   • 9-box grid: performance(1-5) × potential(1-5) → 9 quadrants.
--   • Forced distribution OFF by default (headcount ≤ 10);
--     opt-in per cycle via enforce_distribution.
--   • Increment matrix versioned by fiscal_year. FY26 default:
--     1→0%, 2→4%, 3→7%, 4→12%, 5→18%.
--   • Compliance HARD-cap at rating 3 when ANY of: open POSP
--     cross-check flag, open compliance ticket, attendance LOP
--     > 8 days in cycle, missed DSR > 5 days in last 30.
--   • PIP auto-triggered on rating=1: 30/60/90 milestones.
--     PIP outcome=failed → auto-creates hr_separation row
--     (separation_type='termination_without_cause',
--      is_misconduct=false, reason linkage stored).
--   • Sales auto-feeds: goal.target_metric pulled from hr_dsr_entries.
--   • Self-review OTP-sign reuses hr_attestations e-sign (Phase 7).
--   • Weights MUST sum to 100 at lock (deferred trigger).
--   • Cycle states: draft → goals_open → mid_year → self_review_open
--     → manager_review_open → skip_review_open → calibration → published.
-- ─────────────────────────────────────────────────────────────────────

-- ─── (a) hr_appraisal_cycle ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_appraisal_cycle (
  id BIGSERIAL PRIMARY KEY,
  cycle_code TEXT UNIQUE NOT NULL,                          -- e.g. CYC-FY26-ANNUAL
  fiscal_year TEXT NOT NULL,                                -- e.g. 'FY26'
  cycle_type TEXT NOT NULL DEFAULT 'annual' CHECK (cycle_type IN (
    'annual','mid_year','probation_confirmation'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','goals_open','mid_year','self_review_open',
    'manager_review_open','skip_review_open','calibration',
    'published','archived'
  )),

  -- Forced distribution (off by default for ≤10 headcount)
  enforce_distribution BOOLEAN NOT NULL DEFAULT false,
  distribution_curve JSONB DEFAULT
    '{"1":5,"2":15,"3":60,"4":15,"5":5}'::jsonb,

  -- Due dates for cycle-state transitions
  goals_due_date DATE,
  midyear_due_date DATE,
  self_review_due_date DATE,
  manager_review_due_date DATE,
  skip_review_due_date DATE,
  calibration_due_date DATE,
  published_at TIMESTAMPTZ,

  -- Audit
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS hr_cycle_fy_idx     ON hr_appraisal_cycle(fiscal_year);
CREATE INDEX IF NOT EXISTS hr_cycle_status_idx ON hr_appraisal_cycle(status);
CREATE INDEX IF NOT EXISTS hr_cycle_code_idx   ON hr_appraisal_cycle(cycle_code);

-- ─── (b) hr_goals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_goals (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,

  kra_category TEXT NOT NULL CHECK (kra_category IN (
    'business','operational','behavioural','learning','compliance'
  )),
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),

  -- Target / actual
  target_metric TEXT,                                       -- e.g. 'AUM_INR' / 'NEW_SIPS'
  target_value NUMERIC(18,2),
  target_unit TEXT,                                         -- e.g. 'INR', 'count', '%'
  actual_value NUMERIC(18,2),

  -- Auto-feed wiring
  auto_source TEXT CHECK (auto_source IN (
    'hr_dsr_business','hr_dsr_meetings','hr_dsr_leads',
    'manual','posp_crosscheck_clean','attendance_score'
  )),
  auto_pulled_at TIMESTAMPTZ,

  -- Mid-year check-in
  midyear_actual NUMERIC(18,2),
  midyear_note TEXT,

  -- Self review
  self_rating SMALLINT CHECK (self_rating BETWEEN 1 AND 5),
  self_note TEXT,

  -- Manager review
  manager_rating SMALLINT CHECK (manager_rating BETWEEN 1 AND 5),
  manager_note TEXT,

  -- Final (post-calibration)
  final_rating SMALLINT CHECK (final_rating BETWEEN 1 AND 5),

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked')),

  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (cycle_id, employee_id, goal_title)
);

CREATE INDEX IF NOT EXISTS hr_goals_cycle_idx    ON hr_goals(cycle_id);
CREATE INDEX IF NOT EXISTS hr_goals_emp_idx      ON hr_goals(employee_id);
CREATE INDEX IF NOT EXISTS hr_goals_status_idx   ON hr_goals(status);
CREATE INDEX IF NOT EXISTS hr_goals_cat_idx      ON hr_goals(kra_category);

-- Deferred weight-sum trigger — fires on lock
CREATE OR REPLACE FUNCTION hr_goals_check_weight_sum()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC(8,2);
BEGIN
  -- Only enforce when ANY goal for this (cycle, employee) is locked
  IF NEW.status = 'locked' THEN
    SELECT COALESCE(SUM(weight),0) INTO total_weight
      FROM hr_goals
      WHERE cycle_id = NEW.cycle_id
        AND employee_id = NEW.employee_id;
    IF ROUND(total_weight,2) <> 100.00 THEN
      RAISE EXCEPTION
        'Goal weights for employee % in cycle % must sum to 100 (got %).',
        NEW.employee_id, NEW.cycle_id, total_weight;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger renamed from hr_goals_weight_check → hr_goals_weight_sum_trigger
-- because Postgres auto-names the column CHECK constraint hr_goals_weight_check
-- (convention: <table>_<column>_check) and the names collided.
DROP TRIGGER IF EXISTS hr_goals_weight_sum_trigger ON hr_goals;
CREATE CONSTRAINT TRIGGER hr_goals_weight_sum_trigger
  AFTER INSERT OR UPDATE ON hr_goals
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION hr_goals_check_weight_sum();

-- ─── (c) hr_self_review ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_self_review (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,

  overall_self_rating NUMERIC(3,2),                         -- weighted avg, 1.00-5.00
  narrative_strengths TEXT,
  narrative_improvement TEXT,
  narrative_career TEXT,

  -- E-sign via hr_attestations (Phase 7 OTP pattern)
  attestation_id BIGINT REFERENCES hr_attestations(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','locked')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (cycle_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hr_self_rev_cycle_idx  ON hr_self_review(cycle_id);
CREATE INDEX IF NOT EXISTS hr_self_rev_emp_idx    ON hr_self_review(employee_id);
CREATE INDEX IF NOT EXISTS hr_self_rev_status_idx ON hr_self_review(status);

-- ─── (d) hr_manager_review ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_manager_review (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  manager_email TEXT NOT NULL,

  overall_manager_rating NUMERIC(3,2),
  narrative_strengths TEXT,
  narrative_improvement TEXT,
  narrative_potential TEXT,
  potential_rating SMALLINT CHECK (potential_rating BETWEEN 1 AND 5),

  narrative_compensation TEXT,
  recommended_increment_pct NUMERIC(5,2),
  recommended_promotion BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','locked')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (cycle_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hr_mgr_rev_cycle_idx ON hr_manager_review(cycle_id);
CREATE INDEX IF NOT EXISTS hr_mgr_rev_emp_idx   ON hr_manager_review(employee_id);
CREATE INDEX IF NOT EXISTS hr_mgr_rev_mgr_idx   ON hr_manager_review(manager_email);

-- ─── (e) hr_skip_review ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_skip_review (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  skip_email TEXT NOT NULL,
  calibrated_rating NUMERIC(3,2),
  calibration_note TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (cycle_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hr_skip_rev_cycle_idx ON hr_skip_review(cycle_id);
CREATE INDEX IF NOT EXISTS hr_skip_rev_emp_idx   ON hr_skip_review(employee_id);

-- ─── (f) hr_rating — final outcome of one cycle for one employee ────
CREATE TABLE IF NOT EXISTS hr_rating (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,

  final_performance_rating SMALLINT NOT NULL CHECK (final_performance_rating BETWEEN 1 AND 5),
  final_potential_rating SMALLINT CHECK (final_potential_rating BETWEEN 1 AND 5),

  nine_box_quadrant TEXT CHECK (nine_box_quadrant IN (
    'underperformer','effective','rising','core','solid',
    'high_pro','enigma','growth','star'
  )),

  -- Compliance hard-cap engine output
  compliance_capped BOOLEAN DEFAULT false,
  compliance_cap_reason TEXT,

  -- Increment / promotion
  recommended_increment_pct NUMERIC(5,2),
  final_increment_pct NUMERIC(5,2),
  increment_amount NUMERIC(12,2),
  promoted BOOLEAN DEFAULT false,
  new_designation TEXT,

  -- PIP trigger flag (true when final_performance_rating = 1)
  pip_required BOOLEAN DEFAULT false,

  -- Lifecycle
  locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Letter linkage (appraisal / increment letter)
  letter_id BIGINT REFERENCES hr_letter_archive(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (cycle_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hr_rating_cycle_idx  ON hr_rating(cycle_id);
CREATE INDEX IF NOT EXISTS hr_rating_emp_idx    ON hr_rating(employee_id);
CREATE INDEX IF NOT EXISTS hr_rating_nbox_idx   ON hr_rating(nine_box_quadrant);
CREATE INDEX IF NOT EXISTS hr_rating_locked_idx ON hr_rating(locked);

-- ─── (g) hr_pip — Performance Improvement Plan ──────────────────────
CREATE TABLE IF NOT EXISTS hr_pip (
  id BIGSERIAL PRIMARY KEY,
  rating_id BIGINT NOT NULL REFERENCES hr_rating(id) ON DELETE CASCADE,
  cycle_id BIGINT NOT NULL REFERENCES hr_appraisal_cycle(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,

  opened_at TIMESTAMPTZ DEFAULT now(),
  manager_email TEXT,

  -- Expected outcomes: array of { milestone, target_date, status }
  expected_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 30/60/90 review checkpoints
  m30_review_at TIMESTAMPTZ,
  m30_note TEXT,
  m60_review_at TIMESTAMPTZ,
  m60_note TEXT,
  m90_review_at TIMESTAMPTZ,
  m90_note TEXT,

  outcome TEXT NOT NULL DEFAULT 'open' CHECK (outcome IN (
    'open','succeeded','extended','failed'
  )),

  -- When outcome='failed', this links to the auto-created separation case
  separation_id BIGINT REFERENCES hr_separation(id) ON DELETE SET NULL,

  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_pip_rating_idx   ON hr_pip(rating_id);
CREATE INDEX IF NOT EXISTS hr_pip_emp_idx      ON hr_pip(employee_id);
CREATE INDEX IF NOT EXISTS hr_pip_outcome_idx  ON hr_pip(outcome);
CREATE INDEX IF NOT EXISTS hr_pip_cycle_idx    ON hr_pip(cycle_id);

-- ─── (h) hr_increment_matrix (versioned by FY) ──────────────────────
CREATE TABLE IF NOT EXISTS hr_increment_matrix (
  fiscal_year TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  default_pct NUMERIC(5,2) NOT NULL,
  min_pct NUMERIC(5,2) NOT NULL,
  max_pct NUMERIC(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (fiscal_year, rating),
  CHECK (min_pct <= default_pct AND default_pct <= max_pct)
);

-- Seed FY26 matrix
INSERT INTO hr_increment_matrix (fiscal_year, rating, default_pct, min_pct, max_pct, notes) VALUES
  ('FY26', 1, 0,  0,  0,  'Below expectations — no increment; PIP triggered'),
  ('FY26', 2, 4,  3,  5,  'Partially meets — calibrated band 3-5%'),
  ('FY26', 3, 7,  5,  9,  'Meets expectations — calibrated band 5-9%'),
  ('FY26', 4, 12, 10, 14, 'Exceeds expectations — calibrated band 10-14%'),
  ('FY26', 5, 18, 15, 22, 'Outstanding — calibrated band 15-22%')
ON CONFLICT (fiscal_year, rating) DO NOTHING;

-- ─── (i) hr_compliance_check VIEW — surfaces the compliance gate ────
-- Used by the rating engine to hard-cap ratings at 3.
CREATE OR REPLACE VIEW hr_compliance_check AS
SELECT
  e.id AS employee_id,
  e.email AS employee_email,

  -- POSP open flags
  COALESCE((
    SELECT COUNT(*) FROM hr_posp_crosschecks p
      WHERE p.matched_employee_id = e.id
        AND p.status IN ('flagged','flagged_soft','flagged_strong','flagged_hard')
  ), 0) AS posp_open_flags,

  -- Open compliance tickets
  COALESCE((
    SELECT COUNT(*) FROM hr_helpdesk_tickets t
      WHERE t.employee_id = e.id
        AND t.category = 'compliance'
        AND t.status IN ('open','in_progress','escalated')
  ), 0) AS compliance_open_tickets,

  -- LOP days in last 365 days (rolling cycle proxy)
  COALESCE((
    SELECT COUNT(*) FROM hr_attendance_logs a
      WHERE a.employee_id = e.id
        AND a.status = 'lop'
        AND a.log_date >= (CURRENT_DATE - INTERVAL '365 days')
  ), 0) AS lop_days_cycle,

  -- Missed DSR in last 30 days
  COALESCE((
    SELECT COUNT(*) FROM (
      SELECT generate_series(
        (CURRENT_DATE - INTERVAL '30 days')::date,
        CURRENT_DATE,
        '1 day'::interval
      )::date AS d
    ) days
    WHERE NOT EXISTS (
      SELECT 1 FROM hr_dsr_entries dsr
        WHERE dsr.employee_id = e.id
          AND dsr.entry_date = days.d
    )
  ), 0) AS missed_dsr_last_30,

  -- Final boolean: compliance_clear if ALL guards pass
  (
    COALESCE((
      SELECT COUNT(*) FROM hr_posp_crosschecks p
        WHERE p.matched_employee_id = e.id
          AND p.status IN ('flagged','flagged_soft','flagged_strong','flagged_hard')
    ), 0) = 0
    AND COALESCE((
      SELECT COUNT(*) FROM hr_helpdesk_tickets t
        WHERE t.employee_id = e.id
          AND t.category = 'compliance'
          AND t.status IN ('open','in_progress','escalated')
    ), 0) = 0
    AND COALESCE((
      SELECT COUNT(*) FROM hr_attendance_logs a
        WHERE a.employee_id = e.id
          AND a.status = 'lop'
          AND a.log_date >= (CURRENT_DATE - INTERVAL '365 days')
    ), 0) <= 8
  ) AS compliance_clear
FROM hr_employees e;

-- ─── (j) updated_at touch triggers ──────────────────────────────────
DROP TRIGGER IF EXISTS hr_cycle_touch          ON hr_appraisal_cycle;
CREATE TRIGGER hr_cycle_touch BEFORE UPDATE ON hr_appraisal_cycle
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_goals_touch          ON hr_goals;
CREATE TRIGGER hr_goals_touch BEFORE UPDATE ON hr_goals
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_self_rev_touch       ON hr_self_review;
CREATE TRIGGER hr_self_rev_touch BEFORE UPDATE ON hr_self_review
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_mgr_rev_touch        ON hr_manager_review;
CREATE TRIGGER hr_mgr_rev_touch BEFORE UPDATE ON hr_manager_review
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_skip_rev_touch       ON hr_skip_review;
CREATE TRIGGER hr_skip_rev_touch BEFORE UPDATE ON hr_skip_review
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_rating_touch         ON hr_rating;
CREATE TRIGGER hr_rating_touch BEFORE UPDATE ON hr_rating
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_pip_touch            ON hr_pip;
CREATE TRIGGER hr_pip_touch BEFORE UPDATE ON hr_pip
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

DROP TRIGGER IF EXISTS hr_incmatrix_touch      ON hr_increment_matrix;
CREATE TRIGGER hr_incmatrix_touch BEFORE UPDATE ON hr_increment_matrix
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();

-- ─── (k) Row-level security — parity with prior HR migrations ───────
ALTER TABLE hr_appraisal_cycle   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_self_review       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_manager_review    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_skip_review       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_rating            ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_pip               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_increment_matrix  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY hr_cycle_service_all ON hr_appraisal_cycle FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_goals_service_all ON hr_goals FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_self_rev_service_all ON hr_self_review FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_mgr_rev_service_all ON hr_manager_review FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_skip_rev_service_all ON hr_skip_review FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_rating_service_all ON hr_rating FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_pip_service_all ON hr_pip FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hr_incmatrix_service_all ON hr_increment_matrix FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── End of migration 024 ───────────────────────────────────────────
