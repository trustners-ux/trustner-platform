'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, ChevronRight, ArrowRight, TrendingUp,
  MessageCircle, BookOpen, CheckCircle2, Lightbulb,
  IndianRupee, BarChart3, Target, Info,
} from 'lucide-react';
import { calculateSIP } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

const faqs = [
  {
    question: 'How accurate is the SIP calculator?',
    answer:
      'The SIP calculator provides an estimate based on the assumed rate of return you enter. Actual mutual fund returns vary depending on market conditions, fund performance, and economic factors. The calculator uses the standard future value of annuity formula and is accurate for the inputs provided. Use it as a planning tool, not as a guarantee of returns.',
  },
  {
    question: 'What rate of return should I use in the SIP calculator?',
    answer:
      'For equity mutual fund SIPs with a 7+ year horizon, 10-12% is a reasonable assumption based on historical Nifty 50 long-term returns. For balanced/hybrid funds, use 8-10%. For debt funds, use 6-8%. For conservative estimates, always use a lower rate. Remember that actual returns can vary significantly from year to year.',
  },
  {
    question: 'Does the SIP calculator account for inflation?',
    answer:
      'This basic SIP calculator shows nominal returns (before inflation adjustment). For inflation-adjusted calculations, use our dedicated Inflation-Adjusted SIP Calculator, which shows the real purchasing power of your investment. A 12% nominal return with 6% inflation gives approximately 5.66% real return.',
  },
  {
    question: 'What is the SIP formula used in the calculator?',
    answer:
      'The SIP calculator uses the Future Value of Annuity formula: FV = P \u00d7 [((1 + r)^n - 1) / r] \u00d7 (1 + r), where P is the monthly investment amount, r is the monthly rate of return (annual rate / 12), and n is the total number of months. This formula accounts for the compounding effect of each monthly installment.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'SIP Calculator', url: '/sip-calculator' },
];

export default function SIPCalculatorPage() {
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(15);

  const result = useMemo(
    () => calculateSIP(monthlyAmount, annualReturn, years),
    [monthlyAmount, annualReturn, years]
  );

  const investedPercent = (result.totalInvested / result.totalValue) * 100;
  const returnsPercent = (result.estimatedReturns / result.totalValue) * 100;

  const faqSchema = generateFAQSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* JSON-LD Schemas via script tag for client component */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ═══════════ BREADCRUMB ═══════════ */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">SIP Calculator</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Calculator className="w-3.5 h-3.5 text-accent" />
              <span>Free Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP Calculator Online:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Calculate Your Returns
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Use our free SIP calculator to estimate how much your systematic investment
              can grow over time. Adjust the monthly amount, expected return, and duration
              to plan your financial goals.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CALCULATOR SECTION ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="card-base p-6 lg:p-8 mb-8">
              <h2 className="text-xl font-bold text-primary-700 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand" />
                SIP Return Calculator
              </h2>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  {/* Monthly Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-primary-700">Monthly SIP Amount</label>
                      <div className="bg-brand-50 rounded-lg px-3 py-1.5 text-sm font-bold text-brand">
                        {'\u20B9'}{monthlyAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={200000}
                      step={500}
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                      className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{'\u20B9'}500</span>
                      <span>{'\u20B9'}2,00,000</span>
                    </div>
                  </div>

                  {/* Expected Return */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-primary-700">Expected Annual Return</label>
                      <div className="bg-brand-50 rounded-lg px-3 py-1.5 text-sm font-bold text-brand">
                        {annualReturn}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={0.5}
                      value={annualReturn}
                      onChange={(e) => setAnnualReturn(Number(e.target.value))}
                      className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-primary-700">Investment Duration</label>
                      <div className="bg-brand-50 rounded-lg px-3 py-1.5 text-sm font-bold text-brand">
                        {years} {years === 1 ? 'Year' : 'Years'}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      step={1}
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1 Year</span>
                      <span>40 Years</span>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div>
                  <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-2xl p-6 text-white mb-4">
                    <p className="text-sm text-slate-300 mb-1">Total Value</p>
                    <p className="text-3xl font-extrabold mb-4">{formatINR(result.totalValue)}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Total Invested</p>
                        <p className="text-lg font-bold text-brand-200">{formatINR(result.totalInvested)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Estimated Returns</p>
                        <p className="text-lg font-bold text-accent">{formatINR(result.estimatedReturns)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Breakdown Bar */}
                  <div className="bg-surface-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Investment vs Returns Split</p>
                    <div className="w-full h-4 rounded-full bg-surface-200 overflow-hidden flex">
                      <div
                        className="h-full bg-brand rounded-l-full transition-all duration-500"
                        style={{ width: `${investedPercent}%` }}
                      />
                      <div
                        className="h-full bg-accent rounded-r-full transition-all duration-500"
                        style={{ width: `${returnsPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-brand font-semibold">
                        Invested {investedPercent.toFixed(0)}%
                      </span>
                      <span className="text-accent-600 font-semibold">
                        Returns {returnsPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <Link
                      href="/calculators/sip"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
                    >
                      Open Full SIP Calculator with Charts
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                How to Use the SIP Calculator
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Using our SIP calculator is simple. Adjust the three input sliders to match
                  your investment plan, and the calculator instantly shows the projected growth
                  of your SIP investment:
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    icon: IndianRupee,
                    title: 'Set Monthly Amount',
                    desc: 'Choose the amount you plan to invest each month. Start with what you can afford comfortably \u2014 even \u20B9500/month counts.',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Set Expected Return',
                    desc: 'Choose the expected annual return rate. For equity SIPs, 10-12% is reasonable for long-term planning based on historical averages.',
                  },
                  {
                    icon: Target,
                    title: 'Set Duration',
                    desc: 'Select how many years you plan to invest. Longer durations show dramatically higher returns due to the compounding effect.',
                  },
                ].map((item) => (
                  <div key={item.title} className="card-base p-5 text-center hover-lift">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Understanding Returns */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Understanding Your SIP Returns
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  The SIP calculator shows three key numbers that help you understand your
                  investment projection:
                </p>
              </div>
              <div className="space-y-4 mt-6">
                {[
                  {
                    title: 'Total Invested',
                    desc: 'This is the total amount of money you put in over the entire investment period. It is simply your monthly SIP amount multiplied by the number of months. This represents your actual out-of-pocket contribution.',
                  },
                  {
                    title: 'Estimated Returns',
                    desc: 'This is the wealth generated by your investments through compounding. In long-term SIPs (15+ years), the returns component often exceeds the invested amount, sometimes by 2-4x. This is the magic of compound interest working over time.',
                  },
                  {
                    title: 'Total Value (Corpus)',
                    desc: 'The total value is the sum of your invested amount and the returns earned. This is the estimated corpus you will have at the end of your investment period. Use this number to check if your SIP aligns with your financial goal.',
                  },
                ].map((item, index) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-700 text-sm mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Factors Affecting Returns */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Factors That Affect SIP Returns
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                While the calculator provides a projection, actual SIP returns are influenced
                by several real-world factors:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Market Conditions',
                    desc: 'Bull and bear market cycles significantly impact actual returns. Equity returns are not linear \u2014 they come in spurts with periods of flat or negative performance in between.',
                    icon: BarChart3,
                    color: 'bg-brand-50 text-brand',
                  },
                  {
                    title: 'Fund Selection',
                    desc: 'Different fund categories (large cap, mid cap, flexi cap) and individual fund performance vary significantly. A well-managed fund can outperform its benchmark while others may underperform.',
                    icon: Target,
                    color: 'bg-teal-50 text-teal-600',
                  },
                  {
                    title: 'Expense Ratio',
                    desc: 'The annual fee charged by the fund house (TER) reduces your effective returns. A difference of 0.5% in expense ratio over 20 years can impact your final corpus by 8-10%.',
                    icon: IndianRupee,
                    color: 'bg-amber-50 text-amber-600',
                  },
                  {
                    title: 'Investment Discipline',
                    desc: 'Stopping SIP during downturns, redeeming early, or frequently switching funds can dramatically reduce actual returns compared to calculator projections. Discipline is key.',
                    icon: CheckCircle2,
                    color: 'bg-secondary-50 text-secondary-600',
                  },
                ].map((item) => (
                  <div key={item.title} className="card-base p-5 hover-lift">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SIP Formula */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                SIP Calculator Formula Explained
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-6">
                <p>
                  The SIP calculator uses the <strong className="text-primary-700">Future Value of
                  Annuity</strong> formula, which calculates the future value of a series of equal
                  periodic payments compounded at a given rate of interest:
                </p>
              </div>

              <div className="card-base p-6 bg-primary-700 text-white mb-6">
                <p className="text-sm text-slate-300 mb-3">SIP Future Value Formula:</p>
                <p className="text-lg lg:text-xl font-mono font-bold text-center mb-4">
                  FV = P &times; [((1 + r)<sup>n</sup> - 1) / r] &times; (1 + r)
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-brand-200">FV</span>
                    <span className="text-slate-300">= Future Value (total corpus at maturity)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-brand-200">P</span>
                    <span className="text-slate-300">= Monthly SIP amount</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-brand-200">r</span>
                    <span className="text-slate-300">= Monthly rate of return (annual rate / 12)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-brand-200">n</span>
                    <span className="text-slate-300">= Total number of months (years &times; 12)</span>
                  </div>
                </div>
              </div>

              <div className="card-base p-5 border-l-4 border-l-brand">
                <h3 className="font-bold text-primary-700 text-sm mb-2">Worked Example</h3>
                <div className="text-sm text-slate-600 space-y-1.5">
                  <p>Monthly SIP (P) = {'\u20B9'}10,000</p>
                  <p>Annual Return = 12%, so Monthly Rate (r) = 12 / 12 / 100 = 0.01</p>
                  <p>Duration = 15 years, so Total Months (n) = 15 &times; 12 = 180</p>
                  <p className="mt-2">
                    FV = 10,000 &times; [((1.01)<sup>180</sup> - 1) / 0.01] &times; 1.01
                  </p>
                  <p>
                    FV = 10,000 &times; [4.996 / 0.01] &times; 1.01
                  </p>
                  <p>
                    FV = 10,000 &times; 499.6 &times; 1.01
                  </p>
                  <p className="font-bold text-brand text-lg mt-2">
                    FV = ~{'\u20B9'}50,46,000 ({'\u20B9'}50.46 Lakh)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Total invested: {'\u20B9'}18,00,000 | Returns earned: {'\u20B9'}32,46,000
                  </p>
                </div>
              </div>
            </div>

            {/* Tips for Better Planning */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Tips for Better SIP Planning
              </h2>
              <div className="space-y-3">
                {[
                  'Use conservative return estimates (10-11% for equity) to set realistic expectations. It is better to be pleasantly surprised than disappointed.',
                  'Consider using a Step-Up SIP that increases your investment by 10% each year to account for salary growth and maximize wealth creation.',
                  'Always calculate your goals in inflation-adjusted terms. \u20B91 crore today and \u20B91 crore in 20 years have vastly different purchasing power.',
                  'Run the calculator with different scenarios (optimistic, moderate, conservative) to understand the range of possible outcomes.',
                  'Use the calculator to reverse-engineer: start with your goal amount and work backward to find the required monthly SIP.',
                  'Review and recalculate annually. Adjust your SIP amount if actual returns deviate significantly from assumptions.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-surface-100 rounded-lg p-4">
                    <Lightbulb className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ INTERNAL LINKS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-primary-700 mb-6">Explore More Calculators</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/sip" className="card-base p-5 hover-lift group">
                <Calculator className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Full SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">Advanced version with charts and breakdown</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/step-up-sip" className="card-base p-5 hover-lift group">
                <TrendingUp className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Step-Up SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate returns with annual SIP increase</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/goal-based" className="card-base p-5 hover-lift group">
                <Target className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Goal-Based Calculator
                </h3>
                <p className="text-xs text-slate-500">Find the SIP needed for your target corpus</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-primary-700 mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-sm">Common questions about the SIP calculator</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card-base p-6">
                  <h3 className="font-bold text-primary-700 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Turn Your SIP Calculation Into Reality
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Now that you know how much your SIP can grow, take the next step.
            Start your SIP today and let compounding work for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <TrendingUp className="w-5 h-5" />
              Start SIP Now
            </a>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I used the SIP calculator and want to start investing. Please guide me.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Talk to Advisor
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <section className="bg-surface-100 py-6">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.calculator}{' '}
              {DISCLAIMER.mutual_fund} | {COMPANY.mfEntity.name} | {COMPANY.mfEntity.amfiArn}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
