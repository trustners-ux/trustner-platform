'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, ArrowLeft, IndianRupee, Shield, Heart, Landmark,
  Home, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, TrendingDown,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

/* ── colour tokens ─────────────────────────────────────── */
const COLORS = {
  sec80c: '#0F766E',
  sec80d: '#2563EB',
  nps: '#7C3AED',
  sec24b: '#E8553A',
  unused: '#CBD5E1',
};

const PIE_PALETTE = ['#0F766E', '#2563EB', '#7C3AED', '#E8553A'];

/* ── Old-regime slab rates ─────────────────────────────── */
function getMarginalRate(income: number): number {
  if (income > 1000000) return 0.30;
  if (income > 500000) return 0.20;
  if (income > 250000) return 0.05;
  return 0;
}

function computeOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome > 1000000) {
    tax += (taxableIncome - 1000000) * 0.30;
    taxableIncome = 1000000;
  }
  if (taxableIncome > 500000) {
    tax += (taxableIncome - 500000) * 0.20;
    taxableIncome = 500000;
  }
  if (taxableIncome > 250000) {
    tax += (taxableIncome - 250000) * 0.05;
  }
  return Math.max(0, Math.round(tax));
}

function computeNewRegimeTax(taxableIncome: number): number {
  // FY 2025-26 new regime slabs (after ₹75K standard deduction)
  let tax = 0;
  const slabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];

  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome, slab.limit) - prev;
    tax += chunk * slab.rate;
    prev = slab.limit;
  }
  return Math.max(0, Math.round(tax));
}

