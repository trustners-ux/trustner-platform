'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, IndianRupee, Calendar, TrendingUp, Wallet,
  Lightbulb, Droplets, PiggyBank, BarChart3, ArrowRightLeft,
  ChevronDown, ChevronUp, Settings2, Target, Clock, Banknote,
  AlertTriangle, CheckCircle2, Info, RefreshCcw, ArrowRight, Trash2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line, ReferenceLine,
} from 'recharts';
import { calculateBucketStrategy } from '@/lib/utils/bucket-strategy-calc';
import type { BucketStrategyInputs, BucketInsight, RetirementIncomeSource, LumpsumEvent } from '@/lib/utils/bucket-strategy-calc';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

// ── Bucket Color Map ──
const BUCKET_STYLES = [
  { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500', badgeText: 'text-white', ring: 'ring-red-200', fill: '#EF4444', light: '#FEF2F2' },
  { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-500', badgeText: 'text-white', ring: 'ring-blue-200', fill: '#3B82F6', light: '#EFF6FF' },
  { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-500', badgeText: 'text-white', ring: 'ring-purple-200', fill: '#8B5CF6', light: '#F5F3FF' },
  { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500', badgeText: 'text-white', ring: 'ring-amber-200', fill: '#F59E0B', light: '#FFFBEB' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-500', badgeText: 'text-white', ring: 'ring-emerald-200', fill: '#10B981', light: '#ECFDF5' },
];

const PIE_COLORS = ['#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

export default function BucketStrategyPage() {
  // ── State ──
  const [investorName, setInvestorName] = useState('');
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpenses, setMonthlyExpenses] = useState(100000);

  // Return assumptions
  const [customReturns, setCustomReturns] = useState(false);
  const [liquidReturn, setLiquidReturn] = useState(5);
  const [debtReturn, setDebtReturn] = useState(7);
  const [assetAllocationReturn, setAssetAllocationReturn] = useState(10);
  const [equityReturn, setEquityReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);

  // Corpus inputs
  const [hasLumpsum, setHasLumpsum] = useState(true);
  const [lumpsumCorpus, setLumpsumCorpus] = useState(20000000);
  // Income sources
  const [incomeSources, setIncomeSources] = useState<RetirementIncomeSource[]>([]);

  // Pre-retirement
  const [existingSavings, setExistingSavings] = useState(0);
  const [preRetirementReturn, setPreRetirementReturn] = useState(12);
  const [showCurrentSavings, setShowCurrentSavings] = useState(false);
  const [monthlySavings, setMonthlySavings] = useState(50000);

  // Lumpsum events during retirement
  const [lumpsumEvents, setLumpsumEvents] = useState<LumpsumEvent[]>([]);
  let lumpsumEventId = lumpsumEvents.length;

  // UI state
  const [showYearlyDetails, setShowYearlyDetails] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const showPreRetirement = yearsToRetirement > 0 || (!hasLumpsum || lumpsumCorpus === 0);

  // ── Income Source Helpers ──
  const addIncomeSource = (type: RetirementIncomeSource['type']) => {
    const defaults: Record<RetirementIncomeSource['type'], Partial<RetirementIncomeSource>> = {
      pension: { label: 'Employer Pension', monthlyAmount: 25000, growthRate: 0 },
      rental: { label: 'Rental Income', monthlyAmount: 20000, growthRate: 5 },
      scss: { label: 'SCSS Interest', monthlyAmount: 10000, growthRate: 0, endYear: 5 },
      nps: { label: 'NPS Annuity', monthlyAmount: 15000, growthRate: 0 },
      swp: { label: 'SWP from MF', monthlyAmount: 30000, growthRate: 0 },
      epf_pension: { label: 'EPF Pension (EPS-95)', monthlyAmount: 7500, growthRate: 0 },
      other: { label: 'Other Income', monthlyAmount: 10000, growthRate: 0 },
    };
    const d = defaults[type];
    setIncomeSources(prev => [...prev, {
      type,
      label: d.label || type,
      monthlyAmount: d.monthlyAmount || 10000,
      startYear: 0,
      growthRate: d.growthRate ?? 0,
      ...d,
    }]);
  };

  const updateIncomeSource = (index: number, updates: Partial<RetirementIncomeSource>) => {
    setIncomeSources(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const removeIncomeSource = (index: number) => {
    setIncomeSources(prev => prev.filter((_, i) => i !== index));
  };

  // ── Calculation ──
  const result = useMemo(() => {
    const inputs: BucketStrategyInputs = {
      currentAge,
      retirementAge,
      lifeExpectancy,
      monthlyExpenses,
      inflationRate,
      liquidReturn: customReturns ? liquidReturn : 5,
      debtReturn: customReturns ? debtReturn : 7,
      assetAllocationReturn: customReturns ? assetAllocationReturn : 10,
      equityReturn: customReturns ? equityReturn : 12,
      lumpsumCorpus: hasLumpsum ? lumpsumCorpus : 0,
      additionalMonthlyIncome: incomeSources.reduce((sum, s) => sum + s.monthlyAmount, 0),
      incomeSources,
      existingInvestments: existingSavings,
      preRetirementReturn,
      currentMonthlySavings: showCurrentSavings ? monthlySavings : 0,
      lumpsumEvents: lumpsumEvents.length > 0 ? lumpsumEvents : undefined,
    };
    return calculateBucketStrategy(inputs);
  }, [
    currentAge, retirementAge, lifeExpectancy, monthlyExpenses, inflationRate,
    customReturns, liquidReturn, debtReturn, assetAllocationReturn, equityReturn,
    hasLumpsum, lumpsumCorpus, incomeSources,
    existingSavings, preRetirementReturn, showCurrentSavings, monthlySavings,
    lumpsumEvents,
  ]);

  // ── Chart Data ──
  const depletionChartData = result.depletionSchedule.map((row) => ({
    age: row.age,
    corpus: row.yearEndCorpus,
    bucket0: row.bucket0Balance || 0,
    bucket1: row.bucket1Balance || 0,
    bucket2: row.bucket2Balance || 0,
    bucket3: row.bucket3Balance || 0,
    bucket4: row.bucket4Balance || 0,
    annualWithdrawal: row.annualWithdrawal,
    total: row.yearEndCorpus,
  }));

  const pieData = result.buckets
    .filter(b => b.requiredCorpus > 0)
    .map((b, i) => ({
      name: b.label,
      value: b.requiredCorpus,
      color: PIE_COLORS[b.bucketNumber],
    }));

  const sipCompareData = result.yearsToRetirement > 0 && result.monthlySIPNeeded > 0
    ? [
        { name: 'Level SIP', amount: result.monthlySIPNeeded },
        { name: 'Step-Up SIP (10%)', amount: result.stepUpSIPNeeded },
      ]
    : [];

  const handleCurrentAgeChange = (val: number) => {
    setCurrentAge(val);
    if (val >= retirementAge) setRetirementAge(Math.min(val + 5, 80));
  };

  const nameOrYour = investorName || 'Your';

  // ── Custom Tooltip ──
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-surface-300 shadow-lg rounded-xl p-3">
          <p className="text-xs font-bold text-primary-700 mb-1">Age {label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-xs text-slate-600">{formatINR(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* ═══ Header ═══ */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Droplets className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Retirement Income Optimizer</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Retirement Bucket Strategy</h1>
              <p className="text-slate-300 mt-1">Optimize your retirement corpus across 5 time-horizon buckets for maximum safety and growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Main Content ═══ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">

            {/* ══ Input Panel (Left Sidebar) ══ */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Bucket Strategy Profile</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={null}
                onAgeChange={() => {}}
                showAge={false}
                namePlaceholder="e.g., Ram"
              />

              {/* Card A: Personal Details */}
              <div className="card-base p-4 sm:p-5 border-t-4 border-emerald-500 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-primary-700">Personal Details</h3>
                </div>
                <div className="space-y-4">
                  <NumberInput label="Current Age" value={currentAge} onChange={handleCurrentAgeChange} suffix="years" step={1} min={25} max={80} />
                  <NumberInput label="Retirement Age" value={retirementAge} onChange={setRetirementAge} suffix="years" step={1} min={Math.max(currentAge + 1, 30)} max={80} />
                  <NumberInput label="Life Expectancy" value={lifeExpectancy} onChange={setLifeExpectancy} suffix="years" step={1} min={Math.max(retirementAge + 5, 60)} max={100} />
                  <NumberInput label="Monthly Expenses (Today)" value={monthlyExpenses} onChange={setMonthlyExpenses} prefix="₹" step={5000} min={10000} max={1000000} />
                </div>
              </div>

              {/* Card B: Return Assumptions */}
              <div className="card-base p-4 sm:p-5 border-t-4 border-brand-500 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-primary-700">Return Assumptions</h3>
                </div>

                {/* Customize Toggle */}
                <div className={cn('rounded-xl border p-3 mb-4', customReturns ? 'border-brand-200 bg-brand-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Customize Returns</label>
                    <button
                      role="switch"
                      aria-checked={customReturns}
                      onClick={() => setCustomReturns(!customReturns)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', customReturns ? 'bg-brand-500' : 'bg-slate-300')}
                      data-pdf-hide
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', customReturns ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{customReturns ? 'Set your own return expectations' : 'Using default market assumptions'}</div>
                </div>

                {customReturns && (
                  <div className="space-y-4 animate-in">
                    <NumberInput label="Liquid/FD Return" value={liquidReturn} onChange={setLiquidReturn} suffix="% p.a." step={0.5} min={4} max={12} />
                    <NumberInput label="Debt/BAF Return" value={debtReturn} onChange={setDebtReturn} suffix="% p.a." step={0.5} min={4} max={12} />
                    <NumberInput label="Asset Allocation Return" value={assetAllocationReturn} onChange={setAssetAllocationReturn} suffix="% p.a." step={0.5} min={7} max={20} />
                    <NumberInput label="Equity Return" value={equityReturn} onChange={setEquityReturn} suffix="% p.a." step={0.5} min={7} max={20} />
                  </div>
                )}

                <div className="mt-4">
                  <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={0.5} min={3} max={10} />
                </div>
              </div>

              {/* Card C: Retirement Corpus */}
              <div className="card-base p-4 sm:p-5 border-t-4 border-amber-500 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-primary-700">Retirement Corpus</h3>
                </div>

                {/* Lumpsum Toggle */}
                <div className={cn('rounded-xl border p-3 mb-3', hasLumpsum ? 'border-amber-200 bg-amber-50/50' : 'border-surface-300 bg-surface-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">I know my retirement corpus</label>
                    <button
                      role="switch"
                      aria-checked={hasLumpsum}
                      onClick={() => setHasLumpsum(!hasLumpsum)}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', hasLumpsum ? 'bg-amber-500' : 'bg-slate-300')}
                      data-pdf-hide
                    >
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', hasLumpsum ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">{hasLumpsum ? 'Total money you will have at retirement (PF + MF + FD + all savings)' : 'Calculator will tell you how much you need to accumulate'}</div>
                  {hasLumpsum && (
                    <div className="mt-3 animate-in">
                      <NumberInput label="Total Retirement Corpus" value={lumpsumCorpus} onChange={setLumpsumCorpus} prefix="₹" step={500000} min={0} max={500000000} />
                    </div>
                  )}
                </div>

              </div>

              {/* Card E: Retirement Income Sources */}
              <div className="card-base p-4 sm:p-5 border-t-4 border-teal-500 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-primary-700">Retirement Income Sources</h3>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Add any income you&apos;ll receive during retirement — pension, rental, SCSS, NPS, SWP, etc.
                  These reduce how much you need to withdraw from your buckets.
                </p>

                {/* Add Source Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {([
                    { type: 'pension', label: 'Pension', icon: '\u{1F3DB}\uFE0F' },
                    { type: 'rental', label: 'Rental', icon: '\u{1F3E0}' },
                    { type: 'scss', label: 'SCSS', icon: '\u{1F3E6}' },
                    { type: 'nps', label: 'NPS', icon: '\u{1F4CA}' },
                    { type: 'swp', label: 'SWP', icon: '\u{1F4B0}' },
                    { type: 'epf_pension', label: 'EPF Pension', icon: '\u{1F477}' },
                    { type: 'other', label: 'Other', icon: '\u{2795}' },
                  ] as const).map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => addIncomeSource(type)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                      data-pdf-hide
                    >
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>

                {/* Income Source Cards */}
                {incomeSources.map((source, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-3 mb-2 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={source.label}
                        onChange={(e) => updateIncomeSource(idx, { label: e.target.value })}
                        className="text-xs font-semibold text-slate-700 bg-transparent border-none outline-none flex-1"
                      />
                      <button onClick={() => removeIncomeSource(idx)} className="text-slate-400 hover:text-red-500 p-1" data-pdf-hide>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput label="Monthly Amount" value={source.monthlyAmount} onChange={(v) => updateIncomeSource(idx, { monthlyAmount: v })} prefix="₹" step={1000} min={0} max={500000} />
                      {source.type === 'rental' && (
                        <NumberInput label="Annual Growth" value={source.growthRate || 0} onChange={(v) => updateIncomeSource(idx, { growthRate: v })} suffix="%" step={1} min={0} max={15} />
                      )}
                      {source.type === 'scss' && (
                        <NumberInput label="Term (Years)" value={source.endYear || 5} onChange={(v) => updateIncomeSource(idx, { endYear: v })} suffix="Yrs" step={1} min={1} max={10} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Total Income Summary */}
                {incomeSources.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-teal-700">Total Monthly Income (Year 1)</span>
                      <span className="text-sm font-bold text-teal-700">
                        {formatINR(incomeSources.reduce((sum, s) => sum + s.monthlyAmount, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card D: Lumpsum Events During Retirement */}
              <div className="card-base p-4 sm:p-5 border-t-4 border-rose-500 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRightLeft className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-primary-700">Lumpsum Events</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Add one-time investments (inheritance, property sale) or withdrawals
                  (child marriage, medical, house) at specific ages during retirement.
                </p>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setLumpsumEvents(prev => [...prev, { id: Date.now(), type: 'invest', label: 'Inheritance', amount: 2000000, atAge: retirementAge + 5 }])}
                    className="flex-1 text-[11px] font-semibold py-2 px-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    + Investment
                  </button>
                  <button
                    onClick={() => setLumpsumEvents(prev => [...prev, { id: Date.now() + 1, type: 'withdraw', label: 'Child Marriage', amount: 3000000, atAge: retirementAge + 3 }])}
                    className="flex-1 text-[11px] font-semibold py-2 px-3 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    + Withdrawal
                  </button>
                </div>

                {lumpsumEvents.map((ev, idx) => (
                  <div key={ev.id} className={cn('rounded-lg border p-3 mb-2', ev.type === 'invest' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50')}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', ev.type === 'invest' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')}>
                        {ev.type === 'invest' ? 'Investment' : 'Withdrawal'}
                      </span>
                      <button onClick={() => setLumpsumEvents(prev => prev.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text" placeholder="Label" value={ev.label}
                      onChange={(e) => setLumpsumEvents(prev => prev.map((p, i) => i === idx ? { ...p, label: e.target.value } : p))}
                      className="w-full text-xs bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-2 outline-none focus:ring-1 focus:ring-brand-300"
                    />
                    <NumberInput
                      label="Amount" value={ev.amount}
                      onChange={(v) => setLumpsumEvents(prev => prev.map((p, i) => i === idx ? { ...p, amount: v } : p))}
                      prefix="₹" step={100000} min={100000} max={100000000}
                    />
                    <NumberInput
                      label="At Age" value={ev.atAge}
                      onChange={(v) => setLumpsumEvents(prev => prev.map((p, i) => i === idx ? { ...p, atAge: v } : p))}
                      suffix="years" step={1} min={currentAge + 1} max={lifeExpectancy}
                    />
                  </div>
                ))}

                {lumpsumEvents.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600">
                    <span className="font-semibold">Net Impact: </span>
                    <span className={cn('font-bold', lumpsumEvents.reduce((s, e) => s + (e.type === 'invest' ? e.amount : -e.amount), 0) >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                      {formatINR(Math.abs(lumpsumEvents.reduce((s, e) => s + (e.type === 'invest' ? e.amount : -e.amount), 0)))}
                      {' '}{lumpsumEvents.reduce((s, e) => s + (e.type === 'invest' ? e.amount : -e.amount), 0) >= 0 ? 'inflow' : 'outflow'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card E: Pre-Retirement Planning */}
              {showPreRetirement && yearsToRetirement > 0 && (
                <div className="card-base p-4 sm:p-5 border-t-4 border-purple-500 mb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-primary-700">Pre-Retirement Planning</h3>
                  </div>
                  <div className="space-y-4">
                    <NumberInput label="Existing Retirement Savings" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={100000} min={0} max={100000000} />
                    <NumberInput label="Expected Pre-retirement Return" value={preRetirementReturn} onChange={setPreRetirementReturn} suffix="% p.a." step={0.5} min={6} max={20} />

                    {/* Optional: Current Monthly Savings */}
                    <div className="pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-medium text-slate-600">I save regularly (optional)</label>
                        <button
                          role="switch" aria-checked={showCurrentSavings}
                          onClick={() => setShowCurrentSavings(!showCurrentSavings)}
                          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', showCurrentSavings ? 'bg-purple-500' : 'bg-slate-300')}
                        >
                          <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', showCurrentSavings ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                        </button>
                      </div>
                      {showCurrentSavings && (
                        <div className="space-y-3 mt-2 animate-in">
                          <NumberInput label="Current Monthly Savings/SIP" value={monthlySavings} onChange={setMonthlySavings} prefix="₹" step={5000} min={0} max={1000000} />
                          <p className="text-[10px] text-slate-400">Include all SIPs, RDs, PPF, NPS contributions you make monthly</p>
                          {monthlySavings > 0 && result.monthlySIPNeeded > 0 && (
                            <div className={cn('rounded-lg p-2.5 text-xs font-medium', monthlySavings >= result.monthlySIPNeeded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                              {monthlySavings >= result.monthlySIPNeeded
                                ? `You're saving enough! Your ${formatINR(monthlySavings)}/mo exceeds the ${formatINR(result.monthlySIPNeeded)}/mo needed.`
                                : `Gap: You save ${formatINR(monthlySavings)}/mo but need ${formatINR(result.monthlySIPNeeded)}/mo. Increase by ${formatINR(result.monthlySIPNeeded - monthlySavings)}/mo.`
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {result.monthlySIPNeeded > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-purple-50 to-brand-50 rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly SIP Needed</div>
                      <div className="text-lg font-extrabold text-purple-700">{formatINR(result.monthlySIPNeeded)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">or {formatINR(result.stepUpSIPNeeded)}/mo with 10% step-up</div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Summary */}
              <div className="bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{nameOrYour} Retirement Journey</div>
                <div className="text-2xl font-extrabold gradient-text">{result.retirementYears} Years</div>
                <div className="text-xs text-slate-500 mt-1">Age {retirementAge} &rarr; {lifeExpectancy}</div>
                {yearsToRetirement > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500" /> {yearsToRetirement}y save
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> {result.retirementYears}y retire
                  </div>
                )}
              </div>
            </div>

            {/* ══ Results Panel (Right) ══ */}
            <div className="space-y-8">

              {/* Personalized Banner */}
              {investorName && (
                <div className="bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">{investorName}&apos;s Bucket Strategy</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Retire at {retirementAge} &middot; Plan till age {lifeExpectancy} &middot; {result.retirementYears} year retirement
                  </p>
                </div>
              )}

              {/* PDF Download */}
              <div className="flex justify-end" data-pdf-hide>
                <DownloadPDFButton elementId="calculator-results" title="Retirement Bucket Strategy" fileName="bucket-strategy" />
              </div>

              {/* ── Row 1: Key Metrics ── */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card-base p-4 border-t-4 border-emerald-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Corpus Needed</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-1">{formatINR(result.totalCorpusNeeded)}</div>
                </div>
                <div className={cn('card-base p-4 border-t-4', result.shortfall > 0 ? 'border-red-500' : 'border-brand-500')}>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {result.shortfall > 0 ? 'Shortfall' : 'Surplus'}
                  </div>
                  <div className={cn('text-lg font-extrabold mt-1', result.shortfall > 0 ? 'text-red-600' : 'text-brand-700')}>
                    {result.shortfall > 0 ? formatINR(result.shortfall) : formatINR(result.surplus)}
                  </div>
                </div>
                <div className="card-base p-4 border-t-4 border-amber-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly at Retirement</div>
                  <div className="text-lg font-extrabold text-amber-700 mt-1">{formatINR(result.monthlyExpenseAtRetirement)}</div>
                </div>
                <div className="card-base p-4 border-t-4 border-teal-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Income Covers</div>
                  <div className="text-lg font-extrabold text-teal-700 mt-1">{result.incomeCoversPercent?.toFixed(0) || 0}%</div>
                  <div className="text-xs text-slate-500 mt-1">of Year 1 expenses</div>
                </div>
                <div className="card-base p-4 border-t-4 border-blue-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Retirement Duration</div>
                  <div className="text-lg font-extrabold text-blue-700 mt-1">{result.retirementYears} Years</div>
                  <div className="text-[10px] text-slate-400">
                    {result.isSustainable
                      ? <span className="text-emerald-600 font-semibold">Sustainable</span>
                      : <span className="text-red-600 font-semibold">Depletes at age {result.corpusLastsUntilAge}</span>
                    }
                  </div>
                </div>
              </div>

              {/* ── Row 2: The Hero Bucket Diagram ── */}
              <div className="card-base p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Droplets className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-primary-700">Your 5-Bucket Allocation</h3>
                </div>

                {/* Horizontal Flow — Desktop */}
                <div className="hidden lg:grid grid-cols-5 gap-3">
                  {result.buckets.map((bucket, i) => {
                    const style = BUCKET_STYLES[i];
                    return (
                      <div key={i} className="relative">
                        <div className={cn('rounded-xl border-2 p-4 transition-all hover:shadow-lg', style.border, style.bg)}>
                          {/* Badge */}
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3', style.badge, style.badgeText)}>
                            {i}
                          </div>
                          {/* Label */}
                          <div className={cn('text-xs font-bold mb-1', style.text)}>{bucket.label}</div>
                          {/* Timeline */}
                          <div className="text-[10px] text-slate-500 mb-2">{bucket.timeline}</div>
                          {/* Amount */}
                          <div className={cn('text-base font-extrabold mb-1', style.text)}>
                            {formatINR(bucket.requiredCorpus)}
                          </div>
                          {/* Percentage */}
                          <div className="text-[10px] text-slate-400 mb-2">
                            {bucket.allocationPercent.toFixed(1)}% of corpus
                          </div>
                          {/* Products */}
                          <div className="text-[9px] text-slate-500 mb-2 leading-relaxed">
                            {bucket.products.slice(0, 2).join(', ')}
                          </div>
                          {/* Return */}
                          <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', style.bg, style.text)}>
                            <TrendingUp className="w-3 h-3" /> {bucket.returnRate}% p.a.
                          </div>
                          {/* Refill */}
                          <div className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                            <RefreshCcw className="w-3 h-3" /> {bucket.refillSource}
                          </div>
                        </div>
                        {/* Arrow between buckets */}
                        {i < 4 && (
                          <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                            <ArrowRight className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Vertical Flow — Mobile */}
                <div className="lg:hidden space-y-3">
                  {result.buckets.map((bucket, i) => {
                    const style = BUCKET_STYLES[i];
                    return (
                      <div key={i}>
                        <div className={cn('rounded-xl border-2 p-4', style.border, style.bg)}>
                          <div className="flex items-start gap-3">
                            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0', style.badge, style.badgeText)}>
                              {i}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className={cn('text-sm font-bold', style.text)}>{bucket.label}</div>
                                <div className={cn('text-base font-extrabold', style.text)}>{formatINR(bucket.requiredCorpus)}</div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <div className="text-[10px] text-slate-500">{bucket.timeline}</div>
                                <div className="text-[10px] text-slate-400">{bucket.allocationPercent.toFixed(1)}%</div>
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', style.bg, style.text)}>
                                  <TrendingUp className="w-3 h-3" /> {bucket.returnRate}% p.a.
                                </span>
                                <span className="text-[9px] text-slate-400">{bucket.products[0]}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Arrow */}
                        {i < 4 && (
                          <div className="flex justify-center py-1">
                            <ChevronDown className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Row 3: Allocation Pie + Table ── */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="card-base p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-brand-600" /> Allocation Breakdown
                  </h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Product Allocation Table */}
                <div className="card-base p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-600" /> Product Allocation
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-surface-300">
                          <th className="text-left py-2 text-slate-500 font-medium">Bucket</th>
                          <th className="text-left py-2 text-slate-500 font-medium">Timeline</th>
                          <th className="text-right py-2 text-slate-500 font-medium">Amount</th>
                          <th className="text-right py-2 text-slate-500 font-medium">%</th>
                          <th className="text-right py-2 text-slate-500 font-medium">Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.buckets.map((bucket, i) => {
                          const style = BUCKET_STYLES[i];
                          return (
                            <tr key={i} className="border-b border-surface-200/60">
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={cn('w-3 h-3 rounded-full shrink-0', style.badge)} />
                                  <span className={cn('font-semibold', style.text)}>{bucket.label}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-slate-500">{bucket.timeline}</td>
                              <td className="py-2.5 text-right font-bold text-primary-700">{formatINR(bucket.requiredCorpus)}</td>
                              <td className="py-2.5 text-right text-slate-500">{bucket.allocationPercent.toFixed(1)}%</td>
                              <td className="py-2.5 text-right text-slate-500">{bucket.returnRate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-primary-700">
                          <td className="py-2.5 font-bold text-primary-700" colSpan={2}>Total</td>
                          <td className="py-2.5 text-right font-extrabold text-primary-700">{formatINR(result.totalCorpusNeeded)}</td>
                          <td className="py-2.5 text-right font-bold text-primary-700">100%</td>
                          <td className="py-2.5 text-right text-slate-400">&mdash;</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Row 4: Corpus Depletion Chart ── */}
              {depletionChartData.length > 0 && (
                <div className="card-base p-4 sm:p-6">
                  <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-600" /> Corpus Depletion Over Time
                  </h3>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={depletionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          dataKey="age"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${v}`}
                          label={{ value: 'Age', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => {
                            if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
                            if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
                            return `${(v / 1000).toFixed(0)}K`;
                          }}
                        />
                        <Tooltip formatter={(v) => formatINR(v as number)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                        <Area type="monotone" dataKey="bucket4" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Bucket 4 (Equity)" />
                        <Area type="monotone" dataKey="bucket3" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Bucket 3 (Growth)" />
                        <Area type="monotone" dataKey="bucket2" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Bucket 2 (Balanced)" />
                        <Area type="monotone" dataKey="bucket1" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Bucket 1 (Liquid)" />
                        <Area type="monotone" dataKey="bucket0" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Bucket 0 (Emergency)" />
                        <Line type="monotone" dataKey="annualWithdrawal" stroke="#1A1A2E" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Annual Withdrawal" />
                        <ReferenceLine y={0} stroke="#666" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Bucket Rebalancing Timeline ── */}
              {result.rebalancingEvents && result.rebalancingEvents.length > 0 && (
                <div className="card-base p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCcw className="w-5 h-5 text-brand" />
                    <h3 className="text-base font-bold text-primary-700">Bucket Rebalancing Timeline</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    When a bucket&apos;s balance falls below 3 months&apos; expenses, it gets refilled from the next higher bucket.
                    This is the cascade that keeps your income flowing.
                  </p>
                  <div className="space-y-2">
                    {result.rebalancingEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-100 border border-surface-200">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', BUCKET_STYLES[event.fromBucket]?.badge)}>
                          {event.fromBucket}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', BUCKET_STYLES[event.toBucket]?.badge)}>
                          {event.toBucket}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">Year {event.year} — {formatINR(event.amount)} transferred</p>
                          <p className="text-[10px] text-slate-500">{event.trigger}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Row 5: Year-by-Year Details ── */}
              <div className="card-base p-4 sm:p-5">
                <button
                  onClick={() => setShowYearlyDetails(!showYearlyDetails)}
                  className="w-full flex items-center justify-between text-left"
                  data-pdf-hide
                >
                  <h3 className="text-sm font-bold text-primary-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-600" /> Year-by-Year Schedule
                  </h3>
                  {showYearlyDetails ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {showYearlyDetails && (
                  <div className="mt-4 overflow-x-auto animate-in">
                    <table className="w-full text-xs min-w-[1200px]">
                      <thead>
                        <tr className="border-b-2 border-surface-300 bg-surface-50">
                          <th className="text-left py-2.5 px-2 text-slate-500 font-semibold">Yr</th>
                          <th className="text-left py-2.5 px-1 text-slate-500 font-semibold">Age</th>
                          <th className="text-right py-2.5 px-2 text-slate-500 font-semibold">Start Corpus</th>
                          <th className="text-right py-2.5 px-2 text-red-500 font-semibold">Gross Expense</th>
                          <th className="text-right py-2.5 px-2 text-emerald-500 font-semibold">Income</th>
                          <th className="text-right py-2.5 px-2 text-red-600 font-semibold">Net Withdrawal</th>
                          <th className="text-right py-2.5 px-2 text-brand-500 font-semibold">Returns</th>
                          <th className="text-right py-2.5 px-2 text-purple-500 font-semibold">Refill Amt</th>
                          <th className="text-center py-2.5 px-1 text-slate-400 font-semibold">Active</th>
                          <th className="text-right py-2.5 px-2 text-primary-700 font-semibold">End Corpus</th>
                          <th className="text-right py-2.5 px-2 text-slate-400 font-semibold">Cumulative Out</th>
                          <th className="text-left py-2.5 px-2 text-slate-400 font-semibold">Refill Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.depletionSchedule.map((row, i) => {
                          const bucketLabels = ['Emergency', 'Liquid', 'Debt', 'Balanced', 'Equity'];
                          const bucketColors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700'];
                          return (
                            <tr key={i} className={cn('border-b border-surface-200/60 hover:bg-surface-50', i % 5 === 4 && 'border-b-2 border-surface-300')}>
                              <td className="py-2 px-2 font-medium text-primary-700">{row.year}</td>
                              <td className="py-2 px-1 text-slate-600">{row.age}</td>
                              <td className="py-2 px-2 text-right text-slate-600">{formatINR(row.yearStartCorpus)}</td>
                              <td className="py-2 px-2 text-right text-red-500">{formatINR(row.grossExpense || row.annualWithdrawal)}</td>
                              <td className="py-2 px-2 text-right text-emerald-600 font-medium">{row.annualIncome > 0 ? `+${formatINR(row.annualIncome)}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-red-600 font-bold">{formatINR(row.annualWithdrawal)}</td>
                              <td className="py-2 px-2 text-right text-brand-600">{formatINR(row.annualReturn)}</td>
                              <td className="py-2 px-2 text-right text-purple-600">{row.annualFunding > 0 ? formatINR(row.annualFunding) : '—'}</td>
                              <td className="py-2 px-1 text-center"><span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-bold', bucketColors[row.activeBucket])}>{bucketLabels[row.activeBucket]}</span></td>
                              <td className="py-2 px-2 text-right font-extrabold text-primary-700">{formatINR(row.yearEndCorpus)}</td>
                              <td className="py-2 px-2 text-right text-slate-400">{formatINR(row.cumulativeWithdrawn)}</td>
                              <td className="py-2 px-2 text-left text-[10px] text-slate-500 max-w-[180px] truncate" title={row.refillEvents?.join(', ') || ''}>{row.refillEvents?.length > 0 ? row.refillEvents.join(', ') : '—'}</td>
                            </tr>
                          );
                        })}
                        {/* Totals row */}
                        <tr className="bg-surface-100 border-t-2 border-surface-300 font-bold">
                          <td className="py-3 px-2 text-primary-700" colSpan={3}>Total</td>
                          <td className="py-3 px-2 text-right text-red-500">{formatINR(result.depletionSchedule.reduce((s, r) => s + (r.grossExpense || r.annualWithdrawal), 0))}</td>
                          <td className="py-3 px-2 text-right text-emerald-600">{formatINR(result.depletionSchedule.reduce((s, r) => s + (r.annualIncome || 0), 0))}</td>
                          <td className="py-3 px-2 text-right text-red-600">{formatINR(result.depletionSchedule.reduce((s, r) => s + r.annualWithdrawal, 0))}</td>
                          <td className="py-3 px-2 text-right text-brand-600">{formatINR(result.depletionSchedule.reduce((s, r) => s + r.annualReturn, 0))}</td>
                          <td className="py-3 px-2 text-right text-purple-600">{formatINR(result.depletionSchedule.reduce((s, r) => s + (r.annualFunding || 0), 0))}</td>
                          <td className="py-3 px-1" />
                          <td className="py-3 px-2 text-right text-primary-700">{formatINR(result.depletionSchedule[result.depletionSchedule.length - 1]?.yearEndCorpus || 0)}</td>
                          <td className="py-3 px-2 text-right text-slate-400">{formatINR(result.depletionSchedule[result.depletionSchedule.length - 1]?.cumulativeWithdrawn || 0)}</td>
                          <td className="py-3 px-2" />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Row 6: SIP Planning ── */}
              {yearsToRetirement > 0 && result.monthlySIPNeeded > 0 && (
                <div className="card-base p-4 sm:p-6 border-t-4 border-purple-500">
                  <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" /> SIP Planning ({yearsToRetirement} Years to Retirement)
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-purple-50 p-4">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Level SIP (Fixed Monthly)</div>
                      <div className="text-xl font-extrabold text-purple-700 mt-1">{formatINR(result.monthlySIPNeeded)}<span className="text-xs font-normal text-slate-400">/month</span></div>
                      <div className="text-[10px] text-slate-400 mt-1">Same amount every month for {yearsToRetirement} years</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-4">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Step-Up SIP (10% Annual Increase)</div>
                      <div className="text-xl font-extrabold text-brand-700 mt-1">{formatINR(result.stepUpSIPNeeded)}<span className="text-xs font-normal text-slate-400">/month</span></div>
                      <div className="text-[10px] text-slate-400 mt-1">Start lower, increase 10% every year</div>
                    </div>
                  </div>
                  {sipCompareData.length > 0 && (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sipCompareData} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => formatINR(v)}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 11 }}
                            width={120}
                          />
                          <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Bar dataKey="amount" fill="#8B5CF6" radius={[0, 8, 8, 0]} name="Monthly SIP" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* ── Row 7: CFP Insights ── */}
              <div className="card-base p-4 sm:p-6 bg-gradient-to-br from-brand-50/50 via-white to-amber-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-700">CFP Insights</h3>
                    <p className="text-[10px] text-slate-400">Personalized observations for your bucket strategy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {result.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              </div>

              {/* ── Row 8: Educational Section ── */}
              <div className="card-base p-4 sm:p-5">
                <button
                  onClick={() => setShowEducation(!showEducation)}
                  className="w-full flex items-center justify-between text-left"
                  data-pdf-hide
                >
                  <h3 className="text-sm font-bold text-primary-700 flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-600" /> How Bucket Strategy Works
                  </h3>
                  {showEducation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {showEducation && (
                  <div className="mt-5 animate-in space-y-6">
                    {/* 5-Step Explanation */}
                    <div className="space-y-4">
                      <EducationStep
                        step={1}
                        title="Divide Your Corpus into Time-Horizon Buckets"
                        description="Instead of one large pool, split your retirement money into 5 buckets based on when you need it. Near-term needs go into safe instruments, far-off needs into growth assets."
                        icon={<Droplets className="w-5 h-5" />}
                        color="brand"
                      />
                      <EducationStep
                        step={2}
                        title="Bucket 0 & 1 Cover Immediate Needs"
                        description="Emergency fund (6 months) stays in a savings account or liquid fund. Short-term income (1-3 years) goes into FDs and ultra-short funds. This shields you from market volatility."
                        icon={<Wallet className="w-5 h-5" />}
                        color="blue"
                      />
                      <EducationStep
                        step={3}
                        title="Bucket 2 & 3 Bridge the Gap"
                        description="Medium-term (4-6 years) in balanced advantage and multi-asset funds. Growth (7-10 years) in flexi-cap and aggressive hybrid funds. Moderate risk for moderate returns."
                        icon={<BarChart3 className="w-5 h-5" />}
                        color="purple"
                      />
                      <EducationStep
                        step={4}
                        title="Bucket 4 is Your Growth Engine"
                        description="Long-term (10+ years) stays in equity — multi-cap, flexi-cap, value funds. This bucket has time to ride out market cycles and deliver inflation-beating returns."
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="emerald"
                      />
                      <EducationStep
                        step={5}
                        title="Refill Mechanism — The Secret Sauce"
                        description="As lower buckets deplete, they are refilled from higher buckets. This 'waterfall' approach means you never sell equity in a downturn. Wait for recovery, then refill."
                        icon={<RefreshCcw className="w-5 h-5" />}
                        color="amber"
                      />
                    </div>

                    {/* Refill Diagram */}
                    <div className="bg-gradient-to-r from-surface-100 to-surface-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-primary-700 mb-3">Refill Waterfall</h4>
                      <div className="flex flex-col sm:flex-row items-center gap-2 text-[10px] font-semibold">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700">Bucket 4 (Equity)</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
                        <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">Bucket 3 (Growth)</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
                        <span className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700">Bucket 2 (Debt)</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
                        <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700">Bucket 1 (Liquid)</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
                        <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700">Bucket 0 (Emergency)</span>
                      </div>
                    </div>

                    {/* Who is it for */}
                    <div className="bg-gradient-to-r from-brand-50 to-teal-50 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-primary-700 mb-2">Who is the Bucket Strategy for?</h4>
                      <ul className="space-y-2 text-xs text-slate-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                          <span>Retirees or near-retirees who want to systematically draw down their corpus</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                          <span>Anyone who worries about market crashes depleting retirement funds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                          <span>People who want a clear, rule-based approach instead of ad-hoc withdrawals</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                          <span>Investors looking to balance safety (immediate needs) with growth (long-term wealth)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Row 9: Disclaimer ── */}
              <div className="card-base p-4 sm:p-5 bg-surface-50">
                <p className="text-[10px] text-slate-400 leading-relaxed">{DISCLAIMER.calculator}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2">{DISCLAIMER.mutual_fund}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{DISCLAIMER.amfi}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Sub-Components ──

function InsightCard({ insight }: { insight: BucketInsight }) {
  const config = {
    positive: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
    critical: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconColor: 'text-red-500' },
    tip: { icon: Lightbulb, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
  }[insight.type];

  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-3 flex items-start gap-3', config.bg, config.border)}>
      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.iconColor)} />
      <div>
        <div className={cn('text-xs font-bold', config.text)}>{insight.title}</div>
        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{insight.description}</div>
      </div>
    </div>
  );
}

function EducationStep({
  step, title, description, icon, color,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, { badge: string; text: string }> = {
    brand: { badge: 'bg-brand-100 text-brand-700', text: 'text-brand-700' },
    blue: { badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
    purple: { badge: 'bg-purple-100 text-purple-700', text: 'text-purple-700' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
    amber: { badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  };

  const c = colorClasses[color] || colorClasses.brand;

  return (
    <div className="flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.badge)}>
        {icon}
      </div>
      <div>
        <div className={cn('text-xs font-bold', c.text)}>Step {step}: {title}</div>
        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}
