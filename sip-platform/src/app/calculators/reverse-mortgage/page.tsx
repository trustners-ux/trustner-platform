'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Banknote, Calendar, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

type Scheme = 'rml' | 'rmlea';

function ltv(age: number): number {
  return age < 65 ? 0.60 : age < 70 ? 0.65 : age < 75 ? 0.70 : 0.78;
}

export default function ReverseMortgageCalculatorPage() {
  // Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(70);
  const [joint, setJoint] = useState(false);
  const [spouseAge, setSpouseAge] = useState(68);
  const [lifeExp, setLifeExp] = useState(85);

  // Property
  const [propertyValue, setPropertyValue] = useState(10_000_000);
  const [appreciation, setAppreciation] = useState(4);
  const [outstandingLoan, setOutstandingLoan] = useState(0);

  // Scheme
  const [scheme, setScheme] = useState<Scheme>('rml');
  const [interest, setInterest] = useState(9.5);
  const [payoutYears, setPayoutYears] = useState(15);
  const [annuityRate, setAnnuityRate] = useState(6);

  // Compare
  const [compareSwp, setCompareSwp] = useState(false);

  const currentAge = age ?? 70;
  const effAge = joint ? Math.min(currentAge, spouseAge) : currentAge;

  const {
    eligibleLoan,
    monthlyPayout,
    totalDisbursed,
    loanAtEnd,
    heirsInherit,
    propertyAtEnd,
    projection,
    sellSwp,
    loanExceeds80Year,
    delayedMonthly,
  } = useMemo(() => {
    const ltvPct = ltv(effAge);
    const eligible = Math.max(0, propertyValue * ltvPct - outstandingLoan);

    const horizonYears = scheme === 'rml' ? payoutYears : Math.max(1, lifeExp - effAge);

    // RML Simple: sinking-fund deposit formula
    const r = interest / 12 / 100;
    const n = payoutYears * 12;
    const rmlMonthly = r > 0 && n > 0 ? (eligible * r) / (Math.pow(1 + r, n) - 1) : eligible / Math.max(1, n);

    // RMLeA: lifetime annuity
    const rmleaMonthly = (eligible * annuityRate) / 100 / 12;

    const monthly = scheme === 'rml' ? rmlMonthly : rmleaMonthly;

    // Year-by-year projection
    const rows: {
      year: number;
      ageLabel: string;
      propertyValue: number;
      loanOutstanding: number;
      equity: number;
      cumulativeDisbursed: number;
    }[] = [];

    let loanBalance = outstandingLoan;
    let cumulative = 0;
    let exceedYear: number | null = null;

    for (let y = 1; y <= horizonYears; y++) {
      const propVal = propertyValue * Math.pow(1 + appreciation / 100, y);

      if (scheme === 'rml') {
        // Add 12 monthly disbursals, each accruing interest from month of disbursal to end of year.
        // Simpler proxy: accrue last year's balance + this year's disbursals, compounded monthly.
        for (let m = 0; m < 12; m++) {
          loanBalance = loanBalance * (1 + r) + (y <= payoutYears ? rmlMonthly : 0);
          if (y <= payoutYears) cumulative += rmlMonthly;
        }
      } else {
        // RMLeA — bank pays annuity until death; loan accrues at interest rate on principal (lump-sum to annuity provider)
        for (let m = 0; m < 12; m++) {
          loanBalance = loanBalance * (1 + r) + rmleaMonthly;
          cumulative += rmleaMonthly;
        }
      }

      const equity = Math.max(0, propVal - loanBalance);
      if (exceedYear === null && loanBalance > propVal * 0.8) exceedYear = y;

      rows.push({
        year: y,
        ageLabel: `Age ${effAge + y}`,
        propertyValue: Math.round(propVal),
        loanOutstanding: Math.round(loanBalance),
        equity: Math.round(equity),
        cumulativeDisbursed: Math.round(cumulative),
      });
    }

    const finalRow = rows[rows.length - 1];
    const propertyEnd = finalRow?.propertyValue ?? propertyValue;
    const loanEnd = finalRow?.loanOutstanding ?? 0;
    const heirs = Math.max(0, propertyEnd - loanEnd);
    const totalDis = cumulative;

    // Sell + SWP comparison
    const sellProceeds = propertyValue * 0.9;
    const r2 = 0.07 / 12;
    const nSwp = horizonYears * 12;
    const swpMonthly = r2 > 0 && nSwp > 0
      ? (sellProceeds * (r2 * Math.pow(1 + r2, nSwp))) / (Math.pow(1 + r2, nSwp) - 1)
      : sellProceeds / Math.max(1, nSwp);

    // Delayed-by-5-years monthly (for insight)
    const delayedAge = effAge + 5;
    const delayedLtv = ltv(delayedAge);
    const delayedEligible = Math.max(0, propertyValue * delayedLtv - outstandingLoan);
    const delayedMonthlyCalc = scheme === 'rml'
      ? (r > 0 && n > 0 ? (delayedEligible * r) / (Math.pow(1 + r, n) - 1) : delayedEligible / Math.max(1, n))
      : (delayedEligible * annuityRate) / 100 / 12;

    return {
      eligibleLoan: eligible,
      monthlyPayout: monthly,
      totalDisbursed: totalDis,
      loanAtEnd: loanEnd,
      heirsInherit: heirs,
      propertyAtEnd: propertyEnd,
      projection: rows,
      sellSwp: { proceeds: sellProceeds, monthly: swpMonthly },
      loanExceeds80Year: exceedYear,
      delayedMonthly: delayedMonthlyCalc,
    };
  }, [
    effAge, propertyValue, outstandingLoan, scheme, interest, payoutYears,
    annuityRate, appreciation, lifeExp,
  ]);

  const chartData = projection.map((r) => ({
    year: r.ageLabel,
    propertyValue: r.propertyValue,
    loanOutstanding: r.loanOutstanding,
  }));

  const schemeHorizonYears = scheme === 'rml' ? payoutYears : Math.max(1, lifeExp - effAge);

  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Home className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Reverse Mortgage Calculator</h1>
              <p className="text-slate-300 mt-1">Turn home equity into monthly income without selling — RML vs RMLeA</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Reverse Mortgage</h2>

              <PersonalInfoBar
                name={name}
                onNameChange={setName}
                age={age}
                onAgeChange={setAge}
                ageLabel="Current Age (60+)"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-5">
                {/* Joint toggle */}
                <div className="pt-3 border-t border-surface-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Joint with Spouse</label>
                    <button
                      role="switch"
                      aria-checked={joint}
                      onClick={() => setJoint(!joint)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        joint ? 'bg-teal-500' : 'bg-slate-300'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                        joint ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      )} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">
                    {joint ? 'Using younger spouse age for LTV tier' : 'Single borrower'}
                  </div>
                  {joint && (
                    <NumberInput label="Spouse Age" value={spouseAge} onChange={setSpouseAge} suffix="yrs" step={1} min={55} max={90} />
                  )}
                </div>

                <NumberInput label="Life Expectancy" value={lifeExp} onChange={setLifeExp} suffix="yrs" step={1} min={70} max={100} />
                <NumberInput label="Property Value Today" value={propertyValue} onChange={setPropertyValue} prefix="₹" step={500000} min={1000000} max={500000000} />
                <NumberInput label="Property Appreciation" value={appreciation} onChange={setAppreciation} suffix="% p.a." step={0.5} min={0} max={8} />
                <NumberInput label="Outstanding Home Loan" value={outstandingLoan} onChange={setOutstandingLoan} prefix="₹" step={100000} min={0} max={50000000} />

                {/* Scheme pill */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Scheme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'rml', label: 'RML (Simple)', sub: 'Fixed tenure' },
                      { key: 'rmlea', label: 'RMLeA (Annuity)', sub: 'Lifetime' },
                    ] as { key: Scheme; label: string; sub: string }[]).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setScheme(p.key)}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-left transition-colors',
                          scheme === p.key
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-white text-slate-600 border-surface-300 hover:border-teal-300'
                        )}
                      >
                        <div className="text-xs font-semibold">{p.label}</div>
                        <div className={cn('text-[10px]', scheme === p.key ? 'text-teal-50' : 'text-slate-500')}>{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {scheme === 'rml' && (
                  <>
                    <NumberInput label="Interest Rate" value={interest} onChange={setInterest} suffix="% p.a." step={0.25} min={8} max={12} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">Payout Years</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 15, 20].map((yrs) => (
                          <button
                            key={yrs}
                            onClick={() => setPayoutYears(yrs)}
                            className={cn(
                              'px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
                              payoutYears === yrs
                                ? 'bg-teal-500 text-white border-teal-500'
                                : 'bg-white text-slate-600 border-surface-300 hover:border-teal-300'
                            )}
                          >
                            {yrs} years
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {scheme === 'rmlea' && (
                  <NumberInput label="Annuity Rate" value={annuityRate} onChange={setAnnuityRate} suffix="% p.a." step={0.25} min={5} max={8} />
                )}

                {/* Compare toggle */}
                <div className="pt-3 border-t border-surface-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Compare vs Sell + SWP at 7%</label>
                    <button
                      role="switch"
                      aria-checked={compareSwp}
                      onClick={() => setCompareSwp(!compareSwp)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        compareSwp ? 'bg-amber-500' : 'bg-slate-300'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                        compareSwp ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Eligible loan callout */}
              <div className="mt-6 rounded-xl p-4 bg-teal-50 border border-teal-200/50">
                <div className="text-[10px] text-teal-700 uppercase tracking-wider font-semibold">Eligible Loan</div>
                <div className="text-lg font-extrabold text-teal-800">{formatINR(eligibleLoan)}</div>
                <div className="text-[10px] text-teal-700 mt-1">
                  {(ltv(effAge) * 100).toFixed(0)}% LTV at age {effAge} · minus outstanding loan
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Reverse Mortgage Calculator" fileName="reverse-mortgage" />
              </div>

              {/* Hero card */}
              <div className="card-base p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-white border-teal-200/50" data-pdf-keep-together>
                <div className="text-xs text-teal-700 font-semibold uppercase tracking-wider mb-2">
                  {name ? `${name}'s` : 'Your'} Reverse Mortgage Plan · {scheme === 'rml' ? 'RML' : 'RMLeA'}
                </div>
                <div className="grid sm:grid-cols-4 gap-5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Monthly Payout</div>
                    <div className="text-2xl font-extrabold text-teal-700">{formatINR(monthlyPayout)}</div>
                    <div className="text-[10px] text-slate-500 mt-1">tax-free</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Total Disbursed</div>
                    <div className="text-2xl font-extrabold text-primary-700">{formatINR(totalDisbursed)}</div>
                    <div className="text-[10px] text-slate-500 mt-1">over {schemeHorizonYears} yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Loan at End</div>
                    <div className="text-2xl font-extrabold text-amber-700">{formatINR(loanAtEnd)}</div>
                    <div className="text-[10px] text-slate-500 mt-1">with accrued interest</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Heirs Inherit</div>
                    <div className="text-2xl font-extrabold text-positive">{formatINR(heirsInherit)}</div>
                    <div className="text-[10px] text-slate-500 mt-1">property minus loan</div>
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<Banknote className="w-5 h-5" />} label="Eligible Loan" value={formatINR(eligibleLoan)} tone="teal" />
                <MetricCard icon={<Home className="w-5 h-5" />} label="Property at End" value={formatINR(propertyAtEnd)} tone="primary" />
                <MetricCard icon={<Calendar className="w-5 h-5" />} label="Horizon" value={`${schemeHorizonYears} years`} tone="indigo" />
                <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="LTV Tier" value={`${(ltv(effAge) * 100).toFixed(0)}%`} tone="amber" />
              </div>

              {/* Compare SWP card */}
              {compareSwp && (
                <div className="card-base p-6 bg-amber-50/50 border-amber-200/50" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> Sell + SWP Alternative
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If you sold the home today (net {formatINR(sellSwp.proceeds)} after 10% capital gains + sale costs) and ran a 7% SWP over the same {schemeHorizonYears} years, you&apos;d receive{' '}
                    <span className="font-bold text-amber-700">{formatINR(sellSwp.monthly)}/month</span> — but you&apos;d <span className="font-semibold">lose the home</span>.
                    Reverse Mortgage gives <span className="font-bold text-teal-700">{formatINR(monthlyPayout)}/month</span> and you keep living in your house.
                  </p>
                </div>
              )}

              {/* Chart — RML only */}
              {scheme === 'rml' && chartData.length > 0 && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Property Value vs Loan Outstanding</h3>
                  <p className="text-sm text-slate-500 mb-6">House appreciates while loan grows — the equity gap is what heirs inherit</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                        <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="propertyValue" stroke="#0F766E" strokeWidth={2.5} name="Property Value" dot={false} />
                        <Line type="monotone" dataKey="loanOutstanding" stroke="#E8553A" strokeWidth={2.5} name="Loan Outstanding" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" /> Key Insights
                </h3>
                <div className="space-y-3">
                  <Insight tone="teal">
                    You keep the home — loan is recovered from sale proceeds at death. Per NHB rules, there&apos;s <span className="font-semibold">no negative equity</span>: if the loan exceeds the property value, heirs owe nothing extra.
                  </Insight>
                  <Insight tone="indigo">
                    Delaying Reverse Mortgage by 5 years raises the monthly payout to <span className="font-semibold">{formatINR(delayedMonthly)}/month</span> (vs {formatINR(monthlyPayout)} today) — older age unlocks a higher LTV tier.
                  </Insight>
                  <Insight tone="positive">
                    RM disbursals are <span className="font-semibold">not taxable</span> (treated as a loan, not income) — unlike SWP from mutual funds where capital gains are taxed.
                  </Insight>
                  {loanExceeds80Year !== null && (
                    <Insight tone="amber">
                      In year {loanExceeds80Year} ({`Age ${effAge + loanExceeds80Year}`}), the accrued loan crosses 80% of property value — equity available to heirs starts eroding quickly from here.
                    </Insight>
                  )}
                </div>
              </div>

              {/* CFP note */}
              <div className="card-base p-6 bg-gradient-to-br from-surface-100 to-white" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-2">CFP Note — When Reverse Mortgage Fits Best</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Reverse Mortgage works best when you are <span className="font-semibold">property-rich but income-poor</span> — a senior citizen with a paid-off home but limited pension / SWP income.
                  It is most appropriate when your <span className="font-semibold">heirs are financially settled</span> (they don&apos;t need the house as their security net) and the property is worth <span className="font-semibold">over ₹75 lakh</span> so the eligible loan is meaningful.
                  If you have adequate retirement corpus and strong SWP income, or if your children depend on inheriting the house, traditional routes (SWP, SCSS, RBI Floating Bonds, annuity) are usually cleaner.
                </p>
              </div>

              {/* Lead form */}
              <CalculatorLeadForm
                calculatorName="Reverse Mortgage"
                accent="teal"
                resultContext={`Property ₹${Math.round(propertyValue / 100000)}L, RM monthly ₹${Math.round(monthlyPayout / 1000)}K for ${payoutYears}y`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}

// ── Helpers ──────────────────────────────────

function MetricCard({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: 'teal' | 'primary' | 'indigo' | 'amber' }) {
  const toneMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200/50',
    primary: 'bg-surface-100 text-primary-700 border-surface-300/50',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/50',
  };
  return (
    <div className={cn('rounded-xl p-4 border', toneMap[tone])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-[10px] uppercase tracking-wider font-semibold">{label}</div>
      </div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}

function Insight({ tone, children }: { tone: 'teal' | 'indigo' | 'positive' | 'amber'; children: React.ReactNode }) {
  const toneMap = {
    teal: 'bg-teal-50/60 border-teal-200/40 text-teal-900',
    indigo: 'bg-indigo-50/60 border-indigo-200/40 text-indigo-900',
    positive: 'bg-emerald-50/60 border-emerald-200/40 text-emerald-900',
    amber: 'bg-amber-50/60 border-amber-200/40 text-amber-900',
  };
  return (
    <div className={cn('rounded-lg px-4 py-3 border text-sm leading-relaxed', toneMap[tone])}>
      {children}
    </div>
  );
}
