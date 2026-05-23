'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  IndianRupee,
  Target,
  Gift,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ─── Constants ───
const CURRENT_YEAR = 2026; // Today is April 2026
const SSY_CURRENT_RATE = 8.2; // FY26 notified rate
const SSY_CONTRIBUTION_YEARS = 15;
const SSY_MATURITY_YEARS = 21;
const SSY_MAX_ANNUAL = 150000;
const SSY_MIN_ANNUAL = 250;
const PPF_RATE = 7.1;
const MF_RATE = 12;

const RATE_SCENARIOS = [
  { id: 'conservative', label: 'Conservative', rate: 7.0, hint: 'If rates slide' },
  { id: 'current', label: 'Current', rate: 8.2, hint: 'FY26 notified' },
  { id: 'optimistic', label: 'Optimistic', rate: 9.0, hint: 'If rates rise' },
] as const;

const TAX_SLABS = [
  { id: 'zero', label: 'No tax', rate: 0 },
  { id: 'twenty', label: '20% slab', rate: 20 },
  { id: 'thirty', label: '30% slab', rate: 30 },
] as const;

const COLORS = {
  ssy: '#E11D48', // rose-600
  ppf: '#0EA5E9', // sky-500
  mf: '#7C3AED', // violet-600
  blend: '#F59E0B', // amber-500
  target: '#64748B', // slate-500
};

// ─── Finance helpers ───

interface ProjectionRow {
  yearIndex: number; // 1..21
  calendarYear: number;
  girlAge: number;
  contribution: number;
  ssyCorpus: number;
  ppfCorpus: number;
  mfCorpus: number;
  blendCorpus: number; // 50% SSY + 50% MF (contribution split)
}

interface ProjectionInput {
  startYear: number; // calendar year opening happened or will happen
  girlAgeAtOpen: number;
  alreadyOpened: boolean;
  yearsCompleted: number; // if already opened
  openingBalance: number; // current balance if already opened
  annualContribution: number;
  stepUpEnabled: boolean;
  stepUpPct: number; // e.g. 5 => 5%
  ssyRate: number; // e.g. 8.2
  ppfRate: number;
  mfRate: number;
}

