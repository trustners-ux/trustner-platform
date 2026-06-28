-- ─────────────────────────────────────────────────────────────────────────────
-- 027 — Client Master (Phase A)
--
-- Adapted from the Trustner client-master spec (P12.1–P12.5). Native Postgres
-- this time, not SQLite. Used by /admin/clients (CRM) and Bulk Import wizard.
--
-- 5 tables:
--   1. clients              — full client profile + KYC + contacts
--   2. client_documents     — KYC docs (Aadhaar, PAN, etc.) stored in Supabase
--                             Storage bucket 'client-docs'
--   3. client_relationships — graph: spouse, son, daughter, parent...
--   4. families             — logical family unit (head + members)
--   5. family_members       — clients × families × role
--
-- DPDPA / Aadhaar safety: NEVER store full Aadhaar at rest.
--   - aadhaar_last4   = last 4 digits, plain
--   - aadhaar_hash    = sha256 of the full 12 digits (for dedup checks)
--   - Display always shows "XXXX-XXXX-1234"
--
-- Consent model (4-way per DPDPA): whatsapp/sms/email/marketing opt-in flags
-- with consent_log JSONB recording WHEN + HOW + BY WHOM each was given.
--
-- Code prefixes: MSI-CL-NNNNNNN / MSI-FAM-NNNNNN (allocated via sequences).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Sequences for code allocation ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS clients_code_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS families_code_seq START 101;

CREATE OR REPLACE FUNCTION generate_client_code() RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'MSI-CL-' || lpad(nextval('clients_code_seq')::text, 7, '0');
END;
$$;

CREATE OR REPLACE FUNCTION generate_family_code() RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'MSI-FAM-' || lpad(nextval('families_code_seq')::text, 6, '0');
END;
$$;

