'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  PiggyBank,
  Landmark,
  LineChart as LineChartIcon,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const COLORS = {
  ppf: '#16A34A', // green-600
  elss: '#7C3AED', // violet-600
  nps: '#F59E0B', // amber-500
  mix: '#4F46E5', // indigo-600
};

const SLAB_OPTIONS = [0, 5, 20, 30] as const;
const RET_SLAB_OPTIONS = [0, 5, 10, 20] as const;

type Slab = (typeof SLAB_OPTIONS)[number];
type RetSlab = (typeof RET_SLAB_OPTIONS)[number];

// Cap constants
const PPF_MAX = 150000;
const SEC_80C_CAP = 150000;
const SEC_80CCD_1B_CAP = 50000;
const LTCG_EXEMPT = 125000;
const LTCG_RATE = 0.125; // 12.5% on equity LTCG > ₹1.25L (Budget 2024, effective 23-Jul-2024)
const PPF_RATE = 0.071; // 7.1%
const RETIREMENT_AGE = 60;
const POST_RET_YEARS = 20;

export default function PPFvsELSSvsNPSCalculatorPage() {
  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(30);

  // Common inputs
  const [horizon, setHorizon] = useState(25);
  const [annualContribution, setAnnualContribution] = useState(150000);

  // Tax
  const [currentSlab, setCurrentSlab] = useState<Slab>(30);
  const [retirementSlab, setRetirementSlab] = useState<RetSlab>(20);

  // Returns
  const [elssReturn, setElssReturn] = useState(12);
  const [npsReturn, setNpsReturn] = useState(10);
  const [annuityRate, setAnnuityRate] = useState(6);
  const elssTER = 1.7;

  // Smart Mix allocation
  const [ppfAllocPct, setPpfAllocPct] = useState(33);
  const [elssAllocPct, setElssAllocPct] = useState(33);
  const [npsAllocPct, setNpsAllocPct] = useState(34);
  const [useExtra1B, setUseExtra1B] = useState(true);

  const currentAge = age ?? 30;

  /** Simulate single-instrument "full 1.5L" scenarios. */
  const result = useMemo(() => {
    const rElss = (elssReturn - elssTER) / 100;
    const rNps = npsReturn / 100;
    const slabFrac = currentSlab / 100;
    const retSlabFrac = retirementSlab / 100;

    // ── PPF FULL ────────────────────────────────────────────────
    // contribute min(150000, annualContribution) for up to 15 yrs, then compound only.
    const ppfContribution = Math.min(annualContribution, PPF_MAX);
    let ppfCorpus = 0;

    // ── ELSS FULL ───────────────────────────────────────────────
    const elssContribution = Math.min(annualContribution, SEC_80C_CAP);
    let elssCorpus = 0;

    // ── NPS FULL ────────────────────────────────────────────────
    // NPS full = annualContribution (up to 150K) + optional 50K under 1B
    const npsContributionBase = Math.min(annualContribution, SEC_80C_CAP);
    const npsContribution1B = useExtra1B ? SEC_80CCD_1B_CAP : 0;
    const npsAnnualTotal = npsContributionBase + npsContribution1B;
    let npsCorpus = 0;

    // ── SMART MIX ───────────────────────────────────────────────
    const mixTotalPct = ppfAllocPct + elssAllocPct + npsAllocPct;
    const normPpf = mixTotalPct > 0 ? ppfAllocPct / mixTotalPct : 0;
    const normElss = mixTotalPct > 0 ? elssAllocPct / mixTotalPct : 0;
    const normNps = mixTotalPct > 0 ? npsAllocPct / mixTotalPct : 0;
    const mixPpfContrib = Math.min(annualContribution * normPpf, PPF_MAX);
    const mixElssContrib = annualContribution * normElss;
    const mixNpsContrib = annualContribution * normNps + (useExtra1B ? SEC_80CCD_1B_CAP : 0);
    let mixPpfCorpus = 0;
    let mixElssCorpus = 0;
    let mixNpsCorpus = 0;

    // For tax-savings tracking
    let ppfYearsContributed = 0;
    let elssYearsContributed = 0;
    let npsYearsContributed = 0;
    let mixPpfYears = 0;
    let mixElssYears = 0;
    let mixNpsYears = 0;
    let yearsUsed1B = 0;

    const yearly: {
      year: number;
      age: number;
      ppf: number;
      elss: number;
      nps: number;
      mix: number;
    }[] = [];

    for (let y = 1; y <= horizon; y++) {
      const yAge = currentAge + y;

      // PPF: contribute during the full horizon (PPF is extendable in 5-yr blocks after 15).
      ppfCorpus = ppfCorpus * (1 + PPF_RATE) + ppfContribution;
      ppfYearsContributed += 1;

      // ELSS: annual contribution each year (3-yr lock per tranche, but we keep investing)
      elssCorpus = elssCorpus * (1 + rElss) + elssContribution;
      elssYearsContributed += 1;

      // NPS: contribute until retirement age (age 60) or end of horizon, whichever is earlier.
      const yEndAge = currentAge + y;
      if (yEndAge <= RETIREMENT_AGE) {
        npsCorpus = npsCorpus * (1 + rNps) + npsAnnualTotal;
        npsYearsContributed += 1;
        if (useExtra1B) yearsUsed1B += 1;
      } else {
        // past retirement — only compound (no new contribs)
        npsCorpus = npsCorpus * (1 + rNps);
      }

      // Smart Mix — same rules per sleeve
      mixPpfCorpus = mixPpfCorpus * (1 + PPF_RATE) + mixPpfContrib;
      mixPpfYears += 1;
      mixElssCorpus = mixElssCorpus * (1 + rElss) + mixElssContrib;
      mixElssYears += 1;
      if (yEndAge <= RETIREMENT_AGE) {
        mixNpsCorpus = mixNpsCorpus * (1 + rNps) + mixNpsContrib;
        mixNpsYears += 1;
      } else {
        mixNpsCorpus = mixNpsCorpus * (1 + rNps);
      }

      yearly.push({
        year: y,
        age: yAge,
        ppf: Math.round(ppfCorpus),
        elss: Math.round(elssCorpus),
        nps: Math.round(npsCorpus),
        mix: Math.round(mixPpfCorpus + mixElssCorpus + mixNpsCorpus),
      });
    }

    // ── POST-TAX OUTCOMES ────────────────────────────────────────
    // PPF: tax-free
    const ppfContribTotal = ppfContribution * ppfYearsContributed;
    const ppfPostTax = ppfCorpus;

    // ELSS: LTCG on equity gains above ₹1.25L at 12.5% (FY 2025-26 onwards, Budget 2024)
    const elssContribTotal = elssContribution * elssYearsContributed;
    const elssGain = Math.max(0, elssCorpus - elssContribTotal);
    const elssLtcgTaxable = Math.max(0, elssGain - LTCG_EXEMPT);
    const elssTax = elssLtcgTaxable * LTCG_RATE;
    const elssPostTax = elssCorpus - elssTax;

    // NPS: 60% lump-sum tax-free + 40% annuity — annuity generates monthly pension
    // Post-tax annuity value = annuity_corpus × rate × post-retirement-years × (1 - retSlabFrac)
    const npsContribTotal = npsContributionBase * npsYearsContributed + (useExtra1B ? SEC_80CCD_1B_CAP * yearsUsed1B : 0);
    const npsLump = npsCorpus * 0.6;
    const npsAnnuityCorpus = npsCorpus * 0.4;
    const npsAnnuityAnnualGross = npsAnnuityCorpus * (annuityRate / 100);
    const npsAnnuityAnnualNet = npsAnnuityAnnualGross * (1 - retSlabFrac);
    const npsAnnuityTotalNet = npsAnnuityAnnualNet * POST_RET_YEARS; // simple undiscounted
    const npsPostTax = npsLump + npsAnnuityTotalNet;

    // Smart Mix post-tax
    const mixPpfContribTotal = mixPpfContrib * mixPpfYears;
    const mixElssContribTotal = mixElssContrib * mixElssYears;
    const mixElssGain = Math.max(0, mixElssCorpus - mixElssContribTotal);
    const mixElssLtcgTaxable = Math.max(0, mixElssGain - LTCG_EXEMPT);
    const mixElssTax = mixElssLtcgTaxable * LTCG_RATE;
    const mixElssPostTax = mixElssCorpus - mixElssTax;
    const mixNpsLump = mixNpsCorpus * 0.6;
    const mixNpsAnnuityCorpus = mixNpsCorpus * 0.4;
    const mixNpsAnnuityAnnualNet = mixNpsAnnuityCorpus * (annuityRate / 100) * (1 - retSlabFrac);
    const mixNpsAnnuityTotalNet = mixNpsAnnuityAnnualNet * POST_RET_YEARS;
    const mixNpsPostTax = mixNpsLump + mixNpsAnnuityTotalNet;
    const mixPostTax = mixPpfCorpus + mixElssPostTax + mixNpsPostTax;

    // ── SEC 80C TAX SAVINGS ─────────────────────────────────────
    // PPF: contrib × slab × yrs
    const ppfTaxSaved = ppfContribution * slabFrac * ppfYearsContributed;
    const elssTaxSaved = elssContribution * slabFrac * elssYearsContributed;
    // NPS under 80C (excluding 1B) + extra 1B savings
    const npsTaxSaved80C = npsContributionBase * slabFrac * npsYearsContributed;
    const nps1BTaxSaved = useExtra1B ? SEC_80CCD_1B_CAP * slabFrac * yearsUsed1B : 0;
    const npsTaxSavedTotal = npsTaxSaved80C + nps1BTaxSaved;

    return {
      yearly,
      // Full scenarios
      ppfCorpus: Math.round(ppfCorpus),
      elssCorpus: Math.round(elssCorpus),
      npsCorpus: Math.round(npsCorpus),
      ppfPostTax: Math.round(ppfPostTax),
      elssPostTax: Math.round(elssPostTax),
      npsPostTax: Math.round(npsPostTax),
      elssTax: Math.round(elssTax),
      npsLump: Math.round(npsLump),
      npsAnnuityCorpus: Math.round(npsAnnuityCorpus),
      npsAnnuityAnnualGross: Math.round(npsAnnuityAnnualGross),
      npsAnnuityAnnualNet: Math.round(npsAnnuityAnnualNet),
      npsAnnuityTotalNet: Math.round(npsAnnuityTotalNet),
      // Contribs
      ppfContribTotal: Math.round(ppfContribTotal),
      elssContribTotal: Math.round(elssContribTotal),
      npsContribTotal: Math.round(npsContribTotal),
      // Tax saved
      ppfTaxSaved: Math.round(ppfTaxSaved),
      elssTaxSaved: Math.round(elssTaxSaved),
      npsTaxSaved80C: Math.round(npsTaxSaved80C),
      nps1BTaxSaved: Math.round(nps1BTaxSaved),
      npsTaxSavedTotal: Math.round(npsTaxSavedTotal),
      // Mix
      mixPpfCorpus: Math.round(mixPpfCorpus),
      mixElssCorpus: Math.round(mixElssCorpus),
      mixNpsCorpus: Math.round(mixNpsCorpus),
      mixPostTax: Math.round(mixPostTax),
      // Years
      npsYearsContributed,
      yearsUsed1B,
    };
  }, [
    horizon,
    annualContribution,
    currentAge,
    currentSlab,
    retirementSlab,
    elssReturn,
    npsReturn,
    annuityRate,
    ppfAllocPct,
    elssAllocPct,
    npsAllocPct,
    useExtra1B,
  ]);

  // Find winner among single instruments
  const bestRouteName = useMemo(() => {
    const values: { name: string; value: number }[] = [
      { name: 'PPF', value: result.ppfPostTax },
      { name: 'ELSS', value: result.elssPostTax },
      { name: 'NPS', value: result.npsPostTax },
    ];
    values.sort((a, b) => b.value - a.value);
    return values[0];
  }, [result]);

  const ppfVsElssDelta = result.elssPostTax - result.ppfPostTax;

  // Comparison bar chart
  const barData = [
    {
      name: 'PPF',
      Corpus: result.ppfPostTax,
      fill: COLORS.ppf,
    },
    {
      name: 'ELSS',
      Corpus: result.elssPostTax,
      fill: COLORS.elss,
    },
    {
      name: 'NPS',
      Corpus: result.npsPostTax,
      fill: COLORS.nps,
    },
    {
      name: 'Smart Mix',
      Corpus: result.mixPostTax,
      fill: COLORS.mix,
    },
  ];

  const lineData = result.yearly.map((r) => ({
    year: `Yr ${r.year}`,
    PPF: r.ppf,
    ELSS: r.elss,
    NPS: r.nps,
  }));

  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (ppfVsElssDelta > 0) {
      items.push({
        icon: <TrendingUp className="w-5 h-5 text-violet-600 shrink-0" />,
        text: `Over ${horizon} years, ELSS beats PPF by ${formatINR(ppfVsElssDelta)} post-tax — because a 12% equity compounding rate vs 7.1% PPF compounds hugely across two decades. That's the price of capital safety.`,
        color: 'bg-violet-50 border-violet-200',
      });
    } else {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        text: `In this scenario, PPF narrowly matches or beats ELSS — typically because the horizon is short or ELSS return assumption is low. Try a longer horizon (20+ years) or 11-13% ELSS return.`,
        color: 'bg-amber-50 border-amber-200',
      });
    }

    if (useExtra1B && result.nps1BTaxSaved > 0) {
      items.push({
        icon: <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />,
        text: `NPS's additional ₹50,000 deduction under Sec 80CCD(1B) saved you an extra ${formatINR(result.nps1BTaxSaved)} in tax over ${result.yearsUsed1B} contributing years — this benefit is exclusive to NPS and is over and above the ₹1.5L 80C cap.`,
        color: 'bg-amber-50 border-amber-200',
      });
    }

    items.push({
      icon: <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />,
      text: `PPF's zero volatility means your ${formatINR(result.ppfPostTax)} is exactly what you'll get — sovereign-guaranteed, tax-free, no drawdowns. ELSS can fluctuate 30-40% in bad years. PPF is "sleep-well" money.`,
      color: 'bg-green-50 border-green-200',
    });

    if (horizon < 15) {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />,
        text: `Your horizon of ${horizon} years is shorter than PPF's 15-year lock-in. You cannot exit PPF early without penalty. ELSS unlocks in just 3 years per tranche — far better for goals inside 15 years.`,
        color: 'bg-red-50 border-red-200',
      });
    }

    items.push({
      icon: <LineChartIcon className="w-5 h-5 text-indigo-600 shrink-0" />,
      text: `The Smart Mix (PPF + ELSS + NPS at ${ppfAllocPct}/${elssAllocPct}/${npsAllocPct}) delivers ${formatINR(result.mixPostTax)} post-tax — combining tax-efficiency, equity upside, and a guaranteed fixed-income portion. This is how CFPs structure 80C allocations for most clients.`,
      color: 'bg-indigo-50 border-indigo-200',
    });

    return items;
  }, [ppfVsElssDelta, horizon, useExtra1B, result, ppfAllocPct, elssAllocPct, npsAllocPct]);

  const mixTotalPct = ppfAllocPct + elssAllocPct + npsAllocPct;

  // Year-by-year display — first 5 + last 5
  const displayYears = useMemo(() => {
    const proj = result.yearly;
    if (proj.length <= 10) return proj;
    return [...proj.slice(0, 5), ...proj.slice(-5)];
  }, [result.yearly]);
  const showEllipsis = result.yearly.length > 10;

  const resultContext = `PPF ${formatINR(result.ppfPostTax)}, ELSS ${formatINR(result.elssPostTax)}, NPS ${formatINR(result.npsPostTax)} over ${horizon} years (${formatINR(annualContribution)}/yr, slab ${currentSlab}%)`;

  return (
    <>
      {/* Header */}
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
              <Scale className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                PPF vs ELSS vs NPS — Section 80C Showdown
              </h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                The honest Section 80C showdown: PPF vs ELSS vs NPS over 15–40 years. See which
                instrument — or blend — actually maximises post-tax corpus for your horizon and
                tax bracket.
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
              <PersonalInfoBar
                name={name}
                onNameChange={setName}
                age={age}
                onAgeChange={setAge}
              />

              <h2 className="font-bold text-primary-700 mb-5 text-lg">Your Inputs</h2>

              <div className="space-y-5">
                {/* Section 1 */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Contribution & Horizon
                  </label>
                  <div className="space-y-4">
                    <NumberInput
                      label="Annual 80C Contribution"
                      value={annualContribution}
                      onChange={setAnnualContribution}
                      prefix="₹"
                      step={10000}
                      min={50000}
                      max={200000}
                      hint="Sec 80C cap is ₹1.5L; PPF max ₹1.5L/yr"
                    />
                    <NumberInput
                      label="Investment Horizon"
                      value={horizon}
                      onChange={setHorizon}
                      suffix="Years"
                      step={1}
                      min={15}
                      max={40}
                      hint={`Retirement at age ${RETIREMENT_AGE} drives NPS payout`}
                    />
                  </div>
                </div>

                {/* Section 2 — Tax Slabs */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Your Tax Slab
                  </label>
                  <div className="mb-3">
                    <div className="text-[11px] font-medium text-slate-500 mb-2">
                      Current Slab (drives 80C benefit)
                    </div>
                    <div className="flex gap-2">
                      {SLAB_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCurrentSlab(s)}
                          className={cn(
                            'flex-1 px-2 py-2 text-xs rounded-lg border font-semibold transition-all',
                            currentSlab === s
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-surface-300 hover:border-indigo-300'
                          )}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">
                      Post-Retirement Slab (taxes NPS annuity)
                    </div>
                    <div className="flex gap-2">
                      {RET_SLAB_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRetirementSlab(s)}
                          className={cn(
                            'flex-1 px-2 py-2 text-xs rounded-lg border font-semibold transition-all',
                            retirementSlab === s
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-600 border-surface-300 hover:border-amber-300'
                          )}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3 — Return Assumptions */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Return Assumptions
                  </label>

                  {/* PPF locked display */}
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="w-4 h-4 text-green-600" />
                        <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">
                          PPF Rate
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-green-700">7.1% p.a.</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Govt-notified, revised quarterly. Locked in this tool.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <NumberInput
                      label="ELSS Expected Return"
                      value={elssReturn}
                      onChange={setElssReturn}
                      suffix="% p.a."
                      step={0.5}
                      min={8}
                      max={15}
                      hint={`Net return = ${elssReturn}% − ${elssTER}% TER (Regular Plan)`}
                    />
                    <NumberInput
                      label="NPS Expected Return"
                      value={npsReturn}
                      onChange={setNpsReturn}
                      suffix="% p.a."
                      step={0.5}
                      min={7}
                      max={12}
                      hint="Balanced Active Choice 50E-30C-20G"
                    />
                    <NumberInput
                      label="NPS Annuity Rate at 60"
                      value={annuityRate}
                      onChange={setAnnuityRate}
                      suffix="% p.a."
                      step={0.25}
                      min={5}
                      max={8}
                      hint="Applied to the mandatory 40% annuity corpus"
                    />
                  </div>
                </div>

                {/* Section 4 — Smart Mix */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Smart Mix Allocation
                  </label>
                  <div className="space-y-3">
                    <NumberInput
                      label="PPF %"
                      value={ppfAllocPct}
                      onChange={setPpfAllocPct}
                      suffix="%"
                      step={1}
                      min={0}
                      max={100}
                    />
                    <NumberInput
                      label="ELSS %"
                      value={elssAllocPct}
                      onChange={setElssAllocPct}
                      suffix="%"
                      step={1}
                      min={0}
                      max={100}
                    />
                    <NumberInput
                      label="NPS %"
                      value={npsAllocPct}
                      onChange={setNpsAllocPct}
                      suffix="%"
                      step={1}
                      min={0}
                      max={100}
                    />
                    <div
                      className={cn(
                        'text-[11px] px-3 py-1.5 rounded-lg',
                        mixTotalPct === 100
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      Total: {mixTotalPct}%{' '}
                      {mixTotalPct !== 100 && '(normalized to 100% in calc)'}
                    </div>
                  </div>

                  {/* 80CCD(1B) toggle */}
                  <button
                    type="button"
                    onClick={() => setUseExtra1B(!useExtra1B)}
                    className={cn(
                      'w-full mt-4 p-3 rounded-lg border text-left transition-all',
                      useExtra1B
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-surface-300 hover:border-amber-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                          useExtra1B
                            ? 'bg-amber-600 border-amber-600'
                            : 'bg-white border-surface-300'
                        )}
                      >
                        {useExtra1B && (
                          <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-primary-700">
                          Use extra ₹50,000 under Sec 80CCD(1B)
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Exclusive to NPS — over and above the ₹1.5L 80C cap.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Hero metric */}
              <div className="mt-8 space-y-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Best Single-Instrument Route
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-700">
                    {bestRouteName.name}: {formatINR(bestRouteName.value)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Post-tax over {horizon} years
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-green-600" />
                    <span className="text-[11px] text-slate-500 font-medium">PPF Route</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    {formatINR(result.ppfPostTax)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                    <span className="text-[11px] text-slate-500 font-medium">ELSS Route</span>
                  </div>
                  <span className="text-sm font-bold text-violet-700">
                    {formatINR(result.elssPostTax)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] text-slate-500 font-medium">NPS Route</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    {formatINR(result.npsPostTax)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Smart Mix ({ppfAllocPct}/{elssAllocPct}/{npsAllocPct})
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatINR(result.mixPostTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Results Panel ─── */}
            <div className="space-y-8">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="PPF vs ELSS vs NPS — 80C Showdown"
                  fileName="ppf-vs-elss-vs-nps-calculator"
                />
              </div>

              {/* Hero — 3 big numbers */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  {horizon}-Year Post-Tax Comparison
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Same {formatINR(annualContribution)}/yr routed three different ways.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <PiggyBank className="w-4 h-4 text-green-600" />
                      <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">
                        PPF Route
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-green-700 mb-1">
                      {formatINR(result.ppfPostTax)}
                    </div>
                    <div className="text-[11px] text-slate-500">Tax-free (EEE)</div>
                  </div>

                  <div className="rounded-xl p-5 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                      <span className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
                        ELSS Route
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-violet-700 mb-1">
                      {formatINR(result.elssPostTax)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Post LTCG · Tax {formatINR(result.elssTax)}
                    </div>
                  </div>

                  <div className="rounded-xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Landmark className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                        NPS Route
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-amber-700 mb-1">
                      {formatINR(result.npsPostTax)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      60% lump + 40% annuity (20 yrs)
                    </div>
                  </div>
                </div>

                {/* Winner callout */}
                <div className="rounded-xl p-4 bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-900 leading-relaxed">
                    <span className="font-bold">{bestRouteName.name}</span> wins this comparison at{' '}
                    <span className="font-bold">{formatINR(bestRouteName.value)}</span> post-tax.{' '}
                    {ppfVsElssDelta > 0
                      ? `ELSS gives ${formatINR(ppfVsElssDelta)} more than PPF over ${horizon} years.`
                      : `PPF holds its own against ELSS in this scenario.`}{' '}
                    Smart Mix at {formatINR(result.mixPostTax)} — diversified across risk profiles.
                  </p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Side-by-Side Post-Tax Corpus</h3>
                <p className="text-sm text-slate-500 mb-6">
                  PPF, ELSS, NPS, and the Smart Mix — all starting from the same annual outlay.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="Corpus" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line chart — year-by-year */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Year-by-Year Corpus Build-up
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Watch equity (ELSS) pull away from fixed-income (PPF) as the compounding
                  differential widens.
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lineData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="PPF"
                        stroke={COLORS.ppf}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ELSS"
                        stroke={COLORS.elss}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="NPS"
                        stroke={COLORS.nps}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tax savings card */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Sec 80C Tax Savings Over {horizon} Years
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  At your {currentSlab}% slab, every ₹1.5L contribution saves {currentSlab}% × ₹1.5L ={' '}
                  {formatINR(SEC_80C_CAP * (currentSlab / 100))} in tax per year.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg p-4 bg-green-50 border border-green-100">
                    <div className="text-[10px] text-green-700 uppercase tracking-wider font-semibold mb-1">
                      Via PPF
                    </div>
                    <div className="text-base font-extrabold text-green-700">
                      {formatINR(result.ppfTaxSaved)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 border border-violet-100">
                    <div className="text-[10px] text-violet-700 uppercase tracking-wider font-semibold mb-1">
                      Via ELSS
                    </div>
                    <div className="text-base font-extrabold text-violet-700">
                      {formatINR(result.elssTaxSaved)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-amber-50 border border-amber-100">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold mb-1">
                      Via NPS (80C + 1B)
                    </div>
                    <div className="text-base font-extrabold text-amber-700">
                      {formatINR(result.npsTaxSavedTotal)}
                    </div>
                    {useExtra1B && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Incl. {formatINR(result.nps1BTaxSaved)} via 80CCD(1B)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NPS payout breakdown */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">NPS Payout Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">
                  At age 60, NPS rules mandate: 60% lump sum (tax-free) + 40% annuity purchase
                  (taxable income for life).
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100">
                    <div className="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold mb-1">
                      60% Lump Sum (Tax-free)
                    </div>
                    <div className="text-lg font-extrabold text-emerald-700">
                      {formatINR(result.npsLump)}
                    </div>
                  </div>
                  <div className="rounded-xl p-4 bg-amber-50 border border-amber-100">
                    <div className="text-[11px] text-amber-700 uppercase tracking-wider font-semibold mb-1">
                      40% Annuity Corpus
                    </div>
                    <div className="text-lg font-extrabold text-amber-700">
                      {formatINR(result.npsAnnuityCorpus)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ~{formatINR(result.npsAnnuityAnnualGross)}/yr gross → {formatINR(result.npsAnnuityAnnualNet)}/yr post-tax @ {retirementSlab}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-600 leading-relaxed">
                  Lifetime annuity value (20 yrs, simple undiscounted):{' '}
                  <span className="font-bold">{formatINR(result.npsAnnuityTotalNet)}</span>. Total
                  NPS Route = Lump + Annuity ={' '}
                  <span className="font-bold">{formatINR(result.npsPostTax)}</span>.
                </div>
              </div>

              {/* Smart Mix Scenario */}
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200"
                data-pdf-keep-together
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-primary-700">
                    Smart Mix Scenario ({ppfAllocPct}/{elssAllocPct}/{npsAllocPct})
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  How CFPs typically structure Section 80C — diversification across risk
                  profiles. Part capital-safe, part equity-powered, part retirement-locked.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg p-3 bg-white/70 border border-green-100">
                    <div className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">
                      PPF Sleeve
                    </div>
                    <div className="text-sm font-extrabold text-green-700">
                      {formatINR(result.mixPpfCorpus)}
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-white/70 border border-violet-100">
                    <div className="text-[10px] text-violet-700 uppercase tracking-wider font-semibold">
                      ELSS Sleeve
                    </div>
                    <div className="text-sm font-extrabold text-violet-700">
                      {formatINR(result.mixElssCorpus)}
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-white/70 border border-amber-100">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">
                      NPS Sleeve
                    </div>
                    <div className="text-sm font-extrabold text-amber-700">
                      {formatINR(result.mixNpsCorpus)}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl p-4 bg-indigo-600 text-white">
                  <div className="text-[11px] uppercase tracking-wider font-semibold opacity-80 mb-1">
                    Smart Mix Total (Post-Tax)
                  </div>
                  <div className="text-2xl font-extrabold">{formatINR(result.mixPostTax)}</div>
                </div>
              </div>

              {/* Year-by-year table */}
              <div className="card-base overflow-hidden" data-pdf-hide>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Corpus</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Pre-tax corpus at the end of each year (before final LTCG / annuity split).
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Year
                        </th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Age
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          PPF
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          ELSS
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          NPS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayYears.map((row, idx) => (
                        <>
                          {showEllipsis && idx === 5 && (
                            <tr key="ellipsis" className="border-b border-surface-200">
                              <td
                                colSpan={5}
                                className="py-3 px-6 text-center text-slate-400 text-xs font-medium tracking-wider"
                              >
                                ... {result.yearly.length - 10} more years ...
                              </td>
                            </tr>
                          )}
                          <tr
                            key={row.year}
                            className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors"
                          >
                            <td className="py-3 px-6 font-medium text-primary-700">
                              Year {row.year}
                            </td>
                            <td className="py-3 px-6 text-center text-slate-600">{row.age}</td>
                            <td className="py-3 px-6 text-right text-green-700 font-medium">
                              {formatINR(row.ppf)}
                            </td>
                            <td className="py-3 px-6 text-right text-violet-700 font-medium">
                              {formatINR(row.elss)}
                            </td>
                            <td className="py-3 px-6 text-right text-amber-700 font-medium">
                              {formatINR(row.nps)}
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {insights.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border',
                        item.color
                      )}
                    >
                      {item.icon}
                      <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CFP Note */}
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                      CFP Note
                    </div>
                    <h4 className="text-lg font-extrabold text-primary-700 mb-2">
                      The &ldquo;best&rdquo; 80C instrument depends on horizon, risk, and liquidity.
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      PPF = capital safety + tax-free maturity, 15-year lock. ELSS (Equity Linked
                      Savings Scheme) = equity growth + just 3-year liquidity per tranche + LTCG
                      tax above ₹1.25L. NPS = lowest rupee saved per rupee of tax break (60%
                      forced lump + 40% annuity locked till death), but the extra ₹50K 80CCD(1B)
                      is exclusive and valuable. Most investors benefit from a blend.{' '}
                      {name ? `${name}, speak` : 'Speak'} to your Relationship Manager to structure an allocation matched to your goals, horizon, and tax bracket — and to invest in ELSS via Regular Plan with ongoing behavioural coaching.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contribution summary */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee className="w-5 h-5 text-slate-500" />
                  <h3 className="font-bold text-primary-700">Total Out-of-Pocket</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">
                      PPF Contributions
                    </div>
                    <div className="text-sm font-bold text-green-700">
                      {formatINR(result.ppfContribTotal)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-violet-50">
                    <div className="text-[10px] text-violet-700 uppercase tracking-wider font-semibold">
                      ELSS Contributions
                    </div>
                    <div className="text-sm font-bold text-violet-700">
                      {formatINR(result.elssContribTotal)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">
                      NPS Contributions
                    </div>
                    <div className="text-sm font-bold text-amber-700">
                      {formatINR(result.npsContribTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <CalculatorLeadForm
        calculatorName="PPF vs ELSS vs NPS — 80C Showdown"
        heading="Want help structuring your Section 80C allocation?"
        subtext="Share your contact — we'll size a PPF + ELSS + NPS blend for your horizon, tax bracket, and goals. Zero obligation, AMFI-registered Mutual Fund Distributor (ARN-286886)."
        resultContext={resultContext}
        accent="indigo"
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund} PPF rate of 7.1% is the current
            quarterly-notified rate and is subject to change. NPS equity exposure and returns
            depend on chosen scheme and allocation. Annuity rates shown are illustrative; actual
            rates depend on the annuity provider, type, and age at purchase. LTCG on equity
            mutual funds is as per prevailing tax rules; calculator uses 12.5% above ₹1.25L
            exemption (Budget 2024 rates, effective 23-Jul-2024, applicable FY 2025-26 onwards). Tax slabs and Sec 80C / 80CCD(1B) limits are subject to
            change as per the prevailing Income Tax Act. ELSS investments shown here are via the
            Regular Plan route through an AMFI-registered Mutual Fund Distributor.
          </p>
        </div>
      </section>
    </>
  );
}
