'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Scale,
  Flame,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

type FundCategory = 'equity' | 'hybrid' | 'elss';

const COLORS = {
  ulip: '#F97316', // orange-500
  mf: '#16A34A', // green-600
  term: '#2563EB',
  charge: '#DC2626',
};

// Simplified mortality table — ₹ per ₹1000 Sum-at-Risk / year
// Rough industry averages used by ULIP insurers (non-smoker, healthy).
function mortalityRatePerThousand(age: number): number {
  if (age <= 25) return 0.9;
  if (age <= 30) return 1.2;
  if (age <= 35) return 1.6;
  if (age <= 40) return 2.5;
  if (age <= 45) return 3.8;
  if (age <= 50) return 6.0;
  if (age <= 55) return 9.5;
  if (age <= 60) return 15.0;
  if (age <= 65) return 22.0;
  return 32.0;
}

// Linear interpolation so yearly progression is smooth as the insured ages
function mortalityRateSmooth(age: number): number {
  const floorAge = Math.floor(age);
  const ceilAge = floorAge + 1;
  const frac = age - floorAge;
  const a = mortalityRatePerThousand(floorAge);
  const b = mortalityRatePerThousand(ceilAge);
  return a + (b - a) * frac;
}

// Typical term-plan premium rates — ₹ per ₹1000 SA / year (non-smoker, healthy).
// These are representative market rates for a 30 yr / 30 yr policy, scaled by entry age.
function termRatePerThousand(age: number): number {
  if (age <= 25) return 3.5;
  if (age <= 30) return 4.5;
  if (age <= 35) return 5.5;
  if (age <= 40) return 8.0;
  if (age <= 45) return 12.0;
  if (age <= 50) return 18.0;
  return 26.0;
}

