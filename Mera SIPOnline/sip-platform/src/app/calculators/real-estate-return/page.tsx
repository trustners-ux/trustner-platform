'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Home, TrendingUp, TrendingDown, Landmark, Lightbulb, CheckCircle2,
  AlertTriangle, BarChart3, Sparkles,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

/* ─── CII (approximate, base FY 2001-02 = 100) ─── */
const CII: Record<number, number> = {
  2001: 100, 2002: 105, 2003: 109, 2004: 113, 2005: 117, 2006: 122, 2007: 129,
  2008: 137, 2009: 148, 2010: 167, 2011: 184, 2012: 200, 2013: 220, 2014: 240,
  2015: 254, 2016: 264, 2017: 272, 2018: 280, 2019: 289, 2020: 301, 2021: 317,
  2022: 331, 2023: 348, 2024: 363, 2025: 378, 2026: 394,
};
function ciiFor(year: number): number {
  if (CII[year]) return CII[year];
  if (year < 2001) return 100;
  // extrapolate ~5% per year forward if not in table
  const last = Math.max(...Object.keys(CII).map(Number));
  if (year > last) return Math.round(CII[last] * Math.pow(1.05, year - last));
  return 363;
}

type PropType = 'residential' | 'commercial' | 'plot';
const PROP_TYPES: { key: PropType; label: string; defaultStamp: number }[] = [
  { key: 'residential', label: 'Residential', defaultStamp: 7 },
  { key: 'commercial', label: 'Commercial', defaultStamp: 6 },
  { key: 'plot', label: 'Plot / Land', defaultStamp: 5 },
];

const PIE_COLORS = ['#0F766E', '#E8553A', '#7C3AED', '#D97706', '#2563EB', '#DB2777', '#64748B'];

/* ─── IRR via Newton-Raphson ─── */
function irr(cashflows: number[], guess = 0.08): number {
  if (cashflows.length < 2) return 0;
  const hasPos = cashflows.some((c) => c > 0);
  const hasNeg = cashflows.some((c) => c < 0);
  if (!hasPos || !hasNeg) return 0;

  let rate = guess;
  for (let iter = 0; iter < 200; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d = Math.pow(1 + rate, t);
      npv += cashflows[t] / d;
      dnpv += (-t * cashflows[t]) / (d * (1 + rate));
    }
    if (Math.abs(npv) < 1) return rate;
    if (Math.abs(dnpv) < 1e-10) break;
    const next = rate - npv / dnpv;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  return rate;
}

/* ─── EMI schedule: returns total interest paid in first N years ─── */
function loanInterestByYear(principal: number, annualRate: number, tenureYears: number, yearsHeld: number): { interestPerYear: number[]; principalPerYear: number[]; emiAnnual: number } {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  if (principal <= 0 || r <= 0 || n <= 0) {
    return { interestPerYear: Array(yearsHeld).fill(0), principalPerYear: Array(yearsHeld).fill(0), emiAnnual: 0 };
  }
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const interestPerYear: number[] = [];
  const principalPerYear: number[] = [];
  let balance = principal;
  const maxYears = Math.min(yearsHeld, tenureYears);
  for (let y = 0; y < maxYears; y++) {
    let intYr = 0;
    let prinYr = 0;
    for (let m = 0; m < 12; m++) {
      const intM = balance * r;
      const prinM = emi - intM;
      intYr += intM;
      prinYr += prinM;
      balance = Math.max(0, balance - prinM);
    }
    interestPerYear.push(intYr);
    principalPerYear.push(prinYr);
  }
  // pad for years beyond tenure
  for (let y = maxYears; y < yearsHeld; y++) {
    interestPerYear.push(0);
    principalPerYear.push(0);
  }
  return { interestPerYear, principalPerYear, emiAnnual: emi * 12 };
}

