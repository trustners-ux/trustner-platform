/**
 * Required Environment Variable Manifest
 *
 * SINGLE SOURCE OF TRUTH for what env vars this app needs to run.
 *
 * Why this exists: on 24-May-2026 the merasip Vercel project was
 * silently missing every Supabase + auth env var, and the bug only
 * surfaced when a planner clicked "Save Draft" and got "Not
 * authenticated" — by which point we'd already spent an hour
 * investigating downstream symptoms.
 *
 * This file is consumed by:
 *   1. /api/_health endpoint — runtime visibility ("which vars are
 *      missing right now in production?")
 *   2. scripts/check-prod-env.sh — pre-deploy validator
 *   3. lib/db/supabase.ts — startup logging
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export type EnvVarStatus = 'set' | 'missing' | 'malformed';

export interface EnvVarSpec {
  name: string;
  description: string;
  /** Routes / features that break if this is missing. Helps triage. */
  affects: string[];
  /** If true, app cannot start without it. */
  critical: boolean;
  /** Optional regex the value must satisfy. Catches \n / whitespace typos. */
  pattern?: RegExp;
  /** Public (NEXT_PUBLIC_*) vars are inlined at build time. */
  public?: boolean;
}

export const REQUIRED_ENV_VARS: EnvVarSpec[] = [
  // ── Supabase / DB ────────────────────────────────────────────
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL — read by both server and browser.',
    affects: ['ALL database queries', 'dashboard', 'draft', 'share', 'report'],
    critical: true,
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    public: true,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anon key for browser-side reads.',
    affects: ['client-side Supabase calls'],
    critical: true,
    pattern: /^eyJ/,
    public: true,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key for server-side admin queries.',
    affects: ['ALL admin API routes', 'PD save/share/publish', 'every write'],
    critical: true,
    pattern: /^eyJ/,
  },

  // ── Auth ─────────────────────────────────────────────────────
  {
    name: 'JWT_SECRET',
    description: 'HMAC key for signing admin login JWTs.',
    affects: ['admin login', 'session verification on every authenticated route'],
    critical: true,
  },
  {
    name: 'RM_JWT_SECRET',
    description: 'HMAC key for signing RM (Relationship Manager) JWTs.',
    affects: ['RM login flow'],
    critical: false,
  },
  {
    name: 'ADMIN_USERS',
    description: 'CSV of admin email addresses allowed to log in.',
    affects: ['/admin/login', 'principal auth fallback'],
    critical: true,
  },

  // ── AI / Email ───────────────────────────────────────────────
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI advisor + generation features.',
    affects: ['AI advisor', 'meeting prep generation', 'content suggestions'],
    critical: false,
  },
  {
    name: 'RESEND_API_KEY',
    description: 'Resend HTTP API key for outbound emails.',
    affects: ['Share-with-Client emails', 'publish notifications'],
    critical: false,
  },

  // ── Storage ──────────────────────────────────────────────────
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    description: 'Vercel Blob storage token.',
    affects: ['PD file uploads (CAS PDFs)', 'attachments'],
    critical: false,
  },

  // ── Misc ─────────────────────────────────────────────────────
  {
    name: 'CRON_SECRET',
    description: 'Shared secret for authenticating Vercel cron jobs.',
    affects: ['scheduled tasks', 'periodic review reminders'],
    critical: false,
  },
];

export interface EnvValidationResult {
  ok: boolean;
  critical_missing: string[];
  critical_malformed: Array<{ name: string; reason: string }>;
  non_critical_missing: string[];
  non_critical_malformed: Array<{ name: string; reason: string }>;
  summary: string;
}

/**
 * Run server-side validation against the actual `process.env`. Returns
 * a structured result that downstream callers can render however they
 * want (JSON for the API, a banner for the UI, exit code for the script).
 *
 * NOTE: this is server-only. NEXT_PUBLIC_* vars are technically also
 * available at build time and inlined into the client bundle — but at
 * runtime they're still readable via process.env on the server.
 */
