'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Gift,
  ArrowLeft,
  ArrowUp,
  Heart,
  Coins,
  Shirt,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
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
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

const PIE_COLORS = ['#E11D48', '#F59E0B', '#7C3AED', '#0EA5E9'];

const CEREMONY_COLOR = '#E11D48';
const GOLD_COLOR = '#F59E0B';
const CLOTHES_COLOR = '#7C3AED';
const GIFTS_COLOR = '#0EA5E9';

type Route = 'sip-only' | 'sip-sgb';

export default function MarriagePlannerCalculatorPage() {
  // Personal
  const [parentName, setParentName] = useState('');
  const [parentAge, setParentAge] = useState<number | null>(35);

  // Child name & timeline
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(5);
  const [targetMarriageAge, setTargetMarriageAge] = useState(25);

  // Wedding budget components (today\u2019s value)
  const [ceremonyCost, setCeremonyCost] = useState(1500000); // 15L
  const [goldGrams, setGoldGrams] = useState(200);
  const [goldRatePerGram, setGoldRatePerGram] = useState(7500);
  const [clothesCost, setClothesCost] = useState(500000); // 5L
  const [giftsCost, setGiftsCost] = useState(500000); // 5L

  // Inflation
  const [considerInflation, setConsiderInflation] = useState(true);
  const [weddingInflation, setWeddingInflation] = useState(8);
  const [goldInflation, setGoldInflation] = useState(10);

  // Existing corpus earmarked
  const [existingCorpus, setExistingCorpus] = useState(0);

  // SIP assumptions
  const [sipReturn, setSipReturn] = useState(12);
  const [route, setRoute] = useState<Route>('sip-only');
  const [sgbSplit, setSgbSplit] = useState(30); // % to SGB
  const SGB_RETURN = 9; // assumed blended SGB return

  // Step-up SIP — supports both percentage and fixed-amount annual step-up
  const [stepUpEnabled, setStepUpEnabled] = useState(true);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'amount'>('percentage');
  const [stepUpRate, setStepUpRate] = useState(10); // % p.a. — used when stepUpType === 'percentage'
  const [stepUpAmount, setStepUpAmount] = useState(1000); // ₹/month annual increase — used when stepUpType === 'amount'

  const goldTodayCost = useMemo(
    () => goldGrams * goldRatePerGram,
    [goldGrams, goldRatePerGram]
  );

  const totalWeddingToday = useMemo(
    () => ceremonyCost + goldTodayCost + clothesCost + giftsCost,
    [ceremonyCost, goldTodayCost, clothesCost, giftsCost]
  );

  const result = useMemo(() => {
    const yearsToWedding = Math.max(0, targetMarriageAge - childAge);
    // If user opts out of inflation, costs stay frozen at today's level.
    const wInf = considerInflation ? weddingInflation / 100 : 0;
    const gInf = considerInflation ? goldInflation / 100 : 0;

    // Future costs
    const fvCeremony = ceremonyCost * Math.pow(1 + wInf, yearsToWedding);
    const fvGold = goldTodayCost * Math.pow(1 + gInf, yearsToWedding);
    const fvClothes = clothesCost * Math.pow(1 + wInf, yearsToWedding);
    const fvGifts = giftsCost * Math.pow(1 + wInf, yearsToWedding);
    const futureTotalCost = fvCeremony + fvGold + fvClothes + fvGifts;

    // FV of existing corpus
    // Use SIP return for existing corpus (assume it\u2019s invested in same mix)
    let blendedReturn = sipReturn;
    if (route === 'sip-sgb') {
      const eqWeight = (100 - sgbSplit) / 100;
      const sgbWeight = sgbSplit / 100;
      blendedReturn = sipReturn * eqWeight + SGB_RETURN * sgbWeight;
    }
    const fvExisting = existingCorpus * Math.pow(1 + blendedReturn / 100, yearsToWedding);

    const shortfall = Math.max(0, futureTotalCost - fvExisting);

    // Required monthly SIP (with optional step-up)
    // Two modes:
    //   percentage — Year y monthly = S × (1+r)^(y-1)   →   shortfall = S × fvOfUnit
    //   amount     — Year y monthly = S + A × (y-1)     →   shortfall = S × fvOfUnitS + A × fvOfUnitA
    // In the amount mode, A is user-supplied (₹ per month annual increase) and we solve for the
    // initial S. The same FV building blocks are used; we just split the contribution into
    // a "base" leg (unit S) and a "step" leg (unit A).
    const n = yearsToWedding;
    const rAnnual = blendedReturn / 100;
    const rMonthly = rAnnual / 12;
    const stepPct = stepUpEnabled && stepUpType === 'percentage' ? stepUpRate / 100 : 0;
    const stepAmt = stepUpEnabled && stepUpType === 'amount' ? stepUpAmount : 0;

    // FV factor for one year's monthly contributions @ end of year n
    // (12-month annuity FV at year y, compounded for (n-y) more years)
    const fvFactor = (y: number) => {
      const yearsRemaining = n - y;
      const annuityYearY =
        rMonthly !== 0
          ? (Math.pow(1 + rMonthly, 12) - 1) / rMonthly
          : 12;
      return annuityYearY * Math.pow(1 + rAnnual, yearsRemaining);
    };

    let fvOfUnitS = 0; // FV of ₹1/month base — multiplier on S
    let fvOfUnitA = 0; // FV of ₹1/month annual increase — multiplier on A
    if (n > 0) {
      for (let y = 1; y <= n; y++) {
        const factor = fvFactor(y);
        // Percentage mode: contribution scales by (1+stepPct)^(y-1)
        // Amount mode: contribution = S + A*(y-1)
        const pctMultiplier = Math.pow(1 + stepPct, y - 1);
        fvOfUnitS += factor * pctMultiplier;
        fvOfUnitA += factor * (y - 1); // only used in amount mode
      }
    }

    let requiredMonthlySIP = 0;
    if (fvOfUnitS > 0) {
      // shortfall = S × fvOfUnitS + A × fvOfUnitA   (A = 0 in percentage mode)
      requiredMonthlySIP = (shortfall - stepAmt * fvOfUnitA) / fvOfUnitS;
      // Clamp to zero if the fixed step-up alone over-funds the goal
      if (requiredMonthlySIP < 0) requiredMonthlySIP = 0;
    }

    // If SGB route: split monthly SIP between Equity MF and SGB
    const eqMonthlySIP =
      route === 'sip-sgb'
        ? requiredMonthlySIP * ((100 - sgbSplit) / 100)
        : requiredMonthlySIP;
    const sgbMonthlySIP =
      route === 'sip-sgb' ? requiredMonthlySIP * (sgbSplit / 100) : 0;

    // Helper: actual monthly SIP at year y given the chosen step-up mode
    const monthlyAtYear = (baseMonthly: number, baseStepAmt: number, y: number) => {
      if (stepPct > 0) return baseMonthly * Math.pow(1 + stepPct, y - 1);
      if (stepAmt > 0) return baseMonthly + baseStepAmt * (y - 1);
      return baseMonthly;
    };
    // Split the fixed-amount step-up A proportionally for SGB route
    const stepAmtEq = route === 'sip-sgb' ? stepAmt * ((100 - sgbSplit) / 100) : stepAmt;
    const stepAmtSgb = route === 'sip-sgb' ? stepAmt * (sgbSplit / 100) : 0;

    // Grams accumulated via SGB (current rate, assumed grams = total SGB invested / today's rate)
    // For user intent: today's purchasing power lock
    let totalSgbInvested = 0;
    for (let y = 1; y <= n; y++) {
      totalSgbInvested += monthlyAtYear(sgbMonthlySIP, stepAmtSgb, y) * 12;
    }
    const gramsLockedToday =
      goldRatePerGram > 0 ? totalSgbInvested / goldRatePerGram : 0;

    // Year-by-year growth for chart
    const growthSeries: {
      year: number;
      age: number;
      monthlySIP: number;          // total monthly SIP this year (Equity + SGB)
      eqMonthlyThisYear: number;   // Equity portion
      sgbMonthlyThisYear: number;  // SGB portion (0 if SIP-only route)
      annualInvestment: number;    // = monthlySIP × 12
      cumulativeInvested: number;  // running total invested by end of this year
      equityCorpus: number;
      sgbCorpus: number;
      totalCorpus: number;
      target: number;
    }[] = [];

    if (n > 0 && requiredMonthlySIP > 0) {
      let equityCorpus =
        route === 'sip-sgb'
          ? existingCorpus * ((100 - sgbSplit) / 100)
          : existingCorpus;
      let sgbCorpus =
        route === 'sip-sgb' ? existingCorpus * (sgbSplit / 100) : 0;

      const eqAnnualReturn = sipReturn / 100;
      const sgbAnnualReturn = SGB_RETURN / 100;
      let cumulativeInvested = 0;

      for (let y = 1; y <= n; y++) {
        const eqMonthly = monthlyAtYear(eqMonthlySIP, stepAmtEq, y);
        const sgbMonthly = monthlyAtYear(sgbMonthlySIP, stepAmtSgb, y);
        const totalMonthly = eqMonthly + sgbMonthly;
        const annualInvestment = totalMonthly * 12;
        cumulativeInvested += annualInvestment;

        // Compound existing corpus for this year
        equityCorpus = equityCorpus * (1 + eqAnnualReturn);
        sgbCorpus = sgbCorpus * (1 + sgbAnnualReturn);

        // Add this year's contributions (approximate: sum of 12 monthly FVs)
        const eqMonthlyRate = eqAnnualReturn / 12;
        const sgbMonthlyRate = sgbAnnualReturn / 12;
        const eqYearFV =
          eqMonthlyRate !== 0
            ? eqMonthly * ((Math.pow(1 + eqMonthlyRate, 12) - 1) / eqMonthlyRate)
            : eqMonthly * 12;
        const sgbYearFV =
          sgbMonthlyRate !== 0
            ? sgbMonthly *
              ((Math.pow(1 + sgbMonthlyRate, 12) - 1) / sgbMonthlyRate)
            : sgbMonthly * 12;

        equityCorpus += eqYearFV;
        sgbCorpus += sgbYearFV;

        // Target grows with blended wedding inflation (use blend of w & g weighted by split)
        const goldWeight = goldTodayCost / (totalWeddingToday || 1);
        const blendedInf = wInf * (1 - goldWeight) + gInf * goldWeight;
        const targetAtY = totalWeddingToday * Math.pow(1 + blendedInf, y);

        growthSeries.push({
          year: y,
          age: childAge + y,
          monthlySIP: Math.round(totalMonthly),
          eqMonthlyThisYear: Math.round(eqMonthly),
          sgbMonthlyThisYear: Math.round(sgbMonthly),
          annualInvestment: Math.round(annualInvestment),
          cumulativeInvested: Math.round(cumulativeInvested),
          equityCorpus: Math.round(equityCorpus),
          sgbCorpus: Math.round(sgbCorpus),
          totalCorpus: Math.round(equityCorpus + sgbCorpus),
          target: Math.round(targetAtY),
        });
      }
    }

    return {
      yearsToWedding: n,
      fvCeremony: Math.round(fvCeremony),
      fvGold: Math.round(fvGold),
      fvClothes: Math.round(fvClothes),
      fvGifts: Math.round(fvGifts),
      futureTotalCost: Math.round(futureTotalCost),
      fvExisting: Math.round(fvExisting),
      shortfall: Math.round(shortfall),
      requiredMonthlySIP: Math.round(requiredMonthlySIP),
      eqMonthlySIP: Math.round(eqMonthlySIP),
      sgbMonthlySIP: Math.round(sgbMonthlySIP),
      gramsLockedToday,
      blendedReturn,
      growthSeries,
    };
  }, [
    childAge,
    targetMarriageAge,
    ceremonyCost,
    goldTodayCost,
    clothesCost,
    giftsCost,
    considerInflation,
    weddingInflation,
    goldInflation,
    existingCorpus,
    sipReturn,
    route,
    sgbSplit,
    stepUpEnabled,
    stepUpType,
    stepUpRate,
    stepUpAmount,
    goldRatePerGram,
    totalWeddingToday,
  ]);

  // Pie data for cost breakdown (future)
  const pieData = [
    { name: 'Ceremony & Venue', value: result.fvCeremony, color: PIE_COLORS[0] },
    { name: 'Gold Jewellery', value: result.fvGold, color: PIE_COLORS[1] },
    { name: 'Clothes / Household', value: result.fvClothes, color: PIE_COLORS[2] },
    { name: 'Gifts / Misc', value: result.fvGifts, color: PIE_COLORS[3] },
  ].filter((d) => d.value > 0);

  // Insights
  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (result.yearsToWedding === 0) {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />,
        text: `Target age equals child's current age (${childAge}). Increase the target marriage age to plan ahead.`,
        color: 'bg-red-50 border-red-200',
      });
      return items;
    }

    items.push({
      icon: <Calendar className="w-5 h-5 text-rose-600 shrink-0" />,
      text: `You have ${result.yearsToWedding} years to build a wedding corpus of ${formatINR(result.futureTotalCost)}. Starting early lets compounding do the heavy lifting.`,
      color: 'bg-rose-50 border-rose-200',
    });

    items.push({
      icon: <Coins className="w-5 h-5 text-amber-600 shrink-0" />,
      text: `Gold inflation has averaged 10% vs CPI 6% over the last 20 years. Locking grams via Sovereign Gold Bonds (SGB) protects against rising gold prices and adds a 2.5% annual coupon on top.`,
      color: 'bg-amber-50 border-amber-200',
    });

    if (route === 'sip-sgb' && result.gramsLockedToday > 0) {
      items.push({
        icon: <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />,
        text: `Allocating ${sgbSplit}% to SGB is equivalent to accumulating roughly ${result.gramsLockedToday.toFixed(0)} grams of gold at today's rate (\u20B9${goldRatePerGram}/g) \u2014 a direct hedge for jewellery intent.`,
        color: 'bg-purple-50 border-purple-200',
      });
    } else {
      items.push({
        icon: <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />,
        text: `Consider the SIP + SGB route: split a portion (e.g., 30%) into Sovereign Gold Bonds to hedge the jewellery component of your wedding budget.`,
        color: 'bg-purple-50 border-purple-200',
      });
    }

    if (stepUpEnabled) {
      const stepText =
        stepUpType === 'percentage'
          ? `A ${stepUpRate}% annual step-up`
          : `Adding \u20b9${stepUpAmount.toLocaleString('en-IN')}/month every year`;
      items.push({
        icon: <TrendingUp className="w-5 h-5 text-teal-600 shrink-0" />,
        text: `${stepText} on your SIP lets you start with a smaller base amount and grow contributions as your income rises, keeping the plan affordable.`,
        color: 'bg-teal-50 border-teal-200',
      });
    } else {
      items.push({
        icon: <TrendingUp className="w-5 h-5 text-teal-600 shrink-0" />,
        text: `Enable a step-up SIP \u2014 either a percentage (e.g. 10% p.a.) or a fixed rupee amount (e.g. \u20b91,000/month every year). You can start smaller today and grow with your income \u2014 easier than committing the full amount upfront.`,
        color: 'bg-teal-50 border-teal-200',
      });
    }

    items.push({
      icon: <Target className="w-5 h-5 text-blue-600 shrink-0" />,
      text: `Review this plan every 2\u20133 years. Wedding aspirations, gold prices, and family circumstances change \u2014 your Trustner Relationship Manager can rebalance equity and SGB allocations annually.`,
      color: 'bg-blue-50 border-blue-200',
    });

    return items;
  }, [result, childAge, route, sgbSplit, goldRatePerGram, stepUpEnabled, stepUpType, stepUpRate, stepUpAmount]);

  const leadContext = `${childName ? `${childName}'s` : "Child's"} marriage planned at age ${targetMarriageAge} (in ${result.yearsToWedding} yrs) \u2014 future cost ${formatINR(result.futureTotalCost)}, monthly SIP needed ${formatINR(result.requiredMonthlySIP)}${route === 'sip-sgb' ? ` (${100 - sgbSplit}% Equity + ${sgbSplit}% SGB)` : ''}`;

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
              <Gift className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Marriage Planner
              </h1>
              <p className="text-slate-300 mt-1">
                Plan a wedding for your son or daughter with gold-inflation-aware projections. Split between equity SIP and Sovereign Gold Bonds, with fixed-₹ or percentage annual step-up.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ─── Input Panel ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-4 text-lg">Your Details</h2>

              <PersonalInfoBar
                name={parentName}
                onNameChange={setParentName}
                age={parentAge}
                onAgeChange={setParentAge}
                ageLabel="Your Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-5">
                {/* Child */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Child&rsquo;s Details
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Child&rsquo;s Name</label>
                      <input
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="e.g., Aarav or Ananya"
                        className="w-full px-3 py-2 rounded-lg border border-surface-300 bg-white text-sm text-primary-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all"
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
                      max={30}
                    />
                    <NumberInput
                      label="Target Marriage Age"
                      value={targetMarriageAge}
                      onChange={setTargetMarriageAge}
                      suffix="Years"
                      step={1}
                      min={21}
                      max={35}
                      hint="Typical: 24–28 (daughter) / 26–30 (son)"
                    />
                  </div>
                </div>

                {/* Wedding Budget */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Wedding Budget (Today)
                  </label>
                  <div className="space-y-4">
                    <NumberInput
                      label="Ceremony & Venue"
                      value={ceremonyCost}
                      onChange={setCeremonyCost}
                      prefix="₹"
                      step={10000}
                      min={10000}
                      max={100000000}
                      hint="Venue, catering, decor, music, photography (up to ₹10 Cr)"
                    />

                    {/* Gold jewellery block */}
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <span className="text-[12px] font-semibold text-amber-800">
                          Gold Jewellery
                        </span>
                      </div>
                      <NumberInput
                        label="Grams of Gold"
                        value={goldGrams}
                        onChange={setGoldGrams}
                        suffix="g"
                        step={10}
                        min={0}
                        max={10000}
                      />
                      <NumberInput
                        label="Rate per gram (today)"
                        value={goldRatePerGram}
                        onChange={setGoldRatePerGram}
                        prefix="₹"
                        step={100}
                        min={3000}
                        max={50000}
                      />
                      <div className="flex items-center justify-between text-[11px] bg-white border border-amber-200/50 rounded-lg px-3 py-2">
                        <span className="text-slate-500">Gold cost today</span>
                        <span className="font-bold text-amber-700">
                          {formatINR(goldTodayCost)}
                        </span>
                      </div>
                    </div>

                    <NumberInput
                      label="Clothes / Household Setup"
                      value={clothesCost}
                      onChange={setClothesCost}
                      prefix="₹"
                      step={10000}
                      min={10000}
                      max={100000000}
                    />
                    <NumberInput
                      label="Gifts / Miscellaneous"
                      value={giftsCost}
                      onChange={setGiftsCost}
                      prefix="₹"
                      step={10000}
                      min={10000}
                      max={100000000}
                    />

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/50">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-600" />
                        <span className="text-[11px] font-semibold text-slate-600">
                          Total Wedding Cost (Today)
                        </span>
                      </div>
                      <span className="text-sm font-bold text-rose-700">
                        {formatINR(totalWeddingToday)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inflation Toggle — explicit question */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Are You Planning For Inflation?
                  </label>
                  <div className={cn(
                    'rounded-xl border p-4 transition-colors',
                    considerInflation ? 'border-rose-200 bg-rose-50/40' : 'border-red-200 bg-red-50/40'
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
                          Yes — factor in wedding & gold inflation
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Today&apos;s ₹{(totalWeddingToday / 100000).toFixed(1)}L will cost much more in {Math.max(0, targetMarriageAge - childAge)} years
                        </div>
                      </div>
                      <div className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', considerInflation ? 'bg-rose-600' : 'bg-slate-300')}>
                        <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', considerInflation ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>

                    {considerInflation ? (
                      <div className="mt-4 space-y-4">
                        <NumberInput
                          label="Wedding Inflation"
                          value={weddingInflation}
                          onChange={setWeddingInflation}
                          suffix="% p.a."
                          step={0.5}
                          min={4}
                          max={15}
                          hint="Venue, clothes, gifts — typically CPI + 2%"
                        />
                        <NumberInput
                          label="Gold Inflation"
                          value={goldInflation}
                          onChange={setGoldInflation}
                          suffix="% p.a."
                          step={0.5}
                          min={4}
                          max={15}
                          hint="Gold has averaged ~10% p.a. over last 2 decades"
                        />
                        {(() => {
                          const yrs = Math.max(0, targetMarriageAge - childAge);
                          const projCost =
                            ceremonyCost * Math.pow(1 + weddingInflation / 100, yrs)
                            + goldTodayCost * Math.pow(1 + goldInflation / 100, yrs)
                            + clothesCost * Math.pow(1 + weddingInflation / 100, yrs)
                            + giftsCost * Math.pow(1 + weddingInflation / 100, yrs);
                          return (
                            <div className="flex items-center justify-between text-[11px] bg-white border border-rose-200 rounded-lg px-3 py-2">
                              <span className="text-slate-500">Projected wedding cost in {yrs} years:</span>
                              <span className="font-bold text-rose-700">₹{(projCost / 100000).toFixed(1)} L</span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="mt-3 p-3 rounded-lg bg-red-100/60 border border-red-200 text-[11px] text-red-800 leading-relaxed">
                        <strong>⚠ Not recommended.</strong> Wedding costs rise ~8% p.a.; gold has averaged ~10% p.a. Ignoring inflation means you&apos;ll fall short by a wide margin when the actual wedding happens.
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing Corpus */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Existing Corpus
                  </label>
                  <NumberInput
                    label="Amount already earmarked"
                    value={existingCorpus}
                    onChange={setExistingCorpus}
                    prefix="₹"
                    step={10000}
                    min={0}
                    max={100000000}
                    hint="Any MF / FD / gold savings already set aside (up to ₹10 Cr)"
                  />
                </div>

                {/* SIP Route */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Investment Route
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setRoute('sip-only')}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                        route === 'sip-only'
                          ? 'bg-rose-600 text-white border-rose-600 shadow'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-rose-300'
                      )}
                    >
                      Equity MF SIP only
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoute('sip-sgb')}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                        route === 'sip-sgb'
                          ? 'bg-amber-600 text-white border-amber-600 shadow'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-amber-300'
                      )}
                    >
                      SIP + SGB split
                    </button>
                  </div>

                  {route === 'sip-sgb' && (
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/50 mb-4 space-y-3">
                      <NumberInput
                        label={`SGB Allocation (${100 - sgbSplit}% Equity / ${sgbSplit}% SGB)`}
                        value={sgbSplit}
                        onChange={setSgbSplit}
                        suffix="%"
                        step={5}
                        min={10}
                        max={60}
                        hint="SGB assumed to return 9% p.a. (gold price + 2.5% coupon)"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <NumberInput
                      label="Expected Equity SIP Return"
                      value={sipReturn}
                      onChange={setSipReturn}
                      suffix="% p.a."
                      step={0.5}
                      min={8}
                      max={16}
                    />
                  </div>
                </div>

                {/* Step-up */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Step-up SIP
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-100 border border-surface-300 mb-3">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4 text-teal-600" />
                      <span className="text-[12px] font-semibold text-slate-700">
                        Enable annual step-up
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStepUpEnabled(!stepUpEnabled)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-all',
                        stepUpEnabled ? 'bg-teal-600' : 'bg-surface-300'
                      )}
                      aria-label="Toggle step-up"
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                          stepUpEnabled && 'translate-x-5'
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
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
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
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
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
                          hint="Each year your SIP grows by this percentage. Typical: 10%."
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
              </div>

              {/* Hero Metric */}
              <div className="mt-8 space-y-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Future Wedding Cost (in {result.yearsToWedding} yrs)
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-rose-700">
                    {formatINR(result.futureTotalCost)}
                  </div>
                </div>

                <div className="rounded-xl p-4 bg-gradient-to-r from-brand-50 to-secondary-50">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Monthly SIP Needed
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold gradient-text">
                    {formatINR(result.requiredMonthlySIP)}
                  </div>
                  {route === 'sip-sgb' && result.requiredMonthlySIP > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {formatINR(result.eqMonthlySIP)} Equity &middot;{' '}
                      {formatINR(result.sgbMonthlySIP)} SGB
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Years to Wedding
                    </span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {result.yearsToWedding}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      FV of Existing Corpus
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    {formatINR(result.fvExisting)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Shortfall to Fund
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatINR(result.shortfall)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Charts & Results ─── */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="Marriage Planner"
                  fileName="marriage-planner"
                />
              </div>

              {/* Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4" data-pdf-keep-together>
                <div className="card-base p-5 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Today&rsquo;s Cost
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-rose-700">
                    {formatINR(totalWeddingToday)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Before inflation adjustment
                  </p>
                </div>

                <div className="card-base p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Gold @ Wedding
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-700">
                    {formatINR(result.fvGold)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {goldGrams}g grown at {goldInflation}% p.a.
                  </p>
                </div>

                <div className="card-base p-5 bg-gradient-to-br from-brand-50 to-teal-50 border-brand-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-brand-600" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Blended Return
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-brand-700">
                    {result.blendedReturn.toFixed(1)}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {route === 'sip-sgb'
                      ? `${100 - sgbSplit}% Equity + ${sgbSplit}% SGB`
                      : '100% Equity MF SIP'}
                  </p>
                </div>
              </div>

              {/* Cost Breakdown Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Wedding Cost Breakdown (at age {targetMarriageAge})
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  How your future wedding budget splits across ceremony, gold, clothes, and gifts
                </p>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ percent }) =>
                            `${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {pieData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-100"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-primary-700">
                          {formatINR(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIP vs SGB Comparison Card */}
              {route === 'sip-sgb' && result.requiredMonthlySIP > 0 && (
                <div
                  className="card-base p-6 bg-gradient-to-br from-amber-50/40 to-rose-50/40 border-amber-200/40"
                  data-pdf-keep-together
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-700">
                        Gold-Hedged Allocation
                      </h3>
                      <p className="text-sm text-slate-500">
                        Why splitting into Sovereign Gold Bonds matters for a wedding goal
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-surface-200">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                        Equity MF Bucket ({100 - sgbSplit}%)
                      </p>
                      <p className="text-lg font-extrabold text-brand-700">
                        {formatINR(result.eqMonthlySIP)}/mo
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Compounds at {sipReturn}% p.a. for long-term growth
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-amber-200">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                        SGB Bucket ({sgbSplit}%)
                      </p>
                      <p className="text-lg font-extrabold text-amber-700">
                        {formatINR(result.sgbMonthlySIP)}/mo
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tracks gold price + 2.5% annual coupon (tax-free at
                        maturity)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      <span className="font-bold text-amber-800">
                        At today&rsquo;s rate of &#8377;{goldRatePerGram}/g,
                      </span>{' '}
                      your {sgbSplit}% SGB allocation locks the intent to buy
                      approximately{' '}
                      <span className="font-bold text-amber-800">
                        {result.gramsLockedToday.toFixed(0)} grams
                      </span>{' '}
                      of gold for the wedding — a direct hedge against
                      rising gold prices over the next {result.yearsToWedding}{' '}
                      years.
                    </p>
                  </div>
                </div>
              )}

              {/* Corpus Growth Area Chart */}
              {result.growthSeries.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">
                    Corpus Growth vs Wedding Target
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Year-by-year accumulation towards {childName ? `${childName}’s` : 'your child’s'}
                    {' '}wedding goal
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={result.growthSeries}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="gradEquity"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0F766E"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0F766E"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                          <linearGradient
                            id="gradSGB"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#F59E0B"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#F59E0B"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          dataKey="age"
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                          label={{
                            value: "Child's Age",
                            position: 'insideBottom',
                            offset: -3,
                            fontSize: 11,
                            fill: '#94A3B8',
                          }}
                        />
                        <YAxis
                          tickFormatter={(v: number) => formatINR(v)}
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend iconType="circle" />
                        {route === 'sip-sgb' ? (
                          <>
                            <Area
                              type="monotone"
                              dataKey="equityCorpus"
                              stackId="1"
                              stroke="#0F766E"
                              fill="url(#gradEquity)"
                              name="Equity MF"
                            />
                            <Area
                              type="monotone"
                              dataKey="sgbCorpus"
                              stackId="1"
                              stroke="#F59E0B"
                              fill="url(#gradSGB)"
                              name="SGB"
                            />
                          </>
                        ) : (
                          <Area
                            type="monotone"
                            dataKey="totalCorpus"
                            stroke="#0F766E"
                            fill="url(#gradEquity)"
                            name="Equity SIP Corpus"
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="target"
                          stroke="#E11D48"
                          strokeWidth={2}
                          fill="transparent"
                          name="Wedding Target"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Year-by-Year SIP Breakup */}
              {result.growthSeries.length > 0 && (
                <div className="card-base overflow-hidden" data-pdf-keep-together>
                  <div className="p-6 pb-0">
                    <h3 className="font-bold text-primary-700 mb-1">
                      Year-by-Year SIP Breakup
                    </h3>
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
                          {route === 'sip-sgb' && (
                            <>
                              <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Equity</th>
                              <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">SGB</th>
                            </>
                          )}
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Invest</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cumulative Invested</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Corpus (EOY)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.growthSeries.map((row) => (
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-50/50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-primary-700">Yr {row.year}</td>
                            <td className="py-2.5 px-4 text-slate-600">{row.age}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-rose-700">{formatINR(row.monthlySIP)}</td>
                            {route === 'sip-sgb' && (
                              <>
                                <td className="py-2.5 px-4 text-right text-slate-600">{formatINR(row.eqMonthlyThisYear)}</td>
                                <td className="py-2.5 px-4 text-right text-amber-700">{formatINR(row.sgbMonthlyThisYear)}</td>
                              </>
                            )}
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatINR(row.annualInvestment)}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatINR(row.cumulativeInvested)}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-teal-700">{formatINR(row.totalCorpus)}</td>
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr className="bg-rose-50 font-bold border-t-2 border-rose-200">
                          <td className="py-3 px-4 text-primary-700">Total</td>
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4" />
                          {route === 'sip-sgb' && (<><td /><td /></>)}
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4 text-right text-primary-700">
                            {formatINR(result.growthSeries[result.growthSeries.length - 1]?.cumulativeInvested ?? 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-teal-700">
                            {formatINR(result.growthSeries[result.growthSeries.length - 1]?.totalCorpus ?? 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-surface-50 border-t border-surface-200 text-[11px] text-slate-500">
                    EOY = End of Year corpus including existing investments compounded at {sipReturn}% p.a.
                    {route === 'sip-sgb' && ` (SGB at ${SGB_RETURN}% p.a.)`}
                  </div>
                </div>
              )}

              {/* Future Cost Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">
                    Line-Item Future Cost
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Each component inflated to the target marriage year (age{' '}
                    {targetMarriageAge})
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Item
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Today
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Inflation
                        </th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          At Wedding
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 font-medium text-primary-700">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: CEREMONY_COLOR }}
                          />
                          Ceremony &amp; Venue
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {formatINR(ceremonyCost)}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {weddingInflation}%
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-primary-700">
                          {formatINR(result.fvCeremony)}
                        </td>
                      </tr>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 font-medium text-primary-700">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: GOLD_COLOR }}
                          />
                          Gold Jewellery ({goldGrams}g)
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {formatINR(goldTodayCost)}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {goldInflation}%
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-primary-700">
                          {formatINR(result.fvGold)}
                        </td>
                      </tr>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 font-medium text-primary-700">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: CLOTHES_COLOR }}
                          />
                          <Shirt className="inline w-3 h-3 mr-1 text-purple-600" />
                          Clothes / Household
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {formatINR(clothesCost)}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {weddingInflation}%
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-primary-700">
                          {formatINR(result.fvClothes)}
                        </td>
                      </tr>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 font-medium text-primary-700">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: GIFTS_COLOR }}
                          />
                          Gifts / Miscellaneous
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {formatINR(giftsCost)}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          {weddingInflation}%
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-primary-700">
                          {formatINR(result.fvGifts)}
                        </td>
                      </tr>
                      <tr className="bg-rose-50/50">
                        <td className="py-3 px-6 font-extrabold text-rose-700">
                          Total
                        </td>
                        <td className="py-3 px-6 text-right font-bold text-rose-700">
                          {formatINR(totalWeddingToday)}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-500 text-xs">
                          blended
                        </td>
                        <td className="py-3 px-6 text-right font-extrabold text-rose-700">
                          {formatINR(result.futureTotalCost)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">
                  Actionable Insights
                </h3>
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
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positive close */}
              <div
                className="card-base p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold text-green-700">
                      Good news:
                    </span>{' '}
                    With {result.yearsToWedding} years on your side and a
                    disciplined {formatINR(result.requiredMonthlySIP)}/month
                    SIP
                    {stepUpEnabled
                      ? stepUpType === 'percentage'
                        ? ` (stepping up ${stepUpRate}% annually)`
                        : ` (adding ₹${stepUpAmount.toLocaleString('en-IN')}/month every year)`
                      : ''}
                    , {childName ? `${childName}’s` : 'your child’s'} wedding is fully fundable. Your
                    Trustner Relationship Manager can pick the right funds and
                    rebalance allocations every year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form */}
      <CalculatorLeadForm
        calculatorName="Marriage Planner"
        accent="rose"
        heading="Turn this wedding plan into action"
        subtext="Share your contact and your Relationship Manager will help you pick the right equity funds and Sovereign Gold Bond tranches to match this goal. Zero obligation."
        resultContext={leadContext}
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
