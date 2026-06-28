'use client';

/**
 * Policy OTP-Signing flow — replaces physical signature with audit-grade
 * digital signature backed by OTP-verified identity, immutable timestamp,
 * IP + user-agent capture, and a tamper-proof SHA-256 audit hash.
 *
 * Three-step UX:
 *   1. Read — embedded PDF/DOCX viewer
 *   2. Agree — checkbox of T&Cs ("I have read and agree…")
 *   3. Verify — OTP sent to WhatsApp/email, employee enters 6-digit code
 *
 * On verify, system writes immutable row to hr_policy_acknowledgements.
 */
import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck, Mail, MessageCircle, Loader2, CheckCircle2,
  AlertCircle, FileText, Download, Send,
} from 'lucide-react';

interface PolicyInfo {
  id: number;
  title: string;
  version: string;
  requires_acknowledgement: boolean;
  blob_url: string;
}

interface SignStatus {
  policy: PolicyInfo;
  employee: { id: number; name: string; phone: string | null; email: string };
  already_signed: boolean;
  signed_at: string | null;
  signature_method: string | null;
}

type Step = 'read' | 'agree' | 'verify' | 'done';

export default function SignPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [status, setStatus] = useState<SignStatus | null>(null);
  const [step, setStep] = useState<Step>('read');
  const [agreed, setAgreed] = useState({ read: false, accurate: false, bound: false });
  const [otp, setOtp] = useState('');
  const [otpInfo, setOtpInfo] = useState<{ channel: string; target_masked: string; expires_in: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [auditHash, setAuditHash] = useState('');

  const load = () => {
    fetch(`/api/employee/hr/policies/${id}/sign`)
      .then((r) => r.json())
      .then((j) => {
        setStatus(j);
        if (j.already_signed) setStep('done');
      });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // OTP countdown
  useEffect(() => {
    if (!otpInfo || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpInfo, secondsLeft]);

  const allAgreed = agreed.read && agreed.accurate && agreed.bound;

  const sendOtp = async () => {
    setSending(true);
    setMsg('');
    try {
      const res = await fetch(`/api/employee/hr/policies/${id}/sign?action=send_otp`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || 'OTP send failed');
        return;
      }
      setOtpInfo({
        channel: j.delivery_channel,
        target_masked: j.delivery_target_masked,
        expires_in: j.expires_in_seconds,
      });
      setSecondsLeft(j.expires_in_seconds);
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) {
      setMsg('Enter the 6-digit OTP');
      return;
    }
    setVerifying(true);
    setMsg('');
    try {
      const res = await fetch(`/api/employee/hr/policies/${id}/sign?action=verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp,
          tnc_agreed: true,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || 'Verification failed');
        return;
      }
      setAuditHash(j.audit_hash);
      setStep('done');
      load();
    } finally {
      setVerifying(false);
    }
  };

  if (!status) {
    return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  const fmtSec = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/policies" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Digital Signature — {status.policy.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Version {status.policy.version} · OTP-verified · Immutable audit record
          </p>
        </div>
      </div>

      {/* Already signed banner */}
      {step === 'done' && status.already_signed && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-emerald-900 mb-1">✓ Signed</h2>
              <p className="text-sm text-emerald-900">
                You signed this policy on <b>{new Date(status.signed_at!).toLocaleString('en-IN')}</b> via{' '}
                <b>{status.signature_method?.replace('otp_', 'OTP-')}</b>.
              </p>
              {auditHash && (
                <p className="text-[10px] font-mono text-emerald-700 mt-2 break-all">
                  Audit hash: {auditHash}
                </p>
              )}
              <p className="text-xs text-emerald-700 mt-3">
                This signature is recorded with your IP address, browser, timestamp,
                and a tamper-proof SHA-256 hash. It is legally equivalent to a
                physical signature under the Information Technology Act, 2000.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — Read the policy */}
      {step === 'read' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">1</span>
            Read the Policy
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Please open and read the complete document before proceeding.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-slate-400" />
              <div>
                <div className="text-sm font-bold text-slate-900">{status.policy.title}</div>
                <div className="text-xs text-slate-500">Version {status.policy.version}</div>
              </div>
            </div>
            <a
              href={status.policy.blob_url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700"
            >
              <Download className="w-4 h-4" />
              Open Document
            </a>
          </div>
          <button
            onClick={() => setStep('agree')}
            className="mt-4 w-full px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
          >
            I have read the document → Continue
          </button>
        </div>
      )}

      {/* Step 2 — Agree to T&Cs */}
      {step === 'agree' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</span>
            Acknowledge &amp; Agree
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            By signing this acknowledgement, you confirm the following:
          </p>
          <div className="space-y-3 mb-5">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed.read}
                onChange={(e) => setAgreed({ ...agreed, read: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I have <b>read and understood</b> the {status.policy.title} (Version {status.policy.version}) in its entirety.
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed.bound}
                onChange={(e) => setAgreed({ ...agreed, bound: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I <b>agree to be bound by all terms, conditions, and obligations</b> set out in this policy,
                and I understand that any breach may constitute misconduct under my employment agreement.
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed.accurate}
                onChange={(e) => setAgreed({ ...agreed, accurate: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I understand that this <b>digital signature, supported by OTP verification</b>, is legally
                equivalent to a physical signature under the Information Technology Act, 2000, and is
                recorded with timestamp, IP address, and an immutable audit hash.
              </span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('read')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button
              onClick={() => setStep('verify')}
              disabled={!allAgreed}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-40"
            >
              Continue to OTP Verification
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — OTP Verification */}
      {step === 'verify' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">3</span>
            Identity Verification
          </h2>

          {!otpInfo ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                We&apos;ll send a 6-digit OTP to your registered{' '}
                {status.employee.phone ? <span className="inline-flex items-center gap-1 font-semibold"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp ({status.employee.phone})</span>
                  : <span className="inline-flex items-center gap-1 font-semibold"><Mail className="w-3.5 h-3.5" /> Email ({status.employee.email})</span>}.
                Enter the code to complete signing.
              </p>
              <button
                onClick={sendOtp}
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send OTP
              </button>
            </>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm text-emerald-900">
                ✓ OTP sent via <b>{otpInfo.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</b> to{' '}
                <b>{otpInfo.target_masked}</b>. {secondsLeft > 0 ? `Expires in ${fmtSec(secondsLeft)}` : 'Expired — request again'}.
              </div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 text-center text-2xl font-mono tracking-widest focus:border-brand outline-none"
                maxLength={6}
              />
              {msg && <div className="mt-2 text-xs text-rose-700">{msg}</div>}
              <div className="flex gap-2 mt-4">
                <button onClick={sendOtp} disabled={sending} className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Resend OTP
                </button>
                <button
                  onClick={verify}
                  disabled={otp.length !== 6 || verifying || secondsLeft === 0}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Verify &amp; Sign
                </button>
              </div>
            </>
          )}

          <button onClick={() => setStep('agree')} className="mt-3 text-xs text-slate-500 hover:underline">
            ← Review agreement
          </button>
        </div>
      )}

      {msg && !otpInfo && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {msg}
        </div>
      )}

      <div className="mt-6 text-[10px] text-slate-400 text-center">
        Audit log will capture: timestamp · IP address · browser · OTP delivery channel · SHA-256 hash.
        This satisfies the Information Technology Act, 2000 requirements for electronic signatures.
      </div>
    </div>
  );
}
