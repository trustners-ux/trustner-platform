-- ════════════════════════════════════════════════════════════════════════
-- ONE-TIME BOOTSTRAP — enables programmatic migrations without the dashboard
-- ════════════════════════════════════════════════════════════════════════
-- Paste this ONCE into the Supabase SQL editor (Run). After this, every future
-- migration is applied from the terminal with:  npm run db:migrate <file.sql>
-- (which calls this function over HTTPS using the service-role key).
--
-- Security: SECURITY DEFINER + granted to service_role ONLY (revoked from
-- anon/authenticated/public). The service-role key is already full-access and
-- server-side only; this just adds DDL capability for migrations. No web route
-- calls this function — only the local db-migrate script does.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.exec_sql(sql text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  execute sql;
end;
$$;

revoke all on function public.exec_sql(text) from public;
revoke all on function public.exec_sql(text) from anon;
revoke all on function public.exec_sql(text) from authenticated;
grant execute on function public.exec_sql(text) to service_role;

comment on function public.exec_sql(text) is
  'Trustner migration helper. Executes DDL/DML for npm run db:migrate. service_role only. Do NOT call from any web route.';
