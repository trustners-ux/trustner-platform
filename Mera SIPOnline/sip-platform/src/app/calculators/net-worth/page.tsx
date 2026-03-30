'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Wallet, ArrowLeft, Plus, Trash2, IndianRupee, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

/* ─── Types ─── */
interface Item {
  id: string;
  name: string;
  value: number;
  isLiquid: boolean;
}

/* ─── Unique ID Generator ─── */
let idCounter = 0;
const genId = () => `item-${++idCounter}`;

/* ─── Color Palettes ─── */
const ASSET_COLORS = ['#059669', '#0F766E', '#2563EB', '#7C3AED', '#D97706', '#E8553A', '#EC4899', '#6366F1'];
const LIABILITY_COLORS = ['#DC2626', '#E8553A', '#F59E0B', '#D97706', '#B91C1C'];

/* ─── Default Data ─── */
const DEFAULT_ASSETS: Item[] = [
  { id: genId(), name: 'Savings Account', value: 150000, isLiquid: true },
  { id: genId(), name: 'Fixed Deposits', value: 500000, isLiquid: true },
  { id: genId(), name: 'Mutual Funds', value: 800000, isLiquid: true },
  { id: genId(), name: 'Stocks', value: 300000, isLiquid: true },
  { id: genId(), name: 'PPF / EPF', value: 600000, isLiquid: false },
  { id: genId(), name: 'Real Estate', value: 5000000, isLiquid: false },
  { id: genId(), name: 'Gold / Jewelry', value: 200000, isLiquid: false },
  { id: genId(), name: 'Vehicle', value: 400000, isLiquid: false },
];

const DEFAULT_LIABILITIES: Item[] = [
  { id: genId(), name: 'Home Loan', value: 3500000, isLiquid: false },
  { id: genId(), name: 'Car Loan', value: 300000, isLiquid: false },
  { id: genId(), name: 'Credit Card', value: 0, isLiquid: false },
];

