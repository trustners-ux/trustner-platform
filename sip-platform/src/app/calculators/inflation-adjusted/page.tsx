'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, ArrowLeft, TrendingDown, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { calculateInflationAdjustedSIP, calculateSIPBreakdown } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  nominal: '#0F766E',
  real: '#E8553A',
  inflation: '#EF4444',
  invested: '#64748B',
};

export default function InflationAdjustedSIPCalculatorPage() {
  const [monthly, setMonthly] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(20);
  const [inflationRate, setInflationRate] = useState(6);
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  const result = useMemo(
    () => calculateInflationAdjustedSIP(monthly, returnRate, years, inflationRate),
    [monthly, returnRate, years, inflationRate]
  );

  const nominalBreakdown = useMemo(
    () => calculateSIPBreakdown(monthly, returnRate, years),
    [monthly, returnRate, years]
  );

  const realReturn = ((1 + returnRate / 100) / (1 + inflationRate / 100) - 1) * 100;
  const realBreakdown = useMemo(
    () => calculateSIPBreakdown(monthly, Math.max(realReturn, 0), years),
    [monthly, realReturn, years]
  );

  const chartData = nominalBreakdown.map((row, i) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    nominal: row.value,
    real: realBreakdown[i]?.value || 0,
    invested: row.invested,
  }));

  const pieData = [
    { name: 'Real Value', value: result.real.totalValue, color: COLORS.real },
    { name: 'Inflation Impact', value: result.inflationImpact, color: COLORS.inflation },
  ];

  const purchasingPowerLoss = result.nominal.totalValue > 0
    ? ((result.inflationImpact / result.nominal.totalValue) * 100).toFixed(1)
    : '0';

  const realReturnDisplay = realReturn.toFixed(1);

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
              <BarChart3 className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Inflation-Adjusted SIP Calculator</h1>
              <p className="text-slate-300 mt-1">Understand the real purchasing power of your SIP returns after inflation</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Inputs</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                <NumberInput label="Monthly Investment" value={monthly} onChange={setMonthly} prefix="₹" step={500} min={500} max={500000} />
                <NumberInput label="Expected Return (Nominal)" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />
                <NumberInput label="Investment Duration" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />
                <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={0.5} min={1} max={15} />
              </div>

              {/* Results */}
              <div className="mt-8 space-y-3">
                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Nominal Value</div>
                  <div className="text-2xl font-extrabold gradient-text">{formatINR(result.nominal.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">At {returnRate}% return</div>
                </div>

                <div className="bg-gradient-to-r from-teal-50 to-teal-50/50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Real Value (After Inflation)</div>
                  <div className="text-2xl font-extrabold text-positive">{formatINR(result.real.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">Real return: {realReturnDisplay}% p.a.</div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Inflation Impact</div>
                    <div className="text-lg font-extrabold text-red-600">{formatINR(result.inflationImpact)}</div>
                    <div className="text-xs text-red-500 mt-1">{purchasingPowerLoss}% purchasing power lost</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} Inflation-Adjusted SIP Analysis
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? <>Today&apos;s {formatINR(result.nominal.totalValue)} = {formatINR(result.real.totalValue)} in purchasing power at age {investorAge + years}</>
                      : <>Nominal vs real value comparison over {years} years</>
                    }
                  </p>
                </div>
              )}

              {/* Nominal vs Real Chart */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">Nominal vs Real Value</h3>
                  <DownloadPDFButton elementId="calculator-results" title="Inflation-Adjusted SIP Calculator" fileName="inflation-adjusted-calculator" />
                </div>
                <p className="text-sm text-slate-500 mb-6">The gap between what you see and what you can buy</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="inflGradNominal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.nominal} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.nominal} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="inflGradReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.real} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.real} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'nominal' ? 'Nominal Value' : name === 'real' ? 'Real Value' : 'Invested',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="Invested" />
                      <Area type="monotone" dataKey="nominal" stroke={COLORS.nominal} fill="url(#inflGradNominal)" strokeWidth={2} name="Nominal Value" />
                      <Area type="monotone" dataKey="real" stroke={COLORS.real} fill="url(#inflGradReal)" strokeWidth={2} name="Real Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inflation Impact Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Inflation Impact Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">How much of your nominal value is eroded by inflation</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Key Insights</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-surface-100 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Nominal Return</div>
                    <div className="text-xl font-bold text-primary-700">{returnRate}% p.a.</div>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Real Return</div>
                    <div className="text-xl font-bold text-positive">{realReturnDisplay}% p.a.</div>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Nominal Wealth Multiple</div>
                    <div className="text-xl font-bold text-primary-700">
                      {result.nominal.totalInvested > 0 ? (result.nominal.totalValue / result.nominal.totalInvested).toFixed(1) : '0'}x
                    </div>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Real Wealth Multiple</div>
                    <div className="text-xl font-bold text-positive">
                      {result.real.totalInvested > 0 ? (result.real.totalValue / result.real.totalInvested).toFixed(1) : '0'}x
                    </div>
                  </div>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">Nominal vs inflation-adjusted values</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nominal</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Real</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Inflation Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nominalBreakdown.map((row, i) => {
                        const realValue = realBreakdown[i]?.value || 0;
                        const inflLoss = row.value - realValue;
                        return (
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">Year {row.year}</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-primary-700">{formatINR(row.value)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-positive">{formatINR(realValue)}</td>
                            <td className="py-3 px-6 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                -{formatINR(inflLoss)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