-- ── 2. Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE client_gender         AS ENUM ('M', 'F', 'O', 'U');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_marital_status AS ENUM ('single','married','divorced','widowed','separated','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_residential_status AS ENUM ('resident','nri','foreign_national','pio','oci');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_kyc_status     AS ENUM ('pending','in_progress','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_risk_profile   AS ENUM ('conservative','moderate','aggressive','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_onboarded_via  AS ENUM ('rm','partner','posp','self','bulk_import','walk_in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_status         AS ENUM ('active','inactive','dormant','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_id_verif_status AS ENUM ('unverified','verified','invalid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_doc_type       AS ENUM (
    'aadhaar','pan','passport','driving_license','voter_id',
    'photo','signature',
    'address_proof_current','address_proof_permanent',
    'income_proof','bank_proof','cancelled_cheque',
    'gst_certificate','incorporation_certificate','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_doc_verif_status AS ENUM ('pending','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE family_role           AS ENUM ('head','spouse','child','parent','grandparent','sibling','other_dependent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. clients — the master ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                              BIGSERIAL PRIMARY KEY,
  code                            TEXT NOT NULL UNIQUE DEFAULT generate_client_code(),

  -- Name
  first_name                      TEXT NOT NULL,
  middle_name                     TEXT,
  last_name                       TEXT NOT NULL,
  display_name                    TEXT NOT NULL,
  salutation                      TEXT,
  gender                          client_gender NOT NULL DEFAULT 'U',
  dob                             DATE,
  age_years                       INTEGER,
  marital_status                  client_marital_status NOT NULL DEFAULT 'unknown',

  -- KYC identifiers (DPDPA-safe Aadhaar)
  pan                             TEXT,
  pan_status                      client_id_verif_status,
  aadhaar_last4                   TEXT CHECK (aadhaar_last4 IS NULL OR length(aadhaar_last4) = 4),
  aadhaar_hash                    TEXT,
  aadhaar_status                  client_id_verif_status,

  -- Contact
  mobile_primary                  TEXT,
  mobile_alt                      TEXT,
  email_primary                   TEXT,
  email_alt                       TEXT,

  -- Current address
  addr_current_line1              TEXT,
  addr_current_line2              TEXT,
  addr_current_city               TEXT,
  addr_current_state              TEXT,
  addr_current_pincode            TEXT,
  addr_current_country            TEXT NOT NULL DEFAULT 'India',

  -- Permanent address (optional override)
  addr_permanent_same_as_current  BOOLEAN NOT NULL DEFAULT TRUE,
  addr_permanent_line1            TEXT,
  addr_permanent_line2            TEXT,
  addr_permanent_city             TEXT,
  addr_permanent_state            TEXT,
  addr_permanent_pincode          TEXT,
  addr_permanent_country          TEXT,

  -- Profile
  residential_status              client_residential_status NOT NULL DEFAULT 'resident',
  occupation                      TEXT,
  employer                        TEXT,
  annual_income_band              TEXT,
  risk_profile                    client_risk_profile NOT NULL DEFAULT 'unknown',

  -- Onboarding provenance (plain INTEGER — no FK so users-table shape can vary)
  onboarded_via                   client_onboarded_via NOT NULL DEFAULT 'rm',
  onboarded_by_user_id            INTEGER,
  onboarded_by_partner_id         INTEGER,
  onboarded_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- KYC review
  kyc_status                      client_kyc_status NOT NULL DEFAULT 'pending',
  kyc_last_reviewed_at            TIMESTAMPTZ,
  kyc_last_reviewed_by_user_id    INTEGER,
  kyc_remarks                     TEXT,

  -- Portal (when we ship Phase B portal)
  portal_user_id                  INTEGER,

  -- DPDPA consent
  whatsapp_opt_in                 BOOLEAN NOT NULL DEFAULT FALSE,
  sms_opt_in                      BOOLEAN NOT NULL DEFAULT FALSE,
  email_opt_in                    BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opt_in                BOOLEAN NOT NULL DEFAULT FALSE,
  consent_log                     JSONB,

  preferred_language              TEXT NOT NULL DEFAULT 'en',

  status                          client_status NOT NULL DEFAULT 'active',

  tags                            TEXT,
  notes                           TEXT,
  metadata                        JSONB,

  created_by_user_id              INTEGER,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_kyc        ON clients(kyc_status);
CREATE INDEX IF NOT EXISTS idx_clients_mobile     ON clients(mobile_primary);
CREATE INDEX IF NOT EXISTS idx_clients_mobile_alt ON clients(mobile_alt);
CREATE INDEX IF NOT EXISTS idx_clients_email      ON clients(email_primary);
CREATE INDEX IF NOT EXISTS idx_clients_pan        ON clients(pan);
CREATE INDEX IF NOT EXISTS idx_clients_aadhaar    ON clients(aadhaar_hash);
CREATE INDEX IF NOT EXISTS idx_clients_name       ON clients(display_name);
CREATE INDEX IF NOT EXISTS idx_clients_onboarder  ON clients(onboarded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_partner    ON clients(onboarded_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_clients_portal     ON clients(portal_user_id);

-- GIN index on metadata for source-platform-code lookups (Wealth Elite IWELL code)
CREATE INDEX IF NOT EXISTS idx_clients_metadata_gin ON clients USING GIN (metadata jsonb_path_ops);

-- ── 4. client_documents ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_documents (
  id                          BIGSERIAL PRIMARY KEY,
  client_id                   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  doc_type                    client_doc_type NOT NULL,
  file_name                   TEXT NOT NULL,
  file_size_bytes             BIGINT NOT NULL,
  file_mime                   TEXT NOT NULL,
  file_sha256                 TEXT NOT NULL,
  -- storage_key is the Supabase Storage path: client-docs/<client_id>/<doc_type>/<sha256>.<ext>
  storage_key                 TEXT NOT NULL,
  ocr_text                    TEXT,
  ocr_extracted_fields        JSONB,
  verification_status         client_doc_verif_status NOT NULL DEFAULT 'pending',
  verified_by_user_id         INTEGER,
  verified_at                 TIMESTAMPTZ,
  rejected_reason             TEXT,
  expiry_date                 DATE,
  uploaded_by_user_id         INTEGER,
  uploaded_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                       TEXT
);

CREATE INDEX IF NOT EXISTS idx_cd_client    ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_cd_doctype   ON client_documents(client_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_cd_status    ON client_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_cd_sha       ON client_documents(file_sha256);

-- ── 5. client_relationships — directed graph ─────────────────────────────────
CREATE TABLE IF NOT EXISTS client_relationships (
  id                          BIGSERIAL PRIMARY KEY,
  from_client_id              BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  to_client_id                BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  relationship_type           TEXT NOT NULL,
  is_dependent                BOOLEAN NOT NULL DEFAULT FALSE,
  notes                       TEXT,
  created_by_user_id          INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_client_id <> to_client_id),
  UNIQUE (from_client_id, to_client_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_cr_from ON client_relationships(from_client_id);
CREATE INDEX IF NOT EXISTS idx_cr_to   ON client_relationships(to_client_id);

-- ── 6. families ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS families (
  id                          BIGSERIAL PRIMARY KEY,
  code                        TEXT NOT NULL UNIQUE DEFAULT generate_family_code(),
  name                        TEXT NOT NULL,
  head_client_id              BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  description                 TEXT,
  created_by_user_id          INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fam_head ON families(head_client_id);

-- ── 7. family_members — clients × families ──────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id                          BIGSERIAL PRIMARY KEY,
  family_id                   BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  client_id                   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role                        family_role NOT NULL,
  joined_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (family_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_fm_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_fm_client ON family_members(client_id);

-- ── 8. updated_at triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_clients_touch ON clients;
CREATE TRIGGER trg_clients_touch BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION _touch_updated_at();

DROP TRIGGER IF EXISTS trg_families_touch ON families;
CREATE TRIGGER trg_families_touch BEFORE UPDATE ON families
FOR EACH ROW EXECUTE FUNCTION _touch_updated_at();
