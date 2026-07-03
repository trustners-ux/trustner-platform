-- ════════════════════════════════════════════════════════════════════════
-- 055 — Enable Row Level Security on EVERY table in the public schema
-- ════════════════════════════════════════════════════════════════════════
-- Context: Supabase's security advisor flags "RLS Disabled in Public"
-- (CRITICAL) on all app tables (employees, pd_cas_uploads, pd_review_comments,
-- mp_* MIS tables, products, channels, ...). With RLS off, the browser-shipped
-- anon key could read/write these tables directly via PostgREST, bypassing
-- every app-layer auth check. This was audit finding P1-8 (Jun 26 2026).
--
-- Safety analysis (verified before writing this migration):
--   * The app's ONLY runtime DB path is getSupabaseAdmin() using the
--     SERVICE_ROLE key, which has BYPASSRLS — enabling RLS is invisible to it,
--     with zero policy-evaluation overhead (policies are skipped entirely).
--   * getSupabaseClient() (anon) has ZERO callers in src/.
--   * No browser-side supabase-js, no Realtime subscriptions, no storage.from
--     in src/ — nothing depends on anon/authenticated table access.
--   * exec_sql() migration channel is SECURITY DEFINER — unaffected.
--
-- Effect: anon/authenticated PostgREST requests now return empty result sets
-- (SELECT) or permission errors (writes). No policies are created for them —
-- deny-by-default is the intent. No service_role policies needed (BYPASSRLS).
--
-- This migration ALSO closes two holes that would otherwise defeat it:
--   (a) Migration 003 created "Service role full access on ..." policies
--       WITHOUT a TO clause → they default to TO public with USING(true),
--       i.e. they grant anon/authenticated FULL read/write on business_entries,
--       monthly_incentive_snapshots, trail_income, sip_tracker, audit_log.
--       service_role never needed them (BYPASSRLS) — they are dropped here.
--   (b) All public views default to security_invoker = off → they execute as
--       their owner (postgres = table owner, whom RLS never restricts), so
--       anon could still read client_aum_summary / family_aum_summary etc.
--       through the views. Every public view is switched to
--       security_invoker = on, so RLS of the CALLER applies. The app calls
--       views only via service_role (BYPASSRLS + full grants) — unaffected.
--
-- Locking: each ALTER takes ACCESS EXCLUSIVE and this DO block is a single
-- transaction, so locks are held until commit. lock_timeout=5s makes it fail
-- fast (clean rollback, safe to re-run) instead of queueing behind a
-- long-running query while blocking traffic to already-altered tables.
--
-- ⚠ FUTURE MIGRATIONS: every new CREATE TABLE must include its own
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;  and every new CREATE VIEW
--   must include  WITH (security_invoker = on);  Postgres has no global default.

DO $$
DECLARE
  t record;
  p record;
  v record;
  n integer := 0;
  np integer := 0;
  nv integer := 0;
BEGIN
  -- Fail fast on lock contention rather than stalling mid-migration while
  -- holding ACCESS EXCLUSIVE locks (transaction-local; whole block rolls back).
  PERFORM set_config('lock_timeout', '5s', true);

  FOR t IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
      AND c.relkind IN ('r', 'p')          -- ordinary + partitioned tables only
      AND NOT c.relrowsecurity              -- idempotent: skip already-enabled
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    n := n + 1;
  END LOOP;

  -- (a) Drop 003's mis-scoped allow-all policies (no TO clause ⇒ TO public).
  FOR p IN
    SELECT pol.tablename, pol.policyname
    FROM pg_policies pol
    WHERE pol.schemaname = 'public'
      AND pol.policyname LIKE 'Service role full access on %'
      AND pol.roles = '{public}'::name[]
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
    np := np + 1;
  END LOOP;

  -- (b) Make every public view run with the CALLER's privileges so RLS applies.
  FOR v IN
    SELECT c.relname AS viewname
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
      AND c.relkind = 'v'
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v.viewname);
    nv := nv + 1;
  END LOOP;

  RAISE NOTICE 'RLS enabled on % table(s); % public-role policies dropped; % view(s) set to security_invoker', n, np, nv;
END $$;

-- Temporary audit helper so the migration runner can verify the result over
-- PostgREST (service_role only; dropped by the verification step afterwards).
-- For tables `secured` = relrowsecurity; for views `secured` = security_invoker.
-- Every row must come back secured = true for the migration to have met its goal.
CREATE OR REPLACE FUNCTION public.tmp_rls_audit()
RETURNS TABLE(objname name, objkind text, secured boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.relname,
         CASE c.relkind WHEN 'v' THEN 'view' ELSE 'table' END,
         CASE WHEN c.relkind = 'v' THEN COALESCE(
                (SELECT opt.option_value::boolean
                 FROM pg_options_to_table(c.reloptions) opt
                 WHERE opt.option_name = 'security_invoker'), false)
              ELSE c.relrowsecurity END
  FROM pg_class c
  JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'public' AND c.relkind IN ('r', 'p', 'v')
  ORDER BY c.relname;
$$;

REVOKE ALL ON FUNCTION public.tmp_rls_audit() FROM public;
REVOKE ALL ON FUNCTION public.tmp_rls_audit() FROM anon;
REVOKE ALL ON FUNCTION public.tmp_rls_audit() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.tmp_rls_audit() TO service_role;
