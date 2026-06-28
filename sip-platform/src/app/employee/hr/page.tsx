import Link from 'next/link';
import { FileText, Users, ClipboardCheck, CalendarDays, Wallet, ShieldAlert, TrendingUp } from 'lucide-react';
import ExitsTile from './_exits-tile';
import ActiveCycleTile from './_active-cycle-tile';

/**
 * HR Workbench dashboard.
 * Phase 1 ships only Letters. Other tiles show "coming soon" with the
 * roadmap pointer so HR users know what's in flight.
 */
const TILES = [
  {
    href: '/employee/hr/letters/new',
    title: 'Generate HR Letter',
    desc: 'Offer · Appointment · Increment · Promotion · Warning · Relieving — entity-aware (TAS/TIB)',
    icon: FileText,
    active: true,
  },
  {
    href: '/employee/hr/employees',
    title: 'Employee Master',
    desc: 'KYC + family + bank + compensation. POSP cross-check backbone.',
    icon: Users,
    active: false,
  },
  {
    href: '/employee/hr/onboarding',
    title: 'New Joiner Onboarding',
    desc: 'Tokenised document upload + HR review.',
    icon: ClipboardCheck,
    active: false,
  },
  {
    href: '/employee/hr/attendance',
    title: 'Attendance & Leave',
    desc: 'Punch-in/out, leave requests, holiday calendar.',
    icon: CalendarDays,
    active: false,
  },
  {
    href: '/employee/hr/payroll',
    title: 'Payroll & Salary File',
    desc: 'Monthly salary, PF/ESI/PT/TDS, slip + bank advice.',
    icon: Wallet,
    active: false,
  },
  {
    href: '/employee/hr/compliance',
    title: 'Compliance & COI',
    desc: 'POSP cross-check, annual COI, quarterly business declaration.',
    icon: ShieldAlert,
    active: false,
  },
  {
    href: '/employee/hr/performance',
    title: 'Performance & Appraisals',
    desc: 'Annual & mid-year cycles, KRAs, 9-box, increment matrix, PIP.',
    icon: TrendingUp,
    active: true,
  },
];

export default function HrDashboard() {
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">HR Workbench</h1>
        <p className="text-sm text-slate-500 mt-1">
          Trustner Group · Internal HR operations · TAS &amp; TIB
        </p>
      </div>

      {/* Live ops tile — separation activity */}
      <ExitsTile />

      {/* Live ops tile — active appraisal cycle */}
      <ActiveCycleTile />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.active ? t.href : '#'}
              className={`group rounded-xl border bg-white p-5 transition-all ${
                t.active
                  ? 'border-slate-200 hover:border-brand hover:shadow-md cursor-pointer'
                  : 'border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${t.active ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                    {!t.active && (
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{t.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Phase 1 — In progress</div>
        <p className="text-sm text-amber-900 leading-relaxed">
          The HR Letter Generator is the first module shipped. More features land per the roadmap.
          Letters are persisted to the audit archive for compliance.
        </p>
      </div>
    </div>
  );
}