/** Build a 21-year projection starting from account opening year */
function buildProjection(p: ProjectionInput): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  const r = p.ssyRate / 100;
  const rPPF = p.ppfRate / 100;
  const rMF = p.mfRate / 100;

  let ssy = 0;
  let ppf = 0;
  let mf = 0;
  let blend = 0; // combined 50% SSY + 50% MF corpus

  // If already opened with a balance, seed SSY corpus as of the start of yearsCompleted
  // We'll still run through 21 years of "years since open" for a full lifecycle view.
  // The opening balance is applied at start; contributions for years 1..yearsCompleted
  // are already reflected in that balance, so we skip them for SSY when already opened.
  // For PPF/MF comparison we reconstruct from scratch as "what if you had gone that route".
  if (p.alreadyOpened) {
    ssy = p.openingBalance;
    // For fair alternative comparison, assume same contribution pattern from year 1
    // PPF/MF start fresh (this is a "what-if you chose differently" view).
  }

  for (let yr = 1; yr <= SSY_MATURITY_YEARS; yr++) {
    // Contribution this year (only during first 15 years)
    const inContribWindow = yr <= SSY_CONTRIBUTION_YEARS;
    const stepUpMultiplier = p.stepUpEnabled
      ? Math.pow(1 + p.stepUpPct / 100, yr - 1)
      : 1;
    let contribution = inContribWindow ? p.annualContribution * stepUpMultiplier : 0;
    // Cap at max 1.5L regulatory limit per year
    if (contribution > SSY_MAX_ANNUAL) contribution = SSY_MAX_ANNUAL;

    // For SSY: if account already opened and this year is within yearsCompleted window,
    // skip adding contribution (already reflected in openingBalance) but keep compounding.
    const ssyContribThisYear =
      p.alreadyOpened && yr <= p.yearsCompleted ? 0 : contribution;

    // SSY: compound then add (end-of-year deposit convention)
    ssy = ssy * (1 + r) + ssyContribThisYear;

    // PPF: same contribution logic but 15 years, then 6 years of pure growth
    const ppfContrib = inContribWindow ? contribution : 0;
    ppf = ppf * (1 + rPPF) + ppfContrib;

    // Equity MF: same contribution logic, 15 years, then 6 years untouched
    const mfContrib = inContribWindow ? contribution : 0;
    mf = mf * (1 + rMF) + mfContrib;

    // 50/50 blend: half goes to SSY, half goes to MF → track combined corpus
    // Apply weighted growth: half the corpus grows at SSY rate, half at MF rate
    // Simpler: split contribution → maintain two internal buckets
    // Use closed-form with an internal 2-bucket tracker
    // (Re-implement cleanly below)

    rows.push({
      yearIndex: yr,
      calendarYear: p.startYear + yr,
      girlAge: p.girlAgeAtOpen + yr,
      contribution: Math.round(contribution),
      ssyCorpus: Math.round(ssy),
      ppfCorpus: Math.round(ppf),
      mfCorpus: Math.round(mf),
      blendCorpus: 0, // filled below
    });
  }

  // Blend tracker: 50% of each year's contribution to SSY, 50% to MF
  let blendSSY = p.alreadyOpened ? p.openingBalance * 0.5 : 0;
  let blendMF = p.alreadyOpened ? p.openingBalance * 0.5 : 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const yr = row.yearIndex;
    const inContribWindow = yr <= SSY_CONTRIBUTION_YEARS;
    const stepUpMultiplier = p.stepUpEnabled
      ? Math.pow(1 + p.stepUpPct / 100, yr - 1)
      : 1;
    let contribution = inContribWindow ? p.annualContribution * stepUpMultiplier : 0;
    if (contribution > SSY_MAX_ANNUAL) contribution = SSY_MAX_ANNUAL;
    const halfContrib = contribution / 2;
    // Skip SSY deposit for already-opened completed years (already in balance)
    const ssyHalf =
      p.alreadyOpened && yr <= p.yearsCompleted ? 0 : halfContrib;
    blendSSY = blendSSY * (1 + r) + ssyHalf;
    blendMF = blendMF * (1 + rMF) + halfContrib;
    blend = blendSSY + blendMF;
    row.blendCorpus = Math.round(blend);
  }

  return rows;
}

