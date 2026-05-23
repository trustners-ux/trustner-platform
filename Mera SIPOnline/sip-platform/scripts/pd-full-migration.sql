-- ═══════════════════════════════════════════════════════════════
-- PORTFOLIO DIAGNOSTIC — CONSOLIDATED MIGRATION (004 + 005)
-- Paste this entire file into Supabase SQL Editor and click Run.
-- Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ─── PART 1: SCHEMA (migration 004) ──────────────────────────

-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER PORTFOLIO DIAGNOSTIC — Workbench Schema (v2.0)
-- Version: 2.0 | Date: 2026-05-23
-- Database: PostgreSQL (Supabase)
-- Reference Spec: PORTFOLIO_DIAGNOSTIC_SPEC.md v2.0
-- ═══════════════════════════════════════════════════════════════
--
-- This migration adds the schema for the Portfolio Diagnostic
-- Workbench: a role-based advisory pipeline where junior analysts
-- upload portfolio data, certified reviewers analyze, and only
-- approved reports are published to clients.
--
-- All tables are prefixed `pd_` to namespace cleanly against the
-- existing MIS tables.
-- ═══════════════════════════════════════════════════════════════

-- ─── ENUM TYPES ────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE pd_workflow_status AS ENUM (
        'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ESCALATED',
        'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED',
        'REJECTED', 'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_verdict AS ENUM (
        'STAR', 'KEEP', 'WATCH', 'SWAP', 'LIQUIDATE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_role_name AS ENUM (
        'trainee', 'junior_analyst', 'mid_reviewer',
        'senior_reviewer', 'admin'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_client_segment AS ENUM (
        'Mass', 'Affluent', 'HNI', 'UHNI'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_entity_type AS ENUM (
        'Individual', 'HUF', 'Partnership', 'Pvt Ltd', 'LLP', 'Trust', 'Other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_sip_status AS ENUM (
        'Active', 'Paused', 'Stopped', 'Completed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pd_sip_frequency AS ENUM (
        'Monthly', 'Quarterly', 'Weekly', 'Daily', 'One-Time-STP'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 1. ROLES ──────────────────────────────────────────────────
-- The 5-level role hierarchy with explicit permissions.

CREATE TABLE IF NOT EXISTS pd_roles (
    id SERIAL PRIMARY KEY,
    name pd_role_name UNIQUE NOT NULL,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 5),
    can_upload BOOLEAN DEFAULT false,
    can_edit_draft BOOLEAN DEFAULT false,
    can_review BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    can_publish BOOLEAN DEFAULT false,
    can_override_hierarchy BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    approval_aum_ceiling_inr BIGINT, -- NULL = unlimited (L5)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. EMPLOYEE ROLES (extends existing employees table) ──────
-- Links the existing MIS employees table to portfolio-diagnostic roles.
-- One employee → one PD role.

CREATE TABLE IF NOT EXISTS pd_employee_roles (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES pd_roles(id),
    certifications TEXT[] DEFAULT '{}', -- e.g. ['CFP', 'CFA-L3', 'NISM-V-A']
    avg_review_turnaround_hours NUMERIC(5,2),
    pending_review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id)
);

CREATE INDEX IF NOT EXISTS idx_pd_emp_roles_employee
    ON pd_employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_pd_emp_roles_role
    ON pd_employee_roles(role_id, is_active);

-- ─── 3. CLIENT FAMILIES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pd_client_families (
    id SERIAL PRIMARY KEY,
    family_code VARCHAR(20) UNIQUE,
    family_name VARCHAR(200) NOT NULL,
    primary_contact_name VARCHAR(200),
    primary_contact_email VARCHAR(200),
    primary_contact_mobile VARCHAR(20),
    primary_contact_pan_encrypted VARCHAR(255),
    segment pd_client_segment NOT NULL DEFAULT 'Mass',
    assigned_rm_employee_id INT REFERENCES employees(id),
    assigned_cfp_employee_id INT REFERENCES employees(id),
    total_aum_inr BIGINT DEFAULT 0,
    num_entities INT DEFAULT 0,
    num_active_sips INT DEFAULT 0,
    monthly_sip_flow_inr BIGINT DEFAULT 0,
    last_diagnostic_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_families_segment
    ON pd_client_families(segment);
CREATE INDEX IF NOT EXISTS idx_pd_families_rm
    ON pd_client_families(assigned_rm_employee_id);
CREATE INDEX IF NOT EXISTS idx_pd_families_aum
    ON pd_client_families(total_aum_inr DESC);
CREATE INDEX IF NOT EXISTS idx_pd_families_name
    ON pd_client_families USING gin (to_tsvector('english', family_name));

-- ─── 4. FAMILY ENTITIES (PANs within family) ──────────────────

CREATE TABLE IF NOT EXISTS pd_family_entities (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES pd_client_families(id) ON DELETE CASCADE,
    entity_name VARCHAR(200) NOT NULL,
    entity_type pd_entity_type NOT NULL DEFAULT 'Individual',
    pan_encrypted VARCHAR(255),
    date_of_birth DATE,
    relationship_to_primary VARCHAR(50),
    authorized_signatory_entity_id INT REFERENCES pd_family_entities(id),
    total_aum_inr BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_entities_family
    ON pd_family_entities(family_id);

-- ─── 5. FUND MASTER (cached from MFAPI/AMFI) ──────────────────

CREATE TABLE IF NOT EXISTS pd_fund_master (
    amfi_code VARCHAR(20) PRIMARY KEY,
    scheme_name VARCHAR(300) NOT NULL,
    amc_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(100),
    current_nav NUMERIC(10,4),
    aum_inr_cr NUMERIC(12,2),
    expense_ratio NUMERIC(4,2),
    fund_manager VARCHAR(200),
    manager_since_date DATE,
    cagr_1y NUMERIC(6,2),
    cagr_3y NUMERIC(6,2),
    cagr_5y NUMERIC(6,2),
    cagr_10y NUMERIC(6,2),
    category_rank_3y INT,
    category_rank_5y INT,
    category_total INT,
    trustner_preferred BOOLEAN DEFAULT false,
    last_refreshed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_fund_category
    ON pd_fund_master(category);
CREATE INDEX IF NOT EXISTS idx_pd_fund_preferred
    ON pd_fund_master(category, trustner_preferred)
    WHERE trustner_preferred = true;
CREATE INDEX IF NOT EXISTS idx_pd_fund_name_search
    ON pd_fund_master USING gin (to_tsvector('english', scheme_name));

-- ─── 6. CATEGORY BENCHMARKS (computed weekly) ─────────────────

CREATE TABLE IF NOT EXISTS pd_category_benchmarks (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    median_3y NUMERIC(6,2),
    median_5y NUMERIC(6,2),
    top_10_pct_3y NUMERIC(6,2),
    bottom_10_pct_3y NUMERIC(6,2),
    total_funds_in_category INT,
    as_of_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (category, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_pd_bench_latest
    ON pd_category_benchmarks(category, as_of_date DESC);

-- ─── 7. PREFERRED FUNDS BY CATEGORY ────────────────────────────
-- Trustner's curated SWAP targets per category.

CREATE TABLE IF NOT EXISTS pd_preferred_funds_by_category (
    category VARCHAR(50) PRIMARY KEY,
    primary_amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    secondary_amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    rationale TEXT,
    updated_by_employee_id INT REFERENCES employees(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. DIAGNOSTIC RUNS (the central workflow object) ─────────

CREATE TABLE IF NOT EXISTS pd_diagnostic_runs (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    family_id INT NOT NULL REFERENCES pd_client_families(id),
    methodology_version VARCHAR(10) NOT NULL DEFAULT '1.0.0',

    -- Workflow state
    status pd_workflow_status NOT NULL DEFAULT 'DRAFT',
    uploaded_by_employee_id INT NOT NULL REFERENCES employees(id),
    current_reviewer_employee_id INT REFERENCES employees(id),
    approved_by_employee_id INT REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Family snapshot (denormalised at time of diagnostic)
    family_name VARCHAR(200) NOT NULL,
    num_entities INT DEFAULT 0,
    num_holdings INT DEFAULT 0,
    num_active_sips INT DEFAULT 0,
    num_unique_funds INT DEFAULT 0,
    num_amcs INT DEFAULT 0,
    total_invested_inr BIGINT DEFAULT 0,
    current_value_inr BIGINT DEFAULT 0,
    unrealised_gain_inr BIGINT DEFAULT 0,
    family_xirr_pct NUMERIC(5,2),
    monthly_sip_flow_inr BIGINT DEFAULT 0,
    annual_sip_flow_inr BIGINT DEFAULT 0,

    -- Verdict summary
    verdict_star_count INT DEFAULT 0,
    verdict_keep_count INT DEFAULT 0,
    verdict_watch_count INT DEFAULT 0,
    verdict_swap_count INT DEFAULT 0,
    verdict_liquidate_count INT DEFAULT 0,
    total_swap_value_inr BIGINT DEFAULT 0,
    total_liquidate_value_inr BIGINT DEFAULT 0,
    estimated_total_tax_inr BIGINT DEFAULT 0,

    -- Output URLs (only populated after PUBLISH transition)
    diagnostic_report_pdf_url TEXT,
    full_review_pdf_url TEXT,
    action_sheet_pdf_url TEXT,
    sip_schedule_report_pdf_url TEXT,

    -- Delivery tracking
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_runs_status
    ON pd_diagnostic_runs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pd_runs_family
    ON pd_diagnostic_runs(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pd_runs_uploader
    ON pd_diagnostic_runs(uploaded_by_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_pd_runs_reviewer
    ON pd_diagnostic_runs(current_reviewer_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_pd_runs_published
    ON pd_diagnostic_runs(published_at DESC)
    WHERE status = 'PUBLISHED';

-- ─── 9. DIAGNOSTIC HOLDINGS (per fund-position) ───────────────

CREATE TABLE IF NOT EXISTS pd_diagnostic_holdings (
    id SERIAL PRIMARY KEY,
    diagnostic_run_id INT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
    entity_id INT NOT NULL REFERENCES pd_family_entities(id),
    fund_name VARCHAR(300) NOT NULL,
    amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    folio_number VARCHAR(50),
    category VARCHAR(50),

    units NUMERIC(15,4),
    invested_inr BIGINT,
    current_value_inr BIGINT,
    unrealised_gain_inr BIGINT,
    xirr_pct NUMERIC(5,2),
    holding_period_months INT,
    first_investment_date DATE,

    cagr_1y NUMERIC(5,2),
    cagr_3y NUMERIC(5,2),
    cagr_5y NUMERIC(5,2),
    category_median_3y NUMERIC(5,2),
    category_median_5y NUMERIC(5,2),
    category_quartile INT CHECK (category_quartile BETWEEN 1 AND 4),

    composite_score NUMERIC(4,3),
    verdict pd_verdict NOT NULL,
    verdict_rationale TEXT,

    -- Override tracking (reviewer can flip a verdict with justification)
    original_verdict pd_verdict,
    override_reason TEXT,
    overridden_by_employee_id INT REFERENCES employees(id),
    overridden_at TIMESTAMPTZ,

    recommended_replacement_amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    estimated_tax_impact_inr BIGINT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_holdings_run
    ON pd_diagnostic_holdings(diagnostic_run_id);
CREATE INDEX IF NOT EXISTS idx_pd_holdings_entity
    ON pd_diagnostic_holdings(entity_id);
CREATE INDEX IF NOT EXISTS idx_pd_holdings_verdict
    ON pd_diagnostic_holdings(diagnostic_run_id, verdict);

-- ─── 10. DIAGNOSTIC SIPs (forward cash flows) ─────────────────

CREATE TABLE IF NOT EXISTS pd_diagnostic_sips (
    id SERIAL PRIMARY KEY,
    diagnostic_run_id INT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
    entity_id INT NOT NULL REFERENCES pd_family_entities(id),
    linked_holding_id INT REFERENCES pd_diagnostic_holdings(id),
    fund_name VARCHAR(300) NOT NULL,
    amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    folio_number VARCHAR(50),
    category VARCHAR(50),

    monthly_amount_inr INT NOT NULL,
    actual_amount_inr INT NOT NULL,
    frequency pd_sip_frequency NOT NULL DEFAULT 'Monthly',
    sip_day_of_month INT CHECK (sip_day_of_month BETWEEN 1 AND 28),
    start_date DATE NOT NULL,
    end_date DATE,
    status pd_sip_status NOT NULL DEFAULT 'Active',

    has_step_up BOOLEAN DEFAULT false,
    step_up_pct NUMERIC(4,2),
    step_up_frequency VARCHAR(20),

    installments_completed INT,
    total_installments INT,
    next_installment_date DATE,
    bank_mandate_status VARCHAR(20),

    age_in_months INT,
    expected_annual_inflow_inr BIGINT,
    expected_5y_inflow_inr BIGINT,
    fund_verdict pd_verdict,
    recommended_action VARCHAR(20),
    recommended_redirect_fund VARCHAR(300),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_sips_run
    ON pd_diagnostic_sips(diagnostic_run_id);
CREATE INDEX IF NOT EXISTS idx_pd_sips_entity
    ON pd_diagnostic_sips(entity_id);
CREATE INDEX IF NOT EXISTS idx_pd_sips_status
    ON pd_diagnostic_sips(diagnostic_run_id, status);
CREATE INDEX IF NOT EXISTS idx_pd_sips_amount
    ON pd_diagnostic_sips(diagnostic_run_id, monthly_amount_inr DESC);

-- ─── 11. WORKFLOW EVENTS (immutable audit log) ────────────────
-- Every state transition emits one event. Never updated, only inserted.

CREATE TABLE IF NOT EXISTS pd_workflow_events (
    id SERIAL PRIMARY KEY,
    diagnostic_run_id INT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
    actor_employee_id INT NOT NULL REFERENCES employees(id),
    actor_role pd_role_name NOT NULL,
    action VARCHAR(50) NOT NULL,
    from_status pd_workflow_status,
    to_status pd_workflow_status,
    assignee_employee_id INT REFERENCES employees(id),
    comment TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_events_run
    ON pd_workflow_events(diagnostic_run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pd_events_actor
    ON pd_workflow_events(actor_employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pd_events_action
    ON pd_workflow_events(action, created_at DESC);

-- ─── 12. REVIEW COMMENTS (threaded discussion) ────────────────

CREATE TABLE IF NOT EXISTS pd_review_comments (
    id SERIAL PRIMARY KEY,
    diagnostic_run_id INT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
    parent_comment_id INT REFERENCES pd_review_comments(id),
    author_employee_id INT NOT NULL REFERENCES employees(id),
    holding_id INT REFERENCES pd_diagnostic_holdings(id),
    sip_id INT REFERENCES pd_diagnostic_sips(id),
    comment_text TEXT NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_employee_id INT REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_comments_run
    ON pd_review_comments(diagnostic_run_id);
CREATE INDEX IF NOT EXISTS idx_pd_comments_unresolved
    ON pd_review_comments(diagnostic_run_id, resolved_at)
    WHERE resolved_at IS NULL;

-- ─── 13. CAS UPLOAD STORAGE ────────────────────────────────────
-- Track which CAS PDF blob is associated with each diagnostic.

CREATE TABLE IF NOT EXISTS pd_cas_uploads (
    id SERIAL PRIMARY KEY,
    diagnostic_run_id INT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
    uploaded_by_employee_id INT NOT NULL REFERENCES employees(id),
    blob_url TEXT NOT NULL,
    blob_size_bytes BIGINT,
    original_filename VARCHAR(255),
    parse_status VARCHAR(20) DEFAULT 'pending',
    parse_error TEXT,
    holdings_parsed INT DEFAULT 0,
    sips_parsed INT DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    parsed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pd_cas_run
    ON pd_cas_uploads(diagnostic_run_id);

-- ─── TRIGGERS ──────────────────────────────────────────────────

-- Auto-update `updated_at` on diagnostic_runs
CREATE OR REPLACE FUNCTION pd_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pd_runs_updated_at ON pd_diagnostic_runs;
CREATE TRIGGER trg_pd_runs_updated_at
    BEFORE UPDATE ON pd_diagnostic_runs
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_pd_families_updated_at ON pd_client_families;
CREATE TRIGGER trg_pd_families_updated_at
    BEFORE UPDATE ON pd_client_families
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_pd_emp_roles_updated_at ON pd_employee_roles;
CREATE TRIGGER trg_pd_emp_roles_updated_at
    BEFORE UPDATE ON pd_employee_roles
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

-- Auto-update pending_review_count on assignment
CREATE OR REPLACE FUNCTION pd_update_pending_review_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement old reviewer
    IF OLD.current_reviewer_employee_id IS NOT NULL
       AND (TG_OP = 'UPDATE' AND OLD.current_reviewer_employee_id IS DISTINCT FROM NEW.current_reviewer_employee_id) THEN
        UPDATE pd_employee_roles
           SET pending_review_count = GREATEST(0, pending_review_count - 1)
         WHERE employee_id = OLD.current_reviewer_employee_id;
    END IF;

    -- Increment new reviewer
    IF NEW.current_reviewer_employee_id IS NOT NULL
       AND NEW.status IN ('IN_REVIEW', 'ESCALATED')
       AND (TG_OP = 'INSERT' OR OLD.current_reviewer_employee_id IS DISTINCT FROM NEW.current_reviewer_employee_id) THEN
        UPDATE pd_employee_roles
           SET pending_review_count = pending_review_count + 1
         WHERE employee_id = NEW.current_reviewer_employee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pd_runs_pending_count ON pd_diagnostic_runs;
CREATE TRIGGER trg_pd_runs_pending_count
    AFTER INSERT OR UPDATE OF current_reviewer_employee_id, status
    ON pd_diagnostic_runs
    FOR EACH ROW EXECUTE FUNCTION pd_update_pending_review_count();

-- ─── COMMENTS (for self-documenting schema) ────────────────────

COMMENT ON TABLE pd_roles IS '5-level role hierarchy for the Portfolio Diagnostic Workbench. L1=Trainee, L5=Admin.';
COMMENT ON TABLE pd_diagnostic_runs IS 'Central workflow object — one row per portfolio review, tracked from DRAFT to PUBLISHED.';
COMMENT ON TABLE pd_workflow_events IS 'Immutable audit log. Every state transition is recorded here for SEBI/AMFI compliance.';
COMMENT ON COLUMN pd_diagnostic_runs.diagnostic_report_pdf_url IS 'NULL until status=PUBLISHED. PDFs are never generated for DRAFT/REVIEW states.';
COMMENT ON COLUMN pd_diagnostic_holdings.original_verdict IS 'Stored only when a reviewer override the system-generated verdict. NULL means no override.';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 004
-- Next: 005_portfolio_diagnostic_seed.sql (role seeds + preferred funds)
-- ═══════════════════════════════════════════════════════════════

-- ─── PART 2: SEED (migration 005) ────────────────────────────

-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER PORTFOLIO DIAGNOSTIC — Seed Data
-- Version: 2.0 | Date: 2026-05-23
-- ═══════════════════════════════════════════════════════════════
-- Seeds the 5 roles and Trustner's preferred funds per category.
-- Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ROLES ──────────────────────────────────────────────────

INSERT INTO pd_roles (
    name, level, can_upload, can_edit_draft, can_review,
    can_approve, can_publish, can_override_hierarchy,
    can_manage_users, approval_aum_ceiling_inr
)
VALUES
    ('trainee',         1, false, false, false, false, false, false, false, 0),
    ('junior_analyst',  2, true,  true,  false, false, false, false, false, 0),
    ('mid_reviewer',    3, true,  true,  true,  true,  false, false, false, 5000000),       -- ₹50 Lakh
    ('senior_reviewer', 4, true,  true,  true,  true,  true,  false, false, 50000000),      -- ₹5 Crore
    ('admin',           5, true,  true,  true,  true,  true,  true,  true,  NULL)           -- unlimited
ON CONFLICT (name) DO UPDATE SET
    level = EXCLUDED.level,
    can_upload = EXCLUDED.can_upload,
    can_edit_draft = EXCLUDED.can_edit_draft,
    can_review = EXCLUDED.can_review,
    can_approve = EXCLUDED.can_approve,
    can_publish = EXCLUDED.can_publish,
    can_override_hierarchy = EXCLUDED.can_override_hierarchy,
    can_manage_users = EXCLUDED.can_manage_users,
    approval_aum_ceiling_inr = EXCLUDED.approval_aum_ceiling_inr;

-- ─── 2. PREFERRED FUNDS BY CATEGORY ───────────────────────────
-- Trustner's curated SWAP targets. The fund_master rows are seeded
-- by the weekly cron job from MFAPI; this seed only sets the
-- "preferred" pointers AFTER fund_master is populated.
--
-- IMPORTANT: This seed assumes pd_fund_master has been populated
-- by the cron job. If running on a fresh DB, run the cron first.
-- The INSERT below uses INSERT … SELECT to avoid hard-coding
-- AMFI codes that may not exist yet.

-- Pre-seed a placeholder so the cron can update it later
INSERT INTO pd_preferred_funds_by_category (
    category, primary_amfi_code, secondary_amfi_code, rationale, updated_at
)
VALUES
    ('Flexi Cap',          NULL, NULL, 'Primary: Parag Parikh Flexi Cap. Secondary: HDFC Flexi Cap.', NOW()),
    ('Large Cap',          NULL, NULL, 'Primary: ICICI Pru Bluechip. Secondary: Mirae Asset Large Cap.', NOW()),
    ('Large & Mid Cap',    NULL, NULL, 'Primary: Motilal Oswal L&M. Secondary: Mirae Asset Emerging Bluechip.', NOW()),
    ('Mid Cap',            NULL, NULL, 'Primary: Nippon India Growth Mid Cap. Secondary: HDFC Mid Cap Opportunities.', NOW()),
    ('Small Cap',          NULL, NULL, 'Primary: Bandhan Small Cap. Secondary: Invesco India Small Cap.', NOW()),
    ('Multi Cap',          NULL, NULL, 'Primary: Kotak Multicap. Secondary: Mahindra Manulife Multi Cap.', NOW()),
    ('Value',              NULL, NULL, 'Primary: ICICI Pru Value Discovery. Secondary: HDFC Capital Builder Value.', NOW()),
    ('Focused',            NULL, NULL, 'Primary: SBI Focused Equity. Secondary: Axis Focused 25.', NOW()),
    ('ELSS',               NULL, NULL, 'Primary: Quant ELSS Tax Saver. Secondary: Mirae Asset Tax Saver.', NOW()),
    ('Aggressive Hybrid',  NULL, NULL, 'Primary: ICICI Pru Equity & Debt. Secondary: HDFC Hybrid Equity.', NOW()),
    ('Balanced Advantage', NULL, NULL, 'Primary: HDFC Balanced Advantage. Secondary: ICICI Pru Balanced Advantage.', NOW()),
    ('Multi Asset',        NULL, NULL, 'Primary: ICICI Pru Multi Asset. Secondary: Nippon India Multi Asset.', NOW())
ON CONFLICT (category) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- POST-MIGRATION CHECKLIST (for ops):
--
-- 1. Run the fund-master cron job to populate pd_fund_master:
--    POST /api/cron/refresh-fund-master (Authorization: CRON_SECRET)
--
-- 2. Update pd_preferred_funds_by_category to point to the actual
--    AMFI codes once the fund-master has them. SQL template:
--      UPDATE pd_preferred_funds_by_category
--         SET primary_amfi_code   = (SELECT amfi_code FROM pd_fund_master
--                                     WHERE scheme_name LIKE 'Parag Parikh Flexi%' LIMIT 1),
--             secondary_amfi_code = (SELECT amfi_code FROM pd_fund_master
--                                     WHERE scheme_name LIKE 'HDFC Flexi%' LIMIT 1)
--       WHERE category = 'Flexi Cap';
--    (Repeat per category, or use an admin UI to manage this.)
--
-- 3. Assign roles to existing MIS employees:
--      INSERT INTO pd_employee_roles (employee_id, role_id, certifications)
--      VALUES
--          ((SELECT id FROM employees WHERE email = 'ram@trustner.in'),
--           (SELECT id FROM pd_roles WHERE name = 'admin'),
--           ARRAY['CFP']),
--          ((SELECT id FROM employees WHERE email = 'sangeeta@trustner.in'),
--           (SELECT id FROM pd_roles WHERE name = 'senior_reviewer'),
--           ARRAY['NISM-V-A']);
-- ═══════════════════════════════════════════════════════════════

-- ─── VERIFICATION QUERIES (run separately to confirm success) ──
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'pd_%' ORDER BY tablename;
-- SELECT name, level, approval_aum_ceiling_inr FROM pd_roles ORDER BY level;
-- SELECT category, primary_amfi_code FROM pd_preferred_funds_by_category;
