-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER INVESTMENT PROPOSAL AGENT — Schema
-- Version: 1.0 | Date: 2026-05-23
-- ═══════════════════════════════════════════════════════════════
-- Schema for the Investment Proposal agent. Generates client-facing
-- proposal PDFs for new investments or SIP step-ups. Reuses shared
-- platform tables (pd_client_families, pd_family_entities, pd_roles,
-- pd_employee_roles, employees, pd_fund_master, pd_workflow_events).
-- All tables prefixed `ip_`.
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE ip_proposal_purpose AS ENUM (
        'New Investment', 'SIP Step-Up', 'Lump Sum Top-Up',
        'Goal-Based Plan', 'Tax-Saver (ELSS)', 'Other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ip_risk_profile AS ENUM (
        'Conservative', 'Moderate', 'Moderately Aggressive', 'Aggressive', 'Very Aggressive'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ip_horizon_band AS ENUM (
        '< 1 year', '1-3 years', '3-5 years', '5-7 years', '7-10 years', '> 10 years'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 1. INVESTMENT PROPOSALS (top-level workflow object) ─────

CREATE TABLE IF NOT EXISTS ip_investment_proposals (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    family_id INT NOT NULL REFERENCES pd_client_families(id),
    methodology_version VARCHAR(10) NOT NULL DEFAULT '1.0.0',

    -- Workflow (same state machine as pd_)
    status pd_workflow_status NOT NULL DEFAULT 'DRAFT',
    uploaded_by_employee_id INT NOT NULL REFERENCES employees(id),
    current_reviewer_employee_id INT REFERENCES employees(id),
    approved_by_employee_id INT REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Client context
    family_name VARCHAR(200) NOT NULL,
    primary_entity_id INT REFERENCES pd_family_entities(id),

    -- Proposal context
    purpose ip_proposal_purpose NOT NULL,
    custom_purpose_note TEXT,
    proposed_amount_inr BIGINT NOT NULL,                -- one-time + 12mo SIP equivalent
    proposed_lump_sum_inr BIGINT DEFAULT 0,
    proposed_monthly_sip_inr INT DEFAULT 0,
    horizon ip_horizon_band NOT NULL,
    risk_profile ip_risk_profile NOT NULL,
    goal_statement TEXT,                                -- "Daughter's UG education in 2034"

    -- Recommended allocation (% of proposed_amount_inr)
    alloc_large_cap_pct NUMERIC(5,2) DEFAULT 0,
    alloc_mid_cap_pct NUMERIC(5,2) DEFAULT 0,
    alloc_small_cap_pct NUMERIC(5,2) DEFAULT 0,
    alloc_flexi_cap_pct NUMERIC(5,2) DEFAULT 0,
    alloc_multi_cap_pct NUMERIC(5,2) DEFAULT 0,
    alloc_large_and_mid_pct NUMERIC(5,2) DEFAULT 0,
    alloc_hybrid_pct NUMERIC(5,2) DEFAULT 0,
    alloc_debt_pct NUMERIC(5,2) DEFAULT 0,
    alloc_international_pct NUMERIC(5,2) DEFAULT 0,
    alloc_gold_pct NUMERIC(5,2) DEFAULT 0,

    -- Expected outcomes (3 scenarios)
    expected_5y_conservative_inr BIGINT,
    expected_5y_base_inr BIGINT,
    expected_5y_optimistic_inr BIGINT,
    expected_10y_base_inr BIGINT,

    -- Tax efficiency
    expected_ltcg_at_5y_inr BIGINT,
    elss_savings_inr BIGINT DEFAULT 0,                  -- if includes ELSS, calculate 80C benefit

    -- Output PDFs (only after PUBLISH)
    proposal_pdf_url TEXT,
    risk_disclosure_pdf_url TEXT,

    -- Delivery
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,

    -- Client sign-off
    client_signed_at TIMESTAMPTZ,
    client_signature_blob_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_proposals_status
    ON ip_investment_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_proposals_family
    ON ip_investment_proposals(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_proposals_uploader
    ON ip_investment_proposals(uploaded_by_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_ip_proposals_reviewer
    ON ip_investment_proposals(current_reviewer_employee_id, status);

-- ─── 2. PROPOSAL RECOMMENDATIONS (specific fund-by-fund picks) ──

CREATE TABLE IF NOT EXISTS ip_proposal_recommendations (
    id SERIAL PRIMARY KEY,
    proposal_id INT NOT NULL REFERENCES ip_investment_proposals(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    amfi_code VARCHAR(20) REFERENCES pd_fund_master(amfi_code),
    fund_name VARCHAR(300) NOT NULL,
    category VARCHAR(50),

    -- Allocation
    allocation_pct NUMERIC(5,2) NOT NULL,
    allocation_inr BIGINT NOT NULL,
    instrument_type VARCHAR(20),                        -- 'Lump Sum' | 'Monthly SIP' | 'Both'
    monthly_sip_inr INT DEFAULT 0,
    lump_sum_inr BIGINT DEFAULT 0,

    -- Why this fund
    rationale TEXT,                                     -- 1-2 line per-fund rationale
    cagr_3y_at_recommendation NUMERIC(5,2),
    cagr_5y_at_recommendation NUMERIC(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_recs_proposal
    ON ip_proposal_recommendations(proposal_id, order_index);

-- ─── TRIGGERS ──────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_ip_proposals_updated_at ON ip_investment_proposals;
CREATE TRIGGER trg_ip_proposals_updated_at
    BEFORE UPDATE ON ip_investment_proposals
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_ip_proposals_pending_count ON ip_investment_proposals;
CREATE TRIGGER trg_ip_proposals_pending_count
    AFTER INSERT OR UPDATE OF current_reviewer_employee_id, status
    ON ip_investment_proposals
    FOR EACH ROW EXECUTE FUNCTION pd_update_pending_review_count();

-- ─── COMMENTS ──────────────────────────────────────────────────

COMMENT ON TABLE ip_investment_proposals IS 'Investment proposal — client-facing. Requires client signoff before publish-to-delivery.';
COMMENT ON COLUMN ip_investment_proposals.proposal_pdf_url IS 'NULL until status=PUBLISHED. Generated from Handlebars template.';
COMMENT ON COLUMN ip_investment_proposals.client_signed_at IS 'Set when client digitally signs (DigiLocker / DocuSign / paper-then-uploaded).';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 007
-- ═══════════════════════════════════════════════════════════════
