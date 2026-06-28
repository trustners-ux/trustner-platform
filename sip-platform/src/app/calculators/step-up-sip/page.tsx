'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, Zap, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine,
} from 'recharts';
import {
  calculateStepUpSIP, calculateSIP, calculateSIPBreakdown, calculateStepUpSIPWithGrowth,
  calculateLifeline, LifelineEvent, LifelineEventType,
} from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

/* ── Event chip styles (matches Lifeline calculator) ── */
const EVENT_STYLES: Record<LifelineEventType, { label: string; icon: typeof TrendingUp; bg: string; border: string; badge: string; text: string }> = {
  sip:              { label: 'Extra SIP',          icon: TrendingUp,     bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  lumpsum_invest:   { label: 'Lump Sum Invest',    icon: ArrowUpCircle,  bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  swp:              { label: 'SWP',                icon: Wallet,         bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',     text: 'text-amber-700' },
  lumpsum_withdraw: { label: 'Lump Sum Withdraw',  icon: ArrowDownCircle, bg: 'bg-amber-50',  border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',     text: 'text-amber-700' },
};

const MAX_EVENTS = 8;

const COLORS = {
  regular: '#0F766E',
  stepUp: '#D4A017',
  invested: '#64748B',
  returns: '#E8553A',
  growth: '#D97706',
};

export default function StepUpSIPCalculatorPage() {
  const [initialMonthly, setInitialMonthly] = useState(10000);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'amount'>('percentage');
  const [stepUpPercent, setStepUpPercent] = useState(10);     // value when stepUpType === 'percentage'
  const [stepUpAmount, setStepUpAmount] = useState(2000);     // value when stepUpType === 'amount' (₹ per year)
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(20);
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  // Hybrid mode state
  const [hybridEnabled, setHybridEnabled] = useState(false);
  const [sipYears, setSipYears] = useState(10);
  const [totalYears, setTotalYears] = useState(20);

  // Optional add-on events (Lifeline-style)
  const [events, setEvents] = useState<LifelineEvent[]>([]);
  const [nextEventId, setNextEventId] = useState(1);

  // The current step-up value depending on mode
  const activeStepUpValue = stepUpType === 'percentage' ? stepUpPercent : stepUpAmount;

  // Ensure totalYears is always >= sipYears
  const handleSipYearsChange = (val: number) => {
    setSipYears(val);
    if (totalYears < val) {
      setTotalYears(val);
    }
  };

  const handleTotalYearsChange = (val: number) => {
    setTotalYears(Math.max(val, sipYears));
  };

  // Standard mode calculations
  const stepUpResult = useMemo(
    () => calculateStepUpSIP(initialMonthly, activeStepUpValue, returnRate, years, stepUpType),
    [initialMonthly, activeStepUpValue, returnRate, years, stepUpType]
  );

  const regularResult = useMemo(
    () => calculateSIP(initialMonthly, returnRate, years),
    [initialMonthly, returnRate, years]
  );

  const regularBreakdown = useMemo(
    () => calculateSIPBreakdown(initialMonthly, returnRate, years),
    [initialMonthly, returnRate, years]
  );

  // Hybrid mode calculations
  const hybridStepUpResult = useMemo(
    () => calculateStepUpSIPWithGrowth(initialMonthly, activeStepUpValue, returnRate, sipYears, totalYears, stepUpType),
    [initialMonthly, activeStepUpValue, returnRate, sipYears, totalYears, stepUpType]
  );

  const hybridRegularResult = useMemo(
    () => calculateSIP(initialMonthly, returnRate, hybridEnabled ? sipYears : years),
    [initialMonthly, returnRate, sipYears, years, hybridEnabled]
  );

  /* ── Event management (add Lump Sum Invest / SWP / Withdraw / Extra SIP) ── */
  const planHorizon = hybridEnabled ? totalYears : years;
  const sipDurationYears = hybridEnabled ? sipYears : years;

  const addEvent = (type: LifelineEventType) => {
    if (events.length >= MAX_EVENTS) return;
    const defaults: Record<LifelineEventType, Partial<LifelineEvent>> = {
      sip:              { monthlyAmount: 5000, duration: 5, startYear: 1, stepUpEnabled: false, stepUpType: 'percentage', stepUpValue: 10 },
      lumpsum_invest:   { amount: 500000, startYear: 1 },
      swp:              { withdrawalAmount: 50000, duration: 10, startYear: Math.min(sipDurationYears + 1, planHorizon), returnRate, incrementEnabled: false, incrementType: 'percentage', incrementValue: 5 },
      lumpsum_withdraw: { amount: 500000, startYear: Math.min(sipDurationYears + 1, planHorizon) },
    };
    setEvents([...events, { id: nextEventId, type, label: '', ...defaults[type] } as LifelineEvent]);
    setNextEventId(nextEventId + 1);
  };
  const removeEvent = (id: number) => setEvents(events.filter((e) => e.id !== id));
  const updateEvent = (id: number, updates: Partial<LifelineEvent>) =>
    setEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)));

  // When an add-on is added, scroll its new editor card into view and briefly
  // highlight it — the card appears ABOVE the dashed chips, so without this a
  // click can look like "nothing happened". Inline box-shadow (no Tailwind dep).
  const prevEventCount = useRef(0);
  useEffect(() => {
    if (events.length > prevEventCount.current) {
      const cards = document.querySelectorAll<HTMLElement>('[data-event-card]');
      const last = cards[cards.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        last.style.transition = 'box-shadow 0.35s ease';
        last.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.55)';
        window.setTimeout(() => { last.style.boxShadow = ''; }, 1400);
      }
    }
    prevEventCount.current = events.length;
  }, [events.length]);

  /* ── Combined Lifeline calc: primary Step-Up SIP + any extra events ── */
  const combinedEvents = useMemo<LifelineEvent[]>(() => {
    const primary: LifelineEvent = {
      id: 0,
      type: 'sip',
      startYear: 1,
      label: 'Primary Step-Up SIP',
      monthlyAmount: initialMonthly,
      duration: sipDurationYears,
      stepUpEnabled: true,
      stepUpType,
      stepUpValue: activeStepUpValue,
    };
    return [primary, ...events];
  }, [initialMonthly, sipDurationYears, stepUpType, activeStepUpValue, events]);

  const lifelineResult = useMemo(
    () => calculateLifeline(0, returnRate, planHorizon, combinedEvents),
    [returnRate, planHorizon, combinedEvents]
  );
  const hasExtras = events.length > 0;

  // Choose which data to show based on hybrid mode
  const activeStepUp = hybridEnabled ? hybridStepUpResult : stepUpResult;
  const activeRegular = hybridEnabled ? hybridRegularResult : regularResult;
  const activeBreakdown = hybridEnabled ? hybridStepUpResult.growthBreakdown : stepUpResult.yearlyBreakdown.map((r) => ({ ...r, phase: 'SIP' as const }));
  const activeRegularBreakdown = hybridEnabled
    ? regularBreakdown.slice(0, sipYears)
    : regularBreakdown;

  const chartData = activeBreakdown.map((row, i) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    stepUpValue: row.value,
    regularValue: activeRegularBreakdown[i]?.value || (i > 0 ? activeRegularBreakdown[activeRegularBreakdown.length - 1]?.value : 0) || 0,
    stepUpInvested: row.invested,
    regularInvested: activeRegularBreakdown[i]?.invested || activeRegularBreakdown[activeRegularBreakdown.length - 1]?.invested || 0,
    phase: 'phase' in row ? (row as { phase: string }).phase : 'SIP',
  }));

  const comparisonData = [
    {
      metric: 'Total Invested',
      regular: activeRegular.totalInvested,
      stepUp: activeStepUp.totalInvested,
    },
    {
      metric: 'Portfolio Value',
      regular: activeRegular.totalValue,
      stepUp: activeStepUp.totalValue,
    },
    {
      metric: 'Returns',
      regular: activeRegular.estimatedReturns,
      stepUp: activeStepUp.estimatedReturns,
    },
  ];

  const extraWealth = activeStepUp.totalValue - activeRegular.totalValue;
  const extraPercent = activeRegular.totalValue > 0
    ? ((extraWealth / activeRegular.totalValue) * 100).toFixed(0)
    : '0';

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
              <TrendingUp className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Step-Up SIP Calculator</h1>
              <p className="text-slate-300 mt-1">See how increasing your SIP annually creates significantly more wealth</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Step-Up SIP</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                {/* Initial Monthly */}
                <NumberInput label="Starting Monthly SIP" value={initialMonthly} onChange={setInitialMonthly} prefix="₹" step={500} min={500} max={500000} />

                {/* Annual Step-Up — +% or +₹ */}
                <div
                  className="space-y-2"
                  data-pdf-stepup={`Annual Step-Up (${stepUpType === 'percentage' ? 'Percentage' : 'Amount'}): ${stepUpType === 'amount' ? '₹' : ''}${activeStepUpValue}${stepUpType === 'percentage' ? '%' : ''} per year`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Annual Step-Up</label>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setStepUpType('percentage')}
                        className={cn(
                          'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                          stepUpType === 'percentage' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        +%
                      </button>
                      <button
                        type="button"
                        onClick={() => setStepUpType('amount')}
                        className={cn(
                          'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                          stepUpType === 'amount' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        +₹
                      </button>
                    </div>
                  </div>
                  {stepUpType === 'percentage' ? (
                    <NumberInput label="" value={stepUpPercent} onChange={setStepUpPercent} suffix="%" step={1} min={1} max={50} />
                  ) : (
                    <NumberInput label="" value={stepUpAmount} onChange={setStepUpAmount} prefix="₹" step={500} min={500} max={50000} />
                  )}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {stepUpType === 'percentage'
                      ? `Your monthly SIP grows by ${stepUpPercent}% each year (compounding increase).`
                      : `₹${stepUpAmount.toLocaleString('en-IN')} is added to your monthly SIP every year (flat increase).`}
                  </p>

                  {/* Monthly SIP preview — instantly shows the %/₹ difference */}
                  {(() => {
                    const breakdown = activeBreakdown;
                    if (breakdown.length === 0) return null;
                    const yr1 = breakdown[0]?.monthlyAmount ?? initialMonthly;
                    const yr5 = breakdown[Math.min(4, breakdown.length - 1)]?.monthlyAmount ?? yr1;
                    const yr10 = breakdown[Math.min(9, breakdown.length - 1)]?.monthlyAmount ?? yr1;
                    const last = breakdown.filter((r) => r.monthlyAmount > 0).slice(-1)[0]?.monthlyAmount ?? yr1;
                    const lastYr = breakdown.filter((r) => r.monthlyAmount > 0).slice(-1)[0]?.year ?? sipDurationYears;
                    return (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2.5 grid grid-cols-4 gap-1.5 text-center">
                        <div>
                          <div className="text-[9px] text-emerald-700 font-semibold uppercase">Yr 1</div>
                          <div className="text-[11px] font-bold text-emerald-800 mt-0.5">{formatINR(yr1)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-emerald-700 font-semibold uppercase">Yr 5</div>
                          <div className="text-[11px] font-bold text-emerald-800 mt-0.5">{formatINR(yr5)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-emerald-700 font-semibold uppercase">Yr 10</div>
                          <div className="text-[11px] font-bold text-emerald-800 mt-0.5">{formatINR(yr10)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-emerald-700 font-semibold uppercase">Yr {lastYr}</div>
                          <div className="text-[11px] font-bold text-emerald-800 mt-0.5">{formatINR(last)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Return Rate */}
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />

                {/* Hybrid Mode Toggle */}
                <div className="border border-surface-300 rounded-xl p-4 bg-surface-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-slate-700">Growth Period (Hybrid)</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hybridEnabled}
                      onClick={() => setHybridEnabled(!hybridEnabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                        hybridEnabled ? 'bg-amber-500' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                          hybridEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Continue compounding after SIP stops
                  </p>

                  {hybridEnabled && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-surface-300">
                      {/* SIP Duration */}
                      <NumberInput label="SIP Duration" value={sipYears} onChange={handleSipYearsChange} suffix="Years" step={1} min={1} max={30} />

                      {/* Total Duration */}
                      <NumberInput label="Total Duration" value={totalYears} onChange={handleTotalYearsChange} suffix="Years" step={1} min={sipYears} max={40} />

                      <div className="flex gap-2">
                        <div className="flex-1 bg-brand-50 rounded-lg px-3 py-2 text-center">
                          <div className="text-[10px] text-brand font-medium uppercase">SIP Phase</div>
                          <div className="text-sm font-bold text-brand">{sipYears} Yrs</div>
                        </div>
                        <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
                          <div className="text-[10px] text-amber-700 font-medium uppercase">Growth Phase</div>
                          <div className="text-sm font-bold text-amber-700">{totalYears - sipYears} Yrs</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Standard Duration (only when hybrid is OFF) */}
                {!hybridEnabled && (
                  <NumberInput label="Investment Duration" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />
                )}

                {/* ── Optional Add-Ons (Lifeline-style events) ── */}
                <div className="border-t border-surface-200 pt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-bold text-slate-700">Optional Add-Ons</h3>
                    {hasExtras && (
                      <span className="text-[10px] text-slate-500 bg-surface-100 px-2 py-0.5 rounded-full">
                        {events.length} added
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Layer extra investments or withdrawals on top of your Step-Up SIP — for real-life events like bonuses, mid-life lump sums, retirement income.
                  </p>

                  {/* Event editor cards (Lifeline pattern → PDF-friendly) */}
                  {events.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {events.map((ev) => {
                        const style = EVENT_STYLES[ev.type];
                        const Icon = style.icon;
                        const maxDuration = Math.max(1, planHorizon - ev.startYear + 1);
                        const yearOptions = Array.from({ length: planHorizon }, (_, i) => i + 1);
                        return (
                          <div
                            key={ev.id}
                            data-event-card={ev.id}
                            className={cn('rounded-xl border p-3 sm:p-4 transition-all', style.border, style.bg)}
                            data-pdf-stepup={ev.type === 'sip' && ev.stepUpEnabled ? `Annual Step-Up (${ev.stepUpType === 'percentage' ? 'Percentage' : 'Amount'}): ${ev.stepUpType === 'amount' ? '₹' : ''}${ev.stepUpValue ?? 10}${ev.stepUpType === 'percentage' ? '%' : ''}` : undefined}
                            data-pdf-increment={ev.type === 'swp' && ev.incrementEnabled ? `Annual Increment (${ev.incrementType === 'percentage' ? 'Percentage' : 'Amount'}): ${ev.incrementType === 'amount' ? '₹' : ''}${ev.incrementValue ?? 5}${ev.incrementType === 'percentage' ? '%' : ''}` : undefined}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', style.badge)}>
                                <Icon className="w-3 h-3" /> {style.label}
                              </span>
                              <button
                                onClick={() => removeEvent(ev.id)}
                                className="p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Label */}
                            <input
                              type="text"
                              placeholder="Label (e.g., Bonus SIP, Car Down-Payment)"
                              value={ev.label || ''}
                              onChange={(e) => updateEvent(ev.id, { label: e.target.value })}
                              className="w-full text-xs bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-3 outline-none focus:ring-1 focus:ring-brand-300 placeholder:text-slate-400"
                            />

                            {/* Year selector — with age annotation */}
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

                            {/* SIP fields */}
                            {ev.type === 'sip' && (
                              <div className="space-y-3">
                                <NumberInput label="Monthly SIP" value={ev.monthlyAmount ?? 5000} onChange={(v) => updateEvent(ev.id, { monthlyAmount: v })} prefix="₹" step={500} min={500} max={500000} />
                                <NumberInput label="Duration" value={Math.min(ev.duration ?? 5, maxDuration)} onChange={(v) => updateEvent(ev.id, { duration: v })} suffix="Years" step={1} min={1} max={maxDuration} />

                                {/* Optional step-up on the extra SIP */}
                                <div className="pt-2 border-t border-emerald-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-medium text-slate-600">Annual Step-Up</label>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={ev.stepUpEnabled}
                                      onClick={() => updateEvent(ev.id, { stepUpEnabled: !ev.stepUpEnabled })}
                                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', ev.stepUpEnabled ? 'bg-emerald-500' : 'bg-slate-300')}
                                    >
                                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', ev.stepUpEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                                    </button>
                                  </div>
                                  {ev.stepUpEnabled && (
                                    <div className="space-y-2 mt-2">
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => updateEvent(ev.id, { stepUpType: 'percentage' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.stepUpType === 'percentage' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300')}>+%</button>
                                        <button type="button" onClick={() => updateEvent(ev.id, { stepUpType: 'amount' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.stepUpType === 'amount' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300')}>+₹</button>
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

                            {/* Lump Sum Invest */}
                            {ev.type === 'lumpsum_invest' && (
                              <NumberInput label="Investment Amount" value={ev.amount ?? 500000} onChange={(v) => updateEvent(ev.id, { amount: v })} prefix="₹" step={50000} min={10000} max={50000000} />
                            )}

                            {/* SWP */}
                            {ev.type === 'swp' && (
                              <div className="space-y-3">
                                <NumberInput label="Monthly Withdrawal" value={ev.withdrawalAmount ?? 50000} onChange={(v) => updateEvent(ev.id, { withdrawalAmount: v })} prefix="₹" step={5000} min={1000} max={5000000} />
                                <NumberInput label="Duration" value={Math.min(ev.duration ?? 10, maxDuration)} onChange={(v) => updateEvent(ev.id, { duration: v })} suffix="Years" step={1} min={1} max={maxDuration} />
                                <NumberInput label="Portfolio Return During SWP" value={ev.returnRate ?? returnRate} onChange={(v) => updateEvent(ev.id, { returnRate: v })} suffix="% p.a." step={0.5} min={1} max={25} hint="Typically lower during withdrawal phase" />

                                {/* Optional increment */}
                                <div className="pt-2 border-t border-amber-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-medium text-slate-600">Annual Increment</label>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={ev.incrementEnabled}
                                      onClick={() => updateEvent(ev.id, { incrementEnabled: !ev.incrementEnabled })}
                                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', ev.incrementEnabled ? 'bg-amber-500' : 'bg-slate-300')}
                                    >
                                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', ev.incrementEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                                    </button>
                                  </div>
                                  {ev.incrementEnabled && (
                                    <div className="space-y-2 mt-2">
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => updateEvent(ev.id, { incrementType: 'percentage' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.incrementType === 'percentage' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300')}>+%</button>
                                        <button type="button" onClick={() => updateEvent(ev.id, { incrementType: 'amount' })} className={cn('flex-1 text-[10px] font-semibold py-1 rounded-lg border transition-colors', ev.incrementType === 'amount' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300')}>+₹</button>
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

                            {/* Lump Sum Withdraw */}
                            {ev.type === 'lumpsum_withdraw' && (
                              <NumberInput label="Withdrawal Amount" value={ev.amount ?? 500000} onChange={(v) => updateEvent(ev.id, { amount: v })} prefix="₹" step={50000} min={10000} max={50000000} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add-event chips */}
                  {events.length < MAX_EVENTS && (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => addEvent('sip')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Extra SIP
                      </button>
                      <button type="button" onClick={() => addEvent('lumpsum_invest')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Lump Sum Invest
                      </button>
                      <button type="button" onClick={() => addEvent('swp')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> SWP
                      </button>
                      <button type="button" onClick={() => addEvent('lumpsum_withdraw')} className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Lump Sum Withdraw
                      </button>
                    </div>
                  )}

                  {events.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center pt-2">
                      No add-ons yet — your plan is a pure Step-Up SIP.
                    </p>
                  )}
                </div>
              </div>

              {/* Comparison Summary */}
              <div className="mt-8 space-y-4">
                {/* Combined Lifeline total (only when extras present) */}
                {hasExtras && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <div className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">Total Wealth (with add-ons)</div>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-800">{formatINR(lifelineResult.finalCorpus)}</div>
                    <div className="text-[11px] text-emerald-700 mt-1">
                      {investorAge !== null
                        ? <>By Age {investorAge + planHorizon - 1} · </>
                        : <>After {planHorizon} years · </>}
                      Net invested: {formatINR(lifelineResult.totalInvested - lifelineResult.totalWithdrawn)}
                      {lifelineResult.totalWithdrawn > 0 && (
                        <> · Withdrew: {formatINR(lifelineResult.totalWithdrawn)}</>
                      )}
                    </div>
                    {lifelineResult.corpusDepletedYear && (
                      <div className="mt-1.5 text-[10px] text-red-600 font-semibold">
                        ⚠ Corpus depleted in Year {lifelineResult.corpusDepletedYear}
                        {investorAge !== null && <> (Age {investorAge + lifelineResult.corpusDepletedYear - 1})</>}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gradient-to-r from-amber-50 to-secondary-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Step-Up SIP Value (base)</div>
                  <div className="text-2xl font-extrabold text-secondary-700">{formatINR(activeStepUp.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">Invested: {formatINR(activeStepUp.totalInvested)}</div>
                </div>

                <div className="bg-surface-100 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Regular SIP Value</div>
                  <div className="text-xl font-bold text-primary-700">{formatINR(activeRegular.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">Invested: {formatINR(activeRegular.totalInvested)}</div>
                </div>

                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Extra Wealth with Step-Up</div>
                  <div className="text-xl font-extrabold text-positive">{formatINR(extraWealth)}</div>
                  <div className="text-xs text-teal-600 font-medium mt-1">{extraPercent}% more than regular SIP</div>
                </div>

                {hybridEnabled && totalYears > sipYears && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">Growth Phase Gains</div>
                    <div className="text-lg font-extrabold text-amber-700">
                      {formatINR(
                        (hybridStepUpResult.growthBreakdown.find((b) => b.year === totalYears)?.value ?? 0) -
                        (hybridStepUpResult.growthBreakdown.find((b) => b.year === sipYears)?.value ?? 0)
                      )}
                    </div>
                    <div className="text-[11px] text-amber-600 mt-1">
                      Extra wealth from {totalYears - sipYears} years of compounding without investing more
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* PDF Download Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Step-Up SIP Calculator" fileName="step-up-sip-calculator" />
              </div>

              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} Step-Up SIP Plan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? `Age ${investorAge} \u2192 ${investorAge + (hybridEnabled ? totalYears : years)}`
                      : `${hybridEnabled ? totalYears : years} year investment journey`
                    }
                  </p>
                </div>
              )}

              {/* Comparison Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  {hybridEnabled ? 'Step-Up SIP Growth with Compounding' : 'Step-Up vs Regular SIP Growth'}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {hybridEnabled
                    ? `Step-Up SIP for ${sipYears} years, then compounding for ${totalYears - sipYears} more years`
                    : 'How annual increases compound your portfolio'}
                </p>

                {hybridEnabled && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#D4A017]" />
                      <span className="text-xs text-slate-600">Step-Up SIP Value</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#64748B]" />
                      <span className="text-xs text-slate-600">Amount Invested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-[#D97706] border-dashed border border-amber-600" />
                      <span className="text-xs text-slate-600">SIP Ends</span>
                    </div>
                  </div>
                )}

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradStepUp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.stepUp} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.stepUp} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRegular" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.regular} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.regular} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradStepGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="gradInvestedStep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            stepUpValue: 'Step-Up SIP Value',
                            regularValue: 'Regular SIP Value',
                            stepUpInvested: 'Amount Invested',
                          };
                          return [formatINR(value), labels[name] || name];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelFormatter={(label) => {
                          if (!hybridEnabled) return label;
                          const item = chartData.find((d) => d.year === label);
                          return item ? `${label} — ${item.phase} Phase` : label;
                        }}
                      />
                      <Area type="monotone" dataKey="stepUpInvested" stroke={COLORS.invested} fill="url(#gradInvestedStep)" strokeWidth={2} name="stepUpInvested" />
                      {hybridEnabled ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="stepUpValue"
                            stroke={COLORS.stepUp}
                            fill="url(#gradStepGrowth)"
                            strokeWidth={2.5}
                            name="stepUpValue"
                            dot={(props: Record<string, unknown>) => {
                              const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                              if (index === sipYears - 1) {
                                return (
                                  <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={COLORS.growth} stroke="#fff" strokeWidth={2} />
                                );
                              }
                              return <circle key={`dot-${index}`} cx={0} cy={0} r={0} fill="none" />;
                            }}
                          />
                          {sipYears < totalYears && (
                            <ReferenceLine
                              x={investorAge !== null ? `Age ${investorAge + sipYears}` : `Yr ${sipYears}`}
                              stroke={COLORS.growth}
                              strokeDasharray="6 3"
                              strokeWidth={2}
                              label={{
                                value: `\u2190 SIP Phase | Growth Phase \u2192`,
                                position: 'top',
                                fontSize: 10,
                                fill: COLORS.growth,
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <Area type="monotone" dataKey="regularValue" stroke={COLORS.regular} fill="url(#gradRegular)" strokeWidth={2} name="Regular SIP" />
                          <Area type="monotone" dataKey="stepUpValue" stroke={COLORS.stepUp} fill="url(#gradStepUp)" strokeWidth={2} name="Step-Up SIP" />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Side-by-Side Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Regular SIP vs Step-Up SIP metrics</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="regular" name="Regular SIP" fill={COLORS.regular} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="stepUp" name="Step-Up SIP" fill={COLORS.stepUp} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {hybridEnabled ? 'Monthly SIP increases each year during SIP phase, then corpus compounds' : 'Monthly SIP amount increases each year'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        {hybridEnabled && (
                          <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Phase</th>
                        )}
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly SIP</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Total Invested</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Step-Up Value</th>
                        {!hybridEnabled && (
                          <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Regular Value</th>
                        )}
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          {hybridEnabled ? 'Growth' : 'Extra Gains'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBreakdown.map((row, i) => {
                        const phase = 'phase' in row ? (row as { phase: string }).phase : 'SIP';
                        const regValue = activeRegularBreakdown[i]?.value || 0;
                        const diff = hybridEnabled ? row.returns : row.value - regValue;
                        return (
                          <tr
                            key={row.year}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              hybridEnabled && phase === 'Growth' && 'bg-amber-50/30'
                            )}
                          >
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">Year {row.year}</td>
                            {hybridEnabled && (
                              <td className="py-3 px-2 sm:px-3">
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                                    phase === 'SIP'
                                      ? 'bg-brand-50 text-brand'
                                      : 'bg-amber-50 text-amber-700'
                                  )}
                                >
                                  {phase}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">
                              {row.monthlyAmount > 0 ? formatINR(row.monthlyAmount) : <span className="text-amber-600 text-xs font-medium">--</span>}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right font-semibold text-secondary-700">{formatINR(row.value)}</td>
                            {!hybridEnabled && (
                              <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(regValue)}</td>
                            )}
                            <td className="py-3 px-2 sm:px-3 text-right">
                              {hybridEnabled ? (
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  row.growthPercent > 100 ? 'bg-teal-50 text-teal-700' :
                                  row.growthPercent > 50 ? 'bg-brand-50 text-brand-700' :
                                  'bg-slate-100 text-slate-600'
                                )}>
                                  {row.growthPercent}%
                                </span>
                              ) : (
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  diff > 0 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                                )}>
                                  +{formatINR(diff)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