/* ─── Wealth Score Helper ─── */
function getWealthScore(debtToAssetRatio: number): { score: number; label: string; color: string; bgColor: string } {
  if (debtToAssetRatio <= 20) return { score: Math.round(90 + (20 - debtToAssetRatio) / 2), label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50' };
  if (debtToAssetRatio <= 40) return { score: Math.round(70 + (40 - debtToAssetRatio) * 0.95), label: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-50' };
  if (debtToAssetRatio <= 60) return { score: Math.round(50 + (60 - debtToAssetRatio) * 0.95), label: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
  if (debtToAssetRatio <= 80) return { score: Math.round(30 + (80 - debtToAssetRatio) * 0.95), label: 'Poor', color: 'text-orange-700', bgColor: 'bg-orange-50' };
  return { score: Math.max(0, Math.round(29 - (debtToAssetRatio - 80) * 0.29)), label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50' };
}

/* ═══════════════════════════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════════════════════════ */
export default function NetWorthCalculatorPage() {
  const [assets, setAssets] = useState<Item[]>(DEFAULT_ASSETS);
  const [liabilities, setLiabilities] = useState<Item[]>(DEFAULT_LIABILITIES);

  /* ─── CRUD Helpers ─── */
  const updateAsset = (id: string, field: keyof Item, value: string | number | boolean) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));
  const addAsset = () => setAssets(prev => [...prev, { id: genId(), name: '', value: 0, isLiquid: true }]);

  const updateLiability = (id: string, field: keyof Item, value: string | number | boolean) => {
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const removeLiability = (id: string) => setLiabilities(prev => prev.filter(l => l.id !== id));
  const addLiability = () => setLiabilities(prev => [...prev, { id: genId(), name: '', value: 0, isLiquid: false }]);

  /* ─── Calculations ─── */
  const result = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;
    const liquidAssets = assets.filter(a => a.isLiquid).reduce((sum, a) => sum + a.value, 0);
    const liquidNetWorth = liquidAssets - totalLiabilities;
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const wealthScore = getWealthScore(debtToAssetRatio);

    return { totalAssets, totalLiabilities, netWorth, liquidAssets, liquidNetWorth, debtToAssetRatio, wealthScore };
  }, [assets, liabilities]);

  /* ─── Chart Data ─── */
  const barChartData = useMemo(() => [
    { name: 'Total Assets', value: result.totalAssets },
    { name: 'Total Liabilities', value: result.totalLiabilities },
  ], [result.totalAssets, result.totalLiabilities]);

  const assetPieData = useMemo(() =>
    assets.filter(a => a.value > 0).map((a, i) => ({
      name: a.name || 'Unnamed',
      value: a.value,
      color: ASSET_COLORS[i % ASSET_COLORS.length],
    })),
    [assets]
  );

  const liabilityPieData = useMemo(() =>
    liabilities.filter(l => l.value > 0).map((l, i) => ({
      name: l.name || 'Unnamed',
      value: l.value,
      color: LIABILITY_COLORS[i % LIABILITY_COLORS.length],
    })),
    [liabilities]
  );

  /* ─── Debt-to-Asset Ratio color ─── */
  const ratioColor = result.debtToAssetRatio <= 20 ? 'text-green-700' : result.debtToAssetRatio <= 40 ? 'text-blue-700' : result.debtToAssetRatio <= 60 ? 'text-yellow-700' : result.debtToAssetRatio <= 80 ? 'text-orange-700' : 'text-red-700';

  return (
    <>
      {/* ─── Header ─── */}
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
              <h1 className="text-3xl sm:text-4xl font-extrabold">Net Worth Calculator</h1>
              <p className="text-slate-300 mt-1">Track your assets, liabilities &amp; wealth score</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Calculator Body ─── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[440px_1fr] gap-8">
            {/* ═══ Left Panel — Inputs ═══ */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">

              {/* ── Assets Section ── */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h2 className="font-bold text-primary-700 text-sm">Assets</h2>
                </div>
                <div className="space-y-2.5">
                  {assets.map(asset => (
                    <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <input
                        type="text"
                        value={asset.name}
                        onChange={e => updateAsset(asset.id, 'name', e.target.value)}
                        placeholder="Asset name"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                      />
                      <div className="relative flex-shrink-0 w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={asset.value || ''}
                          onChange={e => updateAsset(asset.id, 'value', Number(e.target.value) || 0)}
                          placeholder="0"
                          min={0}
                          className="w-32 pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-right"
                        />
                      </div>
                      <label className="flex items-center gap-1 flex-shrink-0 cursor-pointer select-none" title="Mark as liquid asset">
                        <input
                          type="checkbox"
                          checked={asset.isLiquid}
                          onChange={e => updateAsset(asset.id, 'isLiquid', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-brand focus:ring-brand/20"
                        />
                        <span className="text-xs text-slate-500">Liquid</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAsset(asset.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded"
                        title="Remove asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAsset}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-600 transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Asset
                </button>
              </div>

              {/* ── Liabilities Section ── */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <h2 className="font-bold text-primary-700 text-sm">Liabilities</h2>
                </div>
                <div className="space-y-2.5">
                  {liabilities.map(liability => (
                    <div key={liability.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <input
                        type="text"
                        value={liability.name}
                        onChange={e => updateLiability(liability.id, 'name', e.target.value)}
                        placeholder="Liability name"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                      />
                      <div className="relative flex-shrink-0 w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={liability.value || ''}
                          onChange={e => updateLiability(liability.id, 'value', Number(e.target.value) || 0)}
                          placeholder="0"
                          min={0}
                          className="w-32 pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLiability(liability.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded"
                        title="Remove liability"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLiability}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-600 transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Liability
                </button>
              </div>

              {/* ── Summary Cards ── */}
              <div className="space-y-3 mt-6">
                {/* Net Worth — Hero Card */}
                <div className={cn(
                  'rounded-xl p-4',
                  result.netWorth >= 0
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                    : 'bg-gradient-to-r from-red-50 to-rose-50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className={cn('w-4 h-4', result.netWorth >= 0 ? 'text-green-600' : 'text-red-600')} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Net Worth</span>
                  </div>
                  <div className={cn(
                    'text-2xl font-extrabold',
                    result.netWorth >= 0 ? 'text-green-700' : 'text-red-700'
                  )}>
                    {result.netWorth < 0 ? '-' : ''}{formatINR(Math.abs(result.netWorth))}
                  </div>
                </div>

                {/* Liquid Net Worth */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Liquid Net Worth</span>
                  </div>
                  <span className={cn('text-sm font-bold', result.liquidNetWorth >= 0 ? 'text-teal-700' : 'text-red-600')}>
                    {result.liquidNetWorth < 0 ? '-' : ''}{formatINR(Math.abs(result.liquidNetWorth))}
                  </span>
                </div>

                {/* Total Assets */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Assets</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">{formatINR(result.totalAssets)}</span>
                </div>

                {/* Total Liabilities */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Liabilities</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatINR(result.totalLiabilities)}</span>
                </div>

                {/* Debt-to-Asset Ratio */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Debt-to-Asset Ratio</span>
                  </div>
                  <span className={cn('text-sm font-bold', ratioColor)}>
                    {result.debtToAssetRatio.toFixed(1)}%
                  </span>
                </div>

                {/* Wealth Score */}
                <div className={cn('flex items-center justify-between p-3 rounded-lg', result.wealthScore.bgColor)}>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Wealth Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', result.wealthScore.color)}>
                      {result.wealthScore.score}/100
                    </span>
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', result.wealthScore.bgColor, result.wealthScore.color)}>
                      {result.wealthScore.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Right Panel — Charts & Results ═══ */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Net Worth Calculator" fileName="net-worth-calculator" />
              </div>

              {/* ── Horizontal Bar Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Assets vs Liabilities</h3>
                <p className="text-sm text-slate-500 mb-6">Overview of your total assets and liabilities</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} width={120} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Amount']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        <Cell fill="#059669" />
                        <Cell fill="#DC2626" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Asset Pie Chart ── */}
              {assetPieData.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Asset Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-6">Proportional distribution of all your assets</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {assetPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Liability Pie Chart ── */}
              {result.totalLiabilities > 0 && liabilityPieData.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Liability Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-6">Proportional distribution of all your liabilities</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={liabilityPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {liabilityPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Summary Table ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Complete Summary</h3>
                  <p className="text-sm text-slate-500 mb-4">All assets and liabilities at a glance</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Name</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Value</th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.filter(a => a.value > 0 || a.name).map(asset => (
                        <tr key={asset.id} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-6 font-medium text-primary-700">{asset.name || 'Unnamed'}</td>
                          <td className="py-3 px-6 text-right font-semibold text-green-700">{formatINR(asset.value)}</td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">
                              Asset{asset.isLiquid ? ' (Liquid)' : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {liabilities.filter(l => l.value > 0 || l.name).map(liability => (
                        <tr key={liability.id} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-6 font-medium text-primary-700">{liability.name || 'Unnamed'}</td>
                          <td className="py-3 px-6 text-right font-semibold text-red-600">{formatINR(liability.value)}</td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">
                              Liability
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-surface-200 font-bold">
                        <td className="py-3 px-6 text-primary-700">Net Worth</td>
                        <td className={cn('py-3 px-6 text-right text-lg', result.netWorth >= 0 ? 'text-green-700' : 'text-red-600')}>
                          {result.netWorth < 0 ? '-' : ''}{formatINR(Math.abs(result.netWorth))}
                        </td>
                        <td className="py-3 px-6" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
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
