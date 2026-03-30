'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, ArrowLeft, IndianRupee, TrendingUp, Shield, Landmark,
  Gem, BarChart3, Lightbulb, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

/* ─── Constants ─── */

type AssetType = 'equity_shares' | 'equity_mf' | 'debt_mf' | 'property' | 'gold';

const ASSET_TYPES: { key: AssetType; label: string; icon: typeof TrendingUp; color: string }[] = [
  { key: 'equity_shares', label: 'Equity Shares', icon: TrendingUp, color: '#2563EB' },
  { key: 'equity_mf', label: 'Equity MF', icon: BarChart3, color: '#059669' },
  { key: 'debt_mf', label: 'Debt MF', icon: Landmark, color: '#7C3AED' },
  { key: 'property', label: 'Property', icon: Shield, color: '#E8553A' },
  { key: 'gold', label: 'Gold', icon: Gem, color: '#D97706' },
];

const COLORS = {
  gain: '#059669',
  tax: '#E8553A',
  net: '#2563EB',
  purchase: '#0F766E',
  sale: '#7C3AED',
  indexed: '#D97706',
};

const CII_TABLE: Record<string, number> = {
  '2001-02': 100, '2002-03': 105, '2003-04': 109, '2004-05': 113, '2005-06': 117,
  '2006-07': 122, '2007-08': 129, '2008-09': 137, '2009-10': 148, '2010-11': 167,
  '2011-12': 184, '2012-13': 200, '2013-14': 220, '2014-15': 240, '2015-16': 254,
  '2016-17': 264, '2017-18': 272, '2018-19': 280, '2019-20': 289, '2020-21': 301,
  '2021-22': 317, '2022-23': 331, '2023-24': 348, '2024-25': 363,
};

const FY_KEYS = Object.keys(CII_TABLE);

function fyFromYear(year: number): string {
  const idx = FY_KEYS.findIndex((fy) => {
    const startYear = parseInt(fy.split('-')[0]);
    return startYear === year;
  });
  return idx >= 0 ? FY_KEYS[idx] : FY_KEYS[FY_KEYS.length - 1];
}

function yearOptions() {
  return Array.from({ length: 17 }, (_, i) => 2010 + i);
}

/* ─── Tax Tips ─── */

const TAX_TIPS = [
  'Hold equity investments for more than 12 months to benefit from lower LTCG rates (12.5% vs 20% STCG).',
  'Harvest up to Rs 1.25 lakh LTCG on equity every year tax-free by selling and re-buying units.',
  'For property, compare tax liability with and without indexation if purchased before July 23, 2024.',
  'Invest LTCG from property into specified bonds (Section 54EC) or a new house (Section 54) to save tax.',
];

/* ─── Component ─── */

