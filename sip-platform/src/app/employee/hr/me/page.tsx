'use client';

/**
 * ESS personal dashboard — the home page for every employee logging in.
 * Aggregates: profile snapshot · pending policy signatures · leave balance
 * cards · recent payslips · my letters · quick links to sub-pages.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User, FileText, Wallet, Calendar, ShieldCheck, AlertTriangle,
  ArrowRight, Loader2, ClipboardCheck, MessageSquare, BookOpen, MapPin, Briefcase,
  LogOut, TrendingUp, Megaphone,
} from 'lucide-react';

interface MeAnnouncement { id: number; title: string; body: string; category: string; status: string; published_at: string | null; }
const ANN_CAT_STYLE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700', policy: 'bg-blue-100 text-blue-800',
  event: 'bg-violet-100 text-violet-800', celebration: 'bg-emerald-100 text-emerald-800',
  urgent: 'bg-rose-100 text-rose-800',
};

type AppraisalCycleStatus =
  | 'draft' | 'goals_open' | 'mid_year' | 'self_review_open'
  | 'manager_review_open' | 'skip_review_open' | 'calibration'
  | 'published' | 'archived';

interface AppraisalTileData {
  cycle: { cycle_code: string; status: AppraisalCycleStatus } | null;
  has_active_pip: boolean;
  acknowledged_at: string | null;
  rating: { final_performance_rating: number } | null;
}

const APPRAISAL_PROMPT: Record<AppraisalCycleStatus, { line: string; cta: string; href: string; tone: 'brand' | 'amber' | 'emerald' | 'slate' }> = {
  draft:               { line: 'Cycle being set up — nothing to do yet',            cta: 'View',                href: '/employee/hr/me/appraisal',            tone: 'slate' },
  goals_open:          { line: 'Goals window is open — review and lock them in',    cta: 'View goals',          href: '/employee/hr/me/appraisal',            tone: 'brand' },
  mid_year:            { line: 'Mid-year check-in is open',                         cta: 'Open check-in',       href: '/employee/hr/me/appraisal/midyear',    tone: 'amber' },
  self_review_open:    { line: 'Self-review is open',                               cta: 'Open self-review',    href: '/employee/hr/me/appraisal/self-review',tone: 'brand' },
  manager_review_open: { line: 'With your manager',                                 cta: 'View',                href: '/employee/hr/me/appraisal',            tone: 'slate' },
  skip_review_open:    { line: 'Skip-level review in progress',                     cta: 'View',                href: '/employee/hr/me/appraisal',            tone: 'slate' },
  calibration:         { line: 'Calibration in progress',                           cta: 'View',                href: '/employee/hr/me/appraisal',            tone: 'slate' },
  published:           { line: 'Final rating published',                            cta: 'See my rating',       href: '/employee/hr/me/appraisal',            tone: 'emerald' },
  archived:            { line: 'Cycle archived',                                    cta: 'View',                href: '/employee/hr/me/appraisal',            tone: 'slate' },
};

interface MeBundle {
  profile: {
    id: number;
    employee_code: string;
    entity: string;
    full_name: string;
    designation: string | null;
    department: string | null;
    grade_band: string | null;
    office_code: string | null;
    date_of_joining: string | null;
    email: string;
    phone: string | null;
    status: string;
    reporting_manager_name: string | null;
  } | null;
  auth_email?: string;
  note?: string;
  office?: { code: string; name: string; city: string; state: string } | null;
  leave_balances: Array<{
    available: number; credited: number; carried_forward: number;
    hr_leave_types: { code: string; name: string } | null;
  }>;
  pending_acks: Array<{ id: number; title: string; version: string; doc_code: string | null }>;
  recent_payslips: Array<{
    id: number; gross: number; net_pay: number; total_deductions: number;
    status: string;
    hr_salary_runs: { pay_month: string; entity: string } | null;
  }>;
  my_letters: Array<{
    id: number; letter_type: string; entity: string;
    serial_number: string | null; status: string; generated_at: string;
  }>;
  my_documents: Array<{ id: number; category: string; filename: string }>;
  fy: string;
  active_separation?: {
    id: number;
    case_code: string;
    status: string;
    lwd: string | null;
    approved_lwd: string | null;
    requested_lwd: string | null;
  } | null;
}

export default function MeDashboard() {
  const [data, setData] = useState<MeBundle | null>(null);
  const [appraisal, setAppraisal] = useState<AppraisalTileData | null>(null);
  const [announcements, setAnnouncements] = useState<MeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employee/hr/me')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    // Best-effort secondary fetch — silently degrades if endpoint isn't wired
    fetch('/api/employee/hr/me/appraisal')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setAppraisal(j); })
      .catch(() => { /* swallow */ });
    // Latest published announcements for the board tile
    fetch('/api/employee/hr/announcements')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.rows) setAnnouncements((j.rows as MeAnnouncement[]).filter((a) => a.status === 'published').slice(0, 3)); })
      .catch(() => { /* swallow */ });
  }, []);

  const inr = (v: number | null | undefined) =>
    v == null ? '—' : '₹ ' + Math.round(Number(v)).toLocaleString('en-IN');

  if (loading || !data) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!data.profile) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 flex gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-extrabold text-amber-900 mb-2">No employee record yet</h1>
            <p className="text-sm text-amber-900 mb-3">
              Your signed-in email <b>{data.auth_email}</b> is not linked to a Trustner employee
              record yet. HR will onboard you shortly.
            </p>
            <p className="text-xs text-amber-700">
              In the meantime you can still access the HR Workbench admin sections that you have
              permission for, or contact HR at wecare@trustner.in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const p = data.profile;
  return (
    <div className="p-8 max-w-6xl">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-2xl font-extrabold">
            {p.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">{p.entity} · {p.employee_code}</div>
            <h1 className="text-2xl font-extrabold">{p.full_name}</h1>
            <div className="text-sm text-slate-300 mt-1 flex flex-wrap gap-3">
              {p.designation && <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{p.designation}</span>}
              {data.office && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{data.office.city}</span>}
              {p.date_of_joining && <span>· Joined {new Date(p.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
          <Link href="/employee/hr/me/profile" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 text-sm font-bold hover:bg-white/10">
            View profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pending acknowledgements — urgent */}
      {data.pending_acks.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-rose-700" />
            <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              {data.pending_acks.length} pending signature{data.pending_acks.length === 1 ? '' : 's'} required
            </h2>
          </div>
          <div className="space-y-2">
            {data.pending_acks.map((ack) => (
              <div key={ack.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {ack.doc_code && <span className="font-mono text-xs text-slate-500 mr-2">{ack.doc_code}</span>}
                    {ack.title} <span className="text-xs text-slate-500">v{ack.version}</span>
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    Sign with OTP — required by HR policy
                  </div>
                </div>
                <Link
                  href={`/employee/hr/policies/${ack.id}/sign`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sign now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active resignation tile — only when a separation case is open */}
      {data.active_separation && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">
                  Resignation in progress · {data.active_separation.case_code}
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5 capitalize">
                  Status: {data.active_separation.status.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Last working day: {
                    (data.active_separation.lwd || data.active_separation.approved_lwd || data.active_separation.requested_lwd)
                      ? new Date(data.active_separation.lwd || data.active_separation.approved_lwd || data.active_separation.requested_lwd!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'to be confirmed'
                  }
                </div>
              </div>
            </div>
            <Link
              href={`/employee/hr/me/exit-request/${data.active_separation.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Open case <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Appraisal status tile — only when an active cycle exists */}
      {appraisal?.cycle && (() => {
        const prompt = APPRAISAL_PROMPT[appraisal.cycle.status];
        const toneCls = {
          brand:   'bg-slate-900 text-white border-slate-900',
          amber:   'bg-amber-50 text-amber-900 border-amber-200',
          emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          slate:   'bg-white text-slate-900 border-slate-200',
        }[prompt.tone];
        const iconBoxCls = prompt.tone === 'brand'
          ? 'bg-white/10 text-white'
          : 'bg-white border border-slate-200 text-slate-700';
        const ctaCls = prompt.tone === 'brand'
          ? 'bg-white text-slate-900 hover:bg-slate-100'
          : 'bg-slate-900 text-white hover:bg-slate-800';
        return (
          <div className={`rounded-xl border-2 ${toneCls} p-5 mb-6`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBoxCls}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${prompt.tone === 'brand' ? 'text-slate-300' : 'opacity-70'}`}>
                    Appraisal · cycle {appraisal.cycle.cycle_code}
                  </div>
                  <div className="text-base font-extrabold mt-0.5">
                    {prompt.line}
                    {appraisal.rating && appraisal.cycle.status === 'published' && (
                      <span className="ml-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-mono">
                        {appraisal.rating.final_performance_rating}/5
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 ${prompt.tone === 'brand' ? 'text-slate-300' : 'opacity-70'}`}>
                    {appraisal.has_active_pip
                      ? 'A Performance Improvement Plan is open — see the PIP page.'
                      : appraisal.cycle.status === 'published' && appraisal.acknowledged_at
                        ? 'Rating acknowledged.'
                        : appraisal.cycle.status === 'published'
                          ? 'Acknowledgement pending.'
                          : 'Open the appraisal hub for details.'}
                  </div>
                </div>
              </div>
              <Link
                href={prompt.href}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${ctaCls}`}
              >
                {prompt.cta} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Quick stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link href="/employee/hr/leave" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition group">
          <div className="flex items-center justify-between mb-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand" />
          </div>
          <div className="text-xs text-slate-500">Total leave available</div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {data.leave_balances.reduce((sum, b) => sum + Number(b.available || 0), 0).toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">days · {data.fy}</div>
        </Link>
        <Link href="/employee/hr/me/payslips" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition group">
          <div className="flex items-center justify-between mb-1">
            <Wallet className="w-4 h-4 text-amber-600" />
            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand" />
          </div>
          <div className="text-xs text-slate-500">Latest net pay</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {data.recent_payslips[0] ? inr(data.recent_payslips[0].net_pay) : '—'}
          </div>
          <div className="text-[10px] text-slate-400">
            {data.recent_payslips[0]?.hr_salary_runs?.pay_month ?? 'no payslip yet'}
          </div>
        </Link>
        <Link href="/employee/hr/me/documents" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition group">
          <div className="flex items-center justify-between mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand" />
          </div>
          <div className="text-xs text-slate-500">My documents</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {data.my_letters.length + data.my_documents.length}
          </div>
          <div className="text-[10px] text-slate-400">letters + uploaded docs</div>
        </Link>
        <Link href="/employee/hr/holidays" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition group">
          <div className="flex items-center justify-between mb-1">
            <BookOpen className="w-4 h-4 text-rose-600" />
            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand" />
          </div>
          <div className="text-xs text-slate-500">Office</div>
          <div className="text-lg font-extrabold text-slate-900 truncate">
            {data.office?.city || '—'}
          </div>
          <div className="text-[10px] text-slate-400">{data.office?.state}</div>
        </Link>
      </div>

      {/* Announcements board (latest published) */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand" /> Announcements
            </h2>
            <Link href="/employee/hr/announcements" className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {announcements.map((a) => (
              <Link key={a.id} href="/employee/hr/announcements" className="block rounded-lg border border-slate-100 hover:border-brand/40 hover:bg-slate-50 px-3 py-2 transition">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-slate-900">{a.title}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${ANN_CAT_STYLE[a.category] || ANN_CAT_STYLE.general}`}>{a.category}</span>
                  {a.published_at && <span className="text-[11px] text-slate-400 ml-auto">{new Date(a.published_at).toLocaleDateString('en-IN')}</span>}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{a.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leave balance breakdown */}
      {data.leave_balances.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Leave Balance — {data.fy}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {data.leave_balances.map((b, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{b.hr_leave_types?.code}</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{Number(b.available).toFixed(1)}</div>
                <div className="text-[10px] text-slate-400">of {Number(b.credited).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Recent Payslips + Recent Letters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              Recent Payslips
            </h2>
            <Link href="/employee/hr/me/payslips" className="text-xs text-brand font-semibold hover:underline">All</Link>
          </div>
          {data.recent_payslips.length === 0 ? (
            <div className="text-xs text-slate-500">No payslips on file yet.</div>
          ) : (
            <div className="space-y-1.5">
              {data.recent_payslips.slice(0, 5).map((slip) => (
                <a
                  key={slip.id}
                  href={`/api/employee/hr/payroll/runs/0/slips/${slip.id}?pdf=1`}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50"
                >
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{slip.hr_salary_runs?.pay_month ?? '—'}</div>
                    <div className="text-slate-500">{slip.hr_salary_runs?.entity}</div>
                  </div>
                  <div className="text-sm font-bold font-mono">{inr(slip.net_pay)}</div>
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Recent Letters
            </h2>
            <Link href="/employee/hr/me/documents" className="text-xs text-brand font-semibold hover:underline">All</Link>
          </div>
          {data.my_letters.length === 0 ? (
            <div className="text-xs text-slate-500">No letters generated for you yet.</div>
          ) : (
            <div className="space-y-1.5">
              {data.my_letters.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50">
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 capitalize">{l.letter_type.replace(/_/g, ' ')}</div>
                    <div className="text-slate-500 font-mono">{l.serial_number || '—'}</div>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">{l.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick-action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/employee/hr/attendance" className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand transition flex flex-col items-center justify-center text-center gap-1">
          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          <div className="text-xs font-bold text-slate-900">Punch In/Out</div>
        </Link>
        <Link href="/employee/hr/leave" className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand transition flex flex-col items-center justify-center text-center gap-1">
          <Calendar className="w-5 h-5 text-amber-600" />
          <div className="text-xs font-bold text-slate-900">Apply Leave</div>
        </Link>
        <Link href="/employee/hr/me/documents" className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand transition flex flex-col items-center justify-center text-center gap-1">
          <FileText className="w-5 h-5 text-blue-600" />
          <div className="text-xs font-bold text-slate-900">Documents</div>
        </Link>
        <Link href="/employee/hr/helpdesk" className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand transition flex flex-col items-center justify-center text-center gap-1">
          <MessageSquare className="w-5 h-5 text-violet-600" />
          <div className="text-xs font-bold text-slate-900">Help Desk</div>
        </Link>
      </div>
    </div>
  );
}
