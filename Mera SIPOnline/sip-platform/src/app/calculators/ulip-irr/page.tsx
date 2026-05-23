'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  TrendingDown,
  Layers,
  Percent,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ─── Mortality table (₹ per ₹1000 Sum-at-Risk / year) — hardcoded ───
const mortalityByAge: Record<number, number> = {
  25: 0.9,
  30: 1.2,
  35: 1.8,
  40: 2.5,
  45: 4.0,
  50: 6.0,
  55: 10.0,
  60: 15.0,
};

function mortRate(age: number): number {
  const ages = Object.keys(mortalityByAge).map(Number).sort((a, b) => a - b);
  if (age <= ages[0]) return mortalityByAge[ages[0]];
  if (age >= ages[ages.length - 1]) {
    // extrapolate linearly beyond 60 using last slope
    const last = ages[ages.length - 1];
    const prev = ages[ages.length - 2];
    const slope = (mortalityByAge[last] - mortalityByAge[prev]) / (last - prev);
    return mortalityByAge[last] + slope * (age - last);
  }
  for (let i = 0; i < ages.length - 1; i++) {
    const lo = ages[i];
    const hi = ages[i + 1];
    if (age >= lo && age <= hi) {
      const frac = (age - lo) / (hi - lo);
      return mortalityByAge[lo] + (mortalityByAge[hi] - mortalityByAge[lo]) * frac;
    }
  }
  return mortalityByAge[ages[0]];
}

// ─── IRR via Newton-Raphson ───
function irr(cashflows: number[]): number {
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const df = Math.pow(1 + rate, t);
      npv += cashflows[t] / df;
      dnpv -= (t * cashflows[t]) / (df * (1 + rate));
    }
    if (Math.abs(npv) < 1e-4) break;
    if (dnpv === 0) break;
    const newRate = rate - npv / dnpv;
    rate = newRate;
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  return rate;
}

const COLORS = {
  alloc: '#F97316',
  fmc: '#DC2626',
  admin: '#8B5CF6',
  mort: '#EA580C',
  gross: '#16A34A',
  net: '#7C3AED',
};

