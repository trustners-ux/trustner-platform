# Migrations Pending Application

When this file lists pending migrations, apply them in order via
**Supabase Studio → SQL Editor**. Each migration is idempotent (safe
to re-run if already applied).

## How to apply

1. Open https://supabase.com/dashboard/project/ftlefsbytwsayazcccok/sql/new
2. Copy the contents of each migration file below
3. Paste into the SQL editor
4. Click **Run** (or Cmd+Enter)
5. Confirm "Success" message
6. Move the entry from "Pending" to "Applied"

## Pending

_(none — all migrations applied)_

## Applied

| # | File | Applied On | Notes |
|---|---|---|---|
| 004 | `004_portfolio_diagnostic_schema.sql` | 2026-05-23 | PD core tables (15 tables) |
| 005 | `005_portfolio_diagnostic_seed.sql` | 2026-05-23 | 5 roles + 12 preferred fund categories |
| 006 | `006_meeting_prep_schema.sql` | 2026-05-23 | Meeting Prep schema (mp_*) |
| 007 | `007_investment_proposal_schema.sql` | 2026-05-23 | Investment Proposal schema (ip_*) |
| 008 | `008_client_orientation_schema.sql` | 2026-05-23 | Client Orientation schema (co_*) |
| 009 | `009_periodic_review_schema.sql` | 2026-05-23 | Periodic Review schema (pr_*) |
| 010 | `010_agent_workflow_events.sql` | 2026-05-24 | Generic cross-agent audit trail (RLS disabled — server-only via service role) |
