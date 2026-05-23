'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, Shield, Sparkles, Info,
  ArrowRight, Layers,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { calculateSwpSipCombo } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  baf: '#0F766E',          // teal — safety
  sip: '#D97706',          // amber — growth
  swp: '#6366F1',          // indigo — flow
  total: '#10b981',        // emerald — total
};

export default function SwpSipComboCalculatorPage() {
  const [clientName, setClientName] = useState('');
  const [clientAge, setClientAge] = useState<number | null>(45);

  const [lumpsum, setLumpsum] = useState(2500000);     // ₹25 lakh default
  const [bafReturn, setBafReturn] = useState(11);
  const [annualSwpRate, setAnnualSwpRate] = useState(9);
  const [sipReturn, setSipReturn] = useState(14);
  const [years, setYears] = useState(10);
  const [swpBasis, setSwpBasis] = useState<'fixed' | 'current'>('fixed');

  const result = useMemo(
    () => calculateSwpSipCombo(lumpsum, bafReturn, annualSwpRate, sipReturn, years, swpBasis),
    [lumpsum, bafReturn, annualSwpRate, sipReturn, years, swpBasis]
  );

  // Comparison: lumpsum staying in BAF without SWP
  const justBaf = useMemo(() => {
    const r = bafReturn / 100;
    return lumpsum * Math.pow(1 + r, years);
  }, [lumpsum, bafReturn, years]);

  const monthlyMonth1 =
    swpBasis === 'fixed'
      ? lumpsum * (annualSwpRate / 100 / 12)
      : lumpsum * (annualSwpRate / 100 / 12);

  const chartData = result.yearlyData.map((row) => ({
    year: clientAge !== null ? `Age ${clientAge + row.year}` : `Yr ${row.year}`,
    BAF: row.bafClosing,
    'Small Cap SIP': row.sipClosing,
    Total: row.totalWealth,
  }));

  const flowChartData = result.yearlyData.map((row) => ({
    year: clientAge !== null ? `Age ${clientAge + row.year}` : `Yr ${row.year}`,
    'SWP withdrawn': row.swpWithdrawn,
    'BAF growth (post-SWP)': row.bafGrowth,
    'SIP growth': row.sipGrowth,
  }));

  const pieData = [
    { name: 'BAF Final Value', value: result.finalBafValue, color: COLORS.baf },
    { name: 'Small Cap SIP Final Value', value: result.finalSipValue, color: COLORS.sip },
  ];

  const advantageOverJustBaf = result.totalWealth - justBaf;
  const advantagePct = justBaf > 0 ? (advantageOverJustBaf / justBaf) * 100 : 0;

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-start gap-4 max-w-4xl">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Layers className="w-7 h-7 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-300 mb-1">Trustner Signature Strategy</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">SWP + SIP Combo Calculator</h1>
              <p className="text-white/85 mt-2 text-sm sm:text-base leading-relaxed">
                The &ldquo;safety bhi, return bhi&rdquo; combination Trustner has run for clients for nearly a decade. Park your lumpsum in
                a Balanced Advantage Fund, withdraw a fixed annual rate via SWP, and route those monthly receipts as a SIP into
                an aggressive Small Cap (or Mid Cap) fund. Lumpsum stays roughly stable; SIP corpus compounds independently.
              </p>
            </div>
          </div>

          {/* Strategy flow */}
          <div className="mt-7 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-center">
              <div className="md:col-span-1 p-3 bg-emerald-500/20 rounded-xl border border-emerald-300/30">
                <Shield className="w-5 h-5 text-emerald-200 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Step 1</p>
                <p className="text-xs text-white/90 mt-0.5">Lumpsum into <span className="font-bold">BAF</span></p>
              </div>
              <ArrowRight className="hidden md:block text-white/50 mx-auto w-5 h-5" />
              <div className="md:col-span-1 p-3 bg-indigo-500/20 rounded-xl border border-indigo-300/30">
                <TrendingUp className="w-5 h-5 text-indigo-200 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Step 2</p>
                <p className="text-xs text-white/90 mt-0.5">SWP at <span className="font-bold">{annualSwpRate}% p.a.</span> monthly</p>
              </div>
              <ArrowRight className="hidden md:block text-white/50 mx-auto w-5 h-5" />
              <div className="md:col-span-1 p-3 bg-amber-500/20 rounded-xl border border-amber-300/30">
                <Sparkles className="w-5 h-5 text-amber-200 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Step 3</p>
                <p className="text-xs text-white/90 mt-0.5">SIP into <span className="font-bold">Small Cap</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Strategy</h2>

              <PersonalInfoBar
                name={clientName}
                onNameChange={setClientName}
                age={clientAge}
                onAgeChange={setClientAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-5">
                <NumberInput
                  label="Initial Lumpsum (BAF)"
                  value={lumpsum}
                  onChange={setLumpsum}
                  prefix="₹"
                  step={50000}
                  min={50000}
                  max={500000000}
                  hint="₹50K to ₹50 Cr"
                />

                <NumberInput
                  label="Expected BAF Return"
                  value={bafReturn}
                  onChange={setBafReturn}
                  suffix="% p.a."
                  step={0.5}
                  min={5}
                  max={18}
                  hint="ICICI BAF, HDFC BAF, etc. typically 9–12%"
                />

                <NumberInput
                  label="Annual SWP Rate"
                  value={annualSwpRate}
                  onChange={setAnnualSwpRate}
                  suffix="% p.a."
                  step={0.5}
                  min={3}
                  max={15}
                  hint="Withdrawal pulled monthly. 7–10% is the typical Trustner range."
                />

                {/* SWP basis selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SWP Basis</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSwpBasis('fixed')}
                      className={cn(
                        'flex-1 text-[11px] font-semibold py-2 rounded-lg border transition-colors',
                        swpBasis === 'fixed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300'
                      )}
                    >
                      Fixed monthly ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setSwpBasis('current')}
                      className={cn(
                        'flex-1 text-[11px] font-semibold py-2 rounded-lg border transition-colors',
                        swpBasis === 'current'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300'
                      )}
                    >
                      % of current BAF
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                    {swpBasis === 'fixed'
                      ? `Monthly SWP locked at ₹${Math.round(monthlyMonth1).toLocaleString('en-IN')} for the full term.`
                      : 'Monthly SWP recalculated on current BAF balance — falls if corpus shrinks, rises if it grows.'}
                  </p>
                </div>

                <NumberInput
                  label="Expected Small Cap SIP Return"
                  value={sipReturn}
                  onChange={setSipReturn}
                  suffix="% p.a."
                  step={0.5}
                  min={6}
                  max={22}
                  hint="Aggressive Small/Mid Cap. Long-term Indian average ~13–16%."
                />

                <NumberInput
                  label="Investment Duration"
                  value={years}
                  onChange={setYears}
                  suffix="Years"
                  step={1}
                  min={3}
                  max={40}
                  hint="Strategy works best over 7+ years"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-8">
              {/* Headline stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="BAF Balance" value={formatINR(result.finalBafValue)} sub={`${result.bafBalanceMultiplier.toFixed(2)}× lumpsum`} accent="teal" />
                <Stat label="SIP Corpus" value={formatINR(result.finalSipValue)} sub={`Total invested ${formatINR(result.totalSwpWithdrawn)}`} accent="amber" />
                <Stat label="Total Wealth" value={formatINR(result.totalWealth)} sub={`${result.totalWealthMultiplier.toFixed(2)}× lumpsum`} accent="emerald" />
                <Stat label="Effective CAGR" value={`${result.effectiveCAGR.toFixed(1)}%`} sub={`Over ${years} years`} accent="indigo" />
              </div>

              {/* Hero chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">BAF + Small Cap SIP — Wealth Trajectory</h3>
                  <DownloadPDFButton
                    elementId="calculator-results"
                    title="SWP + SIP Combo Calculator"
                    fileName={`swp-sip-combo${clientName ? `-${clientName.replace(/\s+/g, '-')}` : ''}`}
                  />
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  BAF balance (safety) and Small Cap SIP (return) compounding side-by-side over {years} years.
                </p>
                <div className="h-72">
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gBaf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.baf} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={COLORS.baf} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="gSip" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.sip} stopOpacity={0.7} />
                          <stop offset="95%" stopColor={COLORS.sip} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="BAF" stroke={COLORS.baf} fill="url(#gBaf)" strokeWidth={2} stackId="a" />
                      <Area type="monotone" dataKey="Small Cap SIP" stroke={COLORS.sip} fill="url(#gSip)" strokeWidth={2} stackId="a" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual flow chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Annual Cash-Flow & Growth Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How much is withdrawn each year (SWP), how much BAF re-grows after the withdrawal, and how the SIP sleeve adds value.
                </p>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={flowChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="SWP withdrawn" fill={COLORS.swp} />
                      <Bar dataKey="BAF growth (post-SWP)" fill={COLORS.baf} />
                      <Bar dataKey="SIP growth" fill={COLORS.sip} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison vs just BAF */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Combo vs. Just-BAF (No SWP, No SIP)</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Same lumpsum, same BAF return — but without the SWP-into-SIP routing.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Just BAF (no SWP)</div>
                    <div className="text-2xl font-extrabold text-slate-700 mt-1">{formatINR(Math.round(justBaf))}</div>
                    <div className="text-xs text-slate-500 mt-1">{(justBaf / lumpsum).toFixed(2)}× lumpsum after {years} years</div>
                  </div>
                  <div className={cn(
                    'rounded-xl border p-5',
                    advantageOverJustBaf >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                  )}>
                    <div className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      advantageOverJustBaf >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    )}>SWP + SIP Combo</div>
                    <div className={cn(
                      'text-2xl font-extrabold mt-1',
                      advantageOverJustBaf >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    )}>{formatINR(result.totalWealth)}</div>
                    <div className={cn(
                      'text-xs mt-1',
                      advantageOverJustBaf >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {advantageOverJustBaf >= 0 ? '+' : ''}{formatINR(Math.round(advantageOverJustBaf))} ({advantagePct >= 0 ? '+' : ''}{advantagePct.toFixed(1)}%) vs Just-BAF
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    The combo wins when Small Cap return ≥ BAF return. The strategy compounds the SWP receipts at a higher rate than
                    they would have grown if left inside BAF — that&apos;s the source of the alpha. If Small Cap underperforms BAF in your
                    chosen scenario, the combo can lag. Test multiple return assumptions before committing.
                  </p>
                </div>
              </div>

              {/* Final composition pie */}
              <div className="card-base p-6">
                <h3 className="font-bold text-primary-700 mb-1">Final Wealth Composition</h3>
                <p className="text-sm text-slate-500 mb-6">
                  After {years} years, your total wealth is split across BAF (still intact) and Small Cap (built from SWP receipts).
                </p>
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={(e) => `${e.name}: ${((e.percent || 0) * 100).toFixed(0)}%`}>
                        {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-year table */}
              <div className="card-base p-6 overflow-hidden">
                <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Every year: what came out as SWP, what BAF grew back, what the SIP sleeve added, and the running total.
                </p>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-left text-slate-500">
                        <th className="py-2 pr-3 font-semibold">Year</th>
                        <th className="py-2 pr-3 font-semibold text-right">Monthly SWP</th>
                        <th className="py-2 pr-3 font-semibold text-right">SWP Withdrawn</th>
                        <th className="py-2 pr-3 font-semibold text-right">BAF Closing</th>
                        <th className="py-2 pr-3 font-semibold text-right">SIP Closing</th>
                        <th className="py-2 font-semibold text-right">Total Wealth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => (
                        <tr key={row.year} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 pr-3 font-medium">
                            {clientAge !== null ? `Age ${clientAge + row.year}` : `Yr ${row.year}`}
                          </td>
                          <td className="py-2 pr-3 text-right text-indigo-600 font-medium">{formatINR(row.monthlySwp)}</td>
                          <td className="py-2 pr-3 text-right text-slate-600">{formatINR(row.swpWithdrawn)}</td>
                          <td className="py-2 pr-3 text-right text-teal-700 font-semibold">{formatINR(row.bafClosing)}</td>
                          <td className="py-2 pr-3 text-right text-amber-700 font-semibold">{formatINR(row.sipClosing)}</td>
                          <td className="py-2 text-right font-bold text-emerald-700">{formatINR(row.totalWealth)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategy guide */}
              <div className="card-base p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-200">
                <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> The Trustner Playbook for This Strategy
                </h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    This is a <strong>long-horizon</strong> strategy — the people who&apos;ve seen the biggest results have held it for 7+ years. The
                    psychology matters: clients see the BAF balance staying broadly intact (or growing), which removes the fear of touching
                    capital, while the Small Cap sleeve compounds quietly in the background.
                  </p>
                  <p>
                    <strong>Why a BAF, not a pure equity fund, for the lumpsum?</strong> Balanced Advantage Funds dynamically rebalance between
                    equity and debt based on market valuations. Drawdowns are typically 30–50% smaller than pure-equity funds, which is exactly
                    what makes a 7–10% SWP sustainable across full market cycles. ICICI Prudential BAF, HDFC BAF, Edelweiss BAF and similar
                    category leaders are the workhorse choices.
                  </p>
                  <p>
                    <strong>Why Small Cap (or Mid Cap), not Large Cap, for the SIP receiver?</strong> The SWP receipts are flowing in monthly — that&apos;s
                    the textbook profile for SIP-style rupee-cost averaging. Small/Mid Cap volatility, which scares lumpsum investors, becomes an
                    advantage in SIP mode because lower NAVs let you buy more units when markets are weak.
                  </p>
                  <p>
                    <strong>What can go wrong:</strong> Two scenarios break the math. (a) If SWP rate &gt; BAF return for an extended period, the
                    BAF balance shrinks year after year — the safety dimension fails. Keep SWP rate at or below the realistic long-term BAF
                    return. (b) If Small Cap underperforms BAF over your horizon, the combo lags a simple Just-BAF hold — though this is
                    uncommon over 7+ year periods historically.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold mb-1">Want Trustner to set this up for you?</h3>
                    <p className="text-sm text-white/80">
                      We have run the BAF + Small Cap SWP combo for clients for nearly a decade. Talk to us before deploying.
                    </p>
                  </div>
                  <Link
                    href="/contact?topic=SWP-SIP-Combo"
                    className="inline-flex items-center gap-2 bg-amber-400 text-primary-900 hover:bg-amber-300 font-bold px-5 py-3 rounded-xl text-sm shrink-0 transition-colors"
                  >
                    Schedule a call <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="font-semibold text-slate-600 mb-1">Important:</p>
                <p>
                  All returns shown are illustrative projections based on assumed annualised rates. Past performance of any
                  Balanced Advantage Fund or Small Cap fund is not indicative of future performance. The strategy works best
                  over 7+ year horizons; outcomes can vary materially in shorter windows. SWP rate above the realised BAF
                  return will erode the corpus over time. Small Cap funds carry materially higher volatility than the BAF.
                  Always size the strategy within an overall financial plan with a qualified MFD/RIA. {DISCLAIMER.mutual_fund}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: 'teal' | 'amber' | 'emerald' | 'indigo';
}) {
  const cls = {
    teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    val: 'text-teal-900' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   val: 'text-amber-900' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', val: 'text-emerald-900' },
    indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  val: 'text-indigo-900' },
  }[accent];
  return (
    <div className={cn('rounded-xl border p-4', cls.bg, cls.border)}>
      <div className={cn('text-[10px] uppercase tracking-wider font-medium', cls.text)}>{label}</div>
      <div className={cn('text-lg sm:text-xl font-extrabold mt-0.5', cls.val)}>{value}</div>
      {sub && <div className={cn('text-[10px] mt-1', cls.text)}>{sub}</div>}
    </div>
  );
}
