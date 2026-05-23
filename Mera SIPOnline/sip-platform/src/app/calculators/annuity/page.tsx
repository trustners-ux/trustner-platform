'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Scale, Wallet, AlertTriangle, Sparkles, TrendingDown, ShieldCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ─── Types ─────────────────────────────────────

type Product = 'immediate' | 'deferred';
type LifeOpt = 'single' | 'joint100' | 'joint50';
type TaxSlab = 5 | 10 | 20 | 30;

interface VariantKey {
  product: Product;
  defer: number; // 0 | 5 | 10 | 15
  life: LifeOpt;
  rop: boolean;
}

interface VariantOutcome {
  label: string;
  monthly: number;
  annual: number;
  totalPayout: number;
  ropReturn: number;
  irr: number;       // nominal, %
  realIrr: number;   // after-inflation, %
  rate: number;
}

// ─── Rate engine ──────────────────────────────

/**
 * Baseline 2026 annuity rates (Immediate, Single Life, no ROP at age 60 = 7.50%).
 * Age uplift: +0.15% per year above 60, -0.15 below (floor 55).
 * Adjustments:
 *   − 1.30% for ROP
 *   − 0.30% for Joint 100%
 *   − 0.10% for Joint 50%
 * Deferred:
 *   + 1.50% per 5 years deferred (applied on top of age-adjusted base).
 */
function baseRate(age: number, v: VariantKey): number {
  const a = Math.max(55, Math.min(85, age));
  let r = 7.5 + (a - 60) * 0.15;
  if (v.life === 'joint100') r -= 0.3;
  if (v.life === 'joint50') r -= 0.1;
  if (v.rop) r -= 1.3;
  if (v.product === 'deferred') r += (v.defer / 5) * 1.5;
  return Math.max(3.5, r);
}

// ─── IRR (Newton + bisection fallback) ────────

function computeIRR(cashflows: number[], guess = 0.08): number | null {
  if (cashflows.length < 2) return null;
  if (!cashflows.some((c) => c > 0) || !cashflows.some((c) => c < 0)) return null;
  let rate = guess;
  for (let i = 0; i < 120; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d = Math.pow(1 + rate, t);
      npv += cashflows[t] / d;
      if (t > 0) dnpv += (-t * cashflows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (!isFinite(npv) || !isFinite(dnpv) || dnpv === 0) break;
    const nr = rate - npv / dnpv;
    if (!isFinite(nr)) break;
    if (Math.abs(nr - rate) < 1e-7) { rate = nr; break; }
    rate = Math.max(-0.99, Math.min(5, nr));
  }
  const npvAt = (r: number) => cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
  if (!isFinite(rate) || Math.abs(npvAt(rate)) > 1) {
    let lo = -0.9, hi = 3;
    const fLo = npvAt(lo); const fHi = npvAt(hi);
    if (fLo * fHi > 0) return isFinite(rate) ? rate : null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fMid = npvAt(mid);
      if (Math.abs(fMid) < 1e-3 || hi - lo < 1e-7) { rate = mid; break; }
      if (fLo * fMid < 0) hi = mid; else lo = mid;
    }
  }
  return isFinite(rate) ? rate : null;
}

// ─── Build cashflows for a variant ────────────

interface BuildInput {
  pp: number;          // purchase price
  age: number;
  spouseAge: number;
  primaryLife: number;
  spouseLife: number;
  variant: VariantKey;
  slab: TaxSlab;
  inflation: number;
}

