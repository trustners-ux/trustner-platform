/**
 * Preferred Swap Pairs — CFP committee management UI
 *
 * Route: /admin/funds/preferred-swaps
 *
 * Lets the team curate "if a client holds X, recommend Y" pairs. The
 * scoring engine reads active=true rows when assigning replacements
 * to SWAP-tier holdings, preferring these over the auto-picked
 * highest-composite-score fund in category.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ArrowRight, Search, Loader2, Star, AlertCircle, Trash2, CheckCircle2, Repeat } from 'lucide-react';

interface SwapPair {
  id: number;
  exit_amfi_code: string;
  exit_scheme_name: string;
  recommended_amfi_code: string;
  recommended_scheme_name: string;
  rationale: string;
  approved_by_email: string | null;
  approved_at: string;
  active: boolean;
  created_at: string;
}

interface FundSearchResult {
  amfi_code: string;
  scheme_name: string;
  amc_name: string | null;
  category: string | null;
  cagr_3y: number | null;
  trustner_preferred: boolean;
}

export default function PreferredSwapsPage() {
  const [rows, setRows] = useState<SwapPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = showInactive ? '/api/admin/funds/preferred-swaps?all=1' : '/api/admin/funds/preferred-swaps';
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error ?? `Fetch failed (${r.status})`);
        return;
      }
      const body = await r.json();
      setRows(body.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  async function deactivate(id: number) {
    if (!confirm('Deactivate this swap pair? Inactive pairs are hidden from the scoring engine but remain in history.')) return;
    setBusyId(id);
    try {
      const r = await fetch('/api/admin/funds/preferred-swaps', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: false }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error ?? 'Deactivate failed');
        return;
      }
      void fetchRows();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trustner-Preferred Swap Pairs</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            When the engine flags a holding for SWAP, it consults these pairs first. Use this to lock in your committee&rsquo;s view — e.g., &ldquo;exit Axis Long Term Equity → recommend Mirae Asset Tax Saver&rdquo;.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
            Show inactive
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Add pair
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddSwapForm
          onCancel={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); void fetchRows(); }}
        />
      )}

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {loading && rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <Repeat className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No swap pairs yet.</p>
            <p className="text-xs mt-1">Click <strong>Add pair</strong> to record your first committee-approved swap recommendation.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.id} className={`px-5 py-4 ${!row.active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-semibold text-rose-700">{row.exit_scheme_name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-emerald-700">{row.recommended_scheme_name}</span>
                      {!row.active && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">Inactive</span>}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{row.rationale}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Approved by <strong>{row.approved_by_email ?? 'unknown'}</strong> · {new Date(row.approved_at).toLocaleString('en-IN', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  {row.active && (
                    <button
                      onClick={() => deactivate(row.id)}
                      disabled={busyId === row.id}
                      className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 disabled:opacity-50"
                      title="Deactivate this pair"
                    >
                      {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-semibold mb-1">How these pairs are used</p>
        <p className="text-xs leading-relaxed">
          The scoring engine reads ACTIVE pairs at score time. If a SWAP-tier holding has an active &ldquo;exit&rdquo; pair, the recommendation field uses that pair&rsquo;s &ldquo;Replace with&rdquo; fund + rationale. Otherwise the engine falls back to highest-composite-score fund in the same category. Only one ACTIVE recommendation per exit fund — adding a new one auto-deactivates the previous.
        </p>
      </div>
    </div>
  );
}

function AddSwapForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [exit, setExit] = useState<FundSearchResult | null>(null);
  const [rec, setRec] = useState<FundSearchResult | null>(null);
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!exit || !rec || rationale.trim().length < 10) {
      setErr('Pick both funds and write at least 10 characters of rationale');
      return;
    }
    if (exit.amfi_code === rec.amfi_code) {
      setErr('Exit and recommended fund cannot be the same');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/admin/funds/preferred-swaps', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_amfi_code: exit.amfi_code,
          recommended_amfi_code: rec.amfi_code,
          rationale: rationale.trim(),
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setErr(e.error ?? 'Save failed');
        return;
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border-2 border-primary-200 bg-primary-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New swap pair
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FundPicker label="Exit fund (currently held)" selected={exit} onSelect={setExit} accent="rose" />
        <FundPicker label="Recommended replacement" selected={rec} onSelect={setRec} accent="emerald" />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Rationale <span className="text-rose-600">*</span></label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          placeholder="One short paragraph — what makes the recommended fund a better fit than the exit fund?"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <p className="text-[10px] text-slate-500 mt-1">Shown verbatim on the client SWAP recommendation row. {rationale.trim().length}/200 chars</p>
      </div>
      {err && <div className="rounded bg-rose-50 border border-rose-300 px-3 py-2 text-xs text-rose-900 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {err}</div>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} disabled={submitting || !exit || !rec} className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save pair
        </button>
      </div>
    </div>
  );
}

function FundPicker({ label, selected, onSelect, accent }: {
  label: string;
  selected: FundSearchResult | null;
  onSelect: (f: FundSearchResult | null) => void;
  accent: 'rose' | 'emerald';
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<FundSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const accentClass = accent === 'rose' ? 'border-rose-300' : 'border-emerald-300';

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/admin/funds/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        if (r.ok) {
          const body = await r.json();
          setResults(body.rows ?? []);
        }
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">{label} <span className="text-rose-600">*</span></label>
      {selected ? (
        <div className={`rounded-lg border-2 ${accentClass} bg-white px-3 py-2 flex items-center justify-between`}>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
              {selected.trustner_preferred && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
              {selected.scheme_name}
            </div>
            <div className="text-[10px] text-slate-500">{selected.amc_name} · {selected.category} · {selected.cagr_3y !== null ? `3Y ${selected.cagr_3y.toFixed(2)}%` : '3Y NM'}</div>
          </div>
          <button onClick={() => { onSelect(null); setQ(''); }} className="text-slate-400 hover:text-slate-700 ml-2"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Type to search…"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
          {open && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.amfi_code}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(r); setQ(''); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                >
                  <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    {r.trustner_preferred && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    {r.scheme_name}
                  </div>
                  <div className="text-[10px] text-slate-500">{r.amc_name} · {r.category} · {r.cagr_3y !== null ? `3Y ${r.cagr_3y.toFixed(2)}%` : '3Y NM'}</div>
                </button>
              ))}
            </div>
          )}
          {open && searching && results.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg px-3 py-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Searching…</div>
          )}
        </div>
      )}
    </div>
  );
}
