-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 054: Advisory Workbench — Client Share Links (generalized)
--
-- Closes the "no client-delivery mechanism" gap in Periodic Review,
-- Client Orientation and Investment Proposal — until now their client
-- deliverables only opened for an authenticated RM (browser-view-then-
-- manually-print). This generalizes Portfolio Diagnostic's signed
-- share-link pattern (pd_share_links, migration 011) across all three,
-- keyed by (module, record_id) instead of PD's diagnostic_run_id FK
-- since these are three different tables and each has exactly ONE
-- client deliverable (no per-deliverable-type column needed).
--
-- @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advisory_share_links (
  id                       BIGSERIAL PRIMARY KEY,
  module                   TEXT NOT NULL CHECK (module IN ('periodic_review','client_orientation','investment_proposal')),
  record_id                BIGINT NOT NULL,
  token                    TEXT NOT NULL UNIQUE,
  created_by_employee_id   BIGINT REFERENCES employees(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ NOT NULL,
  revoked_at               TIMESTAMPTZ,
  first_opened_at          TIMESTAMPTZ,
  last_opened_at           TIMESTAMPTZ,
  open_count               INTEGER NOT NULL DEFAULT 0,
  recipient_emails         TEXT[] NOT NULL DEFAULT '{}',
  workflow_event_id        BIGINT REFERENCES agent_workflow_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_advisory_share_links_token      ON advisory_share_links(token);
CREATE INDEX IF NOT EXISTS idx_advisory_share_links_record     ON advisory_share_links(module, record_id);
CREATE INDEX IF NOT EXISTS idx_advisory_share_links_created_at ON advisory_share_links(created_at DESC);

ALTER TABLE advisory_share_links ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  advisory_share_links             IS 'Signed share tokens for Periodic Review / Client Orientation / Investment Proposal client deliverables. The doc-serving routes accept ?token=... as an alternate auth path for unauthenticated clients.';
COMMENT ON COLUMN advisory_share_links.record_id   IS 'Row id in the module''s own table (pr_periodic_reviews / co_client_orientations / ip_investment_proposals) — polymorphic, no FK since it spans 3 tables.';
COMMENT ON COLUMN advisory_share_links.expires_at  IS 'Token stops working after this time. Default 90 days from issue (configured in app).';
COMMENT ON COLUMN advisory_share_links.revoked_at  IS 'If set, the token is dead immediately regardless of expires_at.';
COMMENT ON COLUMN advisory_share_links.open_count  IS 'Incremented every time the client opens the shared link. Engagement signal for the RM.';
