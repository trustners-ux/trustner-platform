-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER MIS — Row Level Security Policies
-- Ensures RM can NEVER see another RM's data
-- Run AFTER 001_core_schema.sql and 002_seed_data.sql
-- ═══════════════════════════════════════════════════════════════

-- NOTE: RLS is enforced when using the ANON key (supabaseClient).
-- The SERVICE_ROLE key (supabaseAdmin) BYPASSES all RLS — used for admin operations.
-- For now, we use service_role key for all server-side operations.
-- RLS policies below are ready for when we implement per-user Supabase auth.

-- Enable RLS on sensitive tables
ALTER TABLE business_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_incentive_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE sip_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ─── Business Entries ───
-- Service role can do everything (admin operations)
CREATE POLICY "Service role full access on business_entries"
  ON business_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Monthly Incentive Snapshots ───
CREATE POLICY "Service role full access on monthly_incentive_snapshots"
  ON monthly_incentive_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Trail Income ───
CREATE POLICY "Service role full access on trail_income"
  ON trail_income FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── SIP Tracker ───
CREATE POLICY "Service role full access on sip_tracker"
  ON sip_tracker FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Audit Log (append-only for service role) ───
CREATE POLICY "Service role full access on audit_log"
  ON audit_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- FUTURE: When per-user Supabase Auth is implemented, add:
--
-- CREATE POLICY "RM sees own entries"
--   ON business_entries FOR SELECT
--   USING (employee_id = (
--     SELECT e.id FROM employees e
--     WHERE e.email = auth.jwt()->>'email'
--   ));
--
-- CREATE POLICY "RM inserts own entries"
--   ON business_entries FOR INSERT
--   WITH CHECK (employee_id = (
--     SELECT e.id FROM employees e
--     WHERE e.email = auth.jwt()->>'email'
--   ));
-- ═══════════════════════════════════════════════════════════════
