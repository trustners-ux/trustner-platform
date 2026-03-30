'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, IndianRupee, Percent, Building2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  comfortable: '#10B981',
  manageable: '#F59E0B',
  stretched: '#EF4444',
  emi: '#2563EB',
  existing: '#D97706',
  remaining: '#0F766E',
};

const SENSITIVITY_RATES = [7, 8, 9, 10, 11];

export default function HomeAffordabilityCalculatorPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [existingEMIs, setExistingEMIs] = useState(0);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [downPaymentPct, setDownPaymentPct] = useState(20);

  // ── Core Calculation ──
  const results = useMemo(() => {
    const foirLevels = [
      { label: 'Comfortable', foir: 35, icon: CheckCircle, borderColor: 'border-emerald-400', bgColor: 'bg-emerald-50/60', textColor: 'text-emerald-700', iconColor: 'text-emerald-500' },
      { label: 'Manageable', foir: 45, icon: AlertTriangle, borderColor: 'border-amber-400', bgColor: 'bg-amber-50/60', textColor: 'text-amber-700', iconColor: 'text-amber-500' },
      { label: 'Stretched', foir: 55, icon: Shield, borderColor: 'border-red-400', bgColor: 'bg-red-50/60', textColor: 'text-red-700', iconColor: 'text-red-500' },
    ];

    const r = interestRate / 12 / 100;
    const n = tenureYears * 12;

    // EMI to Loan Amount factor: ((1+r)^n - 1) / (r * (1+r)^n)
    const compoundFactor = Math.pow(1 + r, n);
    const loanFactor = (compoundFactor - 1) / (r * compoundFactor);

    const tiers = foirLevels.map((level) => {
      const maxEmi = Math.max(0, (monthlyIncome * level.foir) / 100 - existingEMIs);
      const loanAmount = Math.round(maxEmi * loanFactor);
      const propertyPrice = Math.round(loanAmount / (1 - downPaymentPct / 100));
      const downPaymentAmount = propertyPrice - loanAmount;

      return {
        ...level,
        maxEmi: Math.round(maxEmi),
        loanAmount,
        propertyPrice,
        downPaymentAmount,
      };
    });

    // Default to manageable (index 1) for summary cards
    const manageable = tiers[1];

    // Income allocation (based on manageable FOIR)
    const emiAllocation = manageable.maxEmi;
    const existingAllocation = existingEMIs;
    const remainingIncome = Math.max(0, monthlyIncome - emiAllocation - existingAllocation);

    const incomeAllocation = [
      { name: 'Home Loan EMI', value: emiAllocation, color: COLORS.emi },
      ...(existingAllocation > 0 ? [{ name: 'Existing EMIs', value: existingAllocation, color: COLORS.existing }] : []),
      { name: 'Remaining Income', value: remainingIncome, color: COLORS.remaining },
    ].filter((d) => d.value > 0);

    // Interest rate sensitivity bar chart (manageable FOIR)
    const sensitivityBarData = SENSITIVITY_RATES.map((rate) => {
      const rr = rate / 12 / 100;
      const cf = Math.pow(1 + rr, n);
      const lf = (cf - 1) / (rr * cf);
      const emi = Math.max(0, (monthlyIncome * 45) / 100 - existingEMIs);
      const loan = Math.round(emi * lf);
      const price = Math.round(loan / (1 - downPaymentPct / 100));
      return {
        rate: `${rate}%`,
        propertyPrice: price,
      };
    });

    // Sensitivity table: 3 FOIR levels x 5 interest rates
    const sensitivityTable = SENSITIVITY_RATES.map((rate) => {
      const rr = rate / 12 / 100;
      const cf = Math.pow(1 + rr, n);
      const lf = (cf - 1) / (rr * cf);

      const comfortable = Math.max(0, (monthlyIncome * 35) / 100 - existingEMIs);
      const manageableEmi = Math.max(0, (monthlyIncome * 45) / 100 - existingEMIs);
      const stretched = Math.max(0, (monthlyIncome * 55) / 100 - existingEMIs);

      return {
        rate,
        comfortable: Math.round((comfortable * lf) / (1 - downPaymentPct / 100)),
        manageable: Math.round((manageableEmi * lf) / (1 - downPaymentPct / 100)),
        stretched: Math.round((stretched * lf) / (1 - downPaymentPct / 100)),
      };
    });

    return { tiers, manageable, incomeAllocation, sensitivityBarData, sensitivityTable };
  }, [monthlyIncome, existingEMIs, interestRate, tenureYears, downPaymentPct]);

  const { tiers, manageable, incomeAllocation, sensitivityBarData, sensitivityTable } = results;

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
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Affordability Planner</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Home Loan Affordability Calculator</h1>
              <p className="text-slate-300 mt-1">
                How much house can you afford? Find out based on your income, existing loans, and preferred EMI comfort level.
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
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your Financial Profile</h2>

              <div className="space-y-5 mb-6">
                <NumberInput
                  label="Monthly Gross Income"
                  value={monthlyIncome}
                  onChange={setMonthlyIncome}
                  prefix="₹"
                  step={5000}
                  min={20000}
                  max={5000000}
                />
                <NumberInput
                  label="Existing EMIs"
                  value={existingEMIs}
                  onChange={setExistingEMIs}
                  prefix="₹"
                  step={1000}
                  min={0}
                  max={500000}
                />
                <NumberInput
                  label="Loan Interest Rate"
                  value={interestRate}
                  onChange={setInterestRate}
                  suffix="%"
                  step={0.1}
                  min={5}
                  max={15}
                />
                <NumberInput
                  label="Loan Tenure"
                  value={tenureYears}
                  onChange={setTenureYears}
                  suffix="Years"
                  step={1}
                  min={5}
                  max={30}
                />
                <NumberInput
                  label="Down Payment"
                  value={downPaymentPct}
                  onChange={setDownPaymentPct}
                  suffix="%"
                  step={5}
                  min={5}
                  max={50}
                />
              </div>

              {/* ── 3-Tier Summary Cards (sidebar) ── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Affordability Tiers</h3>
                {tiers.map((tier) => (
                  <div key={tier.label} className={cn('rounded-xl border-2 p-4', tier.borderColor, tier.bgColor)}>
                    <div className="flex items-center gap-2 mb-2">
                      <tier.icon className={cn('w-4 h-4', tier.iconColor)} />
                      <span className={cn('text-xs font-bold uppercase tracking-wider', tier.textColor)}>{tier.label}</span>
                      <span className="text-[10px] text-slate-400">({tier.foir}% of income)</span>
                    </div>
                    <div className={cn('text-lg font-extrabold', tier.textColor)}>{formatINR(tier.propertyPrice)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      EMI: {formatINR(tier.maxEmi)}/month | Loan: {formatINR(tier.loanAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Results Panel ── */}
            <div className="space-y-8">
              {/* Download button */}
              <div className="flex justify-end">
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="Home Loan Affordability Calculator"
                  fileName="home-affordability"
                />
              </div>

              {/* ── 3-Tier Recommendation Cards (detailed) ── */}
              <div className="grid sm:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.label}
                    className={cn(
                      'card-base p-5 border-t-4 transition-shadow hover:shadow-lg',
                      tier.label === 'Comfortable'
                        ? 'border-emerald-500'
                        : tier.label === 'Manageable'
                          ? 'border-amber-500'
                          : 'border-red-500'
                    )}
                    data-pdf-keep-together
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <tier.icon className={cn('w-5 h-5', tier.iconColor)} />
                      <span className={cn('text-sm font-bold', tier.textColor)}>{tier.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">FOIR at {tier.foir}%</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Max Property Price</div>
                        <div className={cn('text-xl font-extrabold', tier.textColor)}>{formatINR(tier.propertyPrice)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Max EMI</div>
                        <div className="text-sm font-bold text-primary-700">{formatINR(tier.maxEmi)}/mo</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Loan Amount</div>
                        <div className="text-sm font-bold text-primary-700">{formatINR(tier.loanAmount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Down Payment ({downPaymentPct}%)</div>
                        <div className="text-sm font-bold text-primary-700">{formatINR(tier.downPaymentAmount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Summary Cards ── */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-base p-5 border-t-4 border-blue-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max EMI (45% FOIR)</span>
                  </div>
                  <div className="text-2xl font-extrabold text-blue-700">{formatINR(manageable.maxEmi)}</div>
                  <div className="text-xs text-slate-400 mt-1">per month</div>
                </div>
                <div className="card-base p-5 border-t-4 border-brand-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Loan Amount</span>
                  </div>
                  <div className="text-2xl font-extrabold text-brand-700">{formatINR(manageable.loanAmount)}</div>
                  <div className="text-xs text-slate-400 mt-1">{tenureYears} year tenure at {interestRate}%</div>
                </div>
                <div className="card-base p-5 border-t-4 border-amber-500" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Property</span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700">{formatINR(manageable.propertyPrice)}</div>
                  <div className="text-xs text-slate-400 mt-1">with {downPaymentPct}% down payment</div>
                </div>
              </div>

              {/* ── Key Insight Box ── */}
              <div className="card-base p-5 bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 border border-teal-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Home className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      With a monthly income of <span className="font-semibold text-brand-700">{formatINR(monthlyIncome)}</span>
                      {existingEMIs > 0 && <> and existing EMIs of <span className="font-semibold text-amber-700">{formatINR(existingEMIs)}</span></>},
                      you can comfortably afford a property up to <span className="font-semibold text-emerald-700">{formatINR(tiers[0].propertyPrice)}</span>.
                      If you can stretch your budget, you could go up to <span className="font-semibold text-amber-700">{formatINR(tiers[1].propertyPrice)}</span> (manageable)
                      or <span className="font-semibold text-red-700">{formatINR(tiers[2].propertyPrice)}</span> (maximum stretch).
                      We recommend the comfortable range to maintain financial flexibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Income Allocation PieChart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Income Allocation</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How your monthly income of {formatINR(monthlyIncome)} gets allocated at 45% FOIR
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {incomeAllocation.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Allocation breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {incomeAllocation.map((item) => (
                    <div key={item.name} className="text-center p-3 rounded-lg bg-surface-50 border border-surface-200">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-slate-400 uppercase">{item.name}</span>
                      </div>
                      <div className="text-sm font-extrabold text-primary-700">{formatINR(item.value)}</div>
                      <div className="text-[10px] text-slate-400">/month</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Interest Rate Sensitivity BarChart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Interest Rate Sensitivity</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Property affordability at different interest rates (at 45% FOIR)
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensitivityBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="rate" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Property Price']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Bar dataKey="propertyPrice" name="Property Price" fill={COLORS.emi} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Sensitivity Table ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Complete Affordability Matrix</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Maximum property price across FOIR levels and interest rates (tenure: {tenureYears} years, down payment: {downPaymentPct}%)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          <Percent className="w-3.5 h-3.5 inline mr-1" />
                          Interest Rate
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-emerald-700">
                          Comfortable (35%)
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-amber-700">
                          Manageable (45%)
                        </th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-xs uppercase tracking-wider text-red-700">
                          Stretched (55%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityTable.map((row) => {
                        const isCurrentRate = row.rate === Math.round(interestRate * 10) / 10;
                        return (
                          <tr
                            key={row.rate}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              isCurrentRate && 'bg-brand-50/50 font-medium'
                            )}
                          >
                            <td className="py-3 px-3 sm:px-4 font-medium text-primary-700">
                              {row.rate}%
                              {isCurrentRate && (
                                <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">Current</span>
                              )}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right text-emerald-700 font-semibold">{formatINR(row.comfortable)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-amber-700 font-semibold">{formatINR(row.manageable)}</td>
                            <td className="py-3 px-3 sm:px-4 text-right text-red-700 font-semibold">{formatINR(row.stretched)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── FOIR Explainer ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-3">Understanding FOIR (Fixed Obligations to Income Ratio)</h3>
                <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  <p>
                    FOIR is the percentage of your gross monthly income that goes towards all EMIs (existing + new home loan).
                    Banks use this ratio to determine your loan eligibility.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700 uppercase">35% &mdash; Comfortable</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Leaves ample room for savings, investments, and emergencies. Most financial advisors recommend this level.
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700 uppercase">45% &mdash; Manageable</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Banks typically approve loans at this level. Manageable if you have stable income and low lifestyle inflation.
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-700 uppercase">55% &mdash; Stretched</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Maximum stretch. High risk if income drops or expenses rise. Only consider with very high income growth certainty.
                      </p>
                    </div>
                  </div>
                </div>
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
