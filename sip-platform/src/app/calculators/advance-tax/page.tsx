'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt, ArrowLeft, AlertTriangle, CheckCircle, Scale, Info, Calendar,
} from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

type Regime = 'old' | 'new';
type TaxpayerType = 'salaried' | 'self' | 'presumptive' | 'senior';

const DUE_DATES = [
  { label: '15 Jun 2026', pct: 15, monthsFor234C: 3 },
  { label: '15 Sep 2026', pct: 45, monthsFor234C: 3 },
  { label: '15 Dec 2026', pct: 75, monthsFor234C: 3 },
  { label: '15 Mar 2027', pct: 100, monthsFor234C: 1 },
];

// ── Tax calc helpers ──
function calcOldTax(income: number): number {
  if (income <= 250000) return 0;
  let tax = 0;
  if (income > 250000) tax += Math.min(income - 250000, 250000) * 0.05;
  if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.20;
  if (income > 1000000) tax += (income - 1000000) * 0.30;
  return tax;
}

// New regime slabs — FY 2025-26 / AY 2026-27 (Budget 2025, effective from 01-Apr-2025).
// Basic exemption raised from ₹3L → ₹4L, slabs redrawn up to ₹24L, rebate u/s 87A up to ₹12L.
function calcNewTax(income: number): number {
  if (income <= 400000) return 0;
  let tax = 0;
  if (income > 400000) tax += Math.min(income - 400000, 400000) * 0.05;   // 4–8L @ 5%
  if (income > 800000) tax += Math.min(income - 800000, 400000) * 0.10;   // 8–12L @ 10%
  if (income > 1200000) tax += Math.min(income - 1200000, 400000) * 0.15; // 12–16L @ 15%
  if (income > 1600000) tax += Math.min(income - 1600000, 400000) * 0.20; // 16–20L @ 20%
  if (income > 2000000) tax += Math.min(income - 2000000, 400000) * 0.25; // 20–24L @ 25%
  if (income > 2400000) tax += (income - 2400000) * 0.30;                 // 24L+ @ 30%
  return tax;
}

function calcSurcharge(tax: number, income: number, regime: Regime): number {
  if (income > 50000000) return regime === 'old' ? tax * 0.37 : tax * 0.25;
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000) return tax * 0.10;
  return 0;
}

function computeTotalTax(
  grossIncome: number,
  regime: Regime,
  taxpayer: TaxpayerType,
  deductions: { s80C: number; s80D: number; s80CCD1B: number; s24b: number },
): number {
  const isSalaried = taxpayer === 'salaried' || taxpayer === 'senior';
  const stdDeduction = regime === 'new' ? (isSalaried ? 75000 : 0) : (isSalaried ? 50000 : 0);
  let taxable = Math.max(0, grossIncome - stdDeduction);
  if (regime === 'old') {
    const totalDed =
      Math.min(deductions.s80C, 150000) +
      Math.min(deductions.s80D, 100000) +
      Math.min(deductions.s80CCD1B, 50000) +
      Math.min(deductions.s24b, 200000);
    taxable = Math.max(0, taxable - totalDed);
  }
  let base = regime === 'old' ? calcOldTax(taxable) : calcNewTax(taxable);
  // Rebate u/s 87A — Budget 2025: new-regime rebate extended to taxable income up to ₹12L
  // (tax liability up to ₹60,000 waived). Old regime unchanged at ₹5L / ₹12,500.
  if (regime === 'old' && taxable <= 500000) base = 0;
  if (regime === 'new' && taxable <= 1200000) base = 0;
  const surcharge = calcSurcharge(base, taxable, regime);
  const cess = (base + surcharge) * 0.04;
  return Math.round(base + surcharge + cess);
}

export default function AdvanceTaxCalculatorPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(35);
  const [regime, setRegime] = useState<Regime>('new');
  const [taxpayer, setTaxpayer] = useState<TaxpayerType>('self');
  const [grossIncome, setGrossIncome] = useState(2000000);
  const [tds, setTds] = useState(0);
  const [s80C, setS80C] = useState(150000);
  const [s80D, setS80D] = useState(25000);
  const [s80CCD1B, setS80CCD1B] = useState(0);
  const [s24b, setS24b] = useState(0);
  const [hasPaid, setHasPaid] = useState(false);
  const [paidQ1, setPaidQ1] = useState(0);
  const [paidQ2, setPaidQ2] = useState(0);
  const [paidQ3, setPaidQ3] = useState(0);
  const [paidQ4, setPaidQ4] = useState(0);

  const result = useMemo(() => {
    const deductions = { s80C, s80D, s80CCD1B, s24b };
    const totalTaxOld = computeTotalTax(grossIncome, 'old', taxpayer, deductions);
    const totalTaxNew = computeTotalTax(grossIncome, 'new', taxpayer, deductions);
    const totalTax = regime === 'old' ? totalTaxOld : totalTaxNew;
    const advanceTaxLiability = Math.max(0, totalTax - tds);

    // Senior exempt from advance tax if not self-employed
    const seniorExempt = taxpayer === 'senior';
    // Tax liability below 10,000 — no advance tax required
    const belowThreshold = totalTax <= 10000;

    const isPresumptive = taxpayer === 'presumptive';

    const paidArr = hasPaid ? [paidQ1, paidQ2, paidQ3, paidQ4] : [0, 0, 0, 0];

    let schedule: Array<{
      label: string;
      pct: number;
      cumulative: number;
      installment: number;
      paid: number;
      cumulativePaid: number;
      shortfall: number;
      interest234C: number;
      status: 'paid' | 'due' | 'overdue' | 'na';
    }> = [];

    if (isPresumptive) {
      // Only 100% by 15 March
      const paid = paidArr[3];
      const shortfall = Math.max(0, advanceTaxLiability - paid);
      const interest234C = shortfall * 0.01 * 1;
      schedule = [
        {
          label: '15 Mar 2027',
          pct: 100,
          cumulative: advanceTaxLiability,
          installment: advanceTaxLiability,
          paid,
          cumulativePaid: paid,
          shortfall,
          interest234C,
          status: paid >= advanceTaxLiability && advanceTaxLiability > 0 ? 'paid' : (paid > 0 ? 'due' : (advanceTaxLiability > 0 ? 'overdue' : 'na')),
        },
      ];
    } else if (!seniorExempt && !belowThreshold) {
      let prevCum = 0;
      let cumPaid = 0;
      schedule = DUE_DATES.map((d, idx) => {
        const cumulative = Math.round(advanceTaxLiability * d.pct / 100);
        const installment = cumulative - prevCum;
        prevCum = cumulative;
        const paid = paidArr[idx];
        cumPaid += paid;
        const shortfall = Math.max(0, cumulative - cumPaid);
        const interest234C = shortfall * 0.01 * d.monthsFor234C;
        let status: 'paid' | 'due' | 'overdue' | 'na' = 'due';
        if (cumPaid >= cumulative && cumulative > 0) status = 'paid';
        else if (paid === 0 && hasPaid) status = 'overdue';
        return {
          label: d.label,
          pct: d.pct,
          cumulative,
          installment,
          paid,
          cumulativePaid: cumPaid,
          shortfall,
          interest234C,
          status,
        };
      });
    }

    const totalInterest234C = Math.round(schedule.reduce((s, r) => s + r.interest234C, 0));
    const totalPaidSoFar = paidArr.reduce((s, v) => s + v, 0);
    // 234B: 1% per month on shortfall if <90% paid by 31 Mar (assume 3 months default until filing)
    const paidByMarch = totalPaidSoFar;
    const pct90 = advanceTaxLiability * 0.9;
    const interest234B = (paidByMarch < pct90 && advanceTaxLiability > 0)
      ? Math.round((advanceTaxLiability - paidByMarch) * 0.01 * 3)
      : 0;

    const nextDue = schedule.find(s => s.status === 'due' || s.status === 'overdue');
    const savings = Math.abs(totalTaxOld - totalTaxNew);
    const betterRegime: Regime = totalTaxNew < totalTaxOld ? 'new' : 'old';

    return {
      totalTax,
      totalTaxOld,
      totalTaxNew,
      advanceTaxLiability,
      schedule,
      totalInterest234C,
      interest234B,
      seniorExempt,
      belowThreshold,
      isPresumptive,
      savings,
      betterRegime,
      nextDue,
      totalPaidSoFar,
    };
  }, [grossIncome, regime, taxpayer, tds, s80C, s80D, s80CCD1B, s24b, hasPaid, paidQ1, paidQ2, paidQ3, paidQ4]);

  const nextDueText = result.nextDue
    ? `${formatINR(result.nextDue.installment)} by ${result.nextDue.label}`
    : 'All installments settled';
  const resultContext = `Advance tax ₹${(result.advanceTaxLiability / 100000).toFixed(2)}L, next installment ${nextDueText}`;

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Receipt className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">FY 2026-27</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Advance Tax Installment Calculator</h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                FY 2026-27 advance tax schedule with 234B/234C interest calculations for professionals &amp; business owners.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <PersonalInfoBar name={name} onNameChange={setName} age={age} onAgeChange={setAge} />
              <h2 className="font-bold text-primary-700 mb-5 text-lg">Your Inputs</h2>

              <div className="space-y-5">
                {/* Regime */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">Tax Regime</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['new', 'old'] as Regime[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegime(r)}
                        className={cn(
                          'text-xs font-semibold py-2.5 rounded-lg border transition-colors',
                          regime === r ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'
                        )}
                      >
                        {r === 'new' ? 'New Regime' : 'Old Regime'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Taxpayer type */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">Taxpayer Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'salaried', label: 'Salaried' },
                      { key: 'self', label: 'Self-employed' },
                      { key: 'presumptive', label: '44AD/ADA' },
                      { key: 'senior', label: 'Senior (60+)' },
                    ] as { key: TaxpayerType; label: string }[]).map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTaxpayer(t.key)}
                        className={cn(
                          'text-[11px] font-semibold py-2.5 rounded-lg border transition-colors',
                          taxpayer === t.key ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <NumberInput
                  label="Estimated FY Income"
                  value={grossIncome}
                  onChange={setGrossIncome}
                  prefix="₹"
                  step={50000}
                  min={100000}
                  max={100000000}
                  hint="Total estimated gross income for FY 2026-27"
                />

                <NumberInput
                  label="TDS Already Deducted"
                  value={tds}
                  onChange={setTds}
                  prefix="₹"
                  step={5000}
                  min={0}
                  max={10000000}
                  hint="Total TDS deducted at source (salary, bank, etc.)"
                />

                {regime === 'old' && (
                  <div className="space-y-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                    <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Old Regime Deductions</p>
                    <NumberInput label="Section 80C" value={s80C} onChange={setS80C} prefix="₹" step={5000} min={0} max={150000} hint="Limit: ₹1,50,000" />
                    <NumberInput label="Section 80D" value={s80D} onChange={setS80D} prefix="₹" step={5000} min={0} max={100000} hint="Medical insurance" />
                    <NumberInput label="80CCD(1B) NPS" value={s80CCD1B} onChange={setS80CCD1B} prefix="₹" step={5000} min={0} max={50000} hint="Limit: ₹50,000" />
                    <NumberInput label="Home Loan 24(b)" value={s24b} onChange={setS24b} prefix="₹" step={10000} min={0} max={500000} hint="Limit: ₹2,00,000" />
                  </div>
                )}

                {/* Payment history toggle */}
                <div className="p-4 rounded-xl bg-surface-100 border border-surface-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPaid}
                      onChange={(e) => setHasPaid(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">I&apos;ve already paid some installments</span>
                  </label>
                  {hasPaid && (
                    <div className="mt-4 space-y-3">
                      <NumberInput label="Paid by 15 Jun" value={paidQ1} onChange={setPaidQ1} prefix="₹" step={1000} min={0} max={100000000} />
                      <NumberInput label="Paid by 15 Sep" value={paidQ2} onChange={setPaidQ2} prefix="₹" step={1000} min={0} max={100000000} />
                      <NumberInput label="Paid by 15 Dec" value={paidQ3} onChange={setPaidQ3} prefix="₹" step={1000} min={0} max={100000000} />
                      <NumberInput label="Paid by 15 Mar" value={paidQ4} onChange={setPaidQ4} prefix="₹" step={1000} min={0} max={100000000} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results &mdash; FY 2026-27</h3>
                <DownloadPDFButton elementId="calculator-results" title="Advance Tax Calculator" fileName="advance-tax-calculator" />
              </div>

              {/* Hero result */}
              <div className="card-base p-6 border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50" data-pdf-keep-together>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Receipt className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Advance Tax Liability</p>
                    <h3 className="text-3xl font-extrabold text-indigo-700">{formatINR(result.advanceTaxLiability)}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Total tax: {formatINR(result.totalTax)} &minus; TDS {formatINR(tds)} = Advance tax payable for FY 2026-27.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exemption/threshold banner */}
              {result.seniorExempt && (
                <div className="card-base p-5 border-2 border-emerald-300 bg-emerald-50" data-pdf-keep-together>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-700">Senior Citizen Exemption</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Senior citizens (60+) without business/professional income are exempt from advance tax. You can pay the entire tax as self-assessment tax before filing ITR.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.belowThreshold && !result.seniorExempt && (
                <div className="card-base p-5 border-2 border-emerald-300 bg-emerald-50" data-pdf-keep-together>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-700">No Advance Tax Required</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Total tax liability is below ₹10,000 threshold. Advance tax provisions do not apply.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule table */}
              {result.schedule.length > 0 && (
                <div className="card-base overflow-hidden" data-pdf-keep-together>
                  <div className="p-5 pb-3 border-b border-surface-200">
                    <h3 className="font-bold text-primary-700">
                      {result.isPresumptive ? 'Presumptive Taxpayer — Single Installment' : 'Quarterly Installment Schedule'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {result.isPresumptive ? '100% by 15 Mar 2027' : 'Cumulative schedule: 15% / 45% / 75% / 100%'}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Due Date</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Cum %</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Cumulative</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Installment</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((row) => (
                          <tr key={row.label} className="border-b border-surface-200 hover:bg-surface-100/50">
                            <td className="py-3 px-4 font-medium text-primary-700 text-xs flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {row.label}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 text-xs">{row.pct}%</td>
                            <td className="py-3 px-4 text-right text-slate-600 text-xs">{formatINR(row.cumulative)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-indigo-700 text-xs">{formatINR(row.installment)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                                row.status === 'paid' && 'bg-emerald-100 text-emerald-700',
                                row.status === 'due' && 'bg-amber-100 text-amber-700',
                                row.status === 'overdue' && 'bg-red-100 text-red-700',
                                row.status === 'na' && 'bg-surface-200 text-slate-500',
                              )}>
                                {row.status === 'na' ? '—' : row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Interest warning */}
              {(result.totalInterest234C > 0 || result.interest234B > 0) && (
                <div className="card-base p-5 border-2 border-red-300 bg-red-50" data-pdf-keep-together>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-700">Penalty Interest Applicable</p>
                      <ul className="text-sm text-slate-700 mt-2 space-y-1">
                        {result.totalInterest234C > 0 && (
                          <li>
                            <span className="font-semibold">Interest u/s 234C:</span> {formatINR(result.totalInterest234C)} — quarterly shortfall at 1%/month.
                          </li>
                        )}
                        {result.interest234B > 0 && (
                          <li>
                            <span className="font-semibold">Interest u/s 234B:</span> {formatINR(result.interest234B)} — less than 90% paid by 31 Mar (3 months assumed).
                          </li>
                        )}
                      </ul>
                      <p className="text-xs text-slate-500 mt-2">Pay the pending installment ASAP to stop further interest accrual.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Regime comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-start gap-3 mb-4">
                  <Scale className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-primary-700">Tax Regime Comparison</h3>
                    <p className="text-xs text-slate-500">Based on your income and deductions for FY 2026-27</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn('rounded-xl p-4 border-2', result.betterRegime === 'old' ? 'border-emerald-400 bg-emerald-50' : 'border-surface-200 bg-surface-100')}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Old Regime Tax</p>
                    <p className="text-xl font-extrabold text-orange-600 mt-1">{formatINR(result.totalTaxOld)}</p>
                  </div>
                  <div className={cn('rounded-xl p-4 border-2', result.betterRegime === 'new' ? 'border-emerald-400 bg-emerald-50' : 'border-surface-200 bg-surface-100')}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">New Regime Tax</p>
                    <p className="text-xl font-extrabold text-blue-600 mt-1">{formatINR(result.totalTaxNew)}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  The <span className="font-bold text-emerald-700">{result.betterRegime === 'new' ? 'New' : 'Old'} Regime</span> saves you <span className="font-bold text-emerald-700">{formatINR(result.savings)}</span>.
                </p>
              </div>

              {/* Insights */}
              <div className="card-base p-6 bg-gradient-to-r from-brand-50 via-teal-50 to-emerald-50 border border-teal-200" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-2">Insights &amp; Recommendations</h4>
                    <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
                      <li>
                        <span className="font-semibold text-teal-700">Regime pick:</span> Switch to the <span className="font-semibold">{result.betterRegime === 'new' ? 'New' : 'Old'} Regime</span> &mdash; saves {formatINR(result.savings)} vs the other. You are currently viewing the <span className="font-semibold">{regime === 'new' ? 'New' : 'Old'}</span> regime.
                      </li>
                      {(result.totalInterest234C > 0 || result.interest234B > 0) && (
                        <li className="text-red-700">
                          <span className="font-semibold">Missed installments:</span> You are accruing interest at 1% per month. Pay the shortfall today to stop the clock.
                        </li>
                      )}
                      {age !== null && age >= 60 && taxpayer !== 'self' && taxpayer !== 'presumptive' && (
                        <li>
                          <span className="font-semibold text-emerald-700">Senior citizen note:</span> If you have no business/professional income, you are fully exempt from advance tax. Simply pay self-assessment tax before filing.
                        </li>
                      )}
                      {result.isPresumptive && (
                        <li>
                          <span className="font-semibold text-teal-700">Presumptive simplification:</span> Under 44AD/ADA, you pay 100% in a single installment by 15 Mar 2027 &mdash; no quarterly tracking needed.
                        </li>
                      )}
                      {!result.seniorExempt && !result.belowThreshold && !result.isPresumptive && result.nextDue && (
                        <li>
                          <span className="font-semibold text-indigo-700">Next installment:</span> Pay {formatINR(result.nextDue.installment)} by {result.nextDue.label} to stay compliant.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* CFP Note */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50" data-pdf-keep-together>
                <h4 className="font-bold text-primary-700 mb-2">CFP Note on Penalty Avoidance</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Advance tax is a &quot;pay-as-you-earn&quot; obligation. Missing a due date triggers 234C interest at 1% per month on the shortfall &mdash; this cannot be avoided even if you pay the full amount later. Set calendar reminders for all four dates (15 Jun / 15 Sep / 15 Dec / 15 Mar). For business income, review your estimate each quarter and top up if income has risen &mdash; a small overpayment is always cheaper than 234B/234C interest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <CalculatorLeadForm
        calculatorName="Advance Tax"
        accent="indigo"
        resultContext={resultContext}
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} Tax slabs, surcharge rates, rebates and sections 234B/234C assumptions are per FY 2026-27 provisions and are subject to change. This calculator does not consider capital gains, lottery income, partnership firm share, or foreign income. Consult a qualified Chartered Accountant for personalised advance tax planning.
          </p>
        </div>
      </section>
    </>
  );
}
