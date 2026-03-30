'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Sprout, Wallet, Lightbulb } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { calculateLifeStage, LifeStageStepUpConfig } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const PHASE_COLORS = {
  invest: { primary: '#0F766E', light: '#CCFBF1', bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', badge: 'bg-brand-100 text-brand-700', fill: '#14B8A6' },
  grow: { primary: '#E8553A', light: '#FEE2E2', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', fill: '#14B8A6' },
  withdraw: { primary: '#D97706', light: '#FEF3C7', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', fill: '#D4A017' },
};

export default function LifeStageCalculatorPage() {
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  const [monthlySIP, setMonthlySIP] = useState(15000);
  const [investYears, setInvestYears] = useState(10);
  const [investReturn, setInvestReturn] = useState(12);

  const [growYears, setGrowYears] = useState(10);

  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(50000);
  const [withdrawYears, setWithdrawYears] = useState(15);
  const [withdrawReturn, setWithdrawReturn] = useState(8);

  const [investmentMode, setInvestmentMode] = useState<'constant' | 'step-up'>('constant');
  const [stepUpType, setStepUpType] = useState<'amount' | 'percentage'>('percentage');
  const [stepUpValue, setStepUpValue] = useState(10);

  const [withdrawalMode, setWithdrawalMode] = useState<'constant' | 'incremental'>('constant');
  const [withdrawIncrementType, setWithdrawIncrementType] = useState<'amount' | 'percentage'>('percentage');
  const [withdrawIncrementValue, setWithdrawIncrementValue] = useState(5);

  const stepUpConfig: LifeStageStepUpConfig = {
    investmentMode,
    stepUpType: investmentMode === 'step-up' ? stepUpType : undefined,
    stepUpValue: investmentMode === 'step-up' ? stepUpValue : undefined,
    withdrawalMode,
    withdrawIncrementType: withdrawalMode === 'incremental' ? withdrawIncrementType : undefined,
    withdrawIncrementValue: withdrawalMode === 'incremental' ? withdrawIncrementValue : undefined,
  };

  const result = useMemo(
    () => calculateLifeStage(monthlySIP, investReturn, investYears, growYears, withdrawReturn, monthlyWithdrawal, withdrawYears, stepUpConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthlySIP, investReturn, investYears, growYears, withdrawReturn, monthlyWithdrawal, withdrawYears,
     investmentMode, stepUpType, stepUpValue, withdrawalMode, withdrawIncrementType, withdrawIncrementValue]
  );

  const totalYears = investYears + growYears + withdrawYears;
  const phase1End = investYears;
  const phase2End = investYears + growYears;

  const chartData = result.yearlyBreakdown.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year - 1}` : `Yr ${row.year}`,
    yearNum: row.year,
    corpus: row.corpus,
    invested: row.invested,
    withdrawn: row.withdrawn,
    phase: row.phase,
    investCorpus: row.phase === 'invest' ? row.corpus : undefined,
    growCorpus: row.phase === 'grow' ? row.corpus : undefined,
    withdrawCorpus: row.phase === 'withdraw' ? row.corpus : undefined,
  }));

  if (chartData.length > 0) {
    const phase1LastIdx = phase1End - 1;
    const phase2LastIdx = phase2End - 1;
    if (phase1LastIdx >= 0 && phase1LastIdx < chartData.length && phase1LastIdx + 1 < chartData.length) {
      chartData[phase1LastIdx + 1].investCorpus = chartData[phase1LastIdx].corpus;
    }
    if (phase2LastIdx >= 0 && phase2LastIdx < chartData.length && phase2LastIdx + 1 < chartData.length) {
      chartData[phase2LastIdx + 1].growCorpus = chartData[phase2LastIdx].corpus;
    }
  }

  const wealthMultiplier = result.phase1_totalInvested > 0
    ? (result.phase2_corpusAtEnd / result.phase1_totalInvested).toFixed(1)
    : '0';

  return (
    <>
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Life-Stage Planner</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Hybrid Life-Stage Calculator</h1>
              <p className="text-slate-300 mt-1">Plan your complete investment lifecycle &mdash; Invest, Let it Grow, Then Withdraw. Because life is dynamic.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Your Life Stages</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Aryan"
              />

              {/* PHASE 1: Invest */}
              <div className={cn('rounded-xl border p-4 mb-5', PHASE_COLORS.invest.border, PHASE_COLORS.invest.bg)}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', PHASE_COLORS.invest.badge)}>
                    <TrendingUp className="w-3.5 h-3.5" /> Phase 1
                  </span>
                  <span className="text-sm font-semibold text-slate-700">Investment Period</span>
                </div>

                <div className="space-y-4">
                  <NumberInput label="Monthly SIP Amount" value={monthlySIP} onChange={setMonthlySIP} prefix="₹" step={500} min={500} max={200000} />
                  <NumberInput label="Investment Duration" value={investYears} onChange={setInvestYears} suffix="Years" step={1} min={1} max={30} />
                  <NumberInput label="Expected Return (Growth Phase)" value={investReturn} onChange={setInvestReturn} suffix="% p.a." step={0.5} min={1} max={25} />

                  <div className="pt-3 border-t border-brand-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600">SIP Mode</label>
                      <button
                        role="switch"
                        aria-checked={investmentMode === 'step-up'}
                        onClick={() => setInvestmentMode(investmentMode === 'constant' ? 'step-up' : 'constant')}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          investmentMode === 'step-up' ? 'bg-brand-500' : 'bg-slate-300'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                          investmentMode === 'step-up' ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">
                      {investmentMode === 'constant' ? 'Fixed SIP every month' : 'SIP increases annually'}
                    </div>

                    {investmentMode === 'step-up' && (
                      <div className="space-y-3 animate-in">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setStepUpType('percentage')}
                            className={cn(
                              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                              stepUpType === 'percentage'
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                            )}
                          >
                            Percentage +%
                          </button>
                          <button
                            onClick={() => setStepUpType('amount')}
                            className={cn(
                              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                              stepUpType === 'amount'
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                            )}
                          >
                            Fixed +₹
                          </button>
                        </div>

                        <NumberInput
                          label={stepUpType === 'percentage' ? 'Annual Increase' : 'Annual Increase Amount'}
                          value={stepUpValue}
                          onChange={setStepUpValue}
                          prefix={stepUpType === 'amount' ? '₹' : undefined}
                          suffix={stepUpType === 'percentage' ? '%' : undefined}
                          step={stepUpType === 'percentage' ? 1 : 500}
                          min={stepUpType === 'percentage' ? 1 : 500}
                          max={stepUpType === 'percentage' ? 50 : 10000}
                        />

                        <div className="text-[10px] text-brand-600 bg-brand-50 rounded-lg px-3 py-2">
                          Yr 1: {formatINR(monthlySIP)} → Yr {Math.min(investYears, 5)}:{' '}
                          {formatINR(
                            stepUpType === 'percentage'
                              ? monthlySIP * Math.pow(1 + stepUpValue / 100, Math.min(investYears, 5) - 1)
                              : monthlySIP + stepUpValue * (Math.min(investYears, 5) - 1)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PHASE 2: Grow */}
              <div className={cn('rounded-xl border p-4 mb-5', PHASE_COLORS.grow.border, PHASE_COLORS.grow.bg)}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', PHASE_COLORS.grow.badge)}>
                    <Sprout className="w-3.5 h-3.5" /> Phase 2
                  </span>
                  <span className="text-sm font-semibold text-slate-700">Growth Period (No New Investment)</span>
                </div>

                <div className="space-y-4">
                  <NumberInput label="Growth Duration" value={growYears} onChange={setGrowYears} suffix="Years" step={1} min={0} max={30} />
                  <p className="text-[11px] text-teal-600 leading-snug">
                    Uses the same {investReturn}% return rate as Phase 1. Your corpus compounds with no new investments.
                  </p>
                </div>
              </div>

              {/* PHASE 3: Withdraw */}
              <div className={cn('rounded-xl border p-4', PHASE_COLORS.withdraw.border, PHASE_COLORS.withdraw.bg)}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', PHASE_COLORS.withdraw.badge)}>
                    <Wallet className="w-3.5 h-3.5" /> Phase 3
                  </span>
                  <span className="text-sm font-semibold text-slate-700">Withdrawal Period (SWP)</span>
                </div>

                <div className="space-y-4">
                  <NumberInput label="Monthly Withdrawal" value={monthlyWithdrawal} onChange={setMonthlyWithdrawal} prefix="₹" step={5000} min={5000} max={5000000} />
                  <NumberInput label="Withdrawal Duration" value={withdrawYears} onChange={setWithdrawYears} suffix="Years" step={1} min={1} max={30} />
                  <NumberInput label="Expected Return during Withdrawal" value={withdrawReturn} onChange={setWithdrawReturn} suffix="% p.a." step={0.5} min={1} max={15} />

                  <div className="pt-3 border-t border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600">Withdrawal Mode</label>
                      <button
                        role="switch"
                        aria-checked={withdrawalMode === 'incremental'}
                        onClick={() => setWithdrawalMode(withdrawalMode === 'constant' ? 'incremental' : 'constant')}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          withdrawalMode === 'incremental' ? 'bg-amber-500' : 'bg-slate-300'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                          withdrawalMode === 'incremental' ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">
                      {withdrawalMode === 'constant' ? 'Fixed withdrawal every month' : 'Withdrawal increases annually (inflation hedge)'}
                    </div>

                    {withdrawalMode === 'incremental' && (
                      <div className="space-y-3 animate-in">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setWithdrawIncrementType('percentage')}
                            className={cn(
                              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                              withdrawIncrementType === 'percentage'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                            )}
                          >
                            Percentage +%
                          </button>
                          <button
                            onClick={() => setWithdrawIncrementType('amount')}
                            className={cn(
                              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                              withdrawIncrementType === 'amount'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                            )}
                          >
                            Fixed +₹
                          </button>
                        </div>

                        <NumberInput
                          label={withdrawIncrementType === 'percentage' ? 'Annual Increase' : 'Annual Increase Amount'}
                          value={withdrawIncrementValue}
                          onChange={setWithdrawIncrementValue}
                          prefix={withdrawIncrementType === 'amount' ? '₹' : undefined}
                          suffix={withdrawIncrementType === 'percentage' ? '%' : undefined}
                          step={withdrawIncrementType === 'percentage' ? 1 : 1000}
                          min={withdrawIncrementType === 'percentage' ? 1 : 1000}
                          max={withdrawIncrementType === 'percentage' ? 30 : 20000}
                        />

                        <div className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                          Yr 1: {formatINR(monthlyWithdrawal)} → Yr {Math.min(withdrawYears, 10)}:{' '}
                          {formatINR(
                            withdrawIncrementType === 'percentage'
                              ? monthlyWithdrawal * Math.pow(1 + withdrawIncrementValue / 100, Math.min(withdrawYears, 10) - 1)
                              : monthlyWithdrawal + withdrawIncrementValue * (Math.min(withdrawYears, 10) - 1)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline summary */}
              <div className="mt-5 bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {investorName ? `${investorName}'s Journey` : 'Total Journey'}
                </div>
                <div className="text-2xl font-extrabold gradient-text">{totalYears} Years</div>
                {investorAge !== null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Age {investorAge} &rarr; {investorAge + totalYears}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-500" /> {investYears}y invest
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-500" /> {growYears}y grow
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> {withdrawYears}y withdraw
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-8">

              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}'s` : 'Your'} Life-Stage Financial Plan
                  </h3>
                  {investorAge !== null && (
                    <p className="text-sm text-slate-500 mt-1">
                      Current Age: <span className="font-semibold text-brand-700">{investorAge}</span>
                      {' '}&middot; Journey: Age {investorAge} &rarr; {investorAge + totalYears}
                      {' '}&middot; {totalYears} Years
                    </p>
                  )}
                </div>
              )}

              {/* 3-Phase Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={cn('card-base p-5 border-t-4 border-brand-500')}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', PHASE_COLORS.invest.badge)}>
                      <TrendingUp className="w-3 h-3" /> PHASE 1
                    </span>
                    {investorAge !== null && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        Age {investorAge} &rarr; {investorAge + investYears}
                      </div>
                    )}
                    <DownloadPDFButton elementId="calculator-results" title="Life-Stage Financial Planner" fileName="life-stage-planner" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Invested</div>
                      <div className="text-lg font-extrabold text-brand-700">{formatINR(result.phase1_totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Corpus Built</div>
                      <div className="text-lg font-extrabold text-brand-600">{formatINR(result.phase1_corpusAtEnd)}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Returns: <span className="font-semibold text-brand-600">{formatINR(result.phase1_returns)}</span>
                    </div>
                  </div>
                </div>

                <div className={cn('card-base p-5 border-t-4 border-teal-500')}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', PHASE_COLORS.grow.badge)}>
                      <Sprout className="w-3 h-3" /> PHASE 2
                    </span>
                    {investorAge !== null && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        Age {investorAge + investYears} &rarr; {investorAge + investYears + growYears}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Corpus at Start</div>
                      <div className="text-lg font-extrabold text-teal-700">{formatINR(result.phase1_corpusAtEnd)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Corpus After Growth</div>
                      <div className="text-lg font-extrabold text-teal-600">{formatINR(result.phase2_corpusAtEnd)}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Growth: <span className="font-semibold text-teal-600">{formatINR(result.phase2_growthAmount)}</span>
                      {' '}({wealthMultiplier}x of invested)
                    </div>
                  </div>
                </div>

                <div className={cn('card-base p-5 border-t-4', result.phase3_corpusLasts ? 'border-amber-500' : 'border-red-500')}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', PHASE_COLORS.withdraw.badge)}>
                      <Wallet className="w-3 h-3" /> PHASE 3
                    </span>
                    {investorAge !== null && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        Age {investorAge + investYears + growYears} &rarr; {investorAge + totalYears}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Withdrawn</div>
                      <div className="text-lg font-extrabold text-amber-700">{formatINR(result.phase3_totalWithdrawn)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining Corpus</div>
                      <div className={cn('text-lg font-extrabold', result.phase3_corpusLasts ? 'text-teal-600' : 'text-red-600')}>
                        {formatINR(result.phase3_remainingCorpus)}
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        result.phase3_corpusLasts ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'
                      )}>
                        {result.phase3_corpusLasts ? 'Corpus Sustained' : 'Corpus Depleted'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight Box */}
              <div className="card-base p-5 bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 border border-teal-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.phase3_corpusLasts ? (
                        <>
                          By investing <span className="font-semibold text-brand-700">{formatINR(monthlySIP)}/month</span> for
                          just <span className="font-semibold text-brand-700">{investYears} years</span>{investorAge !== null && <> (age {investorAge} to {investorAge + investYears})</>}
                          {growYears > 0 && (
                            <> and waiting <span className="font-semibold text-teal-700">{growYears} more years</span>{investorAge !== null && <> (till age {investorAge + investYears + growYears})</>}</>
                          )}, your corpus grew to <span className="font-semibold text-teal-700">{formatINR(result.phase2_corpusAtEnd)}</span> &mdash; enough
                          to withdraw <span className="font-semibold text-amber-700">{formatINR(monthlyWithdrawal)}/month</span> for <span className="font-semibold text-amber-700">{withdrawYears} years</span>{investorAge !== null && <> (from age {investorAge + investYears + growYears} to {investorAge + totalYears})</>} and
                          still have <span className="font-semibold text-teal-700">{formatINR(result.phase3_remainingCorpus)}</span> remaining!
                          That&apos;s the power of compound growth.
                        </>
                      ) : (
                        <>
                          With <span className="font-semibold text-brand-700">{formatINR(monthlySIP)}/month</span> invested for <span className="font-semibold text-brand-700">{investYears} years</span>{investorAge !== null && <> (age {investorAge} to {investorAge + investYears})</>}
                          {growYears > 0 && (
                            <> and <span className="font-semibold text-teal-700">{growYears} years</span> of growth{investorAge !== null && <> (till age {investorAge + investYears + growYears})</>}</>
                          )}, the corpus of <span className="font-semibold text-teal-700">{formatINR(result.phase2_corpusAtEnd)}</span> is not
                          sufficient to sustain <span className="font-semibold text-amber-700">{formatINR(monthlyWithdrawal)}/month</span> withdrawals
                          for {withdrawYears} years{investorAge !== null && <> (from age {investorAge + investYears + growYears} to {investorAge + totalYears})</>}. Consider increasing your SIP amount, extending the growth period, or reducing monthly withdrawals.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Investment Lifecycle Timeline</h3>
                <p className="text-sm text-slate-500 mb-6">Corpus value across all 3 phases of your financial journey</p>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-brand-500" />
                    <span className="text-slate-600">Invest</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-teal-500" />
                    <span className="text-slate-600">Grow</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-slate-600">Withdraw</span>
                  </div>
                </div>
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lsGradInvest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PHASE_COLORS.invest.fill} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={PHASE_COLORS.invest.fill} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="lsGradGrow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PHASE_COLORS.grow.fill} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={PHASE_COLORS.grow.fill} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="lsGradWithdraw" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PHASE_COLORS.withdraw.fill} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={PHASE_COLORS.withdraw.fill} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label = name === 'investCorpus' ? 'Corpus (Invest Phase)'
                            : name === 'growCorpus' ? 'Corpus (Growth Phase)'
                            : 'Corpus (Withdrawal Phase)';
                          return [formatINR(value), label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />

                      {phase1End > 0 && phase1End < totalYears && (
                        <ReferenceLine
                          x={investorAge !== null ? `Age ${investorAge + phase1End - 1}` : `Yr ${phase1End}`}
                          stroke={PHASE_COLORS.invest.primary}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: investorAge !== null ? `Age ${investorAge + phase1End}` : 'Stop Investing', position: 'top', fontSize: 10, fill: PHASE_COLORS.invest.primary }}
                        />
                      )}
                      {growYears > 0 && phase2End < totalYears && (
                        <ReferenceLine
                          x={investorAge !== null ? `Age ${investorAge + phase2End - 1}` : `Yr ${phase2End}`}
                          stroke={PHASE_COLORS.grow.primary}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: investorAge !== null ? `Age ${investorAge + phase2End}` : 'Start Withdrawals', position: 'top', fontSize: 10, fill: PHASE_COLORS.grow.primary }}
                        />
                      )}

                      <Area
                        type="monotone"
                        dataKey="investCorpus"
                        stroke={PHASE_COLORS.invest.primary}
                        fill="url(#lsGradInvest)"
                        strokeWidth={2.5}
                        name="investCorpus"
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="growCorpus"
                        stroke={PHASE_COLORS.grow.primary}
                        fill="url(#lsGradGrow)"
                        strokeWidth={2.5}
                        name="growCorpus"
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="withdrawCorpus"
                        stroke={PHASE_COLORS.withdraw.primary}
                        fill="url(#lsGradWithdraw)"
                        strokeWidth={2.5}
                        name="withdrawCorpus"
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Complete lifecycle view across all three phases</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-center py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Phase</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Withdrawn</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Corpus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyBreakdown.map((row) => {
                        const phaseColor = PHASE_COLORS[row.phase];
                        const monthlyLabel = row.phase === 'invest'
                          ? formatINR(row.monthlySIP ?? monthlySIP)
                          : row.phase === 'grow'
                            ? '---'
                            : row.monthlyWithdrawal !== undefined && row.monthlyWithdrawal > 0
                              ? formatINR(row.monthlyWithdrawal)
                              : '---';
                        return (
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                              Year {row.year}
                              {investorAge !== null && (
                                <span className="text-slate-400 font-normal text-xs ml-1">(Age {investorAge + row.year - 1})</span>
                              )}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-center">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                phaseColor.badge
                              )}>
                                {row.phase === 'invest' ? 'Invest' : row.phase === 'grow' ? 'Grow' : 'Withdraw'}
                              </span>
                            </td>
                            <td className={cn('py-3 px-2 sm:px-3 text-right font-medium', phaseColor.text)}>
                              {monthlyLabel}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right text-brand-700 font-medium">{formatINR(row.invested)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right text-amber-700 font-medium">
                              {row.withdrawn > 0 ? formatINR(row.withdrawn) : '---'}
                            </td>
                            <td className={cn(
                              'py-3 px-2 sm:px-3 text-right font-semibold',
                              row.corpus > 0 ? 'text-primary-700' : 'text-red-600'
                            )}>
                              {formatINR(row.corpus)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
