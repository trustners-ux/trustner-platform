'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  HeartPulse,
  ArrowRight,
  Info,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { calculateHealthInsuranceNeed } from '@/lib/utils/financial-engine';
import { formatINR, formatLakhsCrores } from '@/lib/utils/formatters';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';

type CityTier = 'metro' | 'tier1' | 'tier2' | 'tier3';

const CITY_OPTIONS: { value: CityTier; label: string; examples: string }[] = [
  { value: 'metro', label: 'Metro', examples: 'Mumbai, Delhi, Bangalore' },
  { value: 'tier1', label: 'Tier 1', examples: 'Pune, Ahmedabad, Jaipur' },
  { value: 'tier2', label: 'Tier 2', examples: 'Indore, Bhopal, Guwahati' },
  { value: 'tier3', label: 'Tier 3', examples: 'Smaller towns' },
];

const MEDICAL_COST_TABLE = [
  {
    procedure: 'Heart Bypass Surgery',
    metro: 500000,
    tier1: 400000,
    tier2: 330000,
  },
  {
    procedure: 'Cancer Treatment (1yr)',
    metro: 2000000,
    tier1: 1600000,
    tier2: 1300000,
  },
  {
    procedure: 'Knee Replacement',
    metro: 400000,
    tier1: 320000,
    tier2: 260000,
  },
  {
    procedure: 'Angioplasty',
    metro: 350000,
    tier1: 280000,
    tier2: 220000,
  },
  {
    procedure: 'C-Section Delivery',
    metro: 150000,
    tier1: 100000,
    tier2: 75000,
  },
];