export default function SSYPlannerPage() {
  // ─── Parent + Girl ───
  const [parentName, setParentName] = useState('');
  const [parentAge, setParentAge] = useState<number | null>(35);
  const [girlAge, setGirlAge] = useState(3);
  const [accountStatus, setAccountStatus] = useState<'planning' | 'already'>('planning');
  const [openingYear, setOpeningYear] = useState(CURRENT_YEAR);
  const [currentBalance, setCurrentBalance] = useState(0);

  // ─── Contribution ───
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpPct, setStepUpPct] = useState(5);

  // ─── Rate assumption ───
  const [rateScenario, setRateScenario] = useState<string>('current');
  const [customRate, setCustomRate] = useState(SSY_CURRENT_RATE);
  const [ppfRate] = useState(PPF_RATE);
  const [mfRate, setMfRate] = useState(MF_RATE);

  // ─── Tax slab (for 80C savings) ───
  const [taxSlab, setTaxSlab] = useState<string>('thirty');

  // ─── Year-by-year table toggle ───
  const [showTable, setShowTable] = useState(false);

  // Compute derived girl age at open + opening year logic
  const girlAgeAtOpen = useMemo(() => {
    if (accountStatus === 'planning') return girlAge;
    // already opened: girl age now − years since opening
    const yearsSinceOpening = Math.max(0, CURRENT_YEAR - openingYear);
    return Math.max(0, girlAge - yearsSinceOpening);
  }, [accountStatus, girlAge, openingYear]);

  const yearsCompleted = useMemo(() => {
    if (accountStatus !== 'already') return 0;
    return Math.max(0, Math.min(CURRENT_YEAR - openingYear, SSY_CONTRIBUTION_YEARS));
  }, [accountStatus, openingYear]);

  const effectiveStartYear = accountStatus === 'already' ? openingYear : CURRENT_YEAR;

  const activeRate = useMemo(() => {
    const match = RATE_SCENARIOS.find((s) => s.id === rateScenario);
    if (match) return match.rate;
    return customRate;
  }, [rateScenario, customRate]);

  // ─── Build projection ───
  const projection = useMemo(() => {
    return buildProjection({
      startYear: effectiveStartYear,
      girlAgeAtOpen,
      alreadyOpened: accountStatus === 'already',
      yearsCompleted,
      openingBalance: accountStatus === 'already' ? currentBalance : 0,
      annualContribution,
      stepUpEnabled,
      stepUpPct,
      ssyRate: activeRate,
      ppfRate,
      mfRate,
    });
  }, [
    effectiveStartYear,
    girlAgeAtOpen,
    accountStatus,
    yearsCompleted,
    currentBalance,
    annualContribution,
    stepUpEnabled,
    stepUpPct,
    activeRate,
    ppfRate,
    mfRate,
  ]);

  // ─── Summary metrics ───
  const summary = useMemo(() => {
    const maturityRow = projection[projection.length - 1];
    const maturityYear = maturityRow?.calendarYear ?? effectiveStartYear + SSY_MATURITY_YEARS;
    const girlAgeAtMaturity = girlAgeAtOpen + SSY_MATURITY_YEARS;

    // Corpus at girl's age 18 → yearIndex = 18 − girlAgeAtOpen
    const yearAt18 = 18 - girlAgeAtOpen;
    let corpusAt18 = 0;
    if (yearAt18 >= 1 && yearAt18 <= SSY_MATURITY_YEARS) {
      corpusAt18 = projection[yearAt18 - 1].ssyCorpus;
    } else if (yearAt18 > SSY_MATURITY_YEARS) {
      corpusAt18 = maturityRow?.ssyCorpus ?? 0;
    }

    // Total contributions over 15 years (sum of contribution column)
    const totalContributions = projection
      .slice(0, SSY_CONTRIBUTION_YEARS)
      .reduce((a, r) => a + r.contribution, 0);

    // Total interest earned (tax-free) = SSY maturity − total contributions − opening balance
    const totalInterest =
      (maturityRow?.ssyCorpus ?? 0) -
      totalContributions -
      (accountStatus === 'already' ? currentBalance : 0);

    // Tax savings: contribution up to 1.5L qualifies under 80C each year
    const taxSlabPct =
      TAX_SLABS.find((s) => s.id === taxSlab)?.rate ?? 30;
    let taxSavings = 0;
    for (let yr = 1; yr <= SSY_CONTRIBUTION_YEARS; yr++) {
      const row = projection[yr - 1];
      if (!row) continue;
      const eligible = Math.min(row.contribution, SSY_MAX_ANNUAL);
      taxSavings += (eligible * taxSlabPct) / 100;
    }

    return {
      maturityYear,
      girlAgeAtMaturity,
      ssyMaturity: maturityRow?.ssyCorpus ?? 0,
      ppfMaturity: maturityRow?.ppfCorpus ?? 0,
      mfMaturity: maturityRow?.mfCorpus ?? 0,
      blendMaturity: maturityRow?.blendCorpus ?? 0,
      corpusAt18,
      totalContributions,
      totalInterest,
      taxSavings,
      yearAt18,
    };
  }, [
    projection,
    girlAgeAtOpen,
    effectiveStartYear,
    accountStatus,
    currentBalance,
    taxSlab,
  ]);

  // ─── Step-up compare: flat vs stepped ───
  const flatVsStepCompare = useMemo(() => {
    if (!stepUpEnabled) return null;
    const flat = buildProjection({
      startYear: effectiveStartYear,
      girlAgeAtOpen,
      alreadyOpened: accountStatus === 'already',
      yearsCompleted,
      openingBalance: accountStatus === 'already' ? currentBalance : 0,
      annualContribution,
      stepUpEnabled: false,
      stepUpPct: 0,
      ssyRate: activeRate,
      ppfRate,
      mfRate,
    });
    const flatFinal = flat[flat.length - 1]?.ssyCorpus ?? 0;
    const stepFinal = summary.ssyMaturity;
    return { flatFinal, stepFinal, diff: stepFinal - flatFinal };
  }, [
    stepUpEnabled,
    effectiveStartYear,
    girlAgeAtOpen,
    accountStatus,
    yearsCompleted,
    currentBalance,
    annualContribution,
    activeRate,
    ppfRate,
    mfRate,
    summary.ssyMaturity,
  ]);

  // ─── Bar chart data at year 21 ───
  const comparisonBarData = useMemo(
    () => [
      { name: 'SSY', value: summary.ssyMaturity, fill: COLORS.ssy },
      { name: 'PPF', value: summary.ppfMaturity, fill: COLORS.ppf },
      { name: 'Equity MF', value: summary.mfMaturity, fill: COLORS.mf },
      { name: '50/50 Blend', value: summary.blendMaturity, fill: COLORS.blend },
    ],
    [summary],
  );

  const clientName = parentName.trim() || 'Parent';
  const resultContext = `SSY for daughter age ${girlAge} — maturity corpus ${formatINR(summary.ssyMaturity)} in ${summary.maturityYear} (girl aged ${summary.girlAgeAtMaturity})`;

  const isMaxingContribution = annualContribution >= SSY_MAX_ANNUAL;

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
              <Gift className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Sukanya Samriddhi Yojana (SSY) Planner
              </h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                The complete SSY Planner for Indian parents — project your girl&apos;s corpus at
                age 21 (and at 18 for education), compare vs PPF + Equity MF, and see Sec 80C tax
                savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─── Input Panel ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your SSY Plan</h2>

              <PersonalInfoBar
                name={parentName}
                onNameChange={setParentName}
                age={parentAge}
                onAgeChange={setParentAge}
                ageLabel="Parent's Age"
                namePlaceholder="e.g., Arjun"
              />

              <div className="space-y-5">
                {/* Girl + account status */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Your Daughter
                  </label>
                  <div className="space-y-4">
                    <NumberInput
                      label="Girl's Current Age"
                      value={girlAge}
                      onChange={setGirlAge}
                      suffix="Years"
                      step={1}
                      min={0}
                      max={10}
                      hint="SSY eligibility: under 10 years"
                    />
                  </div>
                </div>

                {/* Account status */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Account Status
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-xl border border-surface-300">
                    {([
                      { id: 'planning', label: 'Planning to open' },
                      { id: 'already', label: 'Already opened' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccountStatus(opt.id)}
                        className={cn(
                          'py-2 rounded-lg text-xs font-semibold transition-all',
                          accountStatus === opt.id
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-slate-500 hover:text-primary-700',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {accountStatus === 'already' && (
                    <div className="mt-4 space-y-4">
                      <NumberInput
                        label="Account Opening Year"
                        value={openingYear}
                        onChange={setOpeningYear}
                        step={1}
                        min={CURRENT_YEAR - 15}
                        max={CURRENT_YEAR}
                        hint={`${yearsCompleted} year${yearsCompleted === 1 ? '' : 's'} completed (girl was ${girlAgeAtOpen} at open)`}
                      />
                      <NumberInput
                        label="Current Balance in SSY"
                        value={currentBalance}
                        onChange={setCurrentBalance}
                        prefix="₹"
                        step={10000}
                        min={0}
                        max={50000000}
                        hint="As per your latest passbook"
                      />
                    </div>
                  )}
                </div>

                {/* Contribution */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Contribution Plan
                  </label>
                  <div className="space-y-4">
                    <NumberInput
                      label="Annual Contribution"
                      value={annualContribution}
                      onChange={setAnnualContribution}
                      prefix="₹"
                      step={10000}
                      min={SSY_MIN_ANNUAL}
                      max={SSY_MAX_ANNUAL}
                      hint={`Min ₹250 · Max ₹1.5L per year per girl`}
                    />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider">
                          Step-up Contributions?
                        </label>
                        <button
                          type="button"
                          onClick={() => setStepUpEnabled(!stepUpEnabled)}
                          className={cn(
                            'relative w-11 h-6 rounded-full transition-colors',
                            stepUpEnabled ? 'bg-rose-600' : 'bg-surface-300',
                          )}
                          aria-label="Toggle step-up"
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
                        <NumberInput
                          label="Annual Step-up Rate"
                          value={stepUpPct}
                          onChange={setStepUpPct}
                          suffix="% p.a."
                          step={1}
                          min={1}
                          max={15}
                          hint="Will cap at ₹1.5L/yr limit"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Interest rate assumption */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Interest Rate Assumption
                  </label>
                  <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[11px] text-rose-700 font-semibold">
                      Current SSY rate (FY26)
                    </span>
                    <span className="text-sm font-bold text-rose-700">{SSY_CURRENT_RATE}% p.a.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-surface-100 rounded-xl border border-surface-300 mb-3">
                    {RATE_SCENARIOS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setRateScenario(s.id);
                          setCustomRate(s.rate);
                        }}
                        className={cn(
                          'py-2 rounded-lg text-[11px] font-semibold transition-all leading-tight',
                          rateScenario === s.id
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-slate-500 hover:text-primary-700',
                        )}
                      >
                        {s.label}
                        <div className="text-[10px] font-normal text-slate-400">{s.rate}%</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    SSY rate has historically moved 50-100 bps with 10-year G-Sec yields. The
                    Finance Ministry notifies it each quarter.
                  </p>
                </div>

                {/* Alternative rates */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Compare Against
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-100">
                      <span className="text-[11px] text-slate-600 font-medium">PPF rate (fixed)</span>
                      <span className="text-sm font-bold text-sky-700">{ppfRate}% p.a.</span>
                    </div>
                    <NumberInput
                      label="Equity MF Expected Return"
                      value={mfRate}
                      onChange={setMfRate}
                      suffix="% p.a."
                      step={0.5}
                      min={8}
                      max={15}
                      hint="Long-term equity MF average"
                    />
                  </div>
                </div>

                {/* Tax slab for 80C */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Your Tax Slab (Old Regime)
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-surface-100 rounded-xl border border-surface-300">
                    {TAX_SLABS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTaxSlab(s.id)}
                        className={cn(
                          'py-2 rounded-lg text-[11px] font-semibold transition-all',
                          taxSlab === s.id
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-slate-500 hover:text-primary-700',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Sec 80C benefit only if you opt for the old regime.
                  </p>
                </div>
              </div>

              {/* Side summary */}
              <div className="mt-8 space-y-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      SSY Maturity Corpus
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                    {formatINR(summary.ssyMaturity)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    In {summary.maturityYear} · girl aged {summary.girlAgeAtMaturity}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-rose-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Invested</span>
                  </div>
                  <span className="text-sm font-bold text-rose-700">
                    {formatINR(summary.totalContributions)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Interest (Tax-free)
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatINR(summary.totalInterest)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span className="text-[11px] text-slate-500 font-medium">At Age 18</span>
                  </div>
                  <span className="text-sm font-bold text-sky-700">
                    {formatINR(summary.corpusAt18)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Results ─── */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Your SSY Plan</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="SSY Plan"
                  fileName={`SSY-Plan-${clientName.replace(/\s+/g, '-')}`}
                />
              </div>

              {/* Hero card */}
              <div
                className="card-base p-6 bg-gradient-to-br from-rose-50 via-white to-pink-50 border-rose-200/60"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      SSY Maturity Corpus
                    </p>
                    <p className="text-3xl font-extrabold text-primary-700 leading-tight">
                      {formatINR(summary.ssyMaturity)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Maturity Year: <span className="font-semibold text-primary-700">{summary.maturityYear}</span>{' '}
                      · Girl will be age{' '}
                      <span className="font-semibold text-primary-700">{summary.girlAgeAtMaturity}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-white border border-rose-200/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      You Invest
                    </p>
                    <p className="text-2xl font-extrabold text-rose-700 mt-1">
                      {formatINR(summary.totalContributions)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Over 15 years of contributions
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-white border border-emerald-200/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Interest Earned (Tax-free)
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                      {formatINR(summary.totalInterest)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      EEE: Exempt-Exempt-Exempt under IT Act
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 key metric cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-pdf-keep-together>
                <div className="card-base p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Total Contributions
                  </p>
                  <p className="text-xl font-extrabold text-primary-700 mt-1">
                    {formatINR(summary.totalContributions)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Over 15 years</p>
                </div>
                <div className="card-base p-5 border-2 border-rose-300 bg-rose-50/40">
                  <p className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
                    Final Maturity
                  </p>
                  <p className="text-xl font-extrabold text-rose-700 mt-1">
                    {formatINR(summary.ssyMaturity)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">At year 21</p>
                </div>
                <div className="card-base p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Corpus at Age 18
                  </p>
                  <p className="text-xl font-extrabold text-sky-700 mt-1">
                    {formatINR(summary.corpusAt18)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    50% withdrawable for higher ed
                  </p>
                </div>
                <div className="card-base p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Tax Saved (80C)
                  </p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">
                    {formatINR(summary.taxSavings)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    At your selected slab, over 15 years
                  </p>
                </div>
              </div>

              {/* Comparison line chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  SSY vs PPF vs Equity MF vs 50/50 Blend
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Same contribution pattern across all four — 15 years of deposits, then 6 years of
                  pure compounding to year 21
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={projection}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="girlAge"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        label={{
                          value: "Girl's Age",
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
                      <Line
                        type="monotone"
                        dataKey="ssyCorpus"
                        stroke={COLORS.ssy}
                        strokeWidth={2.5}
                        dot={false}
                        name={`SSY (${activeRate}%)`}
                      />
                      <Line
                        type="monotone"
                        dataKey="ppfCorpus"
                        stroke={COLORS.ppf}
                        strokeWidth={2}
                        dot={false}
                        name={`PPF (${ppfRate}%)`}
                      />
                      <Line
                        type="monotone"
                        dataKey="mfCorpus"
                        stroke={COLORS.mf}
                        strokeWidth={2}
                        dot={false}
                        name={`Equity MF (${mfRate}%)`}
                      />
                      <Line
                        type="monotone"
                        dataKey="blendCorpus"
                        stroke={COLORS.blend}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="50/50 Blend"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar chart at year 21 */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Final Corpus at Year 21</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Side-by-side: what the same contributions would build under each route
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonBarData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={70}
                      />
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {comparisonBarData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div
                className="card-base p-6 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/40 border-amber-200/50"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-primary-700">Key Insights for Your Plan</h3>
                    <p className="text-sm text-slate-500">
                      Trade-offs between guaranteed returns and equity-driven growth
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <p>
                      <span className="font-semibold">
                        SSY&apos;s {activeRate}% is ~{Math.round((activeRate - ppfRate) * 100)} bps
                        higher than PPF&apos;s {ppfRate}%
                      </span>{' '}
                      — but Equity MF historically averages {mfRate}% with volatility. SSY has zero
                      risk; equity has no guarantee but higher expected return.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <p>
                      <span className="font-semibold">SSY is 100% sovereign-backed and EEE</span>{' '}
                      — contribution qualifies for Sec 80C deduction, interest is tax-free, and
                      maturity is tax-free. Virtually no other instrument offers this complete
                      tax-free status with a government guarantee.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <p>
                      <span className="font-semibold">
                        50/50 blend gives {formatINR(summary.blendMaturity)}
                      </span>{' '}
                      — {summary.blendMaturity > summary.ssyMaturity ? 'better' : 'comparable to'}{' '}
                      pure SSY due to equity upside while keeping half in guaranteed SSY. Most
                      prudent for parents who want guaranteed education floor + equity kicker.
                    </p>
                  </div>

                  {stepUpEnabled && flatVsStepCompare && (
                    <div className="flex gap-3">
                      <span className="text-rose-600 font-bold mt-0.5">•</span>
                      <p>
                        <span className="font-semibold">
                          Stepping up {stepUpPct}% yearly → final corpus{' '}
                          {formatINR(flatVsStepCompare.stepFinal)}
                        </span>{' '}
                        vs flat: {formatINR(flatVsStepCompare.flatFinal)} — a{' '}
                        {formatINR(flatVsStepCompare.diff)} boost just from increasing deposits as
                        your income grows (capped at ₹1.5L/yr).
                      </p>
                    </div>
                  )}

                  {isMaxingContribution && (
                    <div className="flex gap-3">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      <p>
                        <span className="font-semibold">
                          You&apos;re maxing Sec 80C via SSY alone (₹1.5L/yr)
                        </span>{' '}
                        — consider NPS Tier 1 for additional Sec 80CCD(1B) deduction of ₹50,000.
                        That&apos;s ₹15,000 more tax saved at 30% slab every single year.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <span className="text-sky-600 font-bold mt-0.5">•</span>
                    <p>
                      <span className="font-semibold">
                        At age 18, {formatINR(summary.corpusAt18)} will be in the account
                      </span>{' '}
                      — 50% ({formatINR(Math.round(summary.corpusAt18 * 0.5))}) can be withdrawn
                      for her higher education. The rest stays locked for corpus growth till 21 or
                      marriage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligibility reminder */}
              {girlAge > 10 && (
                <div
                  className="rounded-2xl p-5 border border-red-200 bg-red-50 flex items-start gap-3"
                  data-pdf-keep-together
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Your daughter is over 10 — SSY not eligible
                    </p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">
                      SSY accounts can only be opened for girls under 10. Consider PPF, equity MF
                      SIPs, or a children-focused mutual fund scheme for her goals. Your
                      Relationship Manager can map the right mix.
                    </p>
                  </div>
                </div>
              )}

              {/* Year-by-year table (collapsible) */}
              <div className="card-base p-6" data-pdf-hide>
                <button
                  type="button"
                  onClick={() => setShowTable(!showTable)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-bold text-primary-700">
                      Year-by-Year Corpus Table (21 Years)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Full breakdown of SSY, PPF, Equity MF, and 50/50 blend
                    </p>
                  </div>
                  {showTable ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {showTable && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-surface-300">
                          <th className="py-2 pr-3 font-semibold">Yr</th>
                          <th className="py-2 pr-3 font-semibold">Age</th>
                          <th className="py-2 pr-3 font-semibold text-right">Contribution</th>
                          <th className="py-2 pr-3 font-semibold text-right">SSY</th>
                          <th className="py-2 pr-3 font-semibold text-right">PPF</th>
                          <th className="py-2 pr-3 font-semibold text-right">Equity MF</th>
                          <th className="py-2 pr-0 font-semibold text-right">50/50 Blend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projection.map((row) => (
                          <tr
                            key={row.yearIndex}
                            className={cn(
                              'border-b border-surface-200 text-slate-700',
                              row.yearIndex === SSY_CONTRIBUTION_YEARS && 'bg-amber-50/50',
                              row.yearIndex === SSY_MATURITY_YEARS && 'bg-rose-50/50 font-semibold',
                            )}
                          >
                            <td className="py-2 pr-3">{row.yearIndex}</td>
                            <td className="py-2 pr-3">{row.girlAge}</td>
                            <td className="py-2 pr-3 text-right">
                              {row.contribution > 0 ? formatINR(row.contribution) : '—'}
                            </td>
                            <td className="py-2 pr-3 text-right text-rose-700">
                              {formatINR(row.ssyCorpus)}
                            </td>
                            <td className="py-2 pr-3 text-right text-sky-700">
                              {formatINR(row.ppfCorpus)}
                            </td>
                            <td className="py-2 pr-3 text-right text-violet-700">
                              {formatINR(row.mfCorpus)}
                            </td>
                            <td className="py-2 pr-0 text-right text-amber-700">
                              {formatINR(row.blendCorpus)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                      Amber row (year 15) = last contribution year. Rose row (year 21) = SSY
                      maturity. PPF/MF use same contribution pattern for apples-to-apples
                      comparison.
                    </p>
                  </div>
                )}
              </div>

              {/* CFP Note */}
              <div
                className="rounded-2xl p-6 border border-rose-200 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-rose-700 mb-2">CFP Note</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      SSY is among the best EEE instruments for girl children — tax-free,
                      sovereign-backed, and a higher notified rate than PPF. The cap is
                      ₹1.5L/year per girl (family maximum is two girls, or three if twins).
                      For any corpus need beyond SSY capacity — overseas education, post-graduation,
                      or simply a bigger goal — supplement with equity mutual fund SIPs. Your
                      Relationship Manager can map the right fund categories (flexicap, large &
                      midcap, or aggressive hybrid) to your horizon and risk profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead capture */}
      <CalculatorLeadForm
        calculatorName="SSY Planner"
        accent="rose"
        resultContext={resultContext}
        heading="Want a complete plan for your daughter's future?"
        subtext="Share your contact — your Relationship Manager will build a goal-based plan combining SSY, equity SIPs, and insurance, with milestone reviews at key life stages. Zero obligation."
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
