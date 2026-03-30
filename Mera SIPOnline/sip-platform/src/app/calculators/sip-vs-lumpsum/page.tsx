'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PieChart as PieChartIcon, ArrowLeft, TrendingUp, IndianRupee, Scale } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { compareSIPvsLumpsum } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  sip: '#0F766E',
  lumpsum: '#D4A017',
  invested: '#64748B',
  sipReturns: '#E8553A',
  lumpsumReturns: '#D946EF',
};

export default function SIPvsLumpsumCalculatorPage() {
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [years, setYears] = useState(20);
  const [returnRate, setReturnRate] = useState(12);

  const result = useMemo(
    () => compareSIPvsLumpsum(sipMonthly, years, returnRate),
    [sipMonthly, years, returnRate]
  );

  const totalSIPInvestment = sipMonthly * years * 12;

  const chartData = result.sip.yearlyBreakdown.map((sipRow, i) => {
    const lumpsumRow = result.lumpsum.yearlyBreakdown[i];
    return {
      year: `Yr ${sipRow.year}`,
      sipValue: sipRow.value,
      lumpsumValue: lumpsumRow?.value || 0,
      invested: sipRow.invested,
    };
  });

  const comparisonBarData = [
    { metric: 'Invested', sip: result.sip.totalInvested, lumpsum: result.lumpsum.totalInvested },
    { metric: 'Returns', sip: result.sip.estimatedReturns, lumpsum: result.lumpsum.estimatedReturns },
    { metric: 'Total Value', sip: result.sip.totalValue, lumpsum: result.lumpsum.totalValue },
  ];

  const sipPieData = [
    { name: 'Invested', value: result.sip.totalInvested, color: COLORS.invested },
    { name: 'Returns', value: result.sip.estimatedReturns, color: COLORS.sipReturns },
  ];

  const lumpsumPieData = [
    { name: 'Invested', value: result.lumpsum.totalInvested, color: COLORS.invested },
    { name: 'Returns', value: result.lumpsum.estimatedReturns, color: COLORS.lumpsumReturns },
  ];

  const lumpsumAdvantage = result.lumpsum.totalValue - result.sip.totalValue;
  const winner = lumpsumAdvantage > 0 ? 'lumpsum' : 'sip';

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
              <PieChartIcon className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">SIP vs Lumpsum Comparison</h1>
              <p className="text-slate-300 mt-1">Compare monthly SIP investing against deploying the same total as a one-time lumpsum</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Comparison</h2>

              <div className="space-y-6">
                <NumberInput label="Monthly SIP Amount" value={sipMonthly} onChange={setSipMonthly} prefix="₹" step={500} min={500} max={500000} />
                <NumberInput label="Investment Duration" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="%" step={0.5} min={1} max={30} />
              </div>

              {/* Info */}
              <div className="mt-6 p-3 bg-surface-100 rounded-lg">
                <div className="text-xs text-slate-500">
                  <strong className="text-primary-700">Comparison basis:</strong> Total SIP investment of {formatINR(totalSIPInvestment)} over {years} years
                  vs same amount invested as lumpsum on Day 1.
                </div>
              </div>

              {/* Side-by-side Results */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className={cn('rounded-xl p-4 border-2', winner === 'sip' ? 'border-brand-300 bg-brand-50' : 'border-transparent bg-surface-100')}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">SIP Value</div>
                  <div className="text-lg font-extrabold text-brand">{formatINR(result.sip.totalValue)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Returns: {formatINR(result.sip.estimatedReturns)}</div>
                </div>
                <div className={cn('rounded-xl p-4 border-2', winner === 'lumpsum' ? 'border-secondary-300 bg-secondary-50' : 'border-transparent bg-surface-100')}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Lumpsum Value</div>
                  <div className="text-lg font-extrabold text-secondary-700">{formatINR(result.lumpsum.totalValue)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Returns: {formatINR(result.lumpsum.estimatedReturns)}</div>
                </div>
              </div>

              <div className={cn(
                'mt-3 rounded-xl p-4 text-center',
                winner === 'lumpsum' ? 'bg-secondary-50' : 'bg-brand-50'
              )}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Difference</div>
                <div className={cn('text-lg font-extrabold', winner === 'lumpsum' ? 'text-secondary-700' : 'text-brand')}>
                  {formatINR(Math.abs(lumpsumAdvantage))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {winner === 'lumpsum' ? 'Lumpsum wins' : 'SIP wins'} in this scenario
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              <div className="flex justify-end">
                <DownloadPDFButton elementId="calculator-results" title="SIP vs Lumpsum Calculator" fileName="sip-vs-lumpsum-calculator" />
              </div>
              <div className="space-y-8">
              {/* Growth Comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Growth Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">SIP gradual deployment vs Lumpsum full deployment</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="vsGradSip" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.sip} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.sip} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="vsGradLumpsum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.lumpsum} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.lumpsum} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'sipValue' ? 'SIP Value' : name === 'lumpsumValue' ? 'Lumpsum Value' : 'SIP Invested',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="SIP Invested" />
                      <Area type="monotone" dataKey="sipValue" stroke={COLORS.sip} fill="url(#vsGradSip)" strokeWidth={2} name="SIP Value" />
                      <Area type="monotone" dataKey="lumpsumValue" stroke={COLORS.lumpsum} fill="url(#vsGradLumpsum)" strokeWidth={2} name="Lumpsum Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Metric Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Invested, returns, and total value side by side</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="sip" name="SIP" fill={COLORS.sip} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lumpsum" name="Lumpsum" fill={COLORS.lumpsum} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dual Pie Charts */}
              <div className="grid sm:grid-cols-2 gap-6" data-pdf-keep-together>
                <div className="card-base p-6">
                  <h3 className="font-bold text-brand mb-1 text-sm">SIP Breakdown</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sipPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {sipPieData.map((entry, index) => (
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
                  <h3 className="font-bold text-secondary-700 mb-1 text-sm">Lumpsum Breakdown</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={lumpsumPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {lumpsumPieData.map((entry, index) => (
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

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">SIP vs Lumpsum values each year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">SIP Invested</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">SIP Value</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Lumpsum Value</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.sip.yearlyBreakdown.map((sipRow, i) => {
                        const lumpsumRow = result.lumpsum.yearlyBreakdown[i];
                        const diff = (lumpsumRow?.value || 0) - sipRow.value;
                        return (
                          <tr key={sipRow.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">Year {sipRow.year}</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(sipRow.invested)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-brand">{formatINR(sipRow.value)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-secondary-700">{formatINR(lumpsumRow?.value || 0)}</td>
                            <td className="py-3 px-6 text-right">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                diff > 0 ? 'bg-secondary-50 text-secondary-700' : 'bg-brand-50 text-brand-700'
                              )}>
                                {diff > 0 ? '+' : ''}{formatINR(diff)}
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
              {/* Insight Note */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="font-bold text-primary-700 mb-2">Important Note</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  In a consistently rising market, lumpsum investing typically outperforms SIP because all your capital
                  is deployed from Day 1. However, SIP offers rupee cost averaging during volatile markets, reducing
                  the risk of investing at a market peak. For most investors, SIP is preferred because it aligns with
                  regular income patterns and reduces timing risk.
                </p>
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