export default function HealthInsuranceCalculatorPage() {
  // Input state
  const [age, setAge] = useState(35);
  const [city, setCity] = useState<CityTier>('metro');
  const [familySize, setFamilySize] = useState(3);
  const [preExistingConditions, setPreExistingConditions] = useState(false);
  const [currentCover, setCurrentCover] = useState(500000);
  const [hasCorporateCover, setHasCorporateCover] = useState(false);
  const [corporateCoverAmount, setCorporateCoverAmount] = useState(300000);

  // Calculate result
  const result = useMemo(() => {
    return calculateHealthInsuranceNeed({
      age,
      city,
      familySize,
      preExistingConditions,
      currentCover,
      hasCorporateCover,
      corporateCoverAmount,
    });
  }, [age, city, familySize, preExistingConditions, currentCover, hasCorporateCover, corporateCoverAmount]);

  const hasGap = result.gap > 0;

  // Data for horizontal bar chart
  const gapChartData = [
    {
      name: 'Current Cover',
      value: result.currentCover,
      fill: '#3B82F6',
    },
    {
      name: 'Recommended',
      value: result.recommendedCover,
      fill: '#10B981',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/calculators" className="transition hover:text-white">
              Calculators
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">Health Insurance</span>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
              <HeartPulse size={20} className="text-rose-400" />
            </div>
            <h1 className="text-3xl font-extrabold lg:text-4xl">
              Health Insurance Adequacy Calculator
            </h1>
          </div>
          <p className="max-w-2xl text-gray-400">
            Check if your health insurance cover is adequate for your family.
            Medical inflation in India runs at 12-14% per year -- ensure you are
            not under-insured.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ========== LEFT PANEL: Inputs + Summary ========== */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              {/* Your Age */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Your Age
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) =>
                        setAge(Math.max(18, Math.min(80, Number(e.target.value))))
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={18}
                  max={80}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>18</span>
                  <span>80</span>
                </div>
              </div>

              {/* City Tier */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-700">
                  City Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCity(opt.value)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        city === opt.value
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span
                        className={`block text-sm font-bold ${
                          city === opt.value
                            ? 'text-primary-600'
                            : 'text-gray-800'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {opt.examples}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Members */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Family Members
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={familySize}
                      onChange={(e) =>
                        setFamilySize(
                          Math.max(1, Math.min(8, Number(e.target.value)))
                        )
                      }
                      className="w-10 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={familySize}
                  onChange={(e) => setFamilySize(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>1</span>
                  <span>8</span>
                </div>
              </div>

              {/* Pre-existing Conditions */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-700">
                  Pre-existing Conditions
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreExistingConditions(false)}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-center text-sm font-bold transition-all ${
                      !preExistingConditions
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setPreExistingConditions(true)}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-center text-sm font-bold transition-all ${
                      preExistingConditions
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Current Health Insurance Cover */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Current Health Cover
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">₹</span>
                    <input
                      type="number"
                      value={currentCover}
                      onChange={(e) =>
                        setCurrentCover(
                          Math.max(0, Math.min(10000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000000}
                  step={100000}
                  value={currentCover}
                  onChange={(e) => setCurrentCover(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>₹0</span>
                  <span>₹1 Cr</span>
                </div>
              </div>

              {/* Has Corporate Cover */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-700">
                  Has Corporate / Group Cover?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasCorporateCover(false)}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-center text-sm font-bold transition-all ${
                      !hasCorporateCover
                        ? 'border-gray-400 bg-gray-50 text-gray-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setHasCorporateCover(true)}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-center text-sm font-bold transition-all ${
                      hasCorporateCover
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Corporate Cover Amount - Conditional */}
              {hasCorporateCover && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">
                      Corporate Cover Amount
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                      <span className="mr-1 text-sm text-gray-400">₹</span>
                      <input
                        type="number"
                        value={corporateCoverAmount}
                        onChange={(e) =>
                          setCorporateCoverAmount(
                            Math.max(
                              0,
                              Math.min(5000000, Number(e.target.value))
                            )
                          )
                        }
                        className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5000000}
                    step={50000}
                    value={corporateCoverAmount}
                    onChange={(e) =>
                      setCorporateCoverAmount(Number(e.target.value))
                    }
                    className="w-full accent-blue-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>₹0</span>
                    <span>₹50 L</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-amber-600">
                    * Only 50% of corporate cover is counted as it depends on
                    employment
                  </p>
                </div>
              )}

              {/* ---- Results Summary ---- */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Recommended Cover
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {formatLakhsCrores(result.recommendedCover)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Current Effective Cover
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatLakhsCrores(result.currentCover)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      Coverage Gap
                    </span>
                    {hasGap ? (
                      <span className="text-lg font-extrabold text-red-600">
                        {formatLakhsCrores(result.gap)}
                      </span>
                    ) : (
                      <span className="text-lg font-extrabold text-emerald-600">
                        Adequate
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/insurance/health"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Get Health Insurance Quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* ========== RIGHT PANEL: Visualizations ========== */}
          <div className="space-y-6 lg:col-span-3">
            {/* Gap Visualization - Bar Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                Coverage Gap Analysis
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                Your current cover vs recommended cover
              </p>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={gapChartData}
                    margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(v: number) =>
                        v >= 10000000
                          ? `₹${(v / 10000000).toFixed(1)}Cr`
                          : v >= 100000
                            ? `₹${(v / 100000).toFixed(0)}L`
                            : `₹${(v / 1000).toFixed(0)}K`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [
                        formatINR(value),
                        'Amount',
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 8, 8, 0]}
                      barSize={36}
                    >
                      {gapChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(value: number) => formatLakhsCrores(value)}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          fill: '#374151',
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {hasGap && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                  <AlertTriangle
                    size={20}
                    className="flex-shrink-0 text-red-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      You are under-insured by{' '}
                      {formatLakhsCrores(result.gap)}
                    </p>
                    <p className="text-xs text-red-600">
                      A single major hospitalization could wipe out your savings.
                      Consider increasing your cover immediately.
                    </p>
                  </div>
                </div>
              )}

              {!hasGap && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <ShieldAlert
                    size={20}
                    className="flex-shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Your health insurance cover appears adequate!
                    </p>
                    <p className="text-xs text-emerald-600">
                      Review your coverage annually as medical costs inflate at
                      12-14% per year.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Factors Breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                Coverage Factors
              </h3>
              <p className="mb-5 text-sm text-gray-500">
                How your recommended cover is calculated
              </p>

              <div className="space-y-3">
                {result.factors.map((factor, idx) => {
                  const icons = [
                    <ShieldAlert key="base" size={18} />,
                    <Building2 key="city" size={18} />,
                    <Activity key="age" size={18} />,
                    <Users key="family" size={18} />,
                    <HeartPulse key="condition" size={18} />,
                  ];
                  const bgColors = [
                    'bg-blue-50 text-blue-600 border-blue-100',
                    'bg-purple-50 text-purple-600 border-purple-100',
                    'bg-amber-50 text-amber-600 border-amber-100',
                    'bg-emerald-50 text-emerald-600 border-emerald-100',
                    'bg-rose-50 text-rose-600 border-rose-100',
                  ];
                  const iconBg = [
                    'bg-blue-100 text-blue-600',
                    'bg-purple-100 text-purple-600',
                    'bg-amber-100 text-amber-600',
                    'bg-emerald-100 text-emerald-600',
                    'bg-rose-100 text-rose-600',
                  ];

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-xl border p-4 ${bgColors[idx] || bgColors[0]}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg[idx] || iconBg[0]}`}
                        >
                          {icons[idx] || icons[0]}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {factor.label}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-extrabold ${
                          factor.multiplier > 1.0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {factor.multiplier > 1.0
                          ? `+${((factor.multiplier - 1) * 100).toFixed(0)}%`
                          : `${factor.multiplier.toFixed(1)}x`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">
                    Combined Multiplier Effect
                  </span>
                  <span className="text-lg font-extrabold text-primary-600">
                    {(
                      result.factors.reduce(
                        (acc, f) => acc * f.multiplier,
                        1
                      )
                    ).toFixed(2)}
                    x
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Applied to the base recommended cover of ₹10 Lakh
                </p>
              </div>
            </div>

            {/* Medical Cost Reference Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                Medical Cost Reference
              </h3>
              <p className="mb-5 text-sm text-gray-500">
                Average treatment costs across city tiers (2025 estimates)
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2.5 pr-4 text-left text-xs font-bold uppercase text-gray-400">
                        Procedure
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold uppercase text-gray-400">
                        Metro
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold uppercase text-gray-400">
                        Tier 1
                      </th>
                      <th className="pl-4 py-2.5 text-right text-xs font-bold uppercase text-gray-400">
                        Tier 2
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MEDICAL_COST_TABLE.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 pr-4 font-semibold text-gray-900">
                          {row.procedure}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            city === 'metro'
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {formatLakhsCrores(row.metro)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            city === 'tier1'
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {formatLakhsCrores(row.tier1)}
                        </td>
                        <td
                          className={`pl-4 py-3 text-right font-bold ${
                            city === 'tier2' || city === 'tier3'
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {formatLakhsCrores(row.tier2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                <TrendingUp
                  size={16}
                  className="mt-0.5 flex-shrink-0 text-amber-600"
                />
                <p className="text-xs leading-relaxed text-amber-800">
                  Medical inflation in India averages 12-14% annually. These
                  costs could double in 5-6 years. Ensure your cover grows
                  accordingly.
                </p>
              </div>
            </div>

            {/* Why Corporate Cover Isn't Enough */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-primary-500"
                />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">
                    Why Corporate Cover Isn&apos;t Enough
                  </h4>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    Many people rely solely on their employer&apos;s group health
                    insurance. Here&apos;s why that&apos;s risky:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span>
                        <strong>Job loss or career change</strong> -- you lose
                        cover exactly when you need stability most
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span>
                        <strong>Limited cover amount</strong> -- most corporate
                        policies cover ₹3-5 Lakh, far below what a major
                        illness costs
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span>
                        <strong>No portability post-retirement</strong> -- when
                        you retire, corporate cover ends, and buying new
                        insurance at 60+ is extremely expensive
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span>
                        <strong>Waiting periods reset</strong> -- if you buy a
                        personal policy later, pre-existing condition waiting
                        periods start fresh
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      <span>
                        <strong>Tax benefit under Section 80D</strong> -- personal
                        health insurance premiums up to ₹25,000 (₹50,000 for
                        senior citizens) are tax-deductible
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs font-semibold text-primary-700">
                    Always maintain a personal health insurance policy in
                    addition to corporate cover.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0A1628] to-[#1a2d4a] p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <HeartPulse size={24} className="text-rose-400" />
                <h3 className="text-xl font-extrabold">
                  Protect Your Family&apos;s Health
                </h3>
              </div>
              <p className="mb-5 text-sm text-gray-400">
                Don&apos;t wait for a medical emergency. Get the right health
                insurance cover today and secure your family&apos;s financial
                future.
              </p>
              <Link
                href="/insurance/health"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
              >
                Get Health Insurance Quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
