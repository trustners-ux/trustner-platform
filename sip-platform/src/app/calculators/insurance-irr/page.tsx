'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calculator, Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  IndianRupee, Target, AlertTriangle, CheckCircle2, Info, Sparkles, Banknote, ShieldAlert,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

// ─── Types ──────────────────────────────────

type PolicyType =
  | 'endowment'
  | 'money_back'
  | 'guaranteed_income'
  | 'ulip'
  | 'whole_life'
  | 'other';

type PremiumFrequency = 'yearly' | 'half_yearly' | 'quarterly' | 'monthly';

type BenefitType =
  | 'survival'
  | 'money_back'
  | 'guaranteed_addition'
  | 'loyalty_addition'
  | 'maturity'
  | 'bonus'
  | 'pension'
  | 'other';

type BenefitFrequency = 'one_time' | 'yearly';

interface BenefitRow {
  id: string;
  type: BenefitType;
  startYear: number;    // relative to policy start (1 = first policy year)
  endYear: number;      // for recurring benefits; ignored if one_time
  amount: number;
  frequency: BenefitFrequency;
  growthRate: number;   // %
}

// ─── Constants ──────────────────────────────────

const POLICY_TYPE_OPTIONS: { key: PolicyType; label: string }[] = [
  { key: 'endowment', label: 'Endowment' },
  { key: 'money_back', label: 'Money-Back' },
  { key: 'guaranteed_income', label: 'Guaranteed Income (Non-Par)' },
  { key: 'ulip', label: 'ULIP' },
  { key: 'whole_life', label: 'Whole Life' },
  { key: 'other', label: 'Other' },
];

