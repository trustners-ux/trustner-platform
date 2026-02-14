'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Calculator, Info, IndianRupee } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';

const TAX_SLABS_OLD = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

const TAX_SLABS_NEW = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
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

  const result = useMemo(() => {
    const stdDeduction = 75000; // Standard deduction for both regimes from FY 2024-25
    if (regime === 'new') {
      const taxableIncome = Math.max(0, income - stdDeduction);
      const tax = calculateTax(taxableIncome, TAX_SLABS_NEW);
      // Rebate u/s 87A for new regime: full rebate if taxable income <= 7 lakh
      const rebate = taxableIncome <= 700000 ? tax : 0;
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
    } else {
      const taxableIncome = Math.max(0, income - stdDeduction - totalDeductions);
      const tax = calculateTax(taxableIncome, TAX_SLABS_OLD);
      // Rebate u/s 87A for old regime: max 12,500 if taxable income <= 5 lakh
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
    }
  }, [income, regime, totalDeductions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-emerald-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Tax Calculator</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center gap-3">
            <Calculator className="w-8 h-8" /> Income Tax Calculator
          </h1>
          <p className="text-emerald-200 max-w-2xl">
            Compare your tax liability under Old vs New regime. Find which tax regime saves you more.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom max-w-5xl">
          {/* Regime Toggle */}
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setRegime('new')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                regime === 'new' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Regime
            </button>
            <button
              onClick={() => setRegime('old')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                regime === 'old' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Old Regime
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Annual Income</h2>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Under the new tax regime, most deductions (80C, 80D, HRA) are not available.
                    A standard deduction of ₹75,000 is allowed. Income up to ₹7 lakh is tax-free due to rebate u/s 87A.
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Tax Calculation ({regime === 'new' ? 'New' : 'Old'} Regime)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Gross Income</span>
                    <span className="font-semibold">{formatINR(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Deductions</span>
                    <span className="font-semibold text-green-400">- {formatINR(result.totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Taxable Income</span>
                    <span className="font-semibold">{formatINR(result.taxableIncome)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Gross Tax</span>
                      <span>{formatINR(result.grossTax)}</span>
                    </div>
                    {result.rebate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-300">Rebate u/s 87A</span>
                        <span className="text-green-300">- {formatINR(result.rebate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Health & Education Cess (4%)</span>
                      <span>{formatINR(Math.round(result.cess))}</span>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-300 font-semibold text-lg">Total Tax</span>
                      <span className="font-bold text-yellow-300 text-2xl">{formatINR(result.totalTax)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-emerald-300 text-sm">Effective Tax Rate</span>
                      <span className="text-emerald-300 text-sm">{result.effectiveRate}%</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-emerald-300 text-sm">Monthly Tax</span>
                      <span className="text-emerald-300 text-sm">{formatINR(Math.round(result.totalTax / 12))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Slabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {regime === 'new' ? 'New' : 'Old'} Regime Tax Slabs
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
                          <td className="py-2 text-gray-700">
                            {slab.max === Infinity
                              ? `Above ${formatINR(slab.min)}`
                              : `${formatINR(slab.min)} - ${formatINR(slab.max)}`}
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900">{slab.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ELSS Suggestion */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-2">Save Tax with ELSS Mutual Funds</h3>
                    <p className="text-sm text-emerald-800">
                      ELSS (Equity Linked Savings Scheme) mutual funds offer tax deduction under Section 80C
                      with the shortest lock-in period of 3 years among all 80C instruments.
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
        </div>
      </section>
    </div>
  );
}