export default function MFvsULIPCalculatorPage() {
  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(32);

  // Common inputs
  const [annualPremium, setAnnualPremium] = useState(100000);
  const [horizon, setHorizon] = useState(20);
  const [grossReturn, setGrossReturn] = useState(12);
  const [sumAssuredMultiple, setSumAssuredMultiple] = useState(10);

  // ULIP charges
  const [allocationMode, setAllocationMode] = useState<'tiered' | 'flat'>('tiered');
  const [flatAllocationPct, setFlatAllocationPct] = useState(3);
  const [tieredAllocationPct, setTieredAllocationPct] = useState(5);
  const [adminMonthlyPct, setAdminMonthlyPct] = useState(0.15);
  const [fmcPct, setFmcPct] = useState(1.35);
  const [surrenderCap, setSurrenderCap] = useState(6000);

  // MF side
  const [fundCategory, setFundCategory] = useState<FundCategory>('equity');
  const [terPct, setTerPct] = useState(1.7);

  // Derived
  const currentAge = age ?? 32;
  const sumAssured = annualPremium * sumAssuredMultiple;

  const termPremiumAnnual = useMemo(() => {
    const rate = termRatePerThousand(currentAge);
    return Math.round((sumAssured / 1000) * rate);
  }, [currentAge, sumAssured]);

  const result = useMemo(() => {
    const r = grossReturn / 100;
    const fmc = fmcPct / 100;
    const adminAnnualPct = (adminMonthlyPct / 100) * 12;
    const ter = terPct / 100;

    // ULIP simulation — annual step
    let ulipFund = 0;
    let cumAllocation = 0;
    let cumFMC = 0;
    let cumAdmin = 0;
    let cumMortality = 0;

    // MF simulation — annual step (year-end SIP equivalent contribution)
    let mfCorpus = 0;

    // Term insurance paid out-of-pocket (doesn't accumulate)
    let totalTermPaid = 0;

    // Total outlay for user-facing fairness = annual premium × years (same for both sides)
    // MF side: premium - termPremium goes into MF
    const mfAnnualInvest = Math.max(0, annualPremium - termPremiumAnnual);

    const yearly: {
      year: number;
      age: number;
      ulipFund: number;
      mfCorpus: number;
      gap: number;
      allocationCharge: number;
      fmcCharge: number;
      adminCharge: number;
      mortalityCharge: number;
    }[] = [];

    for (let y = 1; y <= horizon; y++) {
      const yearAge = currentAge + y - 1;

      // ULIP — premium allocated this year
      let allocationRate = 0;
      if (allocationMode === 'tiered') {
        allocationRate = y <= 5 ? tieredAllocationPct / 100 : 0;
      } else {
        allocationRate = flatAllocationPct / 100;
      }
      const allocationCharge = annualPremium * allocationRate;
      const netInvested = annualPremium - allocationCharge;

      // Add net to fund at start of year
      ulipFund += netInvested;

      // During the year: gross growth
      const gross = ulipFund * r;

      // Charges: FMC on avg fund value (~start value), admin similarly
      const fmcCharge = ulipFund * fmc;
      const adminCharge = ulipFund * adminAnnualPct;

      // Mortality: Sum at Risk = max(SA - fund, 0) × rate / 1000
      const mortalityRate = mortalityRateSmooth(yearAge);
      const sumAtRisk = Math.max(0, sumAssured - ulipFund);
      const mortalityCharge = (sumAtRisk / 1000) * mortalityRate;

      ulipFund = ulipFund + gross - fmcCharge - adminCharge - mortalityCharge;
      if (ulipFund < 0) ulipFund = 0;

      cumAllocation += allocationCharge;
      cumFMC += fmcCharge;
      cumAdmin += adminCharge;
      cumMortality += mortalityCharge;

      // MF side — invest mfAnnualInvest at year-end, grow existing corpus at (r - TER)
      mfCorpus = mfCorpus * (1 + (r - ter)) + mfAnnualInvest;
      totalTermPaid += termPremiumAnnual;

      yearly.push({
        year: y,
        age: yearAge + 1,
        ulipFund: Math.round(ulipFund),
        mfCorpus: Math.round(mfCorpus),
        gap: Math.round(mfCorpus - ulipFund),
        allocationCharge: Math.round(allocationCharge),
        fmcCharge: Math.round(fmcCharge),
        adminCharge: Math.round(adminCharge),
        mortalityCharge: Math.round(mortalityCharge),
      });
    }

    const totalOutlay = annualPremium * horizon;
    const totalCharges = cumAllocation + cumFMC + cumAdmin + cumMortality;

    // MF tax — equity LTCG on gains above ₹1.25L @ 12.5% (Budget 2024, effective 23-Jul-2024)
    const mfGain = Math.max(0, mfCorpus - annualPremium * horizon + totalTermPaid);
    const ltcgTaxable = Math.max(0, mfGain - 125000);
    const mfTax = ltcgTaxable * 0.125;
    const mfPostTax = mfCorpus - mfTax;

    // ULIP taxability — if annual premium > ₹2.5L (Finance Act 2021 for ULIPs issued after 1-Feb-2021)
    const ulipTaxable = annualPremium > 250000;
    const ulipGain = Math.max(0, ulipFund - annualPremium * horizon);
    const ulipTax = ulipTaxable ? Math.max(0, ulipGain - 125000) * 0.125 : 0;
    const ulipPostTax = ulipFund - ulipTax;

    const advantage = mfPostTax - ulipPostTax;
    const advantagePct = ulipPostTax > 0 ? (advantage / ulipPostTax) * 100 : 0;

    return {
      ulipFund: Math.round(ulipFund),
      mfCorpus: Math.round(mfCorpus),
      ulipPostTax: Math.round(ulipPostTax),
      mfPostTax: Math.round(mfPostTax),
      advantage: Math.round(advantage),
      advantagePct,
      yearly,
      cumAllocation: Math.round(cumAllocation),
      cumFMC: Math.round(cumFMC),
      cumAdmin: Math.round(cumAdmin),
      cumMortality: Math.round(cumMortality),
      totalCharges: Math.round(totalCharges),
      totalOutlay,
      totalTermPaid: Math.round(totalTermPaid),
      mfAnnualInvest,
      ulipTaxable,
      ulipTax: Math.round(ulipTax),
      mfTax: Math.round(mfTax),
    };
  }, [
    annualPremium,
    horizon,
    grossReturn,
    sumAssured,
    allocationMode,
    flatAllocationPct,
    tieredAllocationPct,
    adminMonthlyPct,
    fmcPct,
    terPct,
    termPremiumAnnual,
    currentAge,
  ]);

  // Chart data — maturity comparison
  const maturityBarData = [
    {
      name: 'ULIP',
      Maturity: result.ulipPostTax,
      fill: COLORS.ulip,
    },
    {
      name: 'Term + MF',
      Maturity: result.mfPostTax,
      fill: COLORS.mf,
    },
  ];

  // Line chart data — trim year-by-year
  const lineChartData = result.yearly.map((row) => ({
    year: `Yr ${row.year}`,
    ULIP: row.ulipFund,
    'MF Corpus': row.mfCorpus,
  }));

  // Insights
  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (result.advantage > 0) {
      items.push({
        icon: <TrendingUp className="w-5 h-5 text-green-600 shrink-0" />,
        text: `Over ${horizon} years, separating insurance (Term plan of ${formatINR(sumAssured)}) from investment (Mutual Fund SIP) builds ${formatINR(result.advantage)} more wealth than a ULIP — that's ${result.advantagePct.toFixed(1)}% higher, post-tax.`,
        color: 'bg-green-50 border-green-200',
      });
    } else {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        text: `In this specific scenario the ULIP ends slightly ahead. Try increasing the horizon, premium size, or gross return — the MF advantage compounds over longer periods.`,
        color: 'bg-amber-50 border-amber-200',
      });
    }

    items.push({
      icon: <Flame className="w-5 h-5 text-red-600 shrink-0" />,
      text: `The ULIP charged you ${formatINR(result.totalCharges)} cumulatively in fees over ${horizon} years (allocation + FMC + admin + mortality) — while the MF route paid only the TER (built into the NAV) plus ${formatINR(result.totalTermPaid)} in separate term insurance premiums.`,
      color: 'bg-red-50 border-red-200',
    });

    items.push({
      icon: <Scale className="w-5 h-5 text-blue-600 shrink-0" />,
      text: `The gap between the two routes widens each year because of compounding. Every rupee lost to ULIP charges early also loses its future growth — a dual drag.`,
      color: 'bg-blue-50 border-blue-200',
    });

    if (result.ulipTaxable) {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
        text: `Your annual premium exceeds ₹2.5 lakh — post Budget 2021, ULIP maturity proceeds are taxable just like equity mutual funds. The "tax-free" pitch no longer applies here.`,
        color: 'bg-orange-50 border-orange-200',
      });
    }

    items.push({
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />,
      text: `A term plan of ${formatINR(sumAssured)} sum assured costs roughly ${formatINR(termPremiumAnnual)}/year at age ${currentAge} — dramatically cheaper than the mortality charge baked into a ULIP, especially in later years as you age.`,
      color: 'bg-indigo-50 border-indigo-200',
    });

    return items;
  }, [result, horizon, sumAssured, termPremiumAnnual, currentAge]);

  // Year-by-year display — first 5 + last 5
  const displayYears = useMemo(() => {
    const proj = result.yearly;
    if (proj.length <= 10) return proj;
    return [...proj.slice(0, 5), ...proj.slice(-5)];
  }, [result.yearly]);
  const showEllipsis = result.yearly.length > 10;

  const resultContext = `20-yr MF advantage: ${formatINR(result.advantage)} (ULIP ${formatINR(result.ulipPostTax)} vs Term+MF ${formatINR(result.mfPostTax)}, on ₹${(annualPremium / 1000).toFixed(0)}K/yr premium)`;

  return (
    <>
      {/* Header */}
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
              <ArrowLeftRight className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Mutual Fund vs ULIP — 20-Year Showdown
              </h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                The honest 20-year comparison: your premium in a typical ULIP vs the same money
                split into Term Insurance + Mutual Fund SIP. See the rupee gap — usually ₹30–80L
                over 20 years.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─── Input Panel ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <PersonalInfoBar
                name={name}
                onNameChange={setName}
                age={age}
                onAgeChange={setAge}
              />

              <h2 className="font-bold text-primary-700 mb-5 text-lg">Your Inputs</h2>

              <div className="space-y-5">
                {/* Common */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Premium & Horizon
                  </label>
                  <div className="space-y-4">
                    <NumberInput
                      label="Annual Premium"
                      value={annualPremium}
                      onChange={setAnnualPremium}
                      prefix="₹"
                      step={10000}
                      min={12000}
                      max={10000000}
                    />
                    <NumberInput
                      label="Investment Horizon"
                      value={horizon}
                      onChange={setHorizon}
                      suffix="Years"
                      step={1}
                      min={10}
                      max={30}
                    />
                    <NumberInput
                      label="Gross Equity Return (assumed)"
                      value={grossReturn}
                      onChange={setGrossReturn}
                      suffix="% p.a."
                      step={0.5}
                      min={8}
                      max={15}
                    />
                    <NumberInput
                      label="Sum Assured Multiple"
                      value={sumAssuredMultiple}
                      onChange={setSumAssuredMultiple}
                      suffix="x Premium"
                      step={1}
                      min={5}
                      max={20}
                      hint={`Sum Assured = ${formatINR(sumAssured)}`}
                    />
                  </div>
                </div>

                {/* ULIP Charges */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    ULIP Charges
                  </label>

                  {/* Allocation mode toggle */}
                  <div className="mb-3">
                    <div className="text-[11px] font-medium text-slate-500 mb-2">
                      Premium Allocation Charge
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setAllocationMode('tiered')}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all',
                          allocationMode === 'tiered'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-600 border-surface-300 hover:border-violet-300'
                        )}
                      >
                        Tiered (yrs 1–5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocationMode('flat')}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all',
                          allocationMode === 'flat'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-600 border-surface-300 hover:border-violet-300'
                        )}
                      >
                        Flat % every year
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {allocationMode === 'tiered' ? (
                      <NumberInput
                        label="Allocation Charge (Yrs 1–5)"
                        value={tieredAllocationPct}
                        onChange={setTieredAllocationPct}
                        suffix="%"
                        step={0.5}
                        min={0}
                        max={20}
                        hint="0% from Year 6 onwards"
                      />
                    ) : (
                      <NumberInput
                        label="Flat Allocation Charge"
                        value={flatAllocationPct}
                        onChange={setFlatAllocationPct}
                        suffix="% p.a."
                        step={0.25}
                        min={0}
                        max={10}
                      />
                    )}
                    <NumberInput
                      label="Policy Admin (monthly)"
                      value={adminMonthlyPct}
                      onChange={setAdminMonthlyPct}
                      suffix="% of fund"
                      step={0.01}
                      min={0}
                      max={1}
                      hint="Typical 0.10–0.20% monthly"
                    />
                    <NumberInput
                      label="Fund Management Charge (FMC)"
                      value={fmcPct}
                      onChange={setFmcPct}
                      suffix="% p.a."
                      step={0.05}
                      min={0.5}
                      max={2.5}
                      hint="IRDAI cap 1.35% for equity funds"
                    />
                    <NumberInput
                      label="Surrender Charge Cap (Yrs 1–5)"
                      value={surrenderCap}
                      onChange={setSurrenderCap}
                      prefix="₹"
                      step={500}
                      min={0}
                      max={50000}
                      hint="IRDAI cap — only applies if you exit early"
                    />
                  </div>
                </div>

                {/* MF Side */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Mutual Fund (Regular Plan via MFD)
                  </label>

                  {/* Category pills */}
                  <div className="flex gap-2 mb-3">
                    {(['equity', 'hybrid', 'elss'] as FundCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFundCategory(cat);
                          setTerPct(cat === 'equity' ? 1.7 : cat === 'hybrid' ? 1.8 : 1.6);
                        }}
                        className={cn(
                          'flex-1 px-2 py-2 text-[11px] rounded-lg border font-semibold transition-all uppercase tracking-wider',
                          fundCategory === cat
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-slate-600 border-surface-300 hover:border-green-300'
                        )}
                      >
                        {cat === 'elss' ? 'ELSS' : cat === 'hybrid' ? 'Hybrid' : 'Equity'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <NumberInput
                      label="Expense Ratio (TER)"
                      value={terPct}
                      onChange={setTerPct}
                      suffix="% p.a."
                      step={0.05}
                      min={0.5}
                      max={2.5}
                      hint="Regular Plan TER — builds MFD service into the NAV"
                    />
                  </div>

                  {/* Auto-computed term premium */}
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                        Separate Term Plan (auto)
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">
                        SA {formatINR(sumAssured)} @ age {currentAge}
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {formatINR(termPremiumAnnual)}/yr
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Net annual MF investment = {formatINR(result.mfAnnualInvest)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero metric */}
              <div className="mt-8 space-y-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      MF Route Advantage (Post-Tax)
                    </span>
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-extrabold',
                      result.advantage >= 0 ? 'text-violet-700' : 'text-red-600'
                    )}
                  >
                    {result.advantage >= 0 ? '+' : ''}
                    {formatINR(result.advantage)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {result.advantage >= 0
                      ? `${result.advantagePct.toFixed(1)}% more wealth vs ULIP`
                      : `ULIP ahead by ${Math.abs(result.advantagePct).toFixed(1)}% in this scenario`}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] text-slate-500 font-medium">ULIP Maturity</span>
                  </div>
                  <span className="text-sm font-bold text-orange-700">
                    {formatINR(result.ulipPostTax)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Term + MF Maturity
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    {formatINR(result.mfPostTax)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Total ULIP Charges
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-700">
                    {formatINR(result.totalCharges)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Outlay</span>
                  </div>
                  <span className="text-sm font-bold text-primary-700">
                    {formatINR(result.totalOutlay)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Results Panel ─── */}
            <div className="space-y-8">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="MF vs ULIP 20-Year Showdown"
                  fileName="mf-vs-ulip-calculator"
                />
              </div>

              {/* Side-by-side hero card */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  {horizon}-Year Maturity Comparison
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Same annual outlay of {formatINR(annualPremium)} — two very different endings.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
                        ULIP
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-orange-700 mb-1">
                      {formatINR(result.ulipPostTax)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pre-tax: {formatINR(result.ulipFund)}
                      {result.ulipTaxable ? ` · Tax: ${formatINR(result.ulipTax)}` : ' · Tax-free'}
                    </div>
                  </div>

                  <div className="rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-600" />
                      <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">
                        Term + Mutual Fund
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-green-700 mb-1">
                      {formatINR(result.mfPostTax)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pre-tax: {formatINR(result.mfCorpus)} · LTCG Tax: {formatINR(result.mfTax)}
                    </div>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={maturityBarData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="Maturity" radius={[6, 6, 0, 0]}>
                        {maturityBarData.map((entry, idx) => (
                          <rect key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-year line chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Year-by-Year — ULIP vs MF Corpus
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Watch the gap widen. Each year ULIP charges compound into larger opportunity
                  costs.
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="ULIP"
                        stroke={COLORS.ulip}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="MF Corpus"
                        stroke={COLORS.mf}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charges breakdown */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-4">
                  <h3 className="font-bold text-primary-700 mb-1">
                    ULIP Cumulative Charges ({horizon} Years)
                  </h3>
                  <p className="text-sm text-slate-500">
                    Every rupee here is a rupee that never got to compound for you.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-surface-300 border-t border-surface-300">
                  <div className="p-4 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      Allocation
                    </div>
                    <div className="text-base font-bold text-red-600">
                      {formatINR(result.cumAllocation)}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      FMC
                    </div>
                    <div className="text-base font-bold text-red-600">
                      {formatINR(result.cumFMC)}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      Admin
                    </div>
                    <div className="text-base font-bold text-red-600">
                      {formatINR(result.cumAdmin)}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      Mortality
                    </div>
                    <div className="text-base font-bold text-red-600">
                      {formatINR(result.cumMortality)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 border-t border-red-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-700">Total ULIP Charges</span>
                  <span className="text-lg font-extrabold text-red-700">
                    {formatINR(result.totalCharges)}
                  </span>
                </div>
              </div>

              {/* Year-by-year table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">
                    Year-by-Year Projection
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    ULIP fund value vs MF corpus each year, and the widening gap.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Year
                        </th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Age
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          ULIP Fund
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          MF Corpus
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Gap (MF − ULIP)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayYears.map((row, idx) => (
                        <>
                          {showEllipsis && idx === 5 && (
                            <tr key="ellipsis" className="border-b border-surface-200">
                              <td
                                colSpan={5}
                                className="py-3 px-6 text-center text-slate-400 text-xs font-medium tracking-wider"
                              >
                                ... {result.yearly.length - 10} more years ...
                              </td>
                            </tr>
                          )}
                          <tr
                            key={row.year}
                            className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors"
                          >
                            <td className="py-3 px-6 font-medium text-primary-700">
                              Year {row.year}
                            </td>
                            <td className="py-3 px-6 text-center text-slate-600">{row.age}</td>
                            <td className="py-3 px-6 text-right text-orange-700 font-medium">
                              {formatINR(row.ulipFund)}
                            </td>
                            <td className="py-3 px-6 text-right text-green-700 font-medium">
                              {formatINR(row.mfCorpus)}
                            </td>
                            <td
                              className={cn(
                                'py-3 px-6 text-right font-bold',
                                row.gap >= 0 ? 'text-green-700' : 'text-red-600'
                              )}
                            >
                              {row.gap >= 0 ? '+' : ''}
                              {formatINR(row.gap)}
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {insights.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border',
                        item.color
                      )}
                    >
                      {item.icon}
                      <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CFP Note */}
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-violet-50 border border-violet-200"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-1">
                      CFP Note
                    </div>
                    <h4 className="text-lg font-extrabold text-primary-700 mb-2">
                      Unbundle insurance from investment.
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      A ULIP bundles insurance with investment, charging high fees to justify the
                      bundle. Separating them — a term plan for cover + mutual funds for growth —
                      is mathematically superior in 90%+ of cases. You get meaningful life cover
                      for your family at a fraction of the cost, and your investment compounds
                      freely without being eroded by allocation, admin, and mortality charges.
                      {name ? ` ${name}, ` : ' '}the maths is the maths.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <CalculatorLeadForm
        calculatorName="MF vs ULIP 20-Year Showdown"
        heading="Want help setting up the right Term plan + SIP combo?"
        subtext="Share your contact — we will structure a term plan sized for your family and a goal-based mutual fund SIP. Zero obligation, AMFI-registered Mutual Fund Distributor (ARN-286886)."
        resultContext={resultContext}
        accent="violet"
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund} ULIP charges used are typical industry
            averages — actual policy charges vary by insurer, product, and age. Mortality rates
            shown are illustrative for a healthy non-smoker. Term insurance premiums are indicative
            and depend on insurer underwriting.
          </p>
        </div>
      </section>
    </>
  );
}
