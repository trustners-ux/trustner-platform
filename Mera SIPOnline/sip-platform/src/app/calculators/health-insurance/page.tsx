'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, HeartPulse, ShieldCheck, TrendingUp, AlertTriangle, Users, Building2, Stethoscope, Lightbulb } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

/* ─── Constants ─── */

const COLORS = {
  teal: '#0D9488',
  cyan: '#06B6D4',
  emerald: '#059669',
  red: '#EF4444',
  amber: '#F59E0B',
  blue: '#2563EB',
  purple: '#7C3AED',
  slate: '#64748B',
};

const PIE_COLORS = ['#0D9488', '#06B6D4', '#059669', '#F59E0B', '#7C3AED'];

type CityTier = 'tier1' | 'tier2' | 'tier3';
type FamilySize = 'self' | 'couple' | 'family3' | 'family4' | 'parents';
type HospitalType = 'economy' | 'standard' | 'premium' | 'super_premium';

const CITY_TIERS: { key: CityTier; label: string; sub: string; multiplier: number }[] = [
  { key: 'tier1', label: 'Tier 1', sub: 'Metro', multiplier: 1.0 },
  { key: 'tier2', label: 'Tier 2', sub: 'Pune, Jaipur', multiplier: 0.75 },
  { key: 'tier3', label: 'Tier 3', sub: 'Smaller cities', multiplier: 0.55 },
];

const FAMILY_SIZES: { key: FamilySize; label: string; multiplier: number }[] = [
  { key: 'self', label: 'Self', multiplier: 1.0 },
  { key: 'couple', label: 'Self + Spouse', multiplier: 1.5 },
  { key: 'family3', label: 'Family (2+1)', multiplier: 1.8 },
  { key: 'family4', label: 'Family (2+2)', multiplier: 2.0 },
  { key: 'parents', label: 'Parents (60+)', multiplier: 1.4 },
];

const HOSPITAL_TYPES: { key: HospitalType; label: string; baseCost: number }[] = [
  { key: 'economy', label: 'Economy', baseCost: 300000 },
  { key: 'standard', label: 'Standard', baseCost: 500000 },
  { key: 'premium', label: 'Premium', baseCost: 800000 },
  { key: 'super_premium', label: 'Super Premium', baseCost: 1500000 },
];

const AGE_LOADING: { min: number; max: number; multiplier: number }[] = [
  { min: 18, max: 30, multiplier: 0.8 },
  { min: 31, max: 40, multiplier: 1.0 },
  { min: 41, max: 50, multiplier: 1.3 },
  { min: 51, max: 60, multiplier: 1.7 },
  { min: 61, max: 70, multiplier: 2.2 },
  { min: 71, max: 80, multiplier: 2.8 },
];

const COVERAGE_COMPOSITION = [
  { name: 'Hospitalization', value: 55 },
  { name: 'Day Care', value: 15 },
  { name: 'Pre/Post Hosp.', value: 12 },
  { name: 'Ambulance', value: 8 },
  { name: 'Other Benefits', value: 10 },
];

/* ─── Helpers ─── */

function getAgeMultiplier(age: number): number {
  const bracket = AGE_LOADING.find((b) => age >= b.min && age <= b.max);
  return bracket ? bracket.multiplier : 1.0;
}

function roundToLakh(value: number): number {
  return Math.round(value / 100000) * 100000;
}

/* ─── Component ─── */

