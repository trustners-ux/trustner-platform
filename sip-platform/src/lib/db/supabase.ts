// ─── Supabase Client Configuration ───
// Two clients: admin (bypasses RLS) and user (respects RLS)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

/**
 * Admin client — uses SERVICE_ROLE_KEY, bypasses Row Level Security.
 * Use ONLY in server-side API routes for admin operations.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

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
