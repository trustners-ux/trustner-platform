'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowLeftRight, AlertTriangle, CheckCircle2, Info, Sparkles,
  TrendingUp, TrendingDown, Target, ShieldAlert, IndianRupee, Banknote,
  Calculator, ChevronDown, ChevronUp, Scale,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ─── Types ──────────────────────────────────

type PolicyType = 'endowment' | 'money_back' | 'whole_life' | 'ulip' | 'other';
type MFRoute = 'equity' | 'hybrid' | 'debt';

const POLICY_TYPE_OPTIONS: { key: PolicyType; label: string }[] = [
  { key: 'endowment', label: 'Endowment' },
  { key: 'money_back', label: 'Money-Back' },
  { key: 'whole_life', label: 'Whole Life' },
  { key: 'ulip', label: 'ULIP' },
  { key: 'other', label: 'Other' },
];

const MF_ROUTE_OPTIONS: { key: MFRoute; label: string; defaultReturn: number }[] = [
  { key: 'equity', label: 'Equity Growth', defaultReturn: 12 },
  { key: 'hybrid', label: 'Hybrid Balanced', defaultReturn: 10 },
  { key: 'debt', label: 'Debt', defaultReturn: 7 },
];

// ─── Helpers ──────────────────────────────────

function fmtShortINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${formatNumber(Math.round(abs))}`;
}

// ─── IRR (annual, Newton-Raphson) — copied from insurance-irr ───
function computeIRR(cashflows: number[], guess = 0.1): number | null {
  if (cashflows.length < 2) return null;
  const hasPositive = cashflows.some((c) => c > 0);
  const hasNegative = cashflows.some((c) => c < 0);
  if (!hasPositive || !hasNegative) return null;

  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashflows[t] / denom;
      if (t > 0) {
        dnpv += (-t * cashflows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    if (!isFinite(npv) || !isFinite(dnpv) || dnpv === 0) break;
    const newRate = rate - npv / dnpv;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < 1e-7) {
      rate = newRate;
      break;
    }
    rate = newRate;
    if (rate < -0.9999) rate = -0.9999;
    if (rate > 10) rate = 10;
  }

  const checkNPV = (r: number) => cashflows.reduce((acc, c, t) => acc + c / Math.pow(1 + r, t), 0);
  if (!isFinite(rate) || Math.abs(checkNPV(rate)) > 1) {
    let lo = -0.99;
    let hi = 5;
    const fLo0 = checkNPV(lo);
    const fHi0 = checkNPV(hi);
    if (fLo0 * fHi0 > 0) return null;
    let fLo = fLo0;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fMid = checkNPV(mid);
      if (Math.abs(fMid) < 1e-4 || (hi - lo) < 1e-7) {
        rate = mid;
        break;
      }
      if (fLo * fMid < 0) {
        hi = mid;
      } else {
        lo = mid;
        fLo = fMid;
      }
      rate = (lo + hi) / 2;
    }
  }

  if (!isFinite(rate)) return null;
  return rate;
}

// Small UI
function MetricTile({
  icon, label, value, sub, tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'bad' | 'warn';
}) {
  const map: Record<string, { bg: string; border: string; iconBg: string; iconText: string; val: string }> = {
    neutral: { bg: 'bg-surface-50', border: 'border-surface-300', iconBg: 'bg-slate-100', iconText: 'text-slate-600', val: 'text-primary-700' },
    good: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', val: 'text-emerald-800' },
    bad: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', iconText: 'text-red-600', val: 'text-red-800' },
    warn: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', iconText: 'text-amber-600', val: 'text-amber-800' },
  };
  const s = map[tone];
  return (
    <div className={cn('rounded-xl border p-3', s.bg, s.border)}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.iconBg, s.iconText)}>{icon}</div>
      <div className="text-[11px] font-semibold text-slate-500 mb-0.5">{label}</div>
      <div className={cn('text-base sm:text-lg font-extrabold', s.val)}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function PillSelector<T extends string>({
  options, value, onChange, cols = 3,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className={cn('grid gap-1.5', cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-5')} data-pdf-hide>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            'py-2 text-[11px] font-semibold rounded-lg border transition-all',
            value === o.key
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-slate-500 border-surface-300 hover:border-violet-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Page Component ──────────────────────────────────

export default function SurrenderVsContinueCalculatorPage() {
  // Personal
  const [clientName, setClientName] = useState('');
  const [clientAgeBar, setClientAgeBar] = useState<number | null>(null);

  // Section 1: Existing Policy
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState<PolicyType>('endowment');
  const [annualPremium, setAnnualPremium] = useState(100000);
  const [ppt, setPpt] = useState(15);
  const [yearsPaid, setYearsPaid] = useState(5);
  const [sumAssured, setSumAssured] = useState(1500000);
  const [projectedMaturity, setProjectedMaturity] = useState(2400000);
  const [maturityYear, setMaturityYear] = useState(2036);

  // Section 2: Surrender details
  const [surrenderValue, setSurrenderValue] = useState(350000);
  const [loyaltyIfContinued, setLoyaltyIfContinued] = useState(0);

  // Section 3: Alternative route
  const [mfReturn, setMfReturn] = useState(12);
  const [mfRoute, setMfRoute] = useState<MFRoute>('equity');
  const [applyTax, setApplyTax] = useState(true);

  // UI
  const [showYearTable, setShowYearTable] = useState(false);

  // Quick consistency: yearsPaid must be < ppt
  const effectiveYearsPaid = Math.min(yearsPaid, Math.max(0, ppt - 1));
  const remainingYears = Math.max(0, ppt - effectiveYearsPaid);

  // Current calendar year baseline
  const currentYear = 2026; // conservative — user-facing "today"
  const yearsToMaturity = Math.max(1, maturityYear - currentYear);

  // ─── Core calculations ──
  const result = useMemo(() => {
    const T = yearsToMaturity;
    const mfR = mfReturn / 100;

    // ─── Path A: CONTINUE ───
    // Outflow: annual premium for next `remainingYears` years (paid at start of year 1..remainingYears)
    // Inflow: projected maturity + loyalty at year T
    // IRR on remaining period
    const continueFlows: number[] = [];
    for (let y = 0; y <= T; y++) {
      let net = 0;
      if (y < remainingYears) {
        net -= annualPremium;
      }
      if (y === T) {
        net += projectedMaturity + loyaltyIfContinued;
      }
      continueFlows.push(net);
    }
    const continueIRR = computeIRR(continueFlows);

    // Path A terminal wealth (nominal): maturity value + loyalty
    const pathATerminal = projectedMaturity + loyaltyIfContinued;
    const totalRemainingPremiums = annualPremium * remainingYears;

    // ─── Path B: SURRENDER + REINVEST ───
    // t=0 (today): lump sum = surrenderValue invested at mfR
    // For next `remainingYears` years at start of year: invest annualPremium (freed-up cash)
    // At t=T, total corpus
    // Tax: applied only on gains, using LTCG 12.5% > ₹1.25L for equity/hybrid (Budget 2024), slab (simplified 20%) for debt MF
    // Invested principal = surrenderValue + (annualPremium * remainingYears)

    let corpus = 0;
    // lump sum grows the full T years
    corpus += surrenderValue * Math.pow(1 + mfR, T);
    // each premium freed: invested at start of year y (y=1..remainingYears), grows for (T - (y-1)) years
    for (let y = 1; y <= remainingYears; y++) {
      corpus += annualPremium * Math.pow(1 + mfR, T - (y - 1));
    }
    const pathBPreTax = corpus;

    const principalInvested = surrenderValue + annualPremium * remainingYears;
    const gains = Math.max(0, pathBPreTax - principalInvested);

    let tax = 0;
    if (applyTax && gains > 0) {
      if (mfRoute === 'debt') {
        // debt — simplified slab rate 20% (user can adjust)
        tax = gains * 0.2;
      } else {
        // equity / hybrid — LTCG 12.5% on gains above ₹1.25L (Budget 2024, effective 23-Jul-2024)
        const taxable = Math.max(0, gains - 125000);
        tax = taxable * 0.125;
      }
    }
    const pathBTerminal = pathBPreTax - tax;

    // Delta
    const delta = pathBTerminal - pathATerminal;

    // Break-even remaining IRR — what rate on Path A cashflows would make PA terminal equal to pathBTerminal?
    // Keep premiums + use pathBTerminal as terminal inflow, solve for IRR
    const breakEvenFlows: number[] = [];
    for (let y = 0; y <= T; y++) {
      let net = 0;
      if (y < remainingYears) net -= annualPremium;
      if (y === T) net += pathBTerminal;
      breakEvenFlows.push(net);
    }
    const breakEvenIRR = computeIRR(breakEvenFlows);

    // Year-by-year series (remaining years)
    type YearRow = {
      yearIdx: number;
      calendarYear: number;
      pathAOutflow: number;
      pathATerminalRunning: number;
      pathBCorpus: number;
    };
    const rows: YearRow[] = [];

    // For path B corpus yearly, rebuild
    let pbRunning = surrenderValue; // t=0 lump sum (before growth)
    // Represent t=0 corpus at end of year 0 as just the surrender value (user's starting capital)
    // Path A running terminal: assume linear-ish accrual — show final at maturity
    for (let y = 0; y <= T; y++) {
      if (y === 0) {
        rows.push({
          yearIdx: y,
          calendarYear: currentYear + y,
          pathAOutflow: 0,
          pathATerminalRunning: 0,
          pathBCorpus: pbRunning,
        });
        continue;
      }
      // grow previous corpus by mfR
      pbRunning = pbRunning * (1 + mfR);
      // add annual premium at start of year (if still within remainingYears)
      if (y <= remainingYears) {
        pbRunning += annualPremium;
      }
      // Path A outflow this year
      const pathAOut = y <= remainingYears ? annualPremium : 0;
      // Path A terminal running — show cumulative premiums paid as negative until maturity; at maturity show final
      const pathATermRun = y === T ? pathATerminal : 0;

      rows.push({
        yearIdx: y,
        calendarYear: currentYear + y,
        pathAOutflow: pathAOut,
        pathATerminalRunning: pathATermRun,
        pathBCorpus: pbRunning,
      });
    }

    // For line chart: Path A "corpus" is a proxy — assume at year Y it's the PV-style progress
    // Simple approach: linear interpolation between 0 today and pathATerminal at maturity,
    // netting out premiums paid so far.
    const lineData = rows.map((r) => {
      const progress = r.yearIdx / T;
      const pathANotional = pathATerminal * progress - annualPremium * Math.min(r.yearIdx, remainingYears);
      return {
        year: r.calendarYear,
        pathA: Math.max(0, pathANotional),
        pathB: r.pathBCorpus,
      };
    });

    // Cashflow bar data — outflows (negative) + terminal inflows at maturity
    const cashflowData = rows.map((r) => ({
      year: r.calendarYear,
      pathAOut: -r.pathAOutflow,
      pathAIn: r.yearIdx === T ? pathATerminal : 0,
      pathBCorpus: r.pathBCorpus,
    }));

    return {
      T,
      remainingYears,
      totalRemainingPremiums,
      continueIRR: continueIRR !== null ? continueIRR * 100 : null,
      pathATerminal,
      pathBPreTax,
      pathBTerminal,
      tax,
      gains,
      principalInvested,
      delta,
      breakEvenIRR: breakEvenIRR !== null ? breakEvenIRR * 100 : null,
      rows,
      lineData,
      cashflowData,
    };
  }, [
    yearsToMaturity, remainingYears, annualPremium, projectedMaturity, loyaltyIfContinued,
    surrenderValue, mfReturn, mfRoute, applyTax, currentYear,
  ]);

  // ─── Verdict classification ──
  const verdict = useMemo(() => {
    const d = result.delta;
    const threshold = 200000; // ₹2L
    if (d > threshold) {
      return {
        label: 'CONSIDER SURRENDER',
        tone: 'good' as const,
        bg: 'from-emerald-50 to-green-50',
        text: 'text-emerald-700',
        ring: 'border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        detail: `Surrendering and redeploying into ${mfRoute === 'equity' ? 'equity mutual funds' : mfRoute === 'hybrid' ? 'hybrid mutual funds' : 'debt mutual funds'} (Regular Plan through your MFD) projects ~${fmtShortINR(Math.abs(d))} more wealth at maturity. Ensure term cover is in place first.`,
      };
    }
    if (d < -threshold) {
      return {
        label: 'CONTINUE',
        tone: 'bad' as const,
        bg: 'from-red-50 to-rose-50',
        text: 'text-red-700',
        ring: 'border-red-300',
        badge: 'bg-red-600 text-white',
        detail: `Continuing the policy to maturity projects ~${fmtShortINR(Math.abs(d))} more than the surrender-and-reinvest path. Surrender penalty in the early years is the main drag.`,
      };
    }
    return {
      label: 'MARGINAL — REVIEW',
      tone: 'warn' as const,
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      ring: 'border-amber-300',
      badge: 'bg-amber-500 text-white',
      detail: `Delta is within ±₹2L. Review tax treatment, liquidity needs, and declared bonuses with your Relationship Manager before deciding.`,
    };
  }, [result.delta, mfRoute]);

  // Context for lead form
  const leadContext = useMemo(() => {
    const irr = result.continueIRR !== null && isFinite(result.continueIRR) ? `${result.continueIRR.toFixed(2)}%` : '—';
    const deltaStr = `${result.delta >= 0 ? '+' : '-'}${fmtShortINR(Math.abs(result.delta))}`;
    return `Policy IRR ${irr}, MF alternative delta ${deltaStr}, ${verdict.label}`;
  }, [result.continueIRR, result.delta, verdict.label]);

  // Handle MF route change — update default return
  const handleMFRouteChange = (r: MFRoute) => {
    setMfRoute(r);
    const preset = MF_ROUTE_OPTIONS.find((o) => o.key === r);
    if (preset) setMfReturn(preset.defaultReturn);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <ArrowLeftRight className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">CFP-Grade Decision Tool</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Surrender vs Continue Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Decode your mid-policy life insurance: should you surrender now and switch to mutual funds, or continue paying? Get the exact rupee delta at maturity — with surrender penalty and tax treatment modelled.
              </p>
            </div>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-4xl">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Path A — Continue</div>
              <p className="text-xs text-slate-300">Pay remaining premiums, receive projected maturity + loyalty.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Path B — Surrender</div>
              <p className="text-xs text-slate-300">Take surrender value today + invest freed-up premiums in MF.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Delta at Maturity</div>
              <p className="text-xs text-slate-300">Exact rupee difference, post-tax — speak to your Relationship Manager before acting.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar
              name={clientName}
              onNameChange={setClientName}
              age={clientAgeBar}
              onAgeChange={setClientAgeBar}
              ageLabel="Current Age"
              namePlaceholder="e.g., Ram"
              showAge={false}
            />
            <DownloadPDFButton
              elementId="calculator-results"
              title="Surrender vs Continue Analysis"
              fileName={`Surrender-vs-Continue-${clientName || 'Analysis'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─── LEFT: Inputs ─── */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Section 1: Existing Policy */}
              <div className="border-t-4 border-brand rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand" /> Existing Policy
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Policy Name</label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      placeholder="e.g., LIC Jeevan Anand"
                      className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Policy Type</label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                      className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg border border-surface-300 bg-white text-slate-700 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none transition-all"
                    >
                      {POLICY_TYPE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <NumberInput label="Annual Premium" value={annualPremium} onChange={setAnnualPremium} prefix="₹" step={5000} min={0} max={10000000} />
                  <NumberInput label="Premium Paying Term (PPT)" value={ppt} onChange={setPpt} suffix="years" step={1} min={5} max={30} hint="How long premiums are paid" />
                  <NumberInput label="Years Already Paid" value={yearsPaid} onChange={(v) => setYearsPaid(Math.min(v, Math.max(1, ppt - 1)))} suffix="years" step={1} min={1} max={Math.max(1, ppt - 1)} hint={`Remaining to pay: ${remainingYears} years`} />
                  <NumberInput label="Sum Assured" value={sumAssured} onChange={setSumAssured} prefix="₹" step={50000} min={0} max={100000000} />
                  <NumberInput label="Projected Maturity Value" value={projectedMaturity} onChange={setProjectedMaturity} prefix="₹" step={50000} min={0} max={100000000} hint="From your policy bond / illustration" />
                  <NumberInput label="Year of Maturity" value={maturityYear} onChange={setMaturityYear} step={1} min={currentYear + 1} max={currentYear + 40} hint={`${yearsToMaturity} years from today`} />
                </div>
              </div>

              {/* Section 2: Surrender Details */}
              <div className="border-t-4 border-red-400 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Surrender Details (Today)
                </h3>
                <div className="space-y-3">
                  <NumberInput label="Current Surrender Value" value={surrenderValue} onChange={setSurrenderValue} prefix="₹" step={10000} min={0} max={100000000} hint="From your latest statement / online portal" />
                  <NumberInput label="Loyalty / Terminal Bonus Expected" value={loyaltyIfContinued} onChange={setLoyaltyIfContinued} prefix="₹" step={10000} min={0} max={100000000} hint="Extra payout if you continue to maturity" />
                </div>
              </div>

              {/* Section 3: Alternative Route */}
              <div className="border-t-4 border-violet-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-600" /> Alternative Route
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">MF Route</label>
                    <PillSelector options={MF_ROUTE_OPTIONS} value={mfRoute} onChange={handleMFRouteChange} cols={3} />
                  </div>
                  <NumberInput label="Expected MF Return" value={mfReturn} onChange={setMfReturn} suffix="% p.a." step={0.5} min={4} max={18} hint="Regular Plan through your MFD" />
                  <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setApplyTax(!applyTax)}
                      role="switch"
                      aria-checked={applyTax}
                      tabIndex={0}
                    >
                      <span className="text-[12px] font-semibold text-violet-700">
                        Apply Tax on MF Gains
                        <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                          {mfRoute === 'debt' ? 'Slab 20% (simplified)' : 'LTCG 12.5% > ₹1.25L'}
                        </span>
                      </span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors shrink-0', applyTax ? 'bg-violet-600' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', applyTax ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT: Results ─── */}
            <div className="space-y-6">

              {/* Hero verdict */}
              <div
                className={cn(
                  'rounded-2xl border-2 bg-gradient-to-br p-6 sm:p-8',
                  verdict.bg, verdict.ring,
                )}
                data-pdf-keep-together
              >
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <div className={cn('text-[11px] font-bold uppercase tracking-wider mb-1', verdict.text)}>Delta at Maturity ({maturityYear})</div>
                    <div className={cn('text-4xl sm:text-5xl font-extrabold tabular-nums', verdict.text)}>
                      {result.delta >= 0 ? '+' : '-'}{fmtShortINR(Math.abs(result.delta))}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Surrender → <span className="font-bold text-slate-700">{fmtShortINR(result.pathBTerminal)}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      Continue → <span className="font-bold text-slate-700">{fmtShortINR(result.pathATerminal)}</span>
                    </div>
                  </div>
                  <div className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider', verdict.badge)}>
                    {verdict.label}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{verdict.detail}</p>
              </div>

              {/* Metric tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricTile
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Policy IRR (Remaining)"
                  value={result.continueIRR !== null && isFinite(result.continueIRR) ? `${result.continueIRR.toFixed(2)}%` : '—'}
                  sub={`${result.remainingYears} premiums + maturity`}
                  tone={result.continueIRR !== null && result.continueIRR < 6 ? 'bad' : result.continueIRR !== null && result.continueIRR < 8 ? 'warn' : 'good'}
                />
                <MetricTile
                  icon={<Scale className="w-4 h-4" />}
                  label="Break-even IRR"
                  value={result.breakEvenIRR !== null && isFinite(result.breakEvenIRR) ? `${result.breakEvenIRR.toFixed(2)}%` : '—'}
                  sub="Path A would need this"
                  tone="neutral"
                />
                <MetricTile
                  icon={<Banknote className="w-4 h-4" />}
                  label="Remaining Premiums"
                  value={fmtShortINR(result.totalRemainingPremiums)}
                  sub={`Over ${result.remainingYears} years`}
                  tone="bad"
                />
                <MetricTile
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="Tax on MF Gains"
                  value={fmtShortINR(result.tax)}
                  sub={mfRoute === 'debt' ? 'Slab (20% approx)' : 'LTCG 12.5% > ₹1.25L'}
                  tone="warn"
                />
              </div>

              {/* Side-by-side summary cards */}
              <div className="grid md:grid-cols-2 gap-4" data-pdf-keep-together>
                {/* Path A */}
                <div className="rounded-xl border-2 border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">Path A</span>
                    <h4 className="font-bold text-slate-800">Continue to Maturity</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Remaining premium outflow</span><span className="font-bold text-red-700">-{fmtShortINR(result.totalRemainingPremiums)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Projected maturity</span><span className="font-bold text-emerald-700">+{fmtShortINR(projectedMaturity)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Loyalty / terminal bonus</span><span className="font-bold text-emerald-700">+{fmtShortINR(loyaltyIfContinued)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="font-semibold text-slate-700">Terminal wealth</span><span className="font-extrabold text-slate-900">{fmtShortINR(result.pathATerminal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IRR on remaining period</span><span className="font-bold text-slate-700">{result.continueIRR !== null && isFinite(result.continueIRR) ? `${result.continueIRR.toFixed(2)}%` : '—'}</span></div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-2">
                    Tax-free under Sec 10(10D) <em>if</em> annual premium ≤ 10% of sum assured — else maturity is taxable.
                  </div>
                </div>
                {/* Path B */}
                <div className="rounded-xl border-2 border-violet-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-700">Path B</span>
                    <h4 className="font-bold text-slate-800">Surrender + MF</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Surrender value today</span><span className="font-bold text-violet-700">+{fmtShortINR(surrenderValue)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Freed-up premiums invested</span><span className="font-bold text-violet-700">+{fmtShortINR(result.totalRemainingPremiums)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">MF corpus @ {mfReturn}% (pre-tax)</span><span className="font-bold text-emerald-700">{fmtShortINR(result.pathBPreTax)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Less: tax on gains</span><span className="font-bold text-red-700">-{fmtShortINR(result.tax)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="font-semibold text-slate-700">Terminal wealth (post-tax)</span><span className="font-extrabold text-slate-900">{fmtShortINR(result.pathBTerminal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Principal invested</span><span className="font-bold text-slate-700">{fmtShortINR(result.principalInvested)}</span></div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 bg-violet-50 border border-violet-200 rounded p-2">
                    Life cover is <strong>lost</strong> on surrender. Ensure a pure term plan is in place <em>before</em> surrendering.
                  </div>
                </div>
              </div>

              {/* Line chart — corpus over time */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Over Time</h3>
                <p className="text-sm text-slate-500 mb-4">Year-by-year projected wealth — Path A (notional accrual) vs Path B (MF compounding)</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.lineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtShortINR(v)} />
                      <Tooltip
                        formatter={(value: number, name: string) => [fmtShortINR(value), name]}
                        labelFormatter={(l) => `Year ${l}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="pathA" name="Path A — Continue" stroke="#475569" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="pathB" name="Path B — Surrender + MF" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cashflow bar chart */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cashflow Timeline — Path A (Continue)</h3>
                <p className="text-sm text-slate-500 mb-4">Premium outflows below the axis; maturity inflow at year {maturityYear}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.cashflowData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} stackOffset="sign">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtShortINR(v)} />
                      <Tooltip
                        formatter={(value: number, name: string) => [fmtShortINR(value), name]}
                        labelFormatter={(l) => `Year ${l}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                      <Bar dataKey="pathAOut" name="Premium Outflow" stackId="s" fill="#dc2626" />
                      <Bar dataKey="pathAIn" name="Maturity + Loyalty" stackId="s" fill="#059669" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-year table (collapsible) */}
              <div className="card-base p-5 sm:p-6" data-pdf-hide>
                <button
                  type="button"
                  onClick={() => setShowYearTable(!showYearTable)}
                  className="w-full flex items-center justify-between text-sm font-bold text-slate-800"
                >
                  <span>Year-by-Year Breakdown</span>
                  {showYearTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showYearTable && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 px-2 text-left font-bold text-slate-600">Year</th>
                          <th className="py-2 px-2 text-right font-bold text-slate-600">Path A Premium</th>
                          <th className="py-2 px-2 text-right font-bold text-slate-600">Path A Terminal</th>
                          <th className="py-2 px-2 text-right font-bold text-violet-700">Path B MF Corpus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((r) => (
                          <tr key={r.yearIdx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-1.5 px-2">{r.calendarYear}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-red-600">{r.pathAOutflow > 0 ? `-${fmtShortINR(r.pathAOutflow)}` : '-'}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-emerald-700">{r.pathATerminalRunning > 0 ? fmtShortINR(r.pathATerminalRunning) : '-'}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-semibold text-violet-700">{fmtShortINR(r.pathBCorpus)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Critical caveats */}
              <div className="card-base p-5 sm:p-6 border-2 border-amber-300 bg-amber-50/40" data-pdf-keep-together>
                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Caveats — Read Before Acting
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Surrender penalties apply in early years.</strong> Traditional plans typically pay only 30–50% of premiums-paid as surrender value in years 3–7. Your statement reflects this — do not assume the surrender value approaches premiums paid.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Life cover is lost on surrender.</strong> Buy a pure term plan <em>first</em> (far cheaper premium for 10x the cover) — only then execute the surrender. Do not leave dependents uninsured.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Tax on surrender proceeds:</strong> If annual premium exceeded 10% of sum assured (20% for pre-2012 policies), the surrender payout is <em>fully taxable</em> at slab rate under Sec 10(10D). Verify your policy's premium-to-SA ratio.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Bonuses can change the math.</strong> Participating policies declare yearly reversionary bonuses and a terminal bonus — these are not guaranteed, but actual declarations can materially improve Path A. Check the latest bonus notice.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Consider paid-up as a middle path.</strong> If you've crossed the minimum paying term (typically 2-3 years), you can stop paying further premiums and the policy continues in reduced paid-up form — no surrender penalty, reduced sum assured. Discuss with your Relationship Manager.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Do not surrender without speaking to your Relationship Manager.</strong> Mid-policy analysis can shift with declared bonuses, policy-specific loyalty additions, and your tax position — the spreadsheet math alone is insufficient.</span>
                  </li>
                </ul>
              </div>

              {/* CFP Notes */}
              <div className="card-base p-5 sm:p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" /> CFP Note
                </h3>
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  <p>
                    The only reasons to <strong>continue a mis-sold policy</strong> are:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 ml-2 text-slate-600">
                    <li>The remaining-period IRR exceeds what a Mutual Fund (Regular Plan through your MFD) can realistically deliver, <em>or</em></li>
                    <li>Surrender value is punitively low because you are in the early years of the policy, <em>or</em></li>
                    <li>The policy has unique tax or estate-planning benefits that a MF substitute cannot replicate.</li>
                  </ul>
                  <p>
                    For most policies in their final 3-5 years, completing the term often yields more than surrendering and redeploying — the surrender penalty drag has largely washed out by then. For policies in their first 3-7 years, the surrender penalty is typically severe enough that <strong>paid-up</strong> (stop paying, let it mature with reduced SA) is often mathematically superior to surrender.
                  </p>
                  <p>
                    Whatever the math says, <strong>never surrender without a term plan in place</strong>, and <strong>never surrender without speaking to your Relationship Manager</strong> — the decision has irreversible tax and insurance consequences.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="card-base p-4 bg-slate-50">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {DISCLAIMER.calculator}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                  Surrender value shown in this tool reflects what <em>you</em> entered from the insurer's latest statement. Actual surrender payout on the day of execution can differ due to interim bonus declarations, policy-specific terms, and the insurer's internal valuation. Projected maturity values assume bonuses continue at current declared rates — insurers may revise these.
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                  Tax treatment is simplified: equity/hybrid MFs use LTCG 12.5% above ₹1.25L per year (Budget 2024, effective 23-Jul-2024); debt MFs (post-Apr-2023) use a flat 20% proxy for slab rate. Your actual tax liability depends on your total income, holding period (STCG vs LTCG), and applicable slab. Surrender proceeds on policies where annual premium exceeded 10% of sum assured (20% for pre-Apr-2012 policies) are taxable at slab rate.
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                  {DISCLAIMER.mutual_fund}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                  {DISCLAIMER.amfi}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead capture */}
      <CalculatorLeadForm
        calculatorName="Surrender vs Continue Calculator"
        heading="Want an RM-reviewed surrender vs continue decision?"
        subtext="Share your contact — a Trustner Relationship Manager will review your policy bond, verify bonus declarations, and recommend the right call (surrender / paid-up / continue) with tax treatment factored in."
        resultContext={leadContext}
        accent="violet"
      />
    </>
  );
}
