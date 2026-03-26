'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Droplets, Plus, Trash2, TrendingUp, TrendingDown,
  ShieldCheck, Wallet, PiggyBank, ArrowRightLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { calculateBucketStrategy } from '@/lib/utils/bucket-strategy-calc';
import type {
  BucketInputs, BucketAllocation, BucketInsight,
  CorpusSource, RegularIncome, LumpsumEvent, YearlyBreakdown,
} from '@/lib/utils/bucket-strategy-calc';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

// ── Constants ──────────────────────────────────────

type CorpusSourceType = CorpusSource['type'];
const SOURCE_TYPE_OPTIONS: { key: CorpusSourceType; label: string }[] = [
  { key: 'epf', label: 'EPF/PF' },
  { key: 'ppf', label: 'PPF' },
  { key: 'gratuity', label: 'Gratuity' },
  { key: 'nps_lumpsum', label: 'NPS Lumpsum' },
  { key: 'insurance_maturity', label: 'Insurance Maturity' },
  { key: 'fd', label: 'FD' },
  { key: 'mf', label: 'Mutual Funds' },
  { key: 'esop', label: 'ESOP' },
  { key: 'savings', label: 'Savings' },
  { key: 'other', label: 'Other' },
];

type IncomeType = RegularIncome['type'];
const INCOME_TYPE_OPTIONS: { key: IncomeType; label: string }[] = [
  { key: 'pension', label: 'Pension' },
  { key: 'nps_annuity', label: 'NPS Annuity' },
  { key: 'scss', label: 'SCSS' },
  { key: 'swp', label: 'SWP' },
  { key: 'rental', label: 'Rental' },
  { key: 'epf_pension', label: 'EPF Pension' },
  { key: 'pmvvy', label: 'PMVVY' },
  { key: 'other', label: 'Other' },
];

