'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  GraduationCap,
  Info,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  BookOpen,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { calculateEducationCorpus } from '@/lib/utils/financial-engine';
import { EDUCATION_COSTS } from '@/lib/constants/financial-constants';
import { formatINR, formatLakhsCrores } from '@/lib/utils/formatters';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';

// Determine if a course is postgraduate based on its key/label
function isPostGraduate(key: string): boolean {
  const pgKeys = ['iim_mba', 'private_mba', 'ms_usa', 'mba_usa', 'ms_uk', 'masters_australia', 'masters_canada'];
  return pgKeys.includes(key);
}

// Determine if a course is abroad
function isAbroad(key: string): boolean {
  const entry = EDUCATION_COSTS[key];
  return entry ? entry.country !== 'India' : false;
}

// Group education costs by country for the dropdown
function getGroupedEducationCosts(): { india: { key: string; label: string; cost: number; duration: string }[]; abroad: { key: string; label: string; cost: number; duration: string }[] } {
  const india: { key: string; label: string; cost: number; duration: string }[] = [];
  const abroad: { key: string; label: string; cost: number; duration: string }[] = [];

  Object.entries(EDUCATION_COSTS).forEach(([key, val]) => {
    const entry = { key, label: val.label, cost: val.cost, duration: val.duration };
    if (val.country === 'India') {
      india.push(entry);
    } else {
      abroad.push(entry);
    }
  });

  return { india, abroad };
}