const PREMIUM_FREQUENCY_OPTIONS: { key: PremiumFrequency; label: string }[] = [
  { key: 'yearly', label: 'Yearly' },
  { key: 'half_yearly', label: 'Half-Yearly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'monthly', label: 'Monthly' },
];

const BENEFIT_TYPE_OPTIONS: { key: BenefitType; label: string }[] = [
  { key: 'survival', label: 'Survival Benefit' },
  { key: 'money_back', label: 'Money-Back' },
  { key: 'guaranteed_addition', label: 'Guaranteed Addition' },
  { key: 'loyalty_addition', label: 'Loyalty Addition' },
  { key: 'maturity', label: 'Maturity Benefit' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'pension', label: 'Pension' },
  { key: 'other', label: 'Other Inflow' },
];

const BENEFIT_FREQUENCY_OPTIONS: { key: BenefitFrequency; label: string }[] = [
  { key: 'one_time', label: 'One-time' },
  { key: 'yearly', label: 'Yearly' },
];

const FREQ_MULTIPLIER: Record<PremiumFrequency, number> = {
  yearly: 1,
  half_yearly: 2,
  quarterly: 4,
  monthly: 12,
};

// Months between premium instalments for XIRR date placement
const FREQ_MONTHS: Record<PremiumFrequency, number> = {
  yearly: 12,
  half_yearly: 6,
  quarterly: 3,
  monthly: 1,
};

// ─── Helpers ──────────────────────────────────

function makeId(prefix = 'b'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function fmtShortINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${formatNumber(Math.round(abs))}`;
}

// ─── IRR (annual, Newton-Raphson) ───
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
    // Safety clamp
    if (rate < -0.9999) rate = -0.9999;
    if (rate > 10) rate = 10;
  }

  // Fallback bisection if Newton didn't converge sensibly
  const checkNPV = (r: number) => cashflows.reduce((acc, c, t) => acc + c / Math.pow(1 + r, t), 0);
  if (!isFinite(rate) || Math.abs(checkNPV(rate)) > 1) {
    let lo = -0.99;
    let hi = 5;
    let fLo = checkNPV(lo);
    let fHi = checkNPV(hi);
    if (fLo * fHi > 0) return null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fMid = checkNPV(mid);
      if (Math.abs(fMid) < 1e-4 || (hi - lo) < 1e-7) {
        rate = mid;
        break;
      }
      if (fLo * fMid < 0) {
        hi = mid;
        fHi = fMid;
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

// ─── XIRR (date-based, Act/365 Newton-Raphson) ───
interface DatedFlow { date: Date; amount: number; }

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function xnpv(rate: number, flows: DatedFlow[]): number {
  const d0 = flows[0].date;
  let sum = 0;
  for (const f of flows) {
    const years = daysBetween(d0, f.date) / 365;
    sum += f.amount / Math.pow(1 + rate, years);
  }
  return sum;
}

function computeXIRR(flows: DatedFlow[], guess = 0.1): number | null {
  if (flows.length < 2) return null;
  const hasPos = flows.some((f) => f.amount > 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg) return null;

  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const d0 = sorted[0].date;

  const xnpvDeriv = (rate: number) => {
    let sum = 0;
    for (const f of sorted) {
      const years = daysBetween(d0, f.date) / 365;
      if (years === 0) continue;
      sum += (-years * f.amount) / Math.pow(1 + rate, years + 1);
    }
    return sum;
  };

  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    const v = xnpv(rate, sorted);
    const dv = xnpvDeriv(rate);
    if (!isFinite(v) || !isFinite(dv) || dv === 0) break;
    const next = rate - v / dv;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) {
      rate = next;
      break;
    }
    rate = next;
    if (rate < -0.9999) rate = -0.9999;
    if (rate > 10) rate = 10;
  }

  // Bisection fallback
  const check = (r: number) => xnpv(r, sorted);
  if (!isFinite(rate) || Math.abs(check(rate)) > 1) {
    let lo = -0.99;
    let hi = 5;
    const fLo0 = check(lo);
    const fHi0 = check(hi);
    if (fLo0 * fHi0 > 0) return null;
    let fLo = fLo0;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fMid = check(mid);
      if (Math.abs(fMid) < 1e-4 || (hi - lo) < 1e-8) {
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

// ─── Presets ──────────────────────────────────

interface PresetDef {
  key: 'money_back' | 'guaranteed_income' | 'endowment';
  label: string;
  tagline: string;
  build: (ppt: number, premiumAnnual: number) => {
    benefits: Omit<BenefitRow, 'id'>[];
    sumAssured: number;
    maturityYear: number;
  };
}

const PRESETS: PresetDef[] = [
  {
    key: 'money_back',
    label: 'Money-Back Policy',
    tagline: 'LIC Jeevan Umang style',
    build: (ppt, premiumAnnual) => ({
      benefits: [
        { type: 'money_back', startYear: 5, endYear: 5, amount: Math.round(premiumAnnual * 1.5), frequency: 'one_time', growthRate: 0 },
        { type: 'money_back', startYear: 10, endYear: 10, amount: Math.round(premiumAnnual * 1.5), frequency: 'one_time', growthRate: 0 },
        { type: 'money_back', startYear: 15, endYear: 15, amount: Math.round(premiumAnnual * 1.5), frequency: 'one_time', growthRate: 0 },
      ],
      sumAssured: Math.round(premiumAnnual * ppt * 1.5),
      maturityYear: ppt + 5,
    }),
  },
  {
    key: 'guaranteed_income',
    label: 'Non-Par Guaranteed Income',
    tagline: 'HDFC Sanchay Plus style',
    build: (ppt, premiumAnnual) => ({
      benefits: [
        {
          type: 'guaranteed_addition',
          startYear: ppt + 1,
          endYear: ppt + 25,
          amount: Math.round(premiumAnnual * 0.9),
          frequency: 'yearly',
          growthRate: 0,
        },
      ],
      sumAssured: Math.round(premiumAnnual * ppt * 1.1),
      maturityYear: ppt + 25,
    }),
  },
  {
    key: 'endowment',
    label: 'Endowment (Maturity Only)',
    tagline: 'Classic bundled plan',
    build: (ppt, premiumAnnual) => ({
      benefits: [],
      sumAssured: Math.round(premiumAnnual * ppt * 1.8),
      maturityYear: ppt,
    }),
  },
];

// ─── Small UI Components ──────────────────────────────────

function PillSelector<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" data-pdf-hide>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            'py-2 text-[11px] font-semibold rounded-lg border transition-all',
            value === o.key
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-slate-500 border-surface-300 hover:border-brand-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

// ─── Page Component ──────────────────────────────────

export default function InsuranceIRRCalculatorPage() {
  // Section 1: Policy Details
  const [clientName, setClientName] = useState('');
  const [clientAgeBar, setClientAgeBar] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState(35);
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState<PolicyType>('endowment');
  const [startYear, setStartYear] = useState(2026);

  // Section 2: Premium
  const [premiumAmount, setPremiumAmount] = useState(100000);
  const [premiumFrequency, setPremiumFrequency] = useState<PremiumFrequency>('yearly');
  const [ppt, setPpt] = useState(15);
  const [alreadyPaidYears, setAlreadyPaidYears] = useState(0);
  const [premiumInflationEnabled, setPremiumInflationEnabled] = useState(false);
  const [premiumInflation, setPremiumInflation] = useState(0);

  // Section 3: Benefits
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [sumAssured, setSumAssured] = useState(2000000);
  const [maturityYear, setMaturityYear] = useState(20);

  // Section 4: Benchmark
  const [mfReturn, setMfReturn] = useState(12);

  // UI state
  const [showCashflowTable, setShowCashflowTable] = useState(false);

  // ─── Helpers for benefit rows ──
  const addBenefit = () => {
    setBenefits((prev) => [
      ...prev,
      {
        id: makeId(),
        type: 'survival',
        startYear: 5,
        endYear: 5,
        amount: 50000,
        frequency: 'one_time',
        growthRate: 0,
      },
    ]);
  };

  const updateBenefit = (id: string, patch: Partial<BenefitRow>) => {
    setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBenefit = (id: string) => {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  };

  const applyPreset = (key: PresetDef['key']) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const premiumAnnual = premiumAmount * FREQ_MULTIPLIER[premiumFrequency];
    const built = preset.build(ppt, premiumAnnual);
    setBenefits(built.benefits.map((b) => ({ ...b, id: makeId() })));
    setSumAssured(built.sumAssured);
    setMaturityYear(built.maturityYear);
  };

  // ─── Calculation engine ──
  const result = useMemo(() => {
    // Annual premium total
    const annualPremium = premiumAmount * FREQ_MULTIPLIER[premiumFrequency];
    const premiumGrowth = premiumInflationEnabled ? premiumInflation / 100 : 0;

    // Determine total tenure: max of (ppt, maturityYear, all benefit endYears) capped at 40
    const benefitMaxYear = benefits.reduce(
      (mx, b) => Math.max(mx, b.frequency === 'yearly' ? Math.max(b.startYear, b.endYear) : b.startYear),
      0,
    );
    const tenure = Math.min(40, Math.max(ppt, maturityYear, benefitMaxYear, 1));

    // Build yearly cashflows (policy year 1..tenure). Year 1 = first policy year.
    // Convention: premiums at START of year (outflow), benefits at END of year (inflow).
    // For IRR we use one cashflow per year with net = benefits - premiums for that year.
    // For XIRR we place premiums on their instalment dates (evenly spread) and benefits at year-end.

    const yearlyRows: {
      year: number;
      age: number;
      premium: number;     // negative value representing annual premium total
      benefit: number;     // positive total benefits that year
      net: number;         // benefit + premium (premium is negative)
      cumulative: number;
    }[] = [];

    // Yearly IRR flows
    const irrFlows: number[] = [];
    // Date-based XIRR flows
    const xirrFlows: DatedFlow[] = [];

    const policyStart = new Date(startYear, 0, 1); // Jan 1 of start year

    let cumulative = 0;
    for (let y = 1; y <= tenure; y++) {
      // Premium for this year (only during unpaid remainder of PPT)
      const isPremiumYear = y > alreadyPaidYears && y <= ppt;
      let premiumYear = 0;
      if (isPremiumYear) {
        // Effective growth applies from year 1; escalate at premiumGrowth
        premiumYear = annualPremium * Math.pow(1 + premiumGrowth, y - 1);
      }

      // Benefits for this year
      let benefitYear = 0;
      for (const b of benefits) {
        if (b.frequency === 'one_time') {
          if (y === b.startYear) {
            benefitYear += b.amount;
          }
        } else {
          // yearly recurring
          const endY = Math.max(b.startYear, b.endYear || b.startYear);
          if (y >= b.startYear && y <= endY) {
            const yearsFromStart = y - b.startYear;
            benefitYear += b.amount * Math.pow(1 + (b.growthRate || 0) / 100, yearsFromStart);
          }
        }
      }
      // Maturity / Sum assured payout at maturity year
      if (y === maturityYear && sumAssured > 0) {
        benefitYear += sumAssured;
      }

      const net = benefitYear - premiumYear;
      cumulative += net;

      yearlyRows.push({
        year: y,
        age: currentAge + y - 1,
        premium: -premiumYear,
        benefit: benefitYear,
        net,
        cumulative,
      });

      // IRR yearly bucket (index t=0 is year 1 start)
      irrFlows.push(net);

      // XIRR: premiums spread across instalments within the year, benefits at year end
      if (premiumYear > 0) {
        const instalments = FREQ_MULTIPLIER[premiumFrequency];
        const perInstalment = premiumYear / instalments;
        const monthGap = FREQ_MONTHS[premiumFrequency];
        for (let k = 0; k < instalments; k++) {
          const d = new Date(policyStart);
          // Year offset (y-1) + month offset (k * monthGap)
          d.setFullYear(policyStart.getFullYear() + (y - 1));
          d.setMonth(policyStart.getMonth() + k * monthGap);
          xirrFlows.push({ date: d, amount: -perInstalment });
        }
      }
      if (benefitYear > 0) {
        const d = new Date(policyStart);
        d.setFullYear(policyStart.getFullYear() + (y - 1));
        d.setMonth(policyStart.getMonth() + 11);
        d.setDate(28);
        xirrFlows.push({ date: d, amount: benefitYear });
      }
    }

    // Totals
    const totalPremiums = yearlyRows.reduce((s, r) => s + Math.abs(r.premium), 0);
    const totalBenefits = yearlyRows.reduce((s, r) => s + r.benefit, 0);
    const netGain = totalBenefits - totalPremiums;

    // IRR / XIRR
    const irrRaw = computeIRR(irrFlows);
    const xirrRaw = computeXIRR(xirrFlows);
    const irrPct = irrRaw !== null ? irrRaw * 100 : null;
    const xirrPct = xirrRaw !== null ? xirrRaw * 100 : null;

    // MF Alternative: invest premium outflows at mfReturn, compute terminal value at end of tenure
    const mfR = mfReturn / 100;
    let mfCorpus = 0;
    for (let y = 1; y <= tenure; y++) {
      // Compound prior balance
      mfCorpus *= 1 + mfR;
      // Add this year's premium (if any) — treated as year-start investment, so already grows this year
      const r = yearlyRows[y - 1];
      if (r.premium < 0) {
        mfCorpus += Math.abs(r.premium) * (1 + mfR); // treat premium at start, so compound one full year
      }
    }
    // The block above double-compounds; let's redo cleanly.
    mfCorpus = 0;
    for (let y = 1; y <= tenure; y++) {
      mfCorpus *= 1 + mfR;
      const r = yearlyRows[y - 1];
      if (r.premium < 0) {
        mfCorpus += Math.abs(r.premium);
      }
    }
    // After loop, mfCorpus includes premium of final year with 0 compounding that year;
    // since premiums are paid at start of year, apply one extra compounding for all contributions at start.
    // Simpler: recompute with start-of-year convention.
    mfCorpus = 0;
    for (let y = 1; y <= tenure; y++) {
      const r = yearlyRows[y - 1];
      if (r.premium < 0) {
        // start of year contribution grows for (tenure - y + 1) years
        mfCorpus += Math.abs(r.premium) * Math.pow(1 + mfR, tenure - y + 1);
      }
    }

    const gapVsMF = mfCorpus - totalBenefits;
    const gapPct = totalBenefits > 0 ? (gapVsMF / totalBenefits) * 100 : 0;

    return {
      tenure,
      yearlyRows,
      totalPremiums,
      totalBenefits,
      netGain,
      irrPct,
      xirrPct,
      mfCorpus,
      gapVsMF,
      gapPct,
    };
  }, [
    premiumAmount, premiumFrequency, ppt, alreadyPaidYears, premiumInflationEnabled, premiumInflation,
    benefits, sumAssured, maturityYear, mfReturn, startYear, currentAge,
  ]);

  // ─── IRR band classification ──
  const irrBand = useMemo(() => {
    const v = result.irrPct;
    if (v === null || !isFinite(v)) {
      return {
        label: 'IRR Not Computable',
        detail: 'Insufficient sign changes in cashflows. Add benefits or adjust inputs.',
        tone: 'neutral' as const,
        hex: '#64748b',
        bg: 'from-slate-50 to-surface-100',
        text: 'text-slate-700',
        ring: 'border-slate-300',
      };
    }
    if (v >= 7) {
      return {
        label: 'Reasonable for a Guaranteed Product',
        detail: `At ${v.toFixed(2)}% p.a., returns are comparable to bank FDs or small savings schemes.`,
        tone: 'good' as const,
        hex: '#059669',
        bg: 'from-emerald-50 to-green-50',
        text: 'text-emerald-700',
        ring: 'border-emerald-300',
      };
    }
    if (v >= 5) {
      return {
        label: 'Below FD Rates',
        detail: `At ${v.toFixed(2)}% p.a., the policy is trailing typical fixed deposit returns on a post-tax basis.`,
        tone: 'warn' as const,
        hex: '#d97706',
        bg: 'from-amber-50 to-orange-50',
        text: 'text-amber-700',
        ring: 'border-amber-300',
      };
    }
    return {
      label: 'Significantly Underperforming',
      detail: `At ${v.toFixed(2)}% p.a., the policy is materially underperforming most risk-free alternatives.`,
      tone: 'bad' as const,
      hex: '#dc2626',
      bg: 'from-red-50 to-rose-50',
      text: 'text-red-700',
      ring: 'border-red-300',
    };
  }, [result.irrPct]);

  // ─── Chart data ──
  const chartData = result.yearlyRows.map((r) => ({
    year: r.year,
    premium: r.premium,  // negative
    benefit: r.benefit,  // positive
    net: r.net,
    cumulative: r.cumulative,
  }));

  // ─── Commentary ──
  const insight = useMemo(() => {
    const v = result.irrPct;
    const gap = result.gapVsMF;
    const lines: string[] = [];
    if (v !== null && isFinite(v)) {
      if (v >= 7) {
        lines.push(`Your policy is delivering an IRR of ${v.toFixed(2)}% — decent for a guaranteed, capital-protected instrument. However, it still trails long-term equity mutual fund returns by a wide margin.`);
      } else if (v >= 5) {
        lines.push(`An IRR of ${v.toFixed(2)}% is below typical FD rates. Before continuing, evaluate whether the life cover embedded in this policy is necessary — a pure Term Plan typically costs a fraction of this premium.`);
      } else {
        lines.push(`An IRR of ${v.toFixed(2)}% is a red flag. You are effectively locking capital with negative real returns after inflation.`);
      }
    }
    if (gap > 0) {
      lines.push(`If the same premiums had flowed into a Mutual Fund (Regular Plan through your MFD) earning ~${mfReturn}% p.a., the terminal corpus would be ~${fmtShortINR(result.mfCorpus)} — a gap of ${fmtShortINR(gap)} (${result.gapPct.toFixed(0)}%) versus what this policy pays out.`);
    }
    lines.push(`Rule of thumb: Term + Mutual Fund (Regular Plan through your MFD) usually outperforms bundled insurance-investment policies over a 15-30 year horizon.`);
    return lines;
  }, [result, mfReturn]);

  // ─── Render ─────────────────────────────────────────────

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
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">CFP-Grade Tool</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Insurance IRR / XIRR Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Decode what your life insurance policy is <em>really</em> yielding — and compare it to a Mutual Fund alternative.
              </p>
            </div>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-4xl">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">IRR</div>
              <p className="text-xs text-slate-300">Annualised return assuming all cashflows occur once per year.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">XIRR</div>
              <p className="text-xs text-slate-300">Date-precise return accounting for when each premium / benefit actually occurs.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Surrender vs Continue</div>
              <p className="text-xs text-slate-300">IRR alone does not decide — talk to your Relationship Manager before surrendering.</p>
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
              title="Insurance IRR Analysis"
              fileName={`Insurance-IRR-${clientName || 'Analysis'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─── LEFT: Inputs ─── */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Section 1: Policy Details */}
              <div className="border-t-4 border-brand rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand" /> Policy Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Client Name</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g., Ram Sharma"
                      className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <NumberInput label="Current Age" value={currentAge} onChange={setCurrentAge} suffix="years" step={1} min={20} max={80} />
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Policy Name</label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      placeholder="e.g., LIC Jeevan Anand"
                      className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Policy Type</label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                      className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg border border-surface-300 bg-white text-slate-700 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none transition-all"
                    >
                      {POLICY_TYPE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <NumberInput label="Premium Start Year" value={startYear} onChange={setStartYear} step={1} min={1990} max={2050} />
                </div>
              </div>

              {/* Section 2: Premium */}
              <div
                className="border-t-4 border-red-400 rounded-xl bg-white p-4"
                data-pdf-cost-card="Premium"
              >
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Premium (Outflow)
                </h3>
                <div className="space-y-3">
                  <NumberInput label="Premium Amount (per instalment)" value={premiumAmount} onChange={setPremiumAmount} prefix="₹" step={1000} min={0} max={10000000} />
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Premium Frequency</label>
                    <PillSelector options={PREMIUM_FREQUENCY_OPTIONS} value={premiumFrequency} onChange={setPremiumFrequency} />
                  </div>
                  <NumberInput label="Premium Paying Term (PPT)" value={ppt} onChange={setPpt} suffix="years" step={1} min={1} max={40} hint="How long premiums are paid" />
                  <NumberInput label="Already Paid" value={alreadyPaidYears} onChange={(v) => setAlreadyPaidYears(Math.min(v, Math.max(0, ppt - 1)))} suffix="years" step={1} min={0} max={Math.max(0, ppt - 1)} hint="Years of premium already paid (for mid-policy modelling)" />
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setPremiumInflationEnabled(!premiumInflationEnabled)}
                      role="switch"
                      aria-checked={premiumInflationEnabled}
                      tabIndex={0}
                    >
                      <span className="text-[12px] font-semibold text-amber-700">Premium Inflation (ULIP-style)</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', premiumInflationEnabled ? 'bg-amber-500' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', premiumInflationEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>
                    {premiumInflationEnabled && (
                      <div className="mt-2">
                        <NumberInput label="" value={premiumInflation} onChange={setPremiumInflation} suffix="% p.a." step={0.5} min={0} max={15} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Benefits */}
              <div className="border-t-4 border-emerald-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Benefits (Inflows)
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">Add every survival, money-back, guaranteed addition, bonus or pension payout</p>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mb-4" data-pdf-hide>
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      title={p.tagline}
                      className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {benefits.map((b, idx) => (
                    <div
                      key={b.id}
                      data-pdf-event-card={`Benefit ${idx + 1}`}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Benefit {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(b.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          data-pdf-hide
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Benefit Type</label>
                        <select
                          value={b.type}
                          onChange={(e) => updateBenefit(b.id, { type: e.target.value as BenefitType })}
                          className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-surface-300 bg-white text-slate-700 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none"
                        >
                          {BENEFIT_TYPE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                      </div>
                      <NumberInput label="Amount" value={b.amount} onChange={(v) => updateBenefit(b.id, { amount: v })} prefix="₹" step={5000} min={0} max={50000000} />
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Frequency</label>
                        <div className="grid grid-cols-2 gap-1.5" data-pdf-hide>
                          {BENEFIT_FREQUENCY_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              onClick={() => updateBenefit(b.id, { frequency: o.key })}
                              className={cn(
                                'py-1.5 text-xs font-semibold rounded-lg border transition-all',
                                b.frequency === o.key
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-500 border-surface-300 hover:border-emerald-200'
                              )}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberInput label="Start Year" value={b.startYear} onChange={(v) => updateBenefit(b.id, { startYear: Math.max(1, Math.min(40, v)) })} step={1} min={1} max={40} />
                        {b.frequency === 'yearly' ? (
                          <NumberInput label="End Year" value={b.endYear} onChange={(v) => updateBenefit(b.id, { endYear: Math.max(b.startYear, Math.min(40, v)) })} step={1} min={b.startYear} max={40} />
                        ) : (
                          <div className="opacity-40 pointer-events-none">
                            <NumberInput label="End Year" value={b.startYear} onChange={() => {}} step={1} min={1} max={40} />
                          </div>
                        )}
                      </div>
                      {b.frequency === 'yearly' && (
                        <NumberInput label="Growth Rate" value={b.growthRate} onChange={(v) => updateBenefit(b.id, { growthRate: v })} suffix="% p.a." step={0.5} min={0} max={15} hint="Optional: escalating yearly benefit" />
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addBenefit}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-emerald-700 border border-emerald-300 border-dashed rounded-lg hover:bg-emerald-50 transition-colors"
                    data-pdf-hide
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Benefit Row
                  </button>
                </div>

                {/* Death benefit / Maturity */}
                <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/40 p-3 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Sum Assured / Maturity</div>
                  <NumberInput label="Sum Assured at Maturity" value={sumAssured} onChange={setSumAssured} prefix="₹" step={50000} min={0} max={100000000} />
                  <NumberInput label="Year of Maturity" value={maturityYear} onChange={setMaturityYear} suffix="year" step={1} min={1} max={40} hint="Policy year when lump sum is paid out" />
                </div>
              </div>

              {/* Section 4: Benchmark */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" /> Comparison Benchmark
                </h3>
                <NumberInput
                  label="Expected Mutual Fund Return"
                  value={mfReturn}
                  onChange={setMfReturn}
                  suffix="% p.a."
                  step={0.5}
                  min={6}
                  max={18}
                  hint="Long-term equity mutual fund assumption (Regular Plan through your MFD)"
                />
              </div>
            </div>

            {/* ─── RIGHT: Results ─── */}
            <div className="space-y-6">

              {/* Hero stat card */}
              <div
                className={cn(
                  'rounded-2xl border-2 bg-gradient-to-br p-6 sm:p-8',
                  irrBand.bg,
                  irrBand.ring,
                )}
                data-pdf-keep-together
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={cn('text-[11px] font-bold uppercase tracking-wider mb-1', irrBand.text)}>Real Rate of Return (IRR)</div>
                    <div className={cn('text-5xl sm:text-6xl font-extrabold tabular-nums', irrBand.text)}>
                      {result.irrPct !== null && isFinite(result.irrPct) ? `${result.irrPct.toFixed(2)}%` : '—'}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      XIRR (date-precise): <span className="font-bold text-slate-700">
                        {result.xirrPct !== null && isFinite(result.xirrPct) ? `${result.xirrPct.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
                      irrBand.tone === 'good' && 'bg-emerald-600 text-white',
                      irrBand.tone === 'warn' && 'bg-amber-500 text-white',
                      irrBand.tone === 'bad' && 'bg-red-600 text-white',
                      irrBand.tone === 'neutral' && 'bg-slate-400 text-white',
                    )}
                  >
                    {irrBand.label}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{irrBand.detail}</p>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricTile icon={<Banknote className="w-4 h-4" />} label="Total Premiums" value={fmtShortINR(result.totalPremiums)} sub={`Over ${ppt - alreadyPaidYears} years`} tone="bad" />
                <MetricTile icon={<IndianRupee className="w-4 h-4" />} label="Total Benefits" value={fmtShortINR(result.totalBenefits)} sub="All inflows + maturity" tone="good" />
                <MetricTile icon={<TrendingUp className="w-4 h-4" />} label="IRR" value={result.irrPct !== null && isFinite(result.irrPct) ? `${result.irrPct.toFixed(2)}%` : '—'} sub="Annual, yearly flows" tone={irrBand.tone} />
                <MetricTile icon={<Calculator className="w-4 h-4" />} label="XIRR" value={result.xirrPct !== null && isFinite(result.xirrPct) ? `${result.xirrPct.toFixed(2)}%` : '—'} sub="Date-precise" tone={irrBand.tone} />
              </div>

              {/* MF Comparison card */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  If you invested these premiums in Mutual Funds @ {mfReturn}%...
                </h3>
                <p className="text-sm text-slate-500 mb-4">Same outflow pattern, invested in a diversified equity Mutual Fund (Regular Plan through your MFD)</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">Policy pays you</div>
                    <div className="text-xl font-extrabold text-slate-700">{fmtShortINR(result.totalBenefits)}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-[11px] font-semibold text-emerald-600 mb-1">MF Alternative Corpus</div>
                    <div className="text-xl font-extrabold text-emerald-700">{fmtShortINR(result.mfCorpus)}</div>
                  </div>
                  <div className={cn(
                    'rounded-xl border p-4',
                    result.gapVsMF > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50',
                  )}>
                    <div className={cn('text-[11px] font-semibold mb-1', result.gapVsMF > 0 ? 'text-red-600' : 'text-slate-500')}>
                      Opportunity Cost
                    </div>
                    <div className={cn('text-xl font-extrabold', result.gapVsMF > 0 ? 'text-red-700' : 'text-slate-700')}>
                      {result.gapVsMF > 0 ? '-' : '+'}{fmtShortINR(Math.abs(result.gapVsMF))}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{Math.abs(result.gapPct).toFixed(0)}% {result.gapVsMF > 0 ? 'less' : 'more'} vs MF</div>
                  </div>
                </div>
              </div>

              {/* Cashflow Chart */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cashflow Timeline</h3>
                <p className="text-sm text-slate-500 mb-4">Premiums below the axis, benefits above — over the {result.tenure}-year policy tenure</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} stackOffset="sign">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Policy Year', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtShortINR(v)} />
                      <Tooltip
                        formatter={(value: number, name: string) => [fmtShortINR(value), name]}
                        labelFormatter={(l) => `Policy Year ${l}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                      <Bar dataKey="premium" name="Premium (Outflow)" stackId="stack" fill="#dc2626">
                        {chartData.map((_, i) => <Cell key={`p-${i}`} fill="#dc2626" />)}
                      </Bar>
                      <Bar dataKey="benefit" name="Benefit (Inflow)" stackId="stack" fill="#059669">
                        {chartData.map((_, i) => <Cell key={`b-${i}`} fill="#059669" />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cashflow Table (collapsible, hidden from PDF by default) */}
              <div className="card-base p-5 sm:p-6" data-pdf-hide>
                <button
                  type="button"
                  onClick={() => setShowCashflowTable(!showCashflowTable)}
                  className="w-full flex items-center justify-between text-sm font-bold text-slate-800"
                >
                  <span>Year-by-Year Cashflow Table</span>
                  {showCashflowTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showCashflowTable && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 px-2 text-left font-bold text-slate-600">Year</th>
                          <th className="py-2 px-2 text-left font-bold text-slate-600">Age</th>
                          <th className="py-2 px-2 text-right font-bold text-red-600">Premium</th>
                          <th className="py-2 px-2 text-right font-bold text-emerald-600">Benefit</th>
                          <th className="py-2 px-2 text-right font-bold text-slate-600">Net Cashflow</th>
                          <th className="py-2 px-2 text-right font-bold text-slate-600">Cumulative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearlyRows.map((r) => (
                          <tr key={r.year} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-1.5 px-2">{r.year}</td>
                            <td className="py-1.5 px-2">{r.age}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-red-600">{r.premium < 0 ? fmtShortINR(r.premium) : '-'}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-emerald-600">{r.benefit > 0 ? fmtShortINR(r.benefit) : '-'}</td>
                            <td className={cn('py-1.5 px-2 text-right font-mono font-semibold', r.net >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                              {fmtShortINR(r.net)}
                            </td>
                            <td className={cn('py-1.5 px-2 text-right font-mono font-bold', r.cumulative >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                              {fmtShortINR(r.cumulative)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                          <td className="py-2 px-2" colSpan={2}>Total</td>
                          <td className="py-2 px-2 text-right font-mono text-red-700">{fmtShortINR(-result.totalPremiums)}</td>
                          <td className="py-2 px-2 text-right font-mono text-emerald-700">{fmtShortINR(result.totalBenefits)}</td>
                          <td className="py-2 px-2 text-right font-mono text-primary-700">{fmtShortINR(result.netGain)}</td>
                          <td className="py-2 px-2 text-right font-mono">—</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* What This Means */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" /> What This Means for {clientName || 'You'}
                </h3>
                <div className="space-y-2.5">
                  {insight.map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-lg border',
                        i === 0 && irrBand.tone === 'good' && 'bg-emerald-50 border-emerald-200',
                        i === 0 && irrBand.tone === 'warn' && 'bg-amber-50 border-amber-200',
                        i === 0 && irrBand.tone === 'bad' && 'bg-red-50 border-red-200',
                        i === 0 && irrBand.tone === 'neutral' && 'bg-slate-50 border-slate-200',
                        i > 0 && 'bg-blue-50 border-blue-200',
                      )}
                    >
                      {i === 0 && irrBand.tone === 'good' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {i === 0 && irrBand.tone === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      {i === 0 && irrBand.tone === 'bad' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                      {i === 0 && irrBand.tone === 'neutral' && <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
                      {i > 0 && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                      <p className="text-sm text-slate-700 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CFP Notes */}
              <div className="card-base p-5 sm:p-6 bg-gradient-to-br from-primary-50 to-brand-50 border border-primary-200" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" /> CFP Notes
                </h3>
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  <p>
                    Many life insurance policies are sold on <strong>feature narratives</strong> — bonus, money-back, guaranteed addition, loyalty — without
                    ever disclosing the real IRR. The IRR and XIRR you see above strip away the marketing and reveal the pure
                    time-weighted rate of return on your capital.
                  </p>
                  <p>
                    <strong>Term + Mutual Fund (Regular Plan through your MFD)</strong> typically outperforms bundled insurance-investment products over long tenures.
                    A pure term plan gives you a much larger life cover for a tiny premium; the balance premium, when systematically
                    invested in diversified equity mutual funds, compounds at materially higher rates.
                  </p>
                  <p>
                    <strong>Before surrendering a mature policy</strong>: surrender value in early years is typically a fraction of premiums paid.
                    For policies in their final 3-5 years, completing the term often yields more than surrendering and redeploying.
                    Speak to your Relationship Manager before taking action — the math of <em>surrender + reinvest</em> vs <em>continue to maturity</em>
                    depends on your specific policy terms, tax position, and remaining tenure.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="card-base p-4 bg-slate-50">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {DISCLAIMER.calculator}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                  IRR and XIRR are mathematical measures derived from the cashflows you enter. Actual policy returns depend on declared
                  bonuses, loyalty additions, fund NAV movement (for ULIPs), mortality charges, administration charges, tax treatment
                  under prevailing IT rules, and policy-specific terms. Please verify cashflows against your policy bond before
                  acting on these results.
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
    </>
  );
}
