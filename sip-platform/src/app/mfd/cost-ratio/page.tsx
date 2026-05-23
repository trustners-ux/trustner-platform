'use client';

import { useMemo, useState } from 'react';
import {
  Percent, IndianRupee, Building2, Users, Cpu, Megaphone, Receipt,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Rocket,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { MFD_CONSTANTS, MFD_DISCLAIMER } from '@/lib/constants/trail-commission';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import NumberInput from '@/components/ui/NumberInput';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';

// ── Palette ──────────────────────────────────────────────
const CAT_COLORS = {
  office: '#0F766E',
  people: '#D4A017',
  tech: '#7C3AED',
  acquisition: '#E8553A',
  tax: '#64748B',
  gst: '#94A3B8',
  net: '#16A34A',
} as const;

const PIE_COLORS = [CAT_COLORS.office, CAT_COLORS.people, CAT_COLORS.tech, CAT_COLORS.acquisition];

// ── Small Section Header ─────────────────────────────────
function SectionLabel({ icon: Icon, text }: { icon: typeof Percent; text: string }) {
  return (
    <div className="flex items-center gap-2 pb-1.5 border-b border-surface-200">
      <Icon className="w-3.5 h-3.5 text-amber-600" />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{text}</p>
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof IndianRupee; label: string; value: string;
  color: 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'slate'; sub?: string;
}) {
  const tone = {
    blue: { bg: 'bg-brand-50', ic: 'text-brand', txt: 'text-brand' },
    amber: { bg: 'bg-amber-100', ic: 'text-amber-600', txt: 'text-amber-700' },
    green: { bg: 'bg-teal-50', ic: 'text-teal-600', txt: 'text-teal-700' },
    red: { bg: 'bg-red-50', ic: 'text-red-600', txt: 'text-red-700' },
    purple: { bg: 'bg-secondary-50', ic: 'text-secondary-600', txt: 'text-secondary-700' },
    slate: { bg: 'bg-surface-100', ic: 'text-slate-500', txt: 'text-primary-700' },
  }[color];
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', tone.bg)}>
          <Icon className={cn('w-4 h-4', tone.ic)} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold', tone.txt)}>{value}</div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Hero Highlight ───────────────────────────────────────
function HeroStat({ label, value, sub, variant }: { label: string; value: string; sub?: string; variant: 'gold' | 'green' | 'red' }) {
  const styles = {
    gold: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-amber-700',
    green: 'bg-gradient-to-br from-teal-50 to-green-50 border-teal-200 text-teal-700',
    red: 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 text-red-700',
  }[variant];
  const lblClr = variant === 'gold' ? 'text-amber-600' : variant === 'green' ? 'text-teal-600' : 'text-red-600';
  return (
    <div className={cn('rounded-xl p-5 border', styles)}>
      <div className={cn('text-[10px] uppercase tracking-wider font-semibold mb-1', lblClr)}>{label}</div>
      <div className="text-3xl font-black">{value}</div>
      {sub && <div className={cn('text-xs mt-1.5', lblClr)}>{sub}</div>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function MFDCostRatioPage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // Income
  const [trail, setTrail] = useState(3000000);
  const [insurance, setInsurance] = useState(300000);
  const [pms, setPms] = useState(0);
  const [otherInc, setOtherInc] = useState(0);

  // Office (monthly)
  const [rent, setRent] = useState(25000);
  const [utilities, setUtilities] = useState(5000);
  const [maintenance, setMaintenance] = useState(3000);

  // People
  const [staffSalary, setStaffSalary] = useState(40000);
  const [subBrokerPct, setSubBrokerPct] = useState(0);

  // Tech & Compliance
  const [crm, setCrm] = useState(3000);
  const [accountingYr, setAccountingYr] = useState(30000);
  const [complianceYr, setComplianceYr] = useState(15000);
  const [nismYr, setNismYr] = useState(10000);

  // Acquisition
  const [marketing, setMarketing] = useState(10000);
  const [travel, setTravel] = useState(5000);
  const [events, setEvents] = useState(2500);

  // Tax
  const [taxRegime, setTaxRegime] = useState<'old' | 'new'>('new');
  const [taxRate, setTaxRate] = useState(25);

  // Clients (for per-client metric)
  const [totalClients, setTotalClients] = useState(120);

  // ── Calculations ───────────────────────────────────────
  const calc = useMemo(() => {
    const totalIncome = trail + insurance + pms + otherInc;
    const office = (rent + utilities + maintenance) * 12;
    const people = staffSalary * 12 + trail * (subBrokerPct / 100);
    const tech = crm * 12 + accountingYr + complianceYr + nismYr;
    const acquisition = (marketing + travel + events) * 12;
    const totalCosts = office + people + tech + acquisition;

    const grossProfit = totalIncome - totalCosts;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    const gst = totalIncome * 0.18;
    const incomeTax = Math.max(0, grossProfit) * (taxRate / 100);
    const netProfit = grossProfit - incomeTax - gst;
    const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const pct = (v: number) => (totalIncome > 0 ? (v / totalIncome) * 100 : 0);
    const ratios = {
      office: pct(office),
      people: pct(people),
      tech: pct(tech),
      acquisition: pct(acquisition),
      total: pct(totalCosts),
    };

    const perClientCost = totalClients > 0 ? totalCosts / totalClients : 0;
    const perClientRevenue = totalClients > 0 ? totalIncome / totalClients : 0;

    // Growth sim: double AUM assumes trail doubles, insurance/pms/other same,
    // fixed costs (rent, util, maint, staff, accounting, compliance, nism, crm) stay flat.
    // Variable costs (sub-broker %, marketing, travel, events) scale with revenue roughly.
    const doubledIncome = trail * 2 + insurance + pms + otherInc;
    const doubledPeople = staffSalary * 12 + trail * 2 * (subBrokerPct / 100);
    const doubledAcq = acquisition; // assume fixed in short run
    const doubledCosts = office + doubledPeople + tech + doubledAcq;
    const doubledGross = doubledIncome - doubledCosts;
    const doubledGst = doubledIncome * 0.18;
    const doubledTax = Math.max(0, doubledGross) * (taxRate / 100);
    const doubledNet = doubledGross - doubledTax - doubledGst;
    const doubledNetMargin = doubledIncome > 0 ? (doubledNet / doubledIncome) * 100 : 0;

    return {
      totalIncome, office, people, tech, acquisition, totalCosts,
      grossProfit, grossMargin, gst, incomeTax, netProfit, netMargin,
      ratios, perClientCost, perClientRevenue,
      doubledIncome, doubledCosts, doubledNet, doubledNetMargin,
    };
  }, [trail, insurance, pms, otherInc, rent, utilities, maintenance, staffSalary, subBrokerPct, crm, accountingYr, complianceYr, nismYr, marketing, travel, events, taxRate, totalClients]);

  const pieData = [
    { name: 'Office', value: Math.max(0, calc.office), color: CAT_COLORS.office },
    { name: 'People', value: Math.max(0, calc.people), color: CAT_COLORS.people },
    { name: 'Tech & Compliance', value: Math.max(0, calc.tech), color: CAT_COLORS.tech },
    { name: 'Client Acquisition', value: Math.max(0, calc.acquisition), color: CAT_COLORS.acquisition },
  ].filter((d) => d.value > 0);

  const waterfallData = [
    { name: 'Income', value: calc.totalIncome, fill: CAT_COLORS.office },
    { name: 'Costs', value: calc.totalCosts, fill: CAT_COLORS.people },
    { name: 'GST', value: calc.gst, fill: CAT_COLORS.gst },
    { name: 'Income Tax', value: calc.incomeTax, fill: CAT_COLORS.tax },
    { name: 'Net Profit', value: Math.max(0, calc.netProfit), fill: CAT_COLORS.net },
  ];

  // ── Insights ───────────────────────────────────────────
  const insights: { type: 'warn' | 'ok' | 'info'; text: string }[] = [];
  if (calc.ratios.total > 70) {
    const top = Object.entries({
      Office: calc.ratios.office, People: calc.ratios.people, Tech: calc.ratios.tech, Acquisition: calc.ratios.acquisition,
    }).sort((a, b) => b[1] - a[1])[0];
    insights.push({ type: 'warn', text: `Your cost base is high (${calc.ratios.total.toFixed(1)}% of income). Focus area: ${top[0]} at ${top[1].toFixed(1)}%. Agency/multi-RM MFDs typically operate at 50–70%.` });
  } else if (calc.ratios.total < 30) {
    insights.push({ type: 'ok', text: `Efficient operation — cost ratio ${calc.ratios.total.toFixed(1)}%. Solo MFDs often land here. Consider reinvesting savings into growth (marketing, hiring, tech).` });
  } else {
    insights.push({ type: 'info', text: `Cost ratio ${calc.ratios.total.toFixed(1)}% is within the typical 30–70% band for working MFD practices.` });
  }
  if (calc.ratios.acquisition > 20) {
    insights.push({ type: 'warn', text: `Client acquisition is ${calc.ratios.acquisition.toFixed(1)}% of income. Compute LTV/CAC using the client-LTV calculator to ensure payback before scaling spend.` });
  }
  if (subBrokerPct > 20) {
    insights.push({ type: 'warn', text: `Sub-broker pay-outs at ${subBrokerPct}% of trail are significant. Monitor sub-broker productivity (AUM-per-person) against the commission you share.` });
  }
  if (calc.grossProfit < 0) {
    insights.push({ type: 'warn', text: 'Costs exceed income — operating at a loss. Trim fixed costs or focus on trail book growth before adding headcount.' });
  }

  const benchTone = calc.ratios.total <= 45 ? 'green' : calc.ratios.total <= 70 ? 'amber' : 'red';

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Percent className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">{MFD_CONSTANTS.title}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cost-to-Commission Ratio
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">Cost-to-Commission Ratio Calculator</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                See your real profit after office, staff, tech, marketing, GST &amp; income tax. Know your margins, not just your gross trail.
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
        pdfElementId="cost-ratio-report"
        pdfTitle="MFD Cost-to-Commission Report"
        pdfFileName={`MFD-Cost-Ratio${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="Cost Ratio Report"
      />

      {/* ── Content ─────────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div id="cost-ratio-report" className="container-custom">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="Cost Ratio Report" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">

            {/* ═════════ LEFT: INPUTS ═════════ */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
              {/* Section 1 — Income */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={TrendingUp} text="Annual Commission Income" />
                <NumberInput label="Trail Commission Income" value={trail} onChange={setTrail} prefix="₹" step={50000} min={0} max={100000000} hint="Gross trail per year from MF AUM" />
                <NumberInput label="Insurance Commission" value={insurance} onChange={setInsurance} prefix="₹" step={10000} min={0} />
                <NumberInput label="PMS / AIF Distribution" value={pms} onChange={setPms} prefix="₹" step={10000} min={0} />
                <NumberInput label="Other (NPS, AIF placement, etc.)" value={otherInc} onChange={setOtherInc} prefix="₹" step={10000} min={0} />
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Total Income</span>
                  <span className="text-base font-extrabold text-amber-700">{formatINR(calc.totalIncome)}</span>
                </div>
              </div>

              {/* Section 2 — Office */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={Building2} text="Office Costs (monthly)" />
                <NumberInput label="Office Rent" value={rent} onChange={setRent} prefix="₹" step={1000} min={0} />
                <NumberInput label="Utilities (electricity, internet, water)" value={utilities} onChange={setUtilities} prefix="₹" step={500} min={0} />
                <NumberInput label="Office Maintenance" value={maintenance} onChange={setMaintenance} prefix="₹" step={500} min={0} />
              </div>

              {/* Section 3 — People */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={Users} text="People Costs" />
                <NumberInput label="Staff Salaries (monthly)" value={staffSalary} onChange={setStaffSalary} prefix="₹" step={5000} min={0} hint="Junior RM / operations headcount" />
                <NumberInput label="Sub-broker Commissions Paid Out" value={subBrokerPct} onChange={setSubBrokerPct} suffix="% of trail" step={1} min={0} max={50} hint="% of your trail paid to downstream sub-brokers" />
              </div>

              {/* Section 4 — Tech & Compliance */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={Cpu} text="Tech &amp; Compliance" />
                <NumberInput label="CRM / Software Subscriptions (monthly)" value={crm} onChange={setCrm} prefix="₹" step={500} min={0} />
                <NumberInput label="Accounting / CA Fees (annual)" value={accountingYr} onChange={setAccountingYr} prefix="₹" step={5000} min={0} />
                <NumberInput label="Compliance / Audit (annual)" value={complianceYr} onChange={setComplianceYr} prefix="₹" step={5000} min={0} />
                <NumberInput label="NISM Recertification (amortised over 3 yrs)" value={nismYr} onChange={setNismYr} prefix="₹" step={2500} min={0} />
              </div>

              {/* Section 5 — Acquisition */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={Megaphone} text="Client Acquisition (monthly)" />
                <NumberInput label="Marketing / Digital Ads" value={marketing} onChange={setMarketing} prefix="₹" step={1000} min={0} />
                <NumberInput label="Travel &amp; Client Meetings" value={travel} onChange={setTravel} prefix="₹" step={500} min={0} />
                <NumberInput label="Events / Seminars" value={events} onChange={setEvents} prefix="₹" step={500} min={0} />
              </div>

              {/* Section 6 — Taxes */}
              <div className="bg-white rounded-xl p-5 border border-surface-300 shadow-sm space-y-4">
                <SectionLabel icon={Receipt} text="Taxes (simplified)" />
                <div>
                  <p className="block text-[13px] font-semibold text-slate-600 mb-1.5">Tax Regime</p>
                  <div className="flex gap-2">
                    {(['old', 'new'] as const).map((r) => (
                      <button key={r} onClick={() => setTaxRegime(r)}
                        className={cn('flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-all',
                          taxRegime === r
                            ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                            : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50')}
                      >
                        {r === 'old' ? 'Old Regime' : 'New Regime'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Regime is an indicative context — effective rate below drives the math.</p>
                </div>
                <NumberInput label="Effective Income-Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" step={1} min={0} max={40} hint="MFDs earning >₹15L typically land at 30% slab before surcharge/cess" />
                <NumberInput label="Total Clients (for per-client view)" value={totalClients} onChange={setTotalClients} suffix="clients" step={10} min={0} />
              </div>

            </div>

            {/* ═════════ RIGHT: OUTPUT ═════════ */}
            <div className="space-y-8">
              {/* Hero stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <HeroStat label="Gross Profit Margin" value={`${calc.grossMargin.toFixed(1)}%`} sub="Before GST & income tax" variant={calc.grossMargin >= 40 ? 'green' : calc.grossMargin >= 20 ? 'gold' : 'red'} />
                <HeroStat label="Net Profit Margin" value={`${calc.netMargin.toFixed(1)}%`} sub="After GST & income tax" variant={calc.netMargin >= 25 ? 'green' : calc.netMargin >= 10 ? 'gold' : 'red'} />
                <HeroStat label="Annual Net Take-Home" value={formatINR(calc.netProfit)} sub={`On ${formatINR(calc.totalIncome)} income`} variant={calc.netProfit > 0 ? 'green' : 'red'} />
              </div>

              {/* Big metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard icon={TrendingUp} label="Total Income" value={formatINR(calc.totalIncome)} color="blue" />
                <MetricCard icon={TrendingDown} label="Total Costs" value={formatINR(calc.totalCosts)} color="amber" sub={`${calc.ratios.total.toFixed(1)}% of income`} />
                <MetricCard icon={IndianRupee} label="Gross Profit" value={formatINR(calc.grossProfit)} color="purple" sub="Before tax & GST" />
                <MetricCard icon={CheckCircle2} label="Net Profit" value={formatINR(calc.netProfit)} color={calc.netProfit > 0 ? 'green' : 'red'} sub="After tax & GST" />
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pie */}
                <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                  <h3 className="font-bold text-primary-700 mb-0.5 text-lg">Cost Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Where your operating rupees go</p>
                  <div className="h-72">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [formatINR(v), n]} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-slate-400">Enter cost inputs to see breakdown</div>
                    )}
                  </div>
                </div>

                {/* Waterfall (horizontal bar) */}
                <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                  <h3 className="font-bold text-primary-700 mb-0.5 text-lg">Income → Net Profit Flow</h3>
                  <p className="text-sm text-slate-500 mb-4">From gross commission to take-home</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterfallData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} width={90} />
                        <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Cost Ratio Table */}
              <div className="bg-white rounded-xl border border-surface-300 shadow-sm overflow-hidden">
                <div className="p-5 pb-3">
                  <h3 className="font-bold text-primary-700 text-lg mb-0.5">Cost Ratios — % of Income</h3>
                  <p className="text-sm text-slate-500">How much each category eats into your top-line</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-surface-300 bg-slate-50">
                        <th className="text-left py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Category</th>
                        <th className="text-right py-3 px-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Annual Cost</th>
                        <th className="text-right py-3 px-5 font-bold text-amber-700 text-xs uppercase tracking-wider">% of Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        { name: 'Office', cost: calc.office, pct: calc.ratios.office, color: CAT_COLORS.office },
                        { name: 'People', cost: calc.people, pct: calc.ratios.people, color: CAT_COLORS.people },
                        { name: 'Tech & Compliance', cost: calc.tech, pct: calc.ratios.tech, color: CAT_COLORS.tech },
                        { name: 'Client Acquisition', cost: calc.acquisition, pct: calc.ratios.acquisition, color: CAT_COLORS.acquisition },
                      ]).map((r, i) => (
                        <tr key={r.name} className={cn('border-b border-surface-200 hover:bg-amber-50/30 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                          <td className="py-3 px-5 font-semibold text-primary-700 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />
                            {r.name}
                          </td>
                          <td className="py-3 px-5 text-right text-slate-700">{formatINR(r.cost)}</td>
                          <td className="py-3 px-5 text-right font-bold text-amber-700">{r.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-amber-300 bg-amber-50/50">
                        <td className="py-3 px-5 font-extrabold text-amber-800">Total Operating Costs</td>
                        <td className="py-3 px-5 text-right font-extrabold text-amber-800">{formatINR(calc.totalCosts)}</td>
                        <td className="py-3 px-5 text-right font-extrabold text-amber-800">{calc.ratios.total.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {totalClients > 0 && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-surface-200 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Cost per client:</span>{' '}
                      <span className="font-bold text-primary-700">{formatINR(calc.perClientCost)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Revenue per client:</span>{' '}
                      <span className="font-bold text-brand">{formatINR(calc.perClientRevenue)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Benchmarks */}
              <div className={cn('rounded-xl p-5 border',
                benchTone === 'green' ? 'bg-teal-50 border-teal-200' :
                benchTone === 'amber' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              )}>
                <div className="flex items-start gap-3">
                  {benchTone === 'green' ? <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" /> :
                   benchTone === 'amber' ? <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /> :
                   <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <h4 className={cn('font-bold text-sm mb-1.5',
                      benchTone === 'green' ? 'text-teal-800' : benchTone === 'amber' ? 'text-amber-800' : 'text-red-800'
                    )}>
                      Benchmark — you&apos;re at {calc.ratios.total.toFixed(1)}% cost ratio
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="text-slate-700"><strong>Well-run solo MFD:</strong> 30–45%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-slate-700"><strong>Agency / team MFD:</strong> 50–70%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-1">Insights for Your Practice</h3>
                <p className="text-sm text-slate-500 mb-4">Observations based on your numbers</p>
                <div className="space-y-3">
                  {insights.map((ins, i) => (
                    <div key={i} className={cn('flex items-start gap-3 rounded-lg p-3 border',
                      ins.type === 'warn' ? 'bg-red-50 border-red-200' :
                      ins.type === 'ok' ? 'bg-teal-50 border-teal-200' :
                      'bg-slate-50 border-surface-200'
                    )}>
                      {ins.type === 'warn' ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /> :
                       ins.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /> :
                       <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                      <p className={cn('text-xs leading-relaxed',
                        ins.type === 'warn' ? 'text-red-800' :
                        ins.type === 'ok' ? 'text-teal-800' :
                        'text-slate-700'
                      )}>{ins.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Simulator */}
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800 text-lg">Growth Simulator — Double Your AUM</h3>
                </div>
                <p className="text-sm text-amber-700 mb-5">Fixed costs stay flat; only variable costs scale. See the margin leverage.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">New Income</p>
                    <p className="text-lg font-extrabold text-amber-800">{formatINR(calc.doubledIncome)}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Trail doubles, rest flat</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">New Costs</p>
                    <p className="text-lg font-extrabold text-amber-800">{formatINR(calc.doubledCosts)}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Rent, staff, tech unchanged</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-teal-300">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600 mb-0.5">Net Margin Rises To</p>
                    <p className="text-lg font-extrabold text-teal-700">{calc.doubledNetMargin.toFixed(1)}%</p>
                    <p className="text-[10px] text-teal-600 mt-0.5">Was {calc.netMargin.toFixed(1)}%</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 mt-4 leading-relaxed">
                  <strong>Net take-home at 2× AUM: {formatINR(calc.doubledNet)}</strong>
                  {calc.netProfit > 0 && ` — a ${(calc.doubledNet / calc.netProfit).toFixed(1)}× jump in take-home for 2× revenue. This is the scaling leverage of a fixed-cost MFD business.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom space-y-1.5">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.internal}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">GST assumed at 18% on all commission income (simplified — actual liability depends on registration status, input credits, and place of supply). Income-tax rate is user-entered; real liability includes surcharge, cess, and slab-wise computation.</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.general}</p>
        </div>
      </section>
    </>
  );
}
