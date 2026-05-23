# Migrations Pending Application

When this file is non-empty, apply the listed migrations in order via
**Supabase Studio → SQL Editor**. Each migration is idempotent (safe to
re-run if already applied).

## How to apply

1. Open https://supabase.com/dashboard/project/ftlefsbytwsayazcccok/sql/new
2. Copy the contents of each migration file below
3. Paste into the SQL editor
4. Click **Run** (or Cmd+Enter)
5. Confirm "Success" message
6. Delete the entry from this file after applying

## Pending

### 010_agent_workflow_events.sql

**Why:** The IP / CO / PR workbench draft & action API routes write audit
events to `agent_workflow_events`. This generic table does not exist yet
(it was added today, 2026-05-24). Until applied:

- Workflows still function (drafts save, reviews approve, etc.)
- Audit-write errors appear in Vercel runtime logs as:
  `[audit] Failed to insert agent_workflow_events ... relation does not exist`
- The audit trail for IP/CO/PR is **incomplete** until the table is created.

**File:** `src/lib/db/migrations/010_agent_workflow_events.sql`

**Apply now:** 30-second job, one-time, no downtime.
