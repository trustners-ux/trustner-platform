-- =============================================================================
-- MeraSIP S.M.A.R.T Platform — Supabase Database Schema
-- Trustner Asset Services Pvt. Ltd. | ARN-286886
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CLIENTS
-- =============================================================================
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id   UUID REFERENCES auth.users(id),
  name         TEXT NOT NULL,
  pan          TEXT,
  mobile       TEXT,
  email        TEXT,
  type         TEXT DEFAULT 'Individual',  -- Individual | HUF | Corporate | LLP | Trust
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_advisor ON clients(advisor_id);
CREATE INDEX idx_clients_pan ON clients(pan);

-- =============================================================================
-- FAMILY GROUPS
-- =============================================================================
CREATE TABLE family_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id   UUID REFERENCES auth.users(id),
  group_name   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_groups_advisor ON family_groups(advisor_id);

-- =============================================================================
-- FAMILY MEMBERS (link table)
-- =============================================================================
CREATE TABLE family_members (
  group_id     UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  relation     TEXT,    -- Primary | Spouse | Child | Associated
  color_index  INT DEFAULT 0,
  PRIMARY KEY (group_id, client_id)
);

-- =============================================================================
-- PORTFOLIO SNAPSHOTS (parsed from CAS)
-- =============================================================================
CREATE TABLE portfolios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id),
  uploaded_at  TIMESTAMPTZ DEFAULT NOW(),
  report_date  DATE,
  total_inv    NUMERIC,
  total_val    NUMERIC,
  xirr         NUMERIC,
  abs_return   NUMERIC,
  data         JSONB NOT NULL  -- Full portfolio JSON
);

CREATE INDEX idx_portfolios_client ON portfolios(client_id);
CREATE INDEX idx_portfolios_date ON portfolios(uploaded_at DESC);

-- =============================================================================
-- GENERATED REPORTS
-- =============================================================================
CREATE TABLE reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES clients(id),
  group_id       UUID REFERENCES family_groups(id),
  type           TEXT,   -- individual | family | rebalancing | tax | onepager
  pages          INT,
  pdf_url        TEXT,   -- Supabase Storage signed URL
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  sent_email     BOOLEAN DEFAULT FALSE,
  sent_whatsapp  BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_reports_client ON reports(client_id);
CREATE INDEX idx_reports_group ON reports(group_id);

-- =============================================================================
-- REVIEW QUEUE (Manager review workflow)
-- =============================================================================
CREATE TABLE review_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_mobile     TEXT,
  client_pan        TEXT,
  portfolio_data    JSONB NOT NULL,           -- Full parsed portfolio JSON
  suggested_actions JSONB,                    -- Auto-generated rebalancing suggestions
  curated_actions   JSONB,                    -- Manager-edited suggestions (after review)
  status            TEXT DEFAULT 'pending_review',  -- pending_review | in_review | approved | rejected
  reviewer_id       UUID REFERENCES auth.users(id),
  reviewer_notes    TEXT,
  report_id         UUID REFERENCES reports(id),    -- Link to generated report (after approval)
  original_upload_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_reviewer ON review_queue(reviewer_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue   ENABLE ROW LEVEL SECURITY;

-- Advisors see only their own clients
CREATE POLICY "advisor_own_clients" ON clients
  FOR ALL USING (advisor_id = auth.uid());

CREATE POLICY "advisor_own_groups" ON family_groups
  FOR ALL USING (advisor_id = auth.uid());

CREATE POLICY "advisor_own_family_members" ON family_members
  FOR ALL USING (
    group_id IN (SELECT id FROM family_groups WHERE advisor_id = auth.uid())
  );

CREATE POLICY "advisor_own_portfolios" ON portfolios
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE advisor_id = auth.uid())
  );

CREATE POLICY "advisor_own_reports" ON reports
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE advisor_id = auth.uid())
    OR group_id IN (SELECT id FROM family_groups WHERE advisor_id = auth.uid())
  );

-- Review queue: all authenticated advisors/managers can see queue items
-- (In production, restrict to manager role via app_metadata)
CREATE POLICY "authenticated_review_queue" ON review_queue
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- STORAGE BUCKET (run via Supabase dashboard or API)
-- =============================================================================
-- CREATE BUCKET: reports (public: false, file_size_limit: 50MB)
-- Policies: authenticated users can upload/read from reports bucket
