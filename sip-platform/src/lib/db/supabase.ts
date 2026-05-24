// ─── Supabase Client Configuration ───
// Two clients: admin (bypasses RLS) and user (respects RLS)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;
let _configWarned = false;

/**
 * Loud one-shot warning when Supabase config is missing or malformed.
 * Triggered the first time any callsite hits a broken state.
 *
 * Catches the May-2026 silent-failure class: env var stored on Vercel
 * with a trailing literal \n, hostname becomes invalid, every query
 * returns null, but no error surfaces until something downstream
 * (like Save Draft) fails opaquely.
 */
function warnSupabaseConfig(
  url: string | undefined,
  key: string | undefined,
  keyLabel: string
): void {
  if (_configWarned) return;
  const issues: string[] = [];
  if (!url) issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  else if (/[\r\n\t]/.test(url))
    issues.push(`NEXT_PUBLIC_SUPABASE_URL contains whitespace/newline — likely a paste typo: ${JSON.stringify(url)}`);
  else if (url !== url.trim())
    issues.push(`NEXT_PUBLIC_SUPABASE_URL has leading/trailing whitespace: ${JSON.stringify(url)}`);
  if (!key) issues.push(`${keyLabel} is missing`);
  else if (/[\r\n\t]/.test(key)) issues.push(`${keyLabel} contains whitespace/newline`);
  if (issues.length > 0) {
    console.error(`[supabase] ⚠️  CONFIG BROKEN — ${issues.join(' · ')}`);
    console.error(`[supabase] Open /api/health (as an admin) for a full diagnosis.`);
    _configWarned = true;
  }
}

/** Strip whitespace defensively — catches paste-typo issues. */
function cleanEnv(v: string | undefined): string | undefined {
  if (!v) return v;
  return v.trim();
}

/**
 * Admin client — uses SERVICE_ROLE_KEY, bypasses Row Level Security.
 * Use ONLY in server-side API routes for admin operations.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    warnSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  // Defensive: reject URLs/keys with embedded whitespace
  if (/[\r\n\t]/.test(url) || /[\r\n\t]/.test(key)) {
    warnSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  if (!_adminClient) {
    _adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _adminClient;
}

/**
 * Anon client — uses ANON_KEY, respects Row Level Security.
 * Use for client-side or when RLS should be enforced.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    warnSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }
  if (/[\r\n\t]/.test(url) || /[\r\n\t]/.test(key)) {
    warnSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }

  if (!_anonClient) {
    _anonClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _anonClient;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
