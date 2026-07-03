'use client';

/**
 * Free Portfolio Check — public lead-magnet UI.
 *
 * Two paths to the same result:
 *   Tab 1: Upload CAS PDF → parse → full PD engine → results page
 *   Tab 2: Enter PAN + DOB → OTP to registered mobile → CASParser.in pulls CAS → full PD engine → results page
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, ShieldCheck, Lock, ArrowRight, AlertTriangle, CheckCircle2, Sparkles, CreditCard, FileText, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Tab = 'pan' | 'pdf';
type PanStep = 'form' | 'otp';

export default function FreeCheckClient() {
  const [tab, setTab] = useState<Tab>('pdf');
  const [dragOver, setDragOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // PDF tab
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  // PAN tab
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [boId, setBoId] = useState('');
  const [panStep, setPanStep] = useState<PanStep>('form');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');

  function switchTab(t: Tab) {
    if (busy) return;
    setTab(t);
    setError(null);
  }

  // ── PDF Upload Submit ──
  async function submitPdf(e: React.FormEvent) {
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

  // ── PAN Step 1: Send OTP ──
  async function submitPan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(pan)) {
      setError('Please enter a valid PAN (e.g. ABCDE1234F).');
      return;
    }
    if (!dob) { setError('Please enter your date of birth.'); return; }
    if (!/^\d{16}$/.test(boId)) { setError('Please enter your 16-digit CDSL Demat Account Number.'); return; }

    setBusy(true);
    setProgress('Connecting to CDSL… OTP will be sent to your registered mobile.');
    try {
      const res = await fetch('/api/portfolio-check/pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan, dob, boId, name, mobile, consent }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? 'Could not initiate CAS fetch. Please try uploading your PDF instead.');
        return;
      }

      setSessionId(data.sessionId);
      setPanStep('otp');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── PAN Step 2: Verify OTP ──
  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length < 4) {
      setError('Please enter the OTP sent to your registered mobile.');
      return;
    }

    setBusy(true);
    setProgress('Verifying OTP and fetching your CAS…');
    try {
      const res = await fetch('/api/portfolio-check/pan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp, name, mobile, pan }),
      });

      setProgress('Analysing your portfolio…');
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? 'Verification failed. Please try again or upload your CAS PDF instead.');
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

  const sharedFieldsValid = name.length >= 2 && /^\d{10}$/.test(mobile) && consent;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="bg-gradient-to-r from-[#0A1628] via-[#1E3A5F] to-[#0D4F6B] text-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> AMFI-registered distributor · ARN-286886 · Free, no obligation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
            Get a professional portfolio<br />health check in 60 seconds.
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto">
            Fund-by-fund verdicts, duplicate detection, risk assessment, and tax estimates — all powered
            by the same AI engine our research desk uses for professional portfolio reviews.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {/* What you get */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 mb-5">
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

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => switchTab('pdf')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-bold transition-all ${
                tab === 'pdf'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Upload PDF
              <span className="text-[9px] font-bold bg-teal-600 text-white rounded-full px-1.5 py-0.5 uppercase leading-none">Recommended</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('pan')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-bold transition-all ${
                tab === 'pan'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4" /> PAN + OTP
              <span className="text-[9px] font-medium text-slate-400 normal-case leading-none">CDSL demat</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mb-4">
            Don&apos;t have your statement handy?{' '}
            <Link href="/portfolio-check-up" className="font-semibold text-teal-700 hover:underline">
              Try our 2-minute Portfolio Check-Up
            </Link>{' '}
            instead.
          </p>

          {/* Shared fields: name, mobile, consent */}
          <div className="space-y-4">
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

            {/* ── PAN+OTP Tab ── */}
            {tab === 'pan' && (
              <>
                {panStep === 'form' ? (
                  <form onSubmit={submitPan} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">PAN</span>
                        <input
                          type="text"
                          required
                          value={pan}
                          onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="ABCDE1234F"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono uppercase"
                          maxLength={10}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Date of birth</span>
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">CDSL Demat Account Number (BO ID)</span>
                      <input
                        type="text"
                        required
                        value={boId}
                        onChange={(e) => setBoId(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16-digit number (e.g. 1234567890123456)"
                        inputMode="numeric"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono tracking-wide"
                        maxLength={16}
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Found on your demat statement, contract note, or broker login page</span>
                    </label>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      We&apos;ll fetch your Consolidated Account Statement (CAS) directly from CDSL. An OTP will be sent to your mobile number registered with your depository.
                    </p>
                    <ConsentCheckbox consent={consent} setConsent={setConsent} />
                    {error && <ErrorBox message={error} />}
                    <button type="submit" disabled={busy || !sharedFieldsValid} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60">
                      {busy ? progress : 'Send OTP & fetch my CAS'} {!busy && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitOtp} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-semibold">OTP sent to your registered mobile</p>
                      <p className="text-xs text-blue-600 mt-0.5">Enter the OTP received from CDSL to proceed. PAN: {pan}</p>
                    </div>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Enter OTP</span>
                      <input
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Enter OTP"
                        inputMode="numeric"
                        autoFocus
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-center text-xl font-mono tracking-[0.3em]"
                        maxLength={8}
                      />
                    </label>
                    {error && <ErrorBox message={error} />}
                    <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60">
                      {busy ? progress : 'Verify & analyse my portfolio'} {!busy && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => { setPanStep('form'); setOtp(''); setError(null); }} className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium">
                      ← Back to PAN entry
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ── PDF Upload Tab ── */}
            {tab === 'pdf' && (
              <form onSubmit={submitPdf} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Your CAS / portfolio statement (PDF)</span>
                  <label
                    className={`mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                      dragOver
                        ? 'border-teal-500 bg-teal-50 scale-[1.01]'
                        : file
                        ? 'border-teal-400 bg-teal-50/30'
                        : 'border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f?.type === 'application/pdf') setFile(f);
                    }}
                  >
                    {file ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-teal-600" />
                        </div>
                        <span className="text-sm font-bold text-teal-700">{file.name}</span>
                        <span className="text-[11px] text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB · Click or drag to replace</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-teal-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {dragOver ? 'Drop your PDF here' : 'Click or drag your PDF here'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          CAMS · KFintech · MFCentral CAS · Trustner valuation report · max 12 MB
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    PDF password
                    <span className="font-normal normal-case text-slate-400 ml-1">(most CAS PDFs use your PAN as the password)</span>
                  </span>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g. ABCDE1234F" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                </label>

                {/* Help section */}
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Where do I get my CAS?
                  {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showHelp && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-700 mb-0.5">MFCentral (recommended)</div>
                      Visit <span className="font-semibold text-teal-700">mfcentral.com</span> → Login with PAN + mobile OTP → Download CAS. Covers all AMCs in one PDF.
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 mb-0.5">CAMS</div>
                      Visit <span className="font-semibold text-teal-700">camsonline.com</span> → Investor Services → Consolidated Account Statement → Enter email → PDF sent to your inbox.
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 mb-0.5">KFintech</div>
                      Visit <span className="font-semibold text-teal-700">kfintech.com</span> → Investor Services → CAS → Enter PAN → PDF sent to your inbox.
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      Tip: CAS PDFs are usually password-protected with your PAN number.
                    </p>
                  </div>
                )}

                <ConsentCheckbox consent={consent} setConsent={setConsent} />
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={busy || !sharedFieldsValid} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60">
                  {busy ? progress : 'Analyse my portfolio'} {!busy && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Lock className="w-3 h-3" /> Your data is processed on our servers only — never shared, never sold.</p>
          </div>
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

function ConsentCheckbox({ consent, setConsent }: { consent: boolean; setConsent: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
      <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span>I consent to Trustner Asset Services Pvt. Ltd. analysing my portfolio and contacting me (DPDP Act 2023). Data stays on Trustner systems and is never sold. <a href="/privacy" className="underline" target="_blank">Privacy policy</a>.</span>
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2.5">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />{message}
    </div>
  );
}