export default function ULIPIRRAnalyzerPage() {
  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(32);

  // Policy inputs
  const [annualPremium, setAnnualPremium] = useState(150000);
  const [ppt, setPpt] = useState(10);
  const [policyTerm, setPolicyTerm] = useState(20);
  const [grossReturn, setGrossReturn] = useState(12);

  // Allocation charges (tiered)
  const [alloc1, setAlloc1] = useState(6);
  const [alloc23, setAlloc23] = useState(4);
  const [alloc45, setAlloc45] = useState(3);
  const [alloc6Plus, setAlloc6Plus] = useState(0);

  // Other charges
  const [fmcPct, setFmcPct] = useState(1.35);
  const [adminFlat, setAdminFlat] = useState(50);
  const [smoker, setSmoker] = useState(false);

  const currentAge = age ?? 32;
  const sumAssured = 10 * annualPremium;

  const result = useMemo(() => {
    const r = grossReturn / 100;
    const fmc = fmcPct / 100;
    const smokerLoad = smoker ? 1.4 : 1;

    let fund = 0;
    let cumAlloc = 0;
    let cumFMC = 0;
    let cumAdmin = 0;
    let cumMort = 0;
    let totalPremium = 0;

    // Gross-only (no charges) shadow fund — same premium schedule, pure gross growth
    let grossFund = 0;

    // IRR cashflows: negative for outflows (premiums), final fundEnd is inflow at terminal year
    const cashflows: number[] = new Array(policyTerm + 1).fill(0);

    const yearly: {
      year: number;
      age: number;
      premium: number;
      allocation: number;
      fmc: number;
      admin: number;
      mortality: number;
      fundEnd: number;
      grossFund: number;
      totalChargesThisYr: number;
    }[] = [];

    for (let y = 1; y <= policyTerm; y++) {
      const yearAge = currentAge + y - 1;
      const premium = y <= ppt ? annualPremium : 0;
      totalPremium += premium;

      // Tiered allocation — only charged on premiums paid (y ≤ PPT)
      let allocRate = 0;
      if (premium > 0) {
        if (y === 1) allocRate = alloc1 / 100;
        else if (y <= 3) allocRate = alloc23 / 100;
        else if (y <= 5) allocRate = alloc45 / 100;
        else allocRate = alloc6Plus / 100;
      }
      const allocation = premium * allocRate;
      const invested = premium - allocation;

      const fundStart = fund + invested;
      const grossReturnYr = fundStart * r;

      // FMC on fund value, admin flat
      const fmcCharge = fundStart * fmc;
      const adminCharge = adminFlat * 12;

      // Mortality — Sum at Risk
      const sar = Math.max(0, sumAssured - fundStart);
      const mortality = (sar / 1000) * mortRate(yearAge) * smokerLoad;

      const fundEnd = fundStart + grossReturnYr - fmcCharge - adminCharge - mortality;
      fund = fundEnd < 0 ? 0 : fundEnd;

      // Gross-only shadow — full premium invested (no allocation), no charges
      grossFund = (grossFund + premium) * (1 + r);

      cumAlloc += allocation;
      cumFMC += fmcCharge;
      cumAdmin += adminCharge;
      cumMort += mortality;

      // Cashflows: IRR convention — premium as negative at year (y-1), maturity at year policyTerm
      if (premium > 0) cashflows[y - 1] -= premium;

      yearly.push({
        year: y,
        age: yearAge,
        premium,
        allocation,
        fmc: fmcCharge,
        admin: adminCharge,
        mortality,
        fundEnd: fund,
        grossFund,
        totalChargesThisYr: allocation + fmcCharge + adminCharge + mortality,
      });
    }

    // Terminal maturity inflow at end of policyTerm
    cashflows[policyTerm] += fund;

    const realizedIRR = irr(cashflows) * 100;
    const totalCharges = cumAlloc + cumFMC + cumAdmin + cumMort;

    // ─── MF alternative: same outlay, TER 1.7%, LTCG 12.5% over ₹1.25L ───
    const ter = 0.017;
    let mfCorpus = 0;
    for (let y = 1; y <= policyTerm; y++) {
      const prem = y <= ppt ? annualPremium : 0;
      mfCorpus = (mfCorpus + prem) * (1 + r - ter);
    }
    const mfGain = Math.max(0, mfCorpus - totalPremium);
    const mfTax = Math.max(0, mfGain - 125000) * 0.125;
    const mfPostTax = mfCorpus - mfTax;
    const mfDelta = mfPostTax - fund;

    return {
      yearly,
      cumAlloc,
      cumFMC,
      cumAdmin,
      cumMort,
      totalCharges,
      totalPremium,
      finalFund: fund,
      realizedIRR,
      grossFund,
      mfPostTax,
      mfDelta,
    };
  }, [
    annualPremium,
    ppt,
    policyTerm,
    grossReturn,
    alloc1,
    alloc23,
    alloc45,
    alloc6Plus,
    fmcPct,
    adminFlat,
    smoker,
    currentAge,
    sumAssured,
  ]);

  // Color-code IRR
  const irrColor =
    result.realizedIRR >= 10
      ? 'text-green-700'
      : result.realizedIRR >= 7
        ? 'text-amber-600'
        : 'text-red-600';
  const irrBg =
    result.realizedIRR >= 10
      ? 'from-green-50 to-emerald-50 border-green-200'
      : result.realizedIRR >= 7
        ? 'from-amber-50 to-orange-50 border-amber-200'
        : 'from-red-50 to-rose-50 border-red-200';
  const irrBand =
    result.realizedIRR >= 10
      ? 'Healthy — close to equity MF trajectory'
      : result.realizedIRR >= 7
        ? 'Mediocre — charges eating meaningful returns'
        : 'Poor — charges crushing your compounding';

  // Charge stack bar chart data
  const chargeBarData = result.yearly.map((row) => ({
    year: `Y${row.year}`,
    Allocation: Math.round(row.allocation),
    FMC: Math.round(row.fmc),
    Admin: Math.round(row.admin),
    Mortality: Math.round(row.mortality),
  }));

  // Line chart — gross vs net
  const lineData = result.yearly.map((row) => ({
    year: `Y${row.year}`,
    'Gross (no charges)': Math.round(row.grossFund),
    'Net (with charges)': Math.round(row.fundEnd),
  }));

  // Pie/breakdown data
  const breakdownData = [
    { name: 'Allocation', value: Math.round(result.cumAlloc), fill: COLORS.alloc },
    { name: 'FMC', value: Math.round(result.cumFMC), fill: COLORS.fmc },
    { name: 'Admin', value: Math.round(result.cumAdmin), fill: COLORS.admin },
    { name: 'Mortality', value: Math.round(result.cumMort), fill: COLORS.mort },
  ];
  const maxBreakdown = Math.max(...breakdownData.map((d) => d.value), 1);

  // Insights
  const chargesPctOfPremium = (result.totalCharges / result.totalPremium) * 100;
  const earlyYrsCharges = result.yearly
    .slice(0, 5)
    .reduce((s, r) => s + r.totalChargesThisYr, 0);
  const earlyYrsPct = (earlyYrsCharges / result.totalCharges) * 100;
  const lastYearMort = result.yearly[result.yearly.length - 1]?.mortality || 0;
  const firstYearMort = result.yearly[0]?.mortality || 1;
  const mortMultiplier = lastYearMort / Math.max(firstYearMort, 1);

  const resultContext = `ULIP realized IRR ${result.realizedIRR.toFixed(2)}%, MF alternative delta ${formatINR(result.mfDelta)}`;

  return (
    <>
      {/* Hero */}
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
              <AlertCircle className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">ULIP IRR Analyzer</h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                Decode what your ULIP actually earns — after ALL 4 charges (allocation, FMC,
                admin, mortality).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <PersonalInfoBar name={name} onNameChange={setName} age={age} onAgeChange={setAge} />
            <DownloadPDFButton
              elementId="calculator-results"
              title="ULIP IRR Analysis"
              fileName={`ULIP-IRR-${name || 'Analysis'}`}
            />
          </div>

          <div
            id="calculator-results"
            className="grid lg:grid-cols-[420px_1fr] gap-8"
          >
            {/* ─── INPUTS ─── */}
            <div className="card-base p-5 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <div>
                <h2 className="font-bold text-primary-700 text-lg mb-1">Policy Details</h2>
                <p className="text-xs text-slate-500">
                  Input your ULIP terms — we simulate year-by-year.
                </p>
              </div>

              <div className="space-y-4">
                <NumberInput
                  label="Annual Premium"
                  value={annualPremium}
                  onChange={setAnnualPremium}
                  prefix="₹"
                  step={10000}
                  min={12000}
                  max={5000000}
                />
                <NumberInput
                  label="Premium Paying Term (PPT)"
                  value={ppt}
                  onChange={setPpt}
                  suffix="Years"
                  step={1}
                  min={5}
                  max={30}
                />
                <NumberInput
                  label="Policy Term"
                  value={policyTerm}
                  onChange={setPolicyTerm}
                  suffix="Years"
                  step={1}
                  min={10}
                  max={40}
                />

                {/* Sum Assured (auto) */}
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
                      Sum Assured (auto)
                    </div>
                    <div className="text-[10px] text-slate-500">10 × Annual Premium</div>
                  </div>
                  <div className="text-sm font-extrabold text-violet-700">
                    {formatINR(sumAssured)}
                  </div>
                </div>

                <NumberInput
                  label="Gross Equity Return (assumed)"
                  value={grossReturn}
                  onChange={setGrossReturn}
                  suffix="% p.a."
                  step={0.5}
                  min={6}
                  max={15}
                />
              </div>

              {/* Allocation charges */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                  Premium Allocation Charges
                </label>
                <div className="space-y-3">
                  <NumberInput
                    label="Year 1"
                    value={alloc1}
                    onChange={setAlloc1}
                    suffix="%"
                    step={0.5}
                    min={0}
                    max={15}
                  />
                  <NumberInput
                    label="Years 2–3"
                    value={alloc23}
                    onChange={setAlloc23}
                    suffix="%"
                    step={0.5}
                    min={0}
                    max={15}
                  />
                  <NumberInput
                    label="Years 4–5"
                    value={alloc45}
                    onChange={setAlloc45}
                    suffix="%"
                    step={0.5}
                    min={0}
                    max={15}
                  />
                  <NumberInput
                    label="Year 6+"
                    value={alloc6Plus}
                    onChange={setAlloc6Plus}
                    suffix="%"
                    step={0.5}
                    min={0}
                    max={10}
                  />
                </div>
              </div>

              {/* FMC, Admin, Smoker */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                  Recurring Charges
                </label>
                <div className="space-y-3">
                  <NumberInput
                    label="FMC (Fund Management)"
                    value={fmcPct}
                    onChange={setFmcPct}
                    suffix="% p.a."
                    step={0.05}
                    min={0.5}
                    max={2.5}
                    hint="IRDAI cap 1.35% for equity"
                  />
                  <NumberInput
                    label="Policy Admin"
                    value={adminFlat}
                    onChange={setAdminFlat}
                    prefix="₹"
                    suffix="/month"
                    step={10}
                    min={0}
                    max={500}
                  />
                </div>

                {/* Smoker toggle */}
                <div className="mt-4 p-3 rounded-lg border border-surface-300 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-primary-700">Smoker</div>
                    <div className="text-[10px] text-slate-500">
                      Mortality × 1.4 loading applies
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={smoker}
                    onClick={() => setSmoker(!smoker)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      smoker ? 'bg-red-500' : 'bg-surface-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        smoker ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── RESULTS ─── */}
            <div className="space-y-6">
              {/* Hero IRR Card */}
              <div
                className={cn(
                  'rounded-2xl p-6 border bg-gradient-to-br',
                  irrBg
                )}
                data-pdf-keep-together
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={cn('w-4 h-4', irrColor)} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Realized IRR (Your Actual Return)
                  </span>
                </div>
                <div className={cn('text-5xl font-extrabold mb-2', irrColor)}>
                  {result.realizedIRR.toFixed(2)}%
                </div>
                <div className="text-sm text-slate-600 mb-3">{irrBand}</div>
                <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-white/50">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Gross → Net Drag
                    </div>
                    <div className="text-sm font-bold text-primary-700">
                      {grossReturn.toFixed(1)}% → {result.realizedIRR.toFixed(2)}%{' '}
                      <span className="text-red-600">
                        (−{(grossReturn - result.realizedIRR).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Total Charges Paid
                    </div>
                    <div className="text-sm font-bold text-red-700">
                      {formatINR(result.totalCharges)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metric Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-pdf-keep-together>
                <div className="card-base p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Final Fund Value
                  </div>
                  <div className="text-lg font-extrabold text-primary-700">
                    {formatINR(result.finalFund)}
                  </div>
                </div>
                <div className="card-base p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Total Premiums
                  </div>
                  <div className="text-lg font-extrabold text-primary-700">
                    {formatINR(result.totalPremium)}
                  </div>
                </div>
                <div className="card-base p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Total Charges
                  </div>
                  <div className="text-lg font-extrabold text-red-600">
                    {formatINR(result.totalCharges)}
                  </div>
                </div>
                <div className="card-base p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Realized IRR
                  </div>
                  <div className={cn('text-lg font-extrabold', irrColor)}>
                    {result.realizedIRR.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Stacked bar — yearly charges */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-violet-600" />
                  <h3 className="font-bold text-primary-700">Yearly Charges Breakdown</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Stacked — see how charges shift year over year.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chargeBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Allocation" stackId="a" fill={COLORS.alloc} />
                      <Bar dataKey="FMC" stackId="a" fill={COLORS.fmc} />
                      <Bar dataKey="Admin" stackId="a" fill={COLORS.admin} />
                      <Bar dataKey="Mortality" stackId="a" fill={COLORS.mort} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line chart — gross vs net */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-primary-700">Gross Growth vs Net Fund Value</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  The gap between the two lines IS your charges compounding away.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="Gross (no charges)"
                        stroke={COLORS.gross}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Net (with charges)"
                        stroke={COLORS.net}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charges breakdown */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-orange-600" />
                  <h3 className="font-bold text-primary-700">Cumulative Charges Breakdown</h3>
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  Where every rupee of charges went over {policyTerm} years.
                </p>
                <div className="space-y-3">
                  {breakdownData.map((row) => {
                    const pct = (row.value / maxBreakdown) * 100;
                    const pctOfTotal = result.totalCharges > 0 ? (row.value / result.totalCharges) * 100 : 0;
                    return (
                      <div key={row.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: row.fill }}
                            />
                            <span className="text-sm font-semibold text-primary-700">
                              {row.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({pctOfTotal.toFixed(1)}%)
                            </span>
                          </div>
                          <span className="text-sm font-bold text-red-700">
                            {formatINR(row.value)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: row.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-surface-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Total Charges</span>
                  <span className="text-lg font-extrabold text-red-700">
                    {formatINR(result.totalCharges)}
                  </span>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-200">
                    <Percent className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Total charges of {formatINR(result.totalCharges)} equal{' '}
                      <strong>{chargesPctOfPremium.toFixed(1)}% of all premiums paid</strong>. Every
                      rupee paid in charges is a rupee that never compounded for your goals.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-orange-50 border-orange-200">
                    <TrendingDown className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Mortality charge rose{' '}
                      <strong>{mortMultiplier.toFixed(1)}× from Year 1 to Year {policyTerm}</strong>{' '}
                      as you aged from {currentAge} to {currentAge + policyTerm - 1}. Insurance
                      inside a ULIP gets more expensive every year, silently.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200">
                    <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      The first 5 years alone accounted for{' '}
                      <strong>{earlyYrsPct.toFixed(0)}% of total charges</strong> —{' '}
                      {formatINR(earlyYrsCharges)}. Early-year drag hurts most because it robs your
                      largest compounding years.
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border',
                      result.mfDelta > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <Zap
                      className={cn(
                        'w-5 h-5 shrink-0 mt-0.5',
                        result.mfDelta > 0 ? 'text-green-600' : 'text-slate-600'
                      )}
                    />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Same outlay in a regular-plan equity MF (TER 1.7%) would have matured at{' '}
                      <strong>{formatINR(result.mfPostTax)}</strong> post-tax — a{' '}
                      <strong
                        className={
                          result.mfDelta > 0 ? 'text-green-700' : 'text-slate-700'
                        }
                      >
                        {result.mfDelta > 0 ? '+' : ''}
                        {formatINR(result.mfDelta)}
                      </strong>{' '}
                      delta vs this ULIP. Add a separate term plan for actual life cover.
                    </p>
                  </div>
                </div>
              </div>

              {/* CFP Note */}
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-violet-50 border border-violet-200"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-1">
                      CFP Note
                    </div>
                    <h4 className="text-lg font-extrabold text-primary-700 mb-2">
                      IRR is the only honest ULIP metric.
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Agents sell ULIPs by quoting fund NAV returns or "gross" illustrations. But
                      your real return is the IRR — the discount rate that ties your actual outflows
                      (premiums) to your final inflow (maturity). For this policy, the gap between
                      the {grossReturn}% gross return and your {result.realizedIRR.toFixed(2)}%
                      realized IRR is{' '}
                      <strong>
                        {(grossReturn - result.realizedIRR).toFixed(2)} percentage points of lost
                        compounding every single year
                      </strong>{' '}
                      — that is the real cost of bundling insurance with investment.
                      {name ? ` ${name}, ` : ' '}before renewing or buying a ULIP, run the IRR —
                      then compare with a term-plan + MF split.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <CalculatorLeadForm
        calculatorName="ULIP IRR Analyzer"
        heading="Already holding a ULIP? Let us run your actual policy through the IRR lens."
        subtext="Share your contact — we will decode your specific policy's charges and benefit illustration, and show you the real IRR + a term + MF alternative. AMFI-registered Mutual Fund Distributor (ARN-286886), zero obligation."
        resultContext={resultContext}
        accent="violet"
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund} ULIP charges used here are typical
            industry averages — actual policy charges vary by insurer, product, age, and fund
            option. Mortality rates shown are illustrative for a healthy non-smoker (smoker loading
            1.4×). Use your policy benefit illustration for exact figures.
          </p>
        </div>
      </section>
    </>
  );
}
