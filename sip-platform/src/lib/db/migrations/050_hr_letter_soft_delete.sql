-- Migration 050: soft-delete for HR letters (was a hard DELETE).
-- Letters are regenerable, but soft-delete keeps an audit trail consistent with
-- the rest of the HRMS. Existing rows default to not-deleted.
ALTER TABLE hr_letter_archive
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;
CREATE INDEX IF NOT EXISTS hr_letter_active_idx ON hr_letter_archive(is_deleted, generated_at DESC);
