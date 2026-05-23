'use client';

import { useMemo, useState } from 'react';
import {
  Sparkles, IndianRupee, TrendingUp, BarChart3, LineChart as LineIcon,
  Info, AlertTriangle, CheckCircle2, Scale, ShieldCheck, FileText, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import SharedNumberInput from '@/components/ui/NumberInput';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';
import { MFD_DISCLAIMER } from '@/lib/constants/trail-commission';

const NumberInput = SharedNumberInput;

// ── Palette ───────────────────────────────────────────────
const COLORS = {
  nfo: '#D4A017',       // amber — NFO line / bars
  nfoDeep: '#B8860B',
  alt: '#94A3B8',       // slate — alternative fund
  altDeep: '#64748B',
  good: '#14B8A6',
  warn: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
};

// ── Option lists ──────────────────────────────────────────
const AMCS = ['SBI', 'HDFC', 'ICICI Pru', 'Nippon', 'Kotak', 'Axis', 'Aditya Birla', 'Other'] as const;
const CATEGORIES = [
  { id: 'equity-active', label: 'Equity — Active', defY1: 1.2, defY2: 1.0, defY4: 0.8, defAlt: 0.8 },
  { id: 'equity-index',  label: 'Equity — Index',  defY1: 0.3, defY2: 0.25, defY4: 0.2, defAlt: 0.2 },
  { id: 'hybrid',        label: 'Hybrid',          defY1: 1.0, defY2: 0.85, defY4: 0.7, defAlt: 0.7 },
  { id: 'debt',          label: 'Debt',            defY1: 0.6, defY2: 0.5,  defY4: 0.4, defAlt: 0.4 },
  { id: 'thematic',      label: 'Thematic',        defY1: 1.3, defY2: 1.1,  defY4: 0.9, defAlt: 0.85 },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];
type AMC = typeof AMCS[number];

// ── Formatters ────────────────────────────────────────────
function formatCrore(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  return formatINR(n);
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, sub,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  color?: 'amber' | 'slate' | 'teal' | 'sky';
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            color === 'amber' ? 'bg-amber-100' :
            color === 'slate' ? 'bg-slate-100' :
            color === 'teal'  ? 'bg-teal-50' :
            color === 'sky'   ? 'bg-sky-50' : 'bg-slate-100',
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              color === 'amber' ? 'text-amber-600' :
              color === 'slate' ? 'text-slate-500' :
              color === 'teal'  ? 'text-teal-600' :
              color === 'sky'   ? 'text-sky-600' : 'text-slate-500',
            )}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={cn(
          'text-xl font-extrabold',
          color === 'amber' ? 'text-amber-700' :
          color === 'slate' ? 'text-slate-700' :
          color === 'teal'  ? 'text-teal-700' :
          color === 'sky'   ? 'text-sky-700' : 'text-primary-700',
        )}
      >
        {value}
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function MFDNFOTrackerPage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // ── Section 1: NFO details ───────────────────────────────
  const [amc, setAmc] = useState<AMC>('SBI');
  const [category, setCategory] = useState<CategoryId>('equity-active');
  const [subscriptionAmount, setSubscriptionAmount] = useState(10000000); // ₹1 Cr
  const [holdingPeriod, setHoldingPeriod] = useState(10);

  // ── Section 2: Trail structure ───────────────────────────
  const [nfoY1Rate, setNfoY1Rate] = useState(1.2);
  const [nfoY2to3Rate, setNfoY2to3Rate] = useState(1.0);
  const [nfoY4PlusRate, setNfoY4PlusRate] = useState(0.8);
  const [useFlat, setUseFlat] = useState(false);

  // ── Section 3: Alternative ───────────────────────────────
  const [altRate, setAltRate] = useState(0.8);

  // ── Section 4: Market assumption ─────────────────────────
  const [marketReturn, setMarketReturn] = useState(12);

  // ── Preset categories push default rates ─────────────────
  function pickCategory(id: CategoryId) {
    const c = CATEGORIES.find((x) => x.id === id);
    if (!c) return;
    setCategory(id);
    setNfoY1Rate(c.defY1);
    setNfoY2to3Rate(c.defY2);
    setNfoY4PlusRate(c.defY4);
    setAltRate(c.defAlt);
  }

  // ── Calculations (memoized) ──────────────────────────────
  const calc = useMemo(() => {
    const yrs = Math.max(1, Math.min(30, Math.round(holdingPeriod)));
    const effY1 = useFlat ? nfoY4PlusRate : nfoY1Rate;
    const effY2 = useFlat ? nfoY4PlusRate : nfoY2to3Rate;
    const effY4 = nfoY4PlusRate;

    let nfoAum = subscriptionAmount;
    let altAum = subscriptionAmount;
    let totalNFOTrail = 0;
    let totalAltTrail = 0;

    // Segment totals for breakdown
    let nfoY1Trail = 0;
    let nfoY2to3Trail = 0;
    let nfoY4PlusTrail = 0;

    const rows: {
      year: number;
      nfoAum: number;
      altAum: number;
      nfoRate: number;
      nfoTrail: number;
      altTrail: number;
      cumNfoTrail: number;
      cumAltTrail: number;
    }[] = [];

    for (let y = 1; y <= yrs; y++) {
      nfoAum = nfoAum * (1 + marketReturn / 100);
      altAum = altAum * (1 + marketReturn / 100);

      const rate = y === 1 ? effY1 : y <= 3 ? effY2 : effY4;
      const nfoTrail = (nfoAum * rate) / 100;
      const altTrail = (altAum * altRate) / 100;

      totalNFOTrail += nfoTrail;
      totalAltTrail += altTrail;

      if (y === 1) nfoY1Trail += nfoTrail;
      else if (y <= 3) nfoY2to3Trail += nfoTrail;
      else nfoY4PlusTrail += nfoTrail;

      rows.push({
        year: y,
        nfoAum,
        altAum,
        nfoRate: rate,
        nfoTrail,
        altTrail,
        cumNfoTrail: totalNFOTrail,
        cumAltTrail: totalAltTrail,
      });
    }

    const nfoAdvantage = totalNFOTrail - totalAltTrail;
    const advantagePct = totalAltTrail > 0 ? (nfoAdvantage / totalAltTrail) * 100 : 0;

    return {
      rows,
      totalNFOTrail,
      totalAltTrail,
      nfoAdvantage,
      advantagePct,
      nfoY1Trail,
      nfoY2to3Trail,
      nfoY4PlusTrail,
      finalNFOAum: rows[rows.length - 1]?.nfoAum ?? subscriptionAmount,
    };
  }, [subscriptionAmount, holdingPeriod, nfoY1Rate, nfoY2to3Rate, nfoY4PlusRate, altRate, marketReturn, useFlat]);

  // ── Insights ─────────────────────────────────────────────
  const insights = useMemo(() => {
    const out: { tone: 'good' | 'warn' | 'info' | 'danger'; text: string }[] = [];
    const diff = calc.nfoAdvantage;
    const diffPct = calc.advantagePct;

    if (diff >= 0 && diffPct > 2) {
      out.push({
        tone: 'good',
        text: `The NFO generates ${formatCrore(diff)} more trail over ${holdingPeriod} years than a regular equivalent (+${diffPct.toFixed(1)}%). Most of this uplift comes from the year-1 incentive.`,
      });
    } else if (Math.abs(diffPct) <= 2) {
      out.push({
        tone: 'info',
        text: `The NFO and alternative earn roughly the same trail (${formatCrore(Math.abs(diff))} / ${diffPct.toFixed(1)}%). Decide based on fund suitability for the client, not distributor incentive.`,
      });
    } else {
      out.push({
        tone: 'warn',
        text: `This NFO's trail structure is actually worse than a regular fund by ${formatCrore(Math.abs(diff))} (${diffPct.toFixed(1)}%). Only pursue if the scheme itself fits the client — unique theme, category gap, or conviction pick.`,
      });
    }

    if (!useFlat && holdingPeriod >= 4) {
      out.push({
        tone: 'info',
        text: `By year 4, the NFO trail drops to ${nfoY4PlusRate.toFixed(2)}% — the same ballpark as an established scheme. Most of the incentive is front-loaded into years 1-3.`,
      });
    }

    if (nfoY1Rate >= 1.2) {
      out.push({
        tone: 'warn',
        text: `Year-1 trail of ${nfoY1Rate.toFixed(2)}% is aggressive. AMFI Code of Conduct requires that commission differential cannot be the driver for recommendation — product suitability comes first.`,
      });
    }

    out.push({
      tone: 'danger',
      text: `Remember: do not push NFOs for higher trail. AMFI Code of Conduct and SEBI (Investment Advisers) Regulations prohibit recommending schemes driven by distributor compensation. Suitability > incentive, always.`,
    });

    return out;
  }, [calc, holdingPeriod, nfoY1Rate, nfoY4PlusRate, useFlat]);

  // ── Year-by-year chart data ──────────────────────────────
  const barData = calc.rows.map((r) => ({
    year: `Y${r.year}`,
    NFO: Math.round(r.nfoTrail),
    Alternative: Math.round(r.altTrail),
  }));

  const lineData = calc.rows.map((r) => ({
    year: r.year,
    NFO: Math.round(r.cumNfoTrail),
    Alternative: Math.round(r.cumAltTrail),
  }));

  // ── Trail structure table rows ──────────────────────────
  const structureRows = [
    {
      label: 'Year 1',
      rate: useFlat ? nfoY4PlusRate : nfoY1Rate,
      earned: calc.nfoY1Trail,
    },
    {
      label: 'Year 2-3',
      rate: useFlat ? nfoY4PlusRate : nfoY2to3Rate,
      earned: calc.nfoY2to3Trail,
    },
    {
      label: 'Year 4+',
      rate: nfoY4PlusRate,
      earned: calc.nfoY4PlusTrail,
    },
  ];

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">MFD Business Tools</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  NFO Incentive Tracker
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">MFD NFO Incentive Tracker</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Model NFO trail vs existing-fund trail. See whether the incentive step-down adds up over the full holding period.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MFDBrandBar
        subBrokerName={subBrokerName}
        onSubBrokerNameChange={setSubBrokerName}
        firmName={firmName}
        onFirmNameChange={setFirmName}
        arn={arn}
        onArnChange={setArn}
        pdfElementId="nfo-tracker-report"
        pdfTitle="MFD NFO Incentive Report"
        pdfFileName={`MFD-NFO-Tracker${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="NFO Tracker Report"
      />

      {/* ── Body ────────────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div className="container-custom" id="nfo-tracker-report">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="NFO Tracker Report" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">

            {/* ── LEFT: Inputs ─────────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">

              {/* Section 1: NFO Details */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" /> NFO Details
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Fund, AMC, and subscription amount</p>
                </div>

                {/* AMC pills */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AMC</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AMCS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmc(a)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border transition-all font-medium',
                          amc === a
                            ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                            : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category pills */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Fund Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCategory(c.id)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border transition-all font-medium',
                          category === c.id
                            ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                            : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Selecting a category loads indicative default rates.</p>
                </div>

                <NumberInput
                  label="NFO Subscription Amount"
                  value={subscriptionAmount}
                  onChange={setSubscriptionAmount}
                  prefix="₹"
                  step={500000}
                  min={10000}
                  max={1000000000}
                  hint="AUM the client is placing into the NFO"
                />
                <NumberInput
                  label="Planned Holding Period"
                  value={holdingPeriod}
                  onChange={setHoldingPeriod}
                  suffix="years"
                  step={1}
                  min={1}
                  max={30}
                />
              </div>

              {/* Section 2: Trail Structure */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" /> NFO Trail Structure
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Rates offered by the AMC during the incentive period</p>
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useFlat}
                    onChange={(e) => setUseFlat(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-amber-600 focus:ring-amber-400 mt-0.5"
                  />
                  <span className="leading-snug">
                    Flat rate for all years
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Uses the Year 4+ rate across the full holding period
                    </span>
                  </span>
                </label>

                <NumberInput
                  label="Year 1 Trail Rate"
                  value={nfoY1Rate}
                  onChange={setNfoY1Rate}
                  suffix="% p.a."
                  step={0.05}
                  min={0.1}
                  max={3}
                  hint="Typically the highest — AMC's build-up incentive"
                />
                <NumberInput
                  label="Year 2-3 Trail Rate"
                  value={nfoY2to3Rate}
                  onChange={setNfoY2to3Rate}
                  suffix="% p.a."
                  step={0.05}
                  min={0.1}
                  max={3}
                />
                <NumberInput
                  label="Year 4+ Trail Rate"
                  value={nfoY4PlusRate}
                  onChange={setNfoY4PlusRate}
                  suffix="% p.a."
                  step={0.05}
                  min={0.1}
                  max={3}
                  hint="Steady-state rate after the incentive period"
                />
              </div>

              {/* Section 3: Alternative */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" /> Existing-Fund Alternative
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">What an established regular scheme would pay</p>
                </div>
                <NumberInput
                  label="Alternative Trail Rate"
                  value={altRate}
                  onChange={setAltRate}
                  suffix="% p.a."
                  step={0.05}
                  min={0.1}
                  max={3}
                  hint="Representative trail rate for a mature regular-plan scheme in this category"
                />
              </div>

              {/* Section 4: Market Assumption */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> Market Assumption
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Same growth rate applied to both scenarios (apples-to-apples)</p>
                </div>
                <NumberInput
                  label="Expected Fund Return"
                  value={marketReturn}
                  onChange={setMarketReturn}
                  suffix="% p.a."
                  step={0.5}
                  min={6}
                  max={18}
                />
              </div>

            </div>

            {/* ── RIGHT: Outputs ────────────────────────── */}
            <div className="space-y-8">

              {/* Hero */}
              <div className="rounded-2xl p-6 sm:p-8 border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                    NFO vs Alternative — {holdingPeriod}-Year View
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <div className="text-[11px] uppercase text-amber-600 font-semibold mb-1">NFO Total Trail</div>
                    <div className="text-3xl font-black text-amber-700">{formatCrore(calc.totalNFOTrail)}</div>
                    <div className="text-[11px] text-amber-600 mt-1">Over {holdingPeriod} years</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase text-slate-500 font-semibold mb-1">Alternative Fund Trail</div>
                    <div className="text-3xl font-black text-slate-700">{formatCrore(calc.totalAltTrail)}</div>
                    <div className="text-[11px] text-slate-500 mt-1">At {altRate.toFixed(2)}% flat</div>
                  </div>
                  <div>
                    <div className={cn('text-[11px] uppercase font-semibold mb-1', calc.nfoAdvantage >= 0 ? 'text-teal-600' : 'text-red-600')}>NFO Advantage</div>
                    <div className={cn('text-3xl font-black', calc.nfoAdvantage >= 0 ? 'text-teal-700' : 'text-red-700')}>
                      {calc.nfoAdvantage >= 0 ? '+' : ''}{formatCrore(calc.nfoAdvantage)}
                    </div>
                    <div className={cn('text-[11px] mt-1', calc.nfoAdvantage >= 0 ? 'text-teal-600' : 'text-red-600')}>
                      {calc.advantagePct >= 0 ? '+' : ''}{calc.advantagePct.toFixed(1)}% vs alternative
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={IndianRupee}
                  label="Year 1 Trail"
                  value={formatCrore(calc.nfoY1Trail)}
                  color="amber"
                  sub={`At ${(useFlat ? nfoY4PlusRate : nfoY1Rate).toFixed(2)}%`}
                />
                <StatCard
                  icon={IndianRupee}
                  label="Year 2-3 Trail"
                  value={formatCrore(calc.nfoY2to3Trail)}
                  color="amber"
                  sub={`At ${(useFlat ? nfoY4PlusRate : nfoY2to3Rate).toFixed(2)}%`}
                />
                <StatCard
                  icon={IndianRupee}
                  label="Year 4+ Trail"
                  value={formatCrore(calc.nfoY4PlusTrail)}
                  color="slate"
                  sub={`At ${nfoY4PlusRate.toFixed(2)}% p.a.`}
                />
                <StatCard
                  icon={TrendingUp}
                  label={`Total (${holdingPeriod}y)`}
                  value={formatCrore(calc.totalNFOTrail)}
                  color="teal"
                  sub={`Final AUM ${formatCrore(calc.finalNFOAum)}`}
                />
              </div>

              {/* Bar chart — year-by-year */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" /> Year-by-Year Trail Income
                </h3>
                <p className="text-sm text-slate-500 mb-5">NFO (amber) vs Alternative (slate) — annual trail earned each year</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="NFO" fill={COLORS.nfo} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Alternative" fill={COLORS.alt} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line chart — cumulative */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5 flex items-center gap-2">
                  <LineIcon className="w-4 h-4 text-amber-600" /> Cumulative Trail Income
                </h3>
                <p className="text-sm text-slate-500 mb-5">Running total of trail earned over the holding period</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelFormatter={(l) => `Year ${l}`}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="NFO" stroke={COLORS.nfo} strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Alternative" stroke={COLORS.altDeep} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trail structure table */}
              <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
                <div className="p-5 pb-0">
                  <h3 className="font-bold text-primary-700 text-lg mb-0.5">NFO Trail Structure Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {amc} NFO — {CATEGORIES.find((c) => c.id === category)?.label}, {holdingPeriod}-year view
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-surface-300 bg-slate-50">
                        <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase">Period</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">Rate (NFO)</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">Rate (Alt)</th>
                        <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase">Trail Earned (NFO)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structureRows.map((r, i) => (
                        <tr key={r.label} className={cn('border-b border-surface-200', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                          <td className="py-3.5 px-5 font-bold text-primary-700">{r.label}</td>
                          <td className="py-3.5 px-5 text-right font-semibold text-amber-700">{r.rate.toFixed(2)}%</td>
                          <td className="py-3.5 px-5 text-right text-slate-500">{altRate.toFixed(2)}%</td>
                          <td className="py-3.5 px-5 text-right font-bold text-amber-700">{formatCrore(r.earned)}</td>
                        </tr>
                      ))}
                      <tr className="bg-amber-50 border-t-2 border-amber-200">
                        <td className="py-3.5 px-5 font-bold text-amber-800">Total ({holdingPeriod}y)</td>
                        <td className="py-3.5 px-5 text-right text-amber-700">—</td>
                        <td className="py-3.5 px-5 text-right text-amber-700">—</td>
                        <td className="py-3.5 px-5 text-right font-black text-amber-800">{formatCrore(calc.totalNFOTrail)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights block */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-1 flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-600" /> Insights
                </h3>
                <p className="text-sm text-slate-500 mb-4">What the numbers are telling you</p>
                <div className="space-y-3">
                  {insights.map((ins, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-lg p-4 border flex gap-3',
                        ins.tone === 'warn'   && 'bg-amber-50 border-amber-200',
                        ins.tone === 'good'   && 'bg-teal-50 border-teal-200',
                        ins.tone === 'info'   && 'bg-sky-50 border-sky-200',
                        ins.tone === 'danger' && 'bg-red-50 border-red-200',
                      )}
                    >
                      {ins.tone === 'warn'   && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      {ins.tone === 'good'   && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                      {ins.tone === 'info'   && <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
                      {ins.tone === 'danger' && <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                      <p className={cn(
                        'text-sm leading-relaxed',
                        ins.tone === 'warn'   && 'text-amber-800',
                        ins.tone === 'good'   && 'text-teal-800',
                        ins.tone === 'info'   && 'text-sky-800',
                        ins.tone === 'danger' && 'text-red-800',
                      )}>
                        {ins.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client suitability checklist */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Client Suitability Checklist
                </h3>
                <p className="text-sm text-slate-500 mb-4">CFP guardrail — complete before recommending an NFO</p>
                <ul className="space-y-2.5">
                  {[
                    'Is the NFO\'s category appropriate for the client\'s risk profile and time horizon?',
                    'Does this NFO replace or complement existing holdings — not duplicate them?',
                    'Is the fund manager\'s track record and AMC pedigree appropriate for the mandate?',
                    'Is the minimum subscription within the client\'s investable surplus (not from emergency fund / goal money)?',
                    'Is there any NFO-specific risk — untested strategy, new theme, narrow mandate — the client needs to understand?',
                    'Would you recommend this same scheme if the trail rate were identical to existing funds?',
                  ].map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 w-4 h-4 rounded border-2 border-teal-300 bg-teal-50 shrink-0" />
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CFP / Business Note */}
              <div className="bg-slate-50 rounded-xl p-6 border border-surface-300">
                <h3 className="font-bold text-primary-700 text-base mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> CFP / Business Note
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  NFO incentives are real but often <strong>front-loaded</strong>. A 1.2% &rarr; 0.8% step-down means years 4-10 pay the same as any established fund anyway — so the &ldquo;extra&rdquo; comes almost entirely from years 1-3. Always prioritise fund suitability for the client over distributor compensation. The <strong>AMFI Code of Conduct</strong> is explicit: <em>do not recommend schemes merely for higher commission</em>. SEBI&rsquo;s advertisement code and the Mutual Fund Distributor Regulations reinforce this. Use this calculator to evaluate the <strong>economic trade-off</strong>, not to justify unsuitable recommendations.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom space-y-1.5">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            NFO trail rates vary by AMC, scheme mandate, and plan type, and are subject to change. This calculator uses user-supplied rates for modelling only.
          </p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.trail}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.internal}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.general}</p>
        </div>
      </section>
    </>
  );
}