const BUCKET_STYLES = [
  { label: 'Emergency', color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', fill: '#10B981' },
  { label: 'Short-Term', color: '#14B8A6', bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', fill: '#14B8A6' },
  { label: 'Medium-Term', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', fill: '#F59E0B' },
  { label: 'Growth', color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', fill: '#8B5CF6' },
  { label: 'Equity', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', fill: '#EF4444' },
];

const INSIGHT_STYLES: Record<BucketInsight['type'], { bg: string; border: string; text: string }> = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  tip: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
};

function fmtLakhs(v: number): string {
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return formatNumber(Math.round(v));
}

// ── Summary Card ──

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'emerald' | 'teal' | 'red' | 'amber' | 'purple';
}) {
  const map: Record<string, { bg: string; iconBg: string; text: string; val: string }> = {
    emerald: { bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-600', val: 'text-emerald-800' },
    teal: { bg: 'bg-teal-50 border-teal-200', iconBg: 'bg-teal-100 text-teal-600', text: 'text-teal-600', val: 'text-teal-800' },
    red: { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100 text-red-600', text: 'text-red-600', val: 'text-red-800' },
    amber: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-600', val: 'text-amber-800' },
    purple: { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100 text-purple-600', text: 'text-purple-600', val: 'text-purple-800' },
  };
  const s = map[color];
  return (
    <div className={cn('rounded-xl border p-3', s.bg)}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.iconBg)}>{icon}</div>
      <div className={cn('text-[11px] font-semibold mb-0.5', s.text)}>{label}</div>
      <div className={cn('text-sm font-extrabold', s.val)}>{value}</div>
    </div>
  );
}

// ── Page Component ──────────────────────────────────

export default function BucketStrategyPage() {
  const [clientName, setClientName] = useState('');
  const [clientAge, setClientAge] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
  const [inflationRate, setInflationRate] = useState(5);

  const [corpusSources, setCorpusSources] = useState<CorpusSource[]>([
    { id: '1', type: 'epf', label: 'EPF', amount: 2000000 },
    { id: '2', type: 'ppf', label: 'PPF', amount: 1000000 },
    { id: '3', type: 'gratuity', label: 'Gratuity', amount: 1000000 },
    { id: '4', type: 'mf', label: 'Mutual Funds', amount: 1500000 },
  ]);
  const [nextCorpusId, setNextCorpusId] = useState(5);

  const [incomes, setIncomes] = useState<RegularIncome[]>([
    { id: '1', type: 'pension', label: 'Pension', monthlyAmount: 25000, growthRate: 0 },
  ]);
  const [nextIncomeId, setNextIncomeId] = useState(2);

  const [lumpsumEvents, setLumpsumEvents] = useState<LumpsumEvent[]>([]);
  const [nextLumpsumId, setNextLumpsumId] = useState(1);

  const [overrideHHE, setOverrideHHE] = useState(false);
  const [retirementHHE, setRetirementHHE] = useState(0);
  const [wantsLegacy, setWantsLegacy] = useState(false);
  const [legacyPercent, setLegacyPercent] = useState(5);
  const [customReturns, setCustomReturns] = useState(false);
  const [liquidReturn, setLiquidReturn] = useState(5);
  const [debtReturn, setDebtReturn] = useState(7);
  const [balancedReturn, setBalancedReturn] = useState(10);
  const [equityReturn, setEquityReturn] = useState(12);
  const [showYearlyTable, setShowYearlyTable] = useState(false);

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const totalCorpus = corpusSources.reduce((s, c) => s + c.amount, 0);
  const totalMonthlyIncome = incomes.reduce((s, i) => s + i.monthlyAmount, 0);

  const autoHHE = useMemo(() => {
    return Math.round(monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement));
  }, [monthlyExpenses, inflationRate, yearsToRetirement]);

  const handleOverrideToggle = () => {
    if (!overrideHHE) setRetirementHHE(autoHHE);
    setOverrideHHE(!overrideHHE);
  };

  const lumpsumNetImpact = lumpsumEvents.reduce(
    (s, e) => s + (e.type === 'investment' ? e.amount : -e.amount), 0
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => {
    const inputs: BucketInputs = {
      clientName,
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentMonthlyHHE: monthlyExpenses,
      retirementHHE: overrideHHE ? retirementHHE : undefined,
      inflationRate,
      liquidReturn: customReturns ? liquidReturn : 5,
      debtReturn: customReturns ? debtReturn : 7,
      balancedReturn: customReturns ? balancedReturn : 10,
      equityReturn: customReturns ? equityReturn : 12,
      corpusSources,
      regularIncome: incomes,
      lumpsumEvents,
      wantsLegacy,
      legacyPercent: wantsLegacy ? legacyPercent : 0,
    };
    return calculateBucketStrategy(inputs);
  }, [
    clientName, currentAge, retirementAge, lifeExpectancy, monthlyExpenses,
    inflationRate, overrideHHE, retirementHHE, customReturns, liquidReturn,
    debtReturn, balancedReturn, equityReturn,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(corpusSources), JSON.stringify(incomes), JSON.stringify(lumpsumEvents),
    wantsLegacy, legacyPercent,
  ]);

  const chartData = result.yearlyBreakdown.map((row: YearlyBreakdown) => ({
    age: row.age,
    B0: Math.round(row.bucket0),
    B1: Math.round(row.bucket1),
    B2: Math.round(row.bucket2),
    B3: Math.round(row.bucket3),
    B4: Math.round(row.bucket4),
  }));

  const addCorpusSource = (type: CorpusSourceType) => {
    const label = SOURCE_TYPE_OPTIONS.find(t => t.key === type)?.label ?? 'Other';
    setCorpusSources(prev => [...prev, { id: String(nextCorpusId), type, label, amount: 500000 }]);
    setNextCorpusId(p => p + 1);
  };

  const addIncome = (type: IncomeType) => {
    const label = INCOME_TYPE_OPTIONS.find(t => t.key === type)?.label ?? 'Other';
    setIncomes(prev => [...prev, { id: String(nextIncomeId), type, label, monthlyAmount: 10000, growthRate: type === 'rental' ? 5 : 0 }]);
    setNextIncomeId(p => p + 1);
  };

  const addLumpsum = (type: 'investment' | 'withdrawal') => {
    setLumpsumEvents(prev => [...prev, {
      id: String(nextLumpsumId), type,
      label: type === 'investment' ? 'Property Sale' : 'Child Marriage',
      amount: 500000, atAge: retirementAge + 5,
    }]);
    setNextLumpsumId(p => p + 1);
  };

  const monthlyGap = result.monthlyGap;
  const incomePercent = result.incomeCoversPercent;

  return (
    <>
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
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">CFP-Grade Planner</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Bucket Strategy Planner</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Segment your retirement corpus into 5 time-based buckets for sustainable income.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar name={clientName} onNameChange={setClientName} age={clientAge} onAgeChange={setClientAge} ageLabel="Current Age" namePlaceholder="e.g., Rajesh" showAge={false} />
            <DownloadPDFButton elementId="calculator-results" title="Bucket Strategy Plan" fileName={`Bucket-Strategy-${clientName || 'Plan'}`} />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ═══════ LEFT PANEL ═══════ */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Section 1: Client Details */}
              <div className="border-t-4 border-emerald-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Client Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Client Name</label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g., Rajesh Sharma" className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300" />
                  </div>
                  <NumberInput label="Current Age" value={currentAge} onChange={setCurrentAge} suffix="years" step={1} min={25} max={80} />
                  <NumberInput label="Retirement Age" value={retirementAge} onChange={setRetirementAge} suffix="years" step={1} min={45} max={75} />
                  <NumberInput label="Life Expectancy" value={lifeExpectancy} onChange={setLifeExpectancy} suffix="years" step={1} min={65} max={100} />
                  <NumberInput label="Monthly Household Expenses" value={monthlyExpenses} onChange={setMonthlyExpenses} prefix="Rs." step={5000} min={10000} max={1000000} />
                  <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={0.5} min={3} max={10} />
                </div>
              </div>

              {/* Section 2: Retirement Corpus */}
              <div className="border-t-4 border-brand rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><PiggyBank className="w-4 h-4 text-brand" /> Your Retirement Corpus</h3>
                <p className="text-[11px] text-slate-400 mb-4">Add all sources of money you will have at retirement</p>
                <div className="space-y-3">
                  {corpusSources.map(src => (
                    <div key={src.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex-1 space-y-2">
                        <select value={src.type} onChange={e => { const t = e.target.value as CorpusSourceType; const l = SOURCE_TYPE_OPTIONS.find(o => o.key === t)?.label ?? 'Other'; setCorpusSources(prev => prev.map(s => s.id === src.id ? { ...s, type: t, label: l } : s)); }} className="w-full px-2 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700">
                          {SOURCE_TYPE_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                        <input type="text" value={src.label} onChange={e => setCorpusSources(prev => prev.map(s => s.id === src.id ? { ...s, label: e.target.value } : s))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600" placeholder="Label" />
                        <NumberInput label="" value={src.amount} onChange={v => setCorpusSources(prev => prev.map(s => s.id === src.id ? { ...s, amount: v } : s))} prefix="Rs." step={100000} min={0} max={100000000} />
                      </div>
                      <button onClick={() => setCorpusSources(prev => prev.filter(s => s.id !== src.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addCorpusSource('other')} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Source</button>
                <div className="mt-4 px-3 py-2.5 rounded-lg bg-emerald-100 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700">Total Retirement Corpus</span>
                    <span className="text-sm font-bold text-emerald-800">Rs. {fmtLakhs(totalCorpus)}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Regular Income */}
              <div className="border-t-4 border-teal-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Wallet className="w-4 h-4 text-teal-600" /> Regular Income</h3>
                <p className="text-[11px] text-slate-400 mb-4">Monthly income you will receive after retirement</p>
                <div className="space-y-3">
                  {incomes.map(inc => (
                    <div key={inc.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex-1 space-y-2">
                        <select value={inc.type} onChange={e => { const t = e.target.value as IncomeType; const l = INCOME_TYPE_OPTIONS.find(o => o.key === t)?.label ?? 'Other'; setIncomes(prev => prev.map(i => i.id === inc.id ? { ...i, type: t, label: l } : i)); }} className="w-full px-2 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700">
                          {INCOME_TYPE_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                        <NumberInput label="Monthly Amount" value={inc.monthlyAmount} onChange={v => setIncomes(prev => prev.map(i => i.id === inc.id ? { ...i, monthlyAmount: v } : i))} prefix="Rs." step={1000} min={0} max={500000} />
                        {inc.type === 'rental' && <NumberInput label="Annual Growth" value={inc.growthRate ?? 0} onChange={v => setIncomes(prev => prev.map(i => i.id === inc.id ? { ...i, growthRate: v } : i))} suffix="%" step={0.5} min={0} max={15} />}
                      </div>
                      <button onClick={() => setIncomes(prev => prev.filter(i => i.id !== inc.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addIncome('other')} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Income</button>
                <div className="mt-4 px-3 py-2.5 rounded-lg bg-teal-100 border border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-700">Monthly Income</span>
                    <span className="text-sm font-bold text-teal-800">Rs. {formatNumber(totalMonthlyIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Lumpsum Events */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-amber-600" /> Lumpsum Events</h3>
                <p className="text-[11px] text-slate-400 mb-4">One-time investments or withdrawals during retirement</p>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => addLumpsum('investment')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Investment</button>
                  <button onClick={() => addLumpsum('withdrawal')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Withdrawal</button>
                </div>
                <div className="space-y-3">
                  {lumpsumEvents.map(ev => (
                    <div key={ev.id} className={cn('flex items-start gap-2 p-3 rounded-lg border', ev.type === 'investment' ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50')}>
                      <div className="flex-1 space-y-2">
                        <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase', ev.type === 'investment' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800')}>{ev.type === 'investment' ? 'Investment' : 'Withdrawal'}</span>
                        <input type="text" value={ev.label} onChange={e => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, label: e.target.value } : l))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600" placeholder="e.g., Property Sale" />
                        <NumberInput label="Amount" value={ev.amount} onChange={v => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, amount: v } : l))} prefix="Rs." step={100000} min={0} max={100000000} />
                        <NumberInput label="At Age" value={ev.atAge} onChange={v => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, atAge: v } : l))} suffix="years" step={1} min={currentAge} max={lifeExpectancy} />
                      </div>
                      <button onClick={() => setLumpsumEvents(prev => prev.filter(l => l.id !== ev.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                {lumpsumEvents.length > 0 && (
                  <div className={cn('mt-4 px-3 py-2.5 rounded-lg border', lumpsumNetImpact >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200')}>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-semibold', lumpsumNetImpact >= 0 ? 'text-emerald-700' : 'text-red-700')}>Net Impact</span>
                      <span className={cn('text-sm font-bold', lumpsumNetImpact >= 0 ? 'text-emerald-800' : 'text-red-800')}>Rs. {lumpsumNetImpact >= 0 ? '+' : ''}{fmtLakhs(lumpsumNetImpact)} {lumpsumNetImpact >= 0 ? 'inflow' : 'outflow'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Scenario Tuning */}
              <div className="border-t-4 border-slate-400 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-500" /> Scenario Tuning</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between cursor-pointer" onClick={handleOverrideToggle} role="button" tabIndex={0}>
                      <span className="text-[13px] font-semibold text-slate-600">Retirement HHE Override</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', overrideHHE ? 'bg-brand' : 'bg-slate-300')}><div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', overrideHHE ? 'translate-x-5' : 'translate-x-0.5')} /></div>
                    </div>
                    {overrideHHE ? <div className="mt-2"><NumberInput label="Monthly Expenses at Retirement" value={retirementHHE} onChange={setRetirementHHE} prefix="Rs." step={5000} min={10000} max={2000000} hint="Change this to run different scenarios. Default is inflation-adjusted." /></div> : <p className="text-[10px] text-slate-400 mt-1">Auto-calculated: Rs. {formatNumber(autoHHE)}/month at retirement</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setWantsLegacy(!wantsLegacy)} role="button" tabIndex={0}>
                      <span className="text-[13px] font-semibold text-slate-600">Leave Legacy</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', wantsLegacy ? 'bg-brand' : 'bg-slate-300')}><div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', wantsLegacy ? 'translate-x-5' : 'translate-x-0.5')} /></div>
                    </div>
                    {wantsLegacy && <div className="mt-2"><NumberInput label="Legacy Percentage" value={legacyPercent} onChange={setLegacyPercent} suffix="%" step={1} min={0} max={25} /><p className="text-[10px] text-slate-400 mt-1">Rs. {fmtLakhs(totalCorpus * legacyPercent / 100)} will be reserved for your nominee</p></div>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setCustomReturns(!customReturns)} role="button" tabIndex={0}>
                      <span className="text-[13px] font-semibold text-slate-600">Customize Returns</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', customReturns ? 'bg-brand' : 'bg-slate-300')}><div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', customReturns ? 'translate-x-5' : 'translate-x-0.5')} /></div>
                    </div>
                    {customReturns && <div className="mt-2 space-y-2"><NumberInput label="Liquid/FD Return" value={liquidReturn} onChange={setLiquidReturn} suffix="%" step={0.5} min={3} max={8} /><NumberInput label="Debt/Hybrid Return" value={debtReturn} onChange={setDebtReturn} suffix="%" step={0.5} min={5} max={10} /><NumberInput label="Balanced Return" value={balancedReturn} onChange={setBalancedReturn} suffix="%" step={0.5} min={7} max={14} /><NumberInput label="Equity Return" value={equityReturn} onChange={setEquityReturn} suffix="%" step={0.5} min={8} max={18} /></div>}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT PANEL ═══════ */}
            <div className="space-y-6">

              {/* ── PDF-Only: Comprehensive Input Summary (hidden on screen) ── */}
              <div className="hidden print:block" style={{ display: 'none' }} data-pdf-show>
                {/* Client Details */}
                <div className="card-base p-4 mb-4">
                  <h3 className="text-sm font-bold text-brand-700 mb-2 border-b border-brand-200 pb-1">CLIENT DETAILS</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <div><span className="text-slate-500">Name:</span> <span className="font-semibold">{clientName || 'N/A'}</span></div>
                    <div><span className="text-slate-500">Current Age:</span> <span className="font-semibold">{currentAge} years</span></div>
                    <div><span className="text-slate-500">Retirement Age:</span> <span className="font-semibold">{retirementAge} years</span></div>
                    <div><span className="text-slate-500">Life Expectancy:</span> <span className="font-semibold">{lifeExpectancy} years</span></div>
                    <div><span className="text-slate-500">Monthly HHE (Today):</span> <span className="font-semibold">Rs. {formatNumber(monthlyExpenses)}</span></div>
                    <div><span className="text-slate-500">Monthly HHE at Retirement:</span> <span className="font-semibold">Rs. {formatNumber(result.monthlyHHEAtRetirement)}</span></div>
                    <div><span className="text-slate-500">Inflation Rate:</span> <span className="font-semibold">{inflationRate}% p.a.</span></div>
                  </div>
                </div>

                {/* Retirement Corpus Sources */}
                <div className="card-base p-4 mb-4">
                  <h3 className="text-sm font-bold text-brand-700 mb-2 border-b border-brand-200 pb-1">RETIREMENT CORPUS SOURCES</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-500 border-b"><th className="text-left py-1">Source</th><th className="text-left py-1">Type</th><th className="text-right py-1">Amount</th></tr></thead>
                    <tbody>
                      {corpusSources.map(s => (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-1 font-medium">{s.label}</td>
                          <td className="py-1 text-slate-500 uppercase text-[10px]">{s.type.replace('_', ' ')}</td>
                          <td className="py-1 text-right font-semibold">Rs. {formatNumber(s.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold">
                        <td className="py-1.5" colSpan={2}>Total Retirement Corpus</td>
                        <td className="py-1.5 text-right text-emerald-700">Rs. {formatNumber(totalCorpus)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Regular Income Sources */}
                {incomes.length > 0 && (
                  <div className="card-base p-4 mb-4">
                    <h3 className="text-sm font-bold text-brand-700 mb-2 border-b border-brand-200 pb-1">REGULAR INCOME SOURCES</h3>
                    <table className="w-full text-xs">
                      <thead><tr className="text-slate-500 border-b"><th className="text-left py-1">Source</th><th className="text-left py-1">Type</th><th className="text-right py-1">Monthly Amount</th><th className="text-right py-1">Growth</th></tr></thead>
                      <tbody>
                        {incomes.map(inc => (
                          <tr key={inc.id} className="border-b border-slate-100">
                            <td className="py-1 font-medium">{inc.label}</td>
                            <td className="py-1 text-slate-500 uppercase text-[10px]">{inc.type.replace('_', ' ')}</td>
                            <td className="py-1 text-right font-semibold">Rs. {formatNumber(inc.monthlyAmount)}</td>
                            <td className="py-1 text-right">{inc.growthRate ? `${inc.growthRate}% p.a.` : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-teal-50 font-bold">
                          <td className="py-1.5" colSpan={3}>Total Monthly Income</td>
                          <td className="py-1.5 text-right text-teal-700">Rs. {formatNumber(result.totalMonthlyIncome)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Lumpsum Events */}
                {lumpsumEvents.length > 0 && (
                  <div className="card-base p-4 mb-4">
                    <h3 className="text-sm font-bold text-brand-700 mb-2 border-b border-brand-200 pb-1">LUMPSUM EVENTS</h3>
                    <table className="w-full text-xs">
                      <thead><tr className="text-slate-500 border-b"><th className="text-left py-1">Event</th><th className="text-left py-1">Type</th><th className="text-right py-1">Amount</th><th className="text-right py-1">At Age</th></tr></thead>
                      <tbody>
                        {lumpsumEvents.map(ev => (
                          <tr key={ev.id} className="border-b border-slate-100">
                            <td className="py-1 font-medium">{ev.label}</td>
                            <td className={cn('py-1 font-semibold text-[10px] uppercase', ev.type === 'investment' ? 'text-emerald-600' : 'text-red-600')}>
                              {ev.type === 'investment' ? 'INFLOW' : 'OUTFLOW'}
                            </td>
                            <td className="py-1 text-right font-semibold">Rs. {formatNumber(ev.amount)}</td>
                            <td className="py-1 text-right">{ev.atAge} years</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Return Assumptions */}
                <div className="card-base p-4 mb-4">
                  <h3 className="text-sm font-bold text-brand-700 mb-2 border-b border-brand-200 pb-1">ASSUMPTIONS & SETTINGS</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <div><span className="text-slate-500">Liquid Return (B0, B1):</span> <span className="font-semibold">{customReturns ? liquidReturn : 5}%</span></div>
                    <div><span className="text-slate-500">Debt Return (B2):</span> <span className="font-semibold">{customReturns ? debtReturn : 7}%</span></div>
                    <div><span className="text-slate-500">Balanced Return (B3):</span> <span className="font-semibold">{customReturns ? balancedReturn : 10}%</span></div>
                    <div><span className="text-slate-500">Equity Return (B4):</span> <span className="font-semibold">{customReturns ? equityReturn : 12}%</span></div>
                    <div><span className="text-slate-500">Legacy:</span> <span className="font-semibold">{wantsLegacy ? `${legacyPercent}% (Rs. ${fmtLakhs(totalCorpus * legacyPercent / 100)})` : 'None'}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard icon={<PiggyBank className="w-5 h-5" />} label="Total Corpus" value={`Rs. ${fmtLakhs(result.totalCorpus)}`} color="emerald" />
                <SummaryCard icon={<Wallet className="w-5 h-5" />} label="Monthly Income" value={`Rs. ${formatNumber(result.totalMonthlyIncome)}`} color="teal" />
                <SummaryCard icon={monthlyGap > 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />} label={monthlyGap > 0 ? 'Monthly Gap' : 'Monthly Surplus'} value={`Rs. ${formatNumber(Math.abs(monthlyGap))}`} color={monthlyGap > 0 ? 'red' : 'emerald'} />
                <SummaryCard icon={<ShieldCheck className="w-5 h-5" />} label="Bucket Duration" value={result.isSustainable ? 'Sustainable' : `Depletes at ${result.depletionAge ?? '?'}`} color={result.isSustainable ? 'emerald' : 'red'} />
              </div>

              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-3">Gap Analysis</h3>
                <div className="relative h-8 rounded-full overflow-hidden bg-slate-100">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, incomePercent)}%` }} />
                  {incomePercent < 100 && <div className="absolute inset-y-0 right-0 rounded-r-full bg-red-300" style={{ width: `${100 - Math.min(100, incomePercent)}%` }} />}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">{incomePercent}% covered by income</div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {incomePercent >= 100 ? `Your retirement income fully covers your expenses of Rs. ${formatNumber(result.monthlyHHEAtRetirement)}/month.` : `Your income covers ${incomePercent}% of retirement expenses. The remaining ${100 - incomePercent}% (Rs. ${formatNumber(Math.max(0, monthlyGap))}/month) will be funded from bucket withdrawals.`}
                </p>
              </div>

              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Bucket Distribution</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {result.buckets.map((bucket: BucketAllocation, idx: number) => {
                    const style = BUCKET_STYLES[idx] ?? BUCKET_STYLES[0];
                    return (
                      <div key={idx} className={cn('relative rounded-xl border-2 p-3', style.border, style.bg)}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: style.color }}>B{bucket.bucketNumber}</div>
                          <span className={cn('text-xs font-bold', style.text)}>{style.label}</span>
                        </div>
                        <div className={cn('text-lg font-extrabold mb-1', style.text)}>{bucket.amountInLakhs}</div>
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div>Return: {bucket.returnRate}% p.a.</div>
                          <div className="truncate">{bucket.products.slice(0, 2).join(', ')}</div>
                        </div>
                        {idx < 4 && <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 z-10"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg></div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Corpus Depletion Over Time</h3>
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtLakhs(v)} />
                        <Tooltip formatter={(v: number) => `Rs. ${fmtLakhs(v)}`} labelFormatter={(l: number) => `Age ${l}`} />
                        <Area type="monotone" dataKey="B4" stackId="1" fill={BUCKET_STYLES[4].fill} stroke={BUCKET_STYLES[4].fill} name="Equity" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="B3" stackId="1" fill={BUCKET_STYLES[3].fill} stroke={BUCKET_STYLES[3].fill} name="Growth" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="B2" stackId="1" fill={BUCKET_STYLES[2].fill} stroke={BUCKET_STYLES[2].fill} name="Medium" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="B1" stackId="1" fill={BUCKET_STYLES[1].fill} stroke={BUCKET_STYLES[1].fill} name="Short" fillOpacity={0.8} />
                        <Area type="monotone" dataKey="B0" stackId="1" fill={BUCKET_STYLES[0].fill} stroke={BUCKET_STYLES[0].fill} name="Emergency" fillOpacity={0.8} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="card-base overflow-hidden">
                <button onClick={() => setShowYearlyTable(!showYearlyTable)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors" data-pdf-hide>
                  <h3 className="font-bold text-slate-800">Year-by-Year Breakdown</h3>
                  {showYearlyTable ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                <h3 className="font-bold text-slate-800 px-5 pt-4 hidden" data-pdf-show>Year-by-Year Breakdown</h3>
                <div className="overflow-x-auto" style={showYearlyTable ? {} : { maxHeight: 0, overflow: 'hidden' }} data-pdf-show={!showYearlyTable ? '' : undefined}>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold">
                          <th className="px-2 py-2 text-left">Yr</th><th className="px-2 py-2 text-left">Age</th><th className="px-2 py-2 text-right">Mo. Expense</th><th className="px-2 py-2 text-right">Mo. Income</th><th className="px-2 py-2 text-right">Mo. Gap</th><th className="px-2 py-2 text-right">Ann. Withdrawal</th><th className="px-2 py-2 text-center">Active</th><th className="px-2 py-2 text-right text-emerald-600">B0</th><th className="px-2 py-2 text-right text-teal-600">B1</th><th className="px-2 py-2 text-right text-amber-600">B2</th><th className="px-2 py-2 text-right text-purple-600">B3</th><th className="px-2 py-2 text-right text-red-600">B4</th><th className="px-2 py-2 text-right">Total</th><th className="px-2 py-2 text-left">Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearlyBreakdown.map((row: YearlyBreakdown, idx: number) => (
                          <tr key={idx} className={cn('border-t border-slate-100', idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                            <td className="px-2 py-1.5">{row.year}</td>
                            <td className="px-2 py-1.5 font-semibold">{row.age}</td>
                            <td className="px-2 py-1.5 text-right">{formatNumber(row.monthlyExpense)}</td>
                            <td className="px-2 py-1.5 text-right text-emerald-600">{formatNumber(row.monthlyIncome)}</td>
                            <td className={cn('px-2 py-1.5 text-right font-semibold', row.monthlyGap > 0 ? 'text-red-600' : 'text-emerald-600')}>{formatNumber(Math.abs(row.monthlyGap))}</td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.annualGapWithdrawal)}</td>
                            <td className="px-2 py-1.5 text-center"><span className="text-[9px] font-bold">{row.activeBucket}</span></td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.bucket0)}</td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.bucket1)}</td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.bucket2)}</td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.bucket3)}</td>
                            <td className="px-2 py-1.5 text-right">{fmtLakhs(row.bucket4)}</td>
                            <td className="px-2 py-1.5 text-right font-semibold">{fmtLakhs(row.totalCorpus)}</td>
                            <td className="px-2 py-1.5 text-[10px] text-slate-400 max-w-[120px] truncate">{[row.lumpsumEvent, row.refillEvent].filter(Boolean).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

              {result.insights.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">CFP Insights</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.insights.map((insight: BucketInsight, idx: number) => { const s = INSIGHT_STYLES[insight.type]; return (
                      <div key={idx} className={cn('rounded-xl border p-4', s.bg, s.border)}>
                        <div className={cn('text-sm font-bold mb-1', s.text)}>{insight.title}</div>
                        <div className={cn('text-xs', s.text, 'opacity-80')}>{insight.description}</div>
                      </div>
                    ); })}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {DISCLAIMER.mutual_fund} This calculator is for educational purposes only and does not constitute financial advice. The bucket strategy is a framework -- actual implementation should consider tax implications, rebalancing costs, and individual risk tolerance. Consult a SEBI-registered investment advisor or CFP for personalised advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
