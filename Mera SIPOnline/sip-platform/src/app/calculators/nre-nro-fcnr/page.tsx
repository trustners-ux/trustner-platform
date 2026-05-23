'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  Percent,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

const COLORS = {
  nre: '#0F766E', // teal-700
  nro: '#E8553A', // accent red
  fcnr: '#4F46E5', // indigo-600
};

const INDIA_SLABS = [0, 5, 10, 15, 20, 30] as const;
const FOREIGN_SLABS = [0, 10, 15, 20, 24, 30] as const;

type IndiaSlab = (typeof INDIA_SLABS)[number];
type ForeignSlab = (typeof FOREIGN_SLABS)[number];

export default function NreNroFcnrCalculatorPage() {
  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(35);

  // Deposit
  const [depositInr, setDepositInr] = useState(5000000);
  const [tenure, setTenure] = useState(3);

  // Taxes
  const [indianSlab, setIndianSlab] = useState<IndiaSlab>(30);
  const [foreignSlab, setForeignSlab] = useState<ForeignSlab>(0);

  // Rates
  const [nreRate, setNreRate] = useState(7.0);
  const [nroRate, setNroRate] = useState(7.0);
  const [fcnrRate, setFcnrRate] = useState(5.5);
  const [inrUsd, setInrUsd] = useState(90);
  const [rupeeDep, setRupeeDep] = useState(3);

  const usdDepositDisplay = depositInr / inrUsd;

  const result = useMemo(() => {
    const years = Math.max(1, Math.round(tenure));
    const yearly: Array<{
      year: number;
      nre: number;
      nro: number;
      fcnr: number;
    }> = [];

    // Year-by-year accrual values
    for (let y = 1; y <= years; y++) {
      // NRE
      const nreCorpus = depositInr * Math.pow(1 + nreRate / 100, y);

      // NRO (tax on interest earned up to year y)
      const nroGross = depositInr * Math.pow(1 + nroRate / 100, y);
      const nroInterest = nroGross - depositInr;
      const nroTax = nroInterest * (indianSlab / 100);
      const nroNet = nroGross - nroTax;

      // FCNR — convert to USD, grow, then convert back at depreciated INR/USD
      const usdDep = depositInr / inrUsd;
      const usdCorpus = usdDep * Math.pow(1 + fcnrRate / 100, y);
      const futureInrUsd = inrUsd * Math.pow(1 + rupeeDep / 100, y);
      const inrFromFcnr = usdCorpus * futureInrUsd;
      const fcnrInterestUsd = usdCorpus - usdDep;
      const foreignTax = fcnrInterestUsd * futureInrUsd * (foreignSlab / 100);
      const fcnrNet = inrFromFcnr - foreignTax;

      yearly.push({
        year: y,
        nre: Math.round(nreCorpus),
        nro: Math.round(nroNet),
        fcnr: Math.round(fcnrNet),
      });
    }

    const last = yearly[yearly.length - 1];
    const nreFinal = last.nre;
    const nroFinal = last.nro;
    const fcnrFinal = last.fcnr;

    // Annualised return
    const cagr = (final: number) =>
      Math.pow(final / depositInr, 1 / years) - 1;

    const nreCagr = cagr(nreFinal);
    const nroCagr = cagr(nroFinal);
    const fcnrCagr = cagr(fcnrFinal);

    // Winner
    const values = [
      { key: 'nre' as const, label: 'NRE FD', final: nreFinal, cagr: nreCagr },
      { key: 'nro' as const, label: 'NRO FD', final: nroFinal, cagr: nroCagr },
      { key: 'fcnr' as const, label: 'FCNR (USD)', final: fcnrFinal, cagr: fcnrCagr },
    ];
    values.sort((a, b) => b.final - a.final);
    const winner = values[0];
    const runnerUp = values[1];
    const winnerGap = winner.final - runnerUp.final;

    // Bar chart data
    const barData = [
      { option: 'NRE FD', value: nreFinal, fill: COLORS.nre },
      { option: 'NRO FD (post-tax)', value: nroFinal, fill: COLORS.nro },
      { option: 'FCNR (USD)', value: fcnrFinal, fill: COLORS.fcnr },
    ];

    return {
      yearly,
      nreFinal,
      nroFinal,
      fcnrFinal,
      nreCagr,
      nroCagr,
      fcnrCagr,
      winner,
      runnerUp,
      winnerGap,
      barData,
      nreVsNroGap: nreFinal - nroFinal,
    };
  }, [depositInr, tenure, indianSlab, foreignSlab, nreRate, nroRate, fcnrRate, inrUsd, rupeeDep]);

  const resultContext = `Deposit ₹${(depositInr / 100000).toFixed(1)}L → NRE ₹${(
    result.nreFinal / 100000
  ).toFixed(1)}L / NRO ₹${(result.nroFinal / 100000).toFixed(1)}L / FCNR ₹${(
    result.fcnrFinal / 100000
  ).toFixed(1)}L`;

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
              <Globe className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                NRE vs NRO vs FCNR Deposit Comparator
              </h1>
              <p className="text-slate-300 mt-1 max-w-3xl">
                The 3-way NRI deposit decoder — post-tax returns, repatriation rules,
                and rupee depreciation modelled.
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
              <PersonalInfoBar
                name={name}
                onNameChange={setName}
                age={age}
                onAgeChange={setAge}
                ageLabel="Current Age (NRI)"
              />

              <h2 className="font-bold text-primary-700 mb-5 text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-indigo-600" /> Deposit & Tenure
              </h2>

              <div className="space-y-5">
                <NumberInput
                  label="Deposit Amount (INR)"
                  value={depositInr}
                  onChange={setDepositInr}
                  prefix="₹"
                  step={100000}
                  min={100000}
                  max={500000000}
                  hint={`≈ USD ${usdDepositDisplay.toLocaleString('en-US', { maximumFractionDigits: 0 })} at ₹${inrUsd}/USD`}
                />
                <NumberInput
                  label="Tenure"
                  value={tenure}
                  onChange={setTenure}
                  suffix="Years"
                  step={1}
                  min={1}
                  max={10}
                />
              </div>

              {/* Tax slabs */}
              <div className="border-t border-surface-300 mt-6 pt-5">
                <h2 className="font-bold text-primary-700 mb-3 text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" /> Indian Tax Slab (for NRO)
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {INDIA_SLABS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setIndianSlab(rate)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-semibold transition-all border',
                        indianSlab === rate
                          ? 'bg-accent text-white border-accent shadow-md'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-accent/40 hover:bg-accent/5'
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>

                <h2 className="font-bold text-primary-700 mt-5 mb-3 text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" /> Foreign Tax Slab (for FCNR)
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {FOREIGN_SLABS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setForeignSlab(rate)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-semibold transition-all border',
                        foreignSlab === rate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-indigo-300 hover:bg-indigo-50'
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                  Leave at 0% if your country offers DTAA relief / tax exemption on FCNR interest.
                </p>
              </div>

              {/* Rates */}
              <div className="border-t border-surface-300 mt-6 pt-5">
                <h2 className="font-bold text-primary-700 mb-5 text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" /> Rates
                </h2>
                <div className="space-y-5">
                  <NumberInput
                    label="NRE FD Rate"
                    value={nreRate}
                    onChange={setNreRate}
                    suffix="% p.a."
                    step={0.1}
                    min={5}
                    max={8.5}
                  />
                  <NumberInput
                    label="NRO FD Rate"
                    value={nroRate}
                    onChange={setNroRate}
                    suffix="% p.a."
                    step={0.1}
                    min={5}
                    max={8.5}
                    hint="Typically same as NRE for INR FDs"
                  />
                  <NumberInput
                    label="FCNR (USD) Rate"
                    value={fcnrRate}
                    onChange={setFcnrRate}
                    suffix="% p.a."
                    step={0.1}
                    min={2}
                    max={7}
                  />
                  <NumberInput
                    label="INR/USD Today"
                    value={inrUsd}
                    onChange={setInrUsd}
                    prefix="₹"
                    step={0.5}
                    min={70}
                    max={120}
                  />
                  <NumberInput
                    label="Expected Rupee Depreciation"
                    value={rupeeDep}
                    onChange={setRupeeDep}
                    suffix="% p.a."
                    step={0.25}
                    min={0}
                    max={8}
                    hint="Long-term INR/USD drift assumption"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 bg-teal-50 border border-teal-100 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">NRE</div>
                  <div className="text-sm font-extrabold text-teal-700">
                    {formatINR(result.nreFinal)}
                  </div>
                </div>
                <div className="rounded-xl p-3 bg-orange-50 border border-orange-100 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">NRO</div>
                  <div className="text-sm font-extrabold text-accent">
                    {formatINR(result.nroFinal)}
                  </div>
                </div>
                <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">FCNR</div>
                  <div className="text-sm font-extrabold text-indigo-600">
                    {formatINR(result.fcnrFinal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-8">
              <div className="flex justify-end">
                <DownloadPDFButton
                  elementId="calculator-results"
                  title="NRE vs NRO vs FCNR Deposit Comparator"
                  fileName="nre-nro-fcnr-comparator"
                />
              </div>

              {/* Hero result */}
              <div
                className="rounded-xl p-6 bg-gradient-to-br from-indigo-50 via-white to-teal-50 border border-indigo-100"
                data-pdf-keep-together
              >
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-500 uppercase tracking-wider">
                    Post-tax maturity value after {tenure} years
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="text-center rounded-lg p-4 bg-teal-50 border border-teal-100">
                    <div className="text-xs text-teal-700 font-semibold uppercase tracking-wider">
                      NRE FD
                    </div>
                    <div className="text-2xl font-extrabold text-teal-700 mt-1">
                      {formatINR(result.nreFinal)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      CAGR {(result.nreCagr * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-center rounded-lg p-4 bg-orange-50 border border-orange-100">
                    <div className="text-xs text-accent font-semibold uppercase tracking-wider">
                      NRO FD (post-tax)
                    </div>
                    <div className="text-2xl font-extrabold text-accent mt-1">
                      {formatINR(result.nroFinal)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      CAGR {(result.nroCagr * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-center rounded-lg p-4 bg-indigo-50 border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                      FCNR (USD)
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                      {formatINR(result.fcnrFinal)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      CAGR {(result.fcnrCagr * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg p-4 bg-white border border-surface-300 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-primary-700">
                      Winner: {result.winner.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Beats runner-up ({result.runnerUp.label}) by{' '}
                    <strong>{formatINR(result.winnerGap)}</strong>
                    {result.winner.key === 'nre' &&
                      ' — 0% tax on interest + fully repatriable in INR.'}
                    {result.winner.key === 'fcnr' &&
                      ' — rupee depreciation at this pace beats INR FD returns.'}
                    {result.winner.key === 'nro' &&
                      ' — unusual; check NRE rate assumption.'}
                  </p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Final INR Value — All 3 Options
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Post-tax maturity value at end of year {tenure}
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.barData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="option" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={90}
                      />
                      <Tooltip
                        formatter={(v: number) => [formatINR(v), 'Final Value']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {result.barData.map((e, i) => (
                          <Cell key={`bar-${i}`} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line chart year-by-year */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Accrual</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How each deposit grows year on year (NRO shown net of Indian tax; FCNR shown net of foreign tax and converted to INR at projected rate)
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.yearly} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 12, fill: '#94A3B8' }}
                        label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94A3B8' }}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={90}
                      />
                      <Tooltip
                        formatter={(v: number, n: string) => [formatINR(v), n]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="nre" name="NRE FD" stroke={COLORS.nre} strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="nro" name="NRO FD" stroke={COLORS.nro} strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="fcnr" name="FCNR (USD)" stroke={COLORS.fcnr} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="grid md:grid-cols-2 gap-4" data-pdf-keep-together>
                <div className="card-base p-5 bg-gradient-to-br from-teal-50 to-white border border-teal-100">
                  <div className="flex items-start gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-teal-700">NRE beats NRO by {formatINR(Math.abs(result.nreVsNroGap))}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    NRO interest is taxed in India at your slab rate ({indianSlab}%) plus surcharge and cess, while NRE interest is fully tax-free.
                    If your money was earned abroad, there is no reason to park it in NRO.
                  </p>
                </div>

                <div className="card-base p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                  <div className="flex items-start gap-2 mb-2">
                    <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-indigo-700">FCNR locks in USD — hedges rupee risk</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If the rupee falls faster than {rupeeDep}% p.a., FCNR becomes more attractive in INR terms.
                    If the rupee stays stable or strengthens, NRE wins because of the higher INR interest rate.
                  </p>
                </div>

                <div className="card-base p-5 bg-gradient-to-br from-orange-50 to-white border border-orange-100">
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-accent">NRO has a narrow purpose</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    NRO exists only for INR-sourced income that cannot flow into NRE — Indian rent, dividends, pension, or proceeds from Indian assets.
                    Repatriation out of NRO is capped at USD 1 million per financial year.
                  </p>
                </div>

                <div className="card-base p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                  <div className="flex items-start gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-amber-700">FEMA re-designation on return</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If your residential status changes, NRE/NRO/FCNR accounts must be re-designated under FEMA rules.
                    Consult your Relationship Manager before your move — RBI treats a 180-day India stay as a trigger.
                  </p>
                </div>
              </div>

              {/* Use-case guide */}
              <div className="card-base p-6 bg-surface-100 border border-surface-300" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" /> Which account for what?
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="rounded-lg p-4 bg-white border border-teal-100">
                    <div className="font-bold text-teal-700 mb-1">Use NRE for</div>
                    <p className="text-slate-600 leading-relaxed">
                      Foreign earnings you want to park in India tax-free, want full repatriation flexibility, and
                      are comfortable with INR-denominated returns.
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-white border border-orange-100">
                    <div className="font-bold text-accent mb-1">Use NRO for</div>
                    <p className="text-slate-600 leading-relaxed">
                      Indian rental income, dividends, pension, or any rupee income earned in India that cannot
                      flow into an NRE account.
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-white border border-indigo-100">
                    <div className="font-bold text-indigo-700 mb-1">Use FCNR for</div>
                    <p className="text-slate-600 leading-relaxed">
                      Holding USD, GBP, EUR, JPY etc. for 1–5 years, hedging rupee depreciation, and keeping
                      interest fully tax-free in India.
                    </p>
                  </div>
                </div>
              </div>

              {/* CFP Note */}
              <div className="card-base p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> CFP Note — FEMA, RBI & DTAA
                </h3>
                <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>FEMA compliance:</strong> NRE/NRO/FCNR accounts are governed by FEMA. Mis-classification
                    of residency can trigger penalties and forced re-designation.
                  </li>
                  <li>
                    <strong>RBI 180-day rule:</strong> If you spend more than 182 days in India in a financial year,
                    you may lose NRI status and must re-designate accounts to Resident / RFC as applicable.
                  </li>
                  <li>
                    <strong>DTAA on FCNR:</strong> Interest on FCNR is tax-free in India, but may be taxable in your
                    country of residence. DTAA between India and your country determines relief.
                  </li>
                  <li>
                    <strong>Repatriation limits:</strong> NRE/FCNR are fully repatriable; NRO is capped at USD 1M
                    per financial year with a CA-certified 15CA/15CB form.
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Consult your Relationship Manager and a qualified tax advisor before choosing between the three —
                  the right answer depends on residency horizon, source of funds, and currency view.
                </p>
              </div>

              {/* CTA to next calculator */}
              <div className="card-base p-4 bg-gradient-to-r from-indigo-600 to-teal-600 text-white flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold">Planning to return to India?</div>
                  <div className="text-sm text-white/80">Model your retirement corpus with our Retirement Calculator.</div>
                </div>
                <Link
                  href="/calculators/retirement"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-indigo-700 text-sm font-semibold hover:bg-surface-100 transition-colors"
                >
                  Retirement Calculator <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <CalculatorLeadForm
        calculatorName="NRE vs NRO vs FCNR"
        heading="Need help structuring your NRI deposits?"
        subtext="Share your contact — we'll help size the NRE / NRO / FCNR mix for your residency horizon, currency view, and repatriation needs. Zero obligation, AMFI-registered Mutual Fund Distributor (ARN-286886)."
        resultContext={resultContext}
        accent="indigo"
      />

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund} NRE, NRO, and FCNR deposit rates
            shown are illustrative and vary by bank and tenure. FCNR interest is tax-free in
            India but may be taxable in your country of residence; DTAA rules apply. NRO
            interest is subject to TDS at 30% plus surcharge and cess. Repatriation from NRO is
            capped at USD 1 million per financial year per RBI rules and requires Form
            15CA/15CB. FEMA and RBI residency rules change — verify current status with your
            bank and a qualified tax advisor before acting on the output above.
          </p>
        </div>
      </section>
    </>
  );
}
