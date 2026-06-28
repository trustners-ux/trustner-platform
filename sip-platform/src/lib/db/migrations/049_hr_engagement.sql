-- Migration 049: Engagement — Announcements upgrade + per-employee Notifications
-- ---------------------------------------------------------------------------
-- hr_announcements ALREADY EXISTS from migration 018 (simpler schema: single
-- `entity`, `publish_at`, no status workflow). Rather than recreate, we ADD the
-- columns the new board needs and backfill existing seed rows as published.
-- hr_notifications is new.

-- ─── hr_announcements: add the new-board columns (idempotent) ────────────────
ALTER TABLE hr_announcements
  ADD COLUMN IF NOT EXISTS entities     TEXT[]      NOT NULL DEFAULT ARRAY['TAS','TIB'],
  -- default 'published' so any pre-existing seed rows stay visible to staff
  ADD COLUMN IF NOT EXISTS status       TEXT        NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- Backfill: legacy publish_at → published_at; legacy single entity → entities[].
UPDATE hr_announcements SET published_at = COALESCE(published_at, publish_at) WHERE published_at IS NULL;
UPDATE hr_announcements SET entities = ARRAY[entity] WHERE entity IS NOT NULL AND entities = ARRAY['TAS','TIB'];

CREATE INDEX IF NOT EXISTS hr_ann_status_idx ON hr_announcements(status, pinned DESC, published_at DESC);

-- ─── hr_notifications: new per-employee notification feed ────────────────────
CREATE TABLE IF NOT EXISTS hr_notifications (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr_employees(id) ON DELETE CASCADE,
  announcement_id BIGINT REFERENCES hr_announcements(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'announcement'
    CHECK (type IN ('announcement','broadcast','system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_notif_emp_idx ON hr_notifications(employee_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS hr_notif_ann_idx ON hr_notifications(announcement_id);

-- updated_at touch trigger for the board
DROP TRIGGER IF EXISTS hr_ann_touch ON hr_announcements;
CREATE TRIGGER hr_ann_touch BEFORE UPDATE ON hr_announcements
  FOR EACH ROW EXECUTE FUNCTION hr_touch_updated_at();
