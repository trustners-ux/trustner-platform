-- ─────────────────────────────────────────────────────────────────────────────
-- 030 — Service Requests + Document OCR (Phase C)
--
-- Two pieces of work:
--   1. client_service_requests — client-raised tickets routed to admin queue
--   2. client_document_replies + ocr_status column on client_documents
--      → adds review workflow + OCR pipeline state machine
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Enums ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE service_request_category AS ENUM (
    'address_change',
    'contact_update',
    'nominee_change',
    'kyc_update',
    'statement_request',
    'withdrawal_request',
    'bank_change',
    'sip_change',
    'redemption_request',
    'complaint',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_request_status AS ENUM (
    'open',
    'in_progress',
    'waiting_on_client',
    'resolved',
    'cancelled',
    'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_request_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_ocr_status AS ENUM ('not_started', 'queued', 'running', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. client_service_requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_service_requests (
  id                          BIGSERIAL PRIMARY KEY,
  ticket_code                 TEXT NOT NULL UNIQUE,
  client_id                   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category                    service_request_category NOT NULL,
  subject                     TEXT NOT NULL,
  description                 TEXT,
  status                      service_request_status NOT NULL DEFAULT 'open',
  priority                    service_request_priority NOT NULL DEFAULT 'normal',
  assigned_to_user_id         INTEGER,
  assigned_to_email           TEXT,
  resolution_notes            TEXT,
  resolved_at                 TIMESTAMPTZ,
  resolved_by_user_id         INTEGER,
  -- Where was the request raised from
  raised_via                  TEXT NOT NULL DEFAULT 'portal'
                              CHECK (raised_via IN ('portal','phone','email','whatsapp','admin')),
  raised_by_user_id           INTEGER,
  -- Activity bookkeeping
  last_activity_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csr_client   ON client_service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_csr_status   ON client_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_csr_assigned ON client_service_requests(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_csr_category ON client_service_requests(category);
CREATE INDEX IF NOT EXISTS idx_csr_last_act ON client_service_requests(last_activity_at DESC);

DROP TRIGGER IF EXISTS trg_csr_touch ON client_service_requests;
CREATE TRIGGER trg_csr_touch BEFORE UPDATE ON client_service_requests
FOR EACH ROW EXECUTE FUNCTION _touch_updated_at();

-- Ticket code allocator (TIB-SR-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS service_request_seq START 1001;

CREATE OR REPLACE FUNCTION generate_service_request_code() RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'TIB-SR-' || lpad(nextval('service_request_seq')::text, 6, '0');
END;
$$;

ALTER TABLE client_service_requests
  ALTER COLUMN ticket_code SET DEFAULT generate_service_request_code();

-- ── 3. Threaded replies / activity log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_service_request_replies (
  id                          BIGSERIAL PRIMARY KEY,
  request_id                  BIGINT NOT NULL
                              REFERENCES client_service_requests(id) ON DELETE CASCADE,
  -- Who wrote it
  author_kind                 TEXT NOT NULL CHECK (author_kind IN ('client','admin','system')),
  author_user_id              INTEGER,
  author_portal_user_id       BIGINT,
  author_display_name         TEXT,
  -- Body
  body                        TEXT NOT NULL,
  -- Optional state-transition this reply triggered
  status_changed_to           service_request_status,
  -- Attachments (Supabase Storage keys)
  attachments                 JSONB,
  is_internal_note            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csrr_request ON client_service_request_replies(request_id);
CREATE INDEX IF NOT EXISTS idx_csrr_created ON client_service_request_replies(created_at);

-- ── 4. Extend client_documents with OCR + uploader provenance ────────────────
DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN ocr_status doc_ocr_status NOT NULL DEFAULT 'not_started';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN ocr_attempted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN ocr_completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN ocr_error TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Mismatch flags after OCR — e.g. {"pan_mismatch": true, "name_mismatch": false}
DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN ocr_mismatch_flags JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Whether the client (vs admin) uploaded this doc
DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN uploaded_by_portal_user_id BIGINT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE client_documents ADD COLUMN uploaded_via TEXT NOT NULL DEFAULT 'admin'
    CHECK (uploaded_via IN ('admin', 'portal', 'api', 'bulk_import'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_cd_ocr_status ON client_documents(ocr_status);
CREATE INDEX IF NOT EXISTS idx_cd_uploaded_via ON client_documents(uploaded_via);
