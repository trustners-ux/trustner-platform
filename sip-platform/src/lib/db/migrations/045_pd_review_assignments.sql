-- ════════════════════════════════════════════════════════════════════════
-- Migration 045 — PD REVIEW ASSIGNMENTS (fine-grained oversight, Phase 2)
-- ════════════════════════════════════════════════════════════════════════
-- The PD-oversight graph Ram wants is DIFFERENT from the HR reporting tree.
-- Visibility today flows from the org hierarchy (visibility_scope: own /
-- direct_reports / subtree / firm). But Ram wants CA Ishika Bajaj to view +
-- help an EXPLICIT set of 13 salespeople who do NOT report up through her —
-- while NOT seeing Tamanna Kejriwal (super-admin only) or Abhishek Agarwala /
-- Wasbir Ahmed (covered by their own reporting heads).
--
-- This table holds explicit reviewer → subject grants that are UNIONED into the
-- visible-employee set (see getVisibleEmployeeIds). It is additive only — it can
-- widen what a reviewer sees, never narrow it. Idempotent.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pd_review_assignments (
  id                       SERIAL PRIMARY KEY,
  reviewer_employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  subject_employee_id      INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by_employee_id  INT REFERENCES employees(id),
  note                     TEXT,
  is_active                BOOLEAN     DEFAULT true,
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE (reviewer_employee_id, subject_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_pd_review_assign_reviewer
  ON pd_review_assignments(reviewer_employee_id) WHERE is_active = true;

-- ── Seed: Ishika Bajaj (emp 25) ← the 13 named salespeople ──────────────
-- NOT included (by Ram's instruction): Tamanna Kejriwal(28) = super-admin only;
-- Abhishek Agarwala(29) + Wasbir Ahmed(36) = their reporting heads help them.
INSERT INTO pd_review_assignments (reviewer_employee_id, subject_employee_id, assigned_by_employee_id, note)
VALUES
  (25,  3, 1, 'Ishika central-help: Abir Das'),
  (25,  7, 1, 'Ishika central-help: Raju Chakraborty'),
  (25, 40, 1, 'Ishika central-help: Mustafizur Rahman'),
  (25, 39, 1, 'Ishika central-help: Raj Das'),
  (25, 35, 1, 'Ishika central-help: Rinjima Pathak Das'),
  (25, 37, 1, 'Ishika central-help: Jinu Lagachu'),
  (25, 38, 1, 'Ishika central-help: Jasmine Jain'),
  (25, 26, 1, 'Ishika central-help: Vinita Kabra'),
  (25, 27, 1, 'Ishika central-help: Khushbu Chhajer'),
  (25, 30, 1, 'Ishika central-help: Harshita Jalan'),
  (25, 31, 1, 'Ishika central-help: Balbinder Kaur'),
  (25, 32, 1, 'Ishika central-help: Tasdiq Ahmed'),
  (25, 33, 1, 'Ishika central-help: Ajanta Saikia')
ON CONFLICT (reviewer_employee_id, subject_employee_id) DO NOTHING;