export default function RealEstateReturnCalculatorPage() {
  const currentYear = new Date().getFullYear();

  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(40);

  // Property
  const [propType, setPropType] = useState<PropType>('residential');
  const [purchaseYear, setPurchaseYear] = useState(currentYear - 5);
  const [purchasePrice, setPurchasePrice] = useState(7500000);
  const [stampDutyPct, setStampDutyPct] = useState(7);
  const [loanAmt, setLoanAmt] = useState(6000000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [currentValue, setCurrentValue] = useState(15000000);

  // Rental
  const [isRented, setIsRented] = useState(false);
  const [rentMonthly, setRentMonthly] = useState(25000);
  const [rentGrowth, setRentGrowth] = useState(5);
  const [vacancyMonths, setVacancyMonths] = useState(1);

  // Running costs
  const [propertyTaxYr, setPropertyTaxYr] = useState(20000);
  const [maintenanceYr, setMaintenanceYr] = useState(30000);

  // Sale
  const [sellingNow, setSellingNow] = useState(true);
  const [brokeragePct, setBrokeragePct] = useState(2);

  const yearsHeld = Math.max(1, currentYear - purchaseYear);

  const result = useMemo(() => {
    const stampDuty = purchasePrice * (stampDutyPct / 100);
    const totalCostAtPurchase = purchasePrice + stampDuty;
    const ownEquityAtPurchase = Math.max(0, purchasePrice - loanAmt);

    const { interestPerYear, emiAnnual } = loanInterestByYear(loanAmt, loanRate, loanTenure, yearsHeld);
    const totalLoanInterest = interestPerYear.reduce((a, b) => a + b, 0);

    // Year-by-year running cash flows (positive = inflow to investor, negative = outflow)
    const yearRows: {
      year: number;
      rent: number;
      propertyTax: number;
      maintenance: number;
      emi: number;
      netFlow: number;
      cumulative: number;
    }[] = [];

    let cumulative = -(ownEquityAtPurchase + stampDuty); // year 0 outflow
    let totalRentCollected = 0;
    let totalPropertyTax = 0;
    let totalMaintenance = 0;

    for (let y = 1; y <= yearsHeld; y++) {
      const effectiveMonths = Math.max(0, 12 - vacancyMonths);
      const thisYearRent = isRented
        ? rentMonthly * effectiveMonths * Math.pow(1 + rentGrowth / 100, y - 1)
        : 0;
      const thisYearEmi = y <= loanTenure ? emiAnnual : 0;
      const netFlow = thisYearRent - propertyTaxYr - maintenanceYr - thisYearEmi;
      cumulative += netFlow;
      totalRentCollected += thisYearRent;
      totalPropertyTax += propertyTaxYr;
      totalMaintenance += maintenanceYr;
      yearRows.push({
        year: purchaseYear + y,
        rent: Math.round(thisYearRent),
        propertyTax: propertyTaxYr,
        maintenance: maintenanceYr,
        emi: Math.round(thisYearEmi),
        netFlow: Math.round(netFlow),
        cumulative: Math.round(cumulative),
      });
    }

    // Sale
    const grossSale = sellingNow ? currentValue : 0;
    const brokerage = sellingNow ? grossSale * (brokeragePct / 100) : 0;
    const saleProceedsPreTax = grossSale - brokerage;

    // Capital gains tax
    const purchaseBeforeJul2024 = purchaseYear < 2024 || (purchaseYear === 2024 && false); // simple: <2024 grandfathered
    const isLTCG = yearsHeld * 12 > 24;
    let cgt = 0;
    let cgtScheme = '';
    let ltcgWithIndex = 0;
    let ltcgNoIndex = 0;

    if (sellingNow && grossSale > 0) {
      if (!isLTCG) {
        // STCG at slab (assume 30%)
        cgt = Math.max(0, grossSale - brokerage - purchasePrice - stampDuty) * 0.30;
        cgtScheme = 'STCG at 30% slab';
      } else {
        const costBase = purchasePrice + stampDuty;
        const gainNoIndex = Math.max(0, saleProceedsPreTax - costBase);
        ltcgNoIndex = gainNoIndex * 0.125;

        if (purchaseBeforeJul2024) {
          const indexedCost = costBase * (ciiFor(currentYear) / ciiFor(purchaseYear));
          const gainIndexed = Math.max(0, saleProceedsPreTax - indexedCost);
          ltcgWithIndex = gainIndexed * 0.20;
          cgt = Math.min(ltcgNoIndex, ltcgWithIndex);
          cgtScheme = ltcgNoIndex <= ltcgWithIndex
            ? 'LTCG 12.5% (no indexation) — grandfathered'
            : 'LTCG 20% with indexation — grandfathered';
        } else {
          cgt = ltcgNoIndex;
          cgtScheme = 'LTCG 12.5% (no indexation, post-Jul-2024)';
        }
      }
    }

    const netSale = saleProceedsPreTax - cgt;

    // Build cashflows for IRR (annual): t=0 is equity put down + stamp duty
    const cashflows: number[] = [];
    cashflows.push(-(ownEquityAtPurchase + stampDuty));
    for (let y = 1; y <= yearsHeld; y++) {
      const row = yearRows[y - 1];
      let flow = row.netFlow;
      if (y === yearsHeld && sellingNow) {
        flow += netSale;
      }
      cashflows.push(flow);
    }

    const realIRR = irr(cashflows) * 100;

    // Naive CAGR (price appreciation only)
    const naiveCAGR = yearsHeld > 0
      ? (Math.pow(currentValue / purchasePrice, 1 / yearsHeld) - 1) * 100
      : 0;

    // Cost breakdown pie
    const costBreakdown = [
      { name: 'Purchase Price', value: Math.round(purchasePrice) },
      { name: 'Stamp & Registration', value: Math.round(stampDuty) },
      { name: 'Loan Interest', value: Math.round(totalLoanInterest) },
      { name: 'Maintenance', value: Math.round(totalMaintenance) },
      { name: 'Property Tax', value: Math.round(totalPropertyTax) },
      { name: 'Brokerage', value: Math.round(brokerage) },
      { name: 'Capital Gains Tax', value: Math.round(cgt) },
    ].filter((c) => c.value > 0);

    // Equity MF comparison: had you invested (ownEquity + stampDuty) + yearly outflows into MF at 12%
    const mfRate = 0.12;
    let mfCorpus = ownEquityAtPurchase + stampDuty;
    for (let y = 1; y <= yearsHeld; y++) {
      mfCorpus *= 1 + mfRate;
      // each year: EMI + maintenance + prop tax - rent flows also would have gone into/out of MF
      const outflow = Math.max(0, -yearRows[y - 1].netFlow);
      mfCorpus += outflow;
      // if rent > costs (positive netFlow), it stays as investor's cash (not reinvested in property), so don't add
    }

    // Gross rental yield
    const grossRentalYield = isRented
      ? (rentMonthly * 12 * 100) / currentValue
      : 0;

    // Stamp duty as % of purchase
    const stampDutyAsPct = stampDutyPct;

    return {
      stampDuty,
      totalCostAtPurchase,
      ownEquityAtPurchase,
      totalLoanInterest,
      totalRentCollected,
      totalPropertyTax,
      totalMaintenance,
      brokerage,
      cgt,
      cgtScheme,
      ltcgWithIndex,
      ltcgNoIndex,
      grossSale,
      netSale,
      saleProceedsPreTax,
      yearRows,
      realIRR,
      naiveCAGR,
      gap: naiveCAGR - realIRR,
      costBreakdown,
      mfCorpus,
      grossRentalYield,
      stampDutyAsPct,
      isLTCG,
      purchaseBeforeJul2024,
      emiAnnual,
    };
  }, [
    propType, purchaseYear, purchasePrice, stampDutyPct, loanAmt, loanRate, loanTenure,
    currentValue, isRented, rentMonthly, rentGrowth, vacancyMonths, propertyTaxYr,
    maintenanceYr, sellingNow, brokeragePct, yearsHeld, currentYear,
  ]);

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
              <Home className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Real Estate Actual Return Calculator</h1>
              <p className="text-slate-300 mt-1">The honest property IRR — with stamp duty, interest, maintenance, tax. Usually 4-6%, not the 10% you think</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Property</h2>

              <PersonalInfoBar
                name={name}
                onNameChange={setName}
                age={age}
                onAgeChange={setAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              {/* Property Type */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Property Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROP_TYPES.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { setPropType(p.key); setStampDutyPct(p.defaultStamp); }}
                      className={cn(
                        'text-[11px] font-semibold py-2 rounded-lg border transition-colors',
                        propType === p.key
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {/* Purchase year */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Purchase Year</label>
                  <select
                    value={purchaseYear}
                    onChange={(e) => setPurchaseYear(parseInt(e.target.value))}
                    className="w-full py-3 px-3 text-base font-semibold text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  >
                    {Array.from({ length: 21 }, (_, i) => currentYear - 20 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1">Years held: {yearsHeld}</div>
                </div>

                <NumberInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="₹" step={100000} min={100000} max={1000000000} />
                <NumberInput label="Stamp Duty + Registration" value={stampDutyPct} onChange={setStampDutyPct} suffix="%" step={0.5} min={3} max={10} hint="Typically 5-7% of property value" />
                <NumberInput label="Current Market Value" value={currentValue} onChange={setCurrentValue} prefix="₹" step={100000} min={100000} max={2000000000} hint="Your estimate of today's sale price" />

                <div className="pt-3 border-t border-surface-200">
                  <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">Home Loan</h3>
                  <div className="space-y-4">
                    <NumberInput label="Loan Amount (0 for cash)" value={loanAmt} onChange={setLoanAmt} prefix="₹" step={100000} min={0} max={500000000} />
                    {loanAmt > 0 && (
                      <>
                        <NumberInput label="Loan Interest Rate" value={loanRate} onChange={setLoanRate} suffix="%" step={0.25} min={5} max={15} />
                        <NumberInput label="Loan Tenure" value={loanTenure} onChange={setLoanTenure} suffix="yrs" step={1} min={1} max={30} />
                      </>
                    )}
                  </div>
                </div>

                {/* Rental */}
                <div className="pt-3 border-t border-surface-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Rented Out</label>
                    <button
                      role="switch"
                      aria-checked={isRented}
                      onClick={() => setIsRented(!isRented)}
                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', isRented ? 'bg-amber-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', isRented ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                    </button>
                  </div>
                  {isRented && (
                    <div className="space-y-4">
                      <NumberInput label="Rent per Month" value={rentMonthly} onChange={setRentMonthly} prefix="₹" step={1000} min={0} max={1000000} />
                      <NumberInput label="Rent Growth p.a." value={rentGrowth} onChange={setRentGrowth} suffix="%" step={0.5} min={0} max={15} />
                      <NumberInput label="Avg Vacancy" value={vacancyMonths} onChange={setVacancyMonths} suffix="mo/yr" step={1} min={0} max={12} />
                    </div>
                  )}
                </div>

                {/* Running costs */}
                <div className="pt-3 border-t border-surface-200">
                  <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">Annual Running Costs</h3>
                  <div className="space-y-4">
                    <NumberInput label="Property Tax / year" value={propertyTaxYr} onChange={setPropertyTaxYr} prefix="₹" step={1000} min={0} max={1000000} />
                    <NumberInput label="Maintenance + Insurance / year" value={maintenanceYr} onChange={setMaintenanceYr} prefix="₹" step={1000} min={0} max={2000000} />
                  </div>
                </div>

                {/* Sale */}
                <div className="pt-3 border-t border-surface-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Planning to Sell Now</label>
                    <button
                      role="switch"
                      aria-checked={sellingNow}
                      onClick={() => setSellingNow(!sellingNow)}
                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', sellingNow ? 'bg-amber-500' : 'bg-slate-300')}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm', sellingNow ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                    </button>
                  </div>
                  {sellingNow && (
                    <NumberInput label="Brokerage" value={brokeragePct} onChange={setBrokeragePct} suffix="%" step={0.25} min={0} max={5} />
                  )}
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Real Estate Actual Return Calculator" fileName="real-estate-return" />
              </div>

              {/* HERO: Real IRR vs Naive CAGR */}
              <div className="card-base p-6 border-l-4 border-amber-500" data-pdf-keep-together>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-amber-700" />
                      <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Your Real IRR</div>
                    </div>
                    <div className="text-4xl font-extrabold text-amber-700">{result.realIRR.toFixed(2)}%</div>
                    <div className="text-xs text-slate-600 mt-1">After stamp duty, interest, costs &amp; tax</div>
                  </div>
                  <div className="rounded-xl p-5 bg-gradient-to-br from-slate-50 to-surface-100 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Naive Price CAGR</div>
                    </div>
                    <div className="text-4xl font-extrabold text-slate-500">{result.naiveCAGR.toFixed(2)}%</div>
                    <div className="text-xs text-slate-500 mt-1">What most people quote — &ldquo;doubled in X years&rdquo;</div>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-700 text-sm">
                      The {Math.abs(result.gap).toFixed(2)}% gap is your hidden cost
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Stamp duty {formatINR(result.stampDuty)} + loan interest {formatINR(result.totalLoanInterest)} + running costs {formatINR(result.totalMaintenance + result.totalPropertyTax)} + CGT {formatINR(result.cgt)}{result.brokerage > 0 ? ` + brokerage ${formatINR(result.brokerage)}` : ''} — these are the &ldquo;invisible&rdquo; drags.
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Pie + MF Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Where Your Money Went</h3>
                  <p className="text-xs text-slate-500 mb-3">Total outgo across all components</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.costBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value" label={({ percent }) => `${((percent as number) * 100).toFixed(0)}%`} labelLine={false}>
                          {result.costBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-base p-6" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <h3 className="font-bold text-primary-700">If Same Money Went to Equity MF @ 12%</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Same down-payment + all outflows, SIP&apos;d into equity MF over {yearsHeld} years</p>
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Equity MF Corpus</div>
                      <div className="text-2xl font-extrabold text-emerald-700">{formatINR(result.mfCorpus)}</div>
                    </div>
                    <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Property Net Sale (after tax)</div>
                      <div className="text-2xl font-extrabold text-amber-700">{formatINR(result.netSale)}</div>
                    </div>
                    <div className={cn('rounded-xl p-3 text-center text-xs font-semibold', result.mfCorpus > result.netSale ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                      {result.mfCorpus > result.netSale
                        ? `Equity MF would have built ₹${Math.round((result.mfCorpus - result.netSale) / 100000)}L more`
                        : `Property did better by ₹${Math.round((result.netSale - result.mfCorpus) / 100000)}L`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Year-by-year cash flow chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Cash Flow</h3>
                <p className="text-xs text-slate-500 mb-3">Net inflow/outflow each year (bars) with cumulative running total (line)</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.yearRows} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="netFlow" name="Net Cash Flow" fill="#E8553A" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tax Breakdown table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Tax &amp; Cost Breakdown</h3>
                  <p className="text-xs text-slate-500 mb-4">{result.cgtScheme || 'Not selling — no capital gains tax applied'}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Purchase Price</td><td className="py-2.5 px-6 text-right font-medium text-primary-700">{formatINR(purchasePrice)}</td></tr>
                      <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Stamp Duty + Registration ({stampDutyPct}%)</td><td className="py-2.5 px-6 text-right font-medium text-red-500">{formatINR(result.stampDuty)}</td></tr>
                      <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Total Loan Interest Paid ({yearsHeld}y)</td><td className="py-2.5 px-6 text-right font-medium text-red-500">{formatINR(result.totalLoanInterest)}</td></tr>
                      <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Cumulative Property Tax</td><td className="py-2.5 px-6 text-right font-medium text-red-500">{formatINR(result.totalPropertyTax)}</td></tr>
                      <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Cumulative Maintenance</td><td className="py-2.5 px-6 text-right font-medium text-red-500">{formatINR(result.totalMaintenance)}</td></tr>
                      {isRented && (
                        <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Cumulative Rent Collected</td><td className="py-2.5 px-6 text-right font-medium text-emerald-600">+{formatINR(result.totalRentCollected)}</td></tr>
                      )}
                      {sellingNow && (
                        <>
                          <tr className="border-b border-surface-200 bg-surface-100/50"><td className="py-2.5 px-6 font-semibold text-primary-700">Gross Sale Value</td><td className="py-2.5 px-6 text-right font-semibold text-primary-700">{formatINR(result.grossSale)}</td></tr>
                          <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Less: Brokerage ({brokeragePct}%)</td><td className="py-2.5 px-6 text-right font-medium text-red-500">−{formatINR(result.brokerage)}</td></tr>
                          <tr className="border-b border-surface-200"><td className="py-2.5 px-6 text-slate-600">Less: Capital Gains Tax</td><td className="py-2.5 px-6 text-right font-medium text-red-500">−{formatINR(result.cgt)}</td></tr>
                          <tr className="bg-emerald-50"><td className="py-3 px-6 font-bold text-emerald-700">Net Sale Proceeds</td><td className="py-3 px-6 text-right font-extrabold text-emerald-700">{formatINR(result.netSale)}</td></tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                {sellingNow && result.isLTCG && result.purchaseBeforeJul2024 && (
                  <div className="p-4 bg-blue-50 border-t border-blue-100 text-xs text-slate-700">
                    <span className="font-semibold text-blue-700">Grandfathered under Budget 2024:</span> For properties purchased before July 23, 2024 you can choose the lower of <strong>12.5% without indexation</strong> ({formatINR(Math.round(result.ltcgNoIndex))}) or <strong>20% with indexation</strong> ({formatINR(Math.round(result.ltcgWithIndex))}). This calculator applied the favorable option.
                  </div>
                )}
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-primary-700">Key Insights</h3>
                </div>
                <div className="space-y-3">
                  {[
                    `Your real IRR (${result.realIRR.toFixed(2)}%) is ${result.gap > 0 ? `${result.gap.toFixed(2)}% lower` : 'actually higher'} than the naive price CAGR (${result.naiveCAGR.toFixed(2)}%) — stamp duty, loan interest, maintenance, and CGT silently eat the gap.`,
                    `Stamp duty + registration alone cost ${result.stampDutyAsPct}% of purchase price — that is ${formatINR(result.stampDuty)}, or roughly ${isRented ? (result.stampDuty / (rentMonthly * 12)).toFixed(1) : '2-3'} years of rental income wiped out on day one.`,
                    isRented
                      ? `Your gross rental yield is ${result.grossRentalYield.toFixed(2)}% — typical for Indian metros (2-3%). Net yield after maintenance & tax is lower still.`
                      : `Not renting means you forfeit 2-3% p.a. of rental yield. That is ₹${Math.round((currentValue * 0.025) / 1000)}K/year of cash flow you could have earned.`,
                    `Post-Budget-2024: LTCG on property is 12.5% without indexation. For purchases before July 23, 2024, grandfathering lets you pick the lower of 12.5% (no index) or 20% (with index). This calculator applied the favorable option.`,
                    `A typical Indian residential property delivers 4-7% real IRR over 10 years. Commercial can reach 8-10% due to higher yields. Equity mutual funds have historically delivered 11-13% p.a. over similar horizons — fully liquid, divisible, and not tied to one city or tenant.`,
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CFP Note */}
              <div className="card-base p-6 bg-gradient-to-br from-brand-50 to-teal-50 border-l-4 border-brand-500" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-brand-800 mb-1">CFP Note</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Real estate &ldquo;feels&rdquo; like a great investment because you don&apos;t track hidden costs — stamp duty disappears at purchase, EMI is painful monthly but invisible annually, maintenance drips away, and CGT only hits at exit. Quantifying them reveals why liquid mutual fund SIPs (Growth option, Regular plan) often out-compound property over 10-15 years. Plus MFs are divisible, portable, and not tied to one city or tenant. <span className="font-semibold">Speak to your Relationship Manager before the next property decision.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead form */}
              <CalculatorLeadForm
                calculatorName="Real Estate Return"
                accent="amber"
                resultContext={`Held ${yearsHeld}y, real IRR ${result.realIRR.toFixed(2)}%, naive CAGR ${result.naiveCAGR.toFixed(2)}%, gap ${result.gap.toFixed(2)}%`}
              />
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
