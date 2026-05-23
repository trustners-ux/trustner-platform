'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Landmark, ShieldCheck, Wallet, PiggyBank,
  TrendingDown, Sparkles, AlertTriangle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ── Types ──────────────────────────────────────

type RiskAppetite = 'safety' | 'balanced' | 'income-max';
type TaxBracket = 0 | 5 | 20 | 30;

interface Instrument {
  key: string;
  name: string;
  short: string;
  amount: number;         // principal parked
  grossYield: number;     // % p.a. gross return used for income
  taxTreatment: 'slab' | 'tax-free' | 'ltcg-equity' | 'ltcg-debt';
  payoutMode: 'monthly' | 'quarterly' | 'semi-annual' | 'swp-monthly';
  guaranteed: boolean;    // sovereign/guaranteed vs market-linked
  notes?: string;
  colour: string;
}

// ── Constants ──────────────────────────────────

const RISK_PILLS: { key: RiskAppetite; label: string; sub: string }[] = [
  { key: 'safety', label: 'Capital-Safety', sub: 'Max guarantees' },
  { key: 'balanced', label: 'Balanced', sub: 'Mix of both' },
  { key: 'income-max', label: 'Income-Max', sub: 'Some equity tilt' },
];

const TAX_OPTIONS: TaxBracket[] = [0, 5, 20, 30];

// 2026 indicative rates
const RATES = {
  scss: 8.2,            // taxable, quarterly
  rbiFloating: 8.05,    // NSC (7.7) + 0.35, taxable, semi-annual
  pomis: 7.4,           // taxable monthly
  taxFreeBond: 5.5,     // tax-free
  debtSwp: 7.5,
  hybridSwp: 9.5,
  equitySwp: 11.5,
  fd: 7.25,             // senior citizen FD
  liquid: 6.0,
};

const LIMITS = {
  scssSingle: 3000000,   // Rs 30L
  scssCouple: 6000000,   // Rs 60L
  pomisSingle: 900000,   // Rs 9L
  pomisCouple: 1500000,  // Rs 15L
  rbiFloatingDefault: 1000000, // Rs 10L allocation
};

const INSTRUMENT_COLOURS: Record<string, string> = {
  scss: '#0F766E',
  rbi: '#0891B2',
  pomis: '#14B8A6',
  taxFree: '#8B5CF6',
  debt: '#F59E0B',
  hybrid: '#10B981',
  equity: '#EF4444',
  fd: '#64748B',
  liquid: '#94A3B8',
};

// ── Helpers ────────────────────────────────────

