'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, PieChart as PieChartIcon, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Sparkles, ShieldCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ── Types & Constants ──────────────────────────────────

type AssetKey = 'equityMF' | 'directEquity' | 'debtMF' | 'fdBonds' | 'gold' | 'realEstate' | 'cash';
type BucketKey = 'equity' | 'debt' | 'gold' | 'realEstate' | 'cash';
type RiskProfile = 'conservative' | 'balanced' | 'aggressive' | 'custom';

interface AssetRow {
  key: AssetKey;
  label: string;
  bucket: BucketKey;
  hint?: string;
}

const ASSET_ROWS: AssetRow[] = [
  { key: 'equityMF', label: 'Equity Mutual Funds', bucket: 'equity', hint: 'Active + index + ELSS' },
  { key: 'directEquity', label: 'Direct Equity / Stocks', bucket: 'equity' },
  { key: 'debtMF', label: 'Debt Mutual Funds', bucket: 'debt', hint: 'Liquid, short, corporate, gilt' },
  { key: 'fdBonds', label: 'FDs + Bonds', bucket: 'debt', hint: 'Bank FD, SCSS, bonds' },
  { key: 'gold', label: 'Gold (SGB / ETF / Physical)', bucket: 'gold' },
  { key: 'realEstate', label: 'Real Estate / REIT', bucket: 'realEstate', hint: 'Current market value' },
  { key: 'cash', label: 'Cash / Liquid MF', bucket: 'cash', hint: 'Savings + liquid fund' },
];

const BUCKETS: { key: BucketKey; label: string; color: string }[] = [
  { key: 'equity',     label: 'Equity',      color: '#6366F1' },
  { key: 'debt',       label: 'Debt',        color: '#0EA5E9' },
  { key: 'gold',       label: 'Gold',        color: '#F59E0B' },
  { key: 'realEstate', label: 'Real Estate', color: '#8B5CF6' },
  { key: 'cash',       label: 'Cash',        color: '#10B981' },
];

type Allocation = Record<BucketKey, number>;

const PRESETS: Record<Exclude<RiskProfile, 'custom'>, { label: string; note: string; alloc: Allocation }> = {
  conservative: { label: 'Conservative (50+)', note: 'Capital preservation',   alloc: { equity: 30, debt: 50, gold: 10, realEstate: 0,  cash: 10 } },
  balanced:     { label: 'Balanced (35-50)',   note: 'Growth + stability',     alloc: { equity: 55, debt: 30, gold: 10, realEstate: 0,  cash:  5 } },
  aggressive:   { label: 'Aggressive (<35)',   note: 'Long-horizon growth',    alloc: { equity: 75, debt: 15, gold:  5, realEstate: 0,  cash:  5 } },
};

const INR = (v: number): string => {
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1_00_00_000) return `${s}₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000)    return `${s}₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000)       return `${s}₹${(a / 1_000).toFixed(0)}K`;
  return `${s}₹${formatNumber(Math.round(a))}`;
};

// ── Page ──────────────────────────────────────────────

