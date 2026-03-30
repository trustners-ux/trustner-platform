'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp, Wallet, BarChart3, LineChart, Target, Crosshair,
  Shield, Users, Briefcase, IndianRupee, Award, Milestone, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  calculateNewSIPTrail, calculateLumpSumTrail, calculateSIPBookGrowth,
  calculateAUMGrowthTrail, calculateComprehensiveTrail, calculateTargetIncome,
  calculateInsuranceVsMF, calculateSubBrokerScale, calculateMultiScaleProjection,
} from '@/lib/utils/trail-calculators';
import { MFD_CONSTANTS, MFD_COLORS, MFD_DISCLAIMER, MFD_TABS, CLIENT_PRESETS } from '@/lib/constants/trail-commission';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

// ── Tab Icons Map ────────────────────────────────────────
const TAB_ICONS: Record<string, typeof TrendingUp> = {
  'new-sip': TrendingUp, 'lumpsum': Wallet, 'sip-book': BarChart3,
  'aum-growth': LineChart, 'comprehensive': Target, 'target': Crosshair,
  'insurance-vs-mf': Shield, 'sub-broker': Users,
};

// ── Number Input Component (Type-in) ─────────────────────
function NumberInput({
  label, value, onChange, prefix, suffix, step = 1, min, max, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number; hint?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    } else if (raw === '' || raw === '-') {
      onChange(min ?? 0);
    }
  };

  const increment = () => {
    const next = value + step;
    onChange(max !== undefined ? Math.min(max, next) : next);
  };
  const decrement = () => {
    const next = value - step;
    onChange(min !== undefined ? Math.max(min, next) : next);
  };

  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{label}</label>
      <div className="flex items-center border border-surface-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-400 transition-all">
        {prefix && <span className="pl-3 pr-1 text-sm text-slate-400 select-none">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={formatNumber(value)}
          onChange={handleChange}
          className="flex-1 py-2.5 px-2 text-sm font-semibold text-primary-700 bg-transparent outline-none min-w-0"
        />
        {suffix && <span className="pr-2 text-sm text-slate-400 select-none whitespace-nowrap">{suffix}</span>}
        <div className="flex flex-col border-l border-surface-300">
          <button onClick={increment} className="px-2 py-0.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors text-xs leading-none">▲</button>
          <button onClick={decrement} className="px-2 py-0.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors text-xs leading-none border-t border-surface-200">▼</button>
        </div>
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Summary Stat Card ────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof IndianRupee; label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color === 'amber' ? 'bg-amber-100' : color === 'blue' ? 'bg-brand-50' : color === 'purple' ? 'bg-secondary-50' : color === 'green' ? 'bg-teal-50' : 'bg-surface-100')}>
          <Icon className={cn('w-4 h-4', color === 'amber' ? 'text-amber-600' : color === 'blue' ? 'text-brand' : color === 'purple' ? 'text-secondary-600' : color === 'green' ? 'text-teal-600' : 'text-slate-500')} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold', color === 'amber' ? 'text-amber-700' : color === 'blue' ? 'text-brand' : color === 'purple' ? 'text-secondary-700' : color === 'green' ? 'text-teal-700' : 'text-primary-700')}>
        {value}
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Big Highlight Card ───────────────────────────────────
function HighlightCard({ label, value, sub, variant }: { label: string; value: string; sub?: string; variant?: 'gold' | 'green' }) {
  const isGreen = variant === 'green';
  return (
    <div className={cn('rounded-xl p-5 border', isGreen ? 'bg-gradient-to-br from-teal-50 to-green-50 border-teal-200' : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200')}>
      <div className={cn('text-[10px] uppercase tracking-wider font-semibold mb-1', isGreen ? 'text-teal-600' : 'text-amber-600')}>{label}</div>
      <div className={cn('text-3xl font-black', isGreen ? 'text-teal-700' : 'text-amber-700')}>{value}</div>
      {sub && <div className={cn('text-xs mt-1.5', isGreen ? 'text-teal-600' : 'text-amber-600')}>{sub}</div>}
    </div>
  );
}

// ── Dual-Axis Chart ──────────────────────────────────────
function TrailChart({
  data, title, subtitle, legend1 = 'AUM', legend2 = 'Monthly Trail',
}: {
  data: { year: number; aum: number; monthlyTrail: number }[];
  title: string; subtitle: string; legend1?: string; legend2?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
      <h3 className="font-bold text-primary-700 mb-0.5 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mb-5">{subtitle}</p>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: MFD_COLORS.aum }} />
          <span className="text-xs font-medium text-slate-600">{legend1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: MFD_COLORS.trail }} />
          <span className="text-xs font-medium text-slate-600">{legend2}</span>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gAUM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={MFD_COLORS.aum} stopOpacity={0.12} />
                <stop offset="95%" stopColor={MFD_COLORS.aum} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gTrail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={MFD_COLORS.trail} stopOpacity={0.2} />
                <stop offset="95%" stopColor={MFD_COLORS.trail} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
            <Tooltip
              formatter={(value: number, name: string) => [formatINR(value), name === 'aum' ? legend1 : legend2]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              labelFormatter={(l) => `Year ${l}`}
            />
            <Area type="monotone" dataKey="aum" stroke={MFD_COLORS.aum} fill="url(#gAUM)" strokeWidth={2} name="aum" />
            <Area type="monotone" dataKey="monthlyTrail" stroke={MFD_COLORS.trail} fill="url(#gTrail)" strokeWidth={2.5} name="monthlyTrail" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Year-by-Year Table ───────────────────────────────────
function TrailTable({
  data, showSIPs = false,
}: {
  data: { year: number; aum: number; monthlyTrail: number; annualTrail: number; cumulativeTrail: number; activeSIPs?: number }[];
  showSIPs?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
      <div className="p-5 pb-0">
        <h3 className="font-bold text-primary-700 text-lg mb-0.5">Year-by-Year Breakdown</h3>
        <p className="text-sm text-slate-500 mb-4">Detailed trail income projection</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-surface-300 bg-slate-50">
              <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Year</th>
              <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">AUM</th>
              {showSIPs && <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Active SIPs</th>}
              <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase tracking-wider">Monthly Trail</th>
              <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase tracking-wider">Annual Trail</th>
              <th className="text-right py-3 px-5 font-bold text-secondary-700 text-xs uppercase tracking-wider">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.year} className={cn('border-b border-surface-200 hover:bg-amber-50/30 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                <td className="py-3 px-5 font-bold text-primary-700">Year {row.year}</td>
                <td className="py-3 px-5 text-right font-semibold text-brand">{formatINR(row.aum)}</td>
                {showSIPs && <td className="py-3 px-5 text-right text-slate-600">{formatNumber(row.activeSIPs ?? 0)}</td>}
                <td className="py-3 px-5 text-right font-bold text-amber-700">{formatINR(row.monthlyTrail)}</td>
                <td className="py-3 px-5 text-right text-amber-600">{formatINR(row.annualTrail)}</td>
                <td className="py-3 px-5 text-right font-semibold text-secondary-600">{formatINR(row.cumulativeTrail)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

export default function MFDTrailCalculatorPage() {
  const [activeTab, setActiveTab] = useState('new-sip');

  // ── Shared Parameters ──────────────────────────────────
  const [trailPercent, setTrailPercent] = useState(0.8);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [years, setYears] = useState(10);

  // ── Tab 1: New SIP Trail ───────────────────────────────
  const [newSIPAmount, setNewSIPAmount] = useState(5000);
  const [newSIPsPerMonth, setNewSIPsPerMonth] = useState(5);

  // ── Tab 2: Lump Sum ────────────────────────────────────
  const [lumpSumAmount, setLumpSumAmount] = useState(1000000);

  // ── Tab 3: SIP Book ────────────────────────────────────
  const [startingAUM, setStartingAUM] = useState(5000000);
  const [existingSIPBook, setExistingSIPBook] = useState(200000);
  const [tab3NewSIPAmount, setTab3NewSIPAmount] = useState(5000);
  const [tab3NewSIPsPerMonth, setTab3NewSIPsPerMonth] = useState(3);

  // ── Tab 4: AUM Growth ──────────────────────────────────
  const [currentAUM, setCurrentAUM] = useState(10000000);
  const [aumGrowthRate, setAumGrowthRate] = useState(12);

  // ── Tab 5: Comprehensive ───────────────────────────────
  const [compAUM, setCompAUM] = useState(5000000);
  const [compSIPBook, setCompSIPBook] = useState(200000);
  const [compNewSIPAmt, setCompNewSIPAmt] = useState(5000);
  const [compNewSIPs, setCompNewSIPs] = useState(3);
  const [compLumpSum, setCompLumpSum] = useState(500000);

  // ── Tab 6: Target ──────────────────────────────────────
  const [targetMonthlyTrail, setTargetMonthlyTrail] = useState(50000);
  const [targetSIPAmount, setTargetSIPAmount] = useState(5000);

  // ── Tab 7: Insurance vs MF ─────────────────────────────
  const [annualPremium, setAnnualPremium] = useState(50000);
  const [policyTerm, setPolicyTerm] = useState(20);

  // ── Tab 8: Sub-Broker ──────────────────────────────────
  const [numberOfClients, setNumberOfClients] = useState(100);
  const [avgSIPPerClient, setAvgSIPPerClient] = useState(5000);

  // ── Memoized Calculations ──────────────────────────────
  const tab1 = useMemo(() => activeTab === 'new-sip' ? calculateNewSIPTrail(newSIPAmount, newSIPsPerMonth, expectedReturn, trailPercent, years) : null, [activeTab, newSIPAmount, newSIPsPerMonth, expectedReturn, trailPercent, years]);
  const tab2 = useMemo(() => activeTab === 'lumpsum' ? calculateLumpSumTrail(lumpSumAmount, expectedReturn, trailPercent, years) : null, [activeTab, lumpSumAmount, expectedReturn, trailPercent, years]);
  const tab3 = useMemo(() => activeTab === 'sip-book' ? calculateSIPBookGrowth(startingAUM, existingSIPBook, tab3NewSIPAmount, tab3NewSIPsPerMonth, expectedReturn, trailPercent, years) : null, [activeTab, startingAUM, existingSIPBook, tab3NewSIPAmount, tab3NewSIPsPerMonth, expectedReturn, trailPercent, years]);
  const tab4 = useMemo(() => activeTab === 'aum-growth' ? calculateAUMGrowthTrail(currentAUM, aumGrowthRate, trailPercent, years) : null, [activeTab, currentAUM, aumGrowthRate, trailPercent, years]);
  const tab5 = useMemo(() => activeTab === 'comprehensive' ? calculateComprehensiveTrail(compAUM, compSIPBook, compNewSIPAmt, compNewSIPs, compLumpSum, expectedReturn, trailPercent, years) : null, [activeTab, compAUM, compSIPBook, compNewSIPAmt, compNewSIPs, compLumpSum, expectedReturn, trailPercent, years]);
  const tab6 = useMemo(() => activeTab === 'target' ? calculateTargetIncome(targetMonthlyTrail, trailPercent, expectedReturn, targetSIPAmount) : null, [activeTab, targetMonthlyTrail, trailPercent, expectedReturn, targetSIPAmount]);
  const tab7 = useMemo(() => activeTab === 'insurance-vs-mf' ? calculateInsuranceVsMF(annualPremium, policyTerm, trailPercent, expectedReturn, years) : null, [activeTab, annualPremium, policyTerm, trailPercent, expectedReturn, years]);
  const tab8 = useMemo(() => activeTab === 'sub-broker' ? calculateSubBrokerScale(numberOfClients, avgSIPPerClient, expectedReturn, trailPercent, years) : null, [activeTab, numberOfClients, avgSIPPerClient, expectedReturn, trailPercent, years]);
  const tab8Multi = useMemo(() => activeTab === 'sub-broker' ? calculateMultiScaleProjection(CLIENT_PRESETS as unknown as { clients: number; label: string }[], avgSIPPerClient, expectedReturn, trailPercent, years) : null, [activeTab, avgSIPPerClient, expectedReturn, trailPercent, years]);

  // ── Shared Inputs Block ────────────────────────────────
  function SharedInputs({ showReturn = true, showGrowthRate = false }: { showReturn?: boolean; showGrowthRate?: boolean }) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-surface-200 space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assumptions</p>
        <NumberInput label="Trail Commission Rate" value={trailPercent} onChange={setTrailPercent} suffix="% p.a." step={0.05} min={0.05} max={3} hint="Blended trail rate across your book" />
        {showReturn && <NumberInput label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} suffix="%" step={0.5} min={1} max={30} hint="Expected market return on AUM" />}
        {showGrowthRate && <NumberInput label="AUM Growth Rate" value={aumGrowthRate} onChange={setAumGrowthRate} suffix="%" step={0.5} min={1} max={30} hint="Expected annual growth from market" />}
        <NumberInput label="Projection Period" value={years} onChange={setYears} suffix="years" step={1} min={1} max={30} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // TAB RENDERERS
  // ══════════════════════════════════════════════════════

  function renderTab1() {
    if (!tab1) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">New SIP Trail Income</h2>
              <p className="text-xs text-slate-500 mt-1">Calculate trail income from adding new SIPs every month</p>
            </div>
            <NumberInput label="SIP Amount (each new SIP)" value={newSIPAmount} onChange={setNewSIPAmount} prefix="₹" step={500} min={500} />
            <NumberInput label="New SIPs Added Per Month" value={newSIPsPerMonth} onChange={setNewSIPsPerMonth} suffix="SIPs/month" step={1} min={1} max={100} hint="How many new SIPs you start each month" />
            <SharedInputs />
          </div>
          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Final AUM" value={formatINR(tab1.finalAUM)} color="blue" />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab1.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Total Trail Earned Over Period" value={formatINR(tab1.totalTrailEarned)} sub={`Annual trail in final year: ${formatINR(tab1.finalAnnualTrail)}`} />
        </div>
        <div className="space-y-8">
          <TrailChart data={tab1.yearly} title="AUM & Trail Income Growth" subtitle={`Adding ${newSIPsPerMonth} new SIPs of ${formatINR(newSIPAmount)} every month`} />
          <TrailTable data={tab1.yearly} showSIPs />
        </div>
      </div>
    );
  }

  function renderTab2() {
    if (!tab2) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">Lump Sum Trail Income</h2>
              <p className="text-xs text-slate-500 mt-1">Trail income from a one-time investment growing with market</p>
            </div>
            <NumberInput label="Lump Sum Amount" value={lumpSumAmount} onChange={setLumpSumAmount} prefix="₹" step={100000} min={10000} />
            <SharedInputs />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Final AUM" value={formatINR(tab2.finalAUM)} color="blue" />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab2.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Total Trail Earned" value={formatINR(tab2.totalTrailEarned)} sub={`From a single ${formatINR(lumpSumAmount)} investment`} />
        </div>
        <div className="space-y-8">
          <TrailChart data={tab2.yearly} title="Lump Sum AUM & Trail Growth" subtitle={`${formatINR(lumpSumAmount)} invested once, growing at ${expectedReturn}%`} />
          <TrailTable data={tab2.yearly} />
        </div>
      </div>
    );
  }

  function renderTab3() {
    if (!tab3) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">SIP Book Growth</h2>
              <p className="text-xs text-slate-500 mt-1">Existing AUM + running SIPs + new monthly additions</p>
            </div>
            <NumberInput label="Current AUM" value={startingAUM} onChange={setStartingAUM} prefix="₹" step={500000} min={0} hint="Your existing Assets Under Management" />
            <NumberInput label="Existing Monthly SIP Book" value={existingSIPBook} onChange={setExistingSIPBook} prefix="₹" step={10000} min={0} hint="Total monthly SIP inflow from current clients" />
            <NumberInput label="New SIP Amount (each)" value={tab3NewSIPAmount} onChange={setTab3NewSIPAmount} prefix="₹" step={500} min={500} />
            <NumberInput label="New SIPs Per Month" value={tab3NewSIPsPerMonth} onChange={setTab3NewSIPsPerMonth} suffix="SIPs/month" step={1} min={0} />
            <SharedInputs />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Final AUM" value={formatINR(tab3.finalAUM)} color="blue" />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab3.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Total Trail Earned" value={formatINR(tab3.totalTrailEarned)} sub={`Annual: ${formatINR(tab3.finalAnnualTrail)}`} />
        </div>
        <div className="space-y-8">
          <TrailChart data={tab3.yearly} title="SIP Book AUM & Trail Projection" subtitle={`Starting: ${formatINR(startingAUM)} AUM + ${formatINR(existingSIPBook)}/mo SIP book`} />
          <TrailTable data={tab3.yearly} showSIPs />
        </div>
      </div>
    );
  }

  function renderTab4() {
    if (!tab4) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">AUM Growth — No New Business</h2>
              <p className="text-xs text-slate-500 mt-1">How trail grows purely from market appreciation, even with zero new clients</p>
            </div>
            <NumberInput label="Current AUM" value={currentAUM} onChange={setCurrentAUM} prefix="₹" step={1000000} min={100000} />
            <SharedInputs showReturn={false} showGrowthRate />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="AUM in Year {years}" value={formatINR(tab4.finalAUM)} color="blue" sub={`From ${formatINR(currentAUM)}`} />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab4.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Total Trail Earned" value={formatINR(tab4.totalTrailEarned)} sub="Without adding a single new client" variant="green" />
        </div>
        <div className="space-y-8">
          <TrailChart data={tab4.yearly} title="Passive AUM Growth & Trail" subtitle={`Zero new business — pure market appreciation at ${aumGrowthRate}%`} />
          <TrailTable data={tab4.yearly} />
        </div>
      </div>
    );
  }

  function renderTab5() {
    if (!tab5) return null;
    const milestones = [
      { label: 'AUM crosses ₹1 Cr', year: tab5.yearly.find((r) => r.aum >= 10000000)?.year ?? null },
      { label: 'AUM crosses ₹5 Cr', year: tab5.yearly.find((r) => r.aum >= 50000000)?.year ?? null },
      { label: 'AUM crosses ₹10 Cr', year: tab5.yearly.find((r) => r.aum >= 100000000)?.year ?? null },
      { label: 'AUM crosses ₹50 Cr', year: tab5.yearly.find((r) => r.aum >= 500000000)?.year ?? null },
      { label: 'Trail ₹25K/mo', year: tab5.yearly.find((r) => r.monthlyTrail >= 25000)?.year ?? null },
      { label: 'Trail ₹50K/mo', year: tab5.yearly.find((r) => r.monthlyTrail >= 50000)?.year ?? null },
      { label: 'Trail ₹1 Lakh/mo', year: tab5.yearly.find((r) => r.monthlyTrail >= 100000)?.year ?? null },
      { label: 'Trail ₹2.5 Lakh/mo', year: tab5.yearly.find((r) => r.monthlyTrail >= 250000)?.year ?? null },
    ].filter((m) => m.year !== null);

    return (
      <div className="grid lg:grid-cols-[440px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">Full Income Projection</h2>
              <p className="text-xs text-slate-500 mt-1">Comprehensive view — all income sources combined</p>
            </div>
            <NumberInput label="Current AUM" value={compAUM} onChange={setCompAUM} prefix="₹" step={500000} min={0} />
            <NumberInput label="Existing Monthly SIP Book" value={compSIPBook} onChange={setCompSIPBook} prefix="₹" step={10000} min={0} />
            <NumberInput label="New SIP Amount (each)" value={compNewSIPAmt} onChange={setCompNewSIPAmt} prefix="₹" step={500} min={500} />
            <NumberInput label="New SIPs Per Month" value={compNewSIPs} onChange={setCompNewSIPs} suffix="SIPs/month" step={1} min={0} />
            <NumberInput label="Annual Lump Sum Additions" value={compLumpSum} onChange={setCompLumpSum} prefix="₹" step={100000} min={0} hint="Lump sum business added each year" />
            <SharedInputs />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Final AUM" value={formatINR(tab5.finalAUM)} color="blue" />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab5.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Total Trail Earned" value={formatINR(tab5.totalTrailEarned)} sub={`Annual in final year: ${formatINR(tab5.finalAnnualTrail)}`} />
          {milestones.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Milestone className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-primary-700">Milestones</span>
              </div>
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div key={m.label} className="flex items-center justify-between bg-teal-50 rounded-lg px-3 py-2.5 border border-teal-200">
                    <span className="text-xs font-medium text-teal-800">{m.label}</span>
                    <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Year {m.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-8">
          <TrailChart data={tab5.yearly} title="Comprehensive AUM & Trail Projection" subtitle="All income sources combined" />
          <TrailTable data={tab5.yearly} showSIPs />
        </div>
      </div>
    );
  }

  function renderTab6() {
    if (!tab6) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">Target Income Calculator</h2>
              <p className="text-xs text-slate-500 mt-1">How much business to build for your desired monthly trail income?</p>
            </div>
            <NumberInput label="Target Monthly Trail Income" value={targetMonthlyTrail} onChange={setTargetMonthlyTrail} prefix="₹" step={5000} min={1000} />
            <NumberInput label="Trail Commission Rate" value={trailPercent} onChange={setTrailPercent} suffix="% p.a." step={0.05} min={0.05} max={3} />
            <NumberInput label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} suffix="%" step={0.5} min={1} max={30} />
            <NumberInput label="Avg SIP Size Per Client" value={targetSIPAmount} onChange={setTargetSIPAmount} prefix="₹" step={1000} min={500} />
          </div>
          <HighlightCard
            label="Required AUM"
            value={formatINR(tab6.requiredAUM)}
            sub={`To earn ${formatINR(targetMonthlyTrail)}/month at ${trailPercent}% trail`}
          />
        </div>
        <div className="space-y-8">
          {/* Roadmap Table */}
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
            <h3 className="font-bold text-primary-700 text-lg mb-1">Roadmap to {formatINR(targetMonthlyTrail)}/month</h3>
            <p className="text-sm text-slate-500 mb-6">Required AUM: <span className="font-bold text-brand">{formatINR(tab6.requiredAUM)}</span> — here&apos;s how to get there:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-surface-300 bg-slate-50">
                    <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase">Timeline</th>
                    <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase">New SIPs/Month</th>
                    <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">Monthly Inflow</th>
                    <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">SIP Size</th>
                  </tr>
                </thead>
                <tbody>
                  {tab6.scenarios.map((s, i) => (
                    <tr key={s.years} className={cn('border-b border-surface-200 hover:bg-amber-50/30 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                      <td className="py-3.5 px-5 font-bold text-primary-700">{s.years} Years</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-sm">{s.requiredNewSIPsPerMonth}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-brand">{formatINR(s.requiredMonthlySIP)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-600">{formatINR(s.sipAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Bar Chart */}
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
            <h3 className="font-bold text-primary-700 text-lg mb-1">New SIPs Required Per Month</h3>
            <p className="text-sm text-slate-500 mb-6">Shorter timeline = more hustle needed</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tab6.scenarios.map((s) => ({ name: `${s.years}Y`, sips: s.requiredNewSIPsPerMonth }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Bar dataKey="sips" fill={MFD_COLORS.trail} radius={[8, 8, 0, 0]} name="New SIPs/Month" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTab7() {
    if (!tab7) return null;
    const { data, crossoverYear } = tab7;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">Insurance vs Mutual Fund</h2>
              <p className="text-xs text-slate-500 mt-1">Same premium — compare insurance commission vs MFD trail income</p>
            </div>
            <NumberInput label="Annual Premium / Investment" value={annualPremium} onChange={setAnnualPremium} prefix="₹" step={5000} min={5000} />
            <NumberInput label="Policy / Investment Term" value={policyTerm} onChange={setPolicyTerm} suffix="years" step={1} min={5} max={30} />
            <SharedInputs />
          </div>
          {crossoverYear && (
            <HighlightCard label="MF Trail Overtakes Insurance" value={`Year ${crossoverYear}`} sub="After this, MFD earns more every year — compounding forever!" variant="green" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Shield} label={`Insurance (${policyTerm}yr)`} value={formatINR(data[Math.min(policyTerm, data.length) - 1]?.cumulativeInsurance ?? 0)} color="amber" sub="Cumulative commission" />
            <StatCard icon={TrendingUp} label={`MF Trail (${years}yr)`} value={formatINR(data[data.length - 1]?.cumulativeMF ?? 0)} color="green" sub="Cumulative trail" />
          </div>
        </div>
        <div className="space-y-8">
          {/* Comparison Chart */}
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
            <h3 className="font-bold text-primary-700 text-lg mb-0.5">Cumulative Earnings Comparison</h3>
            <p className="text-sm text-slate-500 mb-5">Insurance commission vs MF trail — same annual amount of {formatINR(annualPremium)}</p>
            <div className="flex items-center gap-5 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: MFD_COLORS.insurance }} />
                <span className="text-xs font-medium text-slate-600">Insurance Commission</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: MFD_COLORS.mf }} />
                <span className="text-xs font-medium text-slate-600">MF Trail Income</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.map((d) => ({ year: d.year, cumulativeInsurance: d.cumulativeInsurance, cumulativeMF: d.cumulativeMF }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gIns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={MFD_COLORS.insurance} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={MFD_COLORS.insurance} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={MFD_COLORS.mf} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={MFD_COLORS.mf} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                  <Tooltip formatter={(value: number, name: string) => [formatINR(value), name === 'cumulativeInsurance' ? 'Insurance' : 'MF Trail']} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} labelFormatter={(l) => `Year ${l}`} />
                  {crossoverYear && <ReferenceLine x={crossoverYear} stroke={MFD_COLORS.milestone} strokeDasharray="6 3" strokeWidth={2} label={{ value: 'Crossover', position: 'top', fontSize: 10, fill: MFD_COLORS.milestone, fontWeight: 700 }} />}
                  <Area type="monotone" dataKey="cumulativeInsurance" stroke={MFD_COLORS.insurance} fill="url(#gIns)" strokeWidth={2} name="cumulativeInsurance" />
                  <Area type="monotone" dataKey="cumulativeMF" stroke={MFD_COLORS.mf} fill="url(#gMF)" strokeWidth={2.5} name="cumulativeMF" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Comparison Table */}
          <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
            <div className="p-5 pb-0">
              <h3 className="font-bold text-primary-700 text-lg mb-0.5">Year-by-Year Comparison</h3>
              <p className="text-sm text-slate-500 mb-4">Insurance agent vs MFD earnings side by side</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-surface-300 bg-slate-50">
                    <th className="text-left py-3 px-4 font-bold text-slate-600 text-xs uppercase">Year</th>
                    <th className="text-right py-3 px-4 font-bold text-red-600 text-xs uppercase">Ins. Commission</th>
                    <th className="text-right py-3 px-4 font-bold text-red-600 text-xs uppercase">Ins. Total</th>
                    <th className="text-right py-3 px-4 font-bold text-teal-600 text-xs uppercase">MF Trail</th>
                    <th className="text-right py-3 px-4 font-bold text-teal-600 text-xs uppercase">MF Total</th>
                    <th className="text-right py-3 px-4 font-bold text-brand text-xs uppercase">MF AUM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.year} className={cn('border-b border-surface-200 hover:bg-amber-50/20 transition-colors', crossoverYear && row.year === crossoverYear && 'bg-teal-50 ring-1 ring-teal-200', i % 2 === 0 ? '' : 'bg-slate-50/30')}>
                      <td className="py-3 px-4 font-bold text-primary-700">Yr {row.year}</td>
                      <td className="py-3 px-4 text-right text-red-500">{formatINR(row.insuranceCommission)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">{formatINR(row.cumulativeInsurance)}</td>
                      <td className="py-3 px-4 text-right text-teal-500">{formatINR(row.mfTrail)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-teal-700">{formatINR(row.cumulativeMF)}</td>
                      <td className="py-3 px-4 text-right text-brand">{formatINR(row.mfAUM)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTab8() {
    if (!tab8 || !tab8Multi) return null;
    return (
      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-primary-700 text-lg">Sub-Broker Scale Projection</h2>
              <p className="text-xs text-slate-500 mt-1">See the business potential at different client scales</p>
            </div>
            <NumberInput label="Number of Clients" value={numberOfClients} onChange={setNumberOfClients} suffix="clients" step={10} min={1} />
            <NumberInput label="Average SIP Per Client" value={avgSIPPerClient} onChange={setAvgSIPPerClient} prefix="₹" step={1000} min={500} />
            <SharedInputs />
            {/* Quick Presets */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {CLIENT_PRESETS.map((p) => (
                  <button key={p.clients} onClick={() => setNumberOfClients(p.clients)}
                    className={cn('text-xs px-3 py-2 rounded-lg border transition-all font-medium',
                      numberOfClients === p.clients
                        ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                        : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                    )}
                  >
                    {p.clients} <span className="text-slate-400">({p.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Total Monthly SIP" value={formatINR(numberOfClients * avgSIPPerClient)} color="blue" />
            <StatCard icon={IndianRupee} label="Monthly Trail" value={formatINR(tab8.finalMonthlyTrail)} color="amber" />
          </div>
          <HighlightCard label="Final AUM" value={formatINR(tab8.finalAUM)} sub={`Total trail earned: ${formatINR(tab8.totalTrailEarned)}`} />
        </div>
        <div className="space-y-8">
          <TrailChart data={tab8.yearly} title="Client Scale — AUM & Trail Growth" subtitle={`${formatNumber(numberOfClients)} clients × ${formatINR(avgSIPPerClient)}/month each`} />
          {/* Scale Comparison */}
          <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
            <h3 className="font-bold text-primary-700 text-lg mb-1">Scale Comparison at Year {years}</h3>
            <p className="text-sm text-slate-500 mb-6">What different client bases can generate</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-surface-300 bg-slate-50">
                    <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase">Clients</th>
                    <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase">Level</th>
                    <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">Monthly SIP</th>
                    <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase">AUM ({years}yr)</th>
                    <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase">Monthly Trail</th>
                  </tr>
                </thead>
                <tbody>
                  {tab8Multi.map((row, i) => (
                    <tr key={row.clients} className={cn('border-b border-surface-200 hover:bg-amber-50/30 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                      <td className="py-3.5 px-5 font-bold text-primary-700">{formatNumber(row.clients)}</td>
                      <td className="py-3.5 px-5"><span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold">{row.label}</span></td>
                      <td className="py-3.5 px-5 text-right text-slate-600">{formatINR(row.totalMonthlySIP)}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-brand">{formatINR(row.finalAUM)}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-amber-700">{formatINR(row.finalMonthlyTrail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <TrailTable data={tab8.yearly} showSIPs />
        </div>
      </div>
    );
  }

  // ── Tab Renderer Map ───────────────────────────────────
  const renderers: Record<string, () => React.ReactNode> = {
    'new-sip': renderTab1, 'lumpsum': renderTab2, 'sip-book': renderTab3,
    'aum-growth': renderTab4, 'comprehensive': renderTab5, 'target': renderTab6,
    'insurance-vs-mf': renderTab7, 'sub-broker': renderTab8,
  };

  // ══════════════════════════════════════════════════════
  // PAGE LAYOUT
  // ══════════════════════════════════════════════════════

  return (
    <>
      {/* ── Premium Header ──────────────────────────────── */}
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
              <h1 className="text-2xl sm:text-4xl font-extrabold">{MFD_CONSTANTS.subtitle}</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Plan your MFD business growth. See how trail income compounds with your AUM over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tab Navigation ──────────────────────────────── */}
      <div className="sticky top-16 lg:top-[72px] z-40 bg-white/95 backdrop-blur-md border-b border-surface-300 shadow-sm">
        <div className="container-custom">
          <div className="flex overflow-x-auto gap-1 py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
            {MFD_TABS.map((tab) => {
              const Icon = TAB_ICONS[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0',
                    isActive
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm'
                      : 'text-slate-500 hover:text-primary-700 hover:bg-surface-100 border border-transparent'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive && 'text-amber-600')} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-amber-500 hidden sm:block" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div className="container-custom">
          {renderers[activeTab]?.()}
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