function buildVariant(inp: BuildInput): VariantOutcome {
  const { pp, age, spouseAge, primaryLife, spouseLife, variant, slab, inflation } = inp;
  const rate = baseRate(age, variant);
  const annual = (pp * rate) / 100;
  const monthly = annual / 12;

  // Duration: annuity starts after defer years; stops when:
  //   single → primary dies
  //   joint  → later of both deaths
  const start = variant.product === 'deferred' ? variant.defer : 0;
  const primaryYearsAlive = Math.max(primaryLife - age, 0);
  const spouseYearsAlive = Math.max(spouseLife - spouseAge, 0);
  const payEnd = variant.life === 'single'
    ? primaryYearsAlive
    : Math.max(primaryYearsAlive, spouseYearsAlive);
  const payYears = Math.max(payEnd - start, 0);

  // Joint 50%: pays 100% while primary alive, 50% after primary dies (if spouse outlives)
  let totalPayout = 0;
  const cashflows: number[] = [];
  cashflows.push(-pp);
  const horizon = Math.max(payEnd, 1);
  for (let t = 1; t <= horizon; t++) {
    if (t <= start) { cashflows.push(0); continue; }
    let payFactor = 0;
    const primaryAlive = t <= primaryYearsAlive;
    const spouseAliveAtT = t <= spouseYearsAlive;
    if (variant.life === 'single') {
      payFactor = primaryAlive ? 1 : 0;
    } else if (variant.life === 'joint100') {
      payFactor = (primaryAlive || spouseAliveAtT) ? 1 : 0;
    } else { // joint50
      if (primaryAlive) payFactor = 1;
      else if (spouseAliveAtT) payFactor = 0.5;
      else payFactor = 0;
    }
    const gross = annual * payFactor;
    const net = gross * (1 - slab / 100);
    totalPayout += net;
    cashflows.push(net);
  }

  // ROP: purchase price returned to nominee at end (later of deaths for joint, primary for single)
  const ropReturn = variant.rop ? pp : 0;
  if (ropReturn > 0) {
    cashflows[cashflows.length - 1] += ropReturn;
  }

  const irrGross = computeIRR(cashflows.map((c, i) => i === 0 ? c : c / (1 - slab / 100))); // pre-tax IRR
  const irrNetNum = computeIRR(cashflows);
  const irr = irrGross !== null ? irrGross * 100 : 0;
  const realIrr = irrNetNum !== null ? (((1 + irrNetNum) / (1 + inflation / 100)) - 1) * 100 : 0;

  const label = variantLabel(variant);
  return {
    label,
    monthly,
    annual,
    totalPayout,
    ropReturn,
    irr,
    realIrr,
    rate,
  };
  void payYears;
}

function variantLabel(v: VariantKey): string {
  const p = v.product === 'immediate' ? 'Immediate' : `Deferred ${v.defer}y`;
  const life = v.life === 'single' ? 'Single' : v.life === 'joint100' ? 'Joint 100%' : 'Joint 50%';
  return `${p} • ${life} • ${v.rop ? 'ROP' : 'No-ROP'}`;
}

// ─── Constants ────────────────────────────────

const LIFE_OPTIONS: { key: LifeOpt; label: string; sub: string }[] = [
  { key: 'single', label: 'Single Life', sub: 'Till you die' },
  { key: 'joint100', label: 'Joint 100%', sub: 'Same till 2nd death' },
  { key: 'joint50', label: 'Joint 50%', sub: 'Halves post your death' },
];

const DEFER_OPTIONS = [5, 10, 15];
const TAX_SLABS: TaxSlab[] = [5, 10, 20, 30];

// Benchmark variants for comparison
const BENCH_VARIANTS: VariantKey[] = [
  { product: 'immediate', defer: 0, life: 'single', rop: false },
  { product: 'immediate', defer: 0, life: 'single', rop: true },
  { product: 'immediate', defer: 0, life: 'joint100', rop: false },
  { product: 'immediate', defer: 0, life: 'joint100', rop: true },
  { product: 'deferred', defer: 10, life: 'single', rop: false },
  { product: 'deferred', defer: 10, life: 'single', rop: true },
];

// ─── UI helpers ────────────────────────────────

