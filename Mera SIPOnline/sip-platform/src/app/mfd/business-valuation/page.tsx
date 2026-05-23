'use client';

import { useState, useMemo } from 'react';
import {
  Briefcase, IndianRupee, TrendingUp, TrendingDown, Users,
  Shield, Gauge, Award, CheckCircle2, AlertTriangle, Calculator,
  ArrowUpRight, ArrowDownRight, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { MFD_CONSTANTS, MFD_DISCLAIMER, MFD_COLORS } from '@/lib/constants/trail-commission';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import NumberInput from '@/components/ui/NumberInput';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';

// ── Types ────────────────────────────────────────────────
type Trajectory = 'declining' | 'stable' | 'growing' | 'high-growth';
type Compliance = 'clean' | 'minor' | 'major';
type TechStack = 'manual' | 'basic' | 'advanced';

// ── Pill Group Helper ────────────────────────────────────
function PillGroup<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'text-xs px-3 py-2 rounded-lg border transition-all font-medium',
              value === opt.id
                ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────
function Toggle({
  label, value, onChange, hint,
}: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-600">{label}</p>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          value ? 'bg-amber-500' : 'bg-slate-300',
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          value ? 'translate-x-6' : 'translate-x-1',
        )} />
      </button>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color = 'slate', sub,
}: { icon: typeof IndianRupee; label: string; value: string; color?: 'amber' | 'blue' | 'green' | 'red' | 'slate'; sub?: string }) {
  const iconBg = {
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-brand-50 text-brand',
    green: 'bg-teal-50 text-teal-600',
    red: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-500',
  }[color];
  const valCol = {
    amber: 'text-amber-700',
    blue: 'text-brand',
    green: 'text-teal-700',
    red: 'text-rose-700',
    slate: 'text-primary-700',
  }[color];
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold', valCol)}>{value}</div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VALUATION ENGINE
// ══════════════════════════════════════════════════════════

interface Adjustment {
  label: string;
  impact: number; // e.g. +0.15 or -0.20
  active: boolean;
  direction: 'positive' | 'negative';
}

function buildAdjustments(input: {
  sipPct: number;
  avgTenure: number;
  top10Pct: number;
  largestClientPct: number;
  compliance: Compliance;
  teamSize: number;
  techStack: TechStack;
  successor: boolean;
}): Adjustment[] {
  const { sipPct, avgTenure, top10Pct, largestClientPct, compliance, teamSize, techStack, successor } = input;
  return [
    { label: 'High SIP share (>50%)', impact: 0.15, active: sipPct > 50, direction: 'positive' },
    { label: 'Low SIP share (<20%)', impact: -0.20, active: sipPct < 20, direction: 'negative' },
    { label: 'Long avg tenure (>10 yrs)', impact: 0.10, active: avgTenure > 10, direction: 'positive' },
    { label: 'Short avg tenure (<3 yrs)', impact: -0.15, active: avgTenure < 3, direction: 'negative' },
    { label: 'Top-10 concentration >40%', impact: -0.20, active: top10Pct > 40, direction: 'negative' },
    { label: 'Well-diversified (Top-10 <15%)', impact: 0.10, active: top10Pct < 15, direction: 'positive' },
    { label: 'Single client >20% AUM', impact: -0.25, active: largestClientPct > 20, direction: 'negative' },
    { label: 'Major compliance issues', impact: -0.30, active: compliance === 'major', direction: 'negative' },
    { label: 'Minor compliance issues', impact: -0.10, active: compliance === 'minor', direction: 'negative' },
    { label: 'Resilient team (5+ people)', impact: 0.15, active: teamSize >= 5, direction: 'positive' },
    { label: 'Advanced tech stack', impact: 0.10, active: techStack === 'advanced', direction: 'positive' },
    { label: 'No successor in place', impact: -0.10, active: !successor, direction: 'negative' },
  ];
}

function computeValuation(params: {
  annualTrail: number;
  totalAUM: number;
  trajectory: Trajectory;
  adjustments: Adjustment[];
}) {
  const { annualTrail, totalAUM, trajectory, adjustments } = params;
  const baseMultiple =
    trajectory === 'declining' ? 1.75 :
    trajectory === 'stable' ? 2.75 :
    trajectory === 'growing' ? 4.0 : 5.5;

  let adj = 1.0;
  adjustments.forEach((a) => { if (a.active) adj *= (1 + a.impact); });

  const finalMultiple = baseMultiple * adj;

  // Method 1: Income Multiple
  const incomeMultiple = annualTrail * finalMultiple;

  // Method 2: % of AUM — scales with book quality (0.75% to 1.25%)
  //   Use a blend of quality signals to place the rate within the band.
  const qualityScore = Math.max(0, Math.min(1, (adj - 0.6) / 0.9)); // normalize roughly 0..1
  const aumRate = 0.0075 + qualityScore * (0.0125 - 0.0075);
  const aumMethod = totalAUM * aumRate;

  // Method 3: DCF — 10 years of trail, growth 6% AUM, discount 12%
  const growth = 0.06;
  const discount = 0.12;
  let dcf = 0;
  for (let y = 1; y <= 10; y++) {
    const yearTrail = annualTrail * Math.pow(1 + growth, y - 1);
    dcf += yearTrail / Math.pow(1 + discount, y);
  }

  const average = (incomeMultiple + aumMethod + dcf) / 3;

  return {
    baseMultiple,
    adj,
    finalMultiple,
    incomeMultiple,
    aumMethod,
    aumRate,
    dcf,
    average,
    valuationLow: average * 0.85,
    valuationMid: average,
    valuationHigh: average * 1.15,
  };
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

export default function MFDBusinessValuationPage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // Section 1
  const [yearsInBusiness, setYearsInBusiness] = useState(10);
  const [totalAUMCr, setTotalAUMCr] = useState(50); // in Cr
  const [annualTrail, setAnnualTrail] = useState(4000000);
  const [trajectory, setTrajectory] = useState<Trajectory>('growing');

  // Section 2
  const [sipPct, setSipPct] = useState(40);
  const [clientCount, setClientCount] = useState(300);
  const [avgClientAge, setAvgClientAge] = useState(45);
  const [avgTenure, setAvgTenure] = useState(7);
  const [equityPct, setEquityPct] = useState(55);

  // Section 3
  const [top10Pct, setTop10Pct] = useState(25);
  const [largestClientPct, setLargestClientPct] = useState(8);

  // Section 4
  const [compliance, setCompliance] = useState<Compliance>('clean');
  const [teamSize, setTeamSize] = useState(2);
  const [techStack, setTechStack] = useState<TechStack>('basic');
  const [successor, setSuccessor] = useState(false);

  const totalAUM = totalAUMCr * 10000000;

  const adjustments = useMemo(() => buildAdjustments({
    sipPct, avgTenure, top10Pct, largestClientPct, compliance, teamSize, techStack, successor,
  }), [sipPct, avgTenure, top10Pct, largestClientPct, compliance, teamSize, techStack, successor]);

  const val = useMemo(() => computeValuation({
    annualTrail, totalAUM, trajectory, adjustments,
  }), [annualTrail, totalAUM, trajectory, adjustments]);

  const adjustmentImpactPct = (val.adj - 1) * 100;

  // Scenario: improved SIP (60%) + reduced top-10 (20%)
  const improvedAdj = useMemo(() => buildAdjustments({
    sipPct: Math.max(sipPct, 60), avgTenure, top10Pct: Math.min(top10Pct, 20),
    largestClientPct, compliance, teamSize, techStack, successor,
  }), [sipPct, avgTenure, top10Pct, largestClientPct, compliance, teamSize, techStack, successor]);

  const improvedVal = useMemo(() => computeValuation({
    annualTrail, totalAUM, trajectory, adjustments: improvedAdj,
  }), [annualTrail, totalAUM, trajectory, improvedAdj]);

  // Chart data
  const chartData = [
    { name: '% of AUM', value: val.aumMethod, fill: MFD_COLORS.aum },
    { name: 'Income Multiple', value: val.incomeMultiple, fill: MFD_COLORS.trail },
    { name: 'DCF of Trail', value: val.dcf, fill: MFD_COLORS.milestone },
  ];

  // Strengths / weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (sipPct > 50) strengths.push(`Strong SIP book (${sipPct}%) — buyers love recurring inflows.`);
  if (avgTenure > 10) strengths.push(`Loyal clients (avg ${avgTenure} yrs) signals sticky AUM.`);
  if (top10Pct < 15) strengths.push(`Well-diversified book (top-10 only ${top10Pct}%).`);
  if (compliance === 'clean') strengths.push('Clean SEBI/AMFI compliance record.');
  if (teamSize >= 5) strengths.push(`Team of ${teamSize} reduces key-person risk.`);
  if (techStack === 'advanced') strengths.push('Advanced tech stack makes transition easier.');
  if (successor) strengths.push('Successor already in place — smooth handover.');
  if (trajectory === 'growing' || trajectory === 'high-growth') strengths.push('Business is growing — buyers pay premium for momentum.');

  if (sipPct < 20) weaknesses.push(`Low SIP share (${sipPct}%) — lumpy, less predictable book.`);
  if (avgTenure < 3) weaknesses.push(`Short tenures (${avgTenure} yrs) signal churn risk.`);
  if (top10Pct > 40) weaknesses.push(`Top-10 concentration at ${top10Pct}% is too high — single exit hurts.`);
  if (largestClientPct > 20) weaknesses.push(`Largest client at ${largestClientPct}% of AUM — single point of failure.`);
  if (compliance === 'major') weaknesses.push('Major compliance issues — deal-breaker for many buyers.');
  else if (compliance === 'minor') weaknesses.push('Minor compliance gaps — clean up before sale.');
  if (!successor) weaknesses.push('No successor identified — buyer must import operational capacity.');
  if (trajectory === 'declining') weaknesses.push('Declining trajectory compresses multiple significantly.');
  if (teamSize < 2) weaknesses.push('Single-person shop — key-person dependency is a discount.');

  const perClient = clientCount > 0 ? val.valuationMid / clientCount : 0;

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Briefcase className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">{MFD_CONSTANTS.title}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {MFD_CONSTANTS.badge}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">Business Valuation Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                What&apos;s your MFD business worth today? Estimate fair valuation using 3 methods.
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
        pdfElementId="valuation-report"
        pdfTitle="MFD Business Valuation Report"
        pdfFileName={`MFD-Business-Valuation${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="Business Valuation"
      />

      {/* ── Main Content ────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div className="container-custom" id="valuation-report">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="Business Valuation" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">

            {/* ═════ LEFT PANEL — INPUTS ═════ */}
            <div className="space-y-5 lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">

              {/* Section 1: Profile */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-primary-700 text-sm">1. MFD Business Profile</h3>
                </div>
                <NumberInput label="Years in Business" value={yearsInBusiness} onChange={setYearsInBusiness} suffix="years" step={1} min={1} max={40} />
                <NumberInput label="Total AUM" value={totalAUMCr} onChange={setTotalAUMCr} suffix="Cr" step={1} min={1} max={10000} hint="Assets under management in ₹ crore" />
                <NumberInput label="Annual Trail Commission" value={annualTrail} onChange={setAnnualTrail} prefix="₹" step={100000} min={0} max={500000000} hint="Gross trail earned in last 12 months" />
                <PillGroup<Trajectory>
                  label="Growth Trajectory"
                  value={trajectory}
                  onChange={setTrajectory}
                  options={[
                    { id: 'declining', label: 'Declining' },
                    { id: 'stable', label: 'Stable' },
                    { id: 'growing', label: 'Growing (<15%)' },
                    { id: 'high-growth', label: 'High-growth (>15%)' },
                  ]}
                />
              </div>

              {/* Section 2: Book Quality */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-primary-700 text-sm">2. Book Quality Metrics</h3>
                </div>
                <NumberInput label="SIP % of AUM" value={sipPct} onChange={setSipPct} suffix="%" step={1} min={0} max={100} hint="Higher SIP share = more stable, higher multiple" />
                <NumberInput label="Client Count" value={clientCount} onChange={setClientCount} suffix="clients" step={10} min={10} max={10000} />
                <NumberInput label="Average Client Age" value={avgClientAge} onChange={setAvgClientAge} suffix="yrs" step={1} min={25} max={75} />
                <NumberInput label="Average Client Tenure" value={avgTenure} onChange={setAvgTenure} suffix="yrs with you" step={1} min={0} max={30} />
                <NumberInput label="Equity Allocation" value={equityPct} onChange={setEquityPct} suffix="%" step={1} min={0} max={100} hint="Equity AUM share — higher trail but volatility" />
              </div>

              {/* Section 3: Concentration */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-primary-700 text-sm">3. Concentration Risk</h3>
                </div>
                <NumberInput label="Top-10 Clients' Share" value={top10Pct} onChange={setTop10Pct} suffix="% of AUM" step={1} min={5} max={80} hint="Lower is better — less concentration risk" />
                <NumberInput label="Single Largest Client" value={largestClientPct} onChange={setLargestClientPct} suffix="% of AUM" step={1} min={0} max={50} />
              </div>

              {/* Section 4: Business Quality */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-brand" />
                  </div>
                  <h3 className="font-bold text-primary-700 text-sm">4. Business Quality</h3>
                </div>
                <PillGroup<Compliance>
                  label="Compliance Record"
                  value={compliance}
                  onChange={setCompliance}
                  options={[
                    { id: 'clean', label: 'Clean' },
                    { id: 'minor', label: 'Minor issues' },
                    { id: 'major', label: 'Major issues' },
                  ]}
                />
                <NumberInput label="Team Size (incl. you)" value={teamSize} onChange={setTeamSize} suffix="people" step={1} min={1} max={50} />
                <PillGroup<TechStack>
                  label="Technology Stack"
                  value={techStack}
                  onChange={setTechStack}
                  options={[
                    { id: 'manual', label: 'Manual' },
                    { id: 'basic', label: 'Basic CRM' },
                    { id: 'advanced', label: 'Advanced platform' },
                  ]}
                />
                <Toggle
                  label="Successor in Place"
                  value={successor}
                  onChange={setSuccessor}
                  hint="Identified successor reduces transition discount"
                />
              </div>

            </div>

            {/* ═════ RIGHT PANEL — OUTPUTS ═════ */}
            <div className="space-y-8">

              {/* Hero Valuation */}
              <div className="rounded-2xl p-6 sm:p-8 border bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200 shadow-sm">
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-600 mb-2">
                  Estimated Valuation Range
                </div>
                <div className="text-3xl sm:text-5xl font-black text-amber-700 leading-tight">
                  {formatINR(val.valuationLow)} <span className="text-amber-400">–</span> {formatINR(val.valuationHigh)}
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
                    <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Mid-point</div>
                    <div className="text-xl font-extrabold text-amber-800">{formatINR(val.valuationMid)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
                    <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Multiple Applied</div>
                    <div className="text-xl font-extrabold text-amber-800">{val.finalMultiple.toFixed(2)}× annual trail</div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard icon={IndianRupee} label="Annual Trail" value={formatINR(annualTrail)} color="amber" />
                <StatCard icon={Briefcase} label="Total AUM" value={formatINR(totalAUM)} color="blue" />
                <StatCard icon={Calculator} label="Base Multiple" value={`${val.baseMultiple.toFixed(2)}×`} color="slate" sub={`${trajectory} trajectory`} />
                <StatCard
                  icon={adjustmentImpactPct >= 0 ? ArrowUpRight : ArrowDownRight}
                  label="Adjustments Impact"
                  value={`${adjustmentImpactPct >= 0 ? '+' : ''}${adjustmentImpactPct.toFixed(1)}%`}
                  color={adjustmentImpactPct >= 0 ? 'green' : 'red'}
                />
                <StatCard icon={Gauge} label="Final Multiple" value={`${val.finalMultiple.toFixed(2)}×`} color="amber" />
                <StatCard icon={Users} label="Per-Client Valuation" value={formatINR(perClient)} color="blue" sub={`${clientCount} clients`} />
              </div>

              {/* 3-Method Bar Chart */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">Three Valuation Methods</h3>
                <p className="text-sm text-slate-500 mb-5">
                  Side-by-side comparison. Recommended range averages the three, then ±15%.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <div className="font-semibold text-teal-700">% of AUM</div>
                    <div className="text-slate-500">{(val.aumRate * 100).toFixed(2)}% of ₹{totalAUMCr} Cr — simple buyer heuristic.</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="font-semibold text-amber-700">Income Multiple</div>
                    <div className="text-slate-500">{val.finalMultiple.toFixed(2)}× annual trail — industry standard.</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <div className="font-semibold text-rose-700">DCF of Trail</div>
                    <div className="text-slate-500">NPV of 10 yrs trail, 6% growth, 12% discount.</div>
                  </div>
                </div>
              </div>

              {/* Adjustments Table */}
              <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
                <div className="p-5 pb-0">
                  <h3 className="font-bold text-primary-700 text-lg mb-0.5">Quality Adjustments</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Each factor scales the base multiple. Running multiple shown after cumulative effect.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-surface-300 bg-slate-50">
                        <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Factor</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Impact</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Running Multiple</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200 bg-amber-50/40">
                        <td className="py-3 px-5 font-bold text-primary-700">Base ({trajectory})</td>
                        <td className="py-3 px-5 text-right text-slate-500">—</td>
                        <td className="py-3 px-5 text-right font-bold text-amber-700">{val.baseMultiple.toFixed(2)}×</td>
                      </tr>
                      {(() => {
                        let running = val.baseMultiple;
                        const active = adjustments.filter((a) => a.active);
                        if (active.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="py-4 px-5 text-center text-sm text-slate-500 italic">
                                No quality adjustments triggered — book sits at base multiple.
                              </td>
                            </tr>
                          );
                        }
                        return active.map((a, i) => {
                          running = running * (1 + a.impact);
                          const pos = a.direction === 'positive';
                          return (
                            <tr key={a.label} className={cn('border-b border-surface-200', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                              <td className="py-3 px-5 text-slate-700">{a.label}</td>
                              <td className={cn('py-3 px-5 text-right font-semibold', pos ? 'text-teal-600' : 'text-rose-600')}>
                                {pos ? '+' : ''}{(a.impact * 100).toFixed(0)}%
                              </td>
                              <td className="py-3 px-5 text-right font-semibold text-primary-700">{running.toFixed(2)}×</td>
                            </tr>
                          );
                        });
                      })()}
                      <tr className="bg-amber-50 border-t-2 border-amber-300">
                        <td className="py-3 px-5 font-bold text-amber-800">Final Multiple</td>
                        <td className="py-3 px-5 text-right font-bold text-amber-800">
                          {adjustmentImpactPct >= 0 ? '+' : ''}{adjustmentImpactPct.toFixed(1)}% net
                        </td>
                        <td className="py-3 px-5 text-right font-extrabold text-amber-800">{val.finalMultiple.toFixed(2)}×</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl p-5 border border-teal-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-teal-700 text-base">Strengths</h3>
                  </div>
                  {strengths.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No standout strengths yet — room to improve on SIP share, tenure, or compliance.</p>
                  ) : (
                    <ul className="space-y-2">
                      {strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                          <TrendingUp className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-bold text-rose-700 text-base">Weaknesses</h3>
                  </div>
                  {weaknesses.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No material weaknesses — this book is positioned for a premium exit.</p>
                  ) : (
                    <ul className="space-y-2">
                      {weaknesses.map((w) => (
                        <li key={w} className="flex items-start gap-2 text-sm text-slate-700">
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Sensitivity tips */}
              <div className="bg-gradient-to-br from-brand-50 to-teal-50 rounded-xl p-5 border border-brand-200">
                <h3 className="font-bold text-brand text-base mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Sensitivity Notes
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>
                    Your SIP book is <span className="font-bold text-primary-700">{sipPct}%</span> — crossing 50% unlocks a
                    +15% premium on the multiple. Every 10% higher SIP share protects valuation during drawdowns.
                  </li>
                  <li>
                    Top-10 concentration sits at <span className="font-bold text-primary-700">{top10Pct}%</span>.
                    {top10Pct > 40 && ' Crossing 40% pulls valuation down by 20%. Diversify acquisition to reduce this.'}
                    {top10Pct <= 40 && top10Pct >= 15 && ' Bringing this below 15% earns a +10% multiple bonus.'}
                    {top10Pct < 15 && ' Excellent diversification — this is already adding +10% to the multiple.'}
                  </li>
                  <li>
                    Largest client at <span className="font-bold text-primary-700">{largestClientPct}%</span> of AUM
                    {largestClientPct > 20 ? ' — triggers a 25% discount. Consider splitting this relationship or reducing dependency before sale.' : ' is within safe range (<20%).'}
                  </li>
                </ul>
              </div>

              {/* Scenario comparison */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-1">Improvement Scenario</h3>
                <p className="text-sm text-slate-500 mb-4">
                  If you lift SIP share to 60% and cut top-10 concentration to 20%, holding all else constant:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-surface-300 p-4 bg-slate-50">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Current</div>
                    <div className="text-2xl font-extrabold text-slate-700 mt-1">{formatINR(val.valuationMid)}</div>
                    <div className="text-xs text-slate-500 mt-1">{val.finalMultiple.toFixed(2)}× multiple</div>
                  </div>
                  <div className="rounded-lg border border-teal-300 p-4 bg-teal-50">
                    <div className="text-[10px] uppercase tracking-wider text-teal-600 font-semibold">After Improvement</div>
                    <div className="text-2xl font-extrabold text-teal-700 mt-1">{formatINR(improvedVal.valuationMid)}</div>
                    <div className="text-xs text-teal-600 mt-1">
                      {improvedVal.finalMultiple.toFixed(2)}× multiple
                      {improvedVal.valuationMid > val.valuationMid && (
                        <span className="ml-2 font-bold">
                          (+{formatINR(improvedVal.valuationMid - val.valuationMid)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-sale checklist */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" /> Pre-Sale Checklist
                </h3>
                <p className="text-sm text-slate-500 mb-4">Sharpen these before going to market — each gap is leverage for the buyer.</p>
                <ul className="space-y-2.5">
                  {[
                    'Document all client relationships — ensure agreements are transferable to the acquirer.',
                    'Clean up any outstanding compliance gaps (KYC, SEBI filings, grievances).',
                    'Transfer SEBI EUIN / ARN records per AMFI SOP for distributor change.',
                    'Negotiate non-compete and earn-out structure — typical deal: 20-40% upfront, rest over 2-3 years.',
                    'Tax planning: LTCG on business sale, evaluate Section 50B slump-sale treatment with CA.',
                    'Retention plan for key team members — acquirers price in employee flight risk.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CFP Note */}
              <div className="rounded-xl p-6 bg-slate-900 text-slate-100 border border-slate-800">
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-2">CFP / Business Note</div>
                <p className="text-sm leading-relaxed text-slate-200">
                  MFD business valuations in India typically range from <span className="font-bold text-amber-300">2× to 5× annual trail</span>,
                  depending on book quality, growth trajectory, and compliance. Buyers pay for stability (high SIP share,
                  long tenures) and growth (rising AUM). Sales are usually structured as earn-outs — 20-40% upfront,
                  with the balance over 2-3 years linked to retained AUM. Consult a tax advisor for capital-gain
                  optimisation (Section 50B slump-sale vs individual asset sale makes a meaningful difference).
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────── */}
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
