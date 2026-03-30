'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, IndianRupee, Calendar, TrendingUp, Wallet, Lightbulb, HeartPulse, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { calculateRetirementSIP } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const PHASE_COLORS = {
  accumulation: { primary: '#0F766E', fill: '#14B8A6', badge: 'bg-brand-100 text-brand-700', border: 'border-brand-200', bg: 'bg-brand-50', text: 'text-brand-700' },
  distribution: { primary: '#D97706', fill: '#D4A017', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const COLORS = {
  invested: '#0F766E',
  corpus: '#E8553A',
  savings: '#6366F1',
  pension: '#D97706',
  healthcare: '#EC4899',
};

const returnPresets = [
  { label: 'Conservative', value: 8 },
  { label: 'Moderate', value: 12 },
  { label: 'Aggressive', value: 15 },
];

export default function RetirementSIPPlannerPage() {
  const [investorName, setInvestorName] = useState('');
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [inflationRate, setInflationRate] = useState(6);
  const [preRetirementReturn, setPreRetirementReturn] = useState(12);
  const [postRetirementReturn, setPostRetirementReturn] = useState(8);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);

  // Toggle-gated optional inputs
  const [hasExistingSavings, setHasExistingSavings] = useState(false);
  const [hasRetirementBenefits, setHasRetirementBenefits] = useState(false);
  const [hasExpenseReduction, setHasExpenseReduction] = useState(false);
  const [hasHealthcareReserve, setHasHealthcareReserve] = useState(false);

  const [existingSavings, setExistingSavings] = useState(500000);
  const [monthlyPension, setMonthlyPension] = useState(20000);
  const [expenseReduction, setExpenseReduction] = useState(15);
  const [healthcareReserve, setHealthcareReserve] = useState(1000000);

  const result = useMemo(
    () => calculateRetirementSIP(
      currentAge, retirementAge, monthlyExpense, inflationRate,
      preRetirementReturn, postRetirementReturn, lifeExpectancy,
      hasExistingSavings ? existingSavings : 0,
      hasRetirementBenefits ? monthlyPension : 0,
      hasExpenseReduction ? expenseReduction : 0,
      hasHealthcareReserve ? healthcareReserve : 0
    ),
    [currentAge, retirementAge, monthlyExpense, inflationRate, preRetirementReturn, postRetirementReturn, lifeExpectancy,
     hasExistingSavings, existingSavings, hasRetirementBenefits, monthlyPension, hasExpenseReduction, expenseReduction, hasHealthcareReserve, healthcareReserve]
  );

  // Scenario comparison (3 return rates)
  const scenarios = useMemo(() =>
    returnPresets.map(p => ({
      ...p,
      result: calculateRetirementSIP(
        currentAge, retirementAge, monthlyExpense, inflationRate,
        p.value, postRetirementReturn, lifeExpectancy,
        hasExistingSavings ? existingSavings : 0,
        hasRetirementBenefits ? monthlyPension : 0,
        hasExpenseReduction ? expenseReduction : 0,
        hasHealthcareReserve ? healthcareReserve : 0
      ),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentAge, retirementAge, monthlyExpense, inflationRate, postRetirementReturn, lifeExpectancy,
     hasExistingSavings, existingSavings, hasRetirementBenefits, monthlyPension, hasExpenseReduction, expenseReduction, hasHealthcareReserve, healthcareReserve]
  );

  // Chart data
  const accChartData = result.accumulationSchedule.map((row) => ({
    year: `Age ${row.age}`,
    invested: row.invested,
    value: row.totalValue,
    sipValue: row.sipValue,
    existingSavings: row.existingSavingsValue,
  }));

  const depletionChartData = result.depletionSchedule.map((row) => ({
    year: `Age ${row.age}`,
    corpus: row.closingCorpus,
    withdrawal: row.annualWithdrawal,
  }));

  // Pie data — dynamic segments
  const sipReturns = Math.max(0, result.corpusRequired - result.totalInvested - result.existingSavingsAtRetirement);
  const pieData = [
    { name: 'SIP Investment', value: result.totalInvested, color: COLORS.invested },
    { name: 'Market Returns', value: sipReturns, color: COLORS.corpus },
    ...(result.existingSavingsAtRetirement > 0 ? [{ name: 'Existing Savings', value: result.existingSavingsAtRetirement, color: COLORS.savings }] : []),
    ...(result.pensionPV > 0 ? [{ name: 'Pension (PV)', value: result.pensionPV, color: COLORS.pension }] : []),
    ...(result.healthcareReserve > 0 ? [{ name: 'Healthcare Reserve', value: result.healthcareReserve, color: COLORS.healthcare }] : []),
  ].filter(d => d.value > 0);

  const scenarioBarData = scenarios.map(s => ({
    name: s.label,
    sip: s.result.monthlySIPRequired,
    corpus: s.result.corpusRequired,
    invested: s.result.totalInvested,
  }));

  const corpusLasts = result.yearsCorpusLasts >= result.yearsInRetirement;
  const lastDepletion = result.depletionSchedule[result.depletionSchedule.length - 1];
  const remainingCorpus = lastDepletion ? lastDepletion.closingCorpus : 0;

  // Readiness gauge
  const score = result.retirementReadinessScore;
  const gaugeColor = score >= 70 ? '#0F766E' : score >= 40 ? '#D97706' : '#DC2626';
  const gaugeLabel = score >= 70 ? 'Well Prepared' : score >= 40 ? 'Needs Attention' : 'Underprepared';

  const handleCurrentAgeChange = (val: number) => {
    setCurrentAge(val);
    if (val >= retirementAge) setRetirementAge(val + 5);
  };

  const nameOrYour = investorName || 'Your';
  const nameOrYourApos = investorName ? `${investorName}\u2019s` : 'Your';

  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Comprehensive Planner</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Retirement SIP Planner</h1>
              <p className="text-slate-300 mt-1">Plan your complete retirement &mdash; from accumulation to distribution. Because retirement is a journey, not a destination.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ── Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your Retirement Profile</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={null}
                onAgeChange={() => {}}
                showAge={false}
                namePlaceholder="e.g., Ram"
              />

              {/* Core Inputs */}
              <div className="space-y-5 mb-6">
                <NumberInput label="Current Age" value={currentAge} onChange={handleCurrentAgeChange} suffix="years old" step={1} min={18} max={55} />
                <NumberInput label="Retirement Age" value={retirementAge} onChange={setRetirementAge} suffix="years old" step={1} min={Math.max(currentAge + 1, 40)} max={70} />
                <NumberInput label="Current Monthly Expense" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={5000} min={10000} max={500000} />
                <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={0.5} min={3} max={12} />
                <NumberInput label="Pre-Retirement Return" value={preRetirementReturn} onChange={setPreRetirementReturn} suffix="% p.a." step={0.5} min={6} max={20} />
                <NumberInput label="Post-Retirement Return" value={postRetirementReturn} onChange={setPostRetirementReturn} suffix="% p.a." step={0.5} min={4} max={15} />
                <NumberInput label="Life Expectancy" value={lifeExpectancy} onChange={setLifeExpectancy} suffix="years old" step={1} min={Math.max(retirementAge + 5, 65)} max={100} />
              </div>

              {/* Scenario Quick-Select */}
              <div className="mb-6">
                <label className="text-xs font-medium text-slate-600 mb-2 block">Return Scenario</label>
                <div className="flex gap-2">
                  {returnPresets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setPreRetirementReturn(p.value)}
                      className={cn(
                        'flex-1 text-[10px] font-semibold py-2 rounded-lg border transition-colors',
                        preRetirementReturn === p.value
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                      )}
                    >
                      {p.label} ({p.value}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Optional Toggle Inputs ── */}
              <div className="space-y-4">
                {/* Existing Savings */}
                <div className={cn('rounded-xl border p-4', hasExistingSavings ? 'border-indigo-200 bg-indigo-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Have Existing Savings?</label>
                    <button
                      role="switch"
                      aria-checked={hasExistingSavings}
                      onClick={() => setHasExistingSavings(!hasExistingSavings)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', hasExistingSavings ? 'bg-indigo-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', hasExistingSavings ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">{hasExistingSavings ? 'Include existing retirement corpus' : 'No existing savings to account for'}</div>
                  {hasExistingSavings && (
                    <div className="mt-3 animate-in">
                      <NumberInput label="Current Savings" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={100000} min={0} max={50000000} />
                    </div>
                  )}
                </div>

                {/* Retirement Benefits */}
                <div className={cn('rounded-xl border p-4', hasRetirementBenefits ? 'border-amber-200 bg-amber-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Expect Retirement Benefits?</label>
                    <button
                      role="switch"
                      aria-checked={hasRetirementBenefits}
                      onClick={() => setHasRetirementBenefits(!hasRetirementBenefits)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', hasRetirementBenefits ? 'bg-amber-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', hasRetirementBenefits ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">{hasRetirementBenefits ? 'Monthly pension/EPF income at retirement' : 'No pension or EPF expected'}</div>
                  {hasRetirementBenefits && (
                    <div className="mt-3 animate-in">
                      <NumberInput label="Monthly Pension" value={monthlyPension} onChange={setMonthlyPension} prefix="₹" step={5000} min={0} max={200000} />
                    </div>
                  )}
                </div>

                {/* Expense Reduction */}
                <div className={cn('rounded-xl border p-4', hasExpenseReduction ? 'border-teal-200 bg-teal-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Expect Expense Reduction?</label>
                    <button
                      role="switch"
                      aria-checked={hasExpenseReduction}
                      onClick={() => setHasExpenseReduction(!hasExpenseReduction)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', hasExpenseReduction ? 'bg-teal-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', hasExpenseReduction ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">{hasExpenseReduction ? 'Mortgage paid off, kids independent, etc.' : 'Expenses remain similar after retirement'}</div>
                  {hasExpenseReduction && (
                    <div className="mt-3 animate-in">
                      <NumberInput label="Expense Reduction" value={expenseReduction} onChange={setExpenseReduction} suffix="%" step={5} min={5} max={50} />
                    </div>
                  )}
                </div>

                {/* Healthcare Reserve */}
                <div className={cn('rounded-xl border p-4', hasHealthcareReserve ? 'border-pink-200 bg-pink-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Add Healthcare Reserve?</label>
                    <button
                      role="switch"
                      aria-checked={hasHealthcareReserve}
                      onClick={() => setHasHealthcareReserve(!hasHealthcareReserve)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', hasHealthcareReserve ? 'bg-pink-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', hasHealthcareReserve ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">{hasHealthcareReserve ? 'Lump-sum reserve for medical emergencies' : 'No separate healthcare corpus'}</div>
                  {hasHealthcareReserve && (
                    <div className="mt-3 animate-in">
                      <NumberInput label="Healthcare Reserve" value={healthcareReserve} onChange={setHealthcareReserve} prefix="₹" step={500000} min={500000} max={5000000} />
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline summary */}
              <div className="mt-6 bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {nameOrYourApos} Retirement Journey
                </div>
                <div className="text-2xl font-extrabold gradient-text">{result.yearsToRetirement + result.yearsInRetirement} Years</div>
                <div className="text-xs text-slate-500 mt-1">
                  Age {currentAge} &rarr; {lifeExpectancy}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-500" /> {result.yearsToRetirement}y save
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> {result.yearsInRetirement}y enjoy
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="space-y-8">

              {/* Personalized Banner */}
              {investorName && (
                <div className="bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName}&apos;s Retirement Plan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Age {currentAge} &rarr; Retire at {retirementAge} &middot; Plan till age {lifeExpectancy} &middot; {result.yearsToRetirement + result.yearsInRetirement} year journey
                  </p>
                </div>
              )}

              {/* 2-Phase Summary Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Accumulation Phase */}
                <div className="card-base p-5 border-t-4 border-brand-500">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', PHASE_COLORS.accumulation.badge)}>
                      <TrendingUp className="w-3 h-3" /> ACCUMULATION
                    </span>
                    <span className="text-[10px] text-slate-400">Age {currentAge} &rarr; {retirementAge}</span>
                    <DownloadPDFButton elementId="calculator-results" title="Retirement SIP Planner" fileName="retirement-planner" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly SIP Required</div>
                      <div className="text-lg font-extrabold text-brand-700">{formatINR(result.monthlySIPRequired)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Investment ({result.yearsToRetirement}y)</div>
                      <div className="text-lg font-extrabold text-brand-600">{formatINR(result.totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Corpus at Retirement</div>
                      <div className="text-lg font-extrabold text-primary-700">{formatINR(result.corpusRequired)}</div>
                    </div>
                    {result.existingSavingsAtRetirement > 0 && (
                      <div className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
                        Existing savings grow to {formatINR(result.existingSavingsAtRetirement)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distribution Phase */}
                <div className={cn('card-base p-5 border-t-4', corpusLasts ? 'border-amber-500' : 'border-red-500')}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', PHASE_COLORS.distribution.badge)}>
                      <Wallet className="w-3 h-3" /> DISTRIBUTION
                    </span>
                    <span className="text-[10px] text-slate-400">Age {retirementAge} &rarr; {lifeExpectancy}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly Expense at Retirement</div>
                      <div className="text-lg font-extrabold text-amber-700">{formatINR(result.adjustedMonthlyExpense)}</div>
                    </div>
                    {result.pensionPV > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly Pension Income</div>
                        <div className="text-lg font-extrabold text-amber-600">{formatINR(monthlyPension)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining at End</div>
                      <div className={cn('text-lg font-extrabold', remainingCorpus > 0 ? 'text-teal-600' : 'text-red-600')}>
                        {formatINR(remainingCorpus)}
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        corpusLasts ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'
                      )}>
                        {corpusLasts ? `Corpus Sustains ${result.yearsInRetirement} Years` : `Corpus Lasts ~${result.yearsCorpusLasts} Years`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight Box */}
              <div className="card-base p-5 bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 border border-teal-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {corpusLasts ? (
                        <>
                          By investing <span className="font-semibold text-brand-700">{formatINR(result.monthlySIPRequired)}/month</span> for
                          {' '}<span className="font-semibold text-brand-700">{result.yearsToRetirement} years</span> (age {currentAge} to {retirementAge}),
                          {' '}{nameOrYour} will build a corpus of <span className="font-semibold text-teal-700">{formatINR(result.corpusRequired)}</span>
                          {result.existingSavingsAtRetirement > 0 && <> (including {formatINR(result.existingSavingsAtRetirement)} from existing savings)</>}
                          . This is enough to withdraw <span className="font-semibold text-amber-700">{formatINR(result.adjustedMonthlyExpense)}/month</span>
                          {result.pensionPV > 0 && <> (net of {formatINR(monthlyPension)} pension)</>}
                          {' '}for <span className="font-semibold text-amber-700">{result.yearsInRetirement} years</span> (till age {lifeExpectancy})
                          {remainingCorpus > 0 && <> with <span className="font-semibold text-teal-700">{formatINR(remainingCorpus)}</span> remaining as legacy</>}!
                          {' '}That&apos;s the power of early planning.
                        </>
                      ) : (
                        <>
                          With <span className="font-semibold text-brand-700">{formatINR(result.monthlySIPRequired)}/month</span> for <span className="font-semibold text-brand-700">{result.yearsToRetirement} years</span>,
                          {' '}{nameOrYour} can build <span className="font-semibold text-teal-700">{formatINR(result.corpusRequired)}</span>, but it lasts
                          {' '}only <span className="font-semibold text-red-600">~{result.yearsCorpusLasts} years</span> instead of {result.yearsInRetirement} years.
                          {' '}Consider increasing your SIP, extending the working period, or reducing post-retirement expenses.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Retirement Readiness Gauge + Inflation Impact */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Readiness Score */}
                <div className="card-base p-5" data-pdf-keep-together>
                  <h4 className="font-bold text-primary-700 mb-3 text-sm">Retirement Readiness</h4>
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="8" fill="none" />
                        <circle
                          cx="50" cy="50" r="42"
                          stroke={gaugeColor}
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold" style={{ color: gaugeColor }}>{score}</span>
                        <span className="text-[9px] text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: gaugeColor }}>{gaugeLabel}</div>
                      <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                        <div>{result.corpusAdequacyRatio >= 100 ? '\u2713' : '\u2717'} Corpus adequacy: {result.corpusAdequacyRatio}%</div>
                        {hasExistingSavings && <div>{'\u2713'} Existing savings included</div>}
                        {hasRetirementBenefits && <div>{'\u2713'} Pension income planned</div>}
                        {hasExpenseReduction && <div>{'\u2713'} Expense reduction factored</div>}
                        {hasHealthcareReserve && <div>{'\u2713'} Healthcare reserve set</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inflation Impact */}
                <div className="card-base p-5" data-pdf-keep-together>
                  <h4 className="font-bold text-primary-700 mb-3 text-sm">Inflation Impact</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Today</div>
                        <div className="text-lg font-extrabold text-brand-700">{formatINR(monthlyExpense)}</div>
                        <div className="text-[10px] text-slate-400">/month</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">At Retirement</div>
                        <div className="text-lg font-extrabold text-amber-700">{formatINR(result.futureMonthlyExpense)}</div>
                        <div className="text-[10px] text-slate-400">/month</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-center">
                      {'\u26A0'} Purchasing power erodes <span className="font-semibold text-amber-600">
                      {Math.round((1 - monthlyExpense / result.futureMonthlyExpense) * 100)}%</span> over {result.yearsToRetirement} years at {inflationRate}% inflation
                    </div>
                    {hasExpenseReduction && (
                      <div className="text-[10px] text-teal-600 bg-teal-50 rounded-lg px-3 py-1.5 text-center">
                        After {expenseReduction}% reduction: {formatINR(result.adjustedMonthlyExpense)}/month
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Accumulation Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Phase 1: Corpus Building Journey</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {nameOrYourApos} SIP growth path from age {currentAge} to {retirementAge} &mdash; target {formatINR(result.corpusRequired)}
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="retAccGradInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="retAccGradValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.corpus} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.corpus} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label = name === 'invested' ? 'Total Invested' : name === 'existingSavings' ? 'Existing Savings' : 'Portfolio Value';
                          return [formatINR(value), label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="url(#retAccGradInvested)" strokeWidth={2} name="invested" />
                      <Area type="monotone" dataKey="value" stroke={COLORS.corpus} fill="url(#retAccGradValue)" strokeWidth={2} name="value" />
                      {result.existingSavingsAtRetirement > 0 && (
                        <Area type="monotone" dataKey="existingSavings" stroke={COLORS.savings} fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="existingSavings" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Distribution Phase Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Phase 2: Corpus Depletion in Retirement</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How {nameOrYour.toLowerCase()} corpus sustains withdrawals from age {retirementAge} to {lifeExpectancy}
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={depletionChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="retDepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PHASE_COLORS.distribution.fill} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={PHASE_COLORS.distribution.fill} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name === 'corpus' ? 'Remaining Corpus' : 'Annual Withdrawal']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      {!corpusLasts && (
                        <ReferenceLine
                          x={`Age ${retirementAge + Math.floor(result.yearsCorpusLasts)}`}
                          stroke="#DC2626"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: 'Corpus Ends', position: 'top', fontSize: 10, fill: '#DC2626' }}
                        />
                      )}
                      <Area type="monotone" dataKey="corpus" stroke={PHASE_COLORS.distribution.primary} fill="url(#retDepGrad)" strokeWidth={2.5} name="corpus" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Corpus Composition Pie ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Composition</h3>
                <p className="text-sm text-slate-500 mb-6">How {nameOrYour.toLowerCase()} retirement corpus is funded</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Scenario Comparison ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Scenario Analysis</h3>
                <p className="text-sm text-slate-500 mb-6">Monthly SIP needed under different return assumptions</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scenarioBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="sip" name="Monthly SIP" fill={COLORS.invested} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="invested" name="Total Investment" fill={COLORS.corpus} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Scenario summary cards */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {scenarios.map(s => (
                    <div key={s.label} className={cn(
                      'text-center p-3 rounded-lg border',
                      s.value === preRetirementReturn ? 'bg-brand-50 border-brand-200' : 'bg-surface-50 border-surface-200'
                    )}>
                      <div className="text-[10px] text-slate-400 uppercase">{s.label} ({s.value}%)</div>
                      <div className="text-sm font-extrabold text-primary-700 mt-1">{formatINR(s.result.monthlySIPRequired)}</div>
                      <div className="text-[10px] text-slate-400">/month</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Enhanced Table ── */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Complete Lifecycle Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Year-by-year view across accumulation and distribution phases</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-center py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Phase</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cumulative</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Corpus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Accumulation rows */}
                      {result.accumulationSchedule.map((row) => (
                        <tr key={`acc-${row.year}`} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                            Yr {row.year} <span className="text-slate-400 font-normal text-xs">(Age {row.age})</span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-center">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', PHASE_COLORS.accumulation.badge)}>
                              Save
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right text-brand-700 font-medium">{formatINR(result.monthlySIPRequired)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.invested)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right font-semibold text-primary-700">{formatINR(row.totalValue)}</td>
                        </tr>
                      ))}
                      {/* Distribution rows */}
                      {result.depletionSchedule.map((row) => (
                        <tr key={`dep-${row.year}`} className={cn(
                          'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                          row.closingCorpus === 0 ? 'bg-red-50/30' : ''
                        )}>
                          <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                            Yr {result.yearsToRetirement + row.year} <span className="text-slate-400 font-normal text-xs">(Age {row.age})</span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-center">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', PHASE_COLORS.distribution.badge)}>
                              Withdraw
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right text-amber-700 font-medium">{formatINR(row.monthlyExpense)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.annualWithdrawal)}</td>
                          <td className={cn(
                            'py-3 px-2 sm:px-3 text-right font-semibold',
                            row.closingCorpus > 0 ? 'text-primary-700' : 'text-red-600'
                          )}>
                            {formatINR(row.closingCorpus)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
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
