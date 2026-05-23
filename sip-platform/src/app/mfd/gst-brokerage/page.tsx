'use client';

import { useMemo, useState } from 'react';
import {
  Receipt, IndianRupee, Briefcase, FileCheck, AlertTriangle,
  TrendingDown, CheckCircle2, Info, Percent, Wallet, FileText,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import SharedNumberInput from '@/components/ui/NumberInput';
import { MFD_DISCLAIMER } from '@/lib/constants/trail-commission';
import { MFDBrandBar, MFDBrandHeader } from '@/components/mfd/MFDBrandBar';

const NumberInput = SharedNumberInput;

// ── GST Constants ─────────────────────────────────────────
const GST_RATE = 0.18;
const REG_THRESHOLD = 2000000; // ₹20 Lakh aggregate turnover
const NEAR_THRESHOLD = 1800000; // ₹18 L — show "close" warning

type RegStatus = 'not-registered' | 'voluntary' | 'mandatory';

// ── Visual helpers ────────────────────────────────────────
const COLORS = {
  income: '#14B8A6',     // teal
  gst: '#F59E0B',        // amber (primary)
  gstDeep: '#D97706',    // deep amber
  expense: '#94A3B8',    // slate
  itc: '#0EA5E9',        // sky
  danger: '#EF4444',
};

// ── Stat Card ─────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, sub,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  color?: 'amber' | 'teal' | 'sky' | 'slate';
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-surface-300 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            color === 'amber' ? 'bg-amber-100' :
            color === 'teal' ? 'bg-teal-50' :
            color === 'sky' ? 'bg-sky-50' : 'bg-slate-100'
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              color === 'amber' ? 'text-amber-600' :
              color === 'teal' ? 'text-teal-600' :
              color === 'sky' ? 'text-sky-600' : 'text-slate-500'
            )}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={cn(
          'text-xl font-extrabold',
          color === 'amber' ? 'text-amber-700' :
          color === 'teal' ? 'text-teal-700' :
          color === 'sky' ? 'text-sky-700' : 'text-primary-700'
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

export default function MFDGSTBrokeragePage() {
  // Personalisation for PDF export
  const [subBrokerName, setSubBrokerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [arn, setArn] = useState('');

  // ── Income ────────────────────────────────────────────
  const [trailCommission, setTrailCommission] = useState(3000000);
  const [otherIncome, setOtherIncome] = useState(0);
  const [showMonthly, setShowMonthly] = useState(false);

  // ── Registration Status ──────────────────────────────
  const [regStatus, setRegStatus] = useState<RegStatus>('mandatory');

  // ── Expenses (monthly unless noted) ──────────────────
  const [rentMonthly, setRentMonthly] = useState(25000);
  const [softwareMonthly, setSoftwareMonthly] = useState(5000);
  const [staffMonthly, setStaffMonthly] = useState(0);
  const [marketingMonthly, setMarketingMonthly] = useState(10000);
  const [travelYearly, setTravelYearly] = useState(60000);
  const [professionalYearly, setProfessionalYearly] = useState(24000);
  const [otherYearly, setOtherYearly] = useState(0);
  const [hasGSTInvoices, setHasGSTInvoices] = useState(true);

  // ── Calculations ─────────────────────────────────────
  const calc = useMemo(() => {
    const grossAnnualIncome = trailCommission + otherIncome;
    const isMandatoryRegistration = grossAnnualIncome > REG_THRESHOLD;
    const isRegistered = regStatus === 'voluntary' || regStatus === 'mandatory';
    const isSubjectToGST = isMandatoryRegistration || regStatus === 'voluntary';

    // Annualised expenses
    const rentYr = rentMonthly * 12;
    const softwareYr = softwareMonthly * 12;
    const staffYr = staffMonthly * 12;
    const marketingYr = marketingMonthly * 12;
    const totalExpenses =
      rentYr + softwareYr + staffYr + marketingYr + travelYearly + professionalYearly + otherYearly;

    // Output GST — only if registered (or mandatorily required)
    const outputGST = isSubjectToGST ? grossAnnualIncome * GST_RATE : 0;

    // ITC — extract 18% embedded GST from GST-invoiced expenses.
    // Staff salaries carry no GST (employer-employee exempt); we exclude them.
    const itcEligibleBase =
      hasGSTInvoices && isRegistered
        ? rentYr + softwareYr + marketingYr + travelYearly + professionalYearly + otherYearly
        : 0;
    const gstOnExpenses = itcEligibleBase * (GST_RATE / (1 + GST_RATE));

    const netGSTPayable = Math.max(0, outputGST - gstOnExpenses);
    const effectiveGSTRate =
      grossAnnualIncome > 0 ? (netGSTPayable / grossAnnualIncome) * 100 : 0;
    const netIncomeAfterGST = grossAnnualIncome - netGSTPayable - totalExpenses;

    // Near-threshold check
    const isNearThreshold =
      grossAnnualIncome >= NEAR_THRESHOLD && grossAnnualIncome <= REG_THRESHOLD;
    const mustRegisterWarning = isMandatoryRegistration && regStatus === 'not-registered';

    return {
      grossAnnualIncome,
      totalExpenses,
      outputGST,
      gstOnExpenses,
      netGSTPayable,
      effectiveGSTRate,
      netIncomeAfterGST,
      isSubjectToGST,
      isMandatoryRegistration,
      isNearThreshold,
      mustRegisterWarning,
    };
  }, [
    trailCommission, otherIncome, regStatus,
    rentMonthly, softwareMonthly, staffMonthly, marketingMonthly,
    travelYearly, professionalYearly, otherYearly, hasGSTInvoices,
  ]);

  // ── Pie chart data (gross income breakdown) ──────────
  const pieData = useMemo(() => [
    { name: 'Net Income', value: Math.max(0, calc.netIncomeAfterGST), color: COLORS.income },
    { name: 'Net GST Outflow', value: calc.netGSTPayable, color: COLORS.gst },
    { name: 'Business Expenses', value: calc.totalExpenses, color: COLORS.expense },
  ].filter((d) => d.value > 0), [calc]);

  // ── Bar chart data (monthly view) ────────────────────
  const monthlyData = useMemo(() => {
    const monthlyOutput = calc.outputGST / 12;
    const monthlyITC = calc.gstOnExpenses / 12;
    const monthlyNet = calc.netGSTPayable / 12;
    const labels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    return labels.map((m) => ({
      month: m,
      outputGST: Math.round(monthlyOutput),
      itc: Math.round(monthlyITC),
      netPayable: Math.round(monthlyNet),
    }));
  }, [calc]);

  // ── Insights ─────────────────────────────────────────
  const insights = useMemo(() => {
    const out: { tone: 'info' | 'warn' | 'good'; text: string }[] = [];
    if (calc.grossAnnualIncome <= REG_THRESHOLD) {
      out.push({
        tone: 'info',
        text: 'You are below the ₹20L GST registration threshold. Voluntary registration lets you claim ITC on GST-invoiced expenses, but adds monthly compliance (GSTR-3B, GSTR-1) and annual GSTR-9 filing overhead.',
      });
    } else {
      out.push({
        tone: 'warn',
        text: 'GST registration is MANDATORY. File GSTR-1 by the 11th and GSTR-3B by the 20th of each month. Annual GSTR-9 is due by 31st December of the following financial year.',
      });
    }
    if (calc.isNearThreshold) {
      out.push({
        tone: 'warn',
        text: 'You are close to the ₹20L threshold. Once crossed, you must register under GST within 30 days to avoid late-registration penalty.',
      });
    }
    if (calc.outputGST > 0 && calc.gstOnExpenses / calc.outputGST > 0.5) {
      out.push({
        tone: 'good',
        text: 'Strong ITC claim — more than 50% of your output GST is offset by input credit. Keep GST-invoiced bills well documented and match GSTR-2B with your purchase register monthly.',
      });
    }
    if (calc.isSubjectToGST && !hasGSTInvoices) {
      out.push({
        tone: 'warn',
        text: 'You have marked expenses as having no GST invoices. Without valid tax invoices you cannot claim ITC — ask vendors (rent, SaaS, ads, CA) to issue GST-compliant invoices.',
      });
    }
    return out;
  }, [calc, hasGSTInvoices]);

  // ── Registration pill component ──────────────────────
  function RegPill({ id, label }: { id: RegStatus; label: string }) {
    const active = regStatus === id;
    return (
      <button
        type="button"
        onClick={() => setRegStatus(id)}
        className={cn(
          'text-xs px-3 py-2 rounded-lg border transition-all font-medium text-left flex-1 min-w-[120px]',
          active
            ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
            : 'bg-white border-surface-300 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
        )}
      >
        {label}
      </button>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <>
      {/* ── Header ────────────────────────────────────── */}
      <section className="bg-hero-pattern text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="container-custom py-10 lg:py-14">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30 shrink-0">
              <Receipt className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">MFD Business Tools</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GST Compliance
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold">GST on MFD Brokerage</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Compute your 18% output GST, claim ITC on business expenses, and see net take-home income.
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
        pdfElementId="gst-brokerage-results"
        pdfTitle="MFD GST on Brokerage Report"
        pdfFileName={`MFD-GST-Brokerage${subBrokerName ? `-${subBrokerName.replace(/\s+/g, '-')}` : ''}`}
        reportLabel="GST on Brokerage"
      />

      {/* ── Body ─────────────────────────────────────── */}
      <section className="section-padding bg-surface-100 min-h-[60vh]">
        <div id="gst-brokerage-results" className="container-custom">
          <MFDBrandHeader subBrokerName={subBrokerName} firmName={firmName} arn={arn} reportLabel="GST on Brokerage Report" />
          <div className="grid lg:grid-cols-[440px_1fr] gap-8">

            {/* ── LEFT: Inputs ──────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">

              {/* Section 1: Income */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600" /> Brokerage Income
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Your total MFD income for the year</p>
                </div>
                <NumberInput
                  label="Annual Trail Commission"
                  value={trailCommission}
                  onChange={setTrailCommission}
                  prefix="₹"
                  step={50000}
                  min={10000}
                  max={100000000}
                  hint="Gross brokerage from AMCs before GST deduction"
                />
                <NumberInput
                  label="Other MFD Income (optional)"
                  value={otherIncome}
                  onChange={setOtherIncome}
                  prefix="₹"
                  step={10000}
                  min={0}
                  max={100000000}
                  hint="Insurance / PMS / AIF commission, if any"
                />
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showMonthly}
                    onChange={(e) => setShowMonthly(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-amber-600 focus:ring-amber-400"
                  />
                  Show month-wise breakdown
                </label>
              </div>

              {/* Section 2: Registration Status */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-4">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600" /> GST Registration Status
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Your current GST registration</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RegPill id="not-registered" label="Not registered" />
                  <RegPill id="voluntary" label="Voluntarily registered" />
                  <RegPill id="mandatory" label="Mandatorily registered (>₹20L)" />
                </div>

                {calc.mustRegisterWarning && (
                  <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700 leading-snug">
                        You MUST register under GST (Sec 22, CGST Act)
                      </p>
                      <p className="text-xs text-red-600 mt-1 leading-relaxed">
                        Aggregate turnover of {formatINR(calc.grossAnnualIncome)} exceeds ₹20L. Register within 30 days to avoid penalty and interest.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Expenses */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-primary-700 text-lg flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600" /> Business Expenses
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">For Input Tax Credit (ITC) calculation</p>
                </div>
                <NumberInput label="Office Rent" value={rentMonthly} onChange={setRentMonthly} prefix="₹" suffix="/mo" step={1000} min={0} max={500000} />
                <NumberInput label="Software / Subscriptions" value={softwareMonthly} onChange={setSoftwareMonthly} prefix="₹" suffix="/mo" step={500} min={0} max={200000} hint="Advisor tech, CRM, data providers" />
                <NumberInput label="Staff Salaries" value={staffMonthly} onChange={setStaffMonthly} prefix="₹" suffix="/mo" step={5000} min={0} max={2000000} hint="No GST on salaries — ITC not applicable" />
                <NumberInput label="Marketing / Digital Ads" value={marketingMonthly} onChange={setMarketingMonthly} prefix="₹" suffix="/mo" step={1000} min={0} max={500000} />
                <NumberInput label="Travel & Client Meetings" value={travelYearly} onChange={setTravelYearly} prefix="₹" suffix="/yr" step={5000} min={0} max={2000000} />
                <NumberInput label="Professional Services (CA / legal)" value={professionalYearly} onChange={setProfessionalYearly} prefix="₹" suffix="/yr" step={2000} min={0} max={1000000} />
                <NumberInput label="Other Business Expenses" value={otherYearly} onChange={setOtherYearly} prefix="₹" suffix="/yr" step={5000} min={0} max={5000000} />

                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={hasGSTInvoices}
                    onChange={(e) => setHasGSTInvoices(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-amber-600 focus:ring-amber-400 mt-0.5"
                  />
                  <span className="leading-snug">
                    These expenses have valid GST invoices
                    <span className="block text-[11px] text-slate-400 mt-0.5">Only GST-invoiced expenses qualify for ITC</span>
                  </span>
                </label>
              </div>
            </div>

            {/* ── RIGHT: Outputs ───────────────────────── */}
            <div className="space-y-8">

              {/* Hero Result */}
              <div className="rounded-2xl p-6 sm:p-8 border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Annual GST Summary</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <div className="text-[11px] uppercase text-amber-600 font-semibold mb-1">Net GST Payable</div>
                    <div className="text-3xl font-black text-amber-700">{formatINR(calc.netGSTPayable)}</div>
                    <div className="text-[11px] text-amber-600 mt-1">After claiming ITC</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase text-amber-600 font-semibold mb-1">Effective GST Rate</div>
                    <div className="text-3xl font-black text-amber-700">{calc.effectiveGSTRate.toFixed(2)}%</div>
                    <div className="text-[11px] text-amber-600 mt-1">Net GST ÷ Gross income</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase text-teal-600 font-semibold mb-1">Net Take-Home</div>
                    <div className="text-3xl font-black text-teal-700">{formatINR(calc.netIncomeAfterGST)}</div>
                    <div className="text-[11px] text-teal-600 mt-1">After GST & expenses</div>
                  </div>
                </div>
              </div>

              {/* 4 metric tiles */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Wallet} label="Gross Brokerage" value={formatINR(calc.grossAnnualIncome)} color="teal" />
                <StatCard icon={Receipt} label="Output GST @ 18%" value={formatINR(calc.outputGST)} color="amber" sub={calc.isSubjectToGST ? 'Before ITC' : 'Not registered'} />
                <StatCard icon={TrendingDown} label="Input Tax Credit" value={formatINR(calc.gstOnExpenses)} color="sky" sub="From GST-invoiced expenses" />
                <StatCard icon={IndianRupee} label="Net GST Payable" value={formatINR(calc.netGSTPayable)} color="amber" sub="To government" />
              </div>

              {/* Pie chart */}
              <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                <h3 className="font-bold text-primary-700 text-lg mb-0.5">Where Your Gross Income Goes</h3>
                <p className="text-sm text-slate-500 mb-5">Breakdown of {formatINR(calc.grossAnnualIncome)} annual brokerage</p>
                {pieData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={2}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Enter income and expenses to see breakdown.</p>
                )}
              </div>

              {/* Monthly bar (toggled) */}
              {showMonthly && (
                <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                  <h3 className="font-bold text-primary-700 text-lg mb-0.5">Monthly GST Flow</h3>
                  <p className="text-sm text-slate-500 mb-5">Output GST vs Net Payable across the financial year</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                        <Tooltip
                          formatter={(value: number, name: string) => [formatINR(value), name]}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="outputGST" fill={COLORS.gst} name="Output GST" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="netPayable" fill={COLORS.gstDeep} name="Net Payable" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Insights */}
              {insights.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-surface-300 shadow-sm">
                  <h3 className="font-bold text-primary-700 text-lg mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600" /> Insights
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Auto-generated from your numbers</p>
                  <div className="space-y-3">
                    {insights.map((ins, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-lg p-4 border flex gap-3',
                          ins.tone === 'warn' && 'bg-amber-50 border-amber-200',
                          ins.tone === 'good' && 'bg-teal-50 border-teal-200',
                          ins.tone === 'info' && 'bg-sky-50 border-sky-200'
                        )}
                      >
                        {ins.tone === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                        {ins.tone === 'good' && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                        {ins.tone === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
                        <p
                          className={cn(
                            'text-sm leading-relaxed',
                            ins.tone === 'warn' && 'text-amber-800',
                            ins.tone === 'good' && 'text-teal-800',
                            ins.tone === 'info' && 'text-sky-800'
                          )}
                        >
                          {ins.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CFP / Business Note */}
              <div className="bg-slate-50 rounded-xl p-6 border border-surface-300">
                <h3 className="font-bold text-primary-700 text-base mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> How this works
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  GST on mutual fund brokerage is paid on a forward-charge basis by the MFD to the government at <strong>18%</strong>. AMCs invoice the MFD&rsquo;s commission GROSS of GST, and the MFD remits. Input Tax Credit (ITC) on GST-invoiced business expenses reduces net payable. Staff salaries carry no GST (employer-employee relationship is exempt), so they are excluded from ITC. Actual ITC can vary — rent on commercial premises is 18%, airline travel is 5%, etc. — the calculator uses a blended 18% assumption for simplicity. Speak to a Chartered Accountant for filing and compliance — this tool is educational.
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
            This calculator is a simplified educational tool. GST rates, ITC eligibility, and filing rules are governed by CGST/SGST Acts and may change. Consult a Chartered Accountant before filing returns.
          </p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.internal}</p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">{MFD_DISCLAIMER.general}</p>
        </div>
      </section>
    </>
  );
}
