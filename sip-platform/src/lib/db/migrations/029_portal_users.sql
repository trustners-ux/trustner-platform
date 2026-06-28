-- ─────────────────────────────────────────────────────────────────────────────
-- 029 — Client Portal Users (Phase B)
--
-- The login identity for clients accessing their portal at /portal/*.
-- One portal_user maps to one client (1:1). The link is stored both on
-- this row (client_id FK) AND on clients.portal_user_id (the existing
-- column from migration 027) so navigation is fast in both directions.
--
-- Login identifier: mobile_primary in E.164 (preferred) OR email_primary.
-- We allow either / both — clients can pick whichever they prefer at
-- claim time.
--
-- Credentials:
--   - password_hash (bcrypt) — long-term login
--   - pin_hash (bcrypt of 4-digit PIN) — for transaction-time auth
--     in Phase C. Stored separately so a future "lock account" doesn't
--     wipe the PIN.
--
-- Login methods supported by /portal/login:
--   1. Mobile + OTP (default, no password needed)
--   2. Mobile + password
--   3. Email + password
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE portal_user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS portal_users (
  id                          BIGSERIAL PRIMARY KEY,
  client_id                   BIGINT NOT NULL UNIQUE
                              REFERENCES clients(id) ON DELETE CASCADE,
  -- Login identifiers — either or both may be set, exactly one is needed
  login_mobile                TEXT UNIQUE,  -- E.164 (e.g. +919xxxxxxxxx)
  login_email                 TEXT UNIQUE,
  -- Credentials
  password_hash               TEXT,
  pin_hash                    TEXT,
  -- Verification status
  mobile_verified             BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  -- Lifecycle
  status                      portal_user_status NOT NULL DEFAULT 'active',
  last_login_at               TIMESTAMPTZ,
  last_login_ip               TEXT,
  last_login_user_agent       TEXT,
  -- Audit
  claimed_via_invite_id       BIGINT REFERENCES client_portal_invites(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (login_mobile IS NOT NULL OR login_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_pu_client   ON portal_users(client_id);
CREATE INDEX IF NOT EXISTS idx_pu_mobile   ON portal_users(login_mobile);
CREATE INDEX IF NOT EXISTS idx_pu_email    ON portal_users(login_email);
CREATE INDEX IF NOT EXISTS idx_pu_status   ON portal_users(status);

-- Touch updated_at on UPDATE
DROP TRIGGER IF EXISTS trg_portal_users_touch ON portal_users;
CREATE TRIGGER trg_portal_users_touch BEFORE UPDATE ON portal_users
FOR EACH ROW EXECUTE FUNCTION _touch_updated_at();

-- One-time OTPs for portal login + claim. Short-lived (5 min default).
CREATE TABLE IF NOT EXISTS portal_otps (
  id                          BIGSERIAL PRIMARY KEY,
  -- The login identifier the OTP is for (mobile in E.164 or email)
  login_id                    TEXT NOT NULL,
  -- 6-digit OTP — stored as plain text only for the brief verification
  -- window. Index expires_at to make sweeping easy.
  code                        TEXT NOT NULL,
  purpose                     TEXT NOT NULL CHECK (purpose IN ('claim','login','reset')),
  attempts                    INTEGER NOT NULL DEFAULT 0,
  consumed_at                 TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_login_id  ON portal_otps(login_id);
CREATE INDEX IF NOT EXISTS idx_po_expires   ON portal_otps(expires_at);