export default function HealthInsuranceCalculatorPage() {
  const [cityTier, setCityTier] = useState<CityTier>('tier1');
  const [familySize, setFamilySize] = useState<FamilySize>('couple');
  const [eldestAge, setEldestAge] = useState(35);
  const [hospitalType, setHospitalType] = useState<HospitalType>('standard');
  const [inflationRate, setInflationRate] = useState(14);
  const [planningHorizon, setPlanningHorizon] = useState(15);
  const [preExisting, setPreExisting] = useState(false);
  const [existingCover, setExistingCover] = useState(500000);

  const result = useMemo(() => {
    const cityData = CITY_TIERS.find((c) => c.key === cityTier)!;
    const familyData = FAMILY_SIZES.find((f) => f.key === familySize)!;
    const hospitalData = HOSPITAL_TYPES.find((h) => h.key === hospitalType)!;
    const ageMult = getAgeMultiplier(eldestAge);
    const preExMult = preExisting ? 1.2 : 1.0;

    const rawCoverage = hospitalData.baseCost * cityData.multiplier * familyData.multiplier * ageMult * preExMult;
    const baseCoverage = roundToLakh(rawCoverage);

    const inflationDecimal = inflationRate / 100;

    // Coverage projections at different horizons
    const coverageIn5 = roundToLakh(baseCoverage * Math.pow(1 + inflationDecimal, 5));
    const coverageIn10 = roundToLakh(baseCoverage * Math.pow(1 + inflationDecimal, 10));
    const coverageIn15 = roundToLakh(baseCoverage * Math.pow(1 + inflationDecimal, 15));
    const coverageIn20 = roundToLakh(baseCoverage * Math.pow(1 + inflationDecimal, 20));

    const gap = baseCoverage - existingCover;
    const isAdequate = gap <= 0;

    // Year-by-year projection for area chart
    const yearlyProjection: { year: number; coverage: number }[] = [];
    for (let y = 0; y <= planningHorizon; y++) {
      yearlyProjection.push({
        year: y,
        coverage: roundToLakh(baseCoverage * Math.pow(1 + inflationDecimal, y)),
      });
    }

    // City tier comparison
    const cityComparison = CITY_TIERS.map((tier) => ({
      name: tier.label,
      coverage: roundToLakh(
        hospitalData.baseCost * tier.multiplier * familyData.multiplier * ageMult * preExMult
      ),
    }));

    // Time bar chart data
    const timeBarData = [
      { label: 'Today', coverage: baseCoverage },
      { label: '5 Years', coverage: coverageIn5 },
      { label: '10 Years', coverage: coverageIn10 },
      { label: '15 Years', coverage: coverageIn15 },
      { label: '20 Years', coverage: coverageIn20 },
    ];

    // Insight: what a treatment costs in future
    const sampleTreatmentToday = 500000;
    const sampleTreatmentFuture = Math.round(sampleTreatmentToday * Math.pow(1 + inflationDecimal, planningHorizon));

    return {
      baseCoverage,
      coverageIn5,
      coverageIn10,
      coverageIn15,
      coverageIn20,
      gap,
      isAdequate,
      yearlyProjection,
      cityComparison,
      timeBarData,
      sampleTreatmentToday,
      sampleTreatmentFuture,
    };
  }, [cityTier, familySize, eldestAge, hospitalType, inflationRate, planningHorizon, preExisting, existingCover]);

  return (
    <>
      {/* Hero Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <HeartPulse className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Health Insurance Calculator</h1>
              <p className="text-slate-300 mt-1">Find the ideal health insurance coverage for your family based on medical inflation and lifestyle</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ─── Input Panel (Sticky Left) ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Coverage</h2>

              {/* City Tier */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">City Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {CITY_TIERS.map((tier) => (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setCityTier(tier.key)}
                      className={cn(
                        'text-center py-2 px-1 rounded-lg border transition-colors',
                        cityTier === tier.key
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                      )}
                    >
                      <span className="block text-[11px] font-semibold">{tier.label}</span>
                      <span className="block text-[9px] opacity-75">{tier.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Size */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Family Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {FAMILY_SIZES.map((fs) => (
                    <button
                      key={fs.key}
                      type="button"
                      onClick={() => setFamilySize(fs.key)}
                      className={cn(
                        'text-center py-2 px-1 rounded-lg border transition-colors text-[10px] font-semibold',
                        familySize === fs.key
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                      )}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospital Preference */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Hospital Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {HOSPITAL_TYPES.map((ht) => (
                    <button
                      key={ht.key}
                      type="button"
                      onClick={() => setHospitalType(ht.key)}
                      className={cn(
                        'text-center py-2 px-1 rounded-lg border transition-colors text-[10px] font-semibold',
                        hospitalType === ht.key
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                      )}
                    >
                      {ht.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-existing Conditions Toggle */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Pre-existing Conditions</label>
                <div className="grid grid-cols-2 gap-2">
                  {[false, true].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setPreExisting(val)}
                      className={cn(
                        'text-center py-2 px-1 rounded-lg border transition-colors text-[11px] font-semibold',
                        preExisting === val
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                      )}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numeric Inputs */}
              <div className="space-y-5">
                <NumberInput label="Eldest Member Age" value={eldestAge} onChange={setEldestAge} suffix="Years" step={1} min={18} max={80} />
                <NumberInput label="Medical Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={1} min={8} max={18} />
                <NumberInput label="Planning Horizon" value={planningHorizon} onChange={setPlanningHorizon} suffix="Years" step={5} min={5} max={30} />
                <NumberInput label="Existing Health Cover" value={existingCover} onChange={setExistingCover} prefix="₹" step={500000} min={0} max={10000000} />
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                {/* Recommended Coverage - Big Card */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Recommended Coverage Today</span>
                  </div>
                  <div className="text-2xl font-extrabold text-teal-700">{formatINR(result.baseCoverage)}</div>
                </div>

                {/* Coverage Gap */}
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  result.isAdequate ? 'bg-emerald-50' : 'bg-red-50'
                )}>
                  <div className="flex items-center gap-2">
                    {result.isAdequate
                      ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      : <AlertTriangle className="w-4 h-4 text-red-500" />
                    }
                    <span className="text-[11px] text-slate-500 font-medium">
                      {result.isAdequate ? 'Adequately Covered' : 'Coverage Gap'}
                    </span>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    result.isAdequate ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {result.isAdequate ? 'Adequate' : formatINR(result.gap)}
                  </span>
                </div>

                {/* In 10 Years */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Needed in 10 Yrs</span>
                  </div>
                  <span className="text-sm font-bold text-cyan-700">{formatINR(result.coverageIn10)}</span>
                </div>

                {/* In Planning Horizon */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Needed in {planningHorizon} Yrs</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {formatINR(result.yearlyProjection[result.yearlyProjection.length - 1].coverage)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Charts & Results (Right Panel) ─── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Health Insurance Calculator" fileName="health-insurance-calculator" />
              </div>

              {/* Projection Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-pdf-keep-together>
                {[
                  { label: 'In 5 Years', value: result.coverageIn5, color: 'text-teal-700' },
                  { label: 'In 10 Years', value: result.coverageIn10, color: 'text-cyan-700' },
                  { label: 'In 15 Years', value: result.coverageIn15, color: 'text-blue-700' },
                  { label: 'In 20 Years', value: result.coverageIn20, color: 'text-purple-700' },
                ].map((item) => (
                  <div key={item.label} className="card-base p-4 text-center">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={cn('text-lg font-extrabold', item.color)}>{formatINR(item.value)}</p>
                  </div>
                ))}
              </div>

              {/* Coverage Over Time Bar Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Needed Over Time</h3>
                <p className="text-sm text-slate-500 mb-6">How medical inflation erodes your health coverage over the years</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.timeBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Coverage Needed']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="coverage" fill={COLORS.teal} radius={[6, 6, 0, 0]} name="Coverage Needed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* City Tier Comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">City Tier Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Same profile, different city tiers — see how location impacts coverage needs</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.cityComparison} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Recommended Coverage']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="coverage" name="Coverage" radius={[6, 6, 0, 0]}>
                        {result.cityComparison.map((_, index) => (
                          <Cell key={index} fill={[COLORS.teal, COLORS.cyan, COLORS.emerald][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Coverage Composition Pie Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Typical Coverage Composition</h3>
                <p className="text-sm text-slate-500 mb-6">Illustrative breakdown of how health insurance cover is typically utilized</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={COVERAGE_COMPOSITION}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {COVERAGE_COMPOSITION.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, 'Share']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Coverage Projection Area Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Projection Over {planningHorizon} Years</h3>
                <p className="text-sm text-slate-500 mb-6">Year-by-year coverage needed accounting for {inflationRate}% medical inflation</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearlyProjection} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="healthGradCoverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        tickFormatter={(v: number) => `Yr ${v}`}
                      />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Coverage Needed']}
                        labelFormatter={(label: number) => `Year ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="coverage"
                        stroke={COLORS.teal}
                        fill="url(#healthGradCoverage)"
                        strokeWidth={2}
                        name="Coverage Needed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Insight */}
              <div className="card-base p-6 border-l-4 border-l-amber-400" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-primary-700 mb-2">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Medical inflation at <span className="font-semibold text-amber-600">{inflationRate}%</span> means
                      a <span className="font-semibold">{formatINR(result.sampleTreatmentToday)}</span> treatment today
                      will cost <span className="font-semibold text-red-600">{formatINR(result.sampleTreatmentFuture)}</span> in {planningHorizon} years.
                      This is why your health coverage must grow over time to keep pace with rising medical costs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  Recommendations
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />,
                      title: 'Buy a Base + Super Top-Up',
                      desc: 'A base policy of 5-10L combined with a super top-up is the most cost-effective way to achieve high coverage without high premiums.',
                    },
                    {
                      icon: <TrendingUp className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />,
                      title: 'Increase Cover Every 3-5 Years',
                      desc: `With medical inflation at ${inflationRate}%, your coverage should be reviewed and increased every 3-5 years to remain adequate.`,
                    },
                    {
                      icon: <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />,
                      title: 'Separate Policy for Parents',
                      desc: 'If you have parents above 60, consider a separate senior citizen policy to avoid impacting your family floater premiums.',
                    },
                    {
                      icon: <Building2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />,
                      title: 'Do Not Rely Only on Employer Cover',
                      desc: 'Employer-provided group health insurance is often insufficient and non-portable. Always maintain an individual policy alongside.',
                    },
                  ].map((tip) => (
                    <div key={tip.title} className="flex gap-3">
                      {tip.icon}
                      <div>
                        <p className="text-sm font-semibold text-primary-700">{tip.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
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
            {DISCLAIMER.calculator} {DISCLAIMER.general}
          </p>
        </div>
      </section>
    </>
  );
}