/* ── Progress bar component ────────────────────────────── */
function UtilBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(0, limit - used);
  const status = pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className={cn('font-bold', status)}>{pct.toFixed(0)}% used</span>
      </div>
      <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Used: {formatINR(used)}</span>
        <span>Remaining: {formatINR(remaining)} / {formatINR(limit)}</span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function TaxSavingCalculatorPage() {
  /* ── state ───────────────────────────────────────────── */
  const [regime, setRegime] = useState<'old' | 'new'>('old');
  const [grossIncome, setGrossIncome] = useState(1200000);

  // 80C
  const [epf, setEpf] = useState(21600);
  const [ppf, setPpf] = useState(0);
  const [elss, setElss] = useState(0);
  const [lifeInsurance, setLifeInsurance] = useState(0);
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [nscFD, setNscFD] = useState(0);
  const [sukanya, setSukanya] = useState(0);

  // 80D
  const [selfPremium, setSelfPremium] = useState(25000);
  const [parentsPremium, setParentsPremium] = useState(0);
  const [preventiveCheckup, setPreventiveCheckup] = useState(0);
  const [selfSenior, setSelfSenior] = useState(false);
  const [parentsSenior, setParentsSenior] = useState(false);

  // 80CCD(1B)
  const [nps, setNps] = useState(0);

  // 24(b)
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);

  // UI
  const [show80C, setShow80C] = useState(true);

  const isNew = regime === 'new';

  /* ── derived limits ──────────────────────────────────── */
  const selfLimit = selfSenior ? 50000 : 25000;
  const parentsLimit = parentsSenior ? 50000 : 25000;

  /* ── calculation ─────────────────────────────────────── */
  const result = useMemo(() => {
    // 80C
    const raw80C = epf + ppf + elss + lifeInsurance + homeLoanPrincipal + tuitionFee + nscFD + sukanya;
    const capped80C = Math.min(raw80C, 150000);

    // 80D — preventive checkup is part of the limit, not additive
    const selfTotal = Math.min(selfPremium + preventiveCheckup, selfLimit);
    const parentsTotal = Math.min(parentsPremium, parentsLimit);
    const total80D = selfTotal + parentsTotal;

    // NPS
    const cappedNPS = Math.min(nps, 50000);

    // 24(b)
    const capped24b = Math.min(homeLoanInterest, 200000);

    const totalDeductions = capped80C + total80D + cappedNPS + capped24b;

    // Old regime: standard deduction ₹50,000
    const oldTaxableIncome = Math.max(0, grossIncome - 50000 - totalDeductions);
    const oldTax = computeOldRegimeTax(oldTaxableIncome);

    // New regime: standard deduction ₹75,000, no other deductions
    const newTaxableIncome = Math.max(0, grossIncome - 75000);
    const newTax = computeNewRegimeTax(newTaxableIncome);

    // Tax saved = tax without deductions vs tax with deductions (old regime)
    const oldTaxWithout = computeOldRegimeTax(Math.max(0, grossIncome - 50000));
    const taxSaved = oldTaxWithout - oldTax;

    // Marginal rate
    const marginalRate = getMarginalRate(grossIncome);

    // Remaining limits
    const remaining80C = Math.max(0, 150000 - raw80C);
    const remainingSelfD = Math.max(0, selfLimit - selfPremium - preventiveCheckup);
    const remainingParentsD = Math.max(0, parentsLimit - parentsPremium);
    const remainingNPS = Math.max(0, 50000 - nps);
    const remaining24b = Math.max(0, 200000 - homeLoanInterest);
    const totalRemaining = remaining80C + remainingSelfD + remainingParentsD + remainingNPS + remaining24b;

    return {
      capped80C,
      total80D,
      cappedNPS,
      capped24b,
      totalDeductions,
      oldTax,
      newTax,
      taxSaved,
      marginalRate,
      remaining80C,
      remainingSelfD,
      remainingParentsD,
      remainingNPS,
      remaining24b,
      totalRemaining,
      raw80C,
    };
  }, [
    grossIncome, epf, ppf, elss, lifeInsurance, homeLoanPrincipal,
    tuitionFee, nscFD, sukanya, selfPremium, parentsPremium,
    preventiveCheckup, selfLimit, parentsLimit, nps, homeLoanInterest,
  ]);

  /* ── chart data ──────────────────────────────────────── */
  const barData = [
    { section: '80C', used: result.capped80C, limit: 150000 },
    { section: '80D', used: result.total80D, limit: selfLimit + parentsLimit },
    { section: 'NPS 80CCD', used: result.cappedNPS, limit: 50000 },
    { section: '24(b)', used: result.capped24b, limit: 200000 },
  ];

  const pieData = [
    { name: 'Section 80C', value: result.capped80C },
    { name: 'Section 80D', value: result.total80D },
    { name: 'NPS 80CCD(1B)', value: result.cappedNPS },
    { name: 'Section 24(b)', value: result.capped24b },
  ].filter((d) => d.value > 0);

  const comparisonData = [
    { regime: 'Old Regime', tax: result.oldTax },
    { regime: 'New Regime', tax: result.newTax },
  ];

  /* ── recommendations ─────────────────────────────────── */
  const recommendations: string[] = [];
  if (result.remaining80C > 0) {
    recommendations.push(
      `You have ${formatINR(result.remaining80C)} unused 80C limit. Consider investing in ELSS mutual funds for market-linked returns with tax savings and a short 3-year lock-in.`,
    );
  }
  if (result.remainingNPS > 0) {
    recommendations.push(
      `Claim an additional ${formatINR(result.remainingNPS)} deduction by investing in NPS under Section 80CCD(1B) — over and above the 80C limit.`,
    );
  }
  if (result.remainingSelfD > 0) {
    recommendations.push(
      `You can claim ${formatINR(result.remainingSelfD)} more under Section 80D by topping up your health insurance or adding a super top-up plan.`,
    );
  }
  if (result.remainingParentsD > 0 && parentsPremium === 0) {
    recommendations.push(
      `Paying health insurance premium for parents can give you an additional deduction of up to ${formatINR(parentsLimit)} under Section 80D.`,
    );
  }
  if (result.oldTax < result.newTax) {
    recommendations.push(
      `Based on your deductions, the Old Regime saves you ${formatINR(result.newTax - result.oldTax)} more than the New Regime.`,
    );
  } else if (result.newTax < result.oldTax) {
    recommendations.push(
      `The New Regime is better for you — you save ${formatINR(result.oldTax - result.newTax)} compared to the Old Regime.`,
    );
  }

  /* ━━━ RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Tax Saving Calculator</h1>
              <p className="text-slate-300 mt-1">
                Plan deductions under Section 80C, 80D, 80CCD &amp; 24(b) and maximise your tax savings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">

            {/* ═══════════ LEFT SIDEBAR ═══════════ */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Deductions</h2>

              {/* Regime Toggle */}
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Tax Regime</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['old', 'new'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegime(r)}
                      className={cn(
                        'text-[11px] font-semibold py-2.5 rounded-lg border transition-colors capitalize',
                        regime === r
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300',
                      )}
                    >
                      {r === 'old' ? 'Old Regime' : 'New Regime'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gross Income */}
              <div className={cn('space-y-6', isNew && 'opacity-100')}>
                <NumberInput
                  label="Gross Annual Income"
                  value={grossIncome}
                  onChange={setGrossIncome}
                  prefix="₹"
                  step={50000}
                  min={300000}
                  max={10000000}
                />
              </div>

              {/* ── Section 80C ── */}
              <div className={cn('mt-6 border-t border-surface-200 pt-5', isNew && 'opacity-40 pointer-events-none')}>
                <button
                  type="button"
                  onClick={() => setShow80C(!show80C)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand" />
                    <span className="text-[13px] font-bold text-primary-700">Section 80C</span>
                    <span className="text-[10px] text-slate-400 ml-1">Limit ₹1.5L</span>
                  </div>
                  {show80C ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {show80C && (
                  <div className="space-y-4 mt-4">
                    <NumberInput label="EPF Contribution" value={epf} onChange={setEpf} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="PPF" value={ppf} onChange={setPpf} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="ELSS / Tax Saving MF" value={elss} onChange={setElss} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="Life Insurance Premium" value={lifeInsurance} onChange={setLifeInsurance} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="Home Loan Principal" value={homeLoanPrincipal} onChange={setHomeLoanPrincipal} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="Children Tuition Fee" value={tuitionFee} onChange={setTuitionFee} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="NSC / Tax Saver FD" value={nscFD} onChange={setNscFD} prefix="₹" step={5000} min={0} max={150000} />
                    <NumberInput label="Sukanya Samriddhi" value={sukanya} onChange={setSukanya} prefix="₹" step={5000} min={0} max={150000} />
                  </div>
                )}
                {result.raw80C > 150000 && (
                  <p className="text-[10px] text-amber-600 mt-2 font-medium">
                    Total 80C investments exceed ₹1.5L limit — capped at ₹1,50,000.
                  </p>
                )}
              </div>

              {/* ── Section 80D ── */}
              <div className={cn('mt-6 border-t border-surface-200 pt-5', isNew && 'opacity-40 pointer-events-none')}>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span className="text-[13px] font-bold text-primary-700">Section 80D</span>
                  <span className="text-[10px] text-slate-400 ml-1">Medical Insurance</span>
                </div>
                <div className="space-y-4">
                  <NumberInput label="Self / Family Premium" value={selfPremium} onChange={setSelfPremium} prefix="₹" step={5000} min={0} max={selfLimit} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="selfSenior" checked={selfSenior} onChange={(e) => setSelfSenior(e.target.checked)} className="rounded border-slate-300 text-brand focus:ring-brand" />
                    <label htmlFor="selfSenior" className="text-[11px] text-slate-600 font-medium cursor-pointer">Self / Spouse is 60+ (Senior Citizen)</label>
                  </div>
                  <NumberInput label="Parents Premium" value={parentsPremium} onChange={setParentsPremium} prefix="₹" step={5000} min={0} max={parentsLimit} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="parentsSenior" checked={parentsSenior} onChange={(e) => setParentsSenior(e.target.checked)} className="rounded border-slate-300 text-brand focus:ring-brand" />
                    <label htmlFor="parentsSenior" className="text-[11px] text-slate-600 font-medium cursor-pointer">Parents are 60+ (Senior Citizen)</label>
                  </div>
                  <NumberInput label="Preventive Health Checkup" value={preventiveCheckup} onChange={setPreventiveCheckup} prefix="₹" step={1000} min={0} max={5000} hint="Included within 80D self limit, not additional" />
                </div>
              </div>

              {/* ── NPS 80CCD(1B) ── */}
              <div className={cn('mt-6 border-t border-surface-200 pt-5', isNew && 'opacity-40 pointer-events-none')}>
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="w-4 h-4 text-purple-600" />
                  <span className="text-[13px] font-bold text-primary-700">Section 80CCD(1B)</span>
                  <span className="text-[10px] text-slate-400 ml-1">NPS ₹50K extra</span>
                </div>
                <NumberInput label="Additional NPS Contribution" value={nps} onChange={setNps} prefix="₹" step={5000} min={0} max={50000} />
              </div>

              {/* ── 24(b) ── */}
              <div className={cn('mt-6 border-t border-surface-200 pt-5', isNew && 'opacity-40 pointer-events-none')}>
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-4 h-4 text-secondary-500" />
                  <span className="text-[13px] font-bold text-primary-700">Section 24(b)</span>
                  <span className="text-[10px] text-slate-400 ml-1">Home Loan Interest ₹2L</span>
                </div>
                <NumberInput label="Home Loan Interest Paid" value={homeLoanInterest} onChange={setHomeLoanInterest} prefix="₹" step={10000} min={0} max={200000} />
              </div>

              {/* ── Summary Cards ── */}
              <div className="mt-8 space-y-3">
                <div className="bg-gradient-to-r from-positive-50 to-brand-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Tax Saved</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {isNew ? formatINR(0) : formatINR(result.taxSaved)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Deductions</span>
                  </div>
                  <span className="text-sm font-bold text-brand">{isNew ? formatINR(0) : formatINR(result.totalDeductions)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Remaining Limit</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{isNew ? '—' : formatINR(result.totalRemaining)}</span>
                </div>
              </div>
            </div>

            {/* ═══════════ RIGHT PANEL ═══════════ */}
            <div className="space-y-8">
              {/* PDF + heading */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Tax Saving Calculator" fileName="tax-saving-calculator" />
              </div>

              {/* New Regime Alert */}
              {isNew && (
                <div className="card-base p-5 border-amber-300 bg-amber-50/60">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm mb-1">New Tax Regime Selected</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Under the New Tax Regime, most deductions under Section 80C, 80D, and 24(b) are <span className="font-bold">NOT available</span>.
                        Only Standard Deduction of ₹75,000 and employer&apos;s NPS contribution (80CCD(2)) are allowed.
                      </p>
                      {result.taxSaved > 0 && (
                        <p className="text-xs text-amber-800 font-semibold mt-2">
                          If you switch to Old Regime, you could save {formatINR(result.taxSaved)} with your current deductions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Old vs New Comparison Card ──────────── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Old vs New Regime Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">See which regime is better for your income and deductions</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={cn(
                    'rounded-xl p-5 border-2 transition-colors',
                    result.oldTax <= result.newTax ? 'border-emerald-400 bg-emerald-50/50' : 'border-surface-300 bg-surface-100',
                  )}>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Old Regime Tax</p>
                    <p className="text-2xl font-extrabold text-primary-700">{formatINR(result.oldTax)}</p>
                    {result.oldTax <= result.newTax && <p className="text-[10px] font-bold text-emerald-600 mt-1">Better for you</p>}
                  </div>
                  <div className={cn(
                    'rounded-xl p-5 border-2 transition-colors',
                    result.newTax < result.oldTax ? 'border-emerald-400 bg-emerald-50/50' : 'border-surface-300 bg-surface-100',
                  )}>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">New Regime Tax</p>
                    <p className="text-2xl font-extrabold text-primary-700">{formatINR(result.newTax)}</p>
                    {result.newTax < result.oldTax && <p className="text-[10px] font-bold text-emerald-600 mt-1">Better for you</p>}
                  </div>
                </div>
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="regime" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Tax Payable']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="tax" fill="#0F766E" radius={[6, 6, 0, 0]} name="Tax Payable" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Utilisation Progress Bars ───────────── */}
              {!isNew && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Section-wise Utilisation</h3>
                  <p className="text-sm text-slate-500 mb-6">Track how much of each deduction limit you have used</p>
                  <div className="space-y-5">
                    <UtilBar label="Section 80C" used={result.capped80C} limit={150000} color={COLORS.sec80c} />
                    <UtilBar label="Section 80D" used={result.total80D} limit={selfLimit + parentsLimit} color={COLORS.sec80d} />
                    <UtilBar label="NPS 80CCD(1B)" used={result.cappedNPS} limit={50000} color={COLORS.nps} />
                    <UtilBar label="Section 24(b)" used={result.capped24b} limit={200000} color={COLORS.sec24b} />
                  </div>
                </div>
              )}

              {/* ── Deduction Breakdown Bar Chart ──────── */}
              {!isNew && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Deduction Breakdown by Section</h3>
                  <p className="text-sm text-slate-500 mb-6">Utilised amount vs section limit</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis type="category" dataKey="section" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} width={70} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatINR(value),
                            name === 'used' ? 'Utilised' : 'Section Limit',
                          ]}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="used" fill={COLORS.sec80c} radius={[0, 4, 4, 0]} name="Utilised" />
                        <Bar dataKey="limit" fill={COLORS.unused} radius={[0, 4, 4, 0]} name="Section Limit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Pie Chart ──────────────────────────── */}
              {!isNew && pieData.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Deduction Composition</h3>
                  <p className="text-sm text-slate-500 mb-6">How your total deductions are split across sections</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((_entry, index) => (
                            <Cell key={index} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Detailed Breakdown Table ───────────── */}
              {!isNew && (
                <div className="card-base overflow-hidden">
                  <div className="p-6 pb-0">
                    <h3 className="font-bold text-primary-700 mb-1">Detailed Deduction Breakdown</h3>
                    <p className="text-sm text-slate-500 mb-4">Item-wise breakdown of all deductions claimed</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Section</th>
                          <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Investment</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Amount</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Deduction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 80C items */}
                        {[
                          { label: 'EPF Contribution', val: epf },
                          { label: 'PPF', val: ppf },
                          { label: 'ELSS / Tax Saving MF', val: elss },
                          { label: 'Life Insurance Premium', val: lifeInsurance },
                          { label: 'Home Loan Principal', val: homeLoanPrincipal },
                          { label: 'Children Tuition Fee', val: tuitionFee },
                          { label: 'NSC / Tax Saver FD', val: nscFD },
                          { label: 'Sukanya Samriddhi', val: sukanya },
                        ]
                          .filter((i) => i.val > 0)
                          .map((item) => (
                            <tr key={item.label} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                              <td className="py-3 px-6 text-brand font-medium text-xs">80C</td>
                              <td className="py-3 px-6 text-slate-700">{item.label}</td>
                              <td className="py-3 px-6 text-right text-slate-600">{formatINR(item.val)}</td>
                              <td className="py-3 px-6 text-right font-medium text-brand">—</td>
                            </tr>
                          ))}
                        <tr className="border-b border-surface-300 bg-brand-50/30">
                          <td className="py-3 px-6 font-bold text-brand text-xs">80C</td>
                          <td className="py-3 px-6 font-bold text-primary-700">Section 80C Total (capped)</td>
                          <td className="py-3 px-6 text-right text-slate-600">{formatINR(result.raw80C)}</td>
                          <td className="py-3 px-6 text-right font-bold text-brand">{formatINR(result.capped80C)}</td>
                        </tr>

                        {/* 80D */}
                        {selfPremium > 0 && (
                          <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 text-blue-600 font-medium text-xs">80D</td>
                            <td className="py-3 px-6 text-slate-700">Self / Family Premium</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(selfPremium)}</td>
                            <td className="py-3 px-6 text-right font-medium text-blue-600">{formatINR(Math.min(selfPremium + preventiveCheckup, selfLimit))}</td>
                          </tr>
                        )}
                        {parentsPremium > 0 && (
                          <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 text-blue-600 font-medium text-xs">80D</td>
                            <td className="py-3 px-6 text-slate-700">Parents Premium</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(parentsPremium)}</td>
                            <td className="py-3 px-6 text-right font-medium text-blue-600">{formatINR(Math.min(parentsPremium, parentsLimit))}</td>
                          </tr>
                        )}
                        {result.total80D > 0 && (
                          <tr className="border-b border-surface-300 bg-blue-50/30">
                            <td className="py-3 px-6 font-bold text-blue-600 text-xs">80D</td>
                            <td className="py-3 px-6 font-bold text-primary-700">Section 80D Total</td>
                            <td className="py-3 px-6 text-right text-slate-600" />
                            <td className="py-3 px-6 text-right font-bold text-blue-600">{formatINR(result.total80D)}</td>
                          </tr>
                        )}

                        {/* NPS */}
                        {nps > 0 && (
                          <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 text-purple-600 font-medium text-xs">80CCD(1B)</td>
                            <td className="py-3 px-6 text-slate-700">NPS Contribution</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(nps)}</td>
                            <td className="py-3 px-6 text-right font-medium text-purple-600">{formatINR(result.cappedNPS)}</td>
                          </tr>
                        )}

                        {/* 24(b) */}
                        {homeLoanInterest > 0 && (
                          <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 text-secondary-500 font-medium text-xs">24(b)</td>
                            <td className="py-3 px-6 text-slate-700">Home Loan Interest</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(homeLoanInterest)}</td>
                            <td className="py-3 px-6 text-right font-medium text-secondary-500">{formatINR(result.capped24b)}</td>
                          </tr>
                        )}

                        {/* Grand Total */}
                        <tr className="bg-surface-100">
                          <td className="py-4 px-6 font-bold text-primary-700 text-xs" />
                          <td className="py-4 px-6 font-extrabold text-primary-700">Grand Total Deductions</td>
                          <td className="py-4 px-6" />
                          <td className="py-4 px-6 text-right font-extrabold text-lg gradient-text">{formatINR(result.totalDeductions)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Recommendations ────────────────────── */}
              {!isNew && recommendations.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-primary-700">Smart Recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                        <span className="text-amber-500 font-bold text-sm mt-0.5">{idx + 1}.</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
