'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, IndianRupee, Percent, TrendingUp, AlertTriangle, Calendar, Timer } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const DELAY_COLORS = ['#059669', '#2563EB', '#D97706', '#E8553A', '#DC2626'];
const DELAY_PRESETS = [0, 1, 3, 5, 10];

export default function DelayCostCalculatorPage() {
  const [sipAmount, setSipAmount] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [horizon, setHorizon] = useState(25);
  const [delayPeriod, setDelayPeriod] = useState(5);

  const monthlyRate = returnRate / 12 / 100;

  // Calculate all 5 delay scenarios
  const scenarios = useMemo(() => {
    const results = DELAY_PRESETS.map((delay) => {
      const effectiveYears = Math.max(0, horizon - delay);
      const months = effectiveYears * 12;
      const fv =
        monthlyRate > 0 && months > 0
          ? sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
          : sipAmount * months;
      const totalInvested = sipAmount * months;
      const wealthGained = fv - totalInvested;
      return { delay, effectiveYears, fv, totalInvested, wealthGained, costOfDelay: 0 };
    });

    // Calculate cost of delay vs no-delay scenario
    const noDelayFV = results[0].fv;
    results.forEach((s) => {
      s.costOfDelay = noDelayFV - s.fv;
    });

    return results;
  }, [sipAmount, horizon, monthlyRate]);

  // Find the selected delay scenario
  const selectedScenario = useMemo(
    () => scenarios.find((s) => s.delay === delayPeriod) || scenarios[0],
    [scenarios, delayPeriod]
  );

  const noDelayScenario = scenarios[0];

  // Year-by-year growth for all scenarios (area chart)
  const yearlyData = useMemo(() => {
    const data = [];
    for (let year = 0; year <= horizon; year++) {
      const entry: Record<string, number> = { year };
      DELAY_PRESETS.forEach((delay) => {
        const activeYears = Math.max(0, year - delay);
        const months = activeYears * 12;
        const value =
          monthlyRate > 0 && months > 0
            ? sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
            : sipAmount * months;
        entry[`delay${delay}`] = value;
      });
      data.push(entry);
    }
    return data;
  }, [sipAmount, monthlyRate, horizon]);

  // Bar chart data for final corpus comparison
  const barData = useMemo(
    () =>
      scenarios.map((s, i) => ({
        name: s.delay === 0 ? 'No Delay' : `${s.delay}yr Delay`,
        corpus: s.fv,
        fill: DELAY_COLORS[i],
      })),
    [scenarios]
  );

  // Cost per day of delay and required catch-up SIP
  const costPerDay = useMemo(() => {
    if (selectedScenario.delay === 0) return 0;
    return selectedScenario.costOfDelay / (selectedScenario.delay * 365);
  }, [selectedScenario]);

  const requiredCatchUpSIP = useMemo(() => {
    if (selectedScenario.delay === 0 || selectedScenario.effectiveYears <= 0) return 0;
    const targetFV = noDelayScenario.fv;
    const months = selectedScenario.effectiveYears * 12;
    if (monthlyRate <= 0 || months <= 0) return 0;
    // Reverse-engineer: FV = P * ((1+r)^n - 1) / r * (1+r)  =>  P = FV / (((1+r)^n - 1) / r * (1+r))
    const factor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return factor > 0 ? targetFV / factor : 0;
  }, [selectedScenario, noDelayScenario, monthlyRate]);

  const costPerYearOfDelay = useMemo(() => {
    if (scenarios.length < 2) return 0;
    // Use 1-year delay cost as the per-year benchmark
    const oneYearScenario = scenarios.find((s) => s.delay === 1);
    return oneYearScenario ? oneYearScenario.costOfDelay : 0;
  }, [scenarios]);

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
              <Clock className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Cost of Delay Calculator</h1>
              <p className="text-slate-300 mt-1">
                See how procrastination destroys wealth through lost compounding
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Left: Inputs & Output Cards ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Your SIP</h2>

              <div className="space-y-6">
                <NumberInput
                  label="Monthly SIP Amount"
                  value={sipAmount}
                  onChange={setSipAmount}
                  prefix="₹"
                  step={500}
                  min={500}
                  max={1000000}
                />
                <NumberInput
                  label="Expected Annual Return"
                  value={returnRate}
                  onChange={setReturnRate}
                  suffix="%"
                  step={0.5}
                  min={5}
                  max={20}
                />
                <NumberInput
                  label="Investment Horizon"
                  value={horizon}
                  onChange={setHorizon}
                  suffix="yrs"
                  step={1}
                  min={5}
                  max={40}
                />
                <NumberInput
                  label="Delay Period"
                  value={delayPeriod}
                  onChange={setDelayPeriod}
                  suffix="yrs"
                  step={1}
                  min={1}
                  max={20}
                  hint="How many years you delay starting your SIP"
                />
              </div>

              {/* Delay Comparison Toggle */}
              <div className="mt-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                  Quick Delay Scenarios
                </label>
                <div className="flex flex-wrap gap-2">
                  {DELAY_PRESETS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDelayPeriod(d === 0 ? 1 : d)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                        delayPeriod === d || (d === 0 && delayPeriod === 0)
                          ? 'text-white shadow-md'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-slate-400'
                      )}
                      style={
                        delayPeriod === d || (d === 0 && delayPeriod === 0)
                          ? { backgroundColor: DELAY_COLORS[i], borderColor: DELAY_COLORS[i] }
                          : undefined
                      }
                    >
                      {d === 0 ? 'No Delay' : `${d} Year${d > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Cards */}
              <div className="mt-8 space-y-3">
                {/* Corpus (No Delay) */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Corpus (No Delay)
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {formatINR(noDelayScenario.fv)}
                  </div>
                </div>

                {/* Corpus (With Delay) */}
                <div className="bg-surface-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Timer className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Corpus ({selectedScenario.delay}yr Delay)
                    </span>
                  </div>
                  <div className="text-xl font-bold text-primary-700">
                    {formatINR(selectedScenario.fv)}
                  </div>
                </div>

                {/* Cost of Delay */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-[10px] text-red-600 uppercase tracking-wider font-medium">
                      Cost of Delay
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-red-600">
                    {formatINR(selectedScenario.costOfDelay)}
                  </div>
                </div>

                {/* Invested amounts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Invested (No Delay)
                    </div>
                    <div className="text-sm font-bold text-primary-700">
                      {formatINR(noDelayScenario.totalInvested)}
                    </div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Invested ({selectedScenario.delay}yr Delay)
                    </div>
                    <div className="text-sm font-bold text-primary-700">
                      {formatINR(selectedScenario.totalInvested)}
                    </div>
                  </div>
                </div>

                {/* Key insight */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                  <div className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">
                    Each Year of Delay Costs You
                  </div>
                  <div className="text-xl font-extrabold text-amber-700 mt-1">
                    {formatINR(costPerYearOfDelay)}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Charts & Tables ── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="Cost of Delay Calculator"
                  fileName="cost-of-delay-calculator"
                />
              </div>

              {/* ── Chart 1: Area Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Portfolio Growth by Delay Scenario</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How delaying your SIP by 1, 3, 5, or 10 years impacts long-term wealth
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {DELAY_PRESETS.map((d, i) => (
                    <div key={d} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DELAY_COLORS[i] }}
                      />
                      <span className="text-xs text-slate-600">
                        {d === 0 ? 'No Delay' : `${d}yr Delay`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={yearlyData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        {DELAY_PRESETS.map((d, i) => (
                          <linearGradient
                            key={d}
                            id={`gradDelay${d}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor={DELAY_COLORS[i]} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={DELAY_COLORS[i]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        tickFormatter={(v: number) => `Yr ${v}`}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            delay0: 'No Delay',
                            delay1: '1yr Delay',
                            delay3: '3yr Delay',
                            delay5: '5yr Delay',
                            delay10: '10yr Delay',
                          };
                          return [formatINR(value), labels[name] || name];
                        }}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      {DELAY_PRESETS.map((d, i) => (
                        <Area
                          key={d}
                          type="monotone"
                          dataKey={`delay${d}`}
                          stroke={DELAY_COLORS[i]}
                          fill={`url(#gradDelay${d})`}
                          strokeWidth={d === 0 ? 2.5 : 1.5}
                          name={`delay${d}`}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Chart 2: Bar Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Final Corpus Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Final portfolio value for each delay scenario after {horizon} years
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Final Corpus']}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="corpus" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Cost of Delay Table ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Cost of Delay Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    How each year of delay impacts your wealth at {returnRate}% annual return
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Delay
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Years Invested
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Total Invested
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Final Corpus
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Cost of Delay
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Cost / Day
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarios.map((s, i) => {
                        const perDay = s.delay > 0 ? s.costOfDelay / (s.delay * 365) : 0;
                        return (
                          <tr
                            key={s.delay}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              s.delay === 0 && 'bg-emerald-50/40'
                            )}
                          >
                            <td className="py-3 px-3 font-medium text-primary-700">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: DELAY_COLORS[i] }}
                                />
                                {s.delay === 0 ? 'No Delay' : `${s.delay} Year${s.delay > 1 ? 's' : ''}`}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {s.effectiveYears} yrs
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {formatINR(s.totalInvested)}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-primary-700">
                              {formatINR(s.fv)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {s.delay === 0 ? (
                                <span className="text-emerald-600 font-medium">&mdash;</span>
                              ) : (
                                <span className="font-semibold text-red-600">
                                  {formatINR(s.costOfDelay)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {s.delay === 0 ? (
                                <span className="text-emerald-600 font-medium">&mdash;</span>
                              ) : (
                                <span className="text-red-500 text-xs font-medium">
                                  {formatINR(perDay)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Shock Value Card ── */}
              {selectedScenario.delay > 0 && (
                <div
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
                  data-pdf-keep-together
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-red-700">
                          Delaying by {selectedScenario.delay} year
                          {selectedScenario.delay > 1 ? 's' : ''} costs you
                        </div>
                        <div className="text-3xl font-extrabold text-red-600 mt-1">
                          {formatINR(selectedScenario.costOfDelay)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="bg-white/60 rounded-lg px-4 py-2.5">
                          <div className="text-[10px] text-red-600 uppercase tracking-wider font-medium">
                            Cost Per Day of Delay
                          </div>
                          <div className="text-lg font-extrabold text-red-600">
                            {formatINR(costPerDay)}
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-lg px-4 py-2.5">
                          <div className="text-[10px] text-red-600 uppercase tracking-wider font-medium">
                            SIP Needed to Catch Up
                          </div>
                          <div className="text-lg font-extrabold text-red-600">
                            {formatINR(requiredCatchUpSIP)}
                            <span className="text-xs font-medium text-red-500">/mo</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-red-500">
                        To achieve the same corpus of {formatINR(noDelayScenario.fv)} in{' '}
                        {selectedScenario.effectiveYears} years, you would need to invest{' '}
                        {formatINR(requiredCatchUpSIP)}/month instead of {formatINR(sipAmount)}
                        /month &mdash; that&apos;s{' '}
                        {sipAmount > 0
                          ? `${((requiredCatchUpSIP / sipAmount - 1) * 100).toFixed(0)}% more`
                          : 'significantly more'}
                        !
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