export default function ChildEducationPlannerPage() {
  const grouped = useMemo(() => getGroupedEducationCosts(), []);

  // State
  const [childAge, setChildAge] = useState(5);
  const [selectedEducationType, setSelectedEducationType] = useState('iit_btech');
  const [targetEducationAge, setTargetEducationAge] = useState(18);
  const [currentCost, setCurrentCost] = useState(1000000);
  const [educationInflation, setEducationInflation] = useState(8);
  const [existingSavings, setExistingSavings] = useState(0);
  const [expectedReturn, setExpectedReturn] = useState(12);

  // Handle education type change
  const handleEducationTypeChange = (key: string) => {
    setSelectedEducationType(key);
    const entry = EDUCATION_COSTS[key];
    if (entry) {
      setCurrentCost(entry.cost);
      setTargetEducationAge(isPostGraduate(key) ? 22 : 18);
      setEducationInflation(isAbroad(key) ? 4 : 8);
    }
  };

  // Selected education label
  const selectedEducationLabel = EDUCATION_COSTS[selectedEducationType]?.label || 'Education';

  // Main calculation
  const result = useMemo(() => {
    return calculateEducationCorpus({
      childAge,
      targetEducationAge,
      currentCost,
      educationInflation,
      existingSavings,
      expectedReturn,
    });
  }, [childAge, targetEducationAge, currentCost, educationInflation, existingSavings, expectedReturn]);

  // Chart data: year-by-year SIP growth towards target
  const chartData = useMemo(() => {
    const yearsToGoal = Math.max(1, targetEducationAge - childAge);
    const monthlyRate = expectedReturn / 100 / 12;
    const monthlySIP = result.requiredMonthlySIP;
    const data: { year: string; sipValue: number; target: number; invested: number }[] = [];

    for (let y = 0; y <= yearsToGoal; y++) {
      const months = y * 12;
      const savingsGrowth = existingSavings * Math.pow(1 + monthlyRate, months);
      const sipGrowth =
        monthlySIP > 0 && months > 0
          ? monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
          : 0;
      data.push({
        year: `Year ${y}`,
        sipValue: Math.round(savingsGrowth + sipGrowth),
        target: result.futureCost,
        invested: Math.round(existingSavings + monthlySIP * months),
      });
    }

    return data;
  }, [childAge, targetEducationAge, existingSavings, expectedReturn, result.requiredMonthlySIP, result.futureCost]);

  // Delay impact calculation: if delayed by 2 years, how much more monthly SIP?
  const delayImpact = useMemo(() => {
    const delayYears = 2;
    const delayedResult = calculateEducationCorpus({
      childAge: childAge + delayYears,
      targetEducationAge,
      currentCost,
      educationInflation,
      existingSavings,
      expectedReturn,
    });

    const currentSIP = result.requiredMonthlySIP;
    const delayedSIP = delayedResult.requiredMonthlySIP;
    const increasePercent = currentSIP > 0 ? ((delayedSIP - currentSIP) / currentSIP) * 100 : 0;

    return {
      delayedSIP,
      increasePercent: Math.round(increasePercent),
      delayedFutureCost: delayedResult.futureCost,
    };
  }, [childAge, targetEducationAge, currentCost, educationInflation, existingSavings, expectedReturn, result.requiredMonthlySIP]);

  // Education cost comparison table data
  const comparisonData = useMemo(() => {
    const yearsToGoal = Math.max(1, targetEducationAge - childAge);
    return Object.entries(EDUCATION_COSTS).slice(0, 8).map(([key, val]) => {
      const inflation = val.country === 'India' ? 8 : 4;
      const projectedCost = val.cost * Math.pow(1 + inflation / 100, yearsToGoal);
      return {
        key,
        label: val.label,
        country: val.country,
        duration: val.duration,
        currentCost: val.cost,
        projectedCost: Math.round(projectedCost),
      };
    });
  }, [childAge, targetEducationAge]);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <Link href="/calculators" className="transition hover:text-white">Calculators</Link>
            <ChevronRight size={14} />
            <span className="text-white">Education Planner</span>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <GraduationCap size={20} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-extrabold lg:text-4xl">Child Education Planner</h1>
          </div>
          <p className="max-w-xl text-gray-400">
            Plan your child&apos;s future education costs with inflation-adjusted projections
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              <h2 className="text-lg font-bold text-gray-900">Plan Parameters</h2>

              {/* Education Type Selector */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Education Type</label>
                <select
                  value={selectedEducationType}
                  onChange={(e) => handleEducationTypeChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <optgroup label="India">
                    {grouped.india.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label} ({item.duration})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Abroad">
                    {grouped.abroad.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label} ({item.duration})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Child's Current Age */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Child&apos;s Current Age</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(Math.max(0, Math.min(17, Number(e.target.value))))}
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={17}
                  step={1}
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>0 Yrs</span>
                  <span>17 Yrs</span>
                </div>
              </div>

              {/* Target Education Age */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Target Education Age</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={targetEducationAge}
                      onChange={(e) => setTargetEducationAge(Math.max(16, Math.min(25, Number(e.target.value))))}
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={16}
                  max={25}
                  step={1}
                  value={targetEducationAge}
                  onChange={(e) => setTargetEducationAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>16 Yrs</span>
                  <span>25 Yrs</span>
                </div>
              </div>

              {/* Current Cost of Education */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Current Cost of Education</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">₹</span>
                    <input
                      type="number"
                      value={currentCost}
                      onChange={(e) => setCurrentCost(Math.max(100000, Math.min(10000000, Number(e.target.value))))}
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={10000000}
                  step={50000}
                  value={currentCost}
                  onChange={(e) => setCurrentCost(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>₹1 L</span>
                  <span>₹1 Cr</span>
                </div>
              </div>

              {/* Education Inflation Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Education Inflation Rate</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={educationInflation}
                      onChange={(e) => setEducationInflation(Math.max(2, Math.min(15, Number(e.target.value))))}
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.5}
                  value={educationInflation}
                  onChange={(e) => setEducationInflation(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>2%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Existing Savings */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Existing Savings for this Goal</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">₹</span>
                    <input
                      type="number"
                      value={existingSavings}
                      onChange={(e) => setExistingSavings(Math.max(0, Math.min(10000000, Number(e.target.value))))}
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000000}
                  step={10000}
                  value={existingSavings}
                  onChange={(e) => setExistingSavings(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>₹0</span>
                  <span>₹1 Cr</span>
                </div>
              </div>

              {/* Expected Return */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Expected Return on Investments</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(Math.max(6, Math.min(18, Number(e.target.value))))}
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={6}
                  max={18}
                  step={0.5}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>6%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Future Cost</span>
                  <span className="text-lg font-extrabold text-amber-600">
                    {formatLakhsCrores(result.futureCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current Savings Will Grow To</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatLakhsCrores(result.futureValueOfSavings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Gap to Fill</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatLakhsCrores(result.gap)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">Required Monthly SIP</span>
                    <span className="text-xl font-extrabold text-primary-500">
                      {formatINR(result.requiredMonthlySIP)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/mutual-funds"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Start Education SIP <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Panel - Charts & Info */}
          <div className="space-y-6 lg:col-span-3">
            {/* Big Gradient Card - Future Cost */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] p-6 text-white lg:p-8">
              <div className="mb-1 flex items-center gap-2">
                <GraduationCap size={18} className="text-amber-400" />
                <p className="text-sm text-gray-400">
                  Future Cost of {selectedEducationLabel}
                </p>
              </div>
              <p className="mb-4 text-4xl font-extrabold text-amber-400">
                {formatLakhsCrores(result.futureCost)}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Current Cost</p>
                  <p className="text-sm font-bold">{formatLakhsCrores(result.currentCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Years to Goal</p>
                  <p className="text-sm font-bold">{result.yearsToGoal} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Inflation Rate</p>
                  <p className="text-sm font-bold">{educationInflation}% p.a.</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <TrendingUp size={14} className="text-amber-400" />
                <p className="text-xs text-gray-300">
                  Education costs will increase by{' '}
                  <span className="font-bold text-amber-400">
                    {((result.futureCost / result.currentCost - 1) * 100).toFixed(0)}%
                  </span>{' '}
                  over {result.yearsToGoal} years due to inflation
                </p>
              </div>
            </div>

            {/* SIP Growth Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">SIP Growth Towards Target</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="eduSipGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="eduInvestedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052CC" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) =>
                        val >= 10000000
                          ? `₹${(val / 10000000).toFixed(1)}Cr`
                          : val >= 100000
                            ? `₹${(val / 100000).toFixed(0)}L`
                            : `₹${(val / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                      formatter={(value: number, name: string) => [
                        formatINR(value),
                        name === 'sipValue' ? 'Portfolio Value' : name === 'invested' ? 'Total Invested' : 'Target',
                      ]}
                      labelFormatter={(label) => String(label)}
                    />
                    <ReferenceLine
                      y={result.futureCost}
                      stroke="#F59E0B"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{ value: `Target: ${formatLakhsCrores(result.futureCost)}`, fill: '#F59E0B', fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sipValue"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#eduSipGrad)"
                      name="sipValue"
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="#0052CC"
                      strokeWidth={1.5}
                      fill="url(#eduInvestedGrad)"
                      name="invested"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delay Impact Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="mb-1 font-bold text-gray-900">Delay Impact Analysis</h4>
                  <p className="text-sm leading-relaxed text-gray-600">
                    If you delay starting by <span className="font-bold">2 years</span>, your required monthly SIP increases from{' '}
                    <span className="font-bold text-primary-600">{formatINR(result.requiredMonthlySIP)}</span> to{' '}
                    <span className="font-bold text-amber-700">{formatINR(delayImpact.delayedSIP)}</span>
                    {delayImpact.increasePercent > 0 && (
                      <> — that&apos;s a <span className="font-extrabold text-red-600">{delayImpact.increasePercent}% increase</span></>
                    )}
                    .
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Start Now</p>
                      <p className="text-lg font-extrabold text-primary-600">{formatINR(result.requiredMonthlySIP)}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Start 2 Years Later</p>
                      <p className="text-lg font-extrabold text-amber-700">{formatINR(delayImpact.delayedSIP)}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Education Cost Comparison Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Education Cost Comparison</h3>
              <p className="mb-4 text-sm text-gray-500">
                Projected costs when your child reaches education age ({result.yearsToGoal} years from now)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">Course</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-400">Duration</th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">Current Cost</th>
                      <th className="pl-4 py-2 text-right text-xs font-bold uppercase text-gray-400">Projected Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row) => (
                      <tr
                        key={row.key}
                        className={`border-b border-gray-50 last:border-0 ${row.key === selectedEducationType ? 'bg-primary-50' : ''}`}
                      >
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            {row.country === 'India' ? (
                              <BookOpen size={14} className="flex-shrink-0 text-blue-500" />
                            ) : (
                              <Globe size={14} className="flex-shrink-0 text-emerald-500" />
                            )}
                            <span className={`font-semibold ${row.key === selectedEducationType ? 'text-primary-600' : 'text-gray-900'}`}>
                              {row.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{row.duration}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatLakhsCrores(row.currentCost)}</td>
                        <td className="pl-4 py-2.5 text-right font-bold text-gray-900">{formatLakhsCrores(row.projectedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Box - Children's Mutual Funds */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="mt-0.5 flex-shrink-0 text-primary-500" />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">Smart Ways to Save for Education</h4>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    Investing early through equity mutual funds can help you build a substantial corpus for your child&apos;s education. Here are some popular options:
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span><strong>Children&apos;s Gift Funds</strong> — Dedicated mutual funds with a lock-in designed for children&apos;s future needs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span><strong>ELSS (Tax Saving) Funds</strong> — Save tax under Section 80C while building an education corpus with 3-year lock-in</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span><strong>Flexi Cap / Index Funds</strong> — For long-term goals (10+ years), equity funds offer inflation-beating returns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span><strong>Sukanya Samriddhi Yojana</strong> — Government-backed scheme for girls with attractive interest rates and tax benefits</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    Start early to benefit from the power of compounding. Even a small monthly SIP can grow substantially over 10-15 years.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <h4 className="mb-1 font-bold text-gray-900">Important Note</h4>
                  <p className="text-sm leading-relaxed text-gray-600">
                    This calculator provides estimates based on assumed inflation and return rates. Actual education costs may vary based on institution, course, and economic conditions. Education inflation in India has historically been higher than general inflation. Review and adjust your plan annually.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-bold">Ready to Start Your Education SIP?</h3>
                  <p className="text-sm text-primary-100">
                    Begin with just {formatINR(result.requiredMonthlySIP)}/month to secure your child&apos;s future
                  </p>
                </div>
                <Link
                  href="/mutual-funds"
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-600 transition hover:bg-primary-50"
                >
                  Start Education SIP <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
