'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Heart, AlertTriangle, Activity, TrendingUp, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// Premium rate per ₹1L cover per year, by age band (non-smoker)
const RATE_BANDS: { min: number; max: number; rate: number }[] = [
  { min: 25, max: 29, rate: 250 },
  { min: 30, max: 34, rate: 400 },
  { min: 35, max: 39, rate: 600 },
  { min: 40, max: 44, rate: 1000 },
  { min: 45, max: 49, rate: 1500 },
  { min: 50, max: 54, rate: 2500 },
  { min: 55, max: 60, rate: 4000 },
];

function rateForAge(age: number): number {
  const band = RATE_BANDS.find((b) => age >= b.min && age <= b.max);
  if (band) return band.rate;
  if (age < 25) return 250;
  return 4000;
}

function annualPremium(cover: number, age: number, smoker: boolean): number {
  const rate = rateForAge(age) * (smoker ? 1.4 : 1);
  return (cover / 100000) * rate;
}

export default function CriticalIllnessPlannerPage() {
  // Personal details
  const [clientName, setClientName] = useState('');
  const [currentAge, setCurrentAge] = useState<number | null>(35);

  // Inputs
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [monthlyExpense, setMonthlyExpense] = useState(60000);
  const [dependents, setDependents] = useState(2);
  const [existingSavings, setExistingSavings] = useState(300000);
  const [existingCI, setExistingCI] = useState(0);
  const [treatmentCost, setTreatmentCost] = useState(2000000);
  const [medInflation, setMedInflation] = useState(10);
  const [horizon, setHorizon] = useState(10);
  const [monthsOff, setMonthsOff] = useState(12);
  const [isSmoker, setIsSmoker] = useState(false);

  const age = currentAge ?? 35;

  const result = useMemo(() => {
    const inflatedCost = treatmentCost * Math.pow(1 + medInflation / 100, horizon);
    const incomeReplacement = monthsOff * monthlyExpense;
    const buffer = 6 * monthlyExpense;
    const totalNeed = inflatedCost + incomeReplacement + buffer;
    const usableSavings = Math.max(0, existingSavings - buffer);
    const gapRaw = totalNeed - existingCI - usableSavings;
    const gap = Math.max(0, gapRaw);

    const annualIncome = monthlyIncome * 12;
    const incomeCap = 10 * annualIncome;
    const coverFloor = 2500000;
    const recommendedCover = Math.min(Math.max(gap, coverFloor), incomeCap);

    const annualPrem = annualPremium(recommendedCover, age, isSmoker);
    const monthlyPrem = annualPrem / 12;

    return {
      inflatedCost,
      incomeReplacement,
      buffer,
      totalNeed,
      gap,
      gapRaw,
      recommendedCover,
      annualPrem,
      monthlyPrem,
      annualIncome,
    };
  }, [treatmentCost, medInflation, horizon, monthsOff, monthlyExpense, existingSavings, existingCI, monthlyIncome, age, isSmoker]);

  // Chart: Have vs Need
  const haveVsNeedData = [
    { name: 'Existing CI', value: Math.round(existingCI), fill: '#3B82F6' },
    { name: 'Recommended', value: Math.round(result.recommendedCover), fill: '#E11D48' },
  ];

  // Chart: Premium by age (current, +5, +10, +15)
  const premiumByAgeData = useMemo(() => {
    return [0, 5, 10, 15].map((offset) => {
      const a = age + offset;
      const capped = Math.min(a, 60);
      const prem = annualPremium(result.recommendedCover, capped, isSmoker) / 12;
      return {
        name: offset === 0 ? `Age ${a}` : `+${offset}y (Age ${a})`,
        value: Math.round(prem),
      };
    });
  }, [age, result.recommendedCover, isSmoker]);

  // Insights
  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; color: string }[] = [];

    const nowPrem = result.monthlyPrem;
    const futureAge = Math.min(age + 5, 60);
    const futurePrem = annualPremium(result.recommendedCover, futureAge, isSmoker) / 12;
    if (futurePrem > nowPrem) {
      items.push({
        icon: <TrendingUp className="w-5 h-5 text-orange-600 shrink-0" />,
        text: `Delay cost: Waiting 5 years raises your monthly premium from ${formatINR(Math.round(nowPrem))} to ${formatINR(Math.round(futurePrem))}. Lock in today's age-band rate now.`,
        color: 'bg-orange-50 border-orange-200',
      });
    }

    if (result.gap > 0) {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />,
        text: `You are underinsured by ${formatINR(Math.round(result.gap))}. A single critical illness could wipe out your retirement corpus and force your family to liquidate long-term investments.`,
        color: 'bg-red-50 border-red-200',
      });
    } else if (existingCI >= result.totalNeed * 0.8) {
      items.push({
        icon: <Shield className="w-5 h-5 text-green-600 shrink-0" />,
        text: `Your existing CI cover of ${formatINR(existingCI)} adequately protects against the estimated need of ${formatINR(Math.round(result.totalNeed))}. Review every 3-5 years.`,
        color: 'bg-green-50 border-green-200',
      });
    }

    if (isSmoker) {
      const nonSmokerPrem = annualPremium(result.recommendedCover, age, false) / 12;
      items.push({
        icon: <Activity className="w-5 h-5 text-rose-600 shrink-0" />,
        text: `Smoker surcharge: Non-smoker at age ${age} pays ${formatINR(Math.round(nonSmokerPrem))}/mo vs your ${formatINR(Math.round(nowPrem))}/mo — a 40% higher lifetime cost.`,
        color: 'bg-rose-50 border-rose-200',
      });
    }

    items.push({
      icon: <Heart className="w-5 h-5 text-blue-600 shrink-0" />,
      text: `Medical inflation at ${medInflation}% means today's ${formatINR(treatmentCost)} treatment will cost ${formatINR(Math.round(result.inflatedCost))} in ${horizon} years. CI cover must be inflation-adjusted.`,
      color: 'bg-blue-50 border-blue-200',
    });

    return items;
  }, [result, age, isSmoker, existingCI, treatmentCost, medInflation, horizon]);

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
              <Heart className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Critical Illness &amp; Disability Cover Planner</h1>
              <p className="text-slate-300 mt-1">Size your CI cover based on treatment costs, income loss, and existing policies</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <PersonalInfoBar
              name={clientName}
              onNameChange={setClientName}
              age={currentAge}
              onAgeChange={setCurrentAge}
              ageLabel="Current Age"
              showAge={true}
            />
            <DownloadPDFButton
              elementId="calculator-results"
              title="Critical Illness Plan"
              fileName={`CI-Plan-${clientName || 'Plan'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─── Inputs Panel ─── */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your Details</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Income &amp; Expenses</label>
                  <div className="space-y-4">
                    <NumberInput label="Monthly Take-Home" value={monthlyIncome} onChange={setMonthlyIncome} prefix="₹" step={5000} min={10000} max={5000000} />
                    <NumberInput label="Monthly Household Expenses" value={monthlyExpense} onChange={setMonthlyExpense} prefix="₹" step={5000} min={10000} max={2000000} />
                    <NumberInput label="Dependents" value={dependents} onChange={setDependents} suffix="ppl" step={1} min={0} max={6} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Existing Buffers</label>
                  <div className="space-y-4">
                    <NumberInput label="Existing Savings" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={50000} min={0} max={50000000} hint="Emergency fund + liquid savings" />
                    <NumberInput label="Existing CI Cover" value={existingCI} onChange={setExistingCI} prefix="₹" step={500000} min={0} max={50000000} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Treatment &amp; Inflation</label>
                  <div className="space-y-4">
                    <NumberInput label="Treatment Cost Today" value={treatmentCost} onChange={setTreatmentCost} prefix="₹" step={100000} min={500000} max={20000000} hint="Typical major illness (cancer, heart, kidney)" />
                    <NumberInput label="Medical Inflation" value={medInflation} onChange={setMedInflation} suffix="%" step={0.5} min={6} max={15} />
                    <NumberInput label="Planning Horizon" value={horizon} onChange={setHorizon} suffix="Years" step={1} min={1} max={30} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Disability &amp; Risk</label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Months Off Work</label>
                        <span className="text-sm font-bold text-primary-700">{monthsOff} months</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={36}
                        step={1}
                        value={monthsOff}
                        onChange={(e) => setMonthsOff(Number(e.target.value))}
                        className="w-full accent-rose-600"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>3m</span><span>36m</span>
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-100 cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-slate-700">Smoker / Tobacco User</div>
                        <div className="text-[11px] text-slate-500">~40% higher premium</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSmoker}
                        onChange={(e) => setIsSmoker(e.target.checked)}
                        className="w-5 h-5 accent-rose-600"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Results ─── */}
            <div className="space-y-6">
              {/* Hero card */}
              <div className="card-base p-6 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 border-rose-200/50" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-rose-600" />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Recommended CI Cover</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-rose-700 mb-4">
                  {formatINR(Math.round(result.recommendedCover))}
                  <span className="text-base font-semibold text-slate-500 ml-2">
                    (≈ ₹{(result.recommendedCover / 100000).toFixed(0)} L)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Current Gap</div>
                    <div className={cn('text-lg font-bold', result.gap > 0 ? 'text-red-600' : 'text-green-600')}>
                      {result.gap > 0 ? formatINR(Math.round(result.gap)) : 'Nil'}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Est. Premium</div>
                    <div className="text-lg font-bold text-primary-700">
                      {formatINR(Math.round(result.monthlyPrem))}<span className="text-xs text-slate-500 font-medium">/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 metric tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-pdf-keep-together>
                <div className="card-base p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Treatment Cost</span>
                  </div>
                  <div className="text-lg font-bold text-rose-700">{formatINR(Math.round(result.inflatedCost))}</div>
                  <div className="text-[10px] text-slate-400">in {horizon}y</div>
                </div>
                <div className="card-base p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Income Replacement</span>
                  </div>
                  <div className="text-lg font-bold text-orange-700">{formatINR(Math.round(result.incomeReplacement))}</div>
                  <div className="text-[10px] text-slate-400">{monthsOff} months</div>
                </div>
                <div className="card-base p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Need</span>
                  </div>
                  <div className="text-lg font-bold text-purple-700">{formatINR(Math.round(result.totalNeed))}</div>
                  <div className="text-[10px] text-slate-400">incl. 6m buffer</div>
                </div>
                <div className="card-base p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className={cn('w-3.5 h-3.5', result.gap > 0 ? 'text-red-600' : 'text-green-600')} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Gap</span>
                  </div>
                  <div className={cn('text-lg font-bold', result.gap > 0 ? 'text-red-600' : 'text-green-600')}>
                    {result.gap > 0 ? formatINR(Math.round(result.gap)) : 'Nil'}
                  </div>
                  <div className="text-[10px] text-slate-400">after offsets</div>
                </div>
              </div>

              {/* Have vs Need Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Have vs Need</h3>
                <p className="text-sm text-slate-500 mb-6">Existing CI cover compared to your recommended cover</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={haveVsNeedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Cover']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {haveVsNeedData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Premium by Age Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Premium Escalation by Age</h3>
                <p className="text-sm text-slate-500 mb-6">Monthly premium for the same cover if you buy now, in 5, 10, or 15 years</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={premiumByAgeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip
                        formatter={(value: number) => [`${formatINR(value)}/mo`, 'Premium']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Actionable Insights</h3>
                <div className="space-y-3">
                  {insights.map((item, idx) => (
                    <div key={idx} className={cn('flex items-start gap-3 p-4 rounded-lg border', item.color)}>
                      {item.icon}
                      <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CFP Note */}
              <div className="card-base p-6 bg-gradient-to-br from-brand-50 to-teal-50 border-brand-200/40" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-2">CFP Note</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Critical Illness cover is India&apos;s most underinsured risk. A ₹25L plan for a 35-yo non-smoker costs ₹6–12k/year — the price of 1–2 dinners. The alternative is wiping out 10 years of SIP investments. Speak to your Relationship Manager about standalone CI plans vs riders, and consider a disability income rider if your family depends on a single breadwinner.
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
        calculatorName="Critical Illness Planner"
        accent="rose"
        resultContext={`CI gap ₹${Math.round(result.gap / 100000)}L, est premium ₹${Math.round(result.monthlyPrem)}/mo`}
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator}
          </p>
        </div>
      </section>
    </>
  );
}
