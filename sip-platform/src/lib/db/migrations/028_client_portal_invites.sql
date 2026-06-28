-- ─────────────────────────────────────────────────────────────────────────────
-- 028 — Client Portal Invites
--
-- Tokenized magic links for inviting clients to the upcoming client portal
-- (Phase B). For now Phase A only records the invite + token; the actual
-- WhatsApp/email send is stubbed.
--
-- Schema:
--   client_portal_invites — one row per invite generation. Tokens are
--     single-use, time-limited. Tracks send channels + claim status.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE client_invite_status AS ENUM ('pending', 'sent', 'claimed', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS client_portal_invites (
  id                          BIGSERIAL PRIMARY KEY,
  client_id                   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token                       TEXT NOT NULL UNIQUE,
  status                      client_invite_status NOT NULL DEFAULT 'pending',
  sent_via_whatsapp           BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_email              BOOLEAN NOT NULL DEFAULT FALSE,
  sent_to_mobile              TEXT,
  sent_to_email               TEXT,
  sent_at                     TIMESTAMPTZ,
  claimed_at                  TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ NOT NULL,
  created_by_user_id          INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at                  TIMESTAMPTZ,
  revoked_by_user_id          INTEGER,
  notes                       TEXT
);

CREATE INDEX IF NOT EXISTS idx_cpi_client    ON client_portal_invites(client_id);
CREATE INDEX IF NOT EXISTS idx_cpi_token     ON client_portal_invites(token);
CREATE INDEX IF NOT EXISTS idx_cpi_status    ON client_portal_invites(status);
CREATE INDEX IF NOT EXISTS idx_cpi_expires   ON client_portal_invites(expires_at);
