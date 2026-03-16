'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, Sprout, Wallet, Lightbulb, Plus, Trash2,
  ArrowUpCircle, ArrowDownCircle, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  calculateLifeline, LifelineEvent, LifelineEventType,
} from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

/* ── Color Palette ── */
const EVENT_STYLES: Record<LifelineEventType, {
  label: string; icon: typeof TrendingUp; bg: string; border: string; badge: string; text: string; marker: string;
}> = {
  sip: { label: 'SIP', icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', marker: '#10B981' },
  lumpsum_invest: { label: 'Lump Sum Invest', icon: ArrowUpCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', marker: '#059669' },
  swp: { label: 'SWP', icon: Wallet, bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700', marker: '#D97706' },
  lumpsum_withdraw: { label: 'Lump Sum Withdraw', icon: ArrowDownCircle, bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700', marker: '#EF4444' },
};

const MAX_EVENTS = 15;

/* ── Default Events (pre-populated so user sees results immediately) ── */
const DEFAULT_EVENTS: LifelineEvent[] = [
  {
    id: 1, type: 'sip', startYear: 1, label: 'Monthly SIP',
    monthlyAmount: 15000, duration: 15, stepUpEnabled: false, stepUpType: 'percentage', stepUpValue: 10,
  },
];

export default function LifelineCalculatorPage() {
  // Personalization
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  // Base settings
  const [startingCorpus, setStartingCorpus] = useState(0);
  const [returnRate, setReturnRate] = useState(12);
  const [planningHorizon, setPlanningHorizon] = useState(30);

  // Life events
  const [events, setEvents] = useState<LifelineEvent[]>(DEFAULT_EVENTS);
  const [nextEventId, setNextEventId] = useState(2);

  /* ── Event Management ── */
  const addEvent = (type: LifelineEventType) => {
    if (events.length >= MAX_EVENTS) return;
    const defaults: Record<LifelineEventType, Partial<LifelineEvent>> = {
      sip: { monthlyAmount: 10000, duration: 5, startYear: 1, stepUpEnabled: false, stepUpType: 'percentage', stepUpValue: 10 },
      lumpsum_invest: { amount: 500000, startYear: 1 },
      swp: { withdrawalAmount: 50000, duration: 10, startYear: Math.min(16, planningHorizon), returnRate: returnRate, incrementEnabled: false, incrementType: 'percentage', incrementValue: 5 },
      lumpsum_withdraw: { amount: 500000, startYear: 5 },
    };
    setEvents([...events, { id: nextEventId, type, label: '', ...defaults[type] } as LifelineEvent]);
    setNextEventId(nextEventId + 1);
  };

  const removeEvent = (id: number) => setEvents(events.filter((e) => e.id !== id));

  const updateEvent = (id: number, updates: Partial<LifelineEvent>) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  /* ── Calculation ── */
  const result = useMemo(
    () => calculateLifeline(startingCorpus, returnRate, planningHorizon, events),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startingCorpus, returnRate, planningHorizon, JSON.stringify(events)]
  );

  /* ── Chart Data ── */
  const chartData = result.yearlyData.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year - 1}` : `Yr ${row.year}`,
    yearNum: row.year,
    corpus: row.closingCorpus,
    netInvested: row.totalInvested - row.totalWithdrawn,
  }));

  // Collect event start years for reference lines
  const eventMarkers = events.map((ev) => ({
    year: ev.startYear,
    type: ev.type,
    label: ev.label || EVENT_STYLES[ev.type].label,
  }));

  /* ── Year options for dropdowns ── */
  const yearOptions = Array.from({ length: planningHorizon }, (_, i) => i + 1);

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
              <Activity className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">CFP-Style Planner</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Lifeline Financial Planner</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Plan your complete financial lifeline &mdash; add SIPs, lump sums, withdrawals at any year. Like a CFP does.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">

            {/* ══════════════════ INPUT PANEL ══════════════════ */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-5 text-lg">Configure Your Lifeline</h2>

              <PersonalInfoBar
                name={investorName} onNameChange={setInvestorName}
                age={investorAge} onAgeChange={setInvestorAge}
                ageLabel="Current Age" namePlaceholder="e.g., Aryan"
              />

              {/* ── Base Settings ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Base Settings</div>
                <div className="space-y-4">
                  <NumberInput label="Starting Corpus" value={startingCorpus} onChange={setStartingCorpus} prefix="₹" step={100000} min={0} max={10000000} hint="Existing investments (optional)" />
                  <NumberInput label="Expected Return Rate" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={25} />
                  <NumberInput label="Planning Horizon" value={planningHorizon} onChange={setPlanningHorizon} suffix="Years" step={1} min={1} max={60} />
                </div>
              </div>

              {/* ── Life Events ── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Life Events</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    events.length >= MAX_EVENTS ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
                  )}>
                    {events.length}/{MAX_EVENTS}
                  </span>
                </div>

                {/* Event Cards */}
                <div className="space-y-3">
                  {events.map((ev) => {
                    const style = EVENT_STYLES[ev.type];
                    const Icon = style.icon;
                    const maxDuration = planningHorizon - ev.startYear + 1;

                    return (
                      <div key={ev.id} className={cn('rounded-xl border p-3 sm:p-4 transition-all', style.border, style.bg)}>
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', style.badge)}>
                              <Icon className="w-3 h-3" /> {style.label}
                            </span>
                          </div>
                          <button onClick={() => removeEvent(ev.id)} className="p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" title="Remove">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Label Input */}
                        <input
                          type="text" placeholder="Label (e.g., Job SIP, House)" value={ev.label || ''}
                          onChange={(e) => updateEvent(ev.id, { label: e.target.value })}
                          className="w-full text-xs bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-3 outline-none focus:ring-1 focus:ring-brand-300 placeholder:text-slate-400"
                        />

                        {/* Year Selector */}
                        <div className="mb-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {ev.type === 'sip' || ev.type === 'swp' ? 'Start Year' : 'Year'}
                          </label>
                          <select
                            value={ev.startYear}
                            onChange={(e) => updateEvent(ev.id, { startYear: Number(e.target.value) })}
                            className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-brand-300"
                          >
                            {yearOptions.map((yr) => (
                              <option key={yr} value={yr}>
                                Year {yr}{investorAge !== null ? ` (Age ${investorAge + yr - 1})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* ── SIP Fields ── */}
                        {ev.type === 'sip' && (
                          <div className="space-y-3">
                            <NumberInput label="Monthly SIP" value={ev.monthlyAmount ?? 10000} onChange={(v) => updateEvent(ev.id, { monthlyAmount: v })} prefix="₹" step={500} min={500} max={500000} />
                            <NumberInput label="Duration" value={Math.min(ev.duration ?? 5, maxDuration)} onChange={(v) => updateEvent(ev.id, { duration: v })} suffix="Years" step={1} min={1} max={maxDuration} />

                            {/* Step-Up Toggle */}
                            <div className="pt-2 border-t border-emerald-200">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-600">Annual Step-Up</label>
                                <button
                                  role="switch" aria-checked={ev.stepUpEnabled}
                                  onClick={() => updateEvent(ev.id, { stepUpEnabled: !ev.stepUpEnabled })}
                                  className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', ev.stepUpEnabled ? 'bg-emerald-500' : 'bg-slate-300')}
                                >
                                  <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', ev.stepUpEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                                </button>
                              </div>
                              {ev.stepUpEnabled && (
                                <div className="space-y-2 mt-2 animate-in">
                                  <div className="flex gap-2">
                                    <button onClick={() => updateEvent(ev.id, { stepUpType: 'percentage' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.stepUpType === 'percentage' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300')}>+%</button>
                                    <button onClick={() => updateEvent(ev.id, { stepUpType: 'amount' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.stepUpType === 'amount' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300')}>+₹</button>
                                  </div>
                                  <NumberInput
                                    label={ev.stepUpType === 'percentage' ? 'Annual Increase' : 'Annual Increase Amount'}
                                    value={ev.stepUpValue ?? 10}
                                    onChange={(v) => updateEvent(ev.id, { stepUpValue: v })}
                                    prefix={ev.stepUpType === 'amount' ? '₹' : undefined}
                                    suffix={ev.stepUpType === 'percentage' ? '%' : undefined}
                                    step={ev.stepUpType === 'percentage' ? 1 : 500}
                                    min={ev.stepUpType === 'percentage' ? 1 : 500}
                                    max={ev.stepUpType === 'percentage' ? 50 : 50000}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Lump Sum Invest Fields ── */}
                        {ev.type === 'lumpsum_invest' && (
                          <NumberInput label="Investment Amount" value={ev.amount ?? 500000} onChange={(v) => updateEvent(ev.id, { amount: v })} prefix="₹" step={50000} min={10000} max={10000000} />
                        )}

                        {/* ── SWP Fields ── */}
                        {ev.type === 'swp' && (
                          <div className="space-y-3">
                            <NumberInput label="Monthly Withdrawal" value={ev.withdrawalAmount ?? 50000} onChange={(v) => updateEvent(ev.id, { withdrawalAmount: v })} prefix="₹" step={5000} min={1000} max={5000000} />
                            <NumberInput label="Duration" value={Math.min(ev.duration ?? 10, maxDuration)} onChange={(v) => updateEvent(ev.id, { duration: v })} suffix="Years" step={1} min={1} max={maxDuration} />
                            <NumberInput label="Portfolio Return During SWP" value={ev.returnRate ?? returnRate} onChange={(v) => updateEvent(ev.id, { returnRate: v })} suffix="% p.a." step={0.5} min={1} max={25} hint="Typically lower during withdrawal phase" />

                            {/* Increment Toggle */}
                            <div className="pt-2 border-t border-amber-200">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-600">Annual Increment</label>
                                <button
                                  role="switch" aria-checked={ev.incrementEnabled}
                                  onClick={() => updateEvent(ev.id, { incrementEnabled: !ev.incrementEnabled })}
                                  className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', ev.incrementEnabled ? 'bg-amber-500' : 'bg-slate-300')}
                                >
                                  <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', ev.incrementEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                                </button>
                              </div>
                              {ev.incrementEnabled && (
                                <div className="space-y-2 mt-2 animate-in">
                                  <div className="flex gap-2">
                                    <button onClick={() => updateEvent(ev.id, { incrementType: 'percentage' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.incrementType === 'percentage' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300')}>+%</button>
                                    <button onClick={() => updateEvent(ev.id, { incrementType: 'amount' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.incrementType === 'amount' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300')}>+₹</button>
                                  </div>
                                  <NumberInput
                                    label={ev.incrementType === 'percentage' ? 'Annual Increase' : 'Annual Increase Amount'}
                                    value={ev.incrementValue ?? 5}
                                    onChange={(v) => updateEvent(ev.id, { incrementValue: v })}
                                    prefix={ev.incrementType === 'amount' ? '₹' : undefined}
                                    suffix={ev.incrementType === 'percentage' ? '%' : undefined}
                                    step={ev.incrementType === 'percentage' ? 1 : 1000}
                                    min={ev.incrementType === 'percentage' ? 1 : 1000}
                                    max={ev.incrementType === 'percentage' ? 30 : 50000}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Lump Sum Withdraw Fields ── */}
                        {ev.type === 'lumpsum_withdraw' && (
                          <NumberInput label="Withdrawal Amount" value={ev.amount ?? 500000} onChange={(v) => updateEvent(ev.id, { amount: v })} prefix="₹" step={50000} min={10000} max={10000000} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Event Buttons */}
                {events.length < MAX_EVENTS && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => addEvent('sip')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> SIP
                    </button>
                    <button onClick={() => addEvent('lumpsum_invest')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Lump Sum Invest
                    </button>
                    <button onClick={() => addEvent('swp')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> SWP
                    </button>
                    <button onClick={() => addEvent('lumpsum_withdraw')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Lump Sum Withdraw
                    </button>
                  </div>
                )}
              </div>

              {/* Journey Summary */}
              <div className="bg-gradient-to-r from-emerald-50 via-brand-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {investorName ? `${investorName}'s Lifeline` : 'Financial Lifeline'}
                </div>
                <div className="text-2xl font-extrabold gradient-text">{planningHorizon} Years</div>
                {investorAge !== null && (
                  <div className="text-xs text-slate-500 mt-1">Age {investorAge} &rarr; {investorAge + planningHorizon - 1}</div>
                )}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {events.filter((e) => e.type === 'sip' || e.type === 'lumpsum_invest').length} investments</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {events.filter((e) => e.type === 'swp' || e.type === 'lumpsum_withdraw').length} withdrawals</span>
                </div>
              </div>
            </div>

            {/* ══════════════════ RESULTS PANEL ══════════════════ */}
            <div className="space-y-8">

              {/* Personalized Header */}
              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-emerald-50 via-brand-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}'s` : 'Your'} Financial Lifeline
                  </h3>
                  {investorAge !== null && (
                    <p className="text-sm text-slate-500 mt-1">
                      Age <span className="font-semibold text-brand-700">{investorAge}</span> &rarr; <span className="font-semibold text-brand-700">{investorAge + planningHorizon - 1}</span>
                      {' '}&middot; {planningHorizon} Years &middot; {events.length} Events
                    </p>
                  )}
                </div>
              )}

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="card-base p-4 sm:p-5 border-t-4 border-emerald-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Invested</div>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">{formatINR(result.totalInvested)}</div>
                </div>
                <div className="card-base p-4 sm:p-5 border-t-4 border-amber-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Withdrawn</div>
                  <div className="text-base sm:text-lg font-extrabold text-amber-700 mt-1">{formatINR(result.totalWithdrawn)}</div>
                </div>
                <div className="card-base p-4 sm:p-5 border-t-4 border-brand-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Corpus</div>
                  <div className={cn('text-base sm:text-lg font-extrabold mt-1', result.finalCorpus > 0 ? 'text-brand-700' : 'text-red-600')}>{formatINR(result.finalCorpus)}</div>
                  {result.peakCorpusYear > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Peak: {formatINR(result.peakCorpus)} (Yr {result.peakCorpusYear}{investorAge !== null ? `, Age ${investorAge + result.peakCorpusYear - 1}` : ''})
                    </div>
                  )}
                </div>
                <div className="card-base p-4 sm:p-5 border-t-4 border-teal-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Returns</div>
                  <div className={cn('text-base sm:text-lg font-extrabold mt-1', result.totalReturns >= 0 ? 'text-teal-700' : 'text-red-600')}>{formatINR(result.totalReturns)}</div>
                  {result.effectiveReturn > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">CAGR: {result.effectiveReturn}%</div>
                  )}
                  <DownloadPDFButton elementId="calculator-results" title="Lifeline Financial Planner" fileName="lifeline-planner" />
                </div>
              </div>

              {/* Key Insight */}
              <div className={cn(
                'card-base p-5 border',
                result.corpusDepletedYear !== null
                  ? 'bg-gradient-to-r from-red-50 to-amber-50 border-red-200'
                  : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-brand-50 border-teal-200'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    result.corpusDepletedYear !== null ? 'bg-red-100' : 'bg-teal-100'
                  )}>
                    <Lightbulb className={cn('w-5 h-5', result.corpusDepletedYear !== null ? 'text-red-600' : 'text-teal-600')} />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.corpusDepletedYear !== null ? (
                        <>
                          Your corpus gets <span className="font-semibold text-red-600">depleted in Year {result.corpusDepletedYear}</span>
                          {investorAge !== null && <> (Age {investorAge + result.corpusDepletedYear - 1})</>}.
                          {' '}The peak corpus was <span className="font-semibold text-teal-700">{formatINR(result.peakCorpus)}</span> in Year {result.peakCorpusYear}.
                          {' '}Consider increasing your SIP amounts, adding more investment years, or reducing withdrawal amounts to sustain your corpus through the full {planningHorizon}-year horizon.
                        </>
                      ) : (
                        <>
                          Over {planningHorizon} years{investorAge !== null && <> (age {investorAge} to {investorAge + planningHorizon - 1})</>},
                          {' '}you invest <span className="font-semibold text-emerald-700">{formatINR(result.totalInvested)}</span>,
                          {' '}withdraw <span className="font-semibold text-amber-700">{formatINR(result.totalWithdrawn)}</span>,
                          {' '}and still have <span className="font-semibold text-brand-700">{formatINR(result.finalCorpus)}</span> remaining.
                          {' '}Your peak corpus of <span className="font-semibold text-teal-700">{formatINR(result.peakCorpus)}</span> was reached in Year {result.peakCorpusYear}
                          {investorAge !== null && <> (Age {investorAge + result.peakCorpusYear})</>}.
                          {' '}That&apos;s the power of planned investing!
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Timeline Chart ── */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Growth Timeline</h3>
                <p className="text-sm text-slate-500 mb-6">Your wealth trajectory across all life events</p>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-600">Corpus</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-brand-400 opacity-50" />
                    <span className="text-slate-600">Net Invested</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-3 bg-emerald-400" />
                    <span className="text-slate-600">Investment Event</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-3 bg-amber-500" />
                    <span className="text-slate-600">Withdrawal Event</span>
                  </div>
                </div>
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lifelineCorpusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={planningHorizon > 30 ? 4 : planningHorizon > 15 ? 2 : 0} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name === 'corpus' ? 'Corpus' : 'Net Invested']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />

                      {/* Event markers */}
                      {eventMarkers.map((m, idx) => (
                        <ReferenceLine
                          key={`marker-${idx}`}
                          x={investorAge !== null ? `Age ${investorAge + m.year - 1}` : `Yr ${m.year}`}
                          stroke={m.type === 'sip' || m.type === 'lumpsum_invest' ? '#10B981' : '#D97706'}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                      ))}

                      <Area type="monotone" dataKey="netInvested" stroke="#0F766E" fill="none" strokeWidth={1.5} strokeDasharray="6 3" name="netInvested" />
                      <Area type="monotone" dataKey="corpus" stroke="#059669" fill="url(#lifelineCorpusGrad)" strokeWidth={2.5} name="corpus" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Event Timeline Visual ── */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Event Timeline</h3>
                <p className="text-sm text-slate-500 mb-4">When each event is active during your planning horizon</p>
                <div className="space-y-2">
                  {events.map((ev) => {
                    const style = EVENT_STYLES[ev.type];
                    const Icon = style.icon;
                    const startPct = ((ev.startYear - 1) / planningHorizon) * 100;
                    const durationYrs = (ev.type === 'sip' || ev.type === 'swp') ? (ev.duration ?? 1) : 1;
                    const widthPct = Math.max((durationYrs / planningHorizon) * 100, 2);
                    const isInvest = ev.type === 'sip' || ev.type === 'lumpsum_invest';

                    return (
                      <div key={ev.id} className="flex items-center gap-3">
                        <div className="w-24 sm:w-32 shrink-0 text-right">
                          <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold', style.text)}>
                            <Icon className="w-3 h-3" /> {ev.label || style.label}
                          </span>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                          <div
                            className={cn('absolute top-0 h-full rounded-full flex items-center justify-center text-[9px] font-bold text-white', isInvest ? 'bg-emerald-500' : 'bg-amber-500')}
                            style={{ left: `${startPct}%`, width: `${widthPct}%`, minWidth: '20px' }}
                          >
                            {durationYrs > 2 && `${durationYrs}y`}
                          </div>
                        </div>
                        <div className="w-12 shrink-0 text-[10px] text-slate-400 text-right">
                          Yr {ev.startYear}
                          {durationYrs > 1 && `-${ev.startYear + durationYrs - 1}`}
                        </div>
                      </div>
                    );
                  })}
                  {/* Axis labels */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-24 sm:w-32 shrink-0" />
                    <div className="flex-1 flex justify-between text-[9px] text-slate-400 px-1">
                      <span>{investorAge !== null ? `Age ${investorAge}` : 'Yr 1'}</span>
                      <span>{investorAge !== null ? `Age ${investorAge + Math.ceil(planningHorizon / 2) - 1}` : `Yr ${Math.ceil(planningHorizon / 2)}`}</span>
                      <span>{investorAge !== null ? `Age ${investorAge + planningHorizon - 1}` : `Yr ${planningHorizon}`}</span>
                    </div>
                    <div className="w-12 shrink-0" />
                  </div>
                </div>
              </div>

              {/* ── Year-by-Year Table ── */}
              <div className="card-base overflow-hidden" data-pdf-hide>
                <div className="p-5 sm:p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Complete financial flow across your entire lifeline</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Opening</th>
                        <th className="text-right py-3 px-2 font-semibold text-emerald-600 text-xs uppercase tracking-wider">SIP In</th>
                        <th className="text-right py-3 px-2 font-semibold text-emerald-600 text-xs uppercase tracking-wider">Lump In</th>
                        <th className="text-right py-3 px-2 font-semibold text-amber-600 text-xs uppercase tracking-wider">SWP Out</th>
                        <th className="text-right py-3 px-2 font-semibold text-amber-600 text-xs uppercase tracking-wider">Lump Out</th>
                        <th className="text-right py-3 px-2 font-semibold text-teal-600 text-xs uppercase tracking-wider">Interest</th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => {
                        const hasActivity = row.sipInflows > 0 || row.lumpsumInflows > 0 || row.swpOutflows > 0 || row.lumpsumOutflows > 0;
                        return (
                          <tr key={row.year} className={cn(
                            'border-b border-surface-200 transition-colors',
                            row.corpusDepleted ? 'bg-red-50/50' : hasActivity ? 'hover:bg-surface-100/50' : 'hover:bg-surface-100/30 opacity-70'
                          )}>
                            <td className="py-2.5 px-3 font-medium text-primary-700 whitespace-nowrap">
                              Yr {row.year}
                              {investorAge !== null && <span className="text-slate-400 font-normal text-xs ml-1">(Age {investorAge + row.year - 1})</span>}
                            </td>
                            <td className="py-2.5 px-2 text-right text-slate-600">{formatINR(row.openingCorpus)}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-700 font-medium">{row.sipInflows > 0 ? formatINR(row.sipInflows) : '---'}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-700 font-medium">{row.lumpsumInflows > 0 ? formatINR(row.lumpsumInflows) : '---'}</td>
                            <td className="py-2.5 px-2 text-right text-amber-700 font-medium">{row.swpOutflows > 0 ? formatINR(row.swpOutflows) : '---'}</td>
                            <td className="py-2.5 px-2 text-right text-amber-700 font-medium">{row.lumpsumOutflows > 0 ? formatINR(row.lumpsumOutflows) : '---'}</td>
                            <td className="py-2.5 px-2 text-right text-teal-600">{formatINR(row.interestEarned)}</td>
                            <td className={cn('py-2.5 px-3 text-right font-semibold', row.corpusDepleted ? 'text-red-600' : 'text-primary-700')}>{formatINR(row.closingCorpus)}</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-surface-100 border-t-2 border-surface-300 font-bold">
                        <td className="py-3 px-3 text-primary-700">Total</td>
                        <td className="py-3 px-2" />
                        <td className="py-3 px-2 text-right text-emerald-700">{formatINR(result.yearlyData.reduce((s, r) => s + r.sipInflows, 0))}</td>
                        <td className="py-3 px-2 text-right text-emerald-700">{formatINR(result.yearlyData.reduce((s, r) => s + r.lumpsumInflows, 0))}</td>
                        <td className="py-3 px-2 text-right text-amber-700">{formatINR(result.yearlyData.reduce((s, r) => s + r.swpOutflows, 0))}</td>
                        <td className="py-3 px-2 text-right text-amber-700">{formatINR(result.yearlyData.reduce((s, r) => s + r.lumpsumOutflows, 0))}</td>
                        <td className="py-3 px-2 text-right text-teal-600">{formatINR(result.yearlyData.reduce((s, r) => s + r.interestEarned, 0))}</td>
                        <td className={cn('py-3 px-3 text-right', result.finalCorpus > 0 ? 'text-primary-700' : 'text-red-600')}>{formatINR(result.finalCorpus)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="sm:hidden px-4 pb-4 space-y-3">
                  {result.yearlyData.map((row) => {
                    const hasActivity = row.sipInflows > 0 || row.lumpsumInflows > 0 || row.swpOutflows > 0 || row.lumpsumOutflows > 0;
                    if (!hasActivity && row.interestEarned === 0) return null; // Skip blank years on mobile for brevity

                    return (
                      <div key={row.year} className={cn('rounded-xl border p-3', row.corpusDepleted ? 'border-red-200 bg-red-50/50' : 'border-surface-300/50 bg-white')}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-primary-700 text-sm">
                            Year {row.year}
                            {investorAge !== null && <span className="text-slate-400 font-normal text-xs ml-1">(Age {investorAge + row.year - 1})</span>}
                          </span>
                          <span className={cn('font-bold text-sm', row.corpusDepleted ? 'text-red-600' : 'text-primary-700')}>
                            {formatINR(row.closingCorpus)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {row.sipInflows > 0 && (
                            <>
                              <span className="text-slate-500">SIP In</span>
                              <span className="text-right text-emerald-700 font-medium">{formatINR(row.sipInflows)}</span>
                            </>
                          )}
                          {row.lumpsumInflows > 0 && (
                            <>
                              <span className="text-slate-500">Lump In</span>
                              <span className="text-right text-emerald-700 font-medium">{formatINR(row.lumpsumInflows)}</span>
                            </>
                          )}
                          {row.swpOutflows > 0 && (
                            <>
                              <span className="text-slate-500">SWP Out</span>
                              <span className="text-right text-amber-700 font-medium">{formatINR(row.swpOutflows)}</span>
                            </>
                          )}
                          {row.lumpsumOutflows > 0 && (
                            <>
                              <span className="text-slate-500">Lump Out</span>
                              <span className="text-right text-amber-700 font-medium">{formatINR(row.lumpsumOutflows)}</span>
                            </>
                          )}
                          <span className="text-slate-500">Interest</span>
                          <span className="text-right text-teal-600 font-medium">{formatINR(row.interestEarned)}</span>
                        </div>
                        {row.activeEvents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {row.activeEvents.map((label, i) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{label}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Net Flow Summary */}
              <div className="card-base p-5 sm:p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-3">Net Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Invested</div>
                    <div className="font-extrabold text-primary-700">{formatINR(result.netInvested)}</div>
                    <div className="text-[10px] text-slate-400">Invested - Withdrawn</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Wealth Generated</div>
                    <div className={cn('font-extrabold', result.totalReturns >= 0 ? 'text-teal-700' : 'text-red-600')}>{formatINR(result.totalReturns)}</div>
                    <div className="text-[10px] text-slate-400">Final Corpus - Net Invested</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Wealth Multiplier</div>
                    <div className="font-extrabold text-brand-700">
                      {result.netInvested > 0 ? (result.finalCorpus / result.netInvested).toFixed(1) : '0'}x
                    </div>
                    <div className="text-[10px] text-slate-400">Final / Net Invested</div>
                  </div>
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
