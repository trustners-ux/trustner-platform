-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 012: Permission Hierarchy & Cross-Agent Visibility
--
-- Purpose: turn the platform from "every artefact is visible to its
-- creator + a hand-coded approver fallback" into "every artefact is
-- visible according to a configurable role + scope policy that
-- mirrors the org chart". Foundation for scaling to 6000+ clients
-- without losing supervisory oversight.
--
-- This migration is ADDITIVE — it does not break existing pd_roles /
-- pd_employee_roles / employees tables. It augments them with:
--   1. cross-agent scope columns on pd_roles (so the same role
--      definition governs PD + MP + IP + CO + PR)
--   2. a generic app_role_assignments table (time-bound, audited)
--   3. an artefact_views audit log (who viewed what, when)
--   4. a recursive view + function for fast subtree lookups
--
-- @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
-- ────────────────────────────────────────────────────────────────────

-- ─── 1. EXTEND pd_roles WITH CROSS-AGENT + SCOPE COLUMNS ──────────
-- pd_roles already governs PD permissions. Add columns so the same
-- row also governs MP / IP / CO / PR + declares default visibility.

ALTER TABLE pd_roles
  ADD COLUMN IF NOT EXISTS can_create_meeting_brief    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_proposal         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_orientation      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_periodic_review  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_pii                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_export                  BOOLEAN DEFAULT false,
  -- Visibility scope: which artefacts does a holder of this role see?
  -- 'own'             → only what they personally created/own
  -- 'direct_reports'  → own + work by direct reports (1 level down)
  -- 'subtree'         → own + entire org subtree below them
  -- 'firm'            → everyone, full visibility
  ADD COLUMN IF NOT EXISTS visibility_scope            TEXT DEFAULT 'own'
    CHECK (visibility_scope IN ('own','direct_reports','subtree','firm'));

-- Seed the new columns for existing role rows (idempotent)
UPDATE pd_roles SET
  can_create_meeting_brief   = (name IN ('mid_reviewer','senior_reviewer','admin')),
  can_create_proposal        = (name IN ('mid_reviewer','senior_reviewer','admin')),
  can_create_orientation     = (name IN ('junior_analyst','mid_reviewer','senior_reviewer','admin')),
  can_create_periodic_review = (name IN ('mid_reviewer','senior_reviewer','admin')),
  can_view_pii               = (name IN ('senior_reviewer','admin')),
  can_export                 = (name IN ('senior_reviewer','admin')),
  visibility_scope           = CASE name
    WHEN 'admin'           THEN 'firm'
    WHEN 'senior_reviewer' THEN 'subtree'
    WHEN 'mid_reviewer'    THEN 'direct_reports'
    WHEN 'junior_analyst'  THEN 'own'
    WHEN 'trainee'         THEN 'own'
    ELSE 'own'
  END
WHERE visibility_scope IS NULL OR visibility_scope = 'own';   -- only seed unmodified rows

-- ─── 2. INDEX reporting_manager_id FOR FAST SUBTREE WALKS ────────
CREATE INDEX IF NOT EXISTS idx_employees_reporting_manager
  ON employees(reporting_manager_id) WHERE is_active = true;

-- ─── 3. RECURSIVE VIEW: every (manager → descendant) pair ────────
-- One row per (ancestor_id, descendant_id, depth) — enables
-- "give me every employee in Ram's subtree" in a single fast SELECT.
CREATE OR REPLACE VIEW v_employee_subtree AS
WITH RECURSIVE tree AS (
  -- Seed: every employee is their own ancestor at depth 0 ("themself")
  SELECT
    id AS ancestor_id,
    id AS descendant_id,
    0  AS depth
  FROM employees
  WHERE is_active = true

  UNION ALL

  -- Recursive step: walk down via reporting_manager_id
  SELECT
    t.ancestor_id,
    e.id AS descendant_id,
    t.depth + 1 AS depth
  FROM tree t
  JOIN employees e ON e.reporting_manager_id = t.descendant_id
  WHERE e.is_active = true
)
SELECT ancestor_id, descendant_id, depth
FROM tree;

