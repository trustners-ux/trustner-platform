-- Migration 021: Policy OTP digital-signature fields
--
-- Adds audit-grade fields to hr_policy_acknowledgements so an employee's
-- click-to-agree is backed by an OTP-verified identity check + immutable
-- timestamp + IP + user-agent + signature method.
--
-- This replaces the previous "I read and agree" plain checkbox model with:
--   1. Employee opens the policy in their portal
--   2. System sends a 6-digit OTP to their registered WhatsApp/email
--   3. Employee enters the OTP — server verifies + records the audit row
--   4. Audit row is IMMUTABLE (no UPDATE allowed) — only INSERT
--
-- Use case: Employee Handbook v3 acknowledgement. Every active employee
-- signs once. Re-signing required when handbook version bumps.

ALTER TABLE hr_policy_acknowledgements
  ADD COLUMN IF NOT EXISTS signature_method TEXT
    CHECK (signature_method IN ('otp_whatsapp','otp_email','otp_sms','physical','imported')),
  ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_delivery_channel TEXT,
  ADD COLUMN IF NOT EXISTS otp_delivery_target TEXT,
  ADD COLUMN IF NOT EXISTS tnc_agreed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tnc_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS audit_hash TEXT;

-- Make audit row immutable — no UPDATE allowed after insert.
-- (DELETE is also blocked unless a super-admin issues a compliance correction.)
CREATE OR REPLACE FUNCTION hr_block_ack_update() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'hr_policy_acknowledgements rows are immutable. Insert a new row instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hr_ack_no_update ON hr_policy_acknowledgements;
CREATE TRIGGER hr_ack_no_update BEFORE UPDATE ON hr_policy_acknowledgements
  FOR EACH ROW EXECUTE FUNCTION hr_block_ack_update();

-- ─── Ephemeral OTP sessions for policy signing ───────────────────
-- Separate from the lead-funnel otp store so the two don't interfere.
CREATE TABLE IF NOT EXISTS hr_policy_otp_sessions (
  id BIGSERIAL PRIMARY KEY,
  policy_id BIGINT NOT NULL REFERENCES hr_policies(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,             -- 6-digit
  delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('whatsapp','email')),
  delivery_target TEXT NOT NULL,      -- phone or email used
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  consumed_at TIMESTAMPTZ,             -- non-null after successful verify
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_pol_otp_lookup_idx ON hr_policy_otp_sessions(employee_id, policy_id, expires_at);

-- Auto-clean expired OTP sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION hr_cleanup_old_otps() RETURNS VOID AS $$
BEGIN
  DELETE FROM hr_policy_otp_sessions WHERE created_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
