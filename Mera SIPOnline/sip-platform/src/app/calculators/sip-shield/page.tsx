'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, Plus, Trash2, TrendingUp, ChevronDown, ChevronUp,
  Zap, PiggyBank, IndianRupee, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { calculateSIPShield, COST_TYPE_LABELS } from '@/lib/utils/sip-shield-calc';
import type {
  SIPShieldInputs, SIPShieldResult, YearlyDetail, LumpsumEvent,
  CostType, PaymentFrequency,
} from '@/lib/utils/sip-shield-calc';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

// ── Constants ──────────────────────────────────────

const COST_TYPE_OPTIONS: { key: CostType; label: string }[] = [
  { key: 'term_plan', label: 'Term Insurance Premium' },
  { key: 'endowment', label: 'Endowment/ULIP Premium' },
  { key: 'home_loan', label: 'Home Loan EMI' },
  { key: 'car_loan', label: 'Car Loan EMI' },
  { key: 'personal_loan', label: 'Personal Loan EMI' },
  { key: 'education_loan', label: 'Education Loan EMI' },
  { key: 'health_insurance', label: 'Health Insurance Premium' },
  { key: 'other', label: 'Other Recurring Payment' },
];

const FREQUENCY_OPTIONS: { key: PaymentFrequency; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'half_yearly', label: 'Half-Yearly' },
  { key: 'yearly', label: 'Yearly' },
];

const INSURANCE_TYPES: CostType[] = ['term_plan', 'endowment', 'health_insurance'];

const INSIGHT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  tip: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
};

