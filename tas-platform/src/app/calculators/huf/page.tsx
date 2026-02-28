'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Users, Info, IndianRupee, ArrowRight, CheckCircle, AlertTriangle, TrendingDown, Shield } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { TAX_LIMITS, NEW_REGIME_SLABS, OLD_REGIME_SLABS } from '@/lib/constants/financial-constants';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';

// ---------------------------------------------------------------------------
// Tax calculation helpers (inline, same slab logic for HUF as individual)
// ---------------------------------------------------------------------------

type TaxSlab = { min: number; max: number; rate: number };

function calculateSlabTax(income: number, slabs: TaxSlab[]): number {
  let tax = 0;
  let remaining = income;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, slab.max - slab.min);
    tax += taxable * (slab.rate / 100);
    remaining -= taxable;
  }
  return tax;
}

function computeTaxOldRegime(grossIncome: number, totalDeductions: number) {
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const grossTax = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS);
  // Rebate u/s 87A old regime: max 12500 if taxable income <= 5L
  const rebate = taxableIncome <= TAX_LIMITS.oldRegimeRebateLimit
    ? Math.min(grossTax, TAX_LIMITS.oldRegimeRebateAmount)
    : 0;
  const taxAfterRebate = grossTax - rebate;
  const cess = taxAfterRebate * 0.04;
  const totalTax = Math.round(taxAfterRebate + cess);
  return { taxableIncome, grossTax, rebate, cess, totalTax };
}

function computeTaxNewRegime(grossIncome: number) {
  // New regime: standard deduction of 75K for salaried individuals,
  // but HUF typically doesn't get standard deduction. For HUF, we use gross income directly.
  const taxableIncome = Math.max(0, grossIncome);
  const grossTax = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS);
  // Rebate u/s 87A new regime FY 2025-26: up to 60000 if taxable income <= 12L
  const rebate = taxableIncome <= TAX_LIMITS.newRegimeRebateLimit
    ? Math.min(grossTax, TAX_LIMITS.newRegimeRebateAmount)
    : 0;
  const taxAfterRebate = grossTax - rebate;
  const cess = taxAfterRebate * 0.04;
  const totalTax = Math.round(taxAfterRebate + cess);
  return { taxableIncome, grossTax, rebate, cess, totalTax };
}

function computeIndividualTaxOldRegime(grossIncome: number, totalDeductions: number) {
  // Individual gets standard deduction of 75K
  const taxableIncome = Math.max(0, grossIncome - TAX_LIMITS.standardDeduction - totalDeductions);
  const grossTax = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS);
  const rebate = taxableIncome <= TAX_LIMITS.oldRegimeRebateLimit
    ? Math.min(grossTax, TAX_LIMITS.oldRegimeRebateAmount)
    : 0;
  const taxAfterRebate = grossTax - rebate;
  const cess = taxAfterRebate * 0.04;
  const totalTax = Math.round(taxAfterRebate + cess);
  return { taxableIncome, grossTax, rebate, cess, totalTax };
}

function computeIndividualTaxNewRegime(grossIncome: number) {
  // Individual gets standard deduction of 75K in new regime
  const taxableIncome = Math.max(0, grossIncome - TAX_LIMITS.standardDeduction);
  const grossTax = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS);
  const rebate = taxableIncome <= TAX_LIMITS.newRegimeRebateLimit
    ? Math.min(grossTax, TAX_LIMITS.newRegimeRebateAmount)
    : 0;
  const taxAfterRebate = grossTax - rebate;
  const cess = taxAfterRebate * 0.04;
  const totalTax = Math.round(taxAfterRebate + cess);
  return { taxableIncome, grossTax, rebate, cess, totalTax };
}

// ---------------------------------------------------------------------------
// Slider + Number Input component
// ---------------------------------------------------------------------------

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
}

