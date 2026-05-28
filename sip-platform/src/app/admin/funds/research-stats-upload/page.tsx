'use client';

/**
 * /admin/funds/research-stats-upload
 *
 * Admin upload page for the weekly/monthly research-stats XLSX export.
 * Drag-and-drop or browse; the file is parsed server-side and matched
 * to pd_fund_master, then upserted into pd_fund_research_stats.
 *
 * NAV is NOT refreshed here — that runs daily via the cron from AMFI.
 * This page only updates the periodic research stats (returns, Sharpe,
 * allocation %, valuation, etc.).
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft,
  Loader2, X, TrendingUp, Database, Calendar, Star,
} from 'lucide-react';

interface UploadResult {
  success?: boolean;
  parsed?: number;
  matched?: number;
  deduped?: number;
  upserted?: number;
  unmatched?: number;
  matchRate?: string;
  snapshotDate?: string;
  elapsedSec?: number;
  unmatchedSample?: Array<{ scheme: string; category: string }>;
  error?: string;
}

export default function ResearchStatsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setResult({ error: 'Please select an .xlsx file' });
      return;
    }
    setFile(f);
    setResult(null);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/funds/research-stats-upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data: UploadResult = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fund Research Stats — Upload</h1>
            <p className="text-xs text-slate-500">
              Upload the weekly/monthly research-stats XLSX. NAV is refreshed daily by the AMFI cron — this updates the periodic research metrics (returns, Sharpe, allocation, valuation).
            </p>
          </div>
        </div>

        {/* What goes in / what happens */}
        <div className="grid sm:grid-cols-2 gap-3 mt-5 mb-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-slate-900">Expected file</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>· .xlsx with 5 sheets: Equity, Debt, Hybrid, Other, Solution Oriented</li>
              <li>· Header row with #, Fund Name, NAV, AUM, returns, Sharpe…</li>
              <li>· Max 5 MB</li>
            </ul>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-emerald-900">What you get</h3>
            </div>
            <ul className="text-xs text-emerald-800 space-y-1">
              <li>· ~98% scheme names auto-matched to amfi_code</li>
              <li>· Snapshot keyed by NAV Date — historical versions preserved</li>
              <li>· Unmatched names logged for manual review</li>
            </ul>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={
            'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ' +
            (dragOver
              ? 'border-brand bg-brand/5'
              : 'border-slate-300 hover:border-brand/50 hover:bg-slate-50')
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-brand" />
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="ml-3 text-slate-400 hover:text-rose-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm text-slate-700 font-medium">Drag .xlsx here or click to browse</div>
              <div className="text-xs text-slate-500 mt-1">Maximum 5 MB</div>
            </>
          )}
        </div>

        <button
          onClick={upload}
          disabled={!file || uploading}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold py-3 px-4 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Importing… this may take 30-60 seconds
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" /> Parse & Import
            </>
          )}
        </button>

        {/* Result */}
        {result?.success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 mb-2">Import successful</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <Metric label="Parsed" value={result.parsed} />
                  <Metric label="Matched" value={result.matched} sub={result.matchRate} />
                  <Metric label="Upserted" value={result.upserted} />
                  <Metric label="Unmatched" value={result.unmatched} accent={(result.unmatched ?? 0) > 50 ? 'amber' : undefined} />
                </div>
                <div className="text-xs text-emerald-800 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Snapshot date: <strong>{result.snapshotDate}</strong>
                  </div>
                  <div>Elapsed: {result.elapsedSec}s</div>
                </div>
                {result.unmatchedSample && result.unmatchedSample.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-semibold text-emerald-900 cursor-pointer">
                      First {result.unmatchedSample.length} unmatched names (logged for review) ▾
                    </summary>
                    <ul className="mt-2 text-xs text-emerald-800 space-y-0.5 max-h-40 overflow-y-auto">
                      {result.unmatchedSample.map((u, i) => (
                        <li key={i} className="font-mono">
                          {u.scheme} <span className="text-emerald-600">({u.category})</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/funds/universe"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline-offset-2 hover:underline"
                  >
                    View public Fund Universe →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Import failed:</strong>
              <p className="mt-0.5">{result.error}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Daily NAV is auto-refreshed at 04:30 IST (Tue-Sat) from AMFI. This page updates the periodic research-stats overlay.
      </p>
    </div>
  );
}

function Metric({
  label, value, sub, accent,
}: {
  label: string; value: number | undefined; sub?: string; accent?: 'amber';
}) {
  return (
    <div>
      <div className={'text-2xl font-extrabold ' + (accent === 'amber' ? 'text-amber-700' : 'text-emerald-900')}>
        {value?.toLocaleString('en-IN') ?? '—'}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}
