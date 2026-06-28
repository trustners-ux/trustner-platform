-- 046: Free Portfolio Check — public lead-magnet submissions
-- Stores the parsed teaser + minimal holdings so an RM can convert the lead
-- into a full PD run without asking the prospect to re-upload.
-- Idempotent.

CREATE TABLE IF NOT EXISTS pd_free_checks (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  mobile        VARCHAR(15)  NOT NULL,
  email         VARCHAR(160),
  consent       JSONB,                      -- DPDP consent record {given, version, timestamp, ip}
  teaser        JSONB,                      -- what we showed the prospect
  holdings      JSONB,                      -- minimal parsed holdings (fund, value, invested) — NO folio numbers
  investor_name VARCHAR(160),               -- name parsed from the statement (may differ from lead name)
  status        VARCHAR(20) DEFAULT 'NEW',  -- NEW | CONTACTED | CONVERTED | CLOSED
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pd_free_checks_status ON pd_free_checks(status, created_at DESC);
