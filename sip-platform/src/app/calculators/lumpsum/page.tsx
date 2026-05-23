'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, ArrowLeft, TrendingUp, IndianRupee, AlertTriangle,
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  calculateLumpsumPlanner, LumpsumCashFlow,
} from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  corpus: '#059669',
  invested: '#0F766E',
  investMarker: '#10B981',
  withdrawMarker: '#EF4444',
};

interface CashFlowEntry {
  id: number;
  year: number;
  amount: number;
}

export default function LumpsumPlannerPage() {
  const [initialAmount, setInitialAmount] = useState(500000);
  const [years, setYears] = useState(15);
  const [returnRate, setReturnRate] = useState(12);
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  // Future investments
  const [investments, setInvestments] = useState<CashFlowEntry[]>([]);
  const [nextInvestId, setNextInvestId] = useState(1);

  // Planned withdrawals
  const [withdrawals, setWithdrawals] = useState<CashFlowEntry[]>([]);
  const [nextWithdrawId, setNextWithdrawId] = useState(1);

  // Add/remove investments
  const addInvestment = () => {
    if (investments.length >= 10) return;
    setInvestments([...investments, { id: nextInvestId, year: 2, amount: 100000 }]);
    setNextInvestId(nextInvestId + 1);
  };
  const removeInvestment = (id: number) => {
    setInvestments(investments.filter((i) => i.id !== id));
  };
  const updateInvestment = (id: number, field: 'year' | 'amount', value: number) => {
    setInvestments(investments.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  // Add/remove withdrawals
  const addWithdrawal = () => {
    if (withdrawals.length >= 10) return;
    setWithdrawals([...withdrawals, { id: nextWithdrawId, year: 1, amount: 50000 }]);
    setNextWithdrawId(nextWithdrawId + 1);
  };
  const removeWithdrawal = (id: number) => {
    setWithdrawals(withdrawals.filter((w) => w.id !== id));
  };
  const updateWithdrawal = (id: number, field: 'year' | 'amount', value: number) => {
    setWithdrawals(withdrawals.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  // Build cash flows array
  const cashFlows: LumpsumCashFlow[] = useMemo(() => {
    const flows: LumpsumCashFlow[] = [];
    investments.forEach((i) => {
      flows.push({ year: i.year, type: 'invest', amount: i.amount });
    });
    withdrawals.forEach((w) => {
      flows.push({ year: w.year, type: 'withdraw', amount: w.amount });
    });
    return flows;
  }, [investments, withdrawals]);

  const result = useMemo(
    () => calculateLumpsumPlanner(initialAmount, returnRate, years, cashFlows),
    [initialAmount, returnRate, years, cashFlows]
  );

  // Withdrawal warning: check if any withdrawal would cause corpus to go below zero
  const withdrawalWarnings = useMemo(() => {
    const warnings: Record<number, string> = {};
    withdrawals.forEach((w) => {
      const yearData = result.yearlyData.find((d) => d.year === w.year);
      if (yearData) {
        // Check if the opening balance + any new investments minus this withdrawal < 0
        const available = yearData.openingBalance + yearData.investmentAdded;
        if (w.amount > available) {
          warnings[w.id] = `Withdrawal exceeds available corpus (${formatINR(available)}) in Year ${w.year}`;
        }
      }
    });
    return warnings;
  }, [withdrawals, result.yearlyData]);

  // Chart data
  const chartData = result.yearlyData.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    corpus: row.closingBalance,
    invested: row.totalInvested - row.totalWithdrawn,
    hasInvestment: row.investmentAdded > 0,
    hasWithdrawal: row.withdrawal > 0,
  }));

  // Cash flow events for timeline
  const cashFlowEvents = useMemo(() => {
    const events: { year: number; type: 'invest' | 'withdraw'; amount: number }[] = [];
    // Initial investment
    events.push({ year: 0, type: 'invest', amount: initialAmount });
    // Additional cash flows
    cashFlows.forEach((cf) => {
      events.push({ year: cf.year, type: cf.type, amount: cf.amount });
    });
    return events.sort((a, b) => a.year - b.year);
  }, [initialAmount, cashFlows]);

  // Years with events for reference lines
  const investmentYears = new Set(investments.map((i) => i.year));
  const withdrawalYears = new Set(withdrawals.map((w) => w.year));

  const wealthMultiplier = result.netInvested > 0 ? (result.finalValue / result.netInvested).toFixed(1) : '0';

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
              <Wallet className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Investment Planner</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Lumpsum Investment Calculator</h1>
              <p className="text-slate-300 mt-1">Model real-life investing &mdash; add money when you have it, withdraw when you need it. Plan with precision.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ── Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Your Investment</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                {/* Initial Amount */}
                <NumberInput label="Initial Lumpsum Amount" value={initialAmount} onChange={setInitialAmount} prefix="₹" step={50000} min={10000} max={100000000} />

                {/* Duration */}
                <NumberInput label="Investment Duration" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />

                {/* Return Rate */}
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />

                {/* ── Future Investments ── */}
                <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-slate-700">Future Investments</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{investments.length}/10</span>
                  </div>

                  {investments.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {investments.map((inv) => (
                        <div key={inv.id} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-emerald-100">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <label className="text-[10px] font-medium text-slate-500 shrink-0">Year</label>
                              <select
                                value={inv.year}
                                onChange={(e) => updateInvestment(inv.id, 'year', parseInt(e.target.value))}
                                className="text-xs font-semibold text-primary-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-400"
                              >
                                {Array.from({ length: years - 1 }, (_, i) => i + 2).map((y) => (
                                  <option key={y} value={y}>Yr {y}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatNumber(inv.amount)}
                                onChange={(e) => {
                                  const num = parseInt(e.target.value.replace(/,/g, ''));
                                  if (!isNaN(num) && num >= 0) updateInvestment(inv.id, 'amount', Math.min(num, 100000000));
                                }}
                                className="text-sm font-semibold text-primary-700 bg-transparent outline-none w-full"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInvestment(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addInvestment}
                    disabled={investments.length >= 10 || years < 2}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors',
                      investments.length >= 10 || years < 2
                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Future Investment
                  </button>
                </div>

                {/* ── Planned Withdrawals ── */}
                <div className="border border-red-200 rounded-xl p-4 bg-red-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-slate-700">Planned Withdrawals</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{withdrawals.length}/10</span>
                  </div>

                  {withdrawals.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {withdrawals.map((wd) => (
                        <div key={wd.id}>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-red-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-[10px] font-medium text-slate-500 shrink-0">Year</label>
                                <select
                                  value={wd.year}
                                  onChange={(e) => updateWithdrawal(wd.id, 'year', parseInt(e.target.value))}
                                  className="text-xs font-semibold text-primary-700 bg-red-50 border border-red-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-red-400"
                                >
                                  {Array.from({ length: years }, (_, i) => i + 1).map((y) => (
                                    <option key={y} value={y}>Yr {y}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">₹</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatNumber(wd.amount)}
                                  onChange={(e) => {
                                    const num = parseInt(e.target.value.replace(/,/g, ''));
                                    if (!isNaN(num) && num >= 0) updateWithdrawal(wd.id, 'amount', Math.min(num, 100000000));
                                  }}
                                  className="text-sm font-semibold text-primary-700 bg-transparent outline-none w-full"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeWithdrawal(wd.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {withdrawalWarnings[wd.id] && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-red-600">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{withdrawalWarnings[wd.id]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addWithdrawal}
                    disabled={withdrawals.length >= 10}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors',
                      withdrawals.length >= 10
                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-red-300 text-red-600 hover:bg-red-100'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Withdrawal
                  </button>
                </div>
              </div>

              {/* Summary Cards on Input Panel */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-slate-600">Total Invested</span>
                  </div>
                  <span className="font-bold text-primary-700">{formatINR(result.totalInvested)}</span>
                </div>

                {result.totalWithdrawn > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-slate-600">Total Withdrawn</span>
                    </div>
                    <span className="font-bold text-red-600">-{formatINR(result.totalWithdrawn)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-positive" />
                    <span className="text-sm text-slate-600">Total Returns</span>
                  </div>
                  <span className="font-bold text-positive">{formatINR(result.totalReturns)}</span>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Maturity Value</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{formatINR(result.finalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Wealth multiplier: <span className="font-semibold text-emerald-600">{wealthMultiplier}x</span>
                    {' '} | Effective: <span className="font-semibold text-emerald-600">{result.effectiveReturn}% p.a.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="space-y-8">
              {/* PDF Download Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Lumpsum Investment Calculator" fileName="lumpsum-planner" />
              </div>

              {/* Personalized Banner */}
              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-teal-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} Lumpsum Investment Plan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? `${formatINR(initialAmount)} invested at age ${investorAge} for ${years} years (till age ${investorAge + years})`
                      : `${formatINR(initialAmount)} invested for ${years} years`
                    }
                  </p>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-base p-5 border-t-4 border-emerald-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Invested</div>
                  <div className="text-xl font-extrabold text-emerald-700">{formatINR(result.netInvested)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {formatINR(result.totalInvested)} invested{result.totalWithdrawn > 0 ? ` - ${formatINR(result.totalWithdrawn)} withdrawn` : ''}
                  </div>
                </div>
                <div className="card-base p-5 border-t-4 border-green-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Maturity Value</div>
                  <div className="text-xl font-extrabold text-green-700">{formatINR(result.finalValue)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    After {years} years at {returnRate}% p.a.
                  </div>
                </div>
                <div className="card-base p-5 border-t-4 border-teal-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Returns</div>
                  <div className="text-xl font-extrabold text-teal-700">{formatINR(result.totalReturns)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Effective return: <span className="font-semibold text-teal-600">{result.effectiveReturn}% p.a.</span>
                  </div>
                </div>
              </div>

              {/* ── Growth Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Growth Over Time</h3>
                <p className="text-sm text-slate-500 mb-4">{investorName ? `${investorName}\u2019s corpus` : 'Corpus'} value with investments and withdrawals marked</p>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-600">Corpus Value</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-[#0F766E]" />
                    <span className="text-slate-600">Net Invested</span>
                  </div>
                  {investments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-4 border-l-2 border-dashed border-emerald-400" />
                      <span className="text-slate-600">Investment Added</span>
                    </div>
                  )}
                  {withdrawals.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-4 border-l-2 border-dashed border-red-400" />
                      <span className="text-slate-600">Withdrawal</span>
                    </div>
                  )}
                </div>

                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lsGradCorpus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.corpus} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.corpus} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="lsGradInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            corpus: 'Corpus Value',
                            invested: 'Net Invested',
                          };
                          return [formatINR(value), labels[name] || name];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="invested"
                        stroke={COLORS.invested}
                        fill="url(#lsGradInvested)"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        name="invested"
                      />
                      <Area
                        type="monotone"
                        dataKey="corpus"
                        stroke={COLORS.corpus}
                        fill="url(#lsGradCorpus)"
                        strokeWidth={2.5}
                        name="corpus"
                      />

                      {/* Reference lines for investment years */}
                      {Array.from(investmentYears).map((yr) => (
                        <ReferenceLine
                          key={`inv-${yr}`}
                          x={investorAge !== null ? `Age ${investorAge + yr}` : `Yr ${yr}`}
                          stroke={COLORS.investMarker}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: '+₹', position: 'top', fontSize: 10, fill: COLORS.investMarker, fontWeight: 700 }}
                        />
                      ))}
                      {/* Reference lines for withdrawal years */}
                      {Array.from(withdrawalYears).map((yr) => (
                        <ReferenceLine
                          key={`wd-${yr}`}
                          x={investorAge !== null ? `Age ${investorAge + yr}` : `Yr ${yr}`}
                          stroke={COLORS.withdrawMarker}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: '-₹', position: 'top', fontSize: 10, fill: COLORS.withdrawMarker, fontWeight: 700 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Cash Flow Timeline ── */}
              {cashFlowEvents.length > 1 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Cash Flow Timeline</h3>
                  <p className="text-sm text-slate-500 mb-6">Visual map of when money flows in and out</p>

                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" />

                    <div className="relative flex items-center justify-between overflow-x-auto pb-2" style={{ minHeight: '140px' }}>
                      {cashFlowEvents.map((event, idx) => {
                        const isInvest = event.type === 'invest';
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center relative shrink-0"
                            style={{ minWidth: '80px' }}
                          >
                            {/* Arrow and amount - above or below based on type */}
                            {isInvest ? (
                              <>
                                <div className="flex flex-col items-center mb-2">
                                  <span className="text-[10px] font-bold text-emerald-700">{formatINR(event.amount)}</span>
                                  <ArrowUpCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                                </div>
                                {/* Dot on timeline */}
                                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10" />
                                <div className="mt-2">
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {event.year === 0 ? 'Start' : `Yr ${event.year}`}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-col items-center mb-2">
                                  <span className="text-[10px] text-slate-400">&nbsp;</span>
                                  <span className="w-5 h-5" />
                                </div>
                                {/* Dot on timeline */}
                                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm z-10" />
                                <div className="flex flex-col items-center mt-2">
                                  <span className="text-[10px] font-medium text-slate-500">Yr {event.year}</span>
                                  <ArrowDownCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                  <span className="text-[10px] font-bold text-red-600">{formatINR(event.amount)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Year-by-Year Table ── */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Complete investment journey with all cash flows</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Opening</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Added</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Withdrawn</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Interest</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => {
                        const hasEvent = row.investmentAdded > 0 || row.withdrawal > 0;
                        return (
                          <tr
                            key={row.year}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              hasEvent && 'bg-emerald-50/30'
                            )}
                          >
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                              <div className="flex items-center gap-1.5">
                                Year {row.year}
                                {row.investmentAdded > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">+₹</span>
                                )}
                                {row.withdrawal > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-600">-₹</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.openingBalance)}</td>
                            <td className={cn('py-3 px-2 sm:px-3 text-right font-medium', row.investmentAdded > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                              {row.investmentAdded > 0 ? formatINR(row.investmentAdded) : '---'}
                            </td>
                            <td className={cn('py-3 px-2 sm:px-3 text-right font-medium', row.withdrawal > 0 ? 'text-red-600' : 'text-slate-400')}>
                              {row.withdrawal > 0 ? formatINR(row.withdrawal) : '---'}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right text-emerald-600 font-medium">{formatINR(row.interestEarned)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right font-semibold text-primary-700">{formatINR(row.closingBalance)}</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-surface-100 font-bold">
                        <td className="py-3 px-2 sm:px-3 text-primary-700">Total</td>
                        <td className="py-3 px-2 sm:px-3 text-right text-slate-600">---</td>
                        <td className="py-3 px-2 sm:px-3 text-right text-emerald-700">
                          {formatINR(result.totalInvested - initialAmount)}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-red-600">
                          {result.totalWithdrawn > 0 ? formatINR(result.totalWithdrawn) : '---'}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-emerald-700">
                          {formatINR(result.yearlyData.reduce((sum, r) => sum + r.interestEarned, 0))}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-primary-700">{formatINR(result.finalValue)}</td>
                      </tr>
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
