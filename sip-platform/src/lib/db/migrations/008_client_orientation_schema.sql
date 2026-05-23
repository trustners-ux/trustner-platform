-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER CLIENT ORIENTATION AGENT — Schema
-- Version: 1.0 | Date: 2026-05-23
-- ═══════════════════════════════════════════════════════════════
-- One-time onboarding pack for a new client family: welcome
-- letter, risk profile, goal statement. Reuses shared platform
-- tables. All tables prefixed `co_`.
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE co_goal_type AS ENUM (
        'Retirement', 'Child Education', 'Child Marriage', 'House Purchase',
        'House Down Payment', 'Vacation', 'Emergency Fund', 'Wealth Creation',
        'Business Capital', 'Other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 1. CLIENT ORIENTATION (top-level workflow object) ────────

CREATE TABLE IF NOT EXISTS co_client_orientations (
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

    -- Client context
    family_name VARCHAR(200) NOT NULL,

    -- Risk profile result (computed from 15-question questionnaire)
    risk_score INT,                                     -- 0-100
    risk_category VARCHAR(30),                          -- 'Conservative' .. 'Very Aggressive'
    risk_questionnaire_completed_at TIMESTAMPTZ,

    -- Income / cash flow profile
    monthly_household_income_inr BIGINT,
    monthly_household_expenses_inr BIGINT,
    monthly_existing_sips_inr BIGINT,
    monthly_emis_inr BIGINT,
    emergency_fund_months NUMERIC(4,1),                 -- 0-12+
    surplus_for_new_sips_inr BIGINT,                    -- computed

    -- Family fit
    num_dependents INT DEFAULT 0,
    horizon_decision_maker VARCHAR(200),                -- 'Self' / 'Spouse jointly' etc
    investment_experience_years NUMERIC(4,1),
    prior_advisor_experience TEXT,

    -- Communication preferences
    pref_channel VARCHAR(20),                           -- 'Email' | 'WhatsApp' | 'Phone' | 'In-Person'
    pref_review_frequency VARCHAR(20),                  -- 'Quarterly' | 'Half-Yearly' | 'Annual'
    pref_language VARCHAR(20) DEFAULT 'English',

    -- Output PDFs
    welcome_pack_pdf_url TEXT,
    risk_profile_pdf_url TEXT,
    goal_statement_pdf_url TEXT,

    -- Delivery
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,
    client_signed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_orient_status ON co_client_orientations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_co_orient_family ON co_client_orientations(family_id);
CREATE INDEX IF NOT EXISTS idx_co_orient_uploader ON co_client_orientations(uploaded_by_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_co_orient_reviewer ON co_client_orientations(current_reviewer_employee_id, status);

-- ─── 2. RISK QUESTIONNAIRE RESPONSES ──────────────────────────

CREATE TABLE IF NOT EXISTS co_risk_responses (
    id SERIAL PRIMARY KEY,
    orientation_id INT NOT NULL REFERENCES co_client_orientations(id) ON DELETE CASCADE,
    question_code VARCHAR(20) NOT NULL,                 -- 'Q01' .. 'Q15'
    question_text TEXT NOT NULL,
    response_text TEXT,                                 -- selected option label
    response_score INT,                                 -- numeric score for risk calc
    response_order INT,                                 -- 1-5 typically
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_risk_orient
    ON co_risk_responses(orientation_id, question_code);

-- ─── 3. FINANCIAL GOALS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS co_goals (
    id SERIAL PRIMARY KEY,
    orientation_id INT NOT NULL REFERENCES co_client_orientations(id) ON DELETE CASCADE,
    goal_type co_goal_type NOT NULL,
    custom_goal_name VARCHAR(200),
    target_year INT NOT NULL,
    target_corpus_today_value_inr BIGINT NOT NULL,
    inflation_assumption_pct NUMERIC(4,2) DEFAULT 7.0,
    target_corpus_future_value_inr BIGINT,              -- inflated to target_year
    expected_return_pct NUMERIC(4,2) DEFAULT 12.0,
    required_monthly_sip_inr INT,                       -- computed
    existing_corpus_inr BIGINT DEFAULT 0,
    priority VARCHAR(10),                               -- 'High' | 'Medium' | 'Low'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_goals_orient
    ON co_goals(orientation_id, target_year);

-- ─── TRIGGERS ──────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_co_orient_updated_at ON co_client_orientations;
CREATE TRIGGER trg_co_orient_updated_at
    BEFORE UPDATE ON co_client_orientations
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_co_orient_pending_count ON co_client_orientations;
CREATE TRIGGER trg_co_orient_pending_count
    AFTER INSERT OR UPDATE OF current_reviewer_employee_id, status
    ON co_client_orientations
    FOR EACH ROW EXECUTE FUNCTION pd_update_pending_review_count();

COMMENT ON TABLE co_client_orientations IS 'New-client onboarding pack — one per family per onboarding event.';
COMMENT ON COLUMN co_client_orientations.welcome_pack_pdf_url IS 'NULL until status=PUBLISHED.';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 008
-- ═══════════════════════════════════════════════════════════════