function fmtLakhs(v: number): string {
  if (Math.abs(v) >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(2)} L`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return formatNumber(Math.round(v));
}

// ── Summary Card ──

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'emerald' | 'teal' | 'red' | 'amber' | 'green';
}) {
  const map: Record<string, { bg: string; iconBg: string; text: string; val: string }> = {
    emerald: { bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-600', val: 'text-emerald-800' },
    teal: { bg: 'bg-teal-50 border-teal-200', iconBg: 'bg-teal-100 text-teal-600', text: 'text-teal-600', val: 'text-teal-800' },
    red: { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100 text-red-600', text: 'text-red-600', val: 'text-red-800' },
    amber: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-600', val: 'text-amber-800' },
    green: { bg: 'bg-green-50 border-green-200', iconBg: 'bg-green-100 text-green-600', text: 'text-green-600', val: 'text-green-800' },
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

export default function SIPShieldPage() {
  // Section 1: Client
  const [clientName, setClientName] = useState('');
  const [clientAge, setClientAge] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState(30);

  // Section 2: Recurring Cost
  const [costType, setCostType] = useState<CostType>('term_plan');
  const [costLabel, setCostLabel] = useState('Term Insurance Premium');
  const [paymentAmount, setPaymentAmount] = useState(25000);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('yearly');
  const [totalTenure, setTotalTenure] = useState(30);
  const [alreadyPaid, setAlreadyPaid] = useState(0);
  const [costInflation, setCostInflation] = useState(0);

  // Section 3: SIP Strategy
  const [monthlySIP, setMonthlySIP] = useState(5000);
  const [sipDuration, setSipDuration] = useState(12);
  const [sipReturn, setSipReturn] = useState(12);
  const [stepUpEnabled, setStepUpEnabled] = useState(true);
  const [stepUpPercent, setStepUpPercent] = useState(10);
  const [growthPhaseEnabled, setGrowthPhaseEnabled] = useState(false);
  const [growthPeriod, setGrowthPeriod] = useState(3);
  const [growthReturn, setGrowthReturn] = useState(10);
  const [withdrawalReturn, setWithdrawalReturn] = useState(8);

  // Section 4: Lumpsum Events
  const [lumpsumEvents, setLumpsumEvents] = useState<LumpsumEvent[]>([]);
  const [nextLumpsumId, setNextLumpsumId] = useState(1);

  // UI State
  const [showYearlyTable, setShowYearlyTable] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Handle cost type change — auto-fill label & default inflation
  const handleCostTypeChange = (type: CostType) => {
    setCostType(type);
    setCostLabel(COST_TYPE_OPTIONS.find(o => o.key === type)?.label ?? 'Recurring Payment');
    setCostInflation(INSURANCE_TYPES.includes(type) ? 0 : 5);
  };

  const addLumpsum = (type: 'investment' | 'withdrawal') => {
    setLumpsumEvents(prev => [...prev, {
      id: String(nextLumpsumId), type,
      label: type === 'investment' ? 'Bonus / Windfall' : 'Emergency Withdrawal',
      amount: 100000, atYear: Math.min(5, totalTenure - alreadyPaid),
    }]);
    setNextLumpsumId(p => p + 1);
  };

  // ── Computation ──

  const result = useMemo<SIPShieldResult>(() => {
    const inputs: SIPShieldInputs = {
      clientName,
      currentAge,
      cost: {
        type: costType,
        label: costLabel,
        amount: paymentAmount,
        frequency: paymentFrequency,
        totalTenure,
        alreadyPaidYears: alreadyPaid,
        inflationRate: costInflation,
      },
      monthlySIP,
      sipDuration,
      sipReturn,
      stepUpEnabled,
      stepUpPercent: stepUpEnabled ? stepUpPercent : 0,
      growthPhaseYears: growthPhaseEnabled ? growthPeriod : 0,
      growthReturn: growthPhaseEnabled ? growthReturn : sipReturn,
      withdrawalReturn,
      lumpsumEvents,
    };
    return calculateSIPShield(inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clientName, currentAge, costType, costLabel, paymentAmount, paymentFrequency,
    totalTenure, alreadyPaid, costInflation, monthlySIP, sipDuration, sipReturn,
    stepUpEnabled, stepUpPercent, growthPhaseEnabled, growthPeriod, growthReturn,
    withdrawalReturn,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(lumpsumEvents),
  ]);

  const chartData = result.yearlyDetails.map((row: YearlyDetail) => ({
    year: row.year,
    age: row.age,
    corpus: Math.round(row.yearEndCorpus),
    costFromCorpus: Math.round(row.costPaidFromCorpus),
    phase: row.phase,
  }));

  const phaseLabel = (p: string) =>
    p === 'SIP' ? 'SIP Phase' : p === 'Growth' ? 'Growth Phase' : 'Shield Active';
  const phaseColor = (p: string) =>
    p === 'SIP' ? 'text-emerald-700 bg-emerald-100' : p === 'Growth' ? 'text-amber-700 bg-amber-100' : 'text-teal-700 bg-teal-100';

  const remainingTenure = totalTenure - alreadyPaid;

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
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">India&apos;s First</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">SIP Shield Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Let your SIP pay your premiums, EMIs & recurring costs — forever.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar name={clientName} onNameChange={setClientName} age={clientAge} onAgeChange={setClientAge} ageLabel="Current Age" namePlaceholder="e.g., Ram" showAge={false} />
            <DownloadPDFButton elementId="calculator-results" title="SIP Shield Plan" fileName={`SIP-Shield-${clientName || 'Plan'}`} />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ═══════ LEFT PANEL ═══════ */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Section 1: Client Details */}
              <div className="border-t-4 border-emerald-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> Client Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Client Name</label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g., Ram Sharma" className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300" />
                  </div>
                  <NumberInput label="Current Age" value={currentAge} onChange={setCurrentAge} suffix="years" step={1} min={20} max={70} />
                </div>
              </div>

              {/* Section 2: Your Recurring Cost */}
              <div className="border-t-4 border-red-400 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-red-500" /> Your Recurring Cost</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Cost Type</label>
                    <select value={costType} onChange={e => handleCostTypeChange(e.target.value as CostType)} className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg border border-surface-300 bg-white text-slate-700 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none transition-all" data-pdf-hide>
                      {COST_TYPE_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Label</label>
                    <input type="text" value={costLabel} onChange={e => setCostLabel(e.target.value)} className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300" />
                  </div>
                  <NumberInput label="Payment Amount" value={paymentAmount} onChange={setPaymentAmount} prefix="Rs." step={1000} min={500} max={5000000} />
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Payment Frequency</label>
                    <div className="flex gap-1.5" data-pdf-hide>
                      {FREQUENCY_OPTIONS.map(f => (
                        <button key={f.key} type="button" onClick={() => setPaymentFrequency(f.key)} className={cn('flex-1 py-2 text-xs font-semibold rounded-lg border transition-all', paymentFrequency === f.key ? 'bg-brand text-white border-brand' : 'bg-white text-slate-500 border-surface-300 hover:border-brand-200')}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <NumberInput label="Total Tenure" value={totalTenure} onChange={setTotalTenure} suffix="years" step={1} min={5} max={50} />
                  <NumberInput label="Already Paid" value={alreadyPaid} onChange={v => setAlreadyPaid(Math.min(v, totalTenure - 1))} suffix="years" step={1} min={0} max={totalTenure - 1} />
                  <NumberInput label="Cost Inflation" value={costInflation} onChange={setCostInflation} suffix="%" step={0.5} min={0} max={15} hint="0% for fixed premiums, 5-8% for variable costs" />
                </div>
              </div>

              {/* Section 3: Your SIP Strategy */}
              <div className="border-t-4 border-brand rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand" /> Your SIP Strategy</h3>
                <div className="space-y-3">
                  <NumberInput label="Monthly SIP Amount" value={monthlySIP} onChange={setMonthlySIP} prefix="Rs." step={500} min={1000} max={500000} />
                  <NumberInput label="SIP Duration" value={sipDuration} onChange={setSipDuration} suffix="years" step={1} min={5} max={40} />
                  <NumberInput label="Expected SIP Return" value={sipReturn} onChange={setSipReturn} suffix="% p.a." step={0.5} min={8} max={18} />

                  {/* Step-Up Toggle */}
                  <div>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setStepUpEnabled(!stepUpEnabled)} role="switch" aria-checked={stepUpEnabled} tabIndex={0}>
                      <span className="text-[13px] font-semibold text-slate-600">Step-Up SIP</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', stepUpEnabled ? 'bg-emerald-500' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', stepUpEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>
                    {stepUpEnabled && (
                      <div className="mt-2">
                        <NumberInput label="Step-Up Percentage" value={stepUpPercent} onChange={setStepUpPercent} suffix="%" step={1} min={0} max={25} />
                      </div>
                    )}
                  </div>

                  {/* Growth Phase Toggle */}
                  <div>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setGrowthPhaseEnabled(!growthPhaseEnabled)} role="switch" aria-checked={growthPhaseEnabled} tabIndex={0}>
                      <span className="text-[13px] font-semibold text-slate-600">Growth Phase</span>
                      <div className={cn('relative w-10 h-5 rounded-full transition-colors', growthPhaseEnabled ? 'bg-brand' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', growthPhaseEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{growthPhaseEnabled ? 'Corpus compounds before withdrawals begin' : 'Withdrawals start immediately after SIP phase'}</p>
                    {growthPhaseEnabled && (
                      <div className="mt-2 space-y-2">
                        <NumberInput label="Growth Period" value={growthPeriod} onChange={setGrowthPeriod} suffix="years" step={1} min={1} max={20} />
                        <NumberInput label="Growth Return" value={growthReturn} onChange={setGrowthReturn} suffix="% p.a." step={0.5} min={6} max={15} />
                      </div>
                    )}
                  </div>

                  <NumberInput label="Withdrawal Phase Return" value={withdrawalReturn} onChange={setWithdrawalReturn} suffix="% p.a." step={0.5} min={5} max={12} />
                </div>
              </div>

              {/* Section 4: Lumpsum Events */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-600" /> Lumpsum Events</h3>
                <p className="text-[11px] text-slate-400 mb-4">One-time investments or withdrawals during the plan</p>
                <div className="flex gap-2 mb-3" data-pdf-hide>
                  <button onClick={() => addLumpsum('investment')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Investment</button>
                  <button onClick={() => addLumpsum('withdrawal')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Withdrawal</button>
                </div>
                <div className="space-y-3">
                  {lumpsumEvents.map(ev => (
                    <div key={ev.id} className={cn('flex items-start gap-2 p-3 rounded-lg border', ev.type === 'investment' ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50')}>
                      <div className="flex-1 space-y-2">
                        <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase', ev.type === 'investment' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800')}>{ev.type}</span>
                        <input type="text" value={ev.label} onChange={e => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, label: e.target.value } : l))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600" placeholder="Label" />
                        <NumberInput label="Amount" value={ev.amount} onChange={v => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, amount: v } : l))} prefix="Rs." step={50000} min={0} max={100000000} />
                        <NumberInput label="At Year" value={ev.atYear} onChange={v => setLumpsumEvents(prev => prev.map(l => l.id === ev.id ? { ...l, atYear: v } : l))} suffix="" step={1} min={1} max={remainingTenure} />
                      </div>
                      <button onClick={() => setLumpsumEvents(prev => prev.filter(l => l.id !== ev.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1" data-pdf-hide><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT PANEL ═══════ */}
            <div className="space-y-6">

              {/* Row 1: Magic Numbers */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard icon={<PiggyBank className="w-4 h-4" />} label="Total SIP Invested" value={`Rs. ${fmtLakhs(result.totalSIPInvested)}`} color="emerald" />
                <SummaryCard icon={<Shield className="w-4 h-4" />} label="Corpus Pays Your Cost" value={`Rs. ${fmtLakhs(result.totalCostPaidFromCorpus)}`} color="teal" />
                <SummaryCard icon={<IndianRupee className="w-4 h-4" />} label="Net Benefit" value={`Rs. ${fmtLakhs(result.netBenefit)}`} color={result.netBenefit >= 0 ? 'green' : 'red'} />
                <SummaryCard icon={<Zap className="w-4 h-4" />} label="Benefit Multiple" value={`${result.benefitMultiple.toFixed(2)}x`} color="amber" />
              </div>

              {/* Row 2: 3-Phase Timeline */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Your SIP Shield Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Phase 1: SIP */}
                  <div className="relative rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Phase 1 &middot; SIP Phase</div>
                    <div className="text-xs text-emerald-800 font-semibold mb-1">You invest Rs.{formatNumber(monthlySIP)}/mo for {sipDuration} years</div>
                    <div className="text-[11px] text-emerald-600">You also pay {costLabel.toLowerCase()} from pocket</div>
                    <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Phase 2: Growth */}
                  {growthPhaseEnabled && growthPeriod > 0 ? (
                    <div className="relative rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">Phase 2 &middot; Growth Phase</div>
                      <div className="text-xs text-amber-800 font-semibold mb-1">Corpus compounds for {growthPeriod} years</div>
                      <div className="text-[11px] text-amber-600">Still paying from pocket</div>
                      <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-amber-500 items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
                      <p className="text-xs text-slate-400 text-center">Growth phase disabled — withdrawals start immediately after SIP</p>
                    </div>
                  )}

                  {/* Phase 3: Shield Active */}
                  <div className="rounded-xl border-2 border-teal-300 bg-teal-50 p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-teal-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-teal-500/30 animate-pulse">
                      Shield Active
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">Phase 3 &middot; Shield Active</div>
                    <div className="text-xs text-teal-800 font-semibold mb-1">Corpus pays your {costLabel.toLowerCase()}</div>
                    <div className="text-[11px] text-teal-600 font-bold">You pay NOTHING from pocket</div>
                  </div>
                </div>
              </div>

              {/* Row 3: Corpus Growth Chart */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Corpus Growth Over Time</h3>
                <div className="h-72" data-pdf-hide>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0F766E" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtLakhs(v)} />
                      <Tooltip formatter={(v: number) => [`Rs. ${formatNumber(Math.round(v))}`, '']} labelFormatter={(l: number) => `Age ${l}`} />
                      <Area type="monotone" dataKey="corpus" stroke="#0F766E" strokeWidth={2} fill="url(#corpusGrad)" name="Corpus" />
                      <Area type="monotone" dataKey="costFromCorpus" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Cost Paid (Corpus)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 4: Money Flow Summary */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Money Flow Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="text-[11px] font-semibold text-red-600 mb-2">What You Paid From Pocket</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-slate-600">SIP Investment</span><span className="font-bold text-red-700">Rs. {fmtLakhs(result.totalSIPInvested)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">{costLabel} (pocket)</span><span className="font-bold text-red-700">Rs. {fmtLakhs(result.totalCostPaidFromPocket)}</span></div>
                      <div className="border-t border-red-200 pt-1.5 flex justify-between font-bold"><span className="text-red-700">Total Out-of-Pocket</span><span className="text-red-800">Rs. {fmtLakhs(result.totalSIPInvested + result.totalCostPaidFromPocket)}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <div className="text-[11px] font-semibold text-emerald-600 mb-2">What Your Corpus Delivered</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-slate-600">{costLabel} (corpus)</span><span className="font-bold text-emerald-700">Rs. {fmtLakhs(result.totalCostPaidFromCorpus)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Remaining Corpus</span><span className="font-bold text-emerald-700">Rs. {fmtLakhs(result.finalCorpus)}</span></div>
                      <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-bold"><span className="text-emerald-700">Total Value Created</span><span className="text-emerald-800">Rs. {fmtLakhs(result.totalCostPaidFromCorpus + result.finalCorpus)}</span></div>
                    </div>
                  </div>
                </div>
                <div className={cn('mt-4 rounded-lg p-4 text-center border', result.netBenefit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">NET BENEFIT</div>
                  <div className={cn('text-2xl font-extrabold', result.netBenefit >= 0 ? 'text-green-700' : 'text-red-700')}>Rs. {fmtLakhs(Math.abs(result.netBenefit))}</div>
                  <div className="text-xs text-slate-500 mt-1">{result.netBenefit >= 0 ? 'Your SIP strategy creates wealth beyond covering your costs' : 'Consider increasing SIP amount or duration'}</div>
                </div>
              </div>

              {/* Row 5: Year-by-Year Table */}
              <div className="card-base p-5">
                <button type="button" onClick={() => setShowYearlyTable(!showYearlyTable)} className="w-full flex items-center justify-between text-sm font-bold text-slate-800" data-pdf-hide>
                  <span>Year-by-Year Breakdown</span>
                  {showYearlyTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showYearlyTable && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 px-1.5 text-left font-bold text-slate-600">Year</th>
                          <th className="py-2 px-1.5 text-left font-bold text-slate-600">Age</th>
                          <th className="py-2 px-1.5 text-left font-bold text-slate-600">Phase</th>
                          <th className="py-2 px-1.5 text-right font-bold text-slate-600">SIP Inflow</th>
                          <th className="py-2 px-1.5 text-right font-bold text-red-600">Cost (Pocket)</th>
                          <th className="py-2 px-1.5 text-right font-bold text-emerald-600">Cost (Corpus)</th>
                          <th className="py-2 px-1.5 text-right font-bold text-slate-600">Returns</th>
                          <th className="py-2 px-1.5 text-left font-bold text-slate-600">Lumpsum</th>
                          <th className="py-2 px-1.5 text-right font-bold text-slate-600">Year-End Corpus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearlyDetails.map((row: YearlyDetail) => (
                          <tr key={row.year} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-1.5 px-1.5">{row.year}</td>
                            <td className="py-1.5 px-1.5">{row.age}</td>
                            <td className="py-1.5 px-1.5"><span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-bold', phaseColor(row.phase))}>{phaseLabel(row.phase)}</span></td>
                            <td className="py-1.5 px-1.5 text-right font-mono">{row.sipInflow > 0 ? formatNumber(Math.round(row.sipInflow)) : '-'}</td>
                            <td className="py-1.5 px-1.5 text-right font-mono text-red-600">{row.costPaidFromPocket > 0 ? formatNumber(Math.round(row.costPaidFromPocket)) : '-'}</td>
                            <td className="py-1.5 px-1.5 text-right font-mono text-emerald-600">{row.costPaidFromCorpus > 0 ? formatNumber(Math.round(row.costPaidFromCorpus)) : '-'}</td>
                            <td className="py-1.5 px-1.5 text-right font-mono">{formatNumber(Math.round(row.returnEarned))}</td>
                            <td className="py-1.5 px-1.5 text-[10px] truncate max-w-[100px]">{row.lumpsumEvent || '-'}</td>
                            <td className="py-1.5 px-1.5 text-right font-mono font-bold">{formatNumber(Math.round(row.yearEndCorpus))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Row 6: CFP Insights */}
              {result.insights.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">CFP Insights</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.insights.map((ins, i) => {
                      const s = INSIGHT_STYLES[ins.type];
                      return (
                        <div key={i} className={cn('rounded-lg border p-3', s.bg, s.border)}>
                          <div className={cn('text-xs font-bold mb-1', s.text)}>{ins.title}</div>
                          <div className={cn('text-[11px] leading-relaxed', s.text)}>{ins.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row 7: How SIP Shield Works */}
              <div className="card-base p-5">
                <button type="button" onClick={() => setShowHowItWorks(!showHowItWorks)} className="w-full flex items-center justify-between text-sm font-bold text-slate-800" data-pdf-hide>
                  <span>How SIP Shield Works</span>
                  {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showHowItWorks && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-3">
                      {[
                        { step: 1, title: 'Start a SIP alongside your premium/EMI', desc: 'Begin a monthly SIP in a diversified equity mutual fund while continuing to pay your recurring cost from your income.' },
                        { step: 2, title: 'Your SIP corpus grows through compounding', desc: 'Over 10-15 years, your systematic investments compound significantly — the longer you stay, the more powerful the effect.' },
                        { step: 3, title: 'Corpus starts paying your premiums/EMIs', desc: 'After the SIP + growth period, you initiate systematic withdrawals (SWP) from your corpus to cover your recurring cost.' },
                        { step: 4, title: 'You stop paying from pocket', desc: 'Your money works for you. The corpus not only pays your costs but continues to grow, potentially leaving you with bonus wealth.' },
                      ].map(item => (
                        <div key={item.step} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{item.step}</div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{item.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-brand-50 border border-brand-200 p-4">
                      <div className="text-xs font-bold text-brand-800 mb-2">Who benefits most?</div>
                      <ul className="space-y-1 text-[11px] text-brand-700">
                        <li className="flex items-start gap-1.5"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />Term plan holders paying Rs.15,000-50,000/year for 30+ years</li>
                        <li className="flex items-start gap-1.5"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />Home loan borrowers with 15-20 year EMIs</li>
                        <li className="flex items-start gap-1.5"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />Endowment/ULIP policyholders who want better returns alongside</li>
                        <li className="flex items-start gap-1.5"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />Anyone with long-term recurring financial commitments</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 8: Disclaimer */}
              <div className="card-base p-4 bg-slate-50">
                <p className="text-[10px] text-slate-400 leading-relaxed">{DISCLAIMER.mutual_fund}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{DISCLAIMER.general}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{DISCLAIMER.amfi}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
