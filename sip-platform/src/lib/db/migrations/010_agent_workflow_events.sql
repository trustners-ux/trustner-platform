-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER ADVISORY WORKBENCH — Generic Cross-Agent Audit Trail
-- Version: 1.0 | Date: 2026-05-24
-- ═══════════════════════════════════════════════════════════════
-- pd_workflow_events is PD-specific (FK to pd_diagnostic_runs). The
-- Investment Proposal, Client Orientation, and Periodic Review agents
-- need their own audit trail.
--
-- This migration adds a generic agent_workflow_events table that
-- works for ANY agent — keyed by (entity_type, entity_id) so it can
-- audit ip_investment_proposals, co_client_orientations,
-- pr_periodic_reviews, mp_meeting_briefs, and any future agent.
--
-- Regulatory compliance: SEBI/AMFI inspection requires an immutable
-- maker-checker trail for every advisory artefact. This table
-- captures every state transition with actor identity and timestamp.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_workflow_events (
    id BIGSERIAL PRIMARY KEY,

    -- Entity identification (replaces PD's diagnostic_run_id FK)
    entity_type VARCHAR(50) NOT NULL,             -- 'investment_proposal' | 'client_orientation' | 'periodic_review' | 'meeting_prep' | 'portfolio_diagnostic'
    entity_id INT NOT NULL,                       -- FK to the agent's table id

    -- Actor (employee_id may be NULL for principal-bypass cases;
    -- actor_email is canonical)
    actor_employee_id INT REFERENCES employees(id),
    actor_name VARCHAR(200),
    actor_email VARCHAR(200) NOT NULL,
    actor_role VARCHAR(30),                       -- 'admin' | 'senior_reviewer' | etc. — soft-FK only

    -- Transition
    action VARCHAR(50) NOT NULL,                  -- 'CREATE' | 'SUBMIT' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'PUBLISH' | 'ESCALATE'
    from_status VARCHAR(30),                      -- nullable for CREATE
    to_status VARCHAR(30) NOT NULL,

    -- Optional context
    comment TEXT,
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_events_entity
    ON agent_workflow_events(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_actor
    ON agent_workflow_events(actor_employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_action
    ON agent_workflow_events(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_actor_email
    ON agent_workflow_events(actor_email, created_at DESC);

COMMENT ON TABLE agent_workflow_events IS
    'Immutable cross-agent audit trail for the Advisory Workbench. Captures every state transition with actor identity and timestamp. SEBI/AMFI inspection-ready.';
COMMENT ON COLUMN agent_workflow_events.entity_type IS
    'Agent name in snake_case: investment_proposal, client_orientation, periodic_review, meeting_prep, portfolio_diagnostic.';
COMMENT ON COLUMN agent_workflow_events.actor_employee_id IS
    'NULL when the actor is acting via APPROVER_EMAILS fallback without a DB employees row. actor_email is always the canonical identifier.';

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 010
-- ═══════════════════════════════════════════════════════════════
