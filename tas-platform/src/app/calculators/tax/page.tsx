'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Calculator, Info, IndianRupee, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

// Old Regime - Unchanged for FY 2025-26
const TAX_SLABS_OLD = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

// New Regime - Updated as per Union Budget 2025 (FY 2025-26 / AY 2026-27)
const TAX_SLABS_NEW = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 5 },
  { min: 800000, max: 1200000, rate: 10 },
  { min: 1200000, max: 1600000, rate: 15 },
  { min: 1600000, max: 2000000, rate: 20 },
  { min: 2000000, max: 2400000, rate: 25 },
  { min: 2400000, max: Infinity, rate: 30 },
];

const DEDUCTIONS = [
  { id: '80c', label: 'Section 80C (PPF, ELSS, LIC, etc.)', max: 150000 },
  { id: '80d', label: 'Section 80D (Health Insurance)', max: 100000 },
  { id: '80ccd', label: 'Section 80CCD(1B) (NPS)', max: 50000 },
  { id: 'hra', label: 'HRA Exemption', max: 500000 },
  { id: '80tta', label: 'Section 80TTA (Savings Interest)', max: 10000 },
];

function calculateTax(income: number, slabs: typeof TAX_SLABS_OLD) {
  let tax = 0;
  let remaining = income;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, slab.max - slab.min);
    tax += taxable * (slab.rate / 100);
    remaining -= taxable;
  }
  return tax;
}