function fmt(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${formatNumber(Math.round(v))}`;
}

function Pill<T extends string | number>({ value, current, onClick, label, sub }: {
  value: T; current: T; onClick: (v: T) => void; label: string; sub?: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all',
        active ? 'bg-amber-600 border-amber-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
      )}
    >
      <div>{label}</div>
      {sub && <div className={cn('text-[9px] font-normal mt-0.5', active ? 'text-amber-50' : 'text-slate-400')}>{sub}</div>}
    </button>
  );
}

// ─── Page ─────────────────────────────────────

export default function AnnuityDecoderPage() {
  const [clientName, setClientName] = useState('');
  const [age, setAge] = useState<number>(60);
  const [spouseAge, setSpouseAge] = useState<number>(58);
  const [pp, setPp] = useState<number>(5000000);
  const [product, setProduct] = useState<Product>('immediate');
  const [defer, setDefer] = useState<number>(10);
  const [life, setLife] = useState<LifeOpt>('single');
  const [rop, setRop] = useState<boolean>(false);
  const [primaryLife, setPrimaryLife] = useState<number>(85);
  const [spouseLife, setSpouseLife] = useState<number>(87);
  const [slab, setSlab] = useState<TaxSlab>(20);
  const [inflation, setInflation] = useState<number>(6);

  const selectedVariant: VariantKey = useMemo(() => ({
    product,
    defer: product === 'deferred' ? defer : 0,
    life,
    rop,
  }), [product, defer, life, rop]);

  const selected: VariantOutcome = useMemo(() => buildVariant({
    pp, age, spouseAge, primaryLife, spouseLife, variant: selectedVariant, slab, inflation,
  }), [pp, age, spouseAge, primaryLife, spouseLife, selectedVariant, slab, inflation]);

  const benchmarks: VariantOutcome[] = useMemo(() =>
    BENCH_VARIANTS.map((v) => buildVariant({
      pp, age, spouseAge, primaryLife, spouseLife, variant: v, slab, inflation,
    })), [pp, age, spouseAge, primaryLife, spouseLife, slab, inflation]);

  // Recovery line chart: cumulative net payout vs purchase price recovered
  const recoveryData = useMemo(() => {
    const start = selectedVariant.product === 'deferred' ? selectedVariant.defer : 0;
    const horizon = Math.max(primaryLife - age, 25);
    let cum = 0;
    const rows: { year: number; cum: number; pp: number }[] = [];
    for (let t = 0; t <= horizon; t++) {
      if (t > start) {
        const primaryAlive = t <= (primaryLife - age);
        const spouseAliveAtT = t <= (spouseLife - spouseAge);
        let factor = 0;
        if (selectedVariant.life === 'single') factor = primaryAlive ? 1 : 0;
        else if (selectedVariant.life === 'joint100') factor = (primaryAlive || spouseAliveAtT) ? 1 : 0;
        else factor = primaryAlive ? 1 : (spouseAliveAtT ? 0.5 : 0);
        cum += selected.annual * factor * (1 - slab / 100);
      }
      rows.push({ year: t, cum: Math.round(cum), pp });
    }
    return rows;
  }, [selected.annual, selectedVariant, age, spouseAge, primaryLife, spouseLife, pp, slab]);

  // Insight deltas
  const noRopImmSingle = benchmarks[0];
  const ropImmSingle = benchmarks[1];
  const monthlyIncomeGap = (noRopImmSingle.monthly - ropImmSingle.monthly);
  const jointImmediate = benchmarks[2];
  const irrDropJoint = noRopImmSingle.irr - jointImmediate.irr;
  const deferredSingle = benchmarks[4];
  const realIrrSelected = selected.realIrr;

  const resultContext =
    `PP ${fmt(pp)}, variant ${selected.label}, monthly ₹${formatNumber(Math.round(selected.monthly))}, IRR ${selected.irr.toFixed(2)}%`;

  const irrBarData = benchmarks.map((b) => ({ name: b.label.replace(' • ', '\n'), IRR: +b.irr.toFixed(2), Real: +b.realIrr.toFixed(2) }));

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Scale className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-300 mb-1">Retirement Income Tool</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Annuity Decoder</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base max-w-3xl">
                Decode annuities — Immediate vs Deferred, Single vs Joint, with vs without Return of Purchase Price. See the IRR of each option.
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
              onAgeChange={(v) => setAge(v ?? 60)}
              ageLabel="Your Age"
              namePlaceholder="e.g., Mr. Mehta"
              showAge={true}
            />
            <DownloadPDFButton
              elementId="calculator-results"
              title="Annuity Decoder Report"
              fileName={`Annuity-Decoder-${clientName || 'Report'}`}
            />
          </div>

          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">

            {/* LEFT */}
            <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">

              <div className="border-t-4 border-amber-600 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" /> Purchase & Ages
                </h3>
                <div className="space-y-3">
                  <NumberInput label="Purchase Price" value={pp} onChange={setPp} prefix="Rs." step={100000} min={100000} max={500000000} />
                  <NumberInput label="Your Age" value={age} onChange={setAge} suffix="years" step={1} min={55} max={85} />
                  <NumberInput label="Spouse Age" value={spouseAge} onChange={setSpouseAge} suffix="years" step={1} min={45} max={90} />
                </div>
              </div>

              <div className="border-t-4 border-orange-600 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3">Annuity Type</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Pill value="immediate" current={product} onClick={setProduct} label="Immediate" sub="Starts next month" />
                  <Pill value="deferred" current={product} onClick={setProduct} label="Deferred" sub="Accumulate first" />
                </div>
                {product === 'deferred' && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 mb-2">Deferral Period</div>
                    <div className="grid grid-cols-3 gap-2">
                      {DEFER_OPTIONS.map((d) => (
                        <Pill key={d} value={d} current={defer} onClick={setDefer} label={`${d} yrs`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t-4 border-rose-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3">Life Option</h3>
                <div className="grid grid-cols-3 gap-2">
                  {LIFE_OPTIONS.map((o) => (
                    <Pill key={o.key} value={o.key} current={life} onClick={setLife} label={o.label} sub={o.sub} />
                  ))}
                </div>
                <div
                  className="flex items-center justify-between cursor-pointer pt-4 mt-3 border-t border-slate-100"
                  onClick={() => setRop(!rop)}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <span className="text-[13px] font-semibold text-slate-600">Return of Purchase Price (ROP)</span>
                    <p className="text-[10px] text-slate-400">Lump sum back to nominee on death — lower payout</p>
                  </div>
                  <div className={cn('relative w-10 h-5 rounded-full transition-colors', rop ? 'bg-amber-500' : 'bg-slate-300')}>
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', rop ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                </div>
              </div>

              <div className="border-t-4 border-indigo-500 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3">Tax Slab (on Annuity Income)</h3>
                <div className="grid grid-cols-4 gap-2">
                  {TAX_SLABS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlab(t)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-bold transition-all',
                        slab === t ? 'bg-indigo-600 border-indigo-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      )}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Annuity income is taxed as &quot;Income from Other Sources&quot; at your slab.</p>
              </div>

              <div className="border-t-4 border-slate-400 rounded-xl bg-white p-4">
                <h3 className="font-bold text-slate-800 mb-3">Assumptions</h3>
                <div className="space-y-3">
                  <NumberInput label="Your Life Expectancy" value={primaryLife} onChange={setPrimaryLife} suffix="years" step={1} min={age + 1} max={100} />
                  <NumberInput label="Spouse Life Expectancy" value={spouseLife} onChange={setSpouseLife} suffix="years" step={1} min={spouseAge + 1} max={100} />
                  <NumberInput label="Inflation" value={inflation} onChange={setInflation} suffix="% p.a." step={0.5} min={3} max={8} />
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {/* HERO RESULT */}
              <div className="card-base p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-200">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-700 mb-1">Your Selected Variant</p>
                <div className="text-sm font-bold text-amber-900 mb-3">{selected.label} • Rate {selected.rate.toFixed(2)}%</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] font-semibold text-amber-700 uppercase">Monthly Income</div>
                    <div className="text-2xl font-extrabold text-amber-900">{formatINR(selected.monthly)}</div>
                    <div className="text-[10px] text-slate-500">pre-tax</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-700 uppercase">Pre-tax IRR</div>
                    <div className="text-2xl font-extrabold text-amber-900">{selected.irr.toFixed(2)}%</div>
                    <div className="text-[10px] text-slate-500">over lifetime</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-700 uppercase">Real IRR</div>
                    <div className="text-2xl font-extrabold text-amber-900">{realIrrSelected.toFixed(2)}%</div>
                    <div className="text-[10px] text-slate-500">post-tax, post-inflation</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-700 uppercase">Total Payout (Net)</div>
                    <div className="text-2xl font-extrabold text-amber-900">{fmt(selected.totalPayout + selected.ropReturn)}</div>
                    <div className="text-[10px] text-slate-500">{selected.ropReturn > 0 ? `incl. ${fmt(selected.ropReturn)} ROP` : 'no ROP'}</div>
                  </div>
                </div>
              </div>

              {/* COMPARISON TABLE */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-4">Compare 6 Variants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold">
                        <th className="px-2 py-2 text-left">Variant</th>
                        <th className="px-2 py-2 text-right">Rate</th>
                        <th className="px-2 py-2 text-right">Monthly</th>
                        <th className="px-2 py-2 text-right">Lifetime Payout</th>
                        <th className="px-2 py-2 text-right">ROP Return</th>
                        <th className="px-2 py-2 text-right">Pre-tax IRR</th>
                        <th className="px-2 py-2 text-right">Real IRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.map((b, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white border-t border-slate-100' : 'bg-slate-50/60 border-t border-slate-100'}>
                          <td className="px-2 py-2 font-semibold text-slate-800">{b.label}</td>
                          <td className="px-2 py-2 text-right">{b.rate.toFixed(2)}%</td>
                          <td className="px-2 py-2 text-right">{formatINR(b.monthly)}</td>
                          <td className="px-2 py-2 text-right">{fmt(b.totalPayout)}</td>
                          <td className="px-2 py-2 text-right text-slate-500">{b.ropReturn > 0 ? fmt(b.ropReturn) : '—'}</td>
                          <td className="px-2 py-2 text-right font-bold text-amber-700">{b.irr.toFixed(2)}%</td>
                          <td className="px-2 py-2 text-right font-semibold text-indigo-700">{b.realIrr.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">IRR Across 6 Variants</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={irrBarData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip formatter={(v: number) => `${v}%`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="IRR" fill="#D97706" />
                        <Bar dataKey="Real" fill="#6366F1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-base p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Payout Recovery Over Time</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recoveryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `Yr ${v}`} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l: number) => `Year ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="cum" stroke="#D97706" strokeWidth={2} dot={false} name="Cumulative Net Payout" />
                        <Line type="monotone" dataKey="pp" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Purchase Price" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* INSIGHTS */}
              <div className="card-base p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Insights
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-900">
                      <strong>The ROP myth:</strong> Adding Return of Purchase Price reduces your pre-tax IRR by roughly <strong>{(noRopImmSingle.irr - ropImmSingle.irr).toFixed(1)}%</strong> and costs you about <strong>{formatINR(monthlyIncomeGap)}/month</strong> less income for life. The &quot;principal return&quot; feels safe but is fully paid for by you — it is not free.
                    </p>
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-indigo-900">
                      <strong>Joint Life premium:</strong> Joint Life 100% costs ~<strong>{irrDropJoint.toFixed(2)}% IRR</strong> vs Single Life. You are buying insurance for your spouse&apos;s survival — worthwhile if spouse has no other income, wasteful if they do.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                    <Wallet className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-900">
                      <strong>Deferred trade-off:</strong> Deferred 10y gives <strong>{deferredSingle.rate.toFixed(2)}%</strong> rate vs Immediate&apos;s <strong>{noRopImmSingle.rate.toFixed(2)}%</strong> — but you sacrifice 10 years of income. Break-even is often 18-22 years into the annuity. Works only if you have other income for the deferral window.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-800">
                      <strong>After tax reality:</strong> At your {slab}% slab, your real post-tax, post-inflation yield is only <strong>{realIrrSelected.toFixed(2)}%</strong>. Annuities offer certainty but poor tax efficiency — an SWP from debt/hybrid MFs (equity LTCG 12.5% beyond Rs 1.25L, Budget 2024) can often outperform on post-tax real returns, though without the guarantee.
                    </p>
                  </div>
                </div>
              </div>

              {/* CFP NOTE */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> CFP Note
                </h4>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  Annuities are among the most misunderstood retirement products. The &quot;ROP feels safer&quot; bias costs most retirees 15-20% lower lifetime income. For flexible income with better returns, an SWP from debt/hybrid mutual funds (Regular Plan via MFD) combined with adequate term insurance may outperform — and you keep full control of your capital. Speak to your Trustner Relationship Manager before locking in.
                </p>
              </div>

              <CalculatorLeadForm
                calculatorName="Annuity Decoder"
                accent="amber"
                heading="Should you buy an annuity, or run an MF SWP instead?"
                subtext="Your Trustner Relationship Manager will stress-test this annuity quote against a matched SWP strategy so you see the true lifetime income comparison."
                resultContext={resultContext}
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> {DISCLAIMER.mutual_fund} Annuity rates shown are indicative 2026 benchmarks and vary by insurer (LIC, HDFC Life, ICICI Pru, SBI Life, Max Life). Actual rates depend on age, purchase price, option chosen and current bond yields. Annuity income is fully taxable as Income from Other Sources. This calculator is illustrative and does not constitute financial or insurance advice — consult a qualified advisor before purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
