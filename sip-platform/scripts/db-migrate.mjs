#!/usr/bin/env node
/**
 * Trustner DB migration runner — applies a .sql migration to Supabase WITHOUT the
 * dashboard, by calling the public.exec_sql() helper over HTTPS with the
 * service-role key. (Bootstrap exec_sql once via scripts/sql/bootstrap_exec_sql.sql.)
 *
 * Usage:
 *   node scripts/db-migrate.mjs --check                         # verify exec_sql exists
 *   node scripts/db-migrate.mjs src/lib/db/migrations/037_x.sql # apply a migration
 *   npm run db:migrate -- src/lib/db/migrations/037_x.sql
 */
import fs from 'node:fs';
import path from 'node:path';

const ENV = '.env.local';
function env(key) {
  const txt = fs.readFileSync(ENV, 'utf8');
  const m = txt.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
}
const URL = env('NEXT_PUBLIC_SUPABASE_URL');
const KEY = env('SUPABASE_SERVICE_ROLE_KEY');
if (!URL || !KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }

async function exec(sql) {
  const r = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, body };
}

/** Split a SQL script into top-level statements, respecting ' strings, " idents,
 *  -- and /* *​/ comments, and $tag$ dollar-quoted blocks. */
function splitStatements(sql) {
  const out = [];
  let cur = '', i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i], c2 = sql[i + 1];
    // line comment
    if (c === '-' && c2 === '-') { while (i < n && sql[i] !== '\n') cur += sql[i++]; continue; }
    // block comment
    if (c === '/' && c2 === '*') { cur += '/*'; i += 2; while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) cur += sql[i++]; cur += '*/'; i += 2; continue; }
    // single-quoted string
    if (c === "'") { cur += c; i++; while (i < n) { cur += sql[i]; if (sql[i] === "'" && sql[i + 1] === "'") { cur += sql[i + 1]; i += 2; continue; } if (sql[i] === "'") { i++; break; } i++; } continue; }
    // double-quoted identifier
    if (c === '"') { cur += c; i++; while (i < n) { cur += sql[i]; if (sql[i] === '"') { i++; break; } i++; } continue; }
    // dollar-quoted block $tag$ ... $tag$
    if (c === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) { const tag = m[0]; cur += tag; i += tag.length; const end = sql.indexOf(tag, i); const stop = end === -1 ? n : end; cur += sql.slice(i, stop) + tag; i = stop + tag.length; continue; }
    }
    if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
    cur += c; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--check') {
    const r = await exec('select 1;');
    if (r.ok) { console.log('✅ exec_sql is live — migrations can run from the terminal.'); process.exit(0); }
    console.error(`❌ exec_sql not available (HTTP ${r.status}). Bootstrap it once: paste scripts/sql/bootstrap_exec_sql.sql into the Supabase SQL editor.`);
    console.error('   ', r.body.slice(0, 200));
    process.exit(2);
  }
  if (!arg) { console.error('Usage: node scripts/db-migrate.mjs <migration.sql> | --check'); process.exit(1); }

  const file = path.resolve(arg);
  const sql = fs.readFileSync(file, 'utf8');
  const stmts = splitStatements(sql);
  console.log(`Applying ${path.basename(file)} — ${stmts.length} statement(s)…`);

  // Pre-flight: confirm exec_sql exists
  const chk = await exec('select 1;');
  if (!chk.ok) { console.error(`❌ exec_sql not available (HTTP ${chk.status}). Bootstrap it once with scripts/sql/bootstrap_exec_sql.sql.`); console.error('   ', chk.body.slice(0, 200)); process.exit(2); }

  let ok = 0;
  for (let s = 0; s < stmts.length; s++) {
    const r = await exec(stmts[s]);
    const head = stmts[s].replace(/\s+/g, ' ').slice(0, 70);
    if (r.ok) { ok++; console.log(`  ✓ [${s + 1}/${stmts.length}] ${head}`); }
    else { console.error(`  ✗ [${s + 1}/${stmts.length}] ${head}\n      HTTP ${r.status}: ${r.body.slice(0, 300)}`); process.exit(3); }
  }
  console.log(`✅ Done — ${ok}/${stmts.length} statements applied.`);
}
main().catch((e) => { console.error('runner error:', e.message); process.exit(1); });