export default function CapitalGainsTaxCalculatorPage() {
  const [assetType, setAssetType] = useState<AssetType>('equity_shares');
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [salePrice, setSalePrice] = useState(800000);
  const [purchaseYear, setPurchaseYear] = useState(2020);
  const [saleYear, setSaleYear] = useState(2025);
  const [slabRate, setSlabRate] = useState(30);
  const [purchasedBeforeJuly2024, setPurchasedBeforeJuly2024] = useState(true);
  const [goldType, setGoldType] = useState<'physical' | 'etf'>('physical');

  /* ─── Derived Calculations ─── */

  const result = useMemo(() => {
    const gain = salePrice - purchasePrice;
    const holdingYears = saleYear - purchaseYear;
    const holdingMonths = holdingYears * 12;

    /* Determine LTCG threshold and rates based on asset */
    let ltcgMonths = 12;
    let stcgRate = 20;
    let ltcgRate = 12.5;
    let ltcgExemption = 125000;
    let hasIndexation = false;
    let indexedCost = purchasePrice;
    let indexedGain = gain;
    let taxWithIndexation = 0;
    let taxWithoutIndexation = 0;
    let showIndexationComparison = false;

    switch (assetType) {
      case 'equity_shares':
      case 'equity_mf':
        ltcgMonths = 12;
        stcgRate = 20;
        ltcgRate = 12.5;
        ltcgExemption = 125000;
        break;

      case 'debt_mf':
        // Post April 2023: taxed at slab rate regardless of holding period
        ltcgMonths = 0; // No LTCG benefit
        stcgRate = slabRate;
        ltcgRate = slabRate;
        ltcgExemption = 0;
        break;

      case 'property':
        ltcgMonths = 24;
        stcgRate = slabRate;
        ltcgExemption = 0;
        if (purchasedBeforeJuly2024 && holdingMonths > ltcgMonths) {
          hasIndexation = true;
          showIndexationComparison = true;
          const purchaseFY = fyFromYear(purchaseYear);
          const saleFY = fyFromYear(saleYear);
          const purchaseCII = CII_TABLE[purchaseFY] || 100;
          const saleCII = CII_TABLE[saleFY] || 363;
          indexedCost = Math.round(purchasePrice * (saleCII / purchaseCII));
          indexedGain = salePrice - indexedCost;
          // With indexation: 20% rate
          taxWithIndexation = Math.max(0, indexedGain) * 0.20;
          // Without indexation: 12.5% rate
          taxWithoutIndexation = Math.max(0, gain) * 0.125;
          ltcgRate = 12.5; // default to without indexation display
        } else {
          ltcgRate = 12.5;
        }
        break;

      case 'gold':
        ltcgMonths = goldType === 'physical' ? 24 : 12;
        stcgRate = slabRate;
        ltcgRate = 12.5;
        ltcgExemption = 0;
        break;
    }

    const isLTCG = assetType === 'debt_mf' ? false : holdingMonths > ltcgMonths;

    /* Calculate taxable gain and tax */
    let applicableRate: number;
    let taxableGain: number;

    if (assetType === 'debt_mf') {
      applicableRate = slabRate;
      taxableGain = Math.max(0, gain);
    } else if (isLTCG) {
      applicableRate = ltcgRate;
      taxableGain = Math.max(0, gain - ltcgExemption);
    } else {
      applicableRate = stcgRate;
      taxableGain = Math.max(0, gain);
    }

    let baseTax: number;
    if (showIndexationComparison && isLTCG) {
      // For property pre-July 2024, compute both and take the better option
      baseTax = Math.min(taxWithIndexation, taxWithoutIndexation);
      // But display the 12.5% without indexation as the primary
      baseTax = taxableGain * (applicableRate / 100);
    } else {
      baseTax = taxableGain * (applicableRate / 100);
    }

    /* Surcharge */
    let surchargeRate = 0;
    if (taxableGain > 20000000) surchargeRate = 25;
    else if (taxableGain > 10000000) surchargeRate = 15;
    else if (taxableGain > 5000000) surchargeRate = 10;

    const surcharge = baseTax * (surchargeRate / 100);
    const cessBase = baseTax + surcharge;
    const cess = cessBase * 0.04;
    const totalTax = Math.round(baseTax + surcharge + cess);

    const netProceeds = salePrice - totalTax;

    /* Indexation comparison (for property) */
    let indexationComparison = null;
    if (showIndexationComparison && isLTCG) {
      const taxWith = Math.round(Math.max(0, taxWithIndexation) * 1.04);
      const taxWithout = Math.round(Math.max(0, taxWithoutIndexation) * 1.04);
      indexationComparison = {
        indexedCost,
        indexedGain: Math.max(0, indexedGain),
        taxWithIndexation: taxWith,
        taxWithoutIndexation: taxWithout,
        betterOption: taxWith <= taxWithout ? 'with' : 'without',
        savings: Math.abs(taxWith - taxWithout),
      };
    }

    /* Asset comparison: how same gain would be taxed across all asset types */
    const assetComparison = ASSET_TYPES.map((at) => {
      let rate = 0;
      let exemption = 0;
      let classification = '';

      switch (at.key) {
        case 'equity_shares':
        case 'equity_mf':
          if (holdingMonths > 12) {
            rate = 12.5;
            exemption = 125000;
            classification = 'LTCG';
          } else {
            rate = 20;
            classification = 'STCG';
          }
          break;
        case 'debt_mf':
          rate = 30;
          classification = 'Slab';
          break;
        case 'property':
          if (holdingMonths > 24) {
            rate = 12.5;
            classification = 'LTCG';
          } else {
            rate = 30;
            classification = 'STCG';
          }
          break;
        case 'gold':
          if (holdingMonths > 24) {
            rate = 12.5;
            classification = 'LTCG';
          } else {
            rate = 30;
            classification = 'STCG';
          }
          break;
      }

      const tGain = Math.max(0, gain - exemption);
      const tax = Math.round(tGain * (rate / 100) * 1.04);

      return {
        asset: at.label,
        color: at.color,
        rate,
        classification,
        tax,
      };
    });

    return {
      gain,
      holdingMonths,
      holdingYears,
      isLTCG,
      applicableRate,
      taxableGain,
      baseTax: Math.round(baseTax),
      surchargeRate,
      surcharge: Math.round(surcharge),
      cess: Math.round(cess),
      totalTax,
      netProceeds,
      ltcgExemption,
      indexationComparison,
      assetComparison,
    };
  }, [assetType, purchasePrice, salePrice, purchaseYear, saleYear, slabRate, purchasedBeforeJuly2024, goldType]);

  /* ─── Chart Data ─── */

  const pieData = [
    { name: 'Capital Gain', value: Math.max(0, result.gain - result.totalTax), color: COLORS.gain },
    { name: 'Tax Payable', value: result.totalTax, color: COLORS.tax },
  ];

  const barData = [
    { label: 'Purchase Price', value: purchasePrice, fill: COLORS.purchase },
    { label: 'Sale Price', value: salePrice, fill: COLORS.sale },
    { label: 'Tax Payable', value: result.totalTax, fill: COLORS.tax },
  ];

  const activeAsset = ASSET_TYPES.find((a) => a.key === assetType)!;

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
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Capital Gains Tax Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate STCG &amp; LTCG tax on stocks, mutual funds, property, and gold</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Tax Calculation</h2>

              {/* Asset Type Tabs */}
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Asset Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSET_TYPES.map((at) => {
                    const Icon = at.icon;
                    return (
                      <button
                        key={at.key}
                        type="button"
                        onClick={() => setAssetType(at.key)}
                        className={cn(
                          'flex items-center gap-1.5 text-[10px] font-semibold py-2 px-2 rounded-lg border transition-colors',
                          assetType === at.key
                            ? 'text-white border-transparent'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                        )}
                        style={assetType === at.key ? { backgroundColor: at.color, borderColor: at.color } : undefined}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {at.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gold sub-type toggle */}
              {assetType === 'gold' && (
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">Gold Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['physical', 'etf'] as const).map((gt) => (
                      <button
                        key={gt}
                        type="button"
                        onClick={() => setGoldType(gt)}
                        className={cn(
                          'text-[11px] font-semibold py-2 rounded-lg border transition-colors',
                          goldType === gt
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                        )}
                      >
                        {gt === 'physical' ? 'Physical Gold' : 'Gold ETF (Listed)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Property indexation toggle */}
              {assetType === 'property' && (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purchasedBeforeJuly2024}
                      onChange={(e) => setPurchasedBeforeJuly2024(e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-600"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Purchased before July 23, 2024</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1 ml-6">Enables indexation benefit comparison (20% with CII vs 12.5% without)</p>
                </div>
              )}

              <div className="space-y-6">
                <NumberInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="₹" step={10000} min={10000} max={100000000} />
                <NumberInput label="Sale Price" value={salePrice} onChange={setSalePrice} prefix="₹" step={10000} min={10000} max={100000000} />

                {/* Year selectors */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Purchase Year</label>
                  <select
                    value={purchaseYear}
                    onChange={(e) => setPurchaseYear(parseInt(e.target.value))}
                    className="w-full py-3 px-3 text-base font-semibold text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  >
                    {yearOptions().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Sale Year</label>
                  <select
                    value={saleYear}
                    onChange={(e) => setSaleYear(parseInt(e.target.value))}
                    className="w-full py-3 px-3 text-base font-semibold text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  >
                    {yearOptions().filter((y) => y >= purchaseYear).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Slab rate for debt MF, property STCG, gold STCG */}
                {(assetType === 'debt_mf' || assetType === 'property' || assetType === 'gold') && (
                  <NumberInput
                    label="Your Income Tax Slab Rate"
                    value={slabRate}
                    onChange={setSlabRate}
                    suffix="%"
                    step={5}
                    min={5}
                    max={30}
                    hint="Used for slab-rate taxation. Adjust to your applicable rate."
                  />
                )}
              </div>

              {/* Quick Summary */}
              <div className="mt-8 space-y-3">
                {/* Classification Badge */}
                <div className={cn(
                  'rounded-xl p-4',
                  assetType === 'debt_mf'
                    ? 'bg-purple-50'
                    : result.isLTCG
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50'
                )}>
                  <div className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">Classification</div>
                  <div className={cn(
                    'text-lg font-extrabold',
                    assetType === 'debt_mf'
                      ? 'text-purple-700'
                      : result.isLTCG ? 'text-emerald-700' : 'text-amber-700'
                  )}>
                    {assetType === 'debt_mf'
                      ? 'TAXED AT SLAB RATE'
                      : result.isLTCG
                        ? 'LONG TERM CAPITAL GAIN'
                        : 'SHORT TERM CAPITAL GAIN'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Holding period: {result.holdingYears} year{result.holdingYears !== 1 ? 's' : ''} ({result.holdingMonths} months)
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Capital Gain</span>
                  </div>
                  <span className={cn('text-sm font-bold', result.gain >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                    {result.gain >= 0 ? formatINR(result.gain) : `-${formatINR(Math.abs(result.gain))}`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Tax Rate</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{result.applicableRate}%</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-red-500" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Tax</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatINR(result.totalTax)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Net Proceeds</span>
                  </div>
                  <span className="text-sm font-bold text-teal-700">{formatINR(result.netProceeds)}</span>
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Capital Gains Tax Calculator" fileName="capital-gains-tax" />
              </div>

              {/* Classification Card */}
              <div className={cn(
                'card-base p-6 border-l-4',
                assetType === 'debt_mf'
                  ? 'border-purple-500'
                  : result.isLTCG ? 'border-emerald-500' : 'border-amber-500'
              )} data-pdf-keep-together>
                <div className="flex items-center gap-3 mb-3">
                  {(() => { const Icon = activeAsset.icon; return <Icon className="w-6 h-6" style={{ color: activeAsset.color }} />; })()}
                  <div>
                    <h3 className={cn(
                      'text-xl font-extrabold',
                      assetType === 'debt_mf'
                        ? 'text-purple-700'
                        : result.isLTCG ? 'text-emerald-700' : 'text-amber-700'
                    )}>
                      {assetType === 'debt_mf'
                        ? 'Taxed at Income Slab Rate'
                        : result.isLTCG
                          ? 'Long Term Capital Gain'
                          : 'Short Term Capital Gain'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {activeAsset.label} held for {result.holdingYears} year{result.holdingYears !== 1 ? 's' : ''}
                      {assetType === 'debt_mf' && ' (post April 2023 — no LTCG benefit)'}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-4">
                  <div className="bg-surface-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Capital Gain</div>
                    <div className={cn('text-lg font-extrabold', result.gain >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                      {result.gain >= 0 ? formatINR(result.gain) : `-${formatINR(Math.abs(result.gain))}`}
                    </div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tax Rate</div>
                    <div className="text-lg font-extrabold text-blue-700">{result.applicableRate}%</div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tax Payable</div>
                    <div className="text-lg font-extrabold text-red-600">{formatINR(result.totalTax)}</div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Proceeds</div>
                    <div className="text-lg font-extrabold text-teal-700">{formatINR(result.netProceeds)}</div>
                  </div>
                </div>
              </div>

              {/* Charts: Pie + Bar side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Gain vs Tax Split</h3>
                  <p className="text-sm text-slate-500 mb-4">How your capital gain splits into net gain and tax</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Purchase vs Sale vs Tax</h3>
                  <p className="text-sm text-slate-500 mb-4">Overview of investment, sale proceeds, and tax impact</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                        <Tooltip
                          formatter={(value: number) => [formatINR(value), '']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {barData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tax Breakdown Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Tax Computation Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Step-by-step breakdown of your capital gains tax liability</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Particulars</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 text-slate-600">Sale Price</td>
                        <td className="py-3 px-6 text-right font-medium text-primary-700">{formatINR(salePrice)}</td>
                      </tr>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 text-slate-600">Less: Purchase Price</td>
                        <td className="py-3 px-6 text-right font-medium text-primary-700">{formatINR(purchasePrice)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 bg-surface-100/50">
                        <td className="py-3 px-6 font-semibold text-primary-700">Capital Gain</td>
                        <td className={cn('py-3 px-6 text-right font-bold', result.gain >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                          {result.gain >= 0 ? formatINR(result.gain) : `-${formatINR(Math.abs(result.gain))}`}
                        </td>
                      </tr>
                      {result.ltcgExemption > 0 && result.isLTCG && (
                        <tr className="border-b border-surface-200">
                          <td className="py-3 px-6 text-slate-600">Less: LTCG Exemption (Section 112A)</td>
                          <td className="py-3 px-6 text-right font-medium text-emerald-600">{formatINR(result.ltcgExemption)}</td>
                        </tr>
                      )}
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 font-semibold text-slate-700">Taxable Capital Gain</td>
                        <td className="py-3 px-6 text-right font-bold text-primary-700">{formatINR(result.taxableGain)}</td>
                      </tr>
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 text-slate-600">Tax @ {result.applicableRate}%</td>
                        <td className="py-3 px-6 text-right font-medium text-red-600">{formatINR(result.baseTax)}</td>
                      </tr>
                      {result.surchargeRate > 0 && (
                        <tr className="border-b border-surface-200">
                          <td className="py-3 px-6 text-slate-600">Surcharge @ {result.surchargeRate}%</td>
                          <td className="py-3 px-6 text-right font-medium text-red-500">{formatINR(result.surcharge)}</td>
                        </tr>
                      )}
                      <tr className="border-b border-surface-200">
                        <td className="py-3 px-6 text-slate-600">Health &amp; Education Cess @ 4%</td>
                        <td className="py-3 px-6 text-right font-medium text-red-500">{formatINR(result.cess)}</td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="py-3 px-6 font-bold text-red-700">Total Tax Payable</td>
                        <td className="py-3 px-6 text-right font-extrabold text-red-700">{formatINR(result.totalTax)}</td>
                      </tr>
                      <tr className="bg-emerald-50">
                        <td className="py-3 px-6 font-bold text-emerald-700">Net Proceeds (Sale - Tax)</td>
                        <td className="py-3 px-6 text-right font-extrabold text-emerald-700">{formatINR(result.netProceeds)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Indexation Comparison (Property only) */}
              {result.indexationComparison && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-primary-700">Indexation Benefit Comparison</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    Properties purchased before July 23, 2024 can choose between 20% with indexation or 12.5% without
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className={cn(
                      'rounded-xl p-4 border-2',
                      result.indexationComparison.betterOption === 'with'
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    )}>
                      {result.indexationComparison.betterOption === 'with' && (
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Better Option</span>
                        </div>
                      )}
                      <div className="text-sm font-semibold text-slate-700 mb-2">20% WITH Indexation</div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between"><span>Indexed Cost:</span><span className="font-semibold">{formatINR(result.indexationComparison.indexedCost)}</span></div>
                        <div className="flex justify-between"><span>Indexed Gain:</span><span className="font-semibold">{formatINR(result.indexationComparison.indexedGain)}</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                          <span className="font-bold">Tax:</span>
                          <span className="font-bold text-red-600">{formatINR(result.indexationComparison.taxWithIndexation)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      'rounded-xl p-4 border-2',
                      result.indexationComparison.betterOption === 'without'
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    )}>
                      {result.indexationComparison.betterOption === 'without' && (
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Better Option</span>
                        </div>
                      )}
                      <div className="text-sm font-semibold text-slate-700 mb-2">12.5% WITHOUT Indexation</div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between"><span>Cost:</span><span className="font-semibold">{formatINR(purchasePrice)}</span></div>
                        <div className="flex justify-between"><span>Gain:</span><span className="font-semibold">{formatINR(Math.max(0, result.gain))}</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                          <span className="font-bold">Tax:</span>
                          <span className="font-bold text-red-600">{formatINR(result.indexationComparison.taxWithoutIndexation)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-800">
                      You save {formatINR(result.indexationComparison.savings)} by choosing the {result.indexationComparison.betterOption === 'with' ? '20% with indexation' : '12.5% without indexation'} option
                    </p>
                  </div>
                </div>
              )}

              {/* Asset Comparison Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Cross-Asset Tax Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    How the same gain of {formatINR(Math.max(0, result.gain))} would be taxed across different asset types
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Asset Type</th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Classification</th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Tax Rate</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Estimated Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.assetComparison.map((row) => (
                        <tr
                          key={row.asset}
                          className={cn(
                            'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                            row.asset === activeAsset.label && 'bg-brand-50/30'
                          )}
                        >
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                              <span className="font-medium text-primary-700">{row.asset}</span>
                              {row.asset === activeAsset.label && (
                                <span className="text-[9px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">SELECTED</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold',
                              row.classification === 'LTCG'
                                ? 'bg-emerald-100 text-emerald-700'
                                : row.classification === 'STCG'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-purple-100 text-purple-700'
                            )}>
                              {row.classification}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center font-semibold text-blue-700">{row.rate}%</td>
                          <td className="py-3 px-6 text-right font-bold text-red-600">{formatINR(row.tax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax-Saving Tips */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-primary-700">Tax-Saving Tips</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {TAX_TIPS.map((tip, i) => (
                    <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
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
