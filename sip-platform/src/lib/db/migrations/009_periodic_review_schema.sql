-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER PERIODIC REVIEW AGENT — Schema
-- Version: 1.0 | Date: 2026-05-23
-- ═══════════════════════════════════════════════════════════════
-- Cron-triggered quarterly/annual portfolio review note. References
-- the underlying Portfolio Diagnostic run for the period.
-- All tables prefixed `pr_`.
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE pr_review_cadence AS ENUM (
        'Quarterly', 'Half-Yearly', 'Annual', 'Ad-Hoc'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 1. PERIODIC REVIEWS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS pr_periodic_reviews (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    family_id INT NOT NULL REFERENCES pd_client_families(id),
    methodology_version VARCHAR(10) NOT NULL DEFAULT '1.0.0',

    -- Workflow
    status pd_workflow_status NOT NULL DEFAULT 'DRAFT',
    uploaded_by_employee_id INT NOT NULL REFERENCES employees(id),
    current_reviewer_employee_id INT REFERENCES employees(id),
    approved_by_employee_id INT REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Review context
    cadence pr_review_cadence NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    underlying_diagnostic_run_id INT REFERENCES pd_diagnostic_runs(id),
    prior_periodic_review_id INT REFERENCES pr_periodic_reviews(id),

    -- Family snapshot
    family_name VARCHAR(200) NOT NULL,
    current_aum_inr BIGINT,
    period_start_aum_inr BIGINT,
    period_gain_inr BIGINT,                             -- current - start
    period_return_pct NUMERIC(5,2),
    family_xirr_pct NUMERIC(5,2),
    benchmark_return_pct NUMERIC(5,2),                  -- Nifty 50 / category benchmark
    alpha_pct NUMERIC(5,2),                             -- family_xirr - benchmark

    -- Performance attribution (top 3 contributors / detractors)
    top_contributor_1 VARCHAR(300),
    top_contributor_1_contribution_inr BIGINT,
    top_contributor_2 VARCHAR(300),
    top_contributor_2_contribution_inr BIGINT,
    top_contributor_3 VARCHAR(300),
    top_contributor_3_contribution_inr BIGINT,
    top_detractor_1 VARCHAR(300),
    top_detractor_1_contribution_inr BIGINT,
    top_detractor_2 VARCHAR(300),
    top_detractor_2_contribution_inr BIGINT,
    top_detractor_3 VARCHAR(300),
    top_detractor_3_contribution_inr BIGINT,

    -- Goal tracking
    num_active_goals INT DEFAULT 0,
    num_goals_on_track INT DEFAULT 0,
    num_goals_behind INT DEFAULT 0,

    -- Action items
    num_action_items_completed INT DEFAULT 0,
    num_action_items_new INT DEFAULT 0,
    num_action_items_pending INT DEFAULT 0,

    -- Market commentary (1-paragraph for the period)
    market_summary TEXT,
    outlook_next_period TEXT,

    -- Output PDF
    review_note_pdf_url TEXT,

    -- Delivery
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,
    client_acknowledged_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_reviews_status
    ON pr_periodic_reviews(status, review_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_family
    ON pr_periodic_reviews(family_id, review_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_uploader
    ON pr_periodic_reviews(uploaded_by_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_reviewer
    ON pr_periodic_reviews(current_reviewer_employee_id, status);

-- ─── 2. PERIODIC ACTION ITEMS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS pr_action_items (
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL REFERENCES pr_periodic_reviews(id) ON DELETE CASCADE,
    family_id INT NOT NULL REFERENCES pd_client_families(id),
    description TEXT NOT NULL,
    owner VARCHAR(20),                                  -- 'Client' | 'RM' | 'Both'
    status VARCHAR(20) DEFAULT 'Open',                  -- Open | In Progress | Completed | Blocked
    due_date DATE,
    completed_at TIMESTAMPTZ,
    completed_by_employee_id INT REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_actions_review ON pr_action_items(review_id);
CREATE INDEX IF NOT EXISTS idx_pr_actions_open
    ON pr_action_items(family_id, status)
    WHERE status IN ('Open', 'In Progress', 'Blocked');

-- ─── TRIGGERS ──────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_pr_reviews_updated_at ON pr_periodic_reviews;
CREATE TRIGGER trg_pr_reviews_updated_at
    BEFORE UPDATE ON pr_periodic_reviews
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_pr_actions_updated_at ON pr_action_items;
CREATE TRIGGER trg_pr_actions_updated_at
    BEFORE UPDATE ON pr_action_items
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_pr_reviews_pending_count ON pr_periodic_reviews;
CREATE TRIGGER trg_pr_reviews_pending_count
    AFTER INSERT OR UPDATE OF current_reviewer_employee_id, status
    ON pr_periodic_reviews
    FOR EACH ROW EXECUTE FUNCTION pd_update_pending_review_count();

COMMENT ON TABLE pr_periodic_reviews IS 'Quarterly/annual performance review note. Cron creates drafts 7 days before period end.';
COMMENT ON COLUMN pr_periodic_reviews.underlying_diagnostic_run_id IS 'Link to the PD run that was used as the underlying analysis for this review period.';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 009
-- ═══════════════════════════════════════════════════════════════
