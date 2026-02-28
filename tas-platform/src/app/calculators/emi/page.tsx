'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  Home,
  Car,
  GraduationCap,
  Wallet,
  Gem,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { calculateEMI } from '@/lib/utils/financial-engine';
import { formatINR, formatLakhsCrores } from '@/lib/utils/formatters';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';

// ===== Loan Type Configuration =====
const LOAN_TYPES = [
  {
    id: 'home',
    label: 'Home Loan',
    icon: Home,
    defaultRate: 8.5,
    defaultPrincipal: 5000000,
    minPrincipal: 100000,
    maxPrincipal: 100000000,
    stepPrincipal: 50000,
    defaultTenure: 240,
  },
  {
    id: 'car',
    label: 'Car Loan',
    icon: Car,
    defaultRate: 9,
    defaultPrincipal: 1000000,
    minPrincipal: 100000,
    maxPrincipal: 10000000,
    stepPrincipal: 25000,
    defaultTenure: 60,
  },
  {
    id: 'personal',
    label: 'Personal Loan',
    icon: Wallet,
    defaultRate: 12,
    defaultPrincipal: 500000,
    minPrincipal: 50000,
    maxPrincipal: 5000000,
    stepPrincipal: 10000,
    defaultTenure: 36,
  },
  {
    id: 'education',
    label: 'Education Loan',
    icon: GraduationCap,
    defaultRate: 8,
    defaultPrincipal: 2000000,
    minPrincipal: 100000,
    maxPrincipal: 50000000,
    stepPrincipal: 25000,
    defaultTenure: 84,
  },
  {
    id: 'gold',
    label: 'Gold Loan',
    icon: Gem,
    defaultRate: 9.5,
    defaultPrincipal: 300000,
    minPrincipal: 50000,
    maxPrincipal: 5000000,
    stepPrincipal: 10000,
    defaultTenure: 24,
  },
] as const;

type LoanTypeId = (typeof LOAN_TYPES)[number]['id'];

const PIE_COLORS = ['#0052CC', '#E11D48'];
const BAR_COLORS = { principal: '#0052CC', interest: '#E11D48' };