export default function TaxCalculatorPage() {
  const [income, setIncome] = useState(1200000);
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [deductions, setDeductions] = useState<Record<string, number>>({
    '80c': 150000,
    '80d': 25000,
    '80ccd': 50000,
    'hra': 0,
    '80tta': 10000,
  });

  const totalDeductions = useMemo(() =>
    Object.values(deductions).reduce((sum, val) => sum + val, 0),
    [deductions]
  );

  const resultNew = useMemo(() => {
    const stdDeduction = 75000; // Standard deduction for salaried individuals
    const taxableIncome = Math.max(0, income - stdDeduction);
    const tax = calculateTax(taxableIncome, TAX_SLABS_NEW);
    // Rebate u/s 87A for new regime FY 2025-26: up to ₹60,000 rebate if taxable income <= ₹12 lakh
    const rebate = taxableIncome <= 1200000 ? Math.min(tax, 60000) : 0;
    const taxAfterRebate = tax - rebate;
    const cess = taxAfterRebate * 0.04;
    return {
      taxableIncome,
      totalDeductions: stdDeduction,
      grossTax: tax,
      rebate,
      cess,
      totalTax: Math.round(taxAfterRebate + cess),
      effectiveRate: income > 0 ? ((taxAfterRebate + cess) / income * 100).toFixed(1) : '0',
    };
  }, [income]);

  const resultOld = useMemo(() => {
    const stdDeduction = 75000; // Standard deduction (updated from FY 2024-25)
    const taxableIncome = Math.max(0, income - stdDeduction - totalDeductions);
    const tax = calculateTax(taxableIncome, TAX_SLABS_OLD);
    // Rebate u/s 87A for old regime: max ₹12,500 if taxable income <= ₹5 lakh
    const rebate = taxableIncome <= 500000 ? Math.min(tax, 12500) : 0;
    const taxAfterRebate = tax - rebate;
    const cess = taxAfterRebate * 0.04;
    return {
      taxableIncome,
      totalDeductions: stdDeduction + totalDeductions,
      grossTax: tax,
      rebate,
      cess,
      totalTax: Math.round(taxAfterRebate + cess),
      effectiveRate: income > 0 ? ((taxAfterRebate + cess) / income * 100).toFixed(1) : '0',
    };
  }, [income, totalDeductions]);

  const result = regime === 'new' ? resultNew : resultOld;
  const savings = resultOld.totalTax - resultNew.totalTax;
  const betterRegime = savings > 0 ? 'new' : savings < 0 ? 'old' : 'same';

  return (
    <div className="min-h-screen bg-surface-100">
      <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-sm">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white transition">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Tax Calculator</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold">Income Tax Calculator</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Updated for FY 2025-26 (AY 2026-27) as per Union Budget 2025. Compare Old vs New regime and find which saves you more.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Updated for Budget 2025 — Income up to ₹12.75 Lakh = NIL Tax (New Regime)
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom max-w-5xl">
          {/* Regime Toggle */}
          <div className="flex bg-white rounded-xl shadow-card border border-gray-100 p-1 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setRegime('new')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                regime === 'new' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Regime (FY 25-26)
            </button>
            <button
              onClick={() => setRegime('old')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                regime === 'old' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Old Regime
            </button>
          </div>

          {/* Regime Comparison Banner */}
          {income > 0 && (
            <div className={`mb-8 rounded-2xl border p-4 flex items-center gap-3 ${
              betterRegime === 'new'
                ? 'bg-emerald-50 border-emerald-200'
                : betterRegime === 'old'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                betterRegime === 'new' ? 'text-emerald-600' : betterRegime === 'old' ? 'text-amber-600' : 'text-gray-500'
              }`} />
              <p className="text-sm font-medium text-gray-800">
                {betterRegime === 'new' && (
                  <>The <strong>New Regime</strong> saves you <strong className="text-emerald-600">{formatINR(savings)}</strong> compared to Old Regime for your income of {formatINR(income)}.</>
                )}
                {betterRegime === 'old' && (
                  <>The <strong>Old Regime</strong> saves you <strong className="text-amber-600">{formatINR(Math.abs(savings))}</strong> compared to New Regime for your income of {formatINR(income)}.</>
                )}
                {betterRegime === 'same' && (
                  <>Both regimes result in the same tax for your income of {formatINR(income)}.</>
                )}
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Annual Income (Gross Salary)</h2>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <IndianRupee className="w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
                    className="flex-1 bg-transparent text-2xl font-bold text-gray-900 focus:outline-none ml-2"
                    placeholder="Enter annual income"
                  />
                </div>
                <input
                  type="range" min={0} max={50000000} step={50000} value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-4"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹0</span><span>₹5 Cr</span>
                </div>
              </div>

              {regime === 'old' && (
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Deductions (Old Regime Only)</h2>
                  <div className="space-y-4">
                    {DEDUCTIONS.map((ded) => (
                      <div key={ded.id}>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm text-gray-700">{ded.label}</label>
                          <span className="text-xs text-gray-400">Max: {formatINR(ded.max)}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <IndianRupee className="w-3 h-3 text-gray-400" />
                          <input
                            type="number"
                            value={deductions[ded.id] || 0}
                            onChange={(e) => setDeductions(prev => ({
                              ...prev,
                              [ded.id]: Math.min(ded.max, Math.max(0, Number(e.target.value)))
                            }))}
                            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none ml-2"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t flex justify-between">
                      <span className="font-semibold text-gray-900">Total Deductions</span>
                      <span className="font-bold text-emerald-600">{formatINR(totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {regime === 'new' && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-emerald-900 mb-1.5 text-sm">New Regime — Budget 2025 Updates</h3>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• Basic exemption raised to <strong>₹4 Lakh</strong> (from ₹3 Lakh)</li>
                        <li>• Rebate u/s 87A increased to <strong>₹60,000</strong> — income up to ₹12 Lakh = <strong>NIL tax</strong></li>
                        <li>• Salaried individuals: income up to <strong>₹12.75 Lakh = NIL tax</strong> (₹75K std. deduction)</li>
                        <li>• Most deductions (80C, 80D, HRA) are <strong>not available</strong></li>
                        <li>• Only standard deduction of ₹75,000 + NPS 80CCD(2) allowed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {regime === 'old' && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1.5 text-sm">Old Regime — No Changes in Budget 2025</h3>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Tax slabs remain unchanged</li>
                        <li>• All deductions (80C, 80D, HRA, etc.) available</li>
                        <li>• Standard deduction: ₹75,000</li>
                        <li>• Rebate u/s 87A: up to ₹12,500 if taxable income ≤ ₹5 Lakh</li>
                        <li>• Beneficial if you have high deductions (₹3L+)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] rounded-2xl p-6 text-white shadow-card">
                <h3 className="text-lg font-semibold mb-4">Tax Calculation — {regime === 'new' ? 'New' : 'Old'} Regime (FY 2025-26)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gross Income</span>
                    <span className="font-semibold">{formatINR(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Standard Deduction</span>
                    <span className="font-semibold text-green-400">- ₹75,000</span>
                  </div>
                  {regime === 'old' && totalDeductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">80C/80D/HRA Deductions</span>
                      <span className="font-semibold text-green-400">- {formatINR(totalDeductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Net Taxable Income</span>
                    <span className="font-semibold">{formatINR(result.taxableIncome)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax on Above</span>
                      <span>{formatINR(result.grossTax)}</span>
                    </div>
                    {result.rebate > 0 && (
                      <div className="flex justify-between mt-1">
                        <span className="text-green-400">Rebate u/s 87A</span>
                        <span className="text-green-400">- {formatINR(result.rebate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400">Health & Education Cess (4%)</span>
                      <span>{formatINR(Math.round(result.cess))}</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-300 font-semibold text-lg">Total Tax Payable</span>
                      <span className="font-bold text-yellow-300 text-2xl">{formatINR(result.totalTax)}</span>
                    </div>
                    {result.totalTax === 0 && income > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">Zero Tax! 🎉</span>
                      </div>
                    )}
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-400 text-sm">Effective Tax Rate</span>
                      <span className="text-gray-300 text-sm">{result.effectiveRate}%</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400 text-sm">Monthly Tax (TDS)</span>
                      <span className="text-gray-300 text-sm">{formatINR(Math.round(result.totalTax / 12))}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400 text-sm">Take-Home (Monthly)</span>
                      <span className="text-white font-semibold text-sm">{formatINR(Math.round((income - result.totalTax) / 12))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Comparison */}
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Comparison — Old vs New</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-xl p-4 text-center border-2 ${regime === 'new' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">New Regime</p>
                    <p className={`text-xl font-bold ${resultNew.totalTax === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {resultNew.totalTax === 0 ? 'NIL' : formatINR(resultNew.totalTax)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{resultNew.effectiveRate}% effective</p>
                  </div>
                  <div className={`rounded-xl p-4 text-center border-2 ${regime === 'old' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Old Regime</p>
                    <p className={`text-xl font-bold ${resultOld.totalTax === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {resultOld.totalTax === 0 ? 'NIL' : formatINR(resultOld.totalTax)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{resultOld.effectiveRate}% effective</p>
                  </div>
                </div>
                {savings !== 0 && (
                  <p className="text-center text-sm font-medium mt-3 text-gray-600">
                    You save <strong className="text-emerald-600">{formatINR(Math.abs(savings))}</strong> with the {betterRegime === 'new' ? 'New' : 'Old'} Regime
                  </p>
                )}
              </div>

              {/* Tax Slabs */}
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {regime === 'new' ? 'New' : 'Old'} Regime Tax Slabs — FY 2025-26
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Income Range</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(regime === 'new' ? TAX_SLABS_NEW : TAX_SLABS_OLD).map((slab, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2.5 text-gray-700">
                            {slab.max === Infinity
                              ? `Above ${formatINR(slab.min)}`
                              : `${formatINR(slab.min)} – ${formatINR(slab.max)}`}
                          </td>
                          <td className={`py-2.5 text-right font-semibold ${slab.rate === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {slab.rate === 0 ? 'NIL' : `${slab.rate}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {regime === 'new' && (
                  <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                    * Rebate u/s 87A: If taxable income ≤ ₹12,00,000 → full tax rebate up to ₹60,000. Salaried individuals with income up to ₹12,75,000 effectively pay zero tax after standard deduction.
                  </p>
                )}
              </div>

              {/* ELSS Suggestion */}
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-2">Save Tax with ELSS Mutual Funds</h3>
                    <p className="text-sm text-emerald-800">
                      Using the Old Regime? ELSS (Equity Linked Savings Scheme) mutual funds offer tax deduction under Section 80C
                      with the shortest lock-in period of just 3 years. Invest up to ₹1.5 Lakh and save up to ₹46,800 in taxes.
                    </p>
                    <Link
                      href="/mutual-funds"
                      className="inline-block mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Explore ELSS Funds →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-700">Disclaimer:</strong> This calculator provides approximate tax estimates based on the
                tax slabs announced in Union Budget 2025 for FY 2025-26 (AY 2026-27). Actual tax liability may vary based on surcharge
                (for income above ₹50 Lakh), additional deductions, capital gains, and other income sources. This tool is for informational
                purposes only and does not constitute tax advice. Please consult a qualified Chartered Accountant for accurate tax planning.
              </div>
            </div>
          </div>
        </div>
      </section>
      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
