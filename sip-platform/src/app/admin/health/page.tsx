/**
 * Admin Health Dashboard
 *
 * Route: /admin/health
 *
 * Surfaces /api/_health in a human-readable page so anyone (Ram,
 * Sangeeta, future engineers) can visit one URL and instantly see
 * what's broken. Avoids the May-2026 "spent an hour diagnosing a
 * trailing \n in an env var" class of incidents.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface EnvVarRow {
  name: string;
  status: 'set' | 'missing' | 'malformed';
  reason?: string;
  critical: boolean;
  description: string;
  affects: string[];
  public: boolean;
}

interface DbProbe {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  employeeRowCount?: number;
}

interface HealthResponse {
  ok: boolean;
  checkedAt: string;
  checkedBy: string;
  summary: string;
  env: {
    ok: boolean;
    summary: string;
    criticalMissing: string[];
    criticalMalformed: Array<{ name: string; reason: string }>;
    nonCriticalMissing: string[];
    nonCriticalMalformed: Array<{ name: string; reason: string }>;
    vars: EnvVarRow[];
  };
  db: DbProbe;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNonCritical, setShowNonCritical] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok && res.status !== 503) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error loading health:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Platform Health</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live diagnosis of env vars + database connectivity. Bookmark this page.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Top-line status */}
      <div
        className={`rounded-lg border p-5 ${
          data.ok
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-rose-400 bg-rose-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {data.ok ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-rose-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className={`text-lg font-bold ${data.ok ? 'text-emerald-900' : 'text-rose-900'}`}>
              {data.ok ? 'All systems operational' : 'Issues detected'}
            </div>
            <div className={`text-sm mt-1 ${data.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
              {data.summary}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Checked {new Date(data.checkedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })} by {data.checkedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Database probe */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          {data.db.ok ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600" />
          )}
          Database Connectivity
        </h2>
        {data.db.ok ? (
          <div className="text-sm text-slate-700">
            <div>✓ Supabase reachable — round-trip <strong>{data.db.latencyMs}ms</strong></div>
            <div className="text-xs text-slate-500 mt-1">
              Employees table contains {data.db.employeeRowCount} row(s).
            </div>
          </div>
        ) : (
          <div className="text-sm text-rose-800">
            <div className="font-semibold">✗ Database unreachable.</div>
            <div className="font-mono text-xs bg-rose-100 rounded p-2 mt-2 break-all">
              {data.db.error}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Common causes: missing/malformed <code>NEXT_PUBLIC_SUPABASE_URL</code> or{' '}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> (see below).
            </div>
          </div>
        )}
      </div>

      {/* Critical env issues */}
      {(data.env.criticalMissing.length > 0 || data.env.criticalMalformed.length > 0) && (
        <div className="rounded-lg border border-rose-400 bg-rose-50 p-5">
          <h2 className="text-base font-bold text-rose-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Env Issues
          </h2>
          {data.env.criticalMissing.map((name) => (
            <div key={`miss-${name}`} className="text-sm text-rose-800 font-mono">
              ✗ MISSING: <strong>{name}</strong>
            </div>
          ))}
          {data.env.criticalMalformed.map((m) => (
            <div key={`mal-${m.name}`} className="text-sm text-rose-800 font-mono">
              ⚠ MALFORMED: <strong>{m.name}</strong> — {m.reason}
            </div>
          ))}
          <div className="mt-3 text-xs text-rose-700">
            Fix on Vercel:{' '}
            <a
              href="https://vercel.com/ram-shahs-projects-f5d5168e/merasip/settings/environment-variables"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Project settings → Environment Variables →
            </a>{' '}
            then redeploy (NEXT_PUBLIC_* vars are inlined at build time).
          </div>
        </div>
      )}

      {/* Full env var table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Environment Variables ({data.env.vars.length})
          </h2>
          <button
            onClick={() => setShowNonCritical((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            {showNonCritical ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showNonCritical ? 'Hide non-critical' : 'Show all'}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Name</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
              <th className="text-left px-4 py-2 font-semibold">Affects</th>
            </tr>
          </thead>
          <tbody>
            {data.env.vars
              .filter((v) => showNonCritical || v.critical || v.status !== 'set')
              .map((v) => (
                <tr key={v.name} className="border-t border-slate-100">
                  <td className="px-4 py-2 align-top">
                    <div className="font-mono text-xs font-bold text-slate-900">{v.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{v.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {v.critical && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          CRITICAL
                        </span>
                      )}
                      {v.public && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                          PUBLIC (inlined at build)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    {v.status === 'set' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Set
                      </span>
                    )}
                    {v.status === 'missing' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold">
                        <XCircle className="h-3.5 w-3.5" /> Missing
                      </span>
                    )}
                    {v.status === 'malformed' && (
                      <div>
                        <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Malformed
                        </span>
                        {v.reason && <div className="text-[11px] text-amber-700 mt-1">{v.reason}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-slate-600">
                    {v.affects.slice(0, 3).join(', ')}
                    {v.affects.length > 3 && ` +${v.affects.length - 3} more`}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pre-deploy reminder */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>Before deploying:</strong> run{' '}
        <code className="bg-amber-100 px-1.5 py-0.5 rounded">
          ./scripts/check-prod-env.sh
        </code>{' '}
        from the sip-platform directory to verify Vercel has all required vars.
      </div>
    </div>
  );
}
