'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Clock,
  IndianRupee,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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

// ─── Education Presets (today's indicative all-in costs in INR) ───
type StreamPreset = {
  id: string;
  label: string;
  cost: number;
  destination: 'India' | 'Abroad';
  /** Course duration in years — used to determine when PG starts */
  duration: number;
};

const STREAM_PRESETS: StreamPreset[] = [
  { id: 'eng-iit', label: 'Engineering (IIT / NIT)', cost: 1000000, destination: 'India', duration: 4 },
  { id: 'med-pvt', label: 'Medical — MBBS (Private)', cost: 10000000, destination: 'India', duration: 5 },
  { id: 'med-govt', label: 'Medical — MBBS (Govt)', cost: 1500000, destination: 'India', duration: 5 },
  { id: 'mba-iim', label: 'MBA (IIM — Top Tier)', cost: 3000000, destination: 'India', duration: 2 },
  { id: 'commerce-arts', label: 'Commerce / Arts (Top Private)', cost: 1200000, destination: 'India', duration: 3 },
  { id: 'abroad-ug-us', label: 'Abroad UG (US)', cost: 20000000, destination: 'Abroad', duration: 4 },
  { id: 'abroad-pg-us', label: 'Abroad PG (US MS)', cost: 7000000, destination: 'Abroad', duration: 2 },
  { id: 'abroad-ug-ukca', label: 'Abroad UG (UK / Canada)', cost: 15000000, destination: 'Abroad', duration: 3 },
  { id: 'abroad-pg-uk', label: 'Abroad PG (UK MSc)', cost: 5000000, destination: 'Abroad', duration: 1 },
  { id: 'custom', label: 'Custom (enter your own)', cost: 2500000, destination: 'India', duration: 4 },
];

const PG_PRESETS: StreamPreset[] = STREAM_PRESETS.filter((s) =>
  ['mba-iim', 'abroad-pg-us', 'abroad-pg-uk', 'custom'].includes(s.id),
);

const COLORS = {
  existing: '#0EA5E9',
  sip: '#7C3AED',
  target: '#E8553A',
};

// ─── Finance helpers ───

/** Future Value of a one-time lumpsum */
function fvLumpsum(pv: number, annualRate: number, years: number): number {
  return pv * Math.pow(1 + annualRate, years);
}

