-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 011: Portfolio Diagnostic — Signed Share Links
--
-- Purpose: when a planner shares a deliverable with a client via email,
-- the embedded URL must work for a recipient who has NO admin/employee
-- session. We mint a per-deliverable, per-share random token bound to
-- the run + deliverable type + expiry. The /report endpoint accepts the
-- token as an alternate authentication path.
--
-- Why this matters:
--   - URLs are not guessable (32-char random token)
--   - Each share gets fresh tokens (no permanent public access)
--   - Tokens are revocable (set revoked_at to null'ify them)
--   - Engagement is trackable (first_opened_at + open_count)
--
-- @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pd_share_links (
  id                       BIGSERIAL PRIMARY KEY,
  diagnostic_run_id        BIGINT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,
  deliverable_id           TEXT NOT NULL CHECK (deliverable_id IN ('one-pager','full','three-pager','action','xlsx','pptx')),
  token                    TEXT NOT NULL UNIQUE,
  created_by_employee_id   BIGINT REFERENCES employees(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ NOT NULL,
  revoked_at               TIMESTAMPTZ,
  first_opened_at          TIMESTAMPTZ,
  last_opened_at           TIMESTAMPTZ,
  open_count               INTEGER NOT NULL DEFAULT 0,
  recipient_emails         TEXT[] NOT NULL DEFAULT '{}',  -- audit: who this link was sent to
  share_event_id           BIGINT REFERENCES pd_workflow_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pd_share_links_token        ON pd_share_links(token);
CREATE INDEX IF NOT EXISTS idx_pd_share_links_run          ON pd_share_links(diagnostic_run_id);
CREATE INDEX IF NOT EXISTS idx_pd_share_links_created_at   ON pd_share_links(created_at DESC);

COMMENT ON TABLE  pd_share_links               IS 'Signed share tokens issued per (diagnostic, deliverable) when a planner shares with a client. Allows the /report endpoint to authenticate unauthenticated clients via ?token=...';
COMMENT ON COLUMN pd_share_links.token         IS '32-char random token; included in the email link as ?token=... Validated by the report endpoint as an alternate auth path.';
COMMENT ON COLUMN pd_share_links.expires_at    IS 'Token stops working after this time. Default 90 days from issue (configured in app).';
COMMENT ON COLUMN pd_share_links.revoked_at    IS 'If set, the token is dead immediately regardless of expires_at. Use to manually kill a leaked link.';
COMMENT ON COLUMN pd_share_links.open_count    IS 'Incremented every time the client opens this report. Engagement signal for the planner.';
