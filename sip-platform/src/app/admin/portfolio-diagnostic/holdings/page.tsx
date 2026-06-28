'use client';

/**
 * /admin/portfolio-diagnostic/holdings
 *
 * Upload an AMC monthly portfolio-disclosure workbook (the SEBI full-scheme
 * month-end portfolio). The server splits it per scheme, matches each to its
 * Regular-plan amfi_code, and upserts the equity holdings into pd_fund_holdings.
 * This powers the stock-level LOOK-THROUGH on portfolio reviews — "you own
 * Reliance through 4 funds" — that fund-level diversification hides.
 *
 * Reliable path: a human downloads the file from the AMC's (JS-gated) dropdown
 * and uploads it here.
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft,
  Loader2, X, Layers, Database, Calendar,
} from 'lucide-react';

interface UploadResult {
  success?: boolean;
  fileName?: string;
  asOfDate?: string;
  schemesParsed?: number;
  matchedCount?: number;
  unmatchedCount?: number;
  rowsUpserted?: number;
  elapsedSec?: number;
  matched?: Array<{ scheme: string; amfiCode: string; confidence: number; rows: number }>;
  unmatchedSample?: Array<{ scheme: string; bestConfidence: number }>;
  errors?: string[];
  error?: string;
}

export default function HoldingsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('');
  const [asOfDate, setAsOfDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setResult({ error: 'Please select an .xlsx or .xls AMC portfolio file (not a ZIP — unzip first).' });
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
      if (source.trim()) fd.append('source', `amc:${source.trim()}`);
      if (asOfDate) fd.append('asOfDate', asOfDate);
      const res = await fetch('/api/admin/portfolio-diagnostic/holdings-upload', {
        method: 'POST', credentials: 'include', body: fd,
      });
      setResult(await res.json());
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
      <Link href="/admin/portfolio-diagnostic" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Portfolio Diagnostic
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fund Holdings — Look-Through Upload</h1>
            <p className="text-xs text-slate-500">
              Upload an AMC&apos;s monthly portfolio-disclosure Excel (the full-scheme month-end portfolio). Powers the stock-level look-through on portfolio reviews.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5 mb-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-slate-900">Where to get the file</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>· AMC site → &ldquo;Statutory Disclosures&rdquo; / &ldquo;Monthly Portfolio&rdquo;</li>
              <li>· The CONSOLIDATED (all-scheme) month-end Excel</li>
              <li>· .xlsx or .xls · max 30 MB · unzip ZIPs first</li>
            </ul>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-emerald-900">What happens</h3>
            </div>
            <ul className="text-xs text-emerald-800 space-y-1">
              <li>· Splits the workbook per scheme, matches to amfi_code</li>
              <li>· Stores equity holdings for the disclosed month</li>
              <li>· Surfaces true single-stock overlap on reviews</li>
            </ul>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">AMC name (optional — provenance tag)</span>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. SBI, HDFC, Nippon"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Portfolio month-end (optional — auto-detected)</span>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </label>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ' +
            (dragOver ? 'border-brand bg-brand/5' : 'border-slate-300 hover:border-brand/50 hover:bg-slate-50')}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-brand" />
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }} className="ml-3 text-slate-400 hover:text-rose-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm text-slate-700 font-medium">Drag the AMC portfolio Excel here or click to browse</div>
              <div className="text-xs text-slate-500 mt-1">Maximum 30 MB</div>
            </>
          )}
        </div>

        <button onClick={upload} disabled={!file || uploading}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold py-3 px-4 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Parsing & matching… up to 60 seconds</>) : (<><Layers className="h-4 w-4" /> Parse & Import Holdings</>)}
        </button>

        {result?.success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 mb-2">Holdings imported</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <Metric label="Schemes parsed" value={result.schemesParsed} />
                  <Metric label="Matched" value={result.matchedCount} />
                  <Metric label="Stock rows" value={result.rowsUpserted} />
                  <Metric label="Unmatched" value={result.unmatchedCount} accent={(result.unmatchedCount ?? 0) > (result.matchedCount ?? 0) ? 'amber' : undefined} />
                </div>
                <div className="text-xs text-emerald-800 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Portfolio month-end: <strong>{result.asOfDate}</strong> · {result.elapsedSec}s
                </div>
                {result.matched && result.matched.length > 0 && (
                  <details className="mt-3" open>
                    <summary className="text-xs font-semibold text-emerald-900 cursor-pointer">Matched schemes ({result.matchedCount}) ▾</summary>
                    <ul className="mt-2 text-xs text-emerald-800 space-y-0.5 max-h-52 overflow-y-auto">
                      {result.matched.map((m, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{m.scheme}</span>
                          <span className="font-mono text-emerald-600 whitespace-nowrap">{m.amfiCode} · {m.rows} stk · {(m.confidence * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {result.unmatchedSample && result.unmatchedSample.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-amber-800 cursor-pointer">Unmatched ({result.unmatchedCount}) — mostly ETF/FMP/index, correctly skipped ▾</summary>
                    <ul className="mt-2 text-xs text-slate-600 space-y-0.5 max-h-40 overflow-y-auto">
                      {result.unmatchedSample.map((u, i) => (<li key={i} className="font-mono">{u.scheme}</li>))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {(result?.error || (result?.errors && result.errors.length > 0)) && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Import problem:</strong>
              <p className="mt-0.5">{result.error || result.errors?.join('; ')}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        SEBI mandates these monthly disclosures publicly. Internal overlap analysis for our own clients — compliant. Holdings drift slowly; a monthly refresh is enough.
      </p>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number | undefined; accent?: 'amber' }) {
  return (
    <div>
      <div className={'text-2xl font-extrabold ' + (accent === 'amber' ? 'text-amber-700' : 'text-emerald-900')}>
        {value?.toLocaleString('en-IN') ?? '—'}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    </div>
  );
}
