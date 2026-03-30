'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { calculateCorrectionImpact, calculateSIPBreakdown } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  normal: '#E8553A',
  corrected: '#EF4444',
  invested: '#0F766E',
  impact: '#D4A017',
};

export default function CorrectionImpactCalculatorPage() {
  const [monthly, setMonthly] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(20);
  const [correctionYear, setCorrectionYear] = useState(5);
  const [correctionPercent, setCorrectionPercent] = useState(30);
  const [recoveryYears, setRecoveryYears] = useState(2);

  const correctedBreakdown = useMemo(
    () => calculateCorrectionImpact(monthly, returnRate, years, correctionYear, correctionPercent, recoveryYears),
    [monthly, returnRate, years, correctionYear, correctionPercent, recoveryYears]
  );

  const normalBreakdown = useMemo(
    () => calculateSIPBreakdown(monthly, returnRate, years),
    [monthly, returnRate, years]
  );

  const chartData = normalBreakdown.map((row, i) => ({
    year: `Yr ${row.year}`,
    normalValue: row.value,
    correctedValue: correctedBreakdown[i]?.value || 0,
    invested: row.invested,
    isCorrectionYear: row.year === correctionYear,
  }));

  const finalNormal = normalBreakdown[normalBreakdown.length - 1];
  const finalCorrected = correctedBreakdown[correctedBreakdown.length - 1];
  const impactAmount = finalNormal && finalCorrected ? finalNormal.value - finalCorrected.value : 0;
  const impactPercent = finalNormal && finalNormal.value > 0
    ? ((impactAmount / finalNormal.value) * 100).toFixed(1)
    : '0';

  const recoveryData = correctedBreakdown.map((row, i) => {
    const normalVal = normalBreakdown[i]?.value || 0;
    const diff = normalVal - row.value;
    return {
      year: row.year,
      gap: diff,
      gapPercent: normalVal > 0 ? ((diff / normalVal) * 100).toFixed(1) : '0',
    };
  });

  const pieData = [
    { name: 'Retained Value', value: finalCorrected?.value || 0, color: COLORS.corrected },
    { name: 'Impact of Correction', value: impactAmount, color: COLORS.impact },
  ];

  // Correction severity analysis
  const severityAnalysis = useMemo(() => {
    const percents = [10, 20, 30, 40, 50];
    return percents.map((pct) => {
      const corrected = calculateCorrectionImpact(monthly, returnRate, years, correctionYear, pct, recoveryYears);
      const finalC = corrected[corrected.length - 1];
      const impact = (finalNormal?.value || 0) - (finalC?.value || 0);
      return {
        correction: `${pct}%`,
        finalValue: finalC?.value || 0,
        impact,
        impactPct: finalNormal && finalNormal.value > 0 ? ((impact / finalNormal.value) * 100).toFixed(1) : '0',
      };
    });
  }, [monthly, returnRate, years, correctionYear, recoveryYears, finalNormal]);

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
              <Zap className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Market Correction Impact Calculator</h1>
              <p className="text-slate-300 mt-1">Simulate a market crash during your SIP tenure and see the long-term impact</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Simulation</h2>

              <div className="space-y-5">
                {/* Monthly Amount */}
                <NumberInput label="Monthly SIP Amount" value={monthly} onChange={setMonthly} prefix="₹" step={500} min={500} max={500000} />

                {/* Return Rate */}
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />

                {/* Duration */}
                <NumberInput
                  label="Total SIP Duration"
                  value={years}
                  onChange={(val) => {
                    setYears(val);
                    if (correctionYear >= val) setCorrectionYear(Math.max(1, val - 2));
                  }}
                  suffix="Years"
                  step={1}
                  min={3}
                  max={40}
                />

                {/* Divider */}
                <div className="border-t border-surface-300 pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-600">Market Correction Scenario</span>
                  </div>
                </div>

                {/* Correction Year */}
                <NumberInput label="Correction Happens In Year" value={correctionYear} onChange={setCorrectionYear} suffix="Year" step={1} min={1} max={Math.max(years - 1, 1)} />

                {/* Correction Percent */}
                <NumberInput label="Correction Magnitude" value={correctionPercent} onChange={setCorrectionPercent} suffix="%" step={5} min={5} max={70} />

                {/* Recovery Years */}
                <NumberInput label="Recovery Period" value={recoveryYears} onChange={setRecoveryYears} suffix="Years" step={1} min={1} max={10} />
              </div>

              {/* Impact Summary */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-50 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Without Crash</div>
                    <div className="text-sm font-bold text-positive">{formatINR(finalNormal?.value || 0)}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">With Crash</div>
                    <div className="text-sm font-bold text-red-600">{formatINR(finalCorrected?.value || 0)}</div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Long-Term Impact</div>
                  <div className="text-xl font-extrabold text-amber-700">{formatINR(impactAmount)}</div>
                  <div className="text-xs text-amber-600 mt-1">{impactPercent}% lower than no-crash scenario</div>
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* Normal vs Corrected Chart */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">Normal vs Corrected Portfolio</h3>
                  <DownloadPDFButton elementId="calculator-results" title="Market Correction Impact Calculator" fileName="correction-impact-calculator" />
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  {correctionPercent}% correction in Year {correctionYear} with {recoveryYears}-year recovery
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="corrGradNormal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.normal} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.normal} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="corrGradCorrected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.corrected} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.corrected} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'normalValue' ? 'Normal Portfolio' : name === 'correctedValue' ? 'After Correction' : 'Invested',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="Invested" />
                      <Area type="monotone" dataKey="normalValue" stroke={COLORS.normal} fill="url(#corrGradNormal)" strokeWidth={2} name="Normal Portfolio" />
                      <Area type="monotone" dataKey="correctedValue" stroke={COLORS.corrected} fill="url(#corrGradCorrected)" strokeWidth={2} name="After Correction" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Impact Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Final Value Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">Retained value vs impact of the correction</p>
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

              {/* Severity Analysis */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Correction Severity Analysis</h3>
                <p className="text-sm text-slate-500 mb-4">Impact at different correction magnitudes (in Year {correctionYear})</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Correction</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Final Value</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Impact</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">% Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {severityAnalysis.map((row) => (
                        <tr key={row.correction} className={cn(
                          'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                          row.correction === `${correctionPercent}%` && 'bg-amber-50/50'
                        )}>
                          <td className="py-3 px-4 font-medium text-red-600">{row.correction} drop</td>
                          <td className="py-3 px-4 text-right font-semibold text-primary-700">{formatINR(row.finalValue)}</td>
                          <td className="py-3 px-4 text-right text-amber-600 font-medium">-{formatINR(row.impact)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              Number(row.impactPct) > 20 ? 'bg-red-50 text-red-700' :
                              Number(row.impactPct) > 10 ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              -{row.impactPct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insight */}
              <div className="card-base p-6 bg-gradient-to-r from-teal-50 to-teal-50/50">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-positive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-primary-700 mb-2">SIP Advantage During Corrections</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      When markets fall, SIP investors actually benefit by buying more units at lower prices (rupee cost averaging).
                      While the short-term portfolio value drops, the lower NAV means your future SIPs accumulate more units.
                      Over the long term, SIP investors who stay disciplined during corrections often outperform
                      those who stop their SIPs in panic. The key is to continue investing and let compounding do its work.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">Normal vs corrected portfolio each year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Normal</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">With Correction</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalBreakdown.map((row, i) => {
                        const corrRow = correctedBreakdown[i];
                        const gap = row.value - (corrRow?.value || 0);
                        const isCorrYear = row.year === correctionYear;
                        return (
                          <tr key={row.year} className={cn(
                            'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                            isCorrYear && 'bg-red-50/50'
                          )}>
                            <td className="py-3 px-6 font-medium text-primary-700">
                              Year {row.year}
                              {isCorrYear && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                  CRASH
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-positive">{formatINR(row.value)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-red-600">{formatINR(corrRow?.value || 0)}</td>
                            <td className="py-3 px-6 text-right">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                gap > 0 ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
                              )}>
                                {gap > 0 ? '-' : '+'}{formatINR(Math.abs(gap))}
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
