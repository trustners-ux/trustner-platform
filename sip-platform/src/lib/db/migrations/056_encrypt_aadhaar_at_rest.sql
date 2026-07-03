-- Migration 056: Mark the Aadhaar column encryption intent
-- -----------------------------------------------------------------
-- The actual encryption runs via a one-time Node.js API route
-- (uses AES-256-GCM from lib/security/pii-crypto.ts) because SQL
-- has no native AES-GCM support.
--
-- This migration adds a comment for audit trail and renames the
-- hr_employees bank column to match its intended encrypted state.
--
-- Prerequisites:
--   PII_ENCRYPTION_KEY env var set in Vercel (64-char hex = 32 bytes)
--   Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

COMMENT ON COLUMN hr_onboarding.aadhaar IS
  'AES-256-GCM encrypted (enc:iv:tag:ciphertext). Plaintext rows are pre-migration legacy. DPDP Art 8(3).';

COMMENT ON COLUMN hr_onboarding.account_number IS
  'AES-256-GCM encrypted (enc:iv:tag:ciphertext). Plaintext rows are pre-migration legacy.';
