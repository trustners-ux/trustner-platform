'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft, TrendingUp, Shield, IndianRupee, CheckCircle2, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { calculateTermPlanSIP } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  corpus: '#0D9488',
  invested: '#0F766E',
  sumAssured: '#7C3AED',
  regularPremium: '#0F766E',
  sipCorpus: '#34D399',
  limitedPremium: '#8B5CF6',
};

const VERDICT_CONFIG = {
  wins: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  exact: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    icon: CheckCircle2,
    iconColor: 'text-amber-600',
  },
  shortfall: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
};

export default function TermPlanSIPCalculatorPage() {
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);
  const [policyTerm, setPolicyTerm] = useState(30);
  const [regularPremium, setRegularPremium] = useState(15000);
  const [limitedPremium, setLimitedPremium] = useState(30000);
  const [limitedPayPeriod, setLimitedPayPeriod] = useState(10);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('yearly');
  const [accReturn, setAccReturn] = useState(12);
  const [distReturn, setDistReturn] = useState(8);
  const [sumAssured, setSumAssured] = useState(10000000);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extraLumpsum, setExtraLumpsum] = useState(0);
  const [lumpsumYear, setLumpsumYear] = useState(1);

  // Max policy term = 100 - current age (if age provided), else 50
  const maxPolicyTerm = investorAge !== null ? Math.max(10, 100 - investorAge) : 50;

  // When age changes, adjust policy term if it exceeds new max
  const handleAgeChange = (age: number | null) => {
    setInvestorAge(age);
    if (age !== null) {
      const newMax = Math.max(10, 100 - age);
      if (policyTerm > newMax) {
        setPolicyTerm(newMax);
        if (limitedPayPeriod >= newMax) {
          setLimitedPayPeriod(Math.max(5, newMax - 1));
        }
      }
    }
  };

  // Ensure limited pay period < policy term
  const handleLimitedPayChange = (val: number) => {
    setLimitedPayPeriod(Math.min(val, policyTerm - 1));
  };

  const handlePolicyTermChange = (val: number) => {
    const clamped = Math.min(val, maxPolicyTerm);
    setPolicyTerm(clamped);
    if (limitedPayPeriod >= clamped) {
      setLimitedPayPeriod(clamped - 1);
    }
  };

  // Helper for year/age labels
  const yearLabel = (year: number) =>
    investorAge !== null ? `Age ${investorAge + year}` : `Yr ${year}`;
  const displayName = investorName.trim() || '';

  const result = useMemo(
    () => calculateTermPlanSIP(
      policyTerm, regularPremium, limitedPremium, limitedPayPeriod,
      accReturn, distReturn, frequency, extraLumpsum, lumpsumYear
    ),
    [policyTerm, regularPremium, limitedPremium, limitedPayPeriod, accReturn, distReturn, frequency, extraLumpsum, lumpsumYear]
  );

  const premiumDiff = Math.max(0, limitedPremium - regularPremium);
  const verdictConfig = VERDICT_CONFIG[result.verdict];
  const VerdictIcon = verdictConfig.icon;

  // ── Chart 1: Comparison bar chart — Regular Pay + SIP Corpus vs Limited Pay (side by side) ──
  const comparisonChartData = result.yearlyData.map((row) => ({
    year: yearLabel(row.year),
    'Regular Premium': row.regularPremium,
    'SIP Corpus': row.corpusValue,
    'Limited Premium': row.limitedPremium,
    'Life Cover': sumAssured,
  }));

  // ── Chart 2: Corpus journey area chart ──
  let cumInvested = 0;
  const corpusChartData = result.yearlyData.map((row) => {
    cumInvested += row.sipInvestment;
    return {
      year: yearLabel(row.year),
      corpus: row.corpusValue,
      totalInvested: Math.round(cumInvested),
      sumAssured: sumAssured,
      phase: row.phase,
    };
  });

  const namePrefix = displayName ? `${displayName}, ` : '';
  const verdictText = result.verdict === 'wins'
    ? `${namePrefix}Regular Pay + SIP wins by ${formatINR(result.remainingCorpusAtMaturity)}`
    : result.verdict === 'exact'
      ? `${namePrefix}Regular Pay + SIP exactly funded all premiums!`
      : `${namePrefix}SIP corpus lasted ${result.corpusLasts} years — consider higher returns or longer accumulation`;

  const verdictSubtext = result.verdict === 'wins'
    ? `After funding all regular premiums from ${yearLabel(limitedPayPeriod + 1)} to ${yearLabel(policyTerm)}, ${displayName ? displayName + ' still has' : 'you still have'} a bonus corpus of ${formatINR(result.remainingCorpusAtMaturity)} at maturity.`
    : result.verdict === 'exact'
      ? 'The SIP corpus was just enough to fund every premium payment through the policy term.'
      : `The corpus depleted before the policy ended. Try increasing the accumulation return rate or adding a lumpsum to bridge the gap.`;

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
              <Scale className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">Term Plan: Regular Pay + SIP vs Limited Pay</h1>
              <p className="text-slate-300 mt-1">Prove that Regular Pay + SIP beats Limited Pay — see your bonus corpus at maturity</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Trustner Exclusive</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ───── Input Panel ───── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Plan Comparison</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={handleAgeChange}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-5">
                {/* Policy & Cover */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Policy Details</p>
                  <div className="space-y-4">
                    <NumberInput label="Sum Assured / Life Cover" value={sumAssured} onChange={setSumAssured} prefix="₹" step={500000} min={500000} max={100000000} hint="Same life cover for both Regular & Limited Pay plans" />
                    <NumberInput
                      label={investorAge !== null ? `Policy Term (cover till age ${investorAge + policyTerm})` : 'Policy Term'}
                      value={policyTerm}
                      onChange={handlePolicyTermChange}
                      suffix="Years"
                      step={1}
                      min={10}
                      max={maxPolicyTerm}
                    />
                    <NumberInput label="Regular Pay Annual Premium" value={regularPremium} onChange={setRegularPremium} prefix="₹" step={1000} min={5000} max={500000} />
                    <NumberInput label="Limited Pay Annual Premium" value={limitedPremium} onChange={setLimitedPremium} prefix="₹" step={1000} min={5000} max={1000000} />
                    <NumberInput label="Limited Pay Period" value={limitedPayPeriod} onChange={handleLimitedPayChange} suffix="Years" step={1} min={5} max={policyTerm - 1} />
                  </div>
                </div>

                {/* Frequency Toggle */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Premium Frequency</p>
                  <div className="flex rounded-lg border border-surface-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFrequency('monthly')}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium transition-colors',
                        frequency === 'monthly' ? 'bg-brand text-white' : 'bg-white text-slate-600 hover:bg-surface-50'
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('yearly')}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium transition-colors',
                        frequency === 'yearly' ? 'bg-brand text-white' : 'bg-white text-slate-600 hover:bg-surface-50'
                      )}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* Return Rates */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Return Rates</p>
                  <div className="space-y-4">
                    <NumberInput label="Accumulation Phase Return" value={accReturn} onChange={setAccReturn} suffix="% p.a." step={0.5} min={8} max={25} hint={`SIP growth rate during ${yearLabel(1)}–${yearLabel(limitedPayPeriod)}`} />
                    <NumberInput label="Distribution Phase Return" value={distReturn} onChange={setDistReturn} suffix="% p.a." step={0.5} min={4} max={25} hint={`Corpus growth rate during ${yearLabel(limitedPayPeriod + 1)}–${yearLabel(policyTerm)}`} />
                  </div>
                </div>

                {/* Phase Visual */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-teal-50 rounded-lg px-3 py-2 text-center">
                    <div className="text-[10px] text-teal-700 font-medium uppercase">Accumulation</div>
                    <div className="text-sm font-bold text-teal-700">{limitedPayPeriod} Yrs</div>
                    {investorAge !== null && <div className="text-[10px] text-teal-500">Age {investorAge + 1}–{investorAge + limitedPayPeriod}</div>}
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
                    <div className="text-[10px] text-amber-700 font-medium uppercase">Distribution</div>
                    <div className="text-sm font-bold text-amber-700">{policyTerm - limitedPayPeriod} Yrs</div>
                    {investorAge !== null && <div className="text-[10px] text-amber-500">Age {investorAge + limitedPayPeriod + 1}–{investorAge + policyTerm}</div>}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="border border-surface-300 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-600">Advanced Options</span>
                    <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showAdvanced && 'rotate-180')} />
                  </button>
                  {showAdvanced && (
                    <div className="px-4 py-4 space-y-4 border-t border-surface-300">
                      <NumberInput label="Extra Lumpsum Investment" value={extraLumpsum} onChange={setExtraLumpsum} prefix="₹" step={10000} min={0} max={5000000} hint="One-time additional investment into SIP corpus" />
                      {extraLumpsum > 0 && (
                        <NumberInput label="Lumpsum in Year" value={lumpsumYear} onChange={(v) => setLumpsumYear(Math.min(Math.round(v), limitedPayPeriod))} suffix={`of ${limitedPayPeriod}`} step={1} min={1} max={limitedPayPeriod} />
                      )}
                    </div>
                  )}
                </div>

                {/* SIP Amount Display */}
                <div className="bg-brand-50 rounded-xl p-4 border border-brand/20">
                  <p className="text-[11px] font-bold text-brand uppercase tracking-wider">{displayName ? `${displayName}'s SIP Amount` : 'Your SIP Amount'}</p>
                  <p className="text-2xl font-extrabold text-brand mt-1">
                    {frequency === 'monthly' ? `${formatINR(Math.round(premiumDiff / 12))}/mo` : `${formatINR(premiumDiff)}/yr`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Premium difference ({formatINR(limitedPremium)} − {formatINR(regularPremium)}) invested in SIP
                  </p>
                </div>
              </div>
            </div>

            {/* ───── Results Panel ───── */}
            <div className="space-y-6">

              {/* Verdict Banner */}
              <div className={cn('card-base p-6 border-l-4', verdictConfig.bg, verdictConfig.border)}>
                <div className="flex items-start gap-3">
                  <VerdictIcon className={cn('w-7 h-7 flex-shrink-0 mt-0.5', verdictConfig.iconColor)} />
                  <div>
                    <h3 className={cn('text-xl font-extrabold', verdictConfig.text)}>{verdictText}</h3>
                    <p className="text-sm text-slate-600 mt-1">{verdictSubtext}</p>
                  </div>
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Regular Pay + SIP */}
                <div className="card-base p-5 border-t-4 border-teal-500">
                  <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Regular Pay + SIP</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Life Cover</p>
                      <p className="text-lg font-bold text-violet-700">{formatINR(sumAssured)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Total Premiums Paid</p>
                      <p className="text-lg font-bold text-slate-800">{formatINR(result.totalRegularPremiums)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">SIP Corpus at Switch</p>
                      <p className="text-lg font-bold text-teal-700">{formatINR(result.sipCorpusAtSwitch)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Total SIP Invested</p>
                      <p className="text-sm font-medium text-slate-600">{formatINR(result.totalSIPInvested)}</p>
                    </div>
                  </div>
                </div>

                {/* Limited Pay */}
                <div className="card-base p-5 border-t-4 border-violet-500">
                  <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Limited Pay</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Life Cover</p>
                      <p className="text-lg font-bold text-violet-700">{formatINR(sumAssured)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Total Premiums Paid</p>
                      <p className="text-lg font-bold text-slate-800">{formatINR(result.totalLimitedPremiums)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Premium Period</p>
                      <p className="text-lg font-bold text-violet-700">{limitedPayPeriod} Years</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">No SIP Corpus</p>
                      <p className="text-sm font-medium text-slate-400">₹0</p>
                    </div>
                  </div>
                </div>

                {/* Bonus / Result */}
                <div className={cn(
                  'card-base p-5 border-t-4',
                  result.verdict === 'wins' ? 'border-emerald-500' : result.verdict === 'exact' ? 'border-amber-500' : 'border-red-500'
                )}>
                  <p className={cn(
                    'text-[11px] font-bold uppercase tracking-wider',
                    result.verdict === 'wins' ? 'text-emerald-600' : result.verdict === 'exact' ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {result.verdict === 'wins' ? (displayName ? `${displayName}'s Bonus` : 'Your Bonus') : result.verdict === 'exact' ? 'Break Even' : 'Shortfall'}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Corpus at Maturity</p>
                      <p className={cn(
                        'text-2xl font-extrabold',
                        result.verdict === 'wins' ? 'text-emerald-700' : result.verdict === 'exact' ? 'text-amber-700' : 'text-red-700'
                      )}>
                        {formatINR(result.remainingCorpusAtMaturity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Premiums Funded by SIP</p>
                      <p className="text-sm font-medium text-slate-600">{formatINR(result.totalWithdrawnForPremiums)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Corpus Sustains</p>
                      <p className="text-sm font-medium text-slate-600">
                        {result.verdict === 'shortfall' ? `${result.corpusLasts} Years` : `Full ${policyTerm} Years`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase Timeline */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-3">
                  {displayName ? `${displayName}'s Policy Timeline` : 'Policy Timeline'}
                  {sumAssured > 0 && <span className="text-xs font-normal text-violet-600 ml-2">Life Cover: {formatINR(sumAssured)}</span>}
                </h3>
                <div className="relative">
                  <div className="flex h-10 rounded-lg overflow-hidden">
                    <div
                      className="bg-teal-500 flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ width: `${(limitedPayPeriod / policyTerm) * 100}%` }}
                    >
                      Accumulation ({limitedPayPeriod} yrs)
                    </div>
                    <div
                      className="bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ width: `${((policyTerm - limitedPayPeriod) / policyTerm) * 100}%` }}
                    >
                      Distribution ({policyTerm - limitedPayPeriod} yrs)
                    </div>
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                    <span>{yearLabel(1)}</span>
                    <span>{yearLabel(limitedPayPeriod)}</span>
                    <span>{yearLabel(policyTerm)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-teal-500" />
                    <span className="text-slate-600">SIP grows with premium difference</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-slate-600">Corpus funds regular premiums</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-violet-500" />
                    <span className="text-slate-600">Life Cover: {formatINR(sumAssured)}</span>
                  </span>
                </div>
              </div>

              {/* ── Chart: Regular Pay + SIP Corpus vs Limited Pay (stacked bar) ── */}
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Regular Pay + SIP vs Limited Pay</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Year-by-year comparison with life cover reference</p>
                  </div>
                  <DownloadPDFButton elementId="calculator-results" title="Term Plan: Regular Pay + SIP vs Limited Pay" fileName="Term-Plan-SIP-Calculator" />
                </div>
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(policyTerm / 8) - 1)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name]}
                        labelStyle={{ fontWeight: 600 }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {/* Regular Pay premium (bottom of first stack) */}
                      <Bar dataKey="Regular Premium" stackId="regular" fill={COLORS.regularPremium} radius={[0, 0, 0, 0]} />
                      {/* SIP Corpus (top of first stack) */}
                      <Bar dataKey="SIP Corpus" stackId="regular" fill={COLORS.sipCorpus} radius={[4, 4, 0, 0]} />
                      {/* Limited Pay premium (separate bar) */}
                      <Bar dataKey="Limited Premium" stackId="limited" fill={COLORS.limitedPremium} radius={[4, 4, 0, 0]} />
                      {/* Life Cover / Sum Assured reference line */}
                      <ReferenceLine
                        y={sumAssured}
                        stroke={COLORS.sumAssured}
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{ value: `Life Cover: ${formatINR(sumAssured)}`, position: 'insideTopRight', fill: COLORS.sumAssured, fontSize: 11, fontWeight: 600 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Chart: SIP Corpus Journey (area) ── */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">SIP Corpus Journey</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={corpusChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.corpus} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.corpus} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(policyTerm / 8) - 1)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = { corpus: 'SIP Corpus', totalInvested: 'Total SIP Invested', sumAssured: 'Life Cover' };
                          return [formatINR(value), labels[name] || name];
                        }}
                        labelStyle={{ fontWeight: 600 }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                      />
                      <ReferenceLine
                        x={yearLabel(limitedPayPeriod)}
                        stroke="#D97706"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'Phase Switch', position: 'top', fill: '#D97706', fontSize: 11 }}
                      />
                      {/* Sum Assured / Life Cover horizontal line */}
                      <ReferenceLine
                        y={sumAssured}
                        stroke={COLORS.sumAssured}
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{ value: `Life Cover`, position: 'insideTopRight', fill: COLORS.sumAssured, fontSize: 11, fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="totalInvested" stroke={COLORS.invested} fill="url(#colorInvested)" strokeWidth={1.5} name="totalInvested" />
                      <Area type="monotone" dataKey="corpus" stroke={COLORS.corpus} fill="url(#colorCorpus)" strokeWidth={2} name="corpus" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-5 border-b border-surface-200">
                  <h3 className="text-sm font-bold text-slate-700">Year-by-Year Breakdown</h3>
                </div>
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface-50">
                      <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="text-left py-3 px-4 font-bold">{investorAge !== null ? 'Age' : 'Year'}</th>
                        <th className="text-left py-3 px-3 font-bold">Phase</th>
                        <th className="text-right py-3 px-3 font-bold">Regular Premium</th>
                        <th className="text-right py-3 px-3 font-bold">Limited Premium</th>
                        <th className="text-right py-3 px-3 font-bold">SIP / Withdrawal</th>
                        <th className="text-right py-3 px-3 font-bold">Interest</th>
                        <th className="text-right py-3 px-4 font-bold">Corpus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => (
                        <tr
                          key={row.year}
                          className={cn(
                            'border-t border-surface-100 hover:bg-surface-50 transition-colors',
                            row.phase === 'accumulation' ? 'bg-teal-50/30' : 'bg-amber-50/30'
                          )}
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-700">
                            {investorAge !== null ? `${investorAge + row.year}` : row.year}
                            {investorAge !== null && <span className="text-[10px] text-slate-400 ml-1">(Yr {row.year})</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                              row.phase === 'accumulation' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {row.phase === 'accumulation' ? 'SIP' : 'SWP'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(row.regularPremium)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {row.limitedPremium > 0 ? formatINR(row.limitedPremium) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className={cn('py-2.5 px-3 text-right font-medium', row.phase === 'accumulation' ? 'text-teal-700' : 'text-amber-700')}>
                            {row.phase === 'accumulation'
                              ? `+${formatINR(row.sipInvestment)}`
                              : row.withdrawal > 0 ? `−${formatINR(row.withdrawal)}` : <span className="text-slate-300">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600">
                            {row.interestEarned > 0 ? `+${formatINR(row.interestEarned)}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatINR(row.corpusValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Numbers Summary */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">
                  {displayName ? `${displayName}'s Key Numbers` : 'Key Numbers'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Life Cover</p>
                    <p className="text-lg font-bold text-violet-700 mt-1">{formatINR(sumAssured)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Premium Saved</p>
                    <p className="text-lg font-bold text-brand mt-1">{formatINR(result.premiumDifferenceSaved)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">SIP Corpus at Switch</p>
                    <p className="text-lg font-bold text-teal-700 mt-1">{formatINR(result.sipCorpusAtSwitch)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Premiums Funded</p>
                    <p className="text-lg font-bold text-amber-700 mt-1">{formatINR(result.totalWithdrawnForPremiums)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bonus at Maturity</p>
                    <p className={cn('text-lg font-bold mt-1', result.verdict === 'wins' ? 'text-emerald-700' : 'text-red-700')}>
                      {formatINR(result.remainingCorpusAtMaturity)}
                    </p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">How This Calculator Works</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Accumulation Phase</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {displayName || 'You'} pay{displayName ? 's' : ''} Regular Pay premium and invest{displayName ? 's' : ''} the difference ({formatINR(premiumDiff)}/yr) as SIP for {limitedPayPeriod} years at {accReturn}% returns.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <IndianRupee className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Distribution Phase</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        From {yearLabel(limitedPayPeriod + 1)}, the SIP corpus funds Regular Pay premiums ({formatINR(regularPremium)}/yr) while growing at {distReturn}%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expert Tips */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Expert Insights</h3>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', text: 'The power of compounding makes even small premium differences grow into substantial corpora over 10-15 years of SIP accumulation.' },
                    { icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50', text: `Both Regular Pay and Limited Pay offer identical life cover of ${formatINR(sumAssured)}. The only difference is how you pay — and where your money works harder for you.` },
                    { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', text: 'Market returns are not guaranteed. The accumulation phase uses equity-based growth — actual returns may vary. Use conservative estimates for planning.' },
                    { icon: Lightbulb, color: 'text-brand', bg: 'bg-brand-50', text: 'Talk to a Trustner financial advisor to find the right SIP strategy and term plan combination based on your risk profile and goals.' },
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', tip.bg)}>
                        <tip.icon className={cn('w-4 h-4', tip.color)} />
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="card-base p-4 bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-400 leading-relaxed">{DISCLAIMER.mutual_fund} {DISCLAIMER.general}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
