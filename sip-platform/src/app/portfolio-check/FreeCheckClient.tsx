'use client';

/**
 * Free Portfolio Check — public lead-magnet UI.
 * Upload CAS → full PD engine scoring → redirect to shareable results page.
 */

import { useState } from 'react';
import { Upload, ShieldCheck, Lock, ArrowRight, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

export default function FreeCheckClient() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) { setError('Please attach your CAS / portfolio PDF.'); return; }
    setBusy(true);
    setProgress('Uploading your statement…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (password) fd.append('password', password);
      fd.append('name', name);
      fd.append('mobile', mobile);
      fd.append('consent', String(consent));

      setProgress('Analysing your portfolio…');
      const res = await fetch('/api/portfolio-check', { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? `Something went wrong (HTTP ${res.status}). Please try again or WhatsApp us.`);
        return;
      }

      if (data.resultsToken) {
        setProgress('Preparing your health report…');
        window.location.href = `/portfolio-check/results/${data.resultsToken}`;
        return;
      }

      setError('Analysis completed partially. Please WhatsApp us at 6003903737 for your full report.');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="bg-gradient-to-r from-[#0A1628] via-[#1E3A5F] to-[#0D4F6B] text-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> AMFI-registered distributor · ARN-286886 · Free, no obligation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
            Upload your portfolio.<br />Get a professional health check in 60 seconds.
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto">
            Fund-by-fund verdicts, duplicate detection, risk assessment, and tax estimates — all powered
            by the same AI engine our research desk uses for professional portfolio reviews.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            {/* What you get */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-teal-800 mb-2">
                <Sparkles className="w-4 h-4" /> What you&apos;ll get instantly
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  'Fund-by-fund health verdicts',
                  'Duplicate fund detection',
                  'Risk concentration check',
                  'Tax impact estimates',
                  'Portfolio health score (0-100)',
                  'SIP health & gap analysis',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-teal-700">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Your CAS / portfolio statement (PDF)</span>
              <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-teal-500 hover:bg-teal-50/40 transition-colors">
                <Upload className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-semibold text-slate-700">{file ? file.name : 'Click to choose your PDF'}</span>
                <span className="text-[11px] text-slate-400">CAMS / KFintech CAS (Detailed) or a Trustner valuation report · max 12 MB</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">PDF password <span className="font-normal normal-case text-slate-400">(only if your statement has one)</span></span>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Usually your PAN" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Your name</span>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mobile</span>
                <input type="tel" required inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              </label>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>I consent to Trustner Asset Services Pvt. Ltd. analysing this statement and contacting me about my portfolio (DPDP Act 2023). Data stays on Trustner systems and is never sold. <a href="/privacy" className="underline" target="_blank">Privacy policy</a>.</span>
            </label>
            {error && <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2.5"><AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />{error}</div>}
            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60">
              {busy ? progress : 'Analyse my portfolio'} {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Lock className="w-3 h-3" /> Your statement is processed on our servers only — never shared, never sold.</p>
          </form>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed mt-5 text-center max-w-xl mx-auto">
          Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully. This check is an automated
          data summary and does NOT constitute investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013.
          Trustner Asset Services Pvt. Ltd. — AMFI registered Mutual Fund Distributor and SIF Distributor, APMI registered PMS Distributor: ARN-286886.
        </p>
      </section>
    </main>
  );
}
