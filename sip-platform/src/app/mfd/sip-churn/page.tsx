'use client';

import { useState, useMemo } from 'react';
import {
  Clock, Users, BarChart3, IndianRupee, TrendingUp, AlertTriangle,
  Briefcase, Target, Sparkles, ArrowDownRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { MFD_CONSTANTS, MFD_DISCLAIMER } from '@/lib/constants/trail-commission';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import NumberInput from '@/components/ui/NumberInput';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';

// ── Scenario Color Map ───────────────────────────────────
const SCENARIOS = [
  { key: 85, label: '85% Retention', color: '#DC2626', accent: 'red' },
  { key: 90, label: '90% Retention', color: '#F59E0B', accent: 'amber' },
  { key: 95, label: '95% Retention', color: '#0F766E', accent: 'teal' },
  { key: 98, label: '98% Retention', color: '#1E3A8A', accent: 'blue' },
] as const;

// ── Types ────────────────────────────────────────────────
interface MonthPoint {
  month: number;
  year: number;
  activeSIPs: number;
  aum: number;
  monthlyInflow: number;
  monthlyTrail: number;
  cumulativeTrail: number;
}
interface ScenarioResult {
  retention: number;
  yearly: { year: number; activeSIPs: number; aum: number; annualTrail: number; cumulativeTrail: number; monthlyTrail: number }[];
  finalAUM: number;
  finalActiveSIPs: number;
  totalTrail: number;
  finalAnnualTrail: number;
  finalMonthlyTrail: number;
}

// ── Simulation Core ──────────────────────────────────────
function simulate(
  activeSIPs: number,
  avgSIP: number,
  startAUM: number,
  newSIPsPerMonth: number,
  newSIPAmt: number,
  years: number,
  retentionAnnual: number, // 0..1
  marketReturn: number, // %
  trailRate: number, // %
  redemptionPct: number, // % p.a. of AUM
  fullChurn: boolean, // if true, on churn also redeem pro-rata AUM
): ScenarioResult {
  const months = years * 12;
  const mRetention = Math.pow(retentionAnnual, 1 / 12);
  const mReturn = marketReturn / 100 / 12;
  const mTrail = trailRate / 100 / 12;
  const mRedemption = redemptionPct / 100 / 12;

  let sips = activeSIPs;
  let aum = startAUM;
  let cumulativeTrail = 0;
  const history: MonthPoint[] = [];

  for (let m = 1; m <= months; m++) {
    // Start-of-month values drive inflow this month
    const sipsStart = sips;
    const monthlyInflow = sipsStart * avgSIP;

    // AUM evolution during the month
    // 1) market appreciation on starting AUM
    // 2) baseline redemption outflow on starting AUM
    // 3) if fullChurn, extra redemption proportional to the fraction of SIPs churning this month
    const churningFraction = 1 - mRetention;
    const fullChurnOutflow = fullChurn ? aum * churningFraction : 0;
    aum = aum * (1 + mReturn) + monthlyInflow - aum * mRedemption - fullChurnOutflow;
    if (aum < 0) aum = 0;

    // SIP count evolves: continuing + new
    const continuing = sipsStart * mRetention;
    sips = continuing + newSIPsPerMonth;

    // Trail accrues on month-end AUM
    const trailThisMonth = aum * mTrail;
    cumulativeTrail += trailThisMonth;

    history.push({
      month: m,
      year: Math.ceil(m / 12),
      activeSIPs: sips,
      aum,
      monthlyInflow: sipsStart * avgSIP + newSIPsPerMonth * newSIPAmt,
      monthlyTrail: trailThisMonth,
      cumulativeTrail,
    });
  }

  // Aggregate yearly (snapshot at last month of each year)
  const yearly: ScenarioResult['yearly'] = [];
  for (let y = 1; y <= years; y++) {
    const slice = history.filter((p) => p.year === y);
    const last = slice[slice.length - 1];
    const annualTrail = slice.reduce((s, p) => s + p.monthlyTrail, 0);
    yearly.push({
      year: y,
      activeSIPs: last.activeSIPs,
      aum: last.aum,
      annualTrail,
      cumulativeTrail: last.cumulativeTrail,
      monthlyTrail: last.monthlyTrail,
    });
  }

  const last = history[history.length - 1];
  const finalYearSlice = history.filter((p) => p.year === years);
  const finalAnnualTrail = finalYearSlice.reduce((s, p) => s + p.monthlyTrail, 0);

  return {
    retention: retentionAnnual,
    yearly,
    finalAUM: last.aum,
    finalActiveSIPs: last.activeSIPs,
    totalTrail: cumulativeTrail,
    finalAnnualTrail,
    finalMonthlyTrail: last.monthlyTrail,
  };
}

// ── Stat Card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'amber', sub }: {
  icon: typeof IndianRupee; label: string; value: string; color?: 'amber' | 'teal' | 'red' | 'blue' | 'slate'; sub?: string;
}) {
  const bg = { amber: 'bg-amber-100', teal: 'bg-teal-50', red: 'bg-red-50', blue: 'bg-brand-50', slate: 'bg-surface-100' }[color];
  const fg = { amber: 'text-amber-600', teal: 'text-teal-600', red: 'text-red-600', blue: 'text-brand', slate: 'text-slate-500' }[color];
  const tx = { amber: 'text-amber-700', teal: 'text-teal-700', red: 'text-red-700', blue: 'text-brand', slate: 'text-primary-700' }[color];
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={cn('w-4 h-4', fg)} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold', tx)}>{value}</div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function MFDSIPChurnPage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // Section 1: Current book
  const [activeSIPs, setActiveSIPs] = useState(500);
  const [avgSIP, setAvgSIP] = useState(8000);
  const [currentAUM, setCurrentAUM] = useState(200000000); // 20 Cr

  // Section 2: New business
  const [newSIPsPerMonth, setNewSIPsPerMonth] = useState(10);
  const [newSIPAmt, setNewSIPAmt] = useState(8000);
  const [years, setYears] = useState(10);

  // Section 3: Retention
  const [customRetention, setCustomRetention] = useState<number>(95);
  const [redemptionPct, setRedemptionPct] = useState(3); // % p.a.
  const [fullChurn, setFullChurn] = useState(false);

  // Section 4: Market & Trail
  const [marketReturn, setMarketReturn] = useState(12);
  const [trailRate, setTrailRate] = useState(0.8);

  // Run all four headline scenarios
  const results = useMemo(() => {
    const retentions = [0.85, 0.90, 0.95, 0.98];
    return retentions.map((r) =>
      simulate(activeSIPs, avgSIP, currentAUM, newSIPsPerMonth, newSIPAmt, years, r, marketReturn, trailRate, redemptionPct, fullChurn),
    );
  }, [activeSIPs, avgSIP, currentAUM, newSIPsPerMonth, newSIPAmt, years, marketReturn, trailRate, redemptionPct, fullChurn]);

  // Custom scenario for highlighted user choice
  const custom = useMemo(
    () =>
      simulate(
        activeSIPs, avgSIP, currentAUM, newSIPsPerMonth, newSIPAmt, years,
        Math.max(0.5, Math.min(0.999, customRetention / 100)),
        marketReturn, trailRate, redemptionPct, fullChurn,
      ),
    [activeSIPs, avgSIP, currentAUM, newSIPsPerMonth, newSIPAmt, years, customRetention, marketReturn, trailRate, redemptionPct, fullChurn],
  );

  const r85 = results[0];
  const r90 = results[1];
  const r95 = results[2];
  const r98 = results[3];

  // Combined chart data: AUM by year, 4 lines
  const chartData = useMemo(() => {
    const rows: { year: number; r85: number; r90: number; r95: number; r98: number }[] = [];
    for (let y = 1; y <= years; y++) {
      rows.push({
        year: y,
        r85: r85.yearly[y - 1]?.aum ?? 0,
        r90: r90.yearly[y - 1]?.aum ?? 0,
        r95: r95.yearly[y - 1]?.aum ?? 0,
        r98: r98.yearly[y - 1]?.aum ?? 0,
      });
    }
    return rows;
  }, [results, years, r85, r90, r95, r98]);

  const barData = [
    { name: '85%', trail: r85.totalTrail, color: SCENARIOS[0].color },
    { name: '90%', trail: r90.totalTrail, color: SCENARIOS[1].color },
    { name: '95%', trail: r95.totalTrail, color: SCENARIOS[2].color },
    { name: '98%', trail: r98.totalTrail, color: SCENARIOS[3].color },
  ];

  // Insight numbers
  const delta95vs85Trail = r95.totalTrail - r85.totalTrail;
  const delta95vs85Pct = r85.totalTrail > 0 ? (delta95vs85Trail / r85.totalTrail) * 100 : 0;
  // "Every 1% improvement in retention adds ₹Y per year per ₹1 Cr of AUM" — use average of final annual trail deltas
  const perPointPerCrore = (() => {
    // Simple linear slope: (r98 final annual trail - r85 final annual trail) / 13 pct points / (finalAUM in Cr)
    const avgAUMcr = (r85.finalAUM + r98.finalAUM) / 2 / 10000000;
    if (avgAUMcr <= 0) return 0;
    return (r98.finalAnnualTrail - r85.finalAnnualTrail) / 13 / avgAUMcr;
  })();

  return (
    <>
      {/* ── Premium Header ───────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Clock className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">{MFD_CONSTANTS.title}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {MFD_CONSTANTS.badge}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">SIP Renewal & Churn Impact Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Retention is the unsung lever — see how a 5-point jump in continuation rate reshapes your 10-year trail.
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
        pdfElementId="sip-churn-results"
        pdfTitle="MFD SIP Renewal & Churn Report"
        pdfFileName={`MFD-SIP-Churn${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="SIP Churn Impact"
      />

      {/* ── Main Content ─────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div id="sip-churn-results" className="container-custom">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="SIP Churn Impact" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">
            {/* ── LEFT: Inputs ─────────────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">
              {/* Section 1 */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <h2 className="font-bold text-primary-700 text-sm uppercase tracking-wider">Current SIP Book</h2>
                </div>
                <NumberInput label="Active SIPs (count)" value={activeSIPs} onChange={setActiveSIPs} suffix="SIPs" step={25} min={1} max={50000} hint="Total live SIPs in your book today" />
                <NumberInput label="Average Monthly SIP Amount" value={avgSIP} onChange={setAvgSIP} prefix="₹" step={500} min={500} max={100000000} />
                <NumberInput label="Current Total AUM" value={currentAUM} onChange={setCurrentAUM} prefix="₹" step={1000000} min={0} max={10000000000} hint="Existing AUM across all clients" />
              </div>

              {/* Section 2 */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h2 className="font-bold text-primary-700 text-sm uppercase tracking-wider">New Business</h2>
                </div>
                <NumberInput label="New SIPs Added Per Month" value={newSIPsPerMonth} onChange={setNewSIPsPerMonth} suffix="SIPs/mo" step={1} min={0} max={1000} />
                <NumberInput label="Average New SIP Amount" value={newSIPAmt} onChange={setNewSIPAmt} prefix="₹" step={500} min={500} />
                <NumberInput label="Projection Period" value={years} onChange={setYears} suffix="years" step={1} min={1} max={30} />
              </div>

              {/* Section 3 */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h2 className="font-bold text-primary-700 text-sm uppercase tracking-wider">Retention Scenarios</h2>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Quick-select annual SIP continuation rate</p>
                  <div className="flex flex-wrap gap-2">
                    {[85, 90, 95, 98].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCustomRetention(r)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border font-bold transition-all',
                          customRetention === r
                            ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                            : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
                        )}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
                <NumberInput label="Custom Continuation Rate" value={customRetention} onChange={setCustomRetention} suffix="%" step={0.5} min={50} max={99.9} hint={`Discontinuation rate = ${(100 - customRetention).toFixed(1)}% p.a.`} />
                <NumberInput label="AUM Redemption Rate" value={redemptionPct} onChange={setRedemptionPct} suffix="% p.a." step={0.5} min={0} max={25} hint="Fraction of AUM redeemed each year by existing clients" />
                <label className="flex items-start gap-3 cursor-pointer bg-slate-50 rounded-lg p-3 border border-surface-200">
                  <input
                    type="checkbox"
                    checked={fullChurn}
                    onChange={(e) => setFullChurn(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    <span className="font-semibold text-slate-700">Full churn mode:</span> when a SIP stops, also redeem that client&apos;s pro-rata AUM. Default off (clients stop SIP but stay invested).
                  </span>
                </label>
              </div>

              {/* Section 4 */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand" />
                  <h2 className="font-bold text-primary-700 text-sm uppercase tracking-wider">Market & Trail</h2>
                </div>
                <NumberInput label="Expected Market Return" value={marketReturn} onChange={setMarketReturn} suffix="%" step={0.5} min={1} max={30} />
                <NumberInput label="Blended Trail Rate" value={trailRate} onChange={setTrailRate} suffix="% p.a." step={0.05} min={0.05} max={3} />
              </div>

            </div>

            {/* ── RIGHT: Results ───────────────────────────── */}
            <div className="space-y-8">
              {/* Hero — headline numbers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-6 border border-teal-200 bg-gradient-to-br from-teal-50 to-green-50">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 mb-1">At 95% Retention</div>
                  <div className="text-3xl font-black text-teal-700">{formatINR(r95.finalAUM)}</div>
                  <div className="text-xs text-teal-700 mt-0.5">Final AUM · Total Trail {formatINR(r95.totalTrail)}</div>
                </div>
                <div className="rounded-xl p-6 border border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-red-600 mb-1">At 85% Retention</div>
                  <div className="text-3xl font-black text-red-700">{formatINR(r85.finalAUM)}</div>
                  <div className="text-xs text-red-700 mt-0.5">Final AUM · Total Trail {formatINR(r85.totalTrail)}</div>
                </div>
              </div>

              <div className="rounded-xl p-5 border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 mb-0.5">Retention Delta</div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      <span className="font-extrabold text-amber-700">10 percentage points of retention</span> (85% to 95%) adds{' '}
                      <span className="font-extrabold text-amber-700">{formatINR(delta95vs85Trail)}</span> to your {years}-year trail income —
                      a <span className="font-extrabold">{delta95vs85Pct.toFixed(1)}%</span> uplift.
                    </p>
                  </div>
                </div>
              </div>

              {/* Your-choice custom scenario card */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-brand" />
                  <h3 className="font-bold text-primary-700 text-lg">Your Scenario: {customRetention}% Retention</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users} label="Final Active SIPs" value={formatNumber(Math.round(custom.finalActiveSIPs))} color="slate" />
                  <StatCard icon={BarChart3} label="Final AUM" value={formatINR(custom.finalAUM)} color="blue" />
                  <StatCard icon={IndianRupee} label="Total Trail" value={formatINR(custom.totalTrail)} color="amber" />
                  <StatCard icon={TrendingUp} label={`Annual Trail (Yr ${years})`} value={formatINR(custom.finalAnnualTrail)} color="teal" />
                </div>
              </div>

              {/* Line chart — AUM over time, 4 lines */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">AUM Trajectory by Retention Scenario</h3>
                <p className="text-sm text-slate-500 mb-5">How your book compounds — or erodes — under different monthly SIP continuation rates</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name]}
                        labelFormatter={(l) => `Year ${l}`}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="r85" stroke={SCENARIOS[0].color} strokeWidth={2} dot={false} name="85%" />
                      <Line type="monotone" dataKey="r90" stroke={SCENARIOS[1].color} strokeWidth={2} dot={false} name="90%" />
                      <Line type="monotone" dataKey="r95" stroke={SCENARIOS[2].color} strokeWidth={2.5} dot={false} name="95%" />
                      <Line type="monotone" dataKey="r98" stroke={SCENARIOS[3].color} strokeWidth={2.5} dot={false} name="98%" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar — cumulative trail side-by-side */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">Cumulative Trail Earned — {years}-Year Comparison</h3>
                <p className="text-sm text-slate-500 mb-5">Every percentage point of retention compounds into real rupees</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Total Trail']}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="trail" radius={[8, 8, 0, 0]} name="Total Trail">
                        {barData.map((d) => (
                          <rect key={d.name} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Retention sensitivity table */}
              <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
                <div className="p-5 pb-0">
                  <h3 className="font-bold text-primary-700 text-lg mb-0.5">Retention Sensitivity</h3>
                  <p className="text-sm text-slate-500 mb-4">Side-by-side scenario comparison at year {years}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-surface-300 bg-slate-50">
                        <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Retention</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Final SIPs</th>
                        <th className="text-right py-3 px-5 font-bold text-brand text-xs uppercase tracking-wider">Final AUM</th>
                        <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase tracking-wider">Total Trail</th>
                        <th className="text-right py-3 px-5 font-bold text-teal-700 text-xs uppercase tracking-wider">Trail in Yr {years}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SCENARIOS.map((s, i) => {
                        const r = results[i];
                        const highlight = s.key === 95;
                        return (
                          <tr key={s.key} className={cn('border-b border-surface-200 hover:bg-amber-50/30 transition-colors', highlight && 'bg-teal-50/60 ring-1 ring-teal-100', !highlight && (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'))}>
                            <td className="py-3.5 px-5 font-bold">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                <span className="text-primary-700">{s.key}%</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right text-slate-600">{formatNumber(Math.round(r.finalActiveSIPs))}</td>
                            <td className="py-3.5 px-5 text-right font-semibold text-brand">{formatINR(r.finalAUM)}</td>
                            <td className="py-3.5 px-5 text-right font-bold text-amber-700">{formatINR(r.totalTrail)}</td>
                            <td className="py-3.5 px-5 text-right text-teal-700">{formatINR(r.finalAnnualTrail)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800 text-lg">Retention Insights</h3>
                </div>
                <ul className="space-y-3 text-sm text-amber-900">
                  <li className="flex gap-2">
                    <ArrowDownRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      A 95% vs 85% annual retention rate changes your {years}-year trail by{' '}
                      <span className="font-bold">{delta95vs85Pct.toFixed(1)}%</span> (a difference of {formatINR(delta95vs85Trail)}).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowDownRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      Every 1 percentage point of retention adds roughly{' '}
                      <span className="font-bold">{formatINR(Math.max(0, perPointPerCrore))}/year</span> per ₹1 Cr of AUM at the end of the projection.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowDownRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      Top retention levers: <span className="font-semibold">annual review calls (+2%)</span>,{' '}
                      <span className="font-semibold">goal-linked SIPs (+3%)</span>,{' '}
                      <span className="font-semibold">WhatsApp-engaged clients (+2%)</span>. Retention work typically beats acquisition ROI.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowDownRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      Your current churn may be higher than you think — CAMS/Karvy CAS reports show the true picture of which SIPs stopped vs. paused.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Scenario narrative */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-primary-700" />
                  <h3 className="font-bold text-primary-700 text-lg">Scenario Narrative</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  If your retention today is <span className="font-semibold text-red-600">90%</span> and you improve to{' '}
                  <span className="font-semibold text-teal-600">95%</span> over the next three years through a structured review cadence,
                  your book at year {years} will be approximately{' '}
                  <span className="font-bold text-amber-700">{formatINR(r95.finalAUM - r90.finalAUM)}</span> larger in AUM and generate{' '}
                  <span className="font-bold text-amber-700">{formatINR(r95.totalTrail - r90.totalTrail)}</span> more in total trail over the period.
                  That&apos;s the silent power of retention: no new business, just keeping what you already earned.
                </p>
              </div>

              {/* CFP Note */}
              <div className="bg-slate-50 rounded-xl p-6 border border-surface-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-primary-700 mb-1">CFP / Business Note</div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Retention compounds like interest. A 95% monthly continuation rate (~54% 10-year SIP survival)
                      vs 90% (~28% 10-year survival) is a huge difference in terminal book value. Retention-improvement
                      investments — review cadence, client success, operations, goal-linked framing — typically have a
                      higher ROI than net-new-client acquisition because you&apos;re protecting trail that compounds at market rates.
                      Measure continuation rate monthly, not annually — a 1% monthly drop is a 12% annual leak.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────── */}
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