function SliderInput({ label, value, onChange, min, max, step = 1000, prefix = '' }: SliderInputProps) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">{formatINR(value)}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-2">
        {prefix && <span className="text-gray-400 text-sm mr-1">{prefix}</span>}
        <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = Math.min(max, Math.max(min, Number(e.target.value) || 0));
            onChange(v);
          }}
          className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none ml-1"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function HUFTaxPlannerPage() {
  // HUF income inputs
  const [hufGrossIncome, setHufGrossIncome] = useState(1000000);
  const [incomeHouseProperty, setIncomeHouseProperty] = useState(300000);
  const [incomeFromBusiness, setIncomeFromBusiness] = useState(500000);
  const [incomeOtherSources, setIncomeOtherSources] = useState(200000);

  // HUF deductions
  const [section80C, setSection80C] = useState(150000);
  const [section80D, setSection80D] = useState(25000);
  const [section80CCD, setSection80CCD] = useState(0);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);

  // Individual income inputs (for comparison)
  const [individualGrossIncome, setIndividualGrossIncome] = useState(1500000);
  const [individualDeductions, setIndividualDeductions] = useState(200000);

  // Derived values
  const hufTotalDeductions = useMemo(() => {
    return Math.min(section80C, TAX_LIMITS.section80C)
      + Math.min(section80D, TAX_LIMITS.section80D_self + TAX_LIMITS.section80D_parents)
      + Math.min(section80CCD, TAX_LIMITS.section80CCD1B)
      + Math.min(homeLoanInterest, TAX_LIMITS.section24b_homeLoan);
  }, [section80C, section80D, section80CCD, homeLoanInterest]);

  // HUF tax calculations
  const hufOldRegime = useMemo(
    () => computeTaxOldRegime(hufGrossIncome, hufTotalDeductions),
    [hufGrossIncome, hufTotalDeductions]
  );

  const hufNewRegime = useMemo(
    () => computeTaxNewRegime(hufGrossIncome),
    [hufGrossIncome]
  );

  const hufBetterRegime = hufOldRegime.totalTax <= hufNewRegime.totalTax ? 'old' : 'new';
  const hufBetterTax = Math.min(hufOldRegime.totalTax, hufNewRegime.totalTax);

  // Individual tax calculations (to show family savings)
  const individualOldRegime = useMemo(
    () => computeIndividualTaxOldRegime(individualGrossIncome, individualDeductions),
    [individualGrossIncome, individualDeductions]
  );

  const individualNewRegime = useMemo(
    () => computeIndividualTaxNewRegime(individualGrossIncome),
    [individualGrossIncome]
  );

  const individualBetterTax = Math.min(individualOldRegime.totalTax, individualNewRegime.totalTax);

  // Family savings calculation:
  // Tax if all income in individual's hands vs (individual tax + HUF tax separately)
  const combinedIncome = individualGrossIncome + hufGrossIncome;
  const combinedOldRegime = computeIndividualTaxOldRegime(combinedIncome, individualDeductions + hufTotalDeductions);
  const combinedNewRegime = computeIndividualTaxNewRegime(combinedIncome);
  const combinedBestTax = Math.min(combinedOldRegime.totalTax, combinedNewRegime.totalTax);

  const separateTotalTax = individualBetterTax + hufBetterTax;
  const familySavings = Math.max(0, combinedBestTax - separateTotalTax);

  // Recommended slabs to show
  const recommendedSlabs = hufBetterRegime === 'old' ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  const recommendedLabel = hufBetterRegime === 'old' ? 'Old Regime' : 'New Regime';

  // Deduction utilization
  const deductionItems = [
    { label: 'Section 80C', used: section80C, max: TAX_LIMITS.section80C },
    { label: 'Section 80D', used: section80D, max: TAX_LIMITS.section80D_self + TAX_LIMITS.section80D_parents },
    { label: 'Section 80CCD(1B)', used: section80CCD, max: TAX_LIMITS.section80CCD1B },
    { label: 'Home Loan u/s 24(b)', used: homeLoanInterest, max: TAX_LIMITS.section24b_homeLoan },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      {/* ================================================================ */}
      {/* Hero Section                                                     */}
      {/* ================================================================ */}
      <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-sm">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white transition">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">HUF Tax Planner</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold">HUF Tax Planner</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Understand tax benefits of Hindu Undivided Family and optimize family taxation
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Content Area                                                     */}
      {/* ================================================================ */}
      <div className="container-custom py-8">

        {/* ============================================================== */}
        {/* Section 1: Educational Content                                  */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 lg:p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* What is HUF? */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                What is HUF?
              </h2>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                A Hindu Undivided Family (HUF) is a separate legal and tax entity under Indian law, consisting of
                all persons lineally descended from a common ancestor, including their wives and unmarried daughters.
                It provides a powerful and entirely legal way to split family income and reduce the overall tax burden.
              </p>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Key Points</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'HUF is a separate tax entity recognized under Hindu law',
                  'Gets its own PAN card and separate basic exemption limit',
                  'Can claim deductions under 80C, 80D independently',
                  'Rental income from HUF property taxed in HUF\'s hands',
                  'Effective way to split family income legally',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Create HUF */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                How to Create HUF
              </h2>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                Setting up an HUF is a straightforward process. Follow these steps to establish your HUF
                and start enjoying the tax benefits.
              </p>
              <ol className="space-y-3">
                {[
                  { step: 1, title: 'Draft a HUF deed', desc: 'List all coparceners and members with a declaration of assets.' },
                  { step: 2, title: 'Apply for PAN card in HUF name', desc: 'Use Form 49A with the HUF deed as supporting document.' },
                  { step: 3, title: 'Open a bank account in HUF name', desc: 'Use the PAN card and HUF deed to open a dedicated bank account.' },
                  { step: 4, title: 'Transfer ancestral/contributed assets', desc: 'Contribute ancestral property or receive gifts to build the HUF corpus.' },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Section 2: Calculator                                           */}
        {/* ============================================================== */}
        <div className="grid gap-8 lg:grid-cols-5">

          {/* ------------------------------------------------------------ */}
          {/* Left Panel (2 cols) - Inputs & Summary                        */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-2 space-y-6">
            {/* HUF Income Inputs */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">HUF Income Details</h2>
              <div className="space-y-5">
                <SliderInput
                  label="HUF Gross Annual Income"
                  value={hufGrossIncome}
                  onChange={setHufGrossIncome}
                  min={0}
                  max={10000000}
                  step={10000}
                />
                <SliderInput
                  label="Income from House Property"
                  value={incomeHouseProperty}
                  onChange={setIncomeHouseProperty}
                  min={0}
                  max={5000000}
                  step={10000}
                />
                <SliderInput
                  label="Income from Business"
                  value={incomeFromBusiness}
                  onChange={setIncomeFromBusiness}
                  min={0}
                  max={5000000}
                  step={10000}
                />
                <SliderInput
                  label="Income from Other Sources"
                  value={incomeOtherSources}
                  onChange={setIncomeOtherSources}
                  min={0}
                  max={2000000}
                  step={5000}
                />
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">HUF Deductions (Old Regime)</h2>
              <div className="space-y-5">
                <SliderInput
                  label="Section 80C Investments"
                  value={section80C}
                  onChange={setSection80C}
                  min={0}
                  max={150000}
                  step={1000}
                />
                <SliderInput
                  label="Section 80D Health Insurance"
                  value={section80D}
                  onChange={setSection80D}
                  min={0}
                  max={100000}
                  step={1000}
                />
                <SliderInput
                  label="Section 80CCD(1B) NPS"
                  value={section80CCD}
                  onChange={setSection80CCD}
                  min={0}
                  max={50000}
                  step={1000}
                />
                <SliderInput
                  label="Home Loan Interest u/s 24(b)"
                  value={homeLoanInterest}
                  onChange={setHomeLoanInterest}
                  min={0}
                  max={200000}
                  step={1000}
                />
              </div>
            </div>

            {/* Individual Comparison Inputs */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Individual Income (Comparison)</h2>
              <p className="text-xs text-gray-500 mb-5">To calculate how much your family saves by splitting income via HUF</p>
              <div className="space-y-5">
                <SliderInput
                  label="Individual's Gross Income"
                  value={individualGrossIncome}
                  onChange={setIndividualGrossIncome}
                  min={0}
                  max={10000000}
                  step={10000}
                />
                <SliderInput
                  label="Individual's Total Deductions"
                  value={individualDeductions}
                  onChange={setIndividualDeductions}
                  min={0}
                  max={500000}
                  step={5000}
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] rounded-2xl p-6 text-white shadow-card">
              <h3 className="text-lg font-semibold mb-4">Results Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">HUF Tax (Old Regime)</span>
                  <span className="font-semibold">
                    {hufOldRegime.totalTax === 0 ? <span className="text-green-400">NIL</span> : formatINR(hufOldRegime.totalTax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HUF Tax (New Regime)</span>
                  <span className="font-semibold">
                    {hufNewRegime.totalTax === 0 ? <span className="text-green-400">NIL</span> : formatINR(hufNewRegime.totalTax)}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-gray-400">Better Regime for HUF</span>
                  <span className="font-bold text-yellow-300 uppercase">{hufBetterRegime === 'old' ? 'Old Regime' : 'New Regime'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Individual Tax (Best)</span>
                  <span className="font-semibold">
                    {individualBetterTax === 0 ? <span className="text-green-400">NIL</span> : formatINR(individualBetterTax)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Right Panel (3 cols) - Comparison, Savings, Slabs, etc.       */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-3 space-y-6">

            {/* Side-by-side comparison cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Old Regime Card */}
              <div className={`bg-white rounded-2xl shadow-card border-2 p-5 ${
                hufBetterRegime === 'old' ? 'border-emerald-500' : 'border-gray-100'
              }`}>
                {hufBetterRegime === 'old' && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Recommended</span>
                  </div>
                )}
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">HUF Old Regime</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxable Income</span>
                    <span className="font-semibold text-gray-900">{formatINR(hufOldRegime.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax on Income</span>
                    <span className="font-semibold text-gray-900">{formatINR(Math.round(hufOldRegime.grossTax))}</span>
                  </div>
                  {hufOldRegime.rebate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Rebate u/s 87A</span>
                      <span className="font-semibold text-green-600">- {formatINR(Math.round(hufOldRegime.rebate))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cess (4%)</span>
                    <span className="font-semibold text-gray-900">{formatINR(Math.round(hufOldRegime.cess))}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total Tax</span>
                    <span className="font-bold text-lg text-gray-900">
                      {hufOldRegime.totalTax === 0 ? <span className="text-emerald-600">NIL</span> : formatINR(hufOldRegime.totalTax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Regime Card */}
              <div className={`bg-white rounded-2xl shadow-card border-2 p-5 ${
                hufBetterRegime === 'new' ? 'border-emerald-500' : 'border-gray-100'
              }`}>
                {hufBetterRegime === 'new' && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Recommended</span>
                  </div>
                )}
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">HUF New Regime</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxable Income</span>
                    <span className="font-semibold text-gray-900">{formatINR(hufNewRegime.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax on Income</span>
                    <span className="font-semibold text-gray-900">{formatINR(Math.round(hufNewRegime.grossTax))}</span>
                  </div>
                  {hufNewRegime.rebate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Rebate u/s 87A</span>
                      <span className="font-semibold text-green-600">- {formatINR(Math.round(hufNewRegime.rebate))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cess (4%)</span>
                    <span className="font-semibold text-gray-900">{formatINR(Math.round(hufNewRegime.cess))}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total Tax</span>
                    <span className="font-bold text-lg text-gray-900">
                      {hufNewRegime.totalTax === 0 ? <span className="text-emerald-600">NIL</span> : formatINR(hufNewRegime.totalTax)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Tax Savings Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 flex-shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Family Tax Savings with HUF</h3>
                  <p className="text-emerald-100 text-sm mb-3">
                    By splitting income between individual and HUF instead of clubbing everything under one PAN:
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold">
                      {familySavings > 0 ? formatINR(familySavings) : formatINR(0)}
                    </span>
                    <span className="text-emerald-200 text-sm font-medium">saved per year</span>
                  </div>
                  {familySavings > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/10 rounded-lg px-3 py-2">
                        <span className="text-emerald-200 block">Combined Tax (1 PAN)</span>
                        <span className="font-bold text-white">{formatINR(combinedBestTax)}</span>
                      </div>
                      <div className="bg-white/10 rounded-lg px-3 py-2">
                        <span className="text-emerald-200 block">Split Tax (2 PANs)</span>
                        <span className="font-bold text-white">{formatINR(separateTotalTax)}</span>
                      </div>
                    </div>
                  )}
                  {familySavings === 0 && (
                    <p className="text-emerald-200 text-xs mt-2">
                      At the current income levels, there is no incremental saving. Adjust HUF or individual income to see the benefit.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tax Slab Table */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Applicable Slabs &mdash; {recommendedLabel} (FY 2025-26)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Income Range</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedSlabs.map((slab, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2.5 text-gray-700">
                          {slab.max === Infinity
                            ? `Above ${formatINR(slab.min)}`
                            : `${formatINR(slab.min)} -- ${formatINR(slab.max)}`}
                        </td>
                        <td className={`py-2.5 text-right font-semibold ${slab.rate === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {slab.rate === 0 ? 'NIL' : `${slab.rate}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                + 4% Health &amp; Education Cess on total tax. Rebate u/s 87A applicable as per regime rules.
              </p>
            </div>

            {/* Deduction Utilization */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Deduction Utilization (Old Regime)</h3>
              <div className="space-y-4">
                {deductionItems.map((item) => {
                  const pct = item.max > 0 ? Math.min(100, (item.used / item.max) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <span className="text-xs text-gray-500">
                          {formatINR(Math.min(item.used, item.max))} / {formatINR(item.max)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[11px] text-gray-400">{pct.toFixed(0)}% utilized</span>
                        {pct >= 100 && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Maxed out
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA - Book Advisory */}
            <Link
              href="/contact"
              className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl p-6 text-white shadow-lg transition-all group"
            >
              <div>
                <h3 className="text-lg font-bold mb-1">Book HUF Advisory Session</h3>
                <p className="text-blue-100 text-sm">
                  Get personalized guidance on setting up and managing your HUF for maximum tax efficiency
                </p>
              </div>
              <ArrowRight className="w-6 h-6 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Important info box */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-700">Important:</strong> HUF is available only for Hindu, Sikh, Jain, and
                  Buddhist families. Consult a tax advisor for your specific situation. This calculator provides
                  approximate estimates based on FY 2025-26 tax slabs and does not account for surcharge (income above
                  ₹50 Lakh), capital gains, or other special provisions. It is for informational purposes only and does
                  not constitute tax or legal advice.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEBI Disclaimer */}
      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