COMMENT ON VIEW v_employee_subtree IS
  'Materialised reporting tree: one row per (ancestor, descendant, depth) pair. Used by permission_hierarchy.getDescendantIds() to resolve subtree visibility in a single query.';

-- ─── 4. AUDIT LOG: every view of every artefact ──────────────────
-- Foundation for "who has seen this client''s data" queries.
-- Append-only — never updated, never deleted by the app.

CREATE TABLE IF NOT EXISTS app_artefact_views (
  id              BIGSERIAL PRIMARY KEY,
  viewer_employee_id  BIGINT NOT NULL REFERENCES employees(id),
  artefact_type   TEXT NOT NULL CHECK (artefact_type IN (
    'portfolio_diagnostic',
    'meeting_brief',
    'investment_proposal',
    'client_orientation',
    'periodic_review',
    'client_family',
    'employee_profile'
  )),
  artefact_id     BIGINT NOT NULL,
  scope_used      TEXT,    -- 'own' / 'direct_reports' / 'subtree' / 'firm' — why the viewer was allowed
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent_hash TEXT,    -- short hash of UA for forensics, not raw UA (privacy)
  request_id      TEXT     -- correlation id for tracing
);

CREATE INDEX IF NOT EXISTS idx_artefact_views_artefact
  ON app_artefact_views(artefact_type, artefact_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_artefact_views_viewer
  ON app_artefact_views(viewer_employee_id, viewed_at DESC);

COMMENT ON TABLE app_artefact_views IS
  'Append-only audit log of every artefact read. Enables "who saw this client data" queries for compliance + SEBI fiduciary reviews.';

-- ─── 5. APP-LEVEL ROLE ASSIGNMENTS (time-bound + audited) ────────
-- Generalisation of pd_employee_roles. While pd_employee_roles is
-- a single-active-row-per-employee join (good for the current PD
-- workflow), this new table tracks the FULL HISTORY of who held
-- which role, when, and who assigned it. Required for compliance
-- (SEBI: "show me who had approval authority on date X").
--
-- Initially this is a shadow log — pd_employee_roles remains the
-- live source of truth. Future work: pivot reads to this table once
-- it''s backfilled and stable.

CREATE TABLE IF NOT EXISTS app_role_assignments (
  id                BIGSERIAL PRIMARY KEY,
  employee_id       BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_id           BIGINT NOT NULL REFERENCES pd_roles(id),
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to      TIMESTAMPTZ,         -- NULL = currently active
  assigned_by_employee_id  BIGINT REFERENCES employees(id),
  assigned_reason   TEXT,
  scope_override    JSONB,               -- exception grants (rare)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_employee
  ON app_role_assignments(employee_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_role_assignments_active
  ON app_role_assignments(employee_id) WHERE effective_to IS NULL;

COMMENT ON TABLE app_role_assignments IS
  'Time-bound role assignment history. effective_to=NULL means currently active. Append a new row to change a role; do not edit existing rows (compliance: immutable assignment history).';

-- Seed: backfill from existing pd_employee_roles so the history starts now
INSERT INTO app_role_assignments (employee_id, role_id, effective_from, assigned_by_employee_id, assigned_reason)
SELECT
  per.employee_id,
  per.role_id,
  per.created_at,
  NULL,
  'backfilled-from-pd_employee_roles-on-migration-012'
FROM pd_employee_roles per
WHERE per.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM app_role_assignments ara
    WHERE ara.employee_id = per.employee_id
      AND ara.effective_to IS NULL
  );

-- ─── 6. VERIFY ───────────────────────────────────────────────────
DO $$
DECLARE
  pd_roles_count INT;
  assignments_count INT;
  subtree_pair_count INT;
BEGIN
  SELECT COUNT(*) INTO pd_roles_count FROM pd_roles;
  SELECT COUNT(*) INTO assignments_count FROM app_role_assignments WHERE effective_to IS NULL;
  SELECT COUNT(*) INTO subtree_pair_count FROM v_employee_subtree;
  RAISE NOTICE 'Migration 012 complete: % pd_roles, % active assignments, % subtree pairs',
    pd_roles_count, assignments_count, subtree_pair_count;
END $$;
