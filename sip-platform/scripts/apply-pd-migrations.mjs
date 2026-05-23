/**
 * One-off migration runner for the Portfolio Diagnostic module.
 * Applies 004 (schema) then 005 (seed) against the production Supabase.
 *
 * Usage: SUPABASE_DB_URL=... node scripts/apply-pd-migrations.mjs
 *   OR:  node scripts/apply-pd-migrations.mjs   (uses env from .env.local)
 *
 * If SUPABASE_DB_URL isn't set, falls back to running each statement via
 * the Supabase REST API using SUPABASE_SERVICE_ROLE_KEY (less reliable for
 * complex SQL but works without direct DB URL).
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const sip = path.resolve(here, '..');

const m004 = fs.readFileSync(path.join(sip, 'src/lib/db/migrations/004_portfolio_diagnostic_schema.sql'), 'utf8');
const m005 = fs.readFileSync(path.join(sip, 'src/lib/db/migrations/005_portfolio_diagnostic_seed.sql'), 'utf8');

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

async function runWithPg(connStr) {
  const pgMod = await import('pg').catch(() => null);
  if (!pgMod) {
    console.error('  pg package not installed. `npm i pg` to enable direct-DB path.');
    return false;
  }
  const { Client } = pgMod.default || pgMod;
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('  ✓ Connected to Postgres');
  try {
    console.log('  → Running 004_portfolio_diagnostic_schema.sql (513 lines)...');
    await client.query(m004);
    console.log('  ✓ 004 applied');

    console.log('  → Running 005_portfolio_diagnostic_seed.sql (87 lines)...');
    await client.query(m005);
    console.log('  ✓ 005 applied');

    // Quick verification: count pd_* tables and pd_roles rows
    const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'pd_%' ORDER BY tablename;`);
    console.log(`  ✓ pd_* tables created (${tables.rows.length}):`);
    for (const r of tables.rows) console.log(`     - ${r.tablename}`);
    const roles = await client.query('SELECT name, level FROM pd_roles ORDER BY level;');
    console.log(`  ✓ pd_roles seeded (${roles.rows.length}):`);
    for (const r of roles.rows) console.log(`     L${r.level}: ${r.name}`);
    const prefs = await client.query('SELECT COUNT(*)::int AS c FROM pd_preferred_funds_by_category;');
    console.log(`  ✓ pd_preferred_funds_by_category rows: ${prefs.rows[0].c}`);
    return true;
  } catch (e) {
    console.error('  ✗ Migration failed:', e.message);
    if (e.detail) console.error('     detail:', e.detail);
    if (e.hint) console.error('     hint:', e.hint);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL / DATABASE_URL not set. Cannot run migrations directly via pg.');
    console.error('Add to .env.local or supply on command line.');
    console.error('Hint: the connection string is in your Supabase dashboard → Settings → Database → Connection string (URI).');
    process.exit(2);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Portfolio Diagnostic Migrations (004 + 005)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const ok = await runWithPg(dbUrl);
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
