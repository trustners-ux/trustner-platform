// ─── Database Configuration ───
// Toggle between local (in-memory) and Supabase PostgreSQL

export type DbProvider = 'local' | 'supabase';

export const DB_PROVIDER: DbProvider =
  (process.env.NEXT_PUBLIC_DB_PROVIDER as DbProvider) || 'local';

export const isSupabase = DB_PROVIDER === 'supabase';
export const isLocal = DB_PROVIDER === 'local';

// Current active month for MIS calculations
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get current financial year
export function getCurrentFY(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `FY${String(year).slice(2)}-${String(year + 1).slice(2)}`;
}
