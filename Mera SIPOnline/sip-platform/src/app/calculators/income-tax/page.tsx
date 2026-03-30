'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, IndianRupee, Scale, TrendingDown, Shield, Building2, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  oldTax: '#E8553A',
  newTax: '#2563EB',
  deductions: '#0F766E',
  takeHome: '#10B981',
  savings: '#16A34A',
  cess: '#D97706',
};

export default function IncomeTaxCalculatorPage() {
  const [grossSalary, setGrossSalary] = useState(1200000);
  const [hraReceived, setHraReceived] = useState(120000);
  const [rentPaid, setRentPaid] = useState(240000);
  const [isMetro, setIsMetro] = useState(true);
  const [section80C, setSection80C] = useState(150000);
  const [section80D, setSection80D] = useState(25000);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);
  const [nps80CCD, setNps80CCD] = useState(50000);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const result = useMemo(() => {
    const basic = grossSalary * 0.4;
    const stdDeductionOld = 50000;
    const stdDeductionNew = 75000;

    // ── HRA Calculation (Old Regime only) ──
    const hraExemptA = hraReceived;
    const hraExemptB = rentPaid - 0.1 * basic;
    const hraExemptC = (isMetro ? 0.5 : 0.4) * basic;
    const hraExemption = Math.max(0, Math.min(hraExemptA, hraExemptB, hraExemptC));

    // ── Old Regime Deductions ──
    const deductions80C = Math.min(section80C, 150000);
    const deductions80D = Math.min(section80D, 100000);
    const deductions24b = Math.min(homeLoanInterest, 200000);
    const deductionsNPS = Math.min(nps80CCD, 50000);
    const deductionsOther = otherDeductions;
    const totalDeductionsOld = stdDeductionOld + hraExemption + deductions80C + deductions80D + deductions24b + deductionsNPS + deductionsOther;

    // ── Taxable Income ──
    const taxableOld = Math.max(0, grossSalary - totalDeductionsOld);
    const taxableNew = Math.max(0, grossSalary - stdDeductionNew);

    // ── Old Regime Tax Slabs ──
    const calcOldTax = (income: number): number => {
      if (income <= 250000) return 0;
      let tax = 0;
      if (income > 250000) tax += Math.min(income - 250000, 250000) * 0.05;
      if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.20;
      if (income > 1000000) tax += (income - 1000000) * 0.30;
      return tax;
    };

    // ── New Regime Tax Slabs (FY 2025-26) ──
    const calcNewTax = (income: number): number => {
      if (income <= 400000) return 0;
      let tax = 0;
      if (income > 400000) tax += Math.min(income - 400000, 400000) * 0.05;
      if (income > 800000) tax += Math.min(income - 800000, 400000) * 0.10;
      if (income > 1200000) tax += Math.min(income - 1200000, 400000) * 0.15;
      if (income > 1600000) tax += Math.min(income - 1600000, 400000) * 0.20;
      if (income > 2000000) tax += Math.min(income - 2000000, 400000) * 0.25;
      if (income > 2400000) tax += (income - 2400000) * 0.30;
      return tax;
    };

    let taxOldBeforeCess = calcOldTax(taxableOld);
    let taxNewBeforeCess = calcNewTax(taxableNew);

    // ── Rebate u/s 87A ──
    if (taxableOld <= 500000) taxOldBeforeCess = 0;
    if (taxableNew <= 1200000) taxNewBeforeCess = 0;

    // ── Surcharge ──
    const calcSurcharge = (tax: number, income: number): number => {
      if (income > 20000000) return tax * 0.25;
      if (income > 10000000) return tax * 0.15;
      if (income > 5000000) return tax * 0.10;
      return 0;
    };

    const surchargeOld = calcSurcharge(taxOldBeforeCess, taxableOld);
    const surchargeNew = calcSurcharge(taxNewBeforeCess, taxableNew);

    const cessOld = (taxOldBeforeCess + surchargeOld) * 0.04;
    const cessNew = (taxNewBeforeCess + surchargeNew) * 0.04;

    const totalTaxOld = Math.round(taxOldBeforeCess + surchargeOld + cessOld);
    const totalTaxNew = Math.round(taxNewBeforeCess + surchargeNew + cessNew);

    const savings = totalTaxOld - totalTaxNew;
    const betterRegime: 'old' | 'new' = savings > 0 ? 'new' : 'old';

    // ── Slab-wise breakdown: Old Regime ──
    const oldSlabs = [
      { slab: '0 - 2.5L', rate: '0%', incomeInSlab: Math.min(taxableOld, 250000), taxInSlab: 0 },
      { slab: '2.5L - 5L', rate: '5%', incomeInSlab: Math.max(0, Math.min(taxableOld - 250000, 250000)), taxInSlab: Math.max(0, Math.min(taxableOld - 250000, 250000)) * 0.05 },
      { slab: '5L - 10L', rate: '20%', incomeInSlab: Math.max(0, Math.min(taxableOld - 500000, 500000)), taxInSlab: Math.max(0, Math.min(taxableOld - 500000, 500000)) * 0.20 },
      { slab: 'Above 10L', rate: '30%', incomeInSlab: Math.max(0, taxableOld - 1000000), taxInSlab: Math.max(0, taxableOld - 1000000) * 0.30 },
    ];

    // ── Slab-wise breakdown: New Regime ──
    const newSlabs = [
      { slab: '0 - 4L', rate: '0%', incomeInSlab: Math.min(taxableNew, 400000), taxInSlab: 0 },
      { slab: '4L - 8L', rate: '5%', incomeInSlab: Math.max(0, Math.min(taxableNew - 400000, 400000)), taxInSlab: Math.max(0, Math.min(taxableNew - 400000, 400000)) * 0.05 },
      { slab: '8L - 12L', rate: '10%', incomeInSlab: Math.max(0, Math.min(taxableNew - 800000, 400000)), taxInSlab: Math.max(0, Math.min(taxableNew - 800000, 400000)) * 0.10 },
      { slab: '12L - 16L', rate: '15%', incomeInSlab: Math.max(0, Math.min(taxableNew - 1200000, 400000)), taxInSlab: Math.max(0, Math.min(taxableNew - 1200000, 400000)) * 0.15 },
      { slab: '16L - 20L', rate: '20%', incomeInSlab: Math.max(0, Math.min(taxableNew - 1600000, 400000)), taxInSlab: Math.max(0, Math.min(taxableNew - 1600000, 400000)) * 0.20 },
      { slab: '20L - 24L', rate: '25%', incomeInSlab: Math.max(0, Math.min(taxableNew - 2000000, 400000)), taxInSlab: Math.max(0, Math.min(taxableNew - 2000000, 400000)) * 0.25 },
      { slab: 'Above 24L', rate: '30%', incomeInSlab: Math.max(0, taxableNew - 2400000), taxInSlab: Math.max(0, taxableNew - 2400000) * 0.30 },
    ];

    // ── Deduction breakdown (Old Regime) ──
    const deductionBreakdown = [
      { name: 'Standard Deduction', claimed: stdDeductionOld, limit: 50000 },
      { name: 'HRA Exemption', claimed: Math.round(hraExemption), limit: Math.round(hraExemptC) },
      { name: 'Section 80C (EPF, PPF, ELSS, LIC)', claimed: deductions80C, limit: 150000 },
      { name: 'Section 80D (Medical Insurance)', claimed: deductions80D, limit: 100000 },
      { name: 'Section 24(b) (Home Loan Interest)', claimed: deductions24b, limit: 200000 },
      { name: 'NPS 80CCD(1B)', claimed: deductionsNPS, limit: 50000 },
      { name: 'Other Deductions', claimed: deductionsOther, limit: 200000 },
    ];

    return {
      taxableOld,
      taxableNew,
      taxOldBeforeCess: Math.round(taxOldBeforeCess + surchargeOld),
      taxNewBeforeCess: Math.round(taxNewBeforeCess + surchargeNew),
      cessOld: Math.round(cessOld),
      cessNew: Math.round(cessNew),
      totalTaxOld,
      totalTaxNew,
      savings: Math.abs(savings),
      betterRegime,
      takeHomeOld: grossSalary - totalTaxOld,
      takeHomeNew: grossSalary - totalTaxNew,
      totalDeductionsOld: Math.round(totalDeductionsOld),
      oldSlabs,
      newSlabs,
      deductionBreakdown,
      hraExemption: Math.round(hraExemption),
    };
  }, [grossSalary, hraReceived, rentPaid, isMetro, section80C, section80D, homeLoanInterest, nps80CCD, otherDeductions]);

  // ── Chart Data ──
  const comparisonBarData = [
    { metric: 'Taxable Income', old: result.taxableOld, new: result.taxableNew },
    { metric: 'Total Tax', old: result.totalTaxOld, new: result.totalTaxNew },
    { metric: 'Take Home', old: result.takeHomeOld, new: result.takeHomeNew },
  ];

  const oldPieData = [
    { name: 'Tax Paid', value: result.totalTaxOld, color: COLORS.oldTax },
    { name: 'Deductions', value: result.totalDeductionsOld, color: COLORS.deductions },
    { name: 'Take Home', value: result.takeHomeOld, color: COLORS.takeHome },
  ].filter((d) => d.value > 0);

  const newPieData = [
    { name: 'Tax Paid', value: result.totalTaxNew, color: COLORS.newTax },
    { name: 'Std Deduction', value: 75000, color: COLORS.deductions },
    { name: 'Take Home', value: result.takeHomeNew, color: COLORS.takeHome },
  ].filter((d) => d.value > 0);

  return (
    <>
      {/* ── Header ── */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">FY 2025-26</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Income Tax Calculator</h1>
              <p className="text-slate-300 mt-1">Compare Old vs New regime and find which saves you more tax</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Left: Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Income &amp; Deductions</h2>

              <div className="space-y-5">
                <NumberInput label="Gross Annual Salary" value={grossSalary} onChange={setGrossSalary} prefix="₹" step={50000} min={300000} max={10000000} />
                <NumberInput label="HRA Received (per year)" value={hraReceived} onChange={setHraReceived} prefix="₹" step={5000} min={0} max={1000000} />
                <NumberInput label="Rent Paid (per year)" value={rentPaid} onChange={setRentPaid} prefix="₹" step={5000} min={0} max={1200000} />

                {/* Metro Toggle */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">City Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMetro(true)}
                      className={cn(
                        'text-[11px] font-semibold py-2.5 rounded-lg border transition-colors',
                        isMetro ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                      )}
                    >
                      Metro (50% HRA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMetro(false)}
                      className={cn(
                        'text-[11px] font-semibold py-2.5 rounded-lg border transition-colors',
                        !isMetro ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                      )}
                    >
                      Non-Metro (40% HRA)
                    </button>
                  </div>
                </div>

                <NumberInput label="Section 80C (EPF, PPF, ELSS, LIC)" value={section80C} onChange={setSection80C} prefix="₹" step={5000} min={0} max={150000} hint="Limit: ₹1,50,000" />
                <NumberInput label="Section 80D (Medical Insurance)" value={section80D} onChange={setSection80D} prefix="₹" step={5000} min={0} max={100000} hint="Self/family limit: ₹1,00,000" />
                <NumberInput label="Home Loan Interest 24(b)" value={homeLoanInterest} onChange={setHomeLoanInterest} prefix="₹" step={10000} min={0} max={500000} hint="Limit: ₹2,00,000" />
                <NumberInput label="NPS 80CCD(1B)" value={nps80CCD} onChange={setNps80CCD} prefix="₹" step={5000} min={0} max={50000} hint="Limit: ₹50,000" />
                <NumberInput label="Other Deductions" value={otherDeductions} onChange={setOtherDeductions} prefix="₹" step={5000} min={0} max={200000} />
              </div>

              {/* ── Summary Cards in Sidebar ── */}
              <div className="mt-8 space-y-3">
                <div className={cn(
                  'rounded-xl p-4 border-l-4',
                  result.betterRegime === 'new' ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Recommended</span>
                  </div>
                  <div className={cn('text-lg font-extrabold', result.betterRegime === 'new' ? 'text-blue-700' : 'text-orange-700')}>
                    {result.betterRegime === 'new' ? 'New Regime' : 'Old Regime'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Saves you {formatINR(result.savings)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn('rounded-xl p-3 border-l-4', result.betterRegime === 'old' ? 'border-emerald-500 bg-emerald-50' : 'bg-surface-100 border-transparent')}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Old Regime Tax</div>
                    <div className="text-base font-extrabold text-red-600">{formatINR(result.totalTaxOld)}</div>
                  </div>
                  <div className={cn('rounded-xl p-3 border-l-4', result.betterRegime === 'new' ? 'border-emerald-500 bg-emerald-50' : 'bg-surface-100 border-transparent')}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">New Regime Tax</div>
                    <div className="text-base font-extrabold text-blue-600">{formatINR(result.totalTaxNew)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Old Regime Deductions</span>
                  </div>
                  <span className="text-sm font-bold text-teal-700">{formatINR(result.totalDeductionsOld)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Best Take Home</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatINR(Math.max(result.takeHomeOld, result.takeHomeNew))}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right: Results Panel ── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results &mdash; FY 2025-26</h3>
                <DownloadPDFButton elementId="calculator-results" title="Income Tax Calculator" fileName="income-tax-calculator" />
              </div>

              {/* ── Verdict Banner ── */}
              <div className={cn(
                'card-base p-6 border-2 transition-shadow',
                result.betterRegime === 'new'
                  ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50'
                  : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
              )} data-pdf-keep-together>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    result.betterRegime === 'new' ? 'bg-emerald-100' : 'bg-amber-100'
                  )}>
                    <CheckCircle className={cn('w-6 h-6', result.betterRegime === 'new' ? 'text-emerald-600' : 'text-amber-600')} />
                  </div>
                  <div>
                    <h3 className={cn('text-xl font-extrabold', result.betterRegime === 'new' ? 'text-emerald-700' : 'text-amber-700')}>
                      {result.betterRegime === 'new' ? 'New Regime' : 'Old Regime'} saves you {formatINR(result.savings)}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {result.betterRegime === 'new'
                        ? 'The New Tax Regime with its wider slabs and enhanced ₹12L rebate is more beneficial for your income level. You can skip the hassle of gathering deduction proofs.'
                        : 'The Old Tax Regime is better for you thanks to your deductions. Your HRA, 80C, 80D, and other exemptions reduce your taxable income significantly.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Side-by-Side Comparison Cards ── */}
              <div className="grid sm:grid-cols-2 gap-4" data-pdf-keep-together>
                <div className="card-base p-5 border-t-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-bold text-orange-700">Old Regime</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Taxable Income</div>
                      <div className="text-lg font-extrabold text-primary-700">{formatINR(result.taxableOld)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tax + Surcharge</div>
                      <div className="text-sm font-bold text-slate-600">{formatINR(result.taxOldBeforeCess)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cess (4%)</div>
                      <div className="text-sm font-bold text-slate-600">{formatINR(result.cessOld)}</div>
                    </div>
                    <div className="pt-2 border-t border-surface-200">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Tax</div>
                      <div className="text-xl font-extrabold text-red-600">{formatINR(result.totalTaxOld)}</div>
                    </div>
                  </div>
                </div>

                <div className="card-base p-5 border-t-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-bold text-blue-700">New Regime</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Taxable Income</div>
                      <div className="text-lg font-extrabold text-primary-700">{formatINR(result.taxableNew)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tax + Surcharge</div>
                      <div className="text-sm font-bold text-slate-600">{formatINR(result.taxNewBeforeCess)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cess (4%)</div>
                      <div className="text-sm font-bold text-slate-600">{formatINR(result.cessNew)}</div>
                    </div>
                    <div className="pt-2 border-t border-surface-200">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Tax</div>
                      <div className="text-xl font-extrabold text-blue-600">{formatINR(result.totalTaxNew)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bar Chart: Old vs New Comparison ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Old vs New Regime Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Side-by-side comparison of taxable income, tax payable, and take-home salary</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="old" name="Old Regime" fill={COLORS.oldTax} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="new" name="New Regime" fill={COLORS.newTax} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Dual Pie Charts: Salary Breakdown ── */}
              <div className="grid sm:grid-cols-2 gap-6" data-pdf-keep-together>
                <div className="card-base p-6">
                  <h3 className="font-bold text-orange-700 mb-1 text-sm">Old Regime Salary Breakdown</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={oldPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {oldPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={30} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card-base p-6">
                  <h3 className="font-bold text-blue-700 mb-1 text-sm">New Regime Salary Breakdown</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={newPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {newPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={30} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── Deduction Breakdown Table (Old Regime) ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Deduction Breakdown (Old Regime)</h3>
                  <p className="text-sm text-slate-500 mb-4">Detailed view of all deductions claimed under the Old Tax Regime</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Deduction</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Claimed</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Limit</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Utilised</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.deductionBreakdown.map((row) => {
                        const utilPct = row.limit > 0 ? Math.round((row.claimed / row.limit) * 100) : 0;
                        return (
                          <tr key={row.name} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">{row.name}</td>
                            <td className="py-3 px-6 text-right font-semibold text-teal-700">{formatINR(row.claimed)}</td>
                            <td className="py-3 px-6 text-right text-slate-500">{formatINR(row.limit)}</td>
                            <td className="py-3 px-6 text-right">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                utilPct >= 100 ? 'bg-emerald-100 text-emerald-700' : utilPct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              )}>
                                {utilPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-surface-100 font-bold">
                        <td className="py-3 px-6 text-primary-700">Total Deductions</td>
                        <td className="py-3 px-6 text-right text-teal-700">{formatINR(result.totalDeductionsOld)}</td>
                        <td className="py-3 px-6 text-right text-slate-500">&mdash;</td>
                        <td className="py-3 px-6 text-right text-slate-500">&mdash;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Slab Breakdown Tables ── */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Old Regime Slabs */}
                <div className="card-base overflow-hidden" data-pdf-keep-together>
                  <div className="p-5 pb-0 border-b-2 border-orange-200">
                    <h3 className="font-bold text-orange-700 mb-3 text-sm">Old Regime Slab Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Slab</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Rate</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Income</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.oldSlabs.filter(s => s.incomeInSlab > 0).map((row) => (
                          <tr key={row.slab} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-primary-700 text-xs">{row.slab}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600 text-xs">{row.rate}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600 text-xs">{formatINR(Math.round(row.incomeInSlab))}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-red-600 text-xs">{formatINR(Math.round(row.taxInSlab))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* New Regime Slabs */}
                <div className="card-base overflow-hidden" data-pdf-keep-together>
                  <div className="p-5 pb-0 border-b-2 border-blue-200">
                    <h3 className="font-bold text-blue-700 mb-3 text-sm">New Regime Slab Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Slab</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Rate</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Income</th>
                          <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.newSlabs.filter(s => s.incomeInSlab > 0).map((row) => (
                          <tr key={row.slab} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-primary-700 text-xs">{row.slab}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600 text-xs">{row.rate}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600 text-xs">{formatINR(Math.round(row.incomeInSlab))}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-blue-600 text-xs">{formatINR(Math.round(row.taxInSlab))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Tax Savings Insights ── */}
              <div className="card-base p-6 bg-gradient-to-r from-brand-50 via-teal-50 to-emerald-50 border border-teal-200" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingDown className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-2">Tax Savings Insights</h4>
                    <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
                      {result.betterRegime === 'old' && result.hraExemption > 0 && (
                        <li>HRA exemption of <span className="font-semibold text-teal-700">{formatINR(result.hraExemption)}</span> is a key advantage of the Old Regime for you.</li>
                      )}
                      {section80C > 0 && (
                        <li>Your 80C investments of <span className="font-semibold text-teal-700">{formatINR(section80C)}</span> save approximately <span className="font-semibold text-emerald-700">{formatINR(Math.round(section80C * 0.3))}</span> in the 30% bracket under Old Regime.</li>
                      )}
                      {nps80CCD > 0 && (
                        <li>NPS contribution of <span className="font-semibold text-teal-700">{formatINR(nps80CCD)}</span> under 80CCD(1B) provides additional tax benefit beyond 80C limit.</li>
                      )}
                      {homeLoanInterest === 0 && (
                        <li>You are not claiming home loan interest deduction (24b). If you have a home loan, claiming up to <span className="font-semibold text-amber-700">₹2,00,000</span> could shift the balance towards Old Regime.</li>
                      )}
                      <li>
                        The New Regime offers a standard deduction of <span className="font-semibold text-blue-700">₹75,000</span> and full tax rebate up to <span className="font-semibold text-blue-700">₹12L</span> taxable income (FY 2025-26).
                      </li>
                      {result.totalDeductionsOld < 375000 && (
                        <li className="text-amber-700">
                          Your total deductions are below ₹3.75L. Generally, the New Regime becomes more beneficial when Old Regime deductions are less than ₹3.75L for incomes above ₹15L.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── Important Note ── */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-2">Important Note</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This calculator provides an indicative comparison based on the FY 2025-26 tax slabs. Actual tax liability may differ
                  based on additional exemptions, allowances (LTA, food coupons), capital gains, other income sources, and specific employer
                  salary structure. The New Regime is the default regime; you need to explicitly opt for the Old Regime while filing returns.
                  Consult a qualified tax professional for personalized tax planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
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