/** Required monthly SIP (flat) for target corpus after N years */
function requiredFlatSIP(target: number, annualRate: number, years: number): number {
  if (target <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRate / 12;
  if (r === 0) return target / n;
  // FV of annuity formula: FV = PMT * ((1+r)^n - 1) / r
  return target / ((Math.pow(1 + r, n) - 1) / r);
}

/**
 * Required starting monthly SIP with annual step-up. Supports two modes:
 *   - percentage: each year's monthly SIP = S × (1 + r)^(y-1)
 *   - amount:     each year's monthly SIP = S + A × (y-1), with A in ₹/month
 * Returns the initial monthly SIP S that funds the target over the given years.
 */
type StepUpConfig =
  | { type: 'percentage'; rate: number } // rate as decimal (0.10 = 10%)
  | { type: 'amount'; amount: number };  // amount in ₹/month

function requiredStepUpSIP(
  target: number,
  annualRate: number,
  years: number,
  stepConfig: StepUpConfig,
): number {
  if (target <= 0 || years <= 0) return 0;
  const r = annualRate / 12;
  const yearAnnuity = r === 0 ? 12 : (Math.pow(1 + r, 12) - 1) / r;

  if (stepConfig.type === 'percentage') {
    let totalFactor = 0;
    for (let y = 1; y <= years; y++) {
      const yearSIPMultiplier = Math.pow(1 + stepConfig.rate, y - 1);
      const compoundRemaining = Math.pow(1 + annualRate, years - y);
      totalFactor += yearSIPMultiplier * yearAnnuity * compoundRemaining;
    }
    return totalFactor > 0 ? target / totalFactor : 0;
  }

  // Amount mode: monthly at year y = S + A × (y-1)
  // FV = S × factorS + A × factorA where:
  //   factorS = Σ yearAnnuity × (1+annualRate)^(years-y)
  //   factorA = Σ (y-1) × yearAnnuity × (1+annualRate)^(years-y)
  let factorS = 0;
  let factorA = 0;
  for (let y = 1; y <= years; y++) {
    const factor = yearAnnuity * Math.pow(1 + annualRate, years - y);
    factorS += factor;
    factorA += (y - 1) * factor;
  }
  if (factorS <= 0) return 0;
  const sip = (target - stepConfig.amount * factorA) / factorS;
  return Math.max(0, sip);
}

/** Required lumpsum today to meet target after N years */
function requiredLumpsum(target: number, annualRate: number, years: number): number {
  if (target <= 0 || years <= 0) return 0;
  return target / Math.pow(1 + annualRate, years);
}

const RISK_PROFILES = [
  { id: 'aggressive', label: 'Aggressive', rate: 14 },
  { id: 'moderate', label: 'Moderate', rate: 12 },
  { id: 'conservative', label: 'Conservative', rate: 9 },
] as const;

export default function ChildEducationPlannerPage() {
  // Personal
  const [parentName, setParentName] = useState('');
  const [parentAge, setParentAge] = useState<number | null>(35);

  // Child details
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(5);
  const [targetAge, setTargetAge] = useState(18);

  // Destination + stream (UG)
  const [destination, setDestination] = useState<'India' | 'Abroad'>('India');
  const [streamId, setStreamId] = useState<string>('eng-iit');
  const [customCost, setCustomCost] = useState(2500000);

  // Inflation (defaults flip with destination)
  const [considerInflation, setConsiderInflation] = useState(true);
  const [inflation, setInflation] = useState(10);

  // Existing corpus already earmarked
  const [existingCorpus, setExistingCorpus] = useState(0);

  // Expected SIP return
  const [sipReturn, setSipReturn] = useState(12);
  const [riskProfile, setRiskProfile] = useState<string>('moderate');

  // Step-up SIP — supports both percentage and fixed-amount annual step-up
  const [stepUpEnabled, setStepUpEnabled] = useState(true);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'amount'>('percentage');
  const [stepUpRate, setStepUpRate] = useState(10); // % p.a. — used when stepUpType === 'percentage'
  const [stepUpAmount, setStepUpAmount] = useState(1000); // ₹/month annual increase — used when stepUpType === 'amount'

  // PG goal toggle
  const [planPG, setPlanPG] = useState(false);
  const [pgAge, setPgAge] = useState(22);
  const [pgStreamId, setPgStreamId] = useState<string>('mba-iim');
  const [pgCustomCost, setPgCustomCost] = useState(3000000);

  // Resolve selected presets
  const ugStream = useMemo(() => {
    const match = STREAM_PRESETS.find((s) => s.id === streamId) ?? STREAM_PRESETS[0];
    if (match.id === 'custom') {
      return { ...match, cost: customCost, destination };
    }
    return match;
  }, [streamId, customCost, destination]);

  const pgStream = useMemo(() => {
    const match = PG_PRESETS.find((s) => s.id === pgStreamId) ?? PG_PRESETS[0];
    if (match.id === 'custom') {
      return { ...match, cost: pgCustomCost };
    }
    return match;
  }, [pgStreamId, pgCustomCost]);

  // ─── Core projections ───
  const result = useMemo(() => {
    const yearsToUG = Math.max(1, targetAge - childAge);
    // If user opts out of inflation, costs stay frozen at today's level.
    const effectiveInflation = considerInflation ? inflation : 0;
    const inf = effectiveInflation / 100;
    const ret = sipReturn / 100;

    // Build the step-up config once — used by all SIP calculations
    const stepConfig: StepUpConfig =
      stepUpType === 'percentage'
        ? { type: 'percentage', rate: stepUpRate / 100 }
        : { type: 'amount', amount: stepUpAmount };

    // UG future cost
    const ugFutureCost = ugStream.cost * Math.pow(1 + inf, yearsToUG);

    // Existing corpus grows at SIP rate
    const existingAtUG = fvLumpsum(existingCorpus, ret, yearsToUG);
    const ugShortfall = Math.max(0, ugFutureCost - existingAtUG);

    const ugFlatSIP = requiredFlatSIP(ugShortfall, ret, yearsToUG);
    const ugStepSIP = stepUpEnabled ? requiredStepUpSIP(ugShortfall, ret, yearsToUG, stepConfig) : ugFlatSIP;
    const ugLumpsumToday = requiredLumpsum(ugShortfall, ret, yearsToUG);

    // PG (optional)
    let pgFutureCost = 0;
    let pgShortfall = 0;
    let pgFlatSIP = 0;
    let pgStepSIP = 0;
    let pgLumpsumToday = 0;
    let yearsToPG = 0;

    if (planPG) {
      // PG starts pgAge years from today (relative to child's current age)
      yearsToPG = Math.max(yearsToUG + 1, pgAge - childAge);
      pgFutureCost = pgStream.cost * Math.pow(1 + inf, yearsToPG);
      // Existing corpus continues to grow until PG — but most of it is consumed at UG.
      // Conservative approach: allocate existing corpus only to UG.
      pgShortfall = pgFutureCost;
      pgFlatSIP = requiredFlatSIP(pgShortfall, ret, yearsToPG);
      pgStepSIP = stepUpEnabled ? requiredStepUpSIP(pgShortfall, ret, yearsToPG, stepConfig) : pgFlatSIP;
      pgLumpsumToday = requiredLumpsum(pgShortfall, ret, yearsToPG);
    }

    const totalFlatSIP = ugFlatSIP + pgFlatSIP;
    const totalStepSIP = ugStepSIP + pgStepSIP;
    const totalLumpsumToday = ugLumpsumToday + pgLumpsumToday;
    const monthlySIPRecommended = stepUpEnabled ? totalStepSIP : totalFlatSIP;

    // ─── Year-by-year corpus accumulation (UG horizon) ───
    const horizon = planPG ? yearsToPG : yearsToUG;
    const yearly: {
      year: number;
      age: number;
      monthlySIP: number;          // total monthly SIP this year (after step-up)
      annualInvestment: number;    // = monthlySIP × 12
      cumulativeInvested: number;  // running total invested by end of this year
      existingGrowth: number;
      sipCorpus: number;
      totalCorpus: number;
      targetAtYear: number;
    }[] = [];

    let runningSIPCorpus = 0;
    let cumulativeInvested = 0;
    let currentAnnualSIP = (stepUpEnabled ? totalStepSIP : totalFlatSIP) * 12;
    for (let y = 1; y <= horizon; y++) {
      // This year's contribution
      const yearContribution = currentAnnualSIP;
      const monthlyThisYear = yearContribution / 12;
      cumulativeInvested += yearContribution;

      // Compound existing corpus
      const existingGrowth = existingCorpus * Math.pow(1 + ret, y);
      // Grow running SIP corpus by one year + add this year's contributions (end-of-year approx)
      runningSIPCorpus = runningSIPCorpus * (1 + ret) + yearContribution;

      // Apply step-up for next year (percentage compounds; amount adds A×12)
      if (stepUpEnabled) {
        if (stepUpType === 'percentage') {
          currentAnnualSIP = currentAnnualSIP * (1 + stepUpRate / 100);
        } else {
          currentAnnualSIP = currentAnnualSIP + stepUpAmount * 12;
        }
      }

      const totalCorpus = existingGrowth + runningSIPCorpus;
      const targetAtYear = ugFutureCost + (planPG && y >= yearsToPG ? pgFutureCost : 0);
      yearly.push({
        year: y,
        age: childAge + y,
        monthlySIP: Math.round(monthlyThisYear),
        annualInvestment: Math.round(yearContribution),
        cumulativeInvested: Math.round(cumulativeInvested),
        existingGrowth: Math.round(existingGrowth),
        sipCorpus: Math.round(runningSIPCorpus),
        totalCorpus: Math.round(totalCorpus),
        targetAtYear: Math.round(targetAtYear),
      });
    }

    return {
      yearsToUG,
      yearsToPG,
      ugFutureCost: Math.round(ugFutureCost),
      existingAtUG: Math.round(existingAtUG),
      ugShortfall: Math.round(ugShortfall),
      ugFlatSIP: Math.round(ugFlatSIP),
      ugStepSIP: Math.round(ugStepSIP),
      ugLumpsumToday: Math.round(ugLumpsumToday),

      pgFutureCost: Math.round(pgFutureCost),
      pgShortfall: Math.round(pgShortfall),
      pgFlatSIP: Math.round(pgFlatSIP),
      pgStepSIP: Math.round(pgStepSIP),
      pgLumpsumToday: Math.round(pgLumpsumToday),

      totalFlatSIP: Math.round(totalFlatSIP),
      totalStepSIP: Math.round(totalStepSIP),
      totalLumpsumToday: Math.round(totalLumpsumToday),
      monthlySIPRecommended: Math.round(monthlySIPRecommended),
      yearly,
    };
  }, [
    childAge,
    targetAge,
    ugStream,
    existingCorpus,
    considerInflation,
    inflation,
    sipReturn,
    stepUpEnabled,
    stepUpType,
    stepUpRate,
    stepUpAmount,
    planPG,
    pgAge,
    pgStream,
  ]);

  // ─── Delay cost scenarios ───
  const delayScenarios = useMemo(() => {
    const ret = sipReturn / 100;
    const stepConfig: StepUpConfig =
      stepUpType === 'percentage'
        ? { type: 'percentage', rate: stepUpRate / 100 }
        : { type: 'amount', amount: stepUpAmount };
    return [1, 3, 5].map((delay) => {
      const newYears = Math.max(1, result.yearsToUG - delay);
      const sip = stepUpEnabled
        ? requiredStepUpSIP(result.ugShortfall, ret, newYears, stepConfig)
        : requiredFlatSIP(result.ugShortfall, ret, newYears);
      const extra = Math.max(0, sip - (stepUpEnabled ? result.ugStepSIP : result.ugFlatSIP));
      return {
        delay,
        newYears,
        sip: Math.round(sip),
        extra: Math.round(extra),
        extraPct:
          result.ugFlatSIP > 0
            ? Math.round(
                ((sip - (stepUpEnabled ? result.ugStepSIP : result.ugFlatSIP)) /
                  (stepUpEnabled ? result.ugStepSIP : result.ugFlatSIP)) *
                  100,
              )
            : 0,
      };
    });
  }, [result, sipReturn, stepUpType, stepUpRate, stepUpAmount, stepUpEnabled]);

  // Update default inflation when destination flips
  const setDestAndInflation = (d: 'India' | 'Abroad') => {
    setDestination(d);
    setInflation(d === 'India' ? 10 : 7);
    // Default stream for that destination
    const first = STREAM_PRESETS.find((s) => s.destination === d && s.id !== 'custom');
    if (first) setStreamId(first.id);
  };

  const applyRiskProfile = (id: string) => {
    setRiskProfile(id);
    const match = RISK_PROFILES.find((r) => r.id === id);
    if (match) setSipReturn(match.rate);
  };

  const clientName = parentName.trim() || 'Parent';
  const streamLabel = ugStream.label.replace(/\s*\(.*\)/, '').trim();
  const resultContext = `${childName ? `${childName}'s ` : ''}target corpus ${formatINR(result.ugFutureCost)} for ${streamLabel} at age ${targetAge} — monthly SIP needed ${formatINR(result.monthlySIPRecommended)}`;

  // Filtered stream list based on destination
  const availableStreams = STREAM_PRESETS.filter(
    (s) => s.destination === destination || s.id === 'custom',
  );

  return (
    <>
      {/* ─── Hero ─── */}
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
              <GraduationCap className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Child Education Planner</h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                Plan your child&apos;s education with real cost projections and monthly SIP targets.
                India&apos;s most comprehensive tool with 9 education stream presets and abroad-study scenarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div
            id="calculator-results"
            className="grid lg:grid-cols-[420px_1fr] gap-8"
          >
            {/* ─── Input Panel ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your Plan Details</h2>

              <PersonalInfoBar
                name={parentName}
                onNameChange={setParentName}
                age={parentAge}
                onAgeChange={setParentAge}
                ageLabel="Parent's Age"
                namePlaceholder="e.g., Priya"
              />

              <div className="space-y-5">
                {/* Child */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Your Child
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Child&rsquo;s Name</label>
                      <input
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="e.g., Aarav or Ananya"
                        className="w-full px-3 py-2 rounded-lg border border-surface-300 bg-white text-sm text-primary-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                        maxLength={40}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Optional — personalises the plan and PDF</p>
                    </div>
                    <NumberInput
                      label="Child's Current Age"
                      value={childAge}
                      onChange={setChildAge}
                      suffix="Years"
                      step={1}
                      min={0}
                      max={17}
                    />
                    <NumberInput
                      label="Target Education Age"
                      value={targetAge}
                      onChange={setTargetAge}
                      suffix="Years"
                      step={1}
                      min={Math.max(childAge + 1, 17)}
                      max={22}
                      hint="When your child starts undergraduate studies"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Destination
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-xl border border-surface-300">
                    {(['India', 'Abroad'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDestAndInflation(d)}
                        className={cn(
                          'py-2 rounded-lg text-sm font-semibold transition-all',
                          destination === d
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-slate-500 hover:text-primary-700',
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Education Stream
                  </label>
                  <select
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="w-full px-3 py-3 text-sm font-medium text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                  >
                    {availableStreams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} — {s.id === 'custom' ? 'set your own' : formatINR(s.cost)}
                      </option>
                    ))}
                  </select>
                  {streamId === 'custom' && (
                    <div className="mt-3">
                      <NumberInput
                        label="Custom total cost at today's rates"
                        value={customCost}
                        onChange={setCustomCost}
                        prefix="₹"
                        step={10000}
                        min={10000}
                        max={100000000}
                        hint="₹10K to ₹10 Cr"
                      />
                    </div>
                  )}
                </div>

                {/* Inflation Toggle — explicit question */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Are You Planning For Inflation?
                  </label>
                  <div className={cn(
                    'rounded-xl border p-4 transition-colors',
                    considerInflation
                      ? 'border-violet-200 bg-violet-50/40'
                      : 'border-red-200 bg-red-50/40'
                  )}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setConsiderInflation(!considerInflation)}
                      role="switch"
                      aria-checked={considerInflation}
                      tabIndex={0}
                    >
                      <div className="flex-1 pr-3">
                        <div className="text-[13px] font-semibold text-slate-700">
                          Yes — factor in education inflation
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tomorrow&apos;s ₹{(ugStream.cost / 100000).toFixed(0)}L becomes much more in {Math.max(1, targetAge - childAge)} years
                        </div>
                      </div>
                      <div className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', considerInflation ? 'bg-violet-600' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', considerInflation ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>

                    {considerInflation ? (
                      <div className="mt-4">
                        <NumberInput
                          label="Education Inflation Rate"
                          value={inflation}
                          onChange={setInflation}
                          suffix="% p.a."
                          step={0.5}
                          min={4}
                          max={15}
                          hint={destination === 'India' ? 'Typical India: 9-10% p.a.' : 'Typical Abroad: 6-7% p.a.'}
                        />
                        <div className="mt-3 flex items-center justify-between text-[11px] bg-white border border-violet-200 rounded-lg px-3 py-2">
                          <span className="text-slate-500">Projected cost in {Math.max(1, targetAge - childAge)} years:</span>
                          <span className="font-bold text-violet-700">
                            ₹{((ugStream.cost * Math.pow(1 + inflation / 100, Math.max(1, targetAge - childAge))) / 100000).toFixed(1)} L
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 rounded-lg bg-red-100/60 border border-red-200 text-[11px] text-red-800 leading-relaxed">
                        <strong>⚠ Not recommended.</strong> Education cost rises 9-10% p.a. in India. Ignoring inflation means your SIP will fall short by ~{Math.round((Math.pow(1.1, Math.max(1, targetAge - childAge)) - 1) * 100)}% at the target age.
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing Corpus */}
                <div>
                  <NumberInput
                    label="Existing Corpus Earmarked"
                    value={existingCorpus}
                    onChange={setExistingCorpus}
                    prefix="₹"
                    step={10000}
                    min={0}
                    max={100000000}
                    hint="Already saved for child's education (up to ₹10 Cr)"
                  />
                </div>

                {/* Risk + returns */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Risk Profile
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-surface-100 rounded-xl border border-surface-300 mb-4">
                    {RISK_PROFILES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => applyRiskProfile(r.id)}
                        className={cn(
                          'py-2 rounded-lg text-xs font-semibold transition-all',
                          riskProfile === r.id
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-slate-500 hover:text-primary-700',
                        )}
                      >
                        {r.label}
                        <div className="text-[10px] font-normal text-slate-400">{r.rate}%</div>
                      </button>
                    ))}
                  </div>
                  <NumberInput
                    label="Expected SIP Return"
                    value={sipReturn}
                    onChange={(v) => {
                      setSipReturn(v);
                      setRiskProfile('custom');
                    }}
                    suffix="% p.a."
                    step={0.5}
                    min={8}
                    max={15}
                  />
                </div>

                {/* Step-up */}
                <div data-pdf-stepup={stepUpEnabled ? `Annual Step-Up (${stepUpType === 'percentage' ? 'Percentage' : 'Amount'}): ${stepUpType === 'amount' ? '₹' : ''}${stepUpType === 'percentage' ? stepUpRate : stepUpAmount}${stepUpType === 'percentage' ? '%' : '/month'}` : undefined}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider">
                      Monthly SIP Step-up
                    </label>
                    <button
                      type="button"
                      onClick={() => setStepUpEnabled(!stepUpEnabled)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        stepUpEnabled ? 'bg-brand' : 'bg-surface-300',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                          stepUpEnabled && 'translate-x-5',
                        )}
                      />
                    </button>
                  </div>
                  {stepUpEnabled && (
                    <div className="space-y-3">
                      {/* Type toggle: % vs ₹ */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStepUpType('percentage')}
                          className={cn(
                            'flex-1 text-[12px] font-semibold py-2 rounded-lg border transition-colors',
                            stepUpType === 'percentage'
                              ? 'bg-brand text-white border-brand'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                          )}
                        >
                          % per year
                        </button>
                        <button
                          type="button"
                          onClick={() => setStepUpType('amount')}
                          className={cn(
                            'flex-1 text-[12px] font-semibold py-2 rounded-lg border transition-colors',
                            stepUpType === 'amount'
                              ? 'bg-brand text-white border-brand'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                          )}
                        >
                          ₹ per year
                        </button>
                      </div>
                      {stepUpType === 'percentage' ? (
                        <NumberInput
                          label="Annual Step-up Rate"
                          value={stepUpRate}
                          onChange={setStepUpRate}
                          suffix="% p.a."
                          step={1}
                          min={0}
                          max={25}
                          hint="Increase your SIP by this percentage every year. Typical: 10%."
                        />
                      ) : (
                        <NumberInput
                          label="Annual Increase Amount"
                          value={stepUpAmount}
                          onChange={setStepUpAmount}
                          prefix="₹"
                          suffix="/month"
                          step={500}
                          min={0}
                          max={50000}
                          hint="Your monthly SIP increases by this rupee amount every year. E.g., ₹1,000 means Year 1 = base, Year 2 = base + ₹1,000, Year 3 = base + ₹2,000…"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* PG */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider">
                      Also plan for PG?
                    </label>
                    <button
                      type="button"
                      onClick={() => setPlanPG(!planPG)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        planPG ? 'bg-violet-600' : 'bg-surface-300',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                          planPG && 'translate-x-5',
                        )}
                      />
                    </button>
                  </div>
                  {planPG && (
                    <div className="space-y-4">
                      <NumberInput
                        label="PG Start Age"
                        value={pgAge}
                        onChange={setPgAge}
                        suffix="Years"
                        step={1}
                        min={Math.max(targetAge + 1, 19)}
                        max={28}
                      />
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                          PG Stream
                        </label>
                        <select
                          value={pgStreamId}
                          onChange={(e) => setPgStreamId(e.target.value)}
                          className="w-full px-3 py-3 text-sm font-medium text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                        >
                          {PG_PRESETS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label} — {s.id === 'custom' ? 'set your own' : formatINR(s.cost)}
                            </option>
                          ))}
                        </select>
                        {pgStreamId === 'custom' && (
                          <div className="mt-3">
                            <NumberInput
                              label="Custom PG cost today"
                              value={pgCustomCost}
                              onChange={setPgCustomCost}
                              prefix="₹"
                              step={10000}
                              min={10000}
                              max={100000000}
                              hint="₹10K to ₹10 Cr"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero Metric */}
              <div className="mt-8 space-y-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-violet-50 border border-violet-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-violet-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Monthly SIP Needed {stepUpEnabled ? '(Step-up)' : '(Flat)'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                    {formatINR(result.monthlySIPRecommended)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    To reach {formatINR(result.ugFutureCost + (planPG ? result.pgFutureCost : 0))} in {result.yearsToUG}{planPG ? `–${result.yearsToPG}` : ''} years
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-violet-600" />
                    <span className="text-[11px] text-slate-500 font-medium">UG Future Cost</span>
                  </div>
                  <span className="text-sm font-bold text-violet-700">
                    {formatINR(result.ugFutureCost)}
                  </span>
                </div>

                {planPG && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-fuchsia-600" />
                      <span className="text-[11px] text-slate-500 font-medium">PG Future Cost</span>
                    </div>
                    <span className="text-sm font-bold text-fuchsia-700">
                      {formatINR(result.pgFutureCost)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Existing → at UG</span>
                  </div>
                  <span className="text-sm font-bold text-teal-700">
                    {formatINR(result.existingAtUG)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Years to UG</span>
                  </div>
                  <span className="text-sm font-bold text-orange-700">{result.yearsToUG}</span>
                </div>
              </div>
            </div>

            {/* ─── Charts & Results ─── */}
            <div className="space-y-8">
              {/* Header + PDF */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Your Education Plan</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="Child Education Plan"
                  fileName={`Child-Education-${clientName.replace(/\s+/g, '-')}`}
                />
              </div>

              {/* Hero Card */}
              <div
                className="card-base p-6 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border-violet-200/60"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Future cost of {streamLabel}
                    </p>
                    <p className="text-3xl font-extrabold text-primary-700 leading-tight">
                      {formatINR(result.ugFutureCost)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      In {result.yearsToUG} years at {inflation}% p.a. education inflation
                      {planPG && (
                        <> &middot; plus {formatINR(result.pgFutureCost)} for PG in {result.yearsToPG} years</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-white border border-violet-200/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Monthly SIP (recommended)
                    </p>
                    <p className="text-2xl font-extrabold text-violet-700 mt-1">
                      {formatINR(result.monthlySIPRecommended)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {stepUpEnabled ? `With ${stepUpRate}% annual step-up` : 'Flat SIP, no step-up'}
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-white border border-violet-200/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Lumpsum Today (alternative)
                    </p>
                    <p className="text-2xl font-extrabold text-fuchsia-700 mt-1">
                      {formatINR(result.totalLumpsumToday)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Invested today at {sipReturn}% p.a.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 scenarios */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Three Ways to Reach the Goal</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Compare flat SIP, step-up SIP, and a one-time lumpsum today
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl p-4 border border-surface-300 bg-surface-50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Flat SIP
                    </p>
                    <p className="text-xl font-extrabold text-primary-700 mt-1">
                      {formatINR(result.totalFlatSIP)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Same amount every month</p>
                  </div>
                  <div className="rounded-xl p-4 border-2 border-violet-400 bg-violet-50">
                    <p className="text-[10px] uppercase tracking-wider text-violet-700 font-semibold">
                      Step-up SIP ({stepUpRate}%)
                    </p>
                    <p className="text-xl font-extrabold text-violet-700 mt-1">
                      {formatINR(result.totalStepSIP)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Start lower, grow with your income
                    </p>
                  </div>
                  <div className="rounded-xl p-4 border border-surface-300 bg-surface-50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Lumpsum Today
                    </p>
                    <p className="text-xl font-extrabold text-fuchsia-700 mt-1">
                      {formatINR(result.totalLumpsumToday)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">One-time investment now</p>
                  </div>
                </div>
              </div>

              {/* Corpus accumulation chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Accumulation Path</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Year-by-year growth of existing corpus + SIP contributions vs. target cost
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.yearly}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="gradExisting" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.existing} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLORS.existing} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradSIP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.sip} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLORS.sip} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="age"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        label={{
                          value: "Child's Age",
                          position: 'insideBottom',
                          offset: -2,
                          fontSize: 11,
                          fill: '#94A3B8',
                        }}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={70}
                      />
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        labelFormatter={(label) => `Age ${label}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="existingGrowth"
                        stackId="1"
                        stroke={COLORS.existing}
                        fill="url(#gradExisting)"
                        name="Existing Corpus Growth"
                      />
                      <Area
                        type="monotone"
                        dataKey="sipCorpus"
                        stackId="1"
                        stroke={COLORS.sip}
                        fill="url(#gradSIP)"
                        name="SIP Contributions Value"
                      />
                      <Area
                        type="monotone"
                        dataKey="targetAtYear"
                        stroke={COLORS.target}
                        fill="none"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target Cost"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-Year SIP Breakup */}
              {result.yearly.length > 0 && (
                <div className="card-base overflow-hidden" data-pdf-keep-together>
                  <div className="p-6 pb-0">
                    <h3 className="font-bold text-primary-700 mb-1">Year-by-Year SIP Breakup</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Exact monthly SIP and corpus build-up
                      {stepUpEnabled
                        ? stepUpType === 'percentage'
                          ? ` with ${stepUpRate}% annual step-up`
                          : ` adding ₹${stepUpAmount.toLocaleString('en-IN')}/month each year`
                        : ' (no step-up)'}
                      {' '}for {childName ? `${childName}` : 'your child'}.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">{childName ? `${childName}'s` : "Child's"} Age</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly SIP</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Invest</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cumulative Invested</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Corpus (EOY)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearly.map((row) => {
                          const isUgYear = row.year === result.yearsToUG;
                          const isPgYear = planPG && row.year === result.yearsToPG;
                          return (
                            <tr
                              key={row.year}
                              className={cn(
                                'border-b border-surface-200 hover:bg-surface-50/50 transition-colors',
                                (isUgYear || isPgYear) && 'bg-violet-50/40',
                              )}
                            >
                              <td className="py-2.5 px-4 font-medium text-primary-700">
                                Yr {row.year}
                                {isUgYear && <span className="ml-2 text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">UG</span>}
                                {isPgYear && <span className="ml-2 text-[9px] font-bold text-fuchsia-700 bg-fuchsia-100 px-1.5 py-0.5 rounded">PG</span>}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">{row.age}</td>
                              <td className="py-2.5 px-4 text-right font-semibold text-violet-700">{formatINR(row.monthlySIP)}</td>
                              <td className="py-2.5 px-4 text-right text-slate-600">{formatINR(row.annualInvestment)}</td>
                              <td className="py-2.5 px-4 text-right text-slate-600">{formatINR(row.cumulativeInvested)}</td>
                              <td className="py-2.5 px-4 text-right font-semibold text-teal-700">{formatINR(row.totalCorpus)}</td>
                            </tr>
                          );
                        })}
                        {/* Totals row */}
                        <tr className="bg-violet-50 font-bold border-t-2 border-violet-200">
                          <td className="py-3 px-4 text-primary-700">Total</td>
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4 text-right text-primary-700">
                            {formatINR(result.yearly[result.yearly.length - 1]?.cumulativeInvested ?? 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-teal-700">
                            {formatINR(result.yearly[result.yearly.length - 1]?.totalCorpus ?? 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 text-[11px] text-slate-500">
                    EOY = End-of-Year corpus including existing investments compounded at {sipReturn}% p.a.
                    UG year highlighted{planPG ? '; PG year also highlighted.' : '.'}
                  </div>
                </div>
              )}

              {/* Delay cost */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-primary-700">Cost of Delaying</h3>
                    <p className="text-sm text-slate-500">
                      Every year you delay, the required monthly SIP rises sharply. Time in market
                      is your biggest ally for child education goals.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {delayScenarios.map((s) => (
                    <div
                      key={s.delay}
                      className="rounded-xl p-4 border border-amber-200 bg-amber-50/50"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                        Delay by {s.delay} year{s.delay > 1 ? 's' : ''}
                      </p>
                      <p className="text-xl font-extrabold text-primary-700 mt-1">
                        {formatINR(s.sip)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Only {s.newYears} years left
                      </p>
                      {s.extra > 0 && (
                        <p className="text-[11px] text-red-600 font-semibold mt-2">
                          +{formatINR(s.extra)}/mo ({s.extraPct}% higher)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Delay warning block */}
              {delayScenarios[2].extra > 0 && (
                <div
                  className="rounded-2xl p-5 border border-red-200 bg-red-50 flex items-start gap-3"
                  data-pdf-keep-together
                >
                  <TrendingUp className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Delaying 5 years means {formatINR(delayScenarios[2].extra)} extra every month
                    </p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">
                      Starting today lets compounding do the heavy lifting. Even a modest SIP of{' '}
                      {formatINR(result.monthlySIPRecommended)} now beats a scramble later. A
                      Relationship Manager can help you pick the right equity mix and rebalance as
                      your child approaches college age.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lead capture */}
      <CalculatorLeadForm
        calculatorName="Child Education Planner"
        accent="violet"
        resultContext={resultContext}
        heading={childName ? `Want a personalised education plan for ${childName}?` : 'Want a personalised education plan for your child?'}
        subtext="Share your contact — your Relationship Manager will build a goal-based plan with the right fund mix, SIP structure, and milestone reviews. Zero obligation."
      />

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