function fmt(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${formatNumber(Math.round(v))}`;
}

function annualToMonthly(annualGross: number): number {
  return annualGross / 12;
}

/**
 * Effective tax rate on income from instrument given taxpayer slab.
 * - slab: full marginal
 * - tax-free: 0
 * - ltcg-equity: 12.5% on gains above Rs 1.25L (Budget 2024, effective 23-Jul-2024)
 * - ltcg-debt: slab (post Budget 2023)
 */
function effectiveTaxRate(treatment: Instrument['taxTreatment'], slab: TaxBracket): number {
  switch (treatment) {
    case 'tax-free':
      return 0;
    case 'ltcg-equity':
      return slab === 0 ? 0 : 12.5;
    case 'ltcg-debt':
      return slab;
    case 'slab':
    default:
      return slab;
  }
}

// ── Allocation Engine ─────────────────────────

function buildAllocation(params: {
  corpus: number;
  risk: RiskAppetite;
  spouseCovered: boolean;
  monthlyExpense: number;
  age: number;
}): Instrument[] {
  const { corpus, risk, spouseCovered, monthlyExpense } = params;
  const instruments: Instrument[] = [];
  let remaining = corpus;

  // 1. Emergency — 6 months expense in Liquid MF
  const emergency = Math.min(monthlyExpense * 6, remaining);
  if (emergency > 0) {
    instruments.push({
      key: 'liquid',
      name: 'Emergency Fund (Liquid MF)',
      short: 'Liquid',
      amount: emergency,
      grossYield: RATES.liquid,
      taxTreatment: 'ltcg-debt',
      payoutMode: 'swp-monthly',
      guaranteed: false,
      notes: '6 months expense buffer',
      colour: INSTRUMENT_COLOURS.liquid,
    });
    remaining -= emergency;
  }

  // 2. SCSS
  const scssLimit = spouseCovered ? LIMITS.scssCouple : LIMITS.scssSingle;
  let scssTarget: number;
  if (risk === 'income-max') {
    scssTarget = Math.min(1500000, scssLimit); // keep liquidity — Rs 15L
  } else {
    scssTarget = scssLimit;
  }
  const scssAlloc = Math.min(scssTarget, remaining);
  if (scssAlloc > 0) {
    instruments.push({
      key: 'scss',
      name: 'Senior Citizen Savings Scheme (SCSS)',
      short: 'SCSS',
      amount: scssAlloc,
      grossYield: RATES.scss,
      taxTreatment: 'slab',
      payoutMode: 'quarterly',
      guaranteed: true,
      notes: spouseCovered ? 'Rs 30L each (couple limit Rs 60L)' : 'Rs 30L single limit',
      colour: INSTRUMENT_COLOURS.scss,
    });
    remaining -= scssAlloc;
  }

  // 3. POMIS
  const pomisLimit = spouseCovered ? LIMITS.pomisCouple : LIMITS.pomisSingle;
  let pomisTarget: number;
  if (risk === 'safety') pomisTarget = pomisLimit;
  else if (risk === 'balanced') pomisTarget = Math.floor(pomisLimit / 2);
  else pomisTarget = 0;
  const pomisAlloc = Math.min(pomisTarget, remaining);
  if (pomisAlloc > 0) {
    instruments.push({
      key: 'pomis',
      name: 'Post Office Monthly Income Scheme',
      short: 'POMIS',
      amount: pomisAlloc,
      grossYield: RATES.pomis,
      taxTreatment: 'slab',
      payoutMode: 'monthly',
      guaranteed: true,
      notes: spouseCovered ? 'Joint cap Rs 15L' : 'Single cap Rs 9L',
      colour: INSTRUMENT_COLOURS.pomis,
    });
    remaining -= pomisAlloc;
  }

  // 4. RBI Floating Rate Bond — Rs 10L default for safety & balanced
  if (risk !== 'income-max') {
    const rbiAlloc = Math.min(LIMITS.rbiFloatingDefault, remaining);
    if (rbiAlloc > 0) {
      instruments.push({
        key: 'rbi',
        name: 'RBI Floating Rate Savings Bond',
        short: 'RBI FRSB',
        amount: rbiAlloc,
        grossYield: RATES.rbiFloating,
        taxTreatment: 'slab',
        payoutMode: 'semi-annual',
        guaranteed: true,
        notes: 'Sovereign, interest resets semi-annually',
        colour: INSTRUMENT_COLOURS.rbi,
      });
      remaining -= rbiAlloc;
    }
  }

  // 5. Allocate remainder per risk profile
  if (remaining > 0) {
    if (risk === 'safety') {
      // FD ladder 70% + Debt MF SWP 30%
      const fd = Math.round(remaining * 0.7);
      const debt = remaining - fd;
      if (fd > 0) instruments.push({
        key: 'fd',
        name: 'Bank FD Ladder (Senior Rates)',
        short: 'FD Ladder',
        amount: fd,
        grossYield: RATES.fd,
        taxTreatment: 'slab',
        payoutMode: 'monthly',
        guaranteed: true,
        notes: 'Seniors get 0.5% extra; ladder 1-5 yrs',
        colour: INSTRUMENT_COLOURS.fd,
      });
      if (debt > 0) instruments.push({
        key: 'debt',
        name: 'Debt Mutual Fund (SWP)',
        short: 'Debt SWP',
        amount: debt,
        grossYield: RATES.debtSwp,
        taxTreatment: 'ltcg-debt',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Short-duration / Corporate bond debt MF',
        colour: INSTRUMENT_COLOURS.debt,
      });
    } else if (risk === 'balanced') {
      // 60% Hybrid Conservative + 40% Debt MF
      const hyb = Math.round(remaining * 0.6);
      const debt = remaining - hyb;
      if (hyb > 0) instruments.push({
        key: 'hybrid',
        name: 'Hybrid Conservative MF (SWP)',
        short: 'Hybrid SWP',
        amount: hyb,
        grossYield: RATES.hybridSwp,
        taxTreatment: 'ltcg-equity',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Equity taxation — LTCG 12.5% beyond Rs 1.25L',
        colour: INSTRUMENT_COLOURS.hybrid,
      });
      if (debt > 0) instruments.push({
        key: 'debt',
        name: 'Debt Mutual Fund (SWP)',
        short: 'Debt SWP',
        amount: debt,
        grossYield: RATES.debtSwp,
        taxTreatment: 'ltcg-debt',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Short-duration / Corporate bond debt MF',
        colour: INSTRUMENT_COLOURS.debt,
      });
    } else {
      // income-max: 60% Hybrid + 30% Equity SWP + 10% Debt
      const hyb = Math.round(remaining * 0.6);
      const eq = Math.round(remaining * 0.3);
      const debt = remaining - hyb - eq;
      if (hyb > 0) instruments.push({
        key: 'hybrid',
        name: 'Hybrid Conservative MF (SWP)',
        short: 'Hybrid SWP',
        amount: hyb,
        grossYield: RATES.hybridSwp,
        taxTreatment: 'ltcg-equity',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Equity taxation — LTCG 12.5% beyond Rs 1.25L',
        colour: INSTRUMENT_COLOURS.hybrid,
      });
      if (eq > 0) instruments.push({
        key: 'equity',
        name: 'Equity Mutual Fund (Growth SWP)',
        short: 'Equity SWP',
        amount: eq,
        grossYield: RATES.equitySwp,
        taxTreatment: 'ltcg-equity',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Higher growth — draw modestly',
        colour: INSTRUMENT_COLOURS.equity,
      });
      if (debt > 0) instruments.push({
        key: 'debt',
        name: 'Debt Mutual Fund (SWP)',
        short: 'Debt SWP',
        amount: debt,
        grossYield: RATES.debtSwp,
        taxTreatment: 'ltcg-debt',
        payoutMode: 'swp-monthly',
        guaranteed: false,
        notes: 'Stabiliser — short duration',
        colour: INSTRUMENT_COLOURS.debt,
      });
    }
  }

  return instruments;
}

// ── Income Row Builder ─────────────────────────

interface IncomeRow {
  instrument: Instrument;
  grossMonthly: number;
  taxRate: number;
  monthlyTax: number;
  netMonthly: number;
}

function buildIncomeRows(instruments: Instrument[], slab: TaxBracket): IncomeRow[] {
  return instruments.map((ins) => {
    const grossAnnual = (ins.amount * ins.grossYield) / 100;
    const grossMonthly = annualToMonthly(grossAnnual);
    const taxRate = effectiveTaxRate(ins.taxTreatment, slab);
    const monthlyTax = (grossMonthly * taxRate) / 100;
    const netMonthly = grossMonthly - monthlyTax;
    return { instrument: ins, grossMonthly, taxRate, monthlyTax, netMonthly };
  });
}

// ── Sustainability Projection ─────────────────

interface YearRow {
  age: number;
  year: number;
  grossIncome: number;  // annual
  netIncome: number;    // annual
  expense: number;      // annual inflated
  corpusEnd: number;
  real65: number;
  realByInflation: number;
  guaranteed: number;
  marketLinked: number;
  taxFree: number;
}

function projectSustainability(params: {
  corpus: number;
  rows: IncomeRow[];
  inflation: number;
  startAge: number;
  lifeSpan: number;
  monthlyExpense: number;
}): { yearly: YearRow[]; lastYear: number; depletesBeforeLife: boolean } {
  const { corpus, rows, inflation, startAge, lifeSpan, monthlyExpense } = params;
  const yearly: YearRow[] = [];

  // Simple model: corpus earns blended return each year, we withdraw gap = (expense - netIncome)
  const initialNet = rows.reduce((s, r) => s + r.netMonthly * 12, 0);
  const blendedYield =
    rows.reduce((s, r) => s + r.instrument.amount * r.instrument.grossYield, 0) /
    Math.max(corpus, 1) /
    100;

  let balance = corpus;
  let yr = 0;
  let depleted = false;
  let depletionYear = lifeSpan - startAge;

  const years = Math.max(lifeSpan - startAge, 1);

  for (yr = 0; yr <= years; yr++) {
    const age = startAge + yr;
    const expense = monthlyExpense * 12 * Math.pow(1 + inflation / 100, yr);
    const grossIncomeY = balance > 0 ? (balance * blendedYield) : 0;
    // Net approximation — scale by ratio of initial net/gross
    const netRatio = initialNet > 0
      ? initialNet / Math.max(rows.reduce((s, r) => s + r.grossMonthly * 12, 0), 1)
      : 1;
    const netIncomeY = grossIncomeY * netRatio;
    // If expense > netIncome, drawdown principal for gap
    const gap = Math.max(expense - netIncomeY, 0);
    // Corpus end = balance * (1 + yield) - withdrawal (gap) - expense-side already covered by income
    // We treat income as taken out for expense; excess reinvested.
    balance = balance + (grossIncomeY) - Math.min(expense, netIncomeY + Math.max(balance, 0));
    // Simpler: net balance after year = previous balance * (1 + blendedYield) - expense
    // Re-compute cleanly:
    if (yr === 0) {
      balance = corpus;
    } else {
      const prev = yearly[yr - 1]?.corpusEnd ?? corpus;
      balance = Math.max(prev * (1 + blendedYield) - expense, 0);
    }

    if (balance <= 0 && !depleted) {
      depleted = true;
      depletionYear = yr;
    }

    const guarantees = rows
      .filter((r) => r.instrument.guaranteed)
      .reduce((s, r) => s + r.netMonthly * 12, 0);
    const marketLinked = rows
      .filter((r) => !r.instrument.guaranteed && r.instrument.taxTreatment !== 'tax-free')
      .reduce((s, r) => s + r.netMonthly * 12, 0);
    const taxFree = rows
      .filter((r) => r.instrument.taxTreatment === 'tax-free')
      .reduce((s, r) => s + r.netMonthly * 12, 0);

    yearly.push({
      age,
      year: yr + 1,
      grossIncome: grossIncomeY,
      netIncome: netIncomeY,
      expense,
      corpusEnd: balance,
      real65: netIncomeY / Math.pow(1 + inflation / 100, yr),
      realByInflation: netIncomeY / Math.pow(1 + inflation / 100, yr),
      guaranteed: guarantees,
      marketLinked,
      taxFree,
    });
  }

  const lastSustainedAge = depleted ? startAge + depletionYear : lifeSpan;

  return {
    yearly,
    lastYear: lastSustainedAge,
    depletesBeforeLife: depleted && lastSustainedAge < lifeSpan,
  };
}

// ── Summary Card ──────────────────────────────

function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: 'teal' | 'emerald' | 'amber' | 'red' | 'indigo';
}) {
  const map: Record<string, { bg: string; iconBg: string; text: string; val: string }> = {
    teal: { bg: 'bg-teal-50 border-teal-200', iconBg: 'bg-teal-100 text-teal-600', text: 'text-teal-700', val: 'text-teal-900' },
    emerald: { bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', val: 'text-emerald-900' },
    amber: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-700', val: 'text-amber-900' },
    red: { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100 text-red-600', text: 'text-red-700', val: 'text-red-900' },
    indigo: { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-700', val: 'text-indigo-900' },
  };
  const s = map[color];
  return (
    <div className={cn('rounded-xl border p-4', s.bg)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', s.iconBg)}>{icon}</div>
      <div className={cn('text-[11px] font-semibold mb-1', s.text)}>{label}</div>
      <div className={cn('text-lg font-extrabold leading-tight', s.val)}>{value}</div>
      {sub && <div className={cn('text-[10px] mt-1 opacity-80', s.text)}>{sub}</div>}
    </div>
  );
}

// ── Page Component ─────────────────────────────

export default function SeniorIncomeArchitectPage() {
  const [clientName, setClientName] = useState('');
  const [age, setAge] = useState<number>(65);
  const [corpus, setCorpus] = useState<number>(10000000); // 1 Cr
  const [monthlyExpense, setMonthlyExpense] = useState<number>(60000);
  const [spouseCovered, setSpouseCovered] = useState<boolean>(true);
  const [risk, setRisk] = useState<RiskAppetite>(() => 'balanced');
  const [taxBracket, setTaxBracket] = useState<TaxBracket>(20);
  const [inflation, setInflation] = useState<number>(6);
  const [lifeSpan, setLifeSpan] = useState<number>(85);

  // Smart default: if age >= 70 and user hasn't changed risk, prefer safety.
  // We leave this as-is since we expose risk selector explicitly.

  const instruments = useMemo(
    () =>
      buildAllocation({
        corpus,
        risk,
        spouseCovered,
        monthlyExpense,
        age,
      }),
    [corpus, risk, spouseCovered, monthlyExpense, age]
  );

  const rows = useMemo(() => buildIncomeRows(instruments, taxBracket), [instruments, taxBracket]);

  const totalGrossMonthly = rows.reduce((s, r) => s + r.grossMonthly, 0);
  const totalTaxMonthly = rows.reduce((s, r) => s + r.monthlyTax, 0);
  const totalNetMonthly = totalGrossMonthly - totalTaxMonthly;

  const guaranteedNetMonthly = rows
    .filter((r) => r.instrument.guaranteed)
    .reduce((s, r) => s + r.netMonthly, 0);
  const marketNetMonthly = rows
    .filter((r) => !r.instrument.guaranteed)
    .reduce((s, r) => s + r.netMonthly, 0);

  const projection = useMemo(
    () =>
      projectSustainability({
        corpus,
        rows,
        inflation,
        startAge: age,
        lifeSpan,
        monthlyExpense,
      }),
    [corpus, rows, inflation, age, lifeSpan, monthlyExpense]
  );

  const corpusSustainsFor = Math.max(projection.lastYear - age, 0);
  const gapYears = Math.max(lifeSpan - projection.lastYear, 0);

  const pieData = instruments.map((ins) => ({
    name: ins.short,
    value: ins.amount,
    fill: ins.colour,
  }));

  const barData = projection.yearly
    .filter((y, i) => i % Math.max(Math.floor(projection.yearly.length / 12), 1) === 0)
    .map((y) => ({
      age: y.age,
      Guaranteed: Math.round(y.guaranteed / 12),
      Market: Math.round(y.marketLinked / 12),
      TaxFree: Math.round(y.taxFree / 12),
    }));

  // Inflation-adjusted income at key ages
  const incomeAt = (atAge: number): number => {
    const yrs = atAge - age;
    if (yrs <= 0) return totalNetMonthly;
    return totalNetMonthly / Math.pow(1 + inflation / 100, yrs);
  };

  const ageMilestones = [65, 70, 80, 85].filter((a) => a >= age && a <= lifeSpan);

  const resultContext = `Corpus ${fmt(corpus)}, net monthly income ${fmt(totalNetMonthly)} post-tax, corpus lasts ~${corpusSustainsFor} yrs`;

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-teal-900 via-cyan-900 to-slate-900 text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Landmark className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-teal-300 mb-1">
                Decumulation Architect
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                Senior Citizen Income Architect
              </h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base max-w-3xl">
                The income architect for Indian seniors — auto-allocates your corpus across SCSS, RBI Bonds, POMIS, Tax-Free Bonds, FDs and Mutual Funds SWP for maximum post-tax monthly income.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <PersonalInfoBar
              name={clientName}
              onNameChange={setClientName}
              age={age}
              onAgeChange={(v) => setAge(v ?? 65)}
              ageLabel="Your Age"
              namePlaceholder="e.g., Mrs. Iyer"
              showAge={true}
            />
            <DownloadPDFButton
              elementId="calculator-results"
              title="Senior Citizen Income Plan"
              fileName={`Senior-Income-${clientName || 'Plan'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">

            {/* ═══════ LEFT PANEL ═══════ */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              {/* Basics */}
              <div className="border-t-4 border-teal-600 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Your Situation
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g., Mr. Rajesh Sharma"
                      className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <NumberInput
                    label="Your Age"
                    value={age}
                    onChange={setAge}
                    suffix="years"
                    step={1}
                    min={60}
                    max={85}
                  />
                  <NumberInput
                    label="Total Retirement Corpus"
                    value={corpus}
                    onChange={setCorpus}
                    prefix="Rs."
                    step={100000}
                    min={500000}
                    max={500000000}
                  />
                  <NumberInput
                    label="Current Monthly Expenses"
                    value={monthlyExpense}
                    onChange={setMonthlyExpense}
                    prefix="Rs."
                    step={5000}
                    min={10000}
                    max={1000000}
                  />

                  <div className="flex items-center justify-between cursor-pointer pt-1" onClick={() => setSpouseCovered(!spouseCovered)} role="button" tabIndex={0}>
                    <div>
                      <span className="text-[13px] font-semibold text-slate-600">Spouse Covered?</span>
                      <p className="text-[10px] text-slate-400">Doubles SCSS limit (Rs 30L → Rs 60L) &amp; lifts POMIS to Rs 15L</p>
                    </div>
                    <div className={cn('relative w-10 h-5 rounded-full transition-colors', spouseCovered ? 'bg-teal-500' : 'bg-slate-300')}>
                      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', spouseCovered ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk appetite */}
              <div className="border-t-4 border-cyan-600 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" /> Risk Appetite
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_PILLS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setRisk(p.key)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all',
                        risk === p.key
                          ? 'bg-cyan-600 border-cyan-600 text-white shadow'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-300'
                      )}
                    >
                      <div>{p.label}</div>
                      <div className={cn('text-[9px] font-normal mt-0.5', risk === p.key ? 'text-cyan-50' : 'text-slate-400')}>{p.sub}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {risk === 'safety' && 'Max guarantees: SCSS + POMIS + RBI Bonds + FD ladder.'}
                  {risk === 'balanced' && 'Guarantees + Hybrid Conservative MF SWP for inflation hedge.'}
                  {risk === 'income-max' && 'Lower guarantees, higher equity SWP — suits those with other income.'}
                </p>
              </div>

              {/* Tax bracket */}
              <div className="border-t-4 border-amber-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" /> Tax Bracket
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {TAX_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTaxBracket(t)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-bold transition-all',
                        taxBracket === t
                          ? 'bg-amber-500 border-amber-500 text-white shadow'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                      )}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Applied to SCSS, POMIS, RBI Bonds, FDs &amp; debt MF. Equity MF uses LTCG 12.5% beyond Rs 1.25L (Budget 2024).
                </p>
              </div>

              {/* Assumptions */}
              <div className="border-t-4 border-slate-400 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3">Assumptions</h3>
                <div className="space-y-3">
                  <NumberInput
                    label="Inflation Expected"
                    value={inflation}
                    onChange={setInflation}
                    suffix="% p.a."
                    step={0.5}
                    min={4}
                    max={8}
                  />
                  <NumberInput
                    label="Expected Life Span"
                    value={lifeSpan}
                    onChange={setLifeSpan}
                    suffix="years"
                    step={1}
                    min={75}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT PANEL ═══════ */}
            <div className="space-y-6">

              {/* HERO RESULTS */}
              <div className="card-base p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-white border-teal-200">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-teal-700 mb-1">Your Monthly Income (Post-Tax)</p>
                <div className="text-4xl sm:text-5xl font-extrabold text-teal-900 leading-tight">
                  {formatINR(totalNetMonthly)}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Corpus sustainability:{' '}
                  <strong className={projection.depletesBeforeLife ? 'text-red-600' : 'text-emerald-700'}>
                    {corpusSustainsFor} years
                  </strong>{' '}
                  at {inflation}% inflation — lasts till age{' '}
                  <strong>{projection.lastYear}</strong>.
                </p>
              </div>

              {/* SUMMARY GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard
                  icon={<PiggyBank className="w-5 h-5" />}
                  label="Total Corpus"
                  value={fmt(corpus)}
                  color="teal"
                />
                <SummaryCard
                  icon={<ShieldCheck className="w-5 h-5" />}
                  label="Guaranteed Income"
                  value={`${formatINR(guaranteedNetMonthly)}/mo`}
                  sub="SCSS + POMIS + RBI + FD"
                  color="emerald"
                />
                <SummaryCard
                  icon={<Sparkles className="w-5 h-5" />}
                  label="Market-Linked Income"
                  value={`${formatINR(marketNetMonthly)}/mo`}
                  sub="MF SWP (may fluctuate)"
                  color="indigo"
                />
                <SummaryCard
                  icon={<TrendingDown className="w-5 h-5" />}
                  label="Monthly Tax Outgo"
                  value={`${formatINR(totalTaxMonthly)}/mo`}
                  sub={`${taxBracket}% slab applied`}
                  color="amber"
                />
              </div>

              {/* Longevity / Gap card */}
              <div className={cn(
                'rounded-xl border p-5',
                projection.depletesBeforeLife
                  ? 'bg-red-50 border-red-200'
                  : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    projection.depletesBeforeLife ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={cn(
                      'font-bold mb-1',
                      projection.depletesBeforeLife ? 'text-red-800' : 'text-emerald-800'
                    )}>
                      Longevity Risk
                    </h4>
                    <p className={cn(
                      'text-sm',
                      projection.depletesBeforeLife ? 'text-red-700' : 'text-emerald-700'
                    )}>
                      {projection.depletesBeforeLife
                        ? `At this withdrawal rate and ${inflation}% inflation, your corpus lasts ${corpusSustainsFor} years (till age ${projection.lastYear}). Life expectancy ${lifeSpan} → gap of ${gapYears} years. Consider lowering expenses, increasing equity tilt, or topping up the corpus.`
                        : `At this withdrawal rate and ${inflation}% inflation, your corpus comfortably lasts through age ${lifeSpan}. You have room to rebalance annually with your Relationship Manager.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* ALLOCATION TABLE */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Allocation Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold">
                        <th className="px-2 py-2 text-left">Instrument</th>
                        <th className="px-2 py-2 text-right">Amount</th>
                        <th className="px-2 py-2 text-right">Yield</th>
                        <th className="px-2 py-2 text-right">Gross / mo</th>
                        <th className="px-2 py-2 text-right">Tax</th>
                        <th className="px-2 py-2 text-right">Net / mo</th>
                        <th className="px-2 py-2 text-left">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={r.instrument.key + idx} className={idx % 2 === 0 ? 'bg-white border-t border-slate-100' : 'bg-slate-50/60 border-t border-slate-100'}>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: r.instrument.colour }}
                              />
                              <div>
                                <div className="font-semibold text-slate-800">{r.instrument.name}</div>
                                {r.instrument.notes && (
                                  <div className="text-[10px] text-slate-400">{r.instrument.notes}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">{fmt(r.instrument.amount)}</td>
                          <td className="px-2 py-2 text-right">{r.instrument.grossYield.toFixed(2)}%</td>
                          <td className="px-2 py-2 text-right">{formatINR(r.grossMonthly)}</td>
                          <td className="px-2 py-2 text-right text-amber-700">
                            {r.taxRate > 0 ? `${formatINR(r.monthlyTax)}` : '—'}
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-teal-700">{formatINR(r.netMonthly)}</td>
                          <td className="px-2 py-2 text-[10px] text-slate-500 uppercase">{r.instrument.payoutMode.replace('-', ' ')}</td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 font-bold border-t-2 border-teal-200">
                        <td className="px-2 py-2 text-teal-800">Total</td>
                        <td className="px-2 py-2 text-right text-teal-800">{fmt(corpus)}</td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2 text-right text-teal-800">{formatINR(totalGrossMonthly)}</td>
                        <td className="px-2 py-2 text-right text-amber-800">{formatINR(totalTaxMonthly)}</td>
                        <td className="px-2 py-2 text-right text-teal-800">{formatINR(totalNetMonthly)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Allocation Mix</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={`c-${idx}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Monthly Income Stream Over Time</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip formatter={(v: number) => formatINR(v)} labelFormatter={(l: number) => `Age ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Guaranteed" stackId="a" fill="#0F766E" />
                        <Bar dataKey="Market" stackId="a" fill="#8B5CF6" />
                        <Bar dataKey="TaxFree" stackId="a" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Inflation-adjusted income card */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-1">Real Purchasing Power (Today's Rupees)</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Your {formatINR(totalNetMonthly)}/month today is worth less each year at {inflation}% inflation.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ageMilestones.map((a) => {
                    const realMonthly = incomeAt(a);
                    const loss = ((totalNetMonthly - realMonthly) / totalNetMonthly) * 100;
                    return (
                      <div key={a} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[10px] font-semibold uppercase text-slate-400">At Age {a}</div>
                        <div className="text-lg font-bold text-slate-800 mt-1">{formatINR(realMonthly)}</div>
                        <div className="text-[10px] text-red-600 mt-0.5">−{loss.toFixed(0)}% real value</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INSIGHTS */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-3">Insights</h3>
                <div className="space-y-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm text-emerald-800">
                      <strong>Guaranteed cash flow:</strong> SCSS + POMIS + RBI Floating Rate Bond{rows.some(r => r.instrument.key === 'fd') ? ' + FD Ladder' : ''} give you{' '}
                      <strong>{formatINR(guaranteedNetMonthly)}/month</strong> of sovereign-backed, predictable income.
                    </p>
                  </div>
                  {marketNetMonthly > 0 && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <p className="text-sm text-indigo-800">
                        <strong>Market-linked income:</strong> Mutual fund SWPs contribute{' '}
                        <strong>{formatINR(marketNetMonthly)}/month</strong>. This fluctuates with markets but grows with equity — your inflation hedge over a 20-25 year retirement.
                      </p>
                    </div>
                  )}
                  {projection.depletesBeforeLife && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-800">
                        <strong>Gap warning:</strong> Your corpus depletes {gapYears} year(s) before your expected life span. Options: tighten expenses by {Math.round(((monthlyExpense - totalNetMonthly) / monthlyExpense) * 100) > 0 ? Math.round(((monthlyExpense - totalNetMonthly) / monthlyExpense) * 100) : 10}%, shift 10-15% more into hybrid/equity SWP, or review annually with a CFP.
                      </p>
                    </div>
                  )}
                  {taxBracket >= 20 && rows.some(r => r.instrument.taxTreatment === 'slab') && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">
                        <strong>Tax tip:</strong> At {taxBracket}% slab, interest from SCSS/POMIS/FDs is fully taxable. Consider secondary-market tax-free bonds (Sec 10(15)) and MF SWP where equity LTCG caps at 12.5% beyond Rs 1.25L/year — a meaningful post-tax edge.
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-600">
                      <strong>Note:</strong> Figures are illustrative at 2026 rates (SCSS {RATES.scss}%, RBI FRSB {RATES.rbiFloating}%, POMIS {RATES.pomis}%, senior FD ~{RATES.fd}%). Actual yields reset quarterly/semi-annually. Mutual fund returns are expected — not guaranteed.
                    </p>
                  </div>
                </div>
              </div>

              {/* LEAD FORM */}
              <CalculatorLeadForm
                calculatorName="Senior Citizen Income Architect"
                accent="teal"
                heading="Let your Relationship Manager stress-test this plan"
                subtext="Your Trustner Relationship Manager will review this allocation, compare current SCSS/POMIS/FD rates, and build a tax-optimised income plan for you and your spouse."
                resultContext={resultContext}
              />

              {/* DISCLAIMER */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {DISCLAIMER.mutual_fund} Instrument rates shown are indicative as of 2026 and reset periodically; verify current rates before investing. This calculator is for educational purposes only and does not constitute financial advice. Post-tax outcomes depend on individual circumstances — consult a qualified financial professional or your Relationship Manager before acting.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