export default function EMICalculatorPage() {
  const [loanType, setLoanType] = useState<LoanTypeId>('home');
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [tenureMode, setTenureMode] = useState<'years' | 'months'>('years');
  const [showAllRows, setShowAllRows] = useState(false);

  // Switch loan type and pre-fill defaults
  const handleLoanTypeChange = (id: LoanTypeId) => {
    const config = LOAN_TYPES.find((lt) => lt.id === id)!;
    setLoanType(id);
    setPrincipal(config.defaultPrincipal);
    setRate(config.defaultRate);
    setTenureMonths(config.defaultTenure);
    setShowAllRows(false);
  };

  const activeLoan = LOAN_TYPES.find((lt) => lt.id === loanType)!;

  // ===== Calculation =====
  const result = useMemo(
    () =>
      calculateEMI({
        principal,
        annualRate: rate,
        tenureMonths,
      }),
    [principal, rate, tenureMonths],
  );

  // ===== Derived data =====
  const pieData = useMemo(
    () => [
      { name: 'Principal', value: principal },
      { name: 'Interest', value: result.totalInterest },
    ],
    [principal, result.totalInterest],
  );

  // Year-wise amortization for bar chart
  const yearlyData = useMemo(() => {
    const map = new Map<number, { year: number; principal: number; interest: number }>();
    for (const row of result.amortization) {
      const yr = Math.ceil(row.month / 12);
      if (!map.has(yr)) map.set(yr, { year: yr, principal: 0, interest: 0 });
      const entry = map.get(yr)!;
      entry.principal += row.principal;
      entry.interest += row.interest;
    }
    return Array.from(map.values()).map((d) => ({
      year: `Yr ${d.year}`,
      principal: Math.round(d.principal),
      interest: Math.round(d.interest),
    }));
  }, [result.amortization]);

  // Tenure in display units
  const tenureDisplay = tenureMode === 'years' ? Math.round(tenureMonths / 12) : tenureMonths;
  const maxTenureMonths = 360;
  const minTenureMonths = 12;

  const setTenureFromDisplay = (val: number) => {
    if (tenureMode === 'years') {
      setTenureMonths(Math.max(minTenureMonths, Math.min(maxTenureMonths, val * 12)));
    } else {
      setTenureMonths(Math.max(minTenureMonths, Math.min(maxTenureMonths, val)));
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      {/* ===== Hero Section ===== */}
      <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-sm">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white transition">
              Calculators
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">EMI Calculator</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold">EMI Calculator</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Calculate your Equated Monthly Instalment for Home Loan, Car Loan, Personal Loan,
            Education Loan &amp; Gold Loan. View detailed amortization schedule and interest
            breakdown.
          </p>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ===== Left Panel: Inputs ===== */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              {/* Loan Type Tabs */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Loan Type</label>
                <div className="flex flex-wrap gap-2">
                  {LOAN_TYPES.map((lt) => {
                    const Icon = lt.icon;
                    const isActive = loanType === lt.id;
                    return (
                      <button
                        key={lt.id}
                        onClick={() => handleLoanTypeChange(lt.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={14} />
                        {lt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loan Amount */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Loan Amount</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{'\u20B9'}</span>
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) =>
                        setPrincipal(
                          Math.max(
                            activeLoan.minPrincipal,
                            Math.min(activeLoan.maxPrincipal, Number(e.target.value)),
                          ),
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={activeLoan.minPrincipal}
                  max={activeLoan.maxPrincipal}
                  step={activeLoan.stepPrincipal}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{formatLakhsCrores(activeLoan.minPrincipal)}</span>
                  <span>{formatLakhsCrores(activeLoan.maxPrincipal)}</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Interest Rate (p.a.)</label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={rate}
                      step={0.1}
                      onChange={(e) =>
                        setRate(Math.max(4, Math.min(24, Number(e.target.value))))
                      }
                      className="w-16 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={4}
                  max={24}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>4%</span>
                  <span>24%</span>
                </div>
              </div>

              {/* Tenure */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Loan Tenure</label>
                  <div className="flex items-center gap-2">
                    {/* Toggle Years / Months */}
                    <div className="flex rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold overflow-hidden">
                      <button
                        onClick={() => setTenureMode('years')}
                        className={`px-2.5 py-1.5 transition-colors ${
                          tenureMode === 'years'
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Yr
                      </button>
                      <button
                        onClick={() => setTenureMode('months')}
                        className={`px-2.5 py-1.5 transition-colors ${
                          tenureMode === 'months'
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Mo
                      </button>
                    </div>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                      <input
                        type="number"
                        value={tenureDisplay}
                        onChange={(e) => setTenureFromDisplay(Math.max(1, Number(e.target.value)))}
                        className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                      />
                      <span className="ml-1 text-sm text-gray-400">
                        {tenureMode === 'years' ? 'Yr' : 'Mo'}
                      </span>
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={tenureMode === 'years' ? 1 : minTenureMonths}
                  max={tenureMode === 'years' ? 30 : maxTenureMonths}
                  step={1}
                  value={tenureDisplay}
                  onChange={(e) => setTenureFromDisplay(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{tenureMode === 'years' ? '1 Year' : '12 Months'}</span>
                  <span>{tenureMode === 'years' ? '30 Years' : '360 Months'}</span>
                </div>
              </div>

              {/* ===== Results Summary ===== */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Monthly EMI</span>
                  <span className="text-xl font-extrabold text-primary-500">
                    {formatINR(result.emi)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Interest Payable</span>
                  <span className="text-sm font-bold text-rose-600">
                    {formatINR(result.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Payment</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatINR(result.totalPayment)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Interest-to-Principal</span>
                    <span className="text-sm font-bold text-gray-900">
                      {(result.interestToPaymentRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Right Panel: Charts & Tables ===== */}
          <div className="space-y-6 lg:col-span-3">
            {/* Pie Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Principal vs Interest Breakdown
              </h3>
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatINR(value)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-[#0052CC]" />
                    <div>
                      <p className="text-xs text-gray-400">Principal Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(principal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-[#E11D48]" />
                    <div>
                      <p className="text-xs text-gray-400">Total Interest</p>
                      <p className="text-lg font-bold text-rose-600">
                        {formatLakhsCrores(result.totalInterest)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">Total Payment</p>
                    <p className="text-2xl font-extrabold text-primary-500">
                      {formatLakhsCrores(result.totalPayment)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart: Year-wise Amortization */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Year-wise Payment Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={yearlyData} barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    interval={yearlyData.length > 15 ? 1 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `\u20B9${(v / 10000000).toFixed(1)}Cr`
                        : v >= 100000
                          ? `\u20B9${(v / 100000).toFixed(0)}L`
                          : `\u20B9${(v / 1000).toFixed(0)}K`
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
                      name === 'principal' ? 'Principal' : 'Interest',
                    ]}
                  />
                  <Bar
                    dataKey="principal"
                    stackId="a"
                    fill={BAR_COLORS.principal}
                    name="principal"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="interest"
                    stackId="a"
                    fill={BAR_COLORS.interest}
                    name="interest"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#0052CC]" /> Principal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#E11D48]" /> Interest
                </span>
              </div>
            </div>

            {/* Amortization Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Amortization Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">
                        Month
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        EMI
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Principal
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Interest
                      </th>
                      <th className="pl-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllRows
                      ? result.amortization
                      : result.amortization.slice(0, 12)
                    ).map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2.5 pr-4 font-semibold text-gray-900">
                          {row.month}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatINR(row.emi)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatINR(row.principal)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600">
                          {formatINR(row.interest)}
                        </td>
                        <td className="pl-4 py-2.5 text-right font-bold text-gray-900">
                          {formatINR(row.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.amortization.length > 12 && (
                <button
                  onClick={() => setShowAllRows((prev) => !prev)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  {showAllRows ? (
                    <>
                      Show Less <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Show All {result.amortization.length} Months <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Info / Tips Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="mt-0.5 flex-shrink-0 text-primary-500" />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">EMI Tips &amp; Things to Know</h4>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Make part-prepayments whenever possible to reduce total interest
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      A shorter tenure means higher EMI but significantly lower total interest
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Home loan interest up to {'\u20B9'}2 Lakh is deductible under Section 24(b)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Principal repayment qualifies for deduction under Section 80C (up to {'\u20B9'}1.5 Lakh)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Keep your total EMIs below 40% of monthly income for healthy finances
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    This calculator is for illustration purposes only. Actual EMI may vary based on
                    processing fees, prepayment charges, and lender-specific terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
