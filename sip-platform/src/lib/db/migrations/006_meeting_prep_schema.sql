-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER MEETING PREP AGENT — Schema
-- Version: 1.0 | Date: 2026-05-23
-- Database: PostgreSQL (Supabase)
-- ═══════════════════════════════════════════════════════════════
--
-- Schema for the Meeting Prep Brief agent. Reuses shared platform
-- tables (pd_client_families, pd_family_entities, pd_roles,
-- pd_employee_roles, employees). Adds Meeting-Prep-specific tables
-- prefixed with `mp_`.
--
-- All Meeting Prep runs share the same workflow state machine,
-- audit log, and role gates as Portfolio Diagnostic.
-- ═══════════════════════════════════════════════════════════════

-- ─── ENUM TYPES (specific to Meeting Prep) ─────────────────────

DO $$ BEGIN
    CREATE TYPE mp_meeting_purpose AS ENUM (
        'Quarterly Review', 'Annual Review', 'New Investment Discussion',
        'SIP Step-Up', 'Grievance / Concern', 'Onboarding Kickoff',
        'Retention Conversation', 'Family Wealth Planning', 'Other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mp_meeting_format AS ENUM (
        'In-Person', 'Phone', 'Video', 'WhatsApp'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mp_action_status AS ENUM (
        'Open', 'In Progress', 'Blocked', 'Completed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mp_opportunity_priority AS ENUM (
        'High', 'Medium', 'Low'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 1. MEETING PREP BRIEFS (top-level) ───────────────────────

CREATE TABLE IF NOT EXISTS mp_meeting_briefs (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    family_id INT NOT NULL REFERENCES pd_client_families(id),

    -- Workflow (mirrors pd_diagnostic_runs)
    status pd_workflow_status NOT NULL DEFAULT 'DRAFT',
    uploaded_by_employee_id INT NOT NULL REFERENCES employees(id),
    current_reviewer_employee_id INT REFERENCES employees(id),
    approved_by_employee_id INT REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Meeting context
    meeting_scheduled_at TIMESTAMPTZ NOT NULL,
    meeting_duration_minutes INT DEFAULT 60,
    meeting_format mp_meeting_format NOT NULL DEFAULT 'In-Person',
    meeting_purpose mp_meeting_purpose NOT NULL,
    custom_purpose_note TEXT,
    primary_attendees TEXT[],           -- names of client + family attendees
    trustner_attendee_ids INT[],        -- employee IDs attending
    meeting_location TEXT,

    -- Family snapshot
    family_name VARCHAR(200) NOT NULL,

    -- Section 1: Relationship Snapshot
    client_since_date DATE,
    years_with_trustner NUMERIC(4,1),
    last_meeting_date DATE,
    last_meeting_purpose mp_meeting_purpose,
    relationship_quality_score INT CHECK (relationship_quality_score BETWEEN 1 AND 5),
    relationship_notes TEXT,

    -- Section 2: Portfolio Current State (denormalised at brief-time)
    total_aum_inr BIGINT,
    total_invested_inr BIGINT,
    unrealised_gain_inr BIGINT,
    family_xirr_pct NUMERIC(5,2),
    num_holdings INT,
    num_active_sips INT,
    monthly_sip_flow_inr BIGINT,
    last_diagnostic_date DATE,
    last_diagnostic_run_id INT REFERENCES pd_diagnostic_runs(id),

    -- Output PDF (only on PUBLISHED)
    briefing_pack_pdf_url TEXT,
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_briefs_status
    ON mp_meeting_briefs(status, meeting_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_mp_briefs_family
    ON mp_meeting_briefs(family_id, meeting_scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_briefs_uploader
    ON mp_meeting_briefs(uploaded_by_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_mp_briefs_reviewer
    ON mp_meeting_briefs(current_reviewer_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_mp_briefs_upcoming
    ON mp_meeting_briefs(meeting_scheduled_at)
    WHERE status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED');

-- ─── 2. RECENT TRANSACTIONS (Section 3) ────────────────────────

CREATE TABLE IF NOT EXISTS mp_recent_transactions (
    id SERIAL PRIMARY KEY,
    brief_id INT NOT NULL REFERENCES mp_meeting_briefs(id) ON DELETE CASCADE,
    entity_id INT REFERENCES pd_family_entities(id),
    txn_date DATE NOT NULL,
    entity_name VARCHAR(200),
    fund_name VARCHAR(300),
    txn_type VARCHAR(20),
    amount_inr BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_txns_brief
    ON mp_recent_transactions(brief_id, txn_date DESC);

-- ─── 3. OPEN ACTION ITEMS (Section 4) ──────────────────────────
-- Carries forward from prior meetings. Auto-populated from prior
-- briefs' published action items.

CREATE TABLE IF NOT EXISTS mp_action_items (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES pd_client_families(id),
    brief_id INT REFERENCES mp_meeting_briefs(id) ON DELETE SET NULL,
    from_meeting_date DATE NOT NULL,
    description TEXT NOT NULL,
    owner VARCHAR(20),                  -- 'Client' | 'RM' | 'Both'
    status mp_action_status NOT NULL DEFAULT 'Open',
    due_date DATE,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by_employee_id INT REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_actions_family_open
    ON mp_action_items(family_id, status)
    WHERE status IN ('Open', 'In Progress', 'Blocked');

-- ─── 4. MARKET CONTEXT POINTS (Section 5) ──────────────────────

CREATE TABLE IF NOT EXISTS mp_market_context_points (
    id SERIAL PRIMARY KEY,
    brief_id INT NOT NULL REFERENCES mp_meeting_briefs(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    topic VARCHAR(200) NOT NULL,
    bullet TEXT NOT NULL,
    relevance_to_client TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_market_brief
    ON mp_market_context_points(brief_id, order_index);

-- ─── 5. TALKING POINTS (Section 6) ─────────────────────────────

CREATE TABLE IF NOT EXISTS mp_talking_points (
    id SERIAL PRIMARY KEY,
    brief_id INT NOT NULL REFERENCES mp_meeting_briefs(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    point TEXT NOT NULL,
    intent VARCHAR(20),                 -- 'Inform' | 'Discuss' | 'Decide' | 'Confirm'
    estimated_minutes INT,
    supporting_data_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_talking_brief
    ON mp_talking_points(brief_id, order_index);

-- ─── 6. ANTICIPATED Q&A (Section 7) ────────────────────────────

CREATE TABLE IF NOT EXISTS mp_anticipated_qa (
    id SERIAL PRIMARY KEY,
    brief_id INT NOT NULL REFERENCES mp_meeting_briefs(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    question TEXT NOT NULL,
    prepared_answer TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_qa_brief
    ON mp_anticipated_qa(brief_id, order_index);

-- ─── 7. OPPORTUNITIES (Section 8) ──────────────────────────────

CREATE TABLE IF NOT EXISTS mp_opportunities (
    id SERIAL PRIMARY KEY,
    brief_id INT NOT NULL REFERENCES mp_meeting_briefs(id) ON DELETE CASCADE,
    category VARCHAR(50),
    description TEXT NOT NULL,
    estimated_ticket_size_inr BIGINT,
    rationale TEXT,
    priority mp_opportunity_priority,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_opps_brief
    ON mp_opportunities(brief_id);

-- ─── TRIGGERS ──────────────────────────────────────────────────

-- Reuse the generic updated_at function from migration 004
DROP TRIGGER IF EXISTS trg_mp_briefs_updated_at ON mp_meeting_briefs;
CREATE TRIGGER trg_mp_briefs_updated_at
    BEFORE UPDATE ON mp_meeting_briefs
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

DROP TRIGGER IF EXISTS trg_mp_actions_updated_at ON mp_action_items;
CREATE TRIGGER trg_mp_actions_updated_at
    BEFORE UPDATE ON mp_action_items
    FOR EACH ROW EXECUTE FUNCTION pd_set_updated_at();

-- Reuse the pending_review_count trigger pattern
DROP TRIGGER IF EXISTS trg_mp_briefs_pending_count ON mp_meeting_briefs;
CREATE TRIGGER trg_mp_briefs_pending_count
    AFTER INSERT OR UPDATE OF current_reviewer_employee_id, status
    ON mp_meeting_briefs
    FOR EACH ROW EXECUTE FUNCTION pd_update_pending_review_count();

-- ─── COMMENTS ──────────────────────────────────────────────────

COMMENT ON TABLE mp_meeting_briefs IS 'Pre-meeting briefing pack — INTERNAL output for the RM. Same workflow as portfolio diagnostic but does not require client signoff.';
COMMENT ON COLUMN mp_meeting_briefs.briefing_pack_pdf_url IS 'NULL until status=PUBLISHED. Delivered to RM only (not client).';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 006
-- ═══════════════════════════════════════════════════════════════
