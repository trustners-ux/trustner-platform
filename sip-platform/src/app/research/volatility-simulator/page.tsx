'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, TrendingDown, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { calculateSIPBreakdown, calculateCorrectionImpact } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

export default function VolatilitySimulatorPage() {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(20);
  const [crashYear, setCrashYear] = useState(5);
  const [crashPercent, setCrashPercent] = useState(30);
  const [recoveryYears, setRecoveryYears] = useState(2);

  const normalSIP = useMemo(() => calculateSIPBreakdown(monthly, rate, years), [monthly, rate, years]);
  const crashedSIP = useMemo(
    () => calculateCorrectionImpact(monthly, rate, years, crashYear, crashPercent, recoveryYears),
    [monthly, rate, years, crashYear, crashPercent, recoveryYears]
  );

  const chartData = normalSIP.map((n, i) => ({
    year: `Yr ${n.year}`,
    yearNum: n.year,
    normal: n.value,
    crashed: crashedSIP[i]?.value || 0,
    invested: n.invested,
  }));

  const finalNormal = normalSIP[normalSIP.length - 1];
  const finalCrashed = crashedSIP[crashedSIP.length - 1];
  const impactAmount = finalNormal.value - finalCrashed.value;
  const impactPercent = ((impactAmount / finalNormal.value) * 100).toFixed(1);
  const recoveryGap = impactAmount;

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold">Market Volatility Simulator</h1>
              <p className="text-rose-100 text-sm">Simulate market crashes and see their impact on your SIP</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-1">
              <div className="card-base p-6 sticky top-20">
                <h2 className="font-bold text-primary-700 mb-5 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  Simulation Controls
                </h2>

                {/* SIP Inputs */}
                <div className="space-y-4 mb-6 pb-6 border-b border-surface-200">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SIP Setup</h3>
                  <NumberInput label="Monthly SIP" value={monthly} onChange={setMonthly} prefix="₹" step={1000} min={1000} max={200000} />
                  <NumberInput label="Expected Return" value={rate} onChange={setRate} suffix="% p.a." step={0.5} min={6} max={20} />
                  <NumberInput label="Total Duration" value={years} onChange={setYears} suffix="Years" step={1} min={5} max={30} />
                </div>

                {/* Crash Inputs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Market Crash Settings
                  </h3>
                  <NumberInput label="Crash Occurs in Year" value={crashYear} onChange={setCrashYear} suffix="Year" step={1} min={1} max={years - 1} />
                  <NumberInput label="Crash Severity" value={crashPercent} onChange={setCrashPercent} suffix="%" step={5} min={5} max={60} />
                  <NumberInput label="Recovery Period" value={recoveryYears} onChange={setRecoveryYears} suffix="Years" step={1} min={1} max={5} />
                </div>

                {/* Preset Scenarios */}
                <div className="mt-6 pt-4 border-t border-surface-200">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</h3>
                  <div className="space-y-2">
                    {[
                      { label: '2008 Global Crisis', crash: 50, year: 3, recovery: 3 },
                      { label: '2020 COVID Crash', crash: 35, year: 5, recovery: 1 },
                      { label: 'Mild Correction', crash: 15, year: 4, recovery: 1 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => { setCrashPercent(preset.crash); setCrashYear(Math.min(preset.year, years - 1)); setRecoveryYears(preset.recovery); }}
                        className="w-full text-left px-3 py-2 text-xs bg-surface-100 hover:bg-surface-200 rounded-md transition-colors"
                      >
                        <span className="font-medium text-primary-700">{preset.label}</span>
                        <span className="text-slate-400 ml-1">(-{preset.crash}%)</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Impact Summary */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-base p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-positive" />
                      <span className="text-xs text-slate-500">Normal SIP Value</span>
                    </div>
                    <DownloadPDFButton elementId="calculator-results" title="Volatility Simulator" fileName="volatility-simulator" />
                  </div>
                  <div className="text-xl font-bold text-positive">{formatINR(finalNormal.value)}</div>
                  <div className="text-xs text-slate-400 mt-1">Without any market crash</div>
                </div>
                <div className="card-base p-5 border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-slate-500">After Crash Impact</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatINR(finalCrashed.value)}</div>
                  <div className="text-xs text-slate-400 mt-1">With {crashPercent}% crash in Year {crashYear}</div>
                </div>
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-500">Wealth Impact</span>
                  </div>
                  <div className="text-xl font-bold text-amber-600">-{impactPercent}%</div>
                  <div className="text-xs text-slate-400 mt-1">Gap: {formatINR(recoveryGap)}</div>
                </div>
              </div>

              {/* Chart */}
              <div className="card-base p-6">
                <h3 className="font-bold text-primary-700 mb-4">Portfolio Growth: Normal vs Crash Scenario</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8553A" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#E8553A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name === 'normal' ? 'Normal SIP' : name === 'crashed' ? 'After Crash' : 'Invested']}
                        labelStyle={{ fontWeight: 'bold' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                      />
                      <Legend />
                      <ReferenceLine x={`Yr ${crashYear}`} stroke="#DC2626" strokeDasharray="5 5" label={{ value: 'Crash', position: 'top', fill: '#DC2626', fontSize: 11 }} />
                      <Area type="monotone" dataKey="invested" name="Invested" stroke="#94a3b8" fill="url(#investGrad)" strokeWidth={1.5} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="normal" name="Normal SIP" stroke="#E8553A" fill="url(#normalGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="crashed" name="After Crash" stroke="#DC2626" fill="url(#crashGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Insight */}
              <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary-700 text-sm mb-1">Key Insight</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {impactPercent && parseFloat(impactPercent) < 20
                      ? `Even with a ${crashPercent}% market crash in Year ${crashYear}, your SIP portfolio recovers significantly over ${years} years. The long-term impact is only ${impactPercent}%, demonstrating SIP's resilience through market cycles.`
                      : `A ${crashPercent}% crash in Year ${crashYear} has a ${impactPercent}% impact on your final corpus. However, SIP investors who continue investing through the crash accumulate more units at lower prices, accelerating recovery.`}
                    {' '}The most important action during a crash is to continue your SIP — never stop.
                  </p>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-4 border-b border-surface-200">
                  <h3 className="font-bold text-primary-700 text-sm">Year-by-Year Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Year</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Invested</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-positive">Normal Value</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-red-500">Crash Value</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalSIP.map((n, i) => {
                        const c = crashedSIP[i];
                        const diff = n.value - (c?.value || 0);
                        const isCrashYear = n.year === crashYear;
                        return (
                          <tr key={n.year} className={isCrashYear ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                            <td className="px-4 py-2.5 font-medium text-primary-700">
                              {n.year} {isCrashYear && <span className="text-red-500 text-xs ml-1">CRASH</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{formatINR(n.invested)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-positive">{formatINR(n.value)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-red-600">{formatINR(c?.value || 0)}</td>
                            <td className="px-4 py-2.5 text-right text-amber-600">-{formatINR(diff)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-surface-200 rounded-lg p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  This simulator is for educational purposes only. Actual market crashes are complex events with variable recovery patterns.
                  The simulation uses simplified models. Real-world outcomes may differ significantly. Past performance does not guarantee future returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
