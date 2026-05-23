'use client';

import { useState, useMemo } from 'react';
import {
  Award, IndianRupee, Users, TrendingUp, Wallet, BarChart3, Target,
  AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import {
  LineChart as RLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { MFD_CONSTANTS, MFD_DISCLAIMER, MFD_COLORS } from '@/lib/constants/trail-commission';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import NumberInput from '@/components/ui/NumberInput';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';

// ── Trail rates per asset class (% p.a. on AUM) ──────────
const TRAIL_BY_CLASS = {
  equity: 0.8,
  hybrid: 0.6,
  debt: 0.3,
  liquid: 0.1,
} as const;

// ── Client presets ────────────────────────────────────────
type ClientPreset = 'retail' | 'affluent' | 'hni' | 'custom';
const CLIENT_PRESETS: { id: ClientPreset; label: string; sip: number; lumpSum: number; hint: string }[] = [
  { id: 'retail', label: 'Retail', sip: 5000, lumpSum: 50000, hint: '₹5k SIP' },
  { id: 'affluent', label: 'Affluent', sip: 25000, lumpSum: 500000, hint: '₹25k SIP' },
  { id: 'hni', label: 'HNI', sip: 100000, lumpSum: 2500000, hint: '₹1L SIP' },
  { id: 'custom', label: 'Custom', sip: 10000, lumpSum: 100000, hint: 'Your values' },
];

// ── Small UI pieces ──────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'amber', sub }: {
  icon: typeof IndianRupee; label: string; value: string; color?: 'amber' | 'blue' | 'green' | 'purple'; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
          color === 'amber' && 'bg-amber-100',
          color === 'blue' && 'bg-brand-50',
          color === 'green' && 'bg-teal-50',
          color === 'purple' && 'bg-secondary-50',
        )}>
          <Icon className={cn('w-4 h-4',
            color === 'amber' && 'text-amber-600',
            color === 'blue' && 'text-brand',
            color === 'green' && 'text-teal-600',
            color === 'purple' && 'text-secondary-600',
          )} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold',
        color === 'amber' && 'text-amber-700',
        color === 'blue' && 'text-brand',
        color === 'green' && 'text-teal-700',
        color === 'purple' && 'text-secondary-700',
      )}>{value}</div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MixSlider({ label, value, onChange, color }: {
  label: string; value: number; onChange: (n: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}

// ── LTV Core Calculation ─────────────────────────────────
interface LTVParams {
  initialLumpSum: number;
  monthlySIP: number;
  stepUpEnabled: boolean;
  stepUpPct: number;
  tenure: number;
  blendedTrailRate: number; // decimal, e.g. 0.0064
  marketReturn: number;     // percent, e.g. 12
  churnPct: number;         // 0-20, 0 = no churn
  discountRate?: number;    // default 0.10
}

interface YearRow {
  year: number;
  sipInflowThisYear: number;
  cumulativeSIP: number;
  aum: number;
  annualTrail: number;      // raw trail
  retentionFactor: number;
  effectiveTrail: number;   // trail × retention
  cumulativeTrail: number;  // cumulative effective
  discountedTrail: number;
}

function computeLTV(p: LTVParams) {
  const discountRate = p.discountRate ?? 0.10;
  const rows: YearRow[] = [];
  let aum = p.initialLumpSum;
  let cumulativeSIP = 0;
  let cumulativeTrail = 0;
  let ltvNominal = 0;
  let ltvNPV = 0;

  for (let y = 1; y <= p.tenure; y++) {
    const sipThisYear = p.stepUpEnabled
      ? p.monthlySIP * 12 * Math.pow(1 + p.stepUpPct / 100, y - 1)
      : p.monthlySIP * 12;
    cumulativeSIP += sipThisYear;
    aum = aum * (1 + p.marketReturn / 100) + sipThisYear;
    const annualTrail = aum * p.blendedTrailRate;
    const retentionFactor = p.churnPct > 0 ? Math.pow(1 - p.churnPct / 100, y) : 1;
    const effectiveTrail = annualTrail * retentionFactor;
    const discountedTrail = effectiveTrail / Math.pow(1 + discountRate, y);
    cumulativeTrail += effectiveTrail;
    ltvNominal += effectiveTrail;
    ltvNPV += discountedTrail;
    rows.push({
      year: y,
      sipInflowThisYear: sipThisYear,
      cumulativeSIP,
      aum,
      annualTrail,
      retentionFactor,
      effectiveTrail,
      cumulativeTrail,
      discountedTrail,
    });
  }

  return {
    rows,
    finalAUM: rows[rows.length - 1]?.aum ?? 0,
    ltvNominal,
    ltvNPV,
    cumulativeSIP,
  };
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

export default function MFDClientLTVPage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // ── Section 1: Client Profile ─────────────────────────
  const [preset, setPreset] = useState<ClientPreset>('custom');
  const [initialLumpSum, setInitialLumpSum] = useState(100000);
  const [monthlySIP, setMonthlySIP] = useState(10000);
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [tenure, setTenure] = useState(15);

  // ── Section 2: Portfolio Mix ──────────────────────────
  const [equityPct, setEquityPct] = useState(60);
  const [hybridPct, setHybridPct] = useState(20);
  const [debtPct, setDebtPct] = useState(20);
  const liquidPct = Math.max(0, 100 - equityPct - hybridPct - debtPct);
  const mixTotal = equityPct + hybridPct + debtPct + liquidPct;
  const mixValid = mixTotal === 100;

  // Blended trail rate (decimal fraction)
  const blendedTrailRate = useMemo(() => (
    (equityPct * TRAIL_BY_CLASS.equity +
      hybridPct * TRAIL_BY_CLASS.hybrid +
      debtPct * TRAIL_BY_CLASS.debt +
      liquidPct * TRAIL_BY_CLASS.liquid) / 100 / 100
  ), [equityPct, hybridPct, debtPct, liquidPct]);
  const blendedTrailPct = blendedTrailRate * 100;

  // ── Section 3: Market Assumptions ─────────────────────
  const [marketReturn, setMarketReturn] = useState(12);
  const [churnEnabled, setChurnEnabled] = useState(false);
  const [churnPct, setChurnPct] = useState(5);

  // ── Section 4: Acquisition Costs ──────────────────────
  const [marketingSpend, setMarketingSpend] = useState(5000);
  const [onboardingHours, setOnboardingHours] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(1000);
  const onboardingCost = onboardingHours * hourlyRate;
  const cac = marketingSpend + onboardingCost;

  // Apply preset
  const applyPreset = (id: ClientPreset) => {
    setPreset(id);
    if (id === 'custom') return;
    const p = CLIENT_PRESETS.find((x) => x.id === id)!;
    setMonthlySIP(p.sip);
    setInitialLumpSum(p.lumpSum);
  };

  // ── Core calculation ──────────────────────────────────
  const result = useMemo(() => computeLTV({
    initialLumpSum,
    monthlySIP,
    stepUpEnabled,
    stepUpPct,
    tenure,
    blendedTrailRate,
    marketReturn,
    churnPct: churnEnabled ? churnPct : 0,
  }), [initialLumpSum, monthlySIP, stepUpEnabled, stepUpPct, tenure, blendedTrailRate, marketReturn, churnEnabled, churnPct]);

  // Scenario comparison (bear / base / bull)
  const scenarios = useMemo(() => {
    const base = (ret: number) => computeLTV({
      initialLumpSum, monthlySIP, stepUpEnabled, stepUpPct, tenure,
      blendedTrailRate, marketReturn: ret,
      churnPct: churnEnabled ? churnPct : 0,
    });
    return {
      bear: base(8),
      base: base(12),
      bull: base(15),
    };
  }, [initialLumpSum, monthlySIP, stepUpEnabled, stepUpPct, tenure, blendedTrailRate, churnEnabled, churnPct]);

  // Churn delta: what LTV would be without churn
  const noChurnLTV = useMemo(() => (
    churnEnabled
      ? computeLTV({
          initialLumpSum, monthlySIP, stepUpEnabled, stepUpPct, tenure,
          blendedTrailRate, marketReturn, churnPct: 0,
        }).ltvNominal
      : result.ltvNominal
  ), [churnEnabled, initialLumpSum, monthlySIP, stepUpEnabled, stepUpPct, tenure, blendedTrailRate, marketReturn, result.ltvNominal]);
  const churnDrop = Math.max(0, noChurnLTV - result.ltvNominal);

  // LTV/CAC & payback year
  const ltvToCAC = cac > 0 ? result.ltvNominal / cac : 0;
  const paybackYear = useMemo(() => {
    const row = result.rows.find((r) => r.cumulativeTrail >= cac);
    return row?.year ?? null;
  }, [result.rows, cac]);

  // Ratio health band
  const ratioBand: 'healthy' | 'marginal' | 'unprofitable' =
    ltvToCAC >= 3 ? 'healthy' : ltvToCAC >= 1 ? 'marginal' : 'unprofitable';

  // ── Chart data ────────────────────────────────────────
  const trailLineData = result.rows.map((r) => ({
    year: `Yr ${r.year}`,
    trail: Math.round(r.effectiveTrail),
  }));
  const stackedBarData = [{
    name: 'Per Client',
    cac: cac,
    trail: Math.round(result.ltvNominal),
  }];

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <>
      {/* ── Premium Header ────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Award className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">{MFD_CONSTANTS.title}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Client LTV vs CAC
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">Client Lifetime Value Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Compute per-client lifetime trail value vs acquisition cost — plan sustainable client acquisition.
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
        pdfElementId="client-ltv-results"
        pdfTitle="MFD Client Lifetime Value Report"
        pdfFileName={`MFD-Client-LTV${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="Client LTV Report"
      />

      {/* ── Content ───────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div id="client-ltv-results" className="container-custom">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="Client LTV Report" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">
            {/* ═══ LEFT PANEL ═════════════════════════ */}
            <div className="space-y-5 lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">

              {/* Section 1: Client Profile */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg">Client Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">Who is this client? Set SIP, lump sum, and tenure.</p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CLIENT_PRESETS.map((p) => (
                    <button
                      key={p.id} onClick={() => applyPreset(p.id)}
                      className={cn(
                        'text-xs px-2 py-2 rounded-lg border font-semibold transition-all',
                        preset === p.id
                          ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                          : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
                      )}
                    >
                      <div>{p.label}</div>
                      <div className="text-[9px] font-normal text-slate-500 mt-0.5">{p.hint}</div>
                    </button>
                  ))}
                </div>
                <NumberInput label="Initial Lump Sum Placed" value={initialLumpSum} onChange={setInitialLumpSum} prefix="₹" step={25000} min={0} max={50000000} hint="One-time investment at onboarding" />
                <NumberInput label="Monthly SIP" value={monthlySIP} onChange={setMonthlySIP} prefix="₹" step={500} min={500} max={100000000} />
                <div className="flex items-center justify-between bg-surface-100 rounded-lg px-3 py-2.5 border border-surface-200">
                  <label htmlFor="stepup" className="text-xs font-semibold text-slate-600 cursor-pointer">Step-up SIP annually</label>
                  <input
                    id="stepup" type="checkbox" checked={stepUpEnabled}
                    onChange={(e) => setStepUpEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                {stepUpEnabled && (
                  <NumberInput label="Step-up Rate" value={stepUpPct} onChange={setStepUpPct} suffix="% p.a." step={1} min={1} max={30} hint="SIP grows by this % every year" />
                )}
                <NumberInput label="Expected Client Tenure" value={tenure} onChange={setTenure} suffix="years" step={1} min={1} max={50} hint="Relationship horizon" />
              </div>

              {/* Section 2: Portfolio Mix */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-4">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg">Portfolio Mix</h2>
                  <p className="text-xs text-slate-500 mt-1">Drives blended trail rate.</p>
                </div>
                <MixSlider label="Equity Funds" value={equityPct} onChange={setEquityPct} color="#0F766E" />
                <MixSlider label="Hybrid Funds" value={hybridPct} onChange={setHybridPct} color="#D4A017" />
                <MixSlider label="Debt Funds" value={debtPct} onChange={setDebtPct} color="#64748B" />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Liquid (auto): <span className="font-bold text-slate-700">{liquidPct}%</span></span>
                  <span className={cn('font-bold', mixValid ? 'text-teal-600' : 'text-red-600')}>
                    Total: {mixTotal}% {mixValid ? '✓' : '— must equal 100%'}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Blended Trail Rate</p>
                  <p className="text-lg font-black text-amber-700">{blendedTrailPct.toFixed(3)}% p.a.</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Weighted avg of Eq 0.8% / Hyb 0.6% / Debt 0.3% / Liq 0.1%</p>
                </div>
              </div>

              {/* Section 3: Market Assumptions */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-4">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg">Market &amp; Retention</h2>
                </div>
                <NumberInput label="Expected Market Return" value={marketReturn} onChange={setMarketReturn} suffix="%" step={0.5} min={6} max={18} />
                <div className="flex items-center justify-between bg-surface-100 rounded-lg px-3 py-2.5 border border-surface-200">
                  <label htmlFor="churn" className="text-xs font-semibold text-slate-600 cursor-pointer">Model annual churn probability</label>
                  <input
                    id="churn" type="checkbox" checked={churnEnabled}
                    onChange={(e) => setChurnEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                {churnEnabled ? (
                  <NumberInput label="Annual Churn Probability" value={churnPct} onChange={setChurnPct} suffix="%" step={1} min={0} max={20} hint="Probability client leaves in any given year" />
                ) : (
                  <p className="text-xs text-slate-500 italic">Assuming client stays the full tenure.</p>
                )}
              </div>

              {/* Section 4: CAC */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-4">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg">Acquisition Cost (CAC)</h2>
                  <p className="text-xs text-slate-500 mt-1">What it costs to acquire this client.</p>
                </div>
                <NumberInput label="Marketing Spend" value={marketingSpend} onChange={setMarketingSpend} prefix="₹" step={500} min={0} max={500000} hint="Ads, content, referral fees" />
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput label="Onboarding Hours" value={onboardingHours} onChange={setOnboardingHours} suffix="hrs" step={0.5} min={0} max={100} />
                  <NumberInput label="Hourly Rate" value={hourlyRate} onChange={setHourlyRate} prefix="₹" step={250} min={0} max={10000} />
                </div>
                <div className="bg-surface-100 border border-surface-200 rounded-lg px-3 py-2.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Onboarding cost:</span>
                    <span className="font-semibold text-slate-700">{formatINR(onboardingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-surface-200">
                    <span className="font-semibold text-slate-700">Total CAC:</span>
                    <span className="font-black text-primary-700">{formatINR(cac)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT PANEL ════════════════════════ */}
            <div className="space-y-6">
              {/* Hero Card */}
              <div className={cn(
                'rounded-2xl p-6 border-2 shadow-lg',
                ratioBand === 'healthy' && 'bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 border-teal-300',
                ratioBand === 'marginal' && 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300',
                ratioBand === 'unprofitable' && 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-300',
              )}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <div className={cn('text-[10px] uppercase tracking-wider font-semibold mb-1',
                      ratioBand === 'healthy' && 'text-teal-600',
                      ratioBand === 'marginal' && 'text-amber-600',
                      ratioBand === 'unprofitable' && 'text-red-600',
                    )}>Lifetime Trail per Client</div>
                    <div className={cn('text-4xl font-black',
                      ratioBand === 'healthy' && 'text-teal-700',
                      ratioBand === 'marginal' && 'text-amber-700',
                      ratioBand === 'unprofitable' && 'text-red-700',
                    )}>{formatINR(result.ltvNominal)}</div>
                    <div className="text-xs text-slate-500 mt-1">Nominal over {tenure} years</div>
                  </div>
                  <div>
                    <div className={cn('text-[10px] uppercase tracking-wider font-semibold mb-1',
                      ratioBand === 'healthy' && 'text-teal-600',
                      ratioBand === 'marginal' && 'text-amber-600',
                      ratioBand === 'unprofitable' && 'text-red-600',
                    )}>LTV / CAC Ratio</div>
                    <div className={cn('text-4xl font-black flex items-baseline gap-2',
                      ratioBand === 'healthy' && 'text-teal-700',
                      ratioBand === 'marginal' && 'text-amber-700',
                      ratioBand === 'unprofitable' && 'text-red-700',
                    )}>
                      {ltvToCAC.toFixed(1)}x
                      <span className="text-xs font-semibold">
                        {ratioBand === 'healthy' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                        {ratioBand === 'marginal' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            <Info className="w-3 h-3" /> Watch margin
                          </span>
                        )}
                        {ratioBand === 'unprofitable' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Unprofitable
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">CAC: {formatINR(cac)}</div>
                  </div>
                </div>
              </div>

              {/* 4 Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={BarChart3} label="Final AUM" value={formatINR(result.finalAUM)} color="blue" sub={`End of yr ${tenure}`} />
                <StatCard icon={IndianRupee} label="Total Trail (Nominal)" value={formatINR(result.ltvNominal)} color="amber" />
                <StatCard icon={TrendingUp} label="NPV @ 10%" value={formatINR(result.ltvNPV)} color="green" sub="Real value today" />
                <StatCard icon={Wallet} label="Cumulative SIP" value={formatINR(result.cumulativeSIP)} color="purple" />
              </div>

              {/* Line chart: yearly trail */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">Year-by-Year Trail Income</h3>
                <p className="text-sm text-slate-500 mb-5">Late-tenure years compound hardest — why retention matters.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={trailLineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(v: number) => [formatINR(v), 'Annual trail']}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      {paybackYear && (
                        <ReferenceLine x={`Yr ${paybackYear}`} stroke={MFD_COLORS.milestone} strokeDasharray="6 3" strokeWidth={2}
                          label={{ value: 'CAC recovered', position: 'top', fontSize: 10, fill: MFD_COLORS.milestone, fontWeight: 700 }} />
                      )}
                      <Line type="monotone" dataKey="trail" stroke={MFD_COLORS.trail} strokeWidth={2.5}
                        dot={{ r: 3, fill: MFD_COLORS.trail }} activeDot={{ r: 5 }} name="Annual trail" />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stacked bar: CAC vs LTV */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">CAC (upfront) vs Lifetime Trail Earned</h3>
                <p className="text-sm text-slate-500 mb-5">Visual of profit-per-client after acquisition cost.</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedBarData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} width={80} />
                      <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="cac" stackId="a" fill="#DC2626" name="CAC (upfront)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="trail" stackId="a" fill={MFD_COLORS.aum} name="Lifetime Trail" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-primary-700 text-lg">Insights</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      Your LTV/CAC ratio of <b>{ltvToCAC.toFixed(1)}x</b> is{' '}
                      <b className={cn(
                        ratioBand === 'healthy' && 'text-teal-700',
                        ratioBand === 'marginal' && 'text-amber-700',
                        ratioBand === 'unprofitable' && 'text-red-700',
                      )}>{ratioBand === 'healthy' ? 'healthy' : ratioBand === 'marginal' ? 'marginal — watch your margin' : 'unprofitable — rethink acquisition'}</b>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      {paybackYear
                        ? <>Clients are profitable starting <b>year {paybackYear}</b> when cumulative trail crosses CAC of {formatINR(cac)}.</>
                        : <>Cumulative trail does not recover CAC within the {tenure}-year horizon. Reduce CAC or extend tenure.</>}
                    </span>
                  </li>
                  {churnEnabled && churnPct > 0 && (
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>
                        Churn of <b>{churnPct}%</b> annually drops LTV by <b>{formatINR(churnDrop)}</b> vs the full-retention case.
                      </span>
                    </li>
                  )}
                  {result.ltvNominal > 50000 && (
                    <li className="flex gap-2">
                      <span className="text-teal-500 font-bold">•</span>
                      <span>
                        Affluent clients like this justify higher acquisition spend — consider personalised onboarding, in-person meetings, and annual reviews.
                      </span>
                    </li>
                  )}
                  {result.ltvNominal < 10000 && (
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        Low-ticket clients — keep CAC under <b>{formatINR(result.ltvNominal / 3)}</b> to stay profitable. Digital acquisition (WhatsApp, referrals, content) is essential.
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Scenario Table */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">Market Scenarios</h3>
                <p className="text-sm text-slate-500 mb-5">Same client, different return environments.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-surface-300 bg-slate-50">
                        <th className="text-left py-3 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Scenario</th>
                        <th className="text-right py-3 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Return</th>
                        <th className="text-right py-3 px-4 font-bold text-amber-700 text-xs uppercase tracking-wider">LTV (Nominal)</th>
                        <th className="text-right py-3 px-4 font-bold text-teal-700 text-xs uppercase tracking-wider">LTV / CAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Bear', ret: 8, data: scenarios.bear, color: 'text-red-600' },
                        { label: 'Base', ret: 12, data: scenarios.base, color: 'text-slate-700' },
                        { label: 'Bull', ret: 15, data: scenarios.bull, color: 'text-teal-600' },
                      ].map((s, i) => (
                        <tr key={s.label} className={cn('border-b border-surface-200', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                          <td className={cn('py-3.5 px-4 font-bold', s.color)}>{s.label}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-600">{s.ret}%</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-700">{formatINR(s.data.ltvNominal)}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-teal-700">
                            {cac > 0 ? (s.data.ltvNominal / cac).toFixed(1) + 'x' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CFP/Business Note */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider">MFD Business Note</h4>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">
                  LTV calculations are crucial for sustainable MFD businesses. A healthy ratio is <b>LTV &gt; 3× CAC</b>. In
                  mutual fund distribution, most profit comes in <b>years 5–15</b> as AUM compounds while acquisition costs were
                  paid upfront. High-churn segments (&lt;60% retention) can erode profitability sharply — invest in annual
                  reviews, goal-based planning, and behavioural coaching to keep clients across market cycles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────── */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom space-y-1.5">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.trail}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.internal}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.general}</p>
        </div>
      </section>
    </>
  );
}
