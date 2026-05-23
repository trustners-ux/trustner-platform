'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Shield, Percent, AlertTriangle, Target } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ── Helpers ──────────────────────────────────────────────────────────────

function randn(): number {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random() || 1e-10;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

interface SimResult {
  survived: boolean;
  final: number;
  trajectory: number[];
}

function simulateOnce(
  corpus: number,
  swr: number,
  horizon: number,
  equityPct: number,
  eMu: number,
  eSig: number,
  dMu: number,
  dSig: number,
  inflation: number,
  randomize: boolean,
  firstTwoYearOverride?: [number, number],
): SimResult {
  let balance = corpus;
  const withdrawYear1 = (corpus * swr) / 100;
  const trajectory = [balance];
  for (let y = 1; y <= horizon; y++) {
    const w = withdrawYear1 * Math.pow(1 + inflation / 100, y - 1);
    balance -= w;
    if (balance <= 0) {
      trajectory.push(0);
      for (let j = y + 1; j <= horizon; j++) trajectory.push(0);
      return { survived: false, final: 0, trajectory };
    }
    let portReturn: number;
    if (firstTwoYearOverride && y <= 2) {
      portReturn = firstTwoYearOverride[y - 1];
    } else {
      const eR = randomize ? eMu / 100 + (eSig / 100) * randn() : eMu / 100;
      const dR = randomize ? dMu / 100 + (dSig / 100) * randn() : dMu / 100;
      portReturn = (equityPct / 100) * eR + ((100 - equityPct) / 100) * dR;
    }
    balance *= 1 + portReturn;
    trajectory.push(Math.max(0, balance));
  }
  return { survived: balance > 0, final: balance, trajectory };
}

const ALLOCATION_PILLS: { label: string; equity: number }[] = [
  { label: '20/80', equity: 20 },
  { label: '50/50', equity: 50 },
  { label: '70/30', equity: 70 },
  { label: '90/10', equity: 90 },
];

const SWR_CANDIDATES: number[] = (() => {
  const arr: number[] = [];
  for (let s = 2.5; s <= 6 + 1e-9; s += 0.25) arr.push(Math.round(s * 100) / 100);
  return arr;
})();

// ── Page ────────────────────────────────────────────────────────────────

export default function SafeWithdrawalRatePage() {
  // Inputs
  const [clientName, setClientName] = useState('');
  const [retirementAge, setRetirementAge] = useState<number | null>(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [corpus, setCorpus] = useState(20000000);
  const [inflation, setInflation] = useState(6);
  const [equityPct, setEquityPct] = useState(50);
  const [eReturn, setEReturn] = useState(12);
  const [eVol, setEVol] = useState(20);
  const [dReturn, setDReturn] = useState(6.5);
  const [dVol, setDVol] = useState(3);
  const [mcEnabled, setMcEnabled] = useState(true);
  const MC_RUNS = 100;

  const horizon = Math.max(1, lifeExpectancy - (retirementAge ?? 60));

  // ── Main Calc ──
  const calc = useMemo(() => {
    // Deterministic sweep
    const determRows = SWR_CANDIDATES.map(swr => {
      const r = simulateOnce(corpus, swr, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation, false);
      return { swr, survived: r.survived, final: r.final };
    });
    const highestDeterm = [...determRows].reverse().find(r => r.survived)?.swr ?? SWR_CANDIDATES[0];

    // Monte Carlo sweep
    let mcTable: { swr: number; successPct: number; survivors: number }[] = [];
    let recommendedMC = highestDeterm;
    let bestRunsAtRecommended: SimResult[] = [];

    if (mcEnabled) {
      mcTable = SWR_CANDIDATES.map(swr => {
        let survivors = 0;
        for (let i = 0; i < MC_RUNS; i++) {
          const r = simulateOnce(corpus, swr, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation, true);
          if (r.survived) survivors++;
        }
        return { swr, survivors, successPct: Math.round((survivors / MC_RUNS) * 100) };
      });
      const candidates = [...mcTable].reverse().find(r => r.successPct >= 90);
      recommendedMC = candidates?.swr ?? mcTable.find(r => r.successPct >= 90)?.swr ?? SWR_CANDIDATES[0];

      // Re-run MC at recommended SWR to capture trajectories
      for (let i = 0; i < MC_RUNS; i++) {
        bestRunsAtRecommended.push(
          simulateOnce(corpus, recommendedMC, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation, true),
        );
      }
    }

    const recommendedSWR = mcEnabled ? recommendedMC : highestDeterm;

    // Percentile trajectories (median / 5th / 95th) at recommended SWR
    let medianTraj: number[] = [];
    let p5Traj: number[] = [];
    let p95Traj: number[] = [];

    if (mcEnabled && bestRunsAtRecommended.length > 0) {
      const maxLen = horizon + 1;
      for (let t = 0; t < maxLen; t++) {
        const vals = bestRunsAtRecommended
          .map(r => r.trajectory[t] ?? 0)
          .sort((a, b) => a - b);
        p5Traj.push(vals[Math.floor(0.05 * vals.length)] ?? 0);
        medianTraj.push(vals[Math.floor(0.5 * vals.length)] ?? 0);
        p95Traj.push(vals[Math.floor(0.95 * vals.length)] ?? 0);
      }
    }

    const annualWithdrawal = (corpus * recommendedSWR) / 100;
    const monthlyWithdrawal = annualWithdrawal / 12;
    const fourPctMonthly = (corpus * 0.04) / 12;
    const successProbability = mcEnabled
      ? mcTable.find(r => Math.abs(r.swr - recommendedSWR) < 1e-6)?.successPct ?? 0
      : null;

    // Sequence risk demo (bad start: -15%/+20% then normal; good start: +20%/-15% then normal)
    const badStart = simulateOnce(
      corpus, recommendedSWR, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation,
      false, [-0.15, 0.20],
    );
    const goodStart = simulateOnce(
      corpus, recommendedSWR, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation,
      false, [0.20, -0.15],
    );

    return {
      determRows,
      mcTable,
      recommendedSWR,
      annualWithdrawal,
      monthlyWithdrawal,
      fourPctMonthly,
      successProbability,
      medianTraj,
      p5Traj,
      p95Traj,
      badStart: badStart.trajectory,
      goodStart: goodStart.trajectory,
    };
  }, [corpus, horizon, equityPct, eReturn, eVol, dReturn, dVol, inflation, mcEnabled]);

  // Chart data
  const percentileChartData = calc.medianTraj.map((_, idx) => ({
    year: idx,
    age: (retirementAge ?? 60) + idx,
    p5: Math.round(calc.p5Traj[idx]),
    median: Math.round(calc.medianTraj[idx]),
    p95: Math.round(calc.p95Traj[idx]),
  }));

  const successChartData = (mcEnabled ? calc.mcTable : calc.determRows.map(r => ({
    swr: r.swr,
    successPct: r.survived ? 100 : 0,
  }))).map(r => ({
    swr: `${r.swr}%`,
    successPct: 'successPct' in r ? r.successPct : 0,
  }));

  const sequenceChartData = calc.badStart.map((_, idx) => ({
    age: (retirementAge ?? 60) + idx,
    bad: Math.round(calc.badStart[idx]),
    good: Math.round(calc.goodStart[idx]),
  }));

  const resultCtx = `SWR ${calc.recommendedSWR}%, monthly ${Math.round(calc.monthlyWithdrawal / 1000)}K sustainable for ${horizon}y`;

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">
                Professional-Grade Tool
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                Safe Withdrawal Rate Calculator
              </h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                India-calibrated SWR with Monte Carlo confidence intervals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar
              name={clientName}
              onNameChange={setClientName}
              age={retirementAge}
              onAgeChange={setRetirementAge}
              ageLabel="Retirement Age"
              namePlaceholder="e.g., Priya"
            />
            <DownloadPDFButton
              elementId="calculator-results"
              title="Safe Withdrawal Rate Report"
              fileName={`SWR-${clientName || 'Plan'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ═══════ LEFT: INPUTS ═══════ */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">
              {/* Client + Horizon */}
              <div className="border-t-4 border-teal-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" /> Retirement Horizon
                </h3>
                <div className="space-y-3">
                  <NumberInput
                    label="Retirement Age"
                    value={retirementAge ?? 60}
                    onChange={v => setRetirementAge(v)}
                    suffix="years"
                    step={1}
                    min={55}
                    max={70}
                  />
                  <NumberInput
                    label="Life Expectancy"
                    value={lifeExpectancy}
                    onChange={setLifeExpectancy}
                    suffix="years"
                    step={1}
                    min={75}
                    max={100}
                  />
                  <div className="px-3 py-2.5 rounded-lg bg-teal-50 border border-teal-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-700">Planning Horizon</span>
                      <span className="font-bold text-teal-800">{horizon} years</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corpus + Inflation */}
              <div className="border-t-4 border-emerald-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Corpus & Inflation
                </h3>
                <div className="space-y-3">
                  <NumberInput
                    label="Starting Corpus"
                    value={corpus}
                    onChange={setCorpus}
                    prefix="Rs."
                    step={500000}
                    min={1000000}
                    max={500000000}
                  />
                  <NumberInput
                    label="Inflation"
                    value={inflation}
                    onChange={setInflation}
                    suffix="% p.a."
                    step={0.5}
                    min={4}
                    max={8}
                  />
                </div>
              </div>

              {/* Allocation */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" /> Equity / Debt Allocation
                </h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {ALLOCATION_PILLS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setEquityPct(p.equity)}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-semibold border-2 transition-all',
                        equityPct === p.equity
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Current: <span className="font-semibold text-amber-700">{equityPct}% equity</span> / {100 - equityPct}% debt
                </p>
              </div>

              {/* Return assumptions */}
              <div className="border-t-4 border-brand rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand" /> Return Assumptions
                </h3>
                <div className="space-y-3">
                  <NumberInput label="Equity Return" value={eReturn} onChange={setEReturn} suffix="%" step={0.5} min={6} max={15} />
                  <NumberInput label="Equity Volatility" value={eVol} onChange={setEVol} suffix="%" step={1} min={10} max={30} />
                  <NumberInput label="Debt Return" value={dReturn} onChange={setDReturn} suffix="%" step={0.5} min={4} max={9} />
                  <NumberInput label="Debt Volatility" value={dVol} onChange={setDVol} suffix="%" step={0.5} min={1} max={6} />
                </div>
              </div>

              {/* Monte Carlo toggle */}
              <div className="border-t-4 border-slate-400 rounded-xl bg-white p-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setMcEnabled(!mcEnabled)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-slate-700">Monte Carlo Simulation</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {mcEnabled ? `Running ${MC_RUNS} random paths per SWR` : 'Using deterministic single-path estimate'}
                    </div>
                  </div>
                  <div className={cn(
                    'relative w-10 h-5 rounded-full transition-colors shrink-0',
                    mcEnabled ? 'bg-brand' : 'bg-slate-300',
                  )}>
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      mcEnabled ? 'translate-x-5' : 'translate-x-0.5',
                    )} />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT: RESULTS ═══════ */}
            <div className="space-y-6">
              {/* Hero result */}
              <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-bold tracking-wider uppercase text-teal-700">
                    {clientName ? `${clientName}'s ` : ''}Recommended Safe Withdrawal Rate
                  </span>
                </div>
                <div className="text-5xl sm:text-6xl font-extrabold text-teal-800 leading-none mb-3">
                  {calc.recommendedSWR.toFixed(2)}%
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <div className="rounded-xl bg-white border border-teal-100 p-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Annual Withdrawal</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">{formatINR(calc.annualWithdrawal)}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-teal-100 p-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Monthly Withdrawal</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">{formatINR(calc.monthlyWithdrawal)}</div>
                  </div>
                  {mcEnabled && calc.successProbability !== null && (
                    <div className={cn(
                      'rounded-xl border p-3',
                      calc.successProbability >= 90 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
                    )}>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Success Probability</div>
                      <div className={cn(
                        'text-lg font-bold mt-1',
                        calc.successProbability >= 90 ? 'text-emerald-700' : 'text-amber-700',
                      )}>
                        {calc.successProbability}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison vs 4% rule */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-3">India-Calibrated SWR vs US 4% Rule</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">US 4% Rule</div>
                    <div className="text-2xl font-bold text-slate-700">{formatINR(calc.fourPctMonthly)}/mo</div>
                    <p className="text-[11px] text-slate-400 mt-2">Based on Bengen (1994), US equities, 2-3% inflation.</p>
                  </div>
                  <div className="rounded-xl border border-teal-300 bg-teal-50 p-4">
                    <div className="text-xs font-semibold text-teal-700 mb-1">India-Calibrated SWR ({calc.recommendedSWR.toFixed(2)}%)</div>
                    <div className="text-2xl font-bold text-teal-800">{formatINR(calc.monthlyWithdrawal)}/mo</div>
                    <p className="text-[11px] text-teal-600 mt-2">Based on {inflation}% inflation, {eReturn}% equity, {dReturn}% debt.</p>
                  </div>
                </div>
              </div>

              {/* Percentile trajectories (MC only) */}
              {mcEnabled && percentileChartData.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-1">Corpus Trajectory — Monte Carlo Percentiles</h3>
                  <p className="text-[11px] text-slate-500 mb-4">
                    95th percentile (lucky), median, and 5th percentile (unlucky) out of {MC_RUNS} random return paths.
                  </p>
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={percentileChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatINR(v)} />
                        <Tooltip formatter={(v: number) => formatINR(v)} labelFormatter={(l: number) => `Age ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="p95" stroke="#059669" strokeWidth={2} dot={false} name="95th (lucky)" />
                        <Line type="monotone" dataKey="median" stroke="#0891B2" strokeWidth={2} dot={false} name="Median" />
                        <Line type="monotone" dataKey="p5" stroke="#DC2626" strokeWidth={2} dot={false} name="5th (unlucky)" />
                        <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Success rate by SWR */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-1">Success Rate by Withdrawal Rate</h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  {mcEnabled
                    ? `Probability your corpus survives ${horizon} years at each SWR (out of ${MC_RUNS} runs).`
                    : 'Deterministic: did the corpus survive at each SWR?'}
                </p>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={successChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="swr" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <ReferenceLine y={90} stroke="#10B981" strokeDasharray="3 3" label={{ value: '90% threshold', fontSize: 10, fill: '#10B981', position: 'right' }} />
                      <Bar dataKey="successPct" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sequence risk demo */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Sequence-of-Returns Risk
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Two retirees withdraw at the same SWR ({calc.recommendedSWR.toFixed(2)}%) with the same average returns — but the order differs. Bad early years can destroy a plan.
                </p>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sequenceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatINR(v)} />
                      <Tooltip formatter={(v: number) => formatINR(v)} labelFormatter={(l: number) => `Age ${l}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="good" stroke="#10B981" strokeWidth={2} dot={false} name="Good start (+20%/-15%)" />
                      <Line type="monotone" dataKey="bad" stroke="#DC2626" strokeWidth={2} dot={false} name="Bad start (-15%/+20%)" />
                      <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Key Insights</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InsightCard
                    tone="blue"
                    title="India SWR < US 4% rule"
                    body={`Your SWR ${calc.recommendedSWR.toFixed(2)}% is ${calc.recommendedSWR < 4 ? 'below' : 'near'} the US 4% rule because India inflation (${inflation}%) runs ~2-3× higher than US (2-3%), eating corpus faster.`}
                  />
                  <InsightCard
                    tone="amber"
                    title="Allocation matters"
                    body="Shifting from 50/50 to 70/30 typically raises the sustainable SWR by ~0.5% but increases portfolio volatility — expect bigger drawdowns in bad years."
                  />
                  <InsightCard
                    tone="violet"
                    title="Horizon drives SWR"
                    body="Longer horizon = lower safe SWR. A 30-year retirement needs roughly 0.5% lower SWR than a 20-year retirement because compounding of withdrawals is unforgiving."
                  />
                  <InsightCard
                    tone="red"
                    title="Sequence risk is real"
                    body="Bad returns in the first 2-3 retirement years (sequence risk) can shorten portfolio lifespan by 8-12 years versus the same returns in reverse order."
                  />
                </div>
              </div>

              {/* CFP Note */}
              <div className="rounded-xl border-l-4 border-brand bg-brand-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-brand-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-1">CFP Note — India vs US SWR</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bengen's classic 4% rule was built on US data with ~2-3% inflation and a 60/40 portfolio. India's higher inflation ({inflation}%) and different return-volatility profile push the sustainable rate lower — typically 3.0–3.75% for conservative retirees over 30-year horizons. This calculator Monte-Carlos your actual corpus against India-calibrated assumptions. Pair it with a bucket strategy and Guyton-Klinger guardrails (cut withdrawals 10% in bad years) for resilience. Talk to a SEBI-registered CFP before locking a withdrawal plan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead form */}
              <CalculatorLeadForm
                calculatorName="Safe Withdrawal Rate"
                accent="teal"
                resultContext={resultCtx}
              />

              {/* Disclaimer */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {DISCLAIMER.mutual_fund} Monte Carlo simulations illustrate a range of possible outcomes based on historical-style assumptions; they do not predict future returns. Consult a SEBI-registered investment advisor or CFP before implementing any withdrawal plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Insight Card ────────────────────────────────────────────────────────

function InsightCard({
  tone, title, body,
}: {
  tone: 'blue' | 'amber' | 'violet' | 'red';
  title: string;
  body: string;
}) {
  const map = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  }[tone];
  return (
    <div className={cn('rounded-xl border p-4', map.bg, map.border)}>
      <div className={cn('text-sm font-bold mb-1', map.text)}>{title}</div>
      <div className={cn('text-xs leading-relaxed', map.text, 'opacity-80')}>{body}</div>
    </div>
  );
}
