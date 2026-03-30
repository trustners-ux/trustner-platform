'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, IndianRupee, TrendingUp, Calendar, Percent, Building, Key } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  buying: '#0F766E',
  renting: '#2563EB',
  property: '#059669',
  investment: '#7C3AED',
};

export default function RentVsBuyCalculatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(8000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [annualRentIncrease, setAnnualRentIncrease] = useState(5);
  const [propertyAppreciation, setPropertyAppreciation] = useState(5);
  const [annualMaintenance, setAnnualMaintenance] = useState(1);
  const [propertyTax, setPropertyTax] = useState(0.5);
  const [investReturnRate, setInvestReturnRate] = useState(12);
  const [timeHorizon, setTimeHorizon] = useState(20);

  const result = useMemo(() => {
    // ── Core derived values ──
    const downPayment = propertyPrice * (downPaymentPct / 100);
    const loanAmount = propertyPrice - downPayment;
    const stampDuty = propertyPrice * 0.07;
    const monthlyLoanRate = loanRate / 100 / 12;
    const loanMonths = loanTenure * 12;

    // ── EMI calculation ──
    let emi = 0;
    if (loanAmount > 0 && monthlyLoanRate > 0 && loanMonths > 0) {
      emi = loanAmount * monthlyLoanRate * Math.pow(1 + monthlyLoanRate, loanMonths) /
        (Math.pow(1 + monthlyLoanRate, loanMonths) - 1);
    } else if (loanAmount > 0 && loanMonths > 0) {
      emi = loanAmount / loanMonths;
    }

    // ── Year-by-year calculation ──
    const yearlyData = [];
    let cumulativeRentPaid = 0;
    let cumulativeBuyOutflow = downPayment + stampDuty; // upfront costs
    let cumulativeEMI = 0;
    let cumulativeMaintenance = 0;
    let cumulativePropertyTax = 0;
    let breakEvenYear: number | null = null;

    // For renting: track investment portfolio
    // Initial investment = down payment + stamp duty (money not spent on house)
    const initialInvestment = downPayment + stampDuty;

    for (let year = 1; year <= timeHorizon; year++) {
      // ── Property value this year ──
      const propertyValueAtYear = propertyPrice * Math.pow(1 + propertyAppreciation / 100, year);
      const propertyValueLastYear = propertyPrice * Math.pow(1 + propertyAppreciation / 100, year - 1);

      // ── Buying costs this year ──
      const emiThisYear = year <= loanTenure ? emi * 12 : 0;
      const maintenanceThisYear = propertyValueLastYear * (annualMaintenance / 100);
      const propertyTaxThisYear = propertyValueLastYear * (propertyTax / 100);

      cumulativeEMI += emiThisYear;
      cumulativeMaintenance += maintenanceThisYear;
      cumulativePropertyTax += propertyTaxThisYear;
      cumulativeBuyOutflow = downPayment + stampDuty + cumulativeEMI + cumulativeMaintenance + cumulativePropertyTax;

      // Net buying cost = total outflow - property value (the asset you own)
      const netBuyCost = cumulativeBuyOutflow - propertyValueAtYear;

      // ── Renting costs this year ──
      const rentThisYear = monthlyRent * 12 * Math.pow(1 + annualRentIncrease / 100, year - 1);
      cumulativeRentPaid += rentThisYear;

      // Monthly buy cost vs rent cost — difference invested if renting is cheaper
      const monthlyBuyCost = (emiThisYear + maintenanceThisYear + propertyTaxThisYear) / 12;
      const monthlyRentThisYear = monthlyRent * Math.pow(1 + annualRentIncrease / 100, year - 1);

      // Investment portfolio for renter:
      // Initial lumpsum (down payment + stamp duty) compounded
      const lumpsumGrowth = initialInvestment * Math.pow(1 + investReturnRate / 100, year);

      // Monthly savings (buy cost - rent cost) invested as SIP each year
      // We accumulate SIP contributions year by year
      let sipCorpus = 0;
      const monthlyInvestRate = investReturnRate / 100 / 12;
      for (let y = 1; y <= year; y++) {
        const buyCostMonthly = ((y <= loanTenure ? emi * 12 : 0) +
          propertyPrice * Math.pow(1 + propertyAppreciation / 100, y - 1) * (annualMaintenance / 100) +
          propertyPrice * Math.pow(1 + propertyAppreciation / 100, y - 1) * (propertyTax / 100)) / 12;
        const rentCostMonthly = monthlyRent * Math.pow(1 + annualRentIncrease / 100, y - 1);
        const monthlySaving = Math.max(0, buyCostMonthly - rentCostMonthly);

        // This year's SIP grows for (year - y) remaining years
        const remainingMonths = (year - y) * 12;
        if (monthlySaving > 0 && monthlyInvestRate > 0) {
          // SIP for 12 months, then lumpsum growth for remaining months
          const sipFor12 = monthlySaving * ((Math.pow(1 + monthlyInvestRate, 12) - 1) / monthlyInvestRate) * (1 + monthlyInvestRate);
          const grown = sipFor12 * Math.pow(1 + monthlyInvestRate, remainingMonths);
          sipCorpus += grown;
        } else if (monthlySaving > 0) {
          sipCorpus += monthlySaving * 12;
        }
      }

      const investmentPortfolio = lumpsumGrowth + sipCorpus;
      const netRentCost = cumulativeRentPaid - investmentPortfolio;

      // ── Break-even detection ──
      if (breakEvenYear === null && netBuyCost < netRentCost) {
        breakEvenYear = year;
      }

      yearlyData.push({
        year,
        yearLabel: `Year ${year}`,
        rentThisYear: Math.round(rentThisYear),
        buyCostThisYear: Math.round(emiThisYear + maintenanceThisYear + propertyTaxThisYear),
        cumulativeRentCost: Math.round(netRentCost),
        cumulativeBuyCost: Math.round(netBuyCost),
        propertyValue: Math.round(propertyValueAtYear),
        investmentValue: Math.round(investmentPortfolio),
        cumulativeRentPaid: Math.round(cumulativeRentPaid),
        cumulativeBuyOutflow: Math.round(cumulativeBuyOutflow),
      });
    }

    // ── Final values ──
    const finalYear = yearlyData[yearlyData.length - 1];
    const totalBuyCost = finalYear.cumulativeBuyCost;
    const totalRentCost = finalYear.cumulativeRentCost;
    const propertyValueEnd = finalYear.propertyValue;
    const investmentPortfolioEnd = finalYear.investmentValue;
    const verdict: 'buy' | 'rent' = totalBuyCost <= totalRentCost ? 'buy' : 'rent';
    const savingAmount = Math.abs(totalBuyCost - totalRentCost);

    // ── Bar chart data ──
    const barData = [
      {
        metric: 'Total Outflow',
        buying: finalYear.cumulativeBuyOutflow,
        renting: Math.round(cumulativeRentPaid),
      },
      {
        metric: 'Asset Value',
        buying: propertyValueEnd,
        renting: investmentPortfolioEnd,
      },
      {
        metric: 'Net Cost',
        buying: Math.max(0, totalBuyCost),
        renting: Math.max(0, totalRentCost),
      },
    ];

    return {
      emi: Math.round(emi),
      downPayment: Math.round(downPayment),
      loanAmount: Math.round(loanAmount),
      stampDuty: Math.round(stampDuty),
      totalBuyCost,
      totalRentCost,
      propertyValueEnd,
      investmentPortfolioEnd,
      verdict,
      savingAmount: Math.round(savingAmount),
      breakEvenYear,
      yearlyData,
      barData,
      totalBuyOutflow: finalYear.cumulativeBuyOutflow,
      totalRentPaid: Math.round(cumulativeRentPaid),
    };
  }, [propertyPrice, downPaymentPct, loanRate, loanTenure, monthlyRent, annualRentIncrease, propertyAppreciation, annualMaintenance, propertyTax, investReturnRate, timeHorizon]);

  return (
    <>
      {/* ── Header ── */}
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
              <Home className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Real Estate Planner</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Rent vs Buy Calculator</h1>
              <p className="text-slate-300 mt-1">
                Should you rent or buy a house? Compare total costs and find the break-even year.
              </p>
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
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Scenario</h2>

              <div className="space-y-5">
                <NumberInput label="Property Price" value={propertyPrice} onChange={setPropertyPrice} prefix="₹" step={500000} min={1000000} max={500000000} />
                <NumberInput label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} suffix="%" step={5} min={0} max={100} />
                <NumberInput label="Home Loan Rate" value={loanRate} onChange={setLoanRate} suffix="% p.a." step={0.1} min={5} max={15} />
                <NumberInput label="Loan Tenure" value={loanTenure} onChange={setLoanTenure} suffix="Years" step={1} min={5} max={30} />

                <div className="border-t border-surface-300 pt-5">
                  <NumberInput label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="₹" step={1000} min={1000} max={500000} />
                </div>
                <NumberInput label="Annual Rent Increase" value={annualRentIncrease} onChange={setAnnualRentIncrease} suffix="%" step={0.5} min={0} max={15} />

                <div className="border-t border-surface-300 pt-5">
                  <NumberInput label="Property Appreciation" value={propertyAppreciation} onChange={setPropertyAppreciation} suffix="% p.a." step={0.5} min={0} max={15} />
                </div>
                <NumberInput label="Annual Maintenance" value={annualMaintenance} onChange={setAnnualMaintenance} suffix="% of price" step={0.1} min={0} max={5} />
                <NumberInput label="Property Tax" value={propertyTax} onChange={setPropertyTax} suffix="% of price" step={0.1} min={0} max={3} />
                <NumberInput
                  label="Investment Return Rate"
                  value={investReturnRate}
                  onChange={setInvestReturnRate}
                  suffix="% p.a."
                  step={0.5}
                  min={5}
                  max={20}
                  hint="Opportunity cost of down payment if invested"
                />
                <NumberInput label="Time Horizon" value={timeHorizon} onChange={setTimeHorizon} suffix="Years" step={1} min={5} max={30} />
              </div>

              {/* ── Summary Cards (sidebar) ── */}
              <div className="mt-6 space-y-3">
                {/* EMI Card */}
                <div className="rounded-xl p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Monthly EMI</span>
                  </div>
                  <div className="text-2xl font-extrabold text-teal-700">{formatINR(result.emi)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">for {loanTenure} years on {formatINR(result.loanAmount)} loan</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-surface-100">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Buy Cost</div>
                    <div className="text-lg font-extrabold text-teal-700">{formatINR(result.totalBuyOutflow)}</div>
                  </div>
                  <div className="rounded-xl p-3 bg-surface-100">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Rent Paid</div>
                    <div className="text-lg font-extrabold text-blue-600">{formatINR(result.totalRentPaid)}</div>
                  </div>
                  <div className="rounded-xl p-3 bg-surface-100">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Property Value</div>
                    <div className="text-lg font-extrabold text-emerald-600">{formatINR(result.propertyValueEnd)}</div>
                  </div>
                  <div className="rounded-xl p-3 bg-surface-100">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Investment Portfolio</div>
                    <div className="text-lg font-extrabold text-purple-600">{formatINR(result.investmentPortfolioEnd)}</div>
                  </div>
                </div>

                {/* Verdict Card */}
                <div className={cn(
                  'rounded-xl p-5 text-center',
                  result.verdict === 'buy'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                )}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {result.verdict === 'buy' ? (
                      <Building className="w-6 h-6 text-green-600" />
                    ) : (
                      <Key className="w-6 h-6 text-blue-600" />
                    )}
                    <span className={cn('text-lg font-extrabold', result.verdict === 'buy' ? 'text-green-700' : 'text-blue-700')}>
                      {result.verdict === 'buy' ? 'Buying is Better' : 'Renting is Better'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">You save {formatINR(result.savingAmount)} over {timeHorizon} years</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Break-even: {result.breakEvenYear ? `Year ${result.breakEvenYear}` : `Beyond ${timeHorizon} years`}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: Results Panel ── */}
            <div className="space-y-8">
              {/* Download Button */}
              <div className="flex justify-end">
                <DownloadPDFButton elementId="calculator-results" title="Rent vs Buy Calculator" fileName="rent-vs-buy-calculator" />
              </div>

              {/* ── Verdict Banner ── */}
              <div className={cn(
                'rounded-xl p-6 text-center',
                result.verdict === 'buy'
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
              )} data-pdf-keep-together>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {result.verdict === 'buy' ? (
                    <Building className="w-8 h-8 text-green-600" />
                  ) : (
                    <Key className="w-8 h-8 text-blue-600" />
                  )}
                  <span className={cn('text-2xl font-extrabold', result.verdict === 'buy' ? 'text-green-700' : 'text-blue-700')}>
                    {result.verdict === 'buy' ? 'Buy the House' : 'Continue Renting & Invest'}
                  </span>
                </div>
                <p className="text-base text-slate-600">
                  {result.verdict === 'buy' ? 'Buying' : 'Renting'} saves you <strong>{formatINR(result.savingAmount)}</strong> over {timeHorizon} years.
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {result.breakEvenYear
                    ? <>Buying breaks even at <strong>Year {result.breakEvenYear}</strong>. After that, ownership costs less than renting.</>
                    : <>Buying does not break even within {timeHorizon} years at current assumptions.</>}
                </p>
              </div>

              {/* ── Summary Cards ── */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-base p-5 border-t-4 border-teal-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly EMI</span>
                  </div>
                  <div className="text-2xl font-extrabold text-teal-700">{formatINR(result.emi)}</div>
                  <div className="text-xs text-slate-400 mt-1">for {loanTenure} years</div>
                </div>
                <div className="card-base p-5 border-t-4 border-emerald-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property Value</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">{formatINR(result.propertyValueEnd)}</div>
                  <div className="text-xs text-slate-400 mt-1">after {timeHorizon} years at {propertyAppreciation}% p.a.</div>
                </div>
                <div className="card-base p-5 border-t-4 border-purple-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Portfolio</span>
                  </div>
                  <div className="text-2xl font-extrabold text-purple-700">{formatINR(result.investmentPortfolioEnd)}</div>
                  <div className="text-xs text-slate-400 mt-1">if renting & investing at {investReturnRate}% p.a.</div>
                </div>
              </div>

              {/* ── Cumulative Cost AreaChart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cumulative Net Cost: Buying vs Renting</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Net cost = total outflow minus asset value. Lower is better.
                  {result.breakEvenYear && ` Buying breaks even at Year ${result.breakEvenYear}.`}
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.buying} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.buying} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.renting} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.renting} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'cumulativeBuyCost' ? 'Net Buy Cost' : 'Net Rent Cost',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Area type="monotone" dataKey="cumulativeBuyCost" stroke={COLORS.buying} fill="url(#gradBuy)" strokeWidth={2} name="cumulativeBuyCost" />
                      <Area type="monotone" dataKey="cumulativeRentCost" stroke={COLORS.renting} fill="url(#gradRent)" strokeWidth={2} name="cumulativeRentCost" />
                      <Legend
                        iconType="circle"
                        formatter={(value: string) => value === 'cumulativeBuyCost' ? 'Net Buy Cost' : 'Net Rent Cost'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Comparison BarChart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Side-by-Side Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Total outflow, asset value, and net cost after {timeHorizon} years
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'buying' ? 'Buying' : 'Renting',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="buying" name="Buying" fill={COLORS.buying} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="renting" name="Renting" fill={COLORS.renting} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Year-by-Year Table ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Annual costs, cumulative net costs, and asset values for both paths
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Year
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-blue-600">
                          Rent/yr
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-teal-600">
                          Buy Cost/yr
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-blue-700">
                          Cum. Rent Net
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-teal-700">
                          Cum. Buy Net
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-emerald-600">
                          Property
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-purple-600">
                          Investment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => {
                        const isBreakEven = row.year === result.breakEvenYear;
                        return (
                          <tr
                            key={row.year}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              isBreakEven && 'bg-green-50/50 font-medium'
                            )}
                          >
                            <td className="py-3 px-3 sm:px-4 font-medium text-primary-700">
                              {row.year}
                              {isBreakEven && (
                                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Break-even</span>
                              )}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right text-blue-600">{formatINR(row.rentThisYear)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-teal-600">{formatINR(row.buyCostThisYear)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-blue-700 font-semibold">{formatINR(row.cumulativeRentCost)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-teal-700 font-semibold">{formatINR(row.cumulativeBuyCost)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-emerald-600">{formatINR(row.propertyValue)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-purple-600">{formatINR(row.investmentValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Insight Note ── */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-2">How This Calculator Works</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  This calculator compares two financial paths over your chosen time horizon:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.buying }} />
                    <div>
                      <strong className="text-teal-700">Buying Path:</strong>
                      <span className="text-slate-600"> Pay down payment + stamp duty (7%), take a home loan, and pay EMI + maintenance + property tax. You build equity through property appreciation.</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.renting }} />
                    <div>
                      <strong className="text-blue-700">Renting Path:</strong>
                      <span className="text-slate-600"> Pay rent (with annual increases). Invest the down payment + stamp duty as a lumpsum, and invest monthly savings (difference between buy and rent cost) as SIP.</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  The break-even year is when buying becomes cheaper than renting on a net-cost basis (total outflow minus asset value). Higher property appreciation and lower investment returns favor buying; higher investment returns and lower appreciation favor renting.
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