export default function AssetRebalancerPage() {
  const [clientName, setClientName] = useState('');
  const [clientAge, setClientAge] = useState<number | null>(null);

  const [holdings, setHoldings] = useState<Record<AssetKey, number>>({
    equityMF: 1500000,
    directEquity: 500000,
    debtMF: 400000,
    fdBonds: 600000,
    gold: 200000,
    realEstate: 0,
    cash: 100000,
  });

  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [customAlloc, setCustomAlloc] = useState<Allocation>({ equity: 55, debt: 30, gold: 10, realEstate: 0, cash: 5 });
  const [ltcgEligible, setLtcgEligible] = useState(true);
  const [taxSlab, setTaxSlab] = useState<20 | 30>(30);

  const setHolding = (k: AssetKey, v: number) => setHoldings(prev => ({ ...prev, [k]: v }));

  const targetAlloc: Allocation = useMemo(() => {
    if (riskProfile === 'custom') return customAlloc;
    return PRESETS[riskProfile].alloc;
  }, [riskProfile, customAlloc]);

  const targetSum = useMemo(
    () => BUCKETS.reduce((s, b) => s + (targetAlloc[b.key] || 0), 0),
    [targetAlloc]
  );

  const currentByBucket: Allocation = useMemo(() => {
    const out: Allocation = { equity: 0, debt: 0, gold: 0, realEstate: 0, cash: 0 };
    ASSET_ROWS.forEach(r => { out[r.bucket] += holdings[r.key] || 0; });
    return out;
  }, [holdings]);

  const totalPortfolio = useMemo(
    () => BUCKETS.reduce((s, b) => s + currentByBucket[b.key], 0),
    [currentByBucket]
  );

  const rows = useMemo(() => BUCKETS.map(b => {
    const currentAmt = currentByBucket[b.key];
    const currentPct = totalPortfolio > 0 ? (currentAmt / totalPortfolio) * 100 : 0;
    const targetPct = targetAlloc[b.key] || 0;
    const targetAmt = (totalPortfolio * targetPct) / 100;
    const gapAmt = targetAmt - currentAmt;
    const gapPct = targetPct - currentPct;
    const action: 'BUY' | 'SELL' | 'HOLD' =
      Math.abs(gapAmt) < Math.max(5000, totalPortfolio * 0.005) ? 'HOLD' : gapAmt > 0 ? 'BUY' : 'SELL';
    return { bucket: b, currentAmt, currentPct, targetPct, targetAmt, gapAmt, gapPct, action };
  }), [currentByBucket, targetAlloc, totalPortfolio]);

  const drift = useMemo(
    () => rows.reduce((m, r) => Math.max(m, Math.abs(r.gapPct)), 0),
    [rows]
  );

  const mostUnderweight = useMemo(() => [...rows].sort((a, b) => a.gapPct - b.gapPct).reverse()[0], [rows]);
  const mostOverweight  = useMemo(() => [...rows].sort((a, b) => a.gapPct - b.gapPct)[0], [rows]);

  // Tax impact estimation on SELL side. Assume gains ~ 30% of sold amount (proxy for unrealised gains),
  // since user hasn't entered cost basis. We clearly label this as an estimate in the UI.
  const GAIN_PROXY = 0.30;
  const EQ_LTCG_EXEMPTION = 125000;

  const sellRows = rows.filter(r => r.action === 'SELL');
  const buyRows  = rows.filter(r => r.action === 'BUY');

  const taxEstimate = useMemo(() => {
    let totalTax = 0;
    let totalGains = 0;
    const breakdown: { bucket: string; sold: number; gains: number; tax: number; note: string }[] = [];
    sellRows.forEach(r => {
      const sold = Math.abs(r.gapAmt);
      const gains = sold * GAIN_PROXY;
      let tax = 0;
      let note = '';
      if (r.bucket.key === 'equity') {
        if (ltcgEligible) {
          const taxable = Math.max(0, gains - EQ_LTCG_EXEMPTION);
          tax = taxable * 0.125;
          note = `LTCG 12.5% on gains > ₹1.25L exempt`;
        } else {
          tax = gains * 0.20;
          note = `STCG 20% (held < 1 year)`;
        }
      } else if (r.bucket.key === 'debt') {
        tax = gains * (taxSlab / 100);
        note = `Debt MF taxed at ${taxSlab}% slab (post Budget 2023)`;
      } else if (r.bucket.key === 'gold') {
        tax = gains * (taxSlab / 100);
        note = `Gold pre-maturity: slab ${taxSlab}%. SGB held 8yr = tax-free`;
      } else if (r.bucket.key === 'cash') {
        tax = 0;
        note = `No CG event on cash / liquid fund redemption`;
      } else {
        tax = gains * (taxSlab / 100);
        note = `Approximated at slab rate`;
      }
      totalTax += tax;
      totalGains += gains;
      breakdown.push({ bucket: r.bucket.label, sold, gains, tax, note });
    });
    return { totalTax, totalGains, breakdown };
  }, [sellRows, ltcgEligible, taxSlab]);

  // Rebalance size = gross of moves / 2 (buys == sells in total)
  const rebalanceAmount = useMemo(
    () => Math.max(sellRows.reduce((s, r) => s + Math.abs(r.gapAmt), 0), buyRows.reduce((s, r) => s + r.gapAmt, 0)),
    [sellRows, buyRows]
  );

  // Pie data
  const currentPie = BUCKETS
    .map(b => ({ name: b.label, value: currentByBucket[b.key], color: b.color }))
    .filter(d => d.value > 0);
  const targetPie = BUCKETS
    .map(b => ({ name: b.label, value: (totalPortfolio * (targetAlloc[b.key] || 0)) / 100, color: b.color }))
    .filter(d => d.value > 0);

  const driftSeverity = drift < 3 ? 'low' : drift < 8 ? 'moderate' : 'high';
  const driftColor = drift < 3 ? 'emerald' : drift < 8 ? 'amber' : 'red';

  const setCustom = (k: BucketKey, v: number) => setCustomAlloc(prev => ({ ...prev, [k]: v }));

  return (
    <>
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
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Professional-Grade Tool</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Asset Allocation Rebalancer</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Quantify your portfolio drift, see rupee-level rebalancing actions, and the tax-efficient sequence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar name={clientName} onNameChange={setClientName} age={clientAge} onAgeChange={setClientAge} ageLabel="Age" namePlaceholder="e.g., Rajesh" />
            <DownloadPDFButton elementId="calculator-results" title="Asset Allocation Rebalancing Plan" fileName={`Asset-Rebalancer-${clientName || 'Plan'}`} />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">

            {/* LEFT INPUTS */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Current Holdings */}
              <div className="border-t-4 border-indigo-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-indigo-600" /> Current Holdings</h3>
                <p className="text-[11px] text-slate-400 mb-4">Enter the current market value of each asset class.</p>
                <div className="space-y-3">
                  {ASSET_ROWS.map(r => (
                    <NumberInput
                      key={r.key}
                      label={r.label}
                      value={holdings[r.key]}
                      onChange={v => setHolding(r.key, v)}
                      prefix="₹"
                      step={25000}
                      min={0}
                      max={1000000000}
                      hint={r.hint}
                    />
                  ))}
                </div>
                <div className="mt-4 px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700">Total Portfolio</span>
                    <span className="text-sm font-bold text-indigo-800">{INR(totalPortfolio)}</span>
                  </div>
                </div>
              </div>

              {/* Target Allocation */}
              <div className="border-t-4 border-emerald-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Target Allocation</h3>
                <p className="text-[11px] text-slate-400 mb-3">Pick a risk profile or customise sliders.</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {(['conservative','balanced','aggressive','custom'] as RiskProfile[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setRiskProfile(p)}
                      className={cn(
                        'px-2 py-1.5 text-[11px] font-semibold rounded-md border transition-colors',
                        riskProfile === p
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                      )}
                    >
                      {p === 'custom' ? 'Custom' : PRESETS[p as Exclude<RiskProfile,'custom'>].label}
                    </button>
                  ))}
                </div>

                {riskProfile === 'custom' ? (
                  <div className="space-y-2.5">
                    {BUCKETS.map(b => (
                      <div key={b.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold" style={{ color: b.color }}>{b.label}</span>
                          <span className="text-[12px] font-bold text-slate-700">{customAlloc[b.key]}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={customAlloc[b.key]}
                          onChange={e => setCustom(b.key, Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </div>
                    ))}
                    <div className={cn(
                      'mt-2 px-3 py-2 rounded-md text-[11px] font-semibold border',
                      targetSum === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      Total: {targetSum}% {targetSum === 100 ? '✓' : '— adjust to reach 100%'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {BUCKETS.map(b => (
                      <div key={b.key} className="flex items-center justify-between text-[12px]">
                        <span className="font-medium" style={{ color: b.color }}>{b.label}</span>
                        <span className="font-bold text-slate-700">{targetAlloc[b.key]}%</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 mt-2">{PRESETS[riskProfile as Exclude<RiskProfile,'custom'>].note}</p>
                  </div>
                )}
              </div>

              {/* Tax settings */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600" /> Tax Settings</h3>
                <p className="text-[11px] text-slate-400 mb-3">Used to estimate tax on sells.</p>

                <div className="mb-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setLtcgEligible(!ltcgEligible)} role="button" tabIndex={0}>
                    <span className="text-[13px] font-semibold text-slate-600">Equity held &gt; 1 year?</span>
                    <div className={cn('relative w-10 h-5 rounded-full transition-colors', ltcgEligible ? 'bg-emerald-500' : 'bg-slate-300')}>
                      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', ltcgEligible ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {ltcgEligible ? 'LTCG 12.5% on gains above ₹1.25L/yr' : 'STCG 20% on full gains'}
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Tax Slab (for debt MF / gold)</label>
                  <div className="flex gap-2">
                    {[20, 30].map(s => (
                      <button
                        key={s}
                        onClick={() => setTaxSlab(s as 20 | 30)}
                        className={cn(
                          'flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md border transition-colors',
                          taxSlab === s
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                        )}
                      >
                        {s}% slab
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT RESULTS */}
            <div className="space-y-6">

              {/* Hero metric */}
              <div className={cn(
                'card-base p-5 border-l-4',
                driftColor === 'emerald' && 'border-emerald-500 bg-emerald-50/40',
                driftColor === 'amber'   && 'border-amber-500 bg-amber-50/40',
                driftColor === 'red'     && 'border-red-500 bg-red-50/40',
              )}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Portfolio Drift</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
                      {drift.toFixed(1)}% max
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {drift < 3
                        ? 'Allocation is close to target. Minimal rebalancing required.'
                        : drift < 8
                        ? 'Moderate drift. Consider tax-efficient rebalancing.'
                        : 'Significant drift. Rebalance required.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Rebalance Size</p>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800">{INR(rebalanceAmount)}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">on ₹{(totalPortfolio / 1e5).toFixed(1)}L portfolio</p>
                  </div>
                </div>
              </div>

              {/* Rebalance table */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Rebalancing Actions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold">
                        <th className="px-2 py-2 text-left">Asset</th>
                        <th className="px-2 py-2 text-right">Current ₹</th>
                        <th className="px-2 py-2 text-right">Current %</th>
                        <th className="px-2 py-2 text-right">Target %</th>
                        <th className="px-2 py-2 text-right">Target ₹</th>
                        <th className="px-2 py-2 text-right">Gap ₹</th>
                        <th className="px-2 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.bucket.key} className="border-t border-slate-100">
                          <td className="px-2 py-2 font-semibold" style={{ color: r.bucket.color }}>{r.bucket.label}</td>
                          <td className="px-2 py-2 text-right">{INR(r.currentAmt)}</td>
                          <td className="px-2 py-2 text-right">{r.currentPct.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-right">{r.targetPct.toFixed(0)}%</td>
                          <td className="px-2 py-2 text-right">{INR(r.targetAmt)}</td>
                          <td className={cn('px-2 py-2 text-right font-semibold', r.gapAmt >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {r.gapAmt >= 0 ? '+' : ''}{INR(r.gapAmt)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={cn(
                              'inline-block px-2 py-0.5 text-[10px] font-bold rounded-full',
                              r.action === 'BUY'  && 'bg-emerald-100 text-emerald-700',
                              r.action === 'SELL' && 'bg-red-100 text-red-700',
                              r.action === 'HOLD' && 'bg-slate-100 text-slate-600',
                            )}>{r.action}</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                        <td className="px-2 py-2">Total</td>
                        <td className="px-2 py-2 text-right">{INR(totalPortfolio)}</td>
                        <td className="px-2 py-2 text-right">100%</td>
                        <td className="px-2 py-2 text-right">{targetSum}%</td>
                        <td className="px-2 py-2 text-right">{INR(totalPortfolio)}</td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pie charts */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Current vs Target Allocation</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{ title: 'Current', data: currentPie }, { title: 'Target', data: targetPie }].map(({ title, data }) => (
                    <div key={title}>
                      <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => INR(v)} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax impact card */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Tax Impact of Selling</h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Estimate assumes ~30% unrealised gains on sold amount. Actual tax depends on your cost basis.
                </p>
                {taxEstimate.breakdown.length === 0 ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> No sells required — allocation on-track.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taxEstimate.breakdown.map((b, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700">
                          <span>Sell {b.bucket}: {INR(b.sold)}</span>
                          <span className="text-red-600">Tax ≈ {INR(b.tax)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Est. gains {INR(b.gains)} · {b.note}</p>
                      </div>
                    ))}
                    <div className="mt-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-amber-700">Total Estimated Tax</span>
                      <span className="text-sm font-bold text-amber-800">{INR(taxEstimate.totalTax)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternative path */}
              {buyRows.length > 0 && sellRows.length > 0 && (
                <div className="card-base p-5 border-l-4 border-blue-500 bg-blue-50/40">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Tax-Efficient Alternative</h3>
                  <p className="text-[13px] text-blue-900 leading-relaxed">
                    Redirect your next 12 months of SIP contributions to{' '}
                    <strong>{buyRows.map(r => r.bucket.label).join(' + ')}</strong>{' '}
                    instead of selling{' '}
                    <strong>{sellRows.map(r => r.bucket.label).join(' + ')}</strong>.
                    You reach target allocation over 12 months with <strong>zero capital-gains event</strong>{' '}
                    — saving approximately <strong>{INR(taxEstimate.totalTax)}</strong> in taxes.
                  </p>
                  <p className="text-[11px] text-blue-700 mt-2">
                    Monthly redirect required ≈ {INR(rebalanceAmount / 12)}. Combine with annual bonus or top-up.
                  </p>
                </div>
              )}

              {/* Tax-efficient sequence */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Tax-Efficient Rebalancing Sequence</h3>
                <ol className="space-y-2 text-[13px] text-slate-700">
                  {[
                    'Redirect NEW SIP contributions to underweight assets first — zero tax, zero churn.',
                    'Use fresh lumpsum (bonus, maturities, salary increments) to top up underweight buckets.',
                    'If selling, sell equity holdings held > 1 year first to use the ₹1.25L LTCG exemption.',
                    'Next, trim any loss-making positions — loss harvesting offsets other gains.',
                    'Sell debt mutual funds only if absolutely required (taxed at your slab post-Budget 2023).',
                    'Never sell SGBs before maturity — capital gains at 8-year maturity are fully tax-free.',
                  ].map((txt, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                      <span>{txt}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Insights */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Expert Insights</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={cn(
                    'rounded-xl border p-4',
                    driftColor === 'emerald' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    driftColor === 'amber'   && 'bg-amber-50 border-amber-200 text-amber-800',
                    driftColor === 'red'     && 'bg-red-50 border-red-200 text-red-800',
                  )}>
                    <div className="text-sm font-bold mb-1">Drift Severity: {driftSeverity}</div>
                    <div className="text-xs opacity-80">
                      Max drift {drift.toFixed(1)}% across buckets. The 5% rule: rebalance when any asset drifts more than 5% from target.
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 bg-amber-50 border-amber-200 text-amber-800">
                    <div className="text-sm font-bold mb-1">Cost of Selling Now</div>
                    <div className="text-xs opacity-80">
                      Selling to rebalance triggers estimated {INR(taxEstimate.totalTax)} in capital-gains tax.
                      Redirecting new contributions is tax-free.
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 bg-amber-50 border-amber-200 text-amber-800">
                    <div className="text-sm font-bold mb-1">
                      {mostUnderweight && mostUnderweight.gapPct > 1
                        ? `${mostUnderweight.bucket.label} underweight by ${mostUnderweight.gapPct.toFixed(1)}%`
                        : 'Allocation well-balanced'}
                    </div>
                    <div className="text-xs opacity-80">
                      {mostUnderweight && mostUnderweight.bucket.key === 'gold'
                        ? 'Add via SGB issue — 2.5% interest + tax-free maturity after 8 years.'
                        : mostUnderweight && mostUnderweight.gapPct > 1
                        ? `Add ${INR(Math.max(0, mostUnderweight.gapAmt))} to ${mostUnderweight.bucket.label} over next 6–12 months.`
                        : 'All buckets within tolerance band. Review annually.'}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 bg-blue-50 border-blue-200 text-blue-800">
                    <div className="text-sm font-bold mb-1">
                      {mostOverweight && mostOverweight.gapPct < -1
                        ? `Over-concentration in ${mostOverweight.bucket.label}`
                        : 'Balanced risk exposure'}
                    </div>
                    <div className="text-xs opacity-80">
                      {mostOverweight && mostOverweight.gapPct < -1
                        ? `${mostOverweight.bucket.label} is ${Math.abs(mostOverweight.gapPct).toFixed(1)}% above target — concentrated single-asset risk. Rebalancing smooths long-term volatility.`
                        : 'No single asset is disproportionately concentrated. Strong diversification.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CFP Note */}
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">CFP</div>
                  <div>
                    <p className="text-sm font-bold text-brand-800 mb-1">CFP Note from Ram Shah, CFP<sup>CM</sup></p>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      Rebalance when drift exceeds 5% OR annually on a fixed date — whichever comes first.
                      The tax-efficient sequence is: <strong>redirect new contributions</strong> &gt;{' '}
                      <strong>harvest losses</strong> &gt; <strong>sell low-LTCG holdings</strong> &gt;{' '}
                      <strong>sell high-CGT positions last</strong>. Never sell SGBs before maturity.
                      Speak to your Relationship Manager for a personalised rebalancing calendar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Form */}
              <CalculatorLeadForm
                calculatorName="Asset Rebalancer"
                accent="indigo"
                resultContext={`Portfolio ₹${(totalPortfolio / 1e5).toFixed(1)}L, drift ${drift.toFixed(1)}%, rebalance ₹${(rebalanceAmount / 1e5).toFixed(1)}L, est. tax ₹${(taxEstimate.totalTax / 1e5).toFixed(2)}L`}
              />

              {/* Disclaimer */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {DISCLAIMER.mutual_fund} Tax estimates use a ~30% gain proxy
                  and current-year rules (LTCG 12.5% on equity above ₹1.25L, debt MF at slab post Budget 2023).
                  Actual tax depends on your cost basis, holding period and aggregate capital gains.
                  This tool is educational and does not constitute tax or investment advice.
                  Consult your CA or SEBI-registered advisor for personalised guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