export function validateServerEnv(): EnvValidationResult {
  const critical_missing: string[] = [];
  const critical_malformed: Array<{ name: string; reason: string }> = [];
  const non_critical_missing: string[] = [];
  const non_critical_malformed: Array<{ name: string; reason: string }> = [];

  for (const spec of REQUIRED_ENV_VARS) {
    const value = process.env[spec.name];
    const bucket_missing = spec.critical ? critical_missing : non_critical_missing;
    const bucket_malformed = spec.critical ? critical_malformed : non_critical_malformed;

    if (!value || value.trim().length === 0) {
      bucket_missing.push(spec.name);
      continue;
    }

    // Catch the \n typo class — value contains whitespace/newline anywhere
    if (/[\r\n\t]/.test(value)) {
      bucket_malformed.push({
        name: spec.name,
        reason: 'Contains whitespace/newline character — likely a copy-paste typo',
      });
      continue;
    }
    if (value !== value.trim()) {
      bucket_malformed.push({
        name: spec.name,
        reason: 'Has leading or trailing whitespace',
      });
      continue;
    }
    if (spec.pattern && !spec.pattern.test(value)) {
      bucket_malformed.push({
        name: spec.name,
        reason: `Does not match expected pattern (${spec.pattern.source})`,
      });
      continue;
    }
  }

  const ok =
    critical_missing.length === 0 && critical_malformed.length === 0;
  const issueCount =
    critical_missing.length +
    critical_malformed.length +
    non_critical_missing.length +
    non_critical_malformed.length;

  let summary: string;
  if (ok && issueCount === 0) {
    summary = 'All environment variables are set and valid.';
  } else if (ok) {
    summary = `Healthy. ${issueCount} non-critical issue(s) — some optional features may be degraded.`;
  } else {
    summary = `BROKEN: ${critical_missing.length} missing + ${critical_malformed.length} malformed critical var(s). App will not function correctly.`;
  }

  return {
    ok,
    critical_missing,
    critical_malformed,
    non_critical_missing,
    non_critical_malformed,
    summary,
  };
}

/**
 * Per-var status snapshot for the /api/_health endpoint. Returns a
 * row per var so the admin UI can render the full state.
 */
export function envSnapshot(): Array<{
  name: string;
  status: EnvVarStatus;
  reason?: string;
  critical: boolean;
  description: string;
  affects: string[];
  public: boolean;
}> {
  return REQUIRED_ENV_VARS.map((spec) => {
    const value = process.env[spec.name];
    if (!value || value.trim().length === 0) {
      return {
        name: spec.name,
        status: 'missing' as const,
        critical: spec.critical,
        description: spec.description,
        affects: spec.affects,
        public: spec.public ?? false,
      };
    }
    if (/[\r\n\t]/.test(value)) {
      return {
        name: spec.name,
        status: 'malformed' as const,
        reason: 'whitespace/newline in value',
        critical: spec.critical,
        description: spec.description,
        affects: spec.affects,
        public: spec.public ?? false,
      };
    }
    if (value !== value.trim()) {
      return {
        name: spec.name,
        status: 'malformed' as const,
        reason: 'leading/trailing whitespace',
        critical: spec.critical,
        description: spec.description,
        affects: spec.affects,
        public: spec.public ?? false,
      };
    }
    if (spec.pattern && !spec.pattern.test(value)) {
      return {
        name: spec.name,
        status: 'malformed' as const,
        reason: `pattern mismatch`,
        critical: spec.critical,
        description: spec.description,
        affects: spec.affects,
        public: spec.public ?? false,
      };
    }
    return {
      name: spec.name,
      status: 'set' as const,
      critical: spec.critical,
      description: spec.description,
      affects: spec.affects,
      public: spec.public ?? false,
    };
  });
}
