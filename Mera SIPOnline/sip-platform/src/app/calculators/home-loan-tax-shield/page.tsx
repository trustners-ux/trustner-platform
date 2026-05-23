'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Home, ArrowLeft, IndianRupee, TrendingDown, Scale, Info,
  ChevronDown, ChevronUp, Sparkles, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

// ─── Types ──────────────────────────────────
type PropertyUse = 'self' | 'let_out';
type SlabOld = 0 | 5 | 10 | 20 | 30;
type SlabNew = 0 | 5 | 10 | 15 | 20 | 30;

const SLAB_OPTIONS_OLD: SlabOld[] = [0, 5, 10, 20, 30];
const SLAB_OPTIONS_NEW: SlabNew[] = [0, 5, 10, 15, 20, 30];

const COLORS = {
  old: '#0F766E',
  newR: '#E8553A',
  delta: '#2563EB',
  interest: '#D97706',
  principal: '#7C3AED',
};

// ─── Helpers ────────────────────────────────
function shortINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}${formatINR(Math.round(abs))}`;
}

interface YearRow {
  year: number;
  emiPaid: number;
  interest: number;
  principal: number;
  // Old regime allowances
  section24bOld: number;     // interest actually allowed under 24(b) old
  section80EEAOld: number;   // extra interest deduction under 80EEA
  section80EEOld: number;    // extra interest deduction under 80EE
  section80COld: number;     // principal allowed under 80C
  rentalTaxableOld: number;  // net taxable rent after 30% std deduction (let-out, old)
  taxSavedOld: number;       // rupees saved (deductions × slabOld − tax on rent)
  // New regime
  section24bNew: number;
  rentalTaxableNew: number;
  taxSavedNew: number;
}

export default function HomeLoanTaxShieldCalculatorPage() {
  // ─── Personal ───
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerAge, setBorrowerAge] = useState<number | null>(null);

  // ─── Loan ───
  const [loanAmount, setLoanAmount] = useState(7500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [startYear, setStartYear] = useState(2026);

  // ─── Property ───
  const [propertyUse, setPropertyUse] = useState<PropertyUse>('self');
  const [monthlyRent, setMonthlyRent] = useState(25000);

  // ─── Tax Profile ───
  const [slabOld, setSlabOld] = useState<SlabOld>(30);
  const [slabNew, setSlabNew] = useState<SlabNew>(30);
  const [other80C, setOther80C] = useState(50000);

  // ─── Affordable Housing ───
  const [eligible80EEA, setEligible80EEA] = useState(false);
  const [eligible80EE, setEligible80EE] = useState(false);

  // ─── UI ───
  const [showTable, setShowTable] = useState(false);

  // ─── Core computation ───
  const result = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const nMonths = tenure * 12;

    const pow = Math.pow(1 + r, nMonths);
    const emi = r > 0 ? (P * r * pow) / (pow - 1) : P / nMonths;
    const totalPayment = emi * nMonths;
    const totalInterestCost = totalPayment - P;

    const yearly: YearRow[] = [];
    let balance = P;

    // Pools for 80EE / 80EEA lifetime caps — these are interest-related, lifetime deductions,
    // but we treat them as annual caps per the standard calculator convention (max per year
    // subject to the section). 80EEA = ₹1,50,000 and 80EE = ₹50,000 extra interest.
    // Rate effective for old and new regimes (percentage → decimal)
    const rateOld = slabOld / 100;
    const rateNew = slabNew / 100;

    // 80C cap available for home-loan principal = 1,50,000 − other 80C already used (floor 0)
    const available80C = Math.max(0, 150000 - Math.max(0, other80C));

    // Annual rent and 30% standard deduction for let-out
    const annualRent = propertyUse === 'let_out' ? monthlyRent * 12 : 0;
    const rentAfterStdDed = annualRent * 0.70; // 30% standard deduction u/s 24(a)

    for (let y = 1; y <= tenure; y++) {
      let yearInterest = 0;
      let yearPrincipal = 0;
      const monthsInYear = y === tenure ? nMonths - (y - 1) * 12 : 12;
      for (let m = 0; m < monthsInYear; m++) {
        const monthInterest = balance * r;
        const monthPrincipal = emi - monthInterest;
        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        balance -= monthPrincipal;
      }
      if (balance < 0) balance = 0;

      // ─── OLD REGIME ─────────────────────────
      let sec24bOld = 0;
      let sec80EEAOld = 0;
      let sec80EEOld = 0;
      let rentalTaxableOld = 0;

      if (propertyUse === 'self') {
        // Self-occupied: 24(b) capped at ₹2,00,000
        sec24bOld = Math.min(yearInterest, 200000);
        const remainingInterest = Math.max(0, yearInterest - sec24bOld);
        if (eligible80EEA) {
          sec80EEAOld = Math.min(remainingInterest, 150000);
        } else if (eligible80EE) {
          sec80EEOld = Math.min(remainingInterest, 50000);
        }
      } else {
        // Let-out: full interest deductible against rental; loss set-off capped at ₹2L
        // Gross deduction is full interest but the excess becomes carry-forward loss.
        // For the rupee-saving calculation we allow interest up to (rentAfterStdDed + 2L)
        // i.e. rental income fully sheltered + ₹2L set-off against other income.
        const maxAllowedThisYear = rentAfterStdDed + 200000;
        sec24bOld = Math.min(yearInterest, maxAllowedThisYear);
        const remainingInterest = Math.max(0, yearInterest - sec24bOld);
        if (eligible80EEA) {
          sec80EEAOld = Math.min(remainingInterest, 150000);
        } else if (eligible80EE) {
          sec80EEOld = Math.min(remainingInterest, 50000);
        }
        rentalTaxableOld = rentAfterStdDed;
      }

      // 80C on principal
      const sec80COld = Math.min(yearPrincipal, available80C);

      // Net tax saving = (deductions × rateOld) − (tax on rent × rateOld)
      // Note: For let-out we allow interest against rent (so rent is effectively already
      // sheltered when interest >= rent). To avoid double-count, we compute net taxable
      // rent as (rentAfterStdDed − portion of interest that shelters rent) but a cleaner
      // formulation is: deductible total = sec24b + ... − rentAfterStdDed (for let-out),
      // then net saving = deductibleNet × rateOld + sec80C × rateOld.
      let oldSaving = 0;
      if (propertyUse === 'self') {
        const totalDed = sec24bOld + sec80EEAOld + sec80EEOld + sec80COld;
        oldSaving = totalDed * rateOld;
      } else {
        // Let-out: interest offsets rent first; any excess (up to 2L) offsets other income.
        // Net reduction in taxable income = (sec24b − rentAfterStdDed) + sec80EEA + sec80EE + sec80C
        const netInterestBenefit = Math.max(0, sec24bOld - rentAfterStdDed);
        const unshelteredRent = Math.max(0, rentAfterStdDed - sec24bOld);
        const totalDedOffOtherIncome = netInterestBenefit + sec80EEAOld + sec80EEOld + sec80COld;
        // Rent portion not offset by interest → taxed at slabOld
        oldSaving = totalDedOffOtherIncome * rateOld - unshelteredRent * rateOld;
      }

      // ─── NEW REGIME ─────────────────────────
      let sec24bNew = 0;
      let rentalTaxableNew = 0;
      let newSaving = 0;

      if (propertyUse === 'self') {
        // Self-occupied: NO 24(b), NO 80C for principal, NO 80EE/80EEA
        sec24bNew = 0;
        newSaving = 0;
      } else {
        // Let-out: 24(b) interest allowed against rental income; cannot create loss that
        // sets off against other income (restriction under new regime). So interest is
        // effective only up to rentAfterStdDed.
        sec24bNew = Math.min(yearInterest, rentAfterStdDed);
        rentalTaxableNew = rentAfterStdDed;
        const unshelteredRentNew = Math.max(0, rentAfterStdDed - sec24bNew);
        // Deduction reduces taxable rent; saving = sec24bNew × rateNew − unsheltered rent tax
        newSaving = sec24bNew * rateNew - unshelteredRentNew * rateNew;
        // (If interest < rent, the unsheltered remainder is taxed → net could be negative.)
      }

      yearly.push({
        year: y,
        emiPaid: Math.round(emi * monthsInYear),
        interest: Math.round(yearInterest),
        principal: Math.round(yearPrincipal),
        section24bOld: Math.round(sec24bOld),
        section80EEAOld: Math.round(sec80EEAOld),
        section80EEOld: Math.round(sec80EEOld),
        section80COld: Math.round(sec80COld),
        rentalTaxableOld: Math.round(rentalTaxableOld),
        taxSavedOld: Math.round(oldSaving),
        section24bNew: Math.round(sec24bNew),
        rentalTaxableNew: Math.round(rentalTaxableNew),
        taxSavedNew: Math.round(newSaving),
      });
    }

    const totalSavedOld = yearly.reduce((a, b) => a + b.taxSavedOld, 0);
    const totalSavedNew = yearly.reduce((a, b) => a + b.taxSavedNew, 0);
    const delta = totalSavedOld - totalSavedNew;

    // Effective post-tax interest rate (very simple approximation):
    // effective_interest_cost = total_interest − total_tax_saved
    // We then back out an annualised rate that would produce that interest for the same principal/tenure.
    const effectiveInterestCostOld = Math.max(0, totalInterestCost - totalSavedOld);
    const effectiveInterestCostNew = Math.max(0, totalInterestCost - totalSavedNew);

    function solveRateForInterest(principal: number, years: number, targetInterest: number): number {
      // Bisection on annual rate in [0, 25%]
      if (targetInterest <= 0) return 0;
      let lo = 0.0001, hi = 0.30;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const rr = mid / 12;
        const nn = years * 12;
        const pw = Math.pow(1 + rr, nn);
        const e = rr > 0 ? (principal * rr * pw) / (pw - 1) : principal / nn;
        const totalI = e * nn - principal;
        if (totalI > targetInterest) hi = mid; else lo = mid;
      }
      return ((lo + hi) / 2) * 100;
    }

    const effectiveRateOld = solveRateForInterest(P, tenure, effectiveInterestCostOld);
    const effectiveRateNew = solveRateForInterest(P, tenure, effectiveInterestCostNew);

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterestCost: Math.round(totalInterestCost),
      yearly,
      totalSavedOld: Math.round(totalSavedOld),
      totalSavedNew: Math.round(totalSavedNew),
      delta: Math.round(delta),
      effectiveRateOld,
      effectiveRateNew,
      available80C,
      annualRent,
      rentAfterStdDed: Math.round(rentAfterStdDed),
    };
  }, [
    loanAmount, interestRate, tenure, propertyUse, monthlyRent,
    slabOld, slabNew, other80C, eligible80EEA, eligible80EE,
  ]);

  // ─── Chart data: cumulative saving over tenure ───
  const chartData = useMemo(() => {
    let cumOld = 0, cumNew = 0;
    return result.yearly.map((row) => {
      cumOld += row.taxSavedOld;
      cumNew += row.taxSavedNew;
      return {
        year: `Yr ${row.year}`,
        'Old Regime': Math.round(cumOld),
        'New Regime': Math.round(cumNew),
      };
    });
  }, [result.yearly]);

  // ─── Insights ───
  const insights = useMemo(() => {
    const out: { icon: 'good' | 'warn' | 'info'; text: string }[] = [];

    if (propertyUse === 'self' && slabNew > 0) {
      out.push({
        icon: 'warn',
        text: 'Under the New Regime a self-occupied home loan delivers zero tax benefit — no Section 24(b), no 80C on principal, no 80EE/80EEA. If you are banking on tax savings, Old Regime is the only path.',
      });
    }

    if (result.available80C === 0) {
      out.push({
        icon: 'info',
        text: 'Your 80C is already exhausted by other investments (EPF, ELSS, SSY, etc.). The home-loan principal gives you ZERO additional 80C benefit — do not double-count it.',
      });
    } else if (result.available80C < 150000) {
      out.push({
        icon: 'info',
        text: `Only ₹${formatINR(result.available80C)} of 80C headroom is left after your other investments. Home-loan principal above this amount does not reduce your tax.`,
      });
    }

    if (propertyUse === 'let_out') {
      out.push({
        icon: 'good',
        text: 'Rental income is taxable, but the 30% standard deduction u/s 24(a) softens the blow. In let-out scenarios the home loan remains tax-efficient in both regimes because 24(b) interest can offset rent.',
      });
    }

    if (eligible80EEA && propertyUse === 'self' && slabOld > 0) {
      out.push({
        icon: 'good',
        text: 'Section 80EEA adds an extra ₹1.5L interest deduction every year — available only under the Old Regime, and only for affordable-housing loans sanctioned in the eligible window.',
      });
    }

    if (eligible80EE && propertyUse === 'self' && slabOld > 0) {
      out.push({
        icon: 'good',
        text: 'Section 80EE adds an extra ₹50,000 interest deduction over and above 24(b). Old Regime only; first-home buyers under the FY2016-17 sanction window.',
      });
    }

    // Effective outgo line
    if (result.totalSavedOld > 0) {
      const monthlySavingOld = Math.round(result.totalSavedOld / (tenure * 12));
      out.push({
        icon: 'info',
        text: `Under Old Regime your ${formatINR(result.emi)} EMI feels like roughly ${formatINR(result.emi - monthlySavingOld)}/month after tax shield. Under New Regime there is no such cushion — the sticker EMI is the real outgo.`,
      });
    }

    if (result.delta > 100000) {
      out.push({
        icon: 'warn',
        text: `Old Regime saves ₹${shortINR(result.delta).replace('₹', '')} more than New Regime across the loan tenure. Factor this delta while choosing your regime each year.`,
      });
    }

    return out;
  }, [propertyUse, slabNew, slabOld, result, eligible80EEA, eligible80EE, tenure]);

  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Home className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Home Loan Tax Shield Calculator</h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                See exactly how much tax your home loan saves — Old Regime vs New Regime, year by year.
                Most home loan marketing overstates the tax benefit; this tool gives you the honest rupee number.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-4 text-lg">Your Home Loan</h2>

              <PersonalInfoBar
                name={borrowerName}
                onNameChange={setBorrowerName}
                age={borrowerAge}
                onAgeChange={setBorrowerAge}
                ageLabel="Your Age"
                namePlaceholder="e.g., Ram"
              />

              {/* Section 1: Loan */}
              <div className="mb-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  1. Loan Details
                </div>
                <div className="space-y-5">
                  <NumberInput
                    label="Loan Amount"
                    value={loanAmount}
                    onChange={setLoanAmount}
                    prefix="₹"
                    step={100000}
                    min={100000}
                    max={100000000}
                  />
                  <NumberInput
                    label="Interest Rate"
                    value={interestRate}
                    onChange={setInterestRate}
                    suffix="% p.a."
                    step={0.1}
                    min={6}
                    max={12}
                  />
                  <NumberInput
                    label="Tenure"
                    value={tenure}
                    onChange={setTenure}
                    suffix="Years"
                    step={1}
                    min={5}
                    max={30}
                  />
                  <NumberInput
                    label="Loan Start Year"
                    value={startYear}
                    onChange={setStartYear}
                    step={1}
                    min={2000}
                    max={2040}
                  />
                </div>
              </div>

              {/* Section 2: Property Use */}
              <div className="mb-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  2. Property Use
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(['self', 'let_out'] as PropertyUse[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPropertyUse(p)}
                      className={cn(
                        'py-2.5 text-xs font-semibold rounded-lg border transition-colors',
                        propertyUse === p
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                      )}
                    >
                      {p === 'self' ? 'Self-Occupied' : 'Let-Out'}
                    </button>
                  ))}
                </div>
                {propertyUse === 'let_out' && (
                  <NumberInput
                    label="Monthly Rental Income"
                    value={monthlyRent}
                    onChange={setMonthlyRent}
                    prefix="₹"
                    step={1000}
                    min={0}
                    max={1000000}
                  />
                )}
              </div>

              {/* Section 3: Tax Profile */}
              <div className="mb-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  3. Tax Profile
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                    Old Regime Slab
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SLAB_OPTIONS_OLD.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlabOld(s)}
                        className={cn(
                          'py-2 text-xs font-semibold rounded-lg border transition-colors',
                          slabOld === s
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-teal-300'
                        )}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                    New Regime Slab
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {SLAB_OPTIONS_NEW.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlabNew(s)}
                        className={cn(
                          'py-2 text-[11px] font-semibold rounded-lg border transition-colors',
                          slabNew === s
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-orange-300'
                        )}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>
                <NumberInput
                  label="Annual 80C used OUTSIDE home loan"
                  value={other80C}
                  onChange={setOther80C}
                  prefix="₹"
                  step={5000}
                  min={0}
                  max={150000}
                  hint="EPF + ELSS + SSY + PPF already in use"
                />
              </div>

              {/* Section 4: Affordable Housing */}
              <div className="mb-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  4. Affordable Housing Extras
                </div>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-surface-300 hover:border-amber-300 transition-colors cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={eligible80EEA}
                    onChange={(e) => {
                      setEligible80EEA(e.target.checked);
                      if (e.target.checked) setEligible80EE(false);
                    }}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Eligible for 80EEA (+₹1.5L interest)
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      Affordable housing — stamp duty value ≤ ₹45L, loan sanctioned Apr 2019 – Mar 2022
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-surface-300 hover:border-amber-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligible80EE}
                    onChange={(e) => {
                      setEligible80EE(e.target.checked);
                      if (e.target.checked) setEligible80EEA(false);
                    }}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Eligible for 80EE (+₹50,000 interest)
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      First-time buyer — property ≤ ₹50L, loan ≤ ₹35L, sanctioned FY 2016-17
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Results Column */}
            <div className="space-y-6">
              {/* Top row: PDF button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Your Tax Shield</h3>
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="Home Loan Tax Shield"
                  fileName="home-loan-tax-shield"
                />
              </div>

              {/* Hero cards */}
              <div className="grid sm:grid-cols-3 gap-4" data-pdf-keep-together>
                <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                      Old Regime — Total Saving
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold">{formatINR(result.totalSavedOld)}</div>
                  <div className="text-[11px] opacity-90 mt-1">over {tenure} years</div>
                </div>

                <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                      New Regime — Total Saving
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold">{formatINR(result.totalSavedNew)}</div>
                  <div className="text-[11px] opacity-90 mt-1">over {tenure} years</div>
                </div>

                <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                      Delta (Old − New)
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold">{formatINR(result.delta)}</div>
                  <div className="text-[11px] opacity-90 mt-1">extra saving under Old</div>
                </div>
              </div>

              {/* EMI + effective rates */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Monthly EMI
                      </span>
                    </div>
                    <div className="text-lg font-extrabold text-primary-700">
                      {formatINR(result.emi)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Total Interest Cost
                    </div>
                    <div className="text-lg font-extrabold text-red-600">
                      {formatINR(result.totalInterestCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Effective Rate (Old)
                    </div>
                    <div className="text-lg font-extrabold text-teal-700">
                      {result.effectiveRateOld.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-400">post-tax equivalent</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Effective Rate (New)
                    </div>
                    <div className="text-lg font-extrabold text-orange-700">
                      {result.effectiveRateNew.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-400">post-tax equivalent</div>
                  </div>
                </div>
              </div>

              {/* Cumulative saving line chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cumulative Tax Saving — Old vs New</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How your total tax shield grows year-by-year under each regime
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => shortINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="Old Regime"
                        stroke={COLORS.old}
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="New Regime"
                        stroke={COLORS.newR}
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    What This Means for You
                  </h3>
                  <div className="space-y-3">
                    {insights.map((ins, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex gap-3 p-3 rounded-lg border',
                          ins.icon === 'warn' && 'bg-amber-50 border-amber-200',
                          ins.icon === 'good' && 'bg-emerald-50 border-emerald-200',
                          ins.icon === 'info' && 'bg-blue-50 border-blue-200'
                        )}
                      >
                        <div className="shrink-0 mt-0.5">
                          {ins.icon === 'warn' && (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          {ins.icon === 'good' && (
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          )}
                          {ins.icon === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CFP Note */}
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-200"
                data-pdf-keep-together
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1.5">Note from your CFP</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Under the New Regime — which is the default from FY 2024-25 — self-occupied home
                      loans provide <strong>no tax benefit</strong>. Many buyers still cite
                      &quot;tax benefits&quot; as a reason to buy. This calculator shows the actual rupee
                      delta. Often under the New Regime the home loan is a pure financial liability, not
                      a tax shelter. Buy a home because you want to live in it — not for the tax break.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year-by-year table (collapsible, hidden from PDF) */}
              <div className="card-base overflow-hidden" data-pdf-hide>
                <button
                  type="button"
                  onClick={() => setShowTable((s) => !s)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-100/50 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-primary-700">Year-by-Year Breakup</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      EMI, interest, principal, deductions and tax saved each year
                    </p>
                  </div>
                  {showTable ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {showTable && (
                  <div className="overflow-x-auto border-t border-surface-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            EMI
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            Interest
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            Principal
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            24(b) Old
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            80C
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            Saved (Old)
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-wider">
                            Saved (New)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearly.map((row) => (
                          <tr
                            key={row.year}
                            className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors"
                          >
                            <td className="py-2 px-3 font-medium text-primary-700">
                              FY {startYear + row.year - 1}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              {formatINR(row.emiPaid)}
                            </td>
                            <td className="py-2 px-3 text-right text-red-500">
                              {formatINR(row.interest)}
                            </td>
                            <td className="py-2 px-3 text-right text-purple-600">
                              {formatINR(row.principal)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-700">
                              {formatINR(row.section24bOld)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-700">
                              {formatINR(row.section80COld)}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-teal-700">
                              {formatINR(row.taxSavedOld)}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-orange-700">
                              {formatINR(row.taxSavedNew)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-100 border-t-2 border-surface-300">
                          <td className="py-2.5 px-3 font-bold text-primary-700">Total</td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary-700">
                            {formatINR(result.totalPayment)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-red-600">
                            {formatINR(result.totalInterestCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                            {formatINR(loanAmount)}
                          </td>
                          <td className="py-2.5 px-3" />
                          <td className="py-2.5 px-3" />
                          <td className="py-2.5 px-3 text-right font-bold text-teal-700">
                            {formatINR(result.totalSavedOld)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-orange-700">
                            {formatINR(result.totalSavedNew)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <CalculatorLeadForm
        calculatorName="Home Loan Tax Shield"
        accent="amber"
        heading="Confused between Old Regime and New Regime for your home loan?"
        subtext="Share your details — your Relationship Manager will walk you through regime selection, 80C optimisation, and whether this home loan actually fits your financial plan."
        resultContext={`Old regime total saving ${formatINR(result.totalSavedOld)} vs New regime ${formatINR(result.totalSavedNew)} over ${tenure} years on a ${formatINR(loanAmount)} loan @ ${interestRate}%`}
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed max-w-4xl mx-auto">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund} Tax figures are illustrative and based on
            the FY 2026-27 regime structure; actual benefits depend on your full income profile,
            property value, loan sanction date and eligibility under Sections 24(b), 80C, 80EE and
            80EEA. Always consult a qualified tax advisor before making a home-purchase decision.
          </p>
        </div>
      </section>
    </>
  );
}
