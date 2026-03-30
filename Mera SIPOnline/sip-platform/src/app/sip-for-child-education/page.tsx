import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap, ChevronRight, BookOpen, Calculator, ArrowRight,
  CheckCircle2, TrendingUp, MessageCircle, Clock,
  Target, IndianRupee, AlertTriangle,
  Lightbulb, BarChart3, ArrowUpRight, Baby,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: "SIP for Child Education: Plan Your Child's Future | Mera SIP",
  description:
    "Plan your child's education with SIP. Understand rising education costs in India, calculate the required corpus with inflation, and use step-up SIP strategy to fund IIT, MBA, or abroad education.",
  path: '/sip-for-child-education',
  keywords: [
    'SIP for child education',
    'education planning SIP',
    'child education fund',
    'education corpus calculator',
    'SIP for children future',
    'education investment plan',
    'step-up SIP for education',
  ],
});

const faqs = [
  {
    question: "When should I start a SIP for my child's education?",
    answer:
      "The best time to start is as early as possible \u2014 ideally when your child is born or even before. Starting at birth gives you 17-18 years for undergraduate education, which is an excellent investment horizon for equity SIPs. Even if your child is already 5-10 years old, starting now is significantly better than starting later. The earlier you begin, the lower the monthly SIP amount needed.",
  },
  {
    question: "How much will engineering/medical education cost in 15 years?",
    answer:
      "At 8-10% education inflation, the cost of education roughly doubles every 7-8 years. An IIT education that costs approximately \u20B920-25 lakh today could cost \u20B960-75 lakh in 15 years. A private medical college currently costing \u20B91-1.5 crore could cost \u20B93-4.5 crore. Abroad education for an MS/MBA is even higher. This is why starting SIP early is critical \u2014 the numbers grow exponentially with time.",
  },
  {
    question: "Which mutual funds are best for a child's education goal?",
    answer:
      "The fund selection depends on the investment horizon. For 10+ years: equity-oriented funds like flexi-cap, large & mid-cap, or index funds for higher growth. For 5-10 years: a mix of equity and hybrid funds to balance growth and stability. For less than 5 years: shift to conservative hybrid or debt funds to protect the accumulated corpus as the education year approaches.",
  },
  {
    question: "Should I invest in child-specific mutual fund plans?",
    answer:
      "Child-specific mutual fund schemes (like children's gift plans) exist but are not necessarily better than regular diversified equity funds. They often have lock-in periods of 5 years or until the child turns 18. Regular SIPs in well-chosen diversified equity funds often offer better flexibility, lower expense ratios, and similar or better returns. Consult your advisor for a personalized recommendation.",
  },
  {
    question: "What if I cannot afford a large SIP for education planning?",
    answer:
      "Start with whatever you can afford \u2014 even \u20B91,000-\u20B92,000 per month. The key strategy is to use a step-up SIP that increases automatically by 10-15% each year as your salary grows. A \u20B92,000 SIP with 10% annual step-up for 15 years at 12% return grows to approximately \u20B917 lakh \u2014 significantly more than a flat \u20B92,000 SIP which would give about \u20B910 lakh. Every increment matters.",
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'SIP for Child Education', url: '/sip-for-child-education' },
];

export default function SIPForChildEducationPage() {
  const faqSchema = generateFAQSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
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
            <span className="text-primary-700 font-medium">SIP for Child Education</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <GraduationCap className="w-3.5 h-3.5 text-accent" />
              <span>Education Planning</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP for Child Education:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Secure Their Future
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Education costs in India are rising at 8-12% annually. A disciplined SIP strategy
              started early can build the corpus your child needs for IIT, medical school, MBA,
              or overseas education.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            {/* Rising Cost of Education */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                The Rising Cost of Education in India
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Education inflation in India consistently outpaces general inflation, running at
                  8-12% per year compared to 5-6% overall consumer inflation. This means education
                  costs roughly double every 6-8 years. What costs {'\u20B9'}10 lakh today will
                  cost {'\u20B9'}20 lakh in 7 years, {'\u20B9'}40 lakh in 14 years, and {'\u20B9'}80 lakh
                  in 21 years.
                </p>
                <p>
                  Without proper planning, most families find themselves either taking education
                  loans (with heavy interest burdens) or compromising on their child&apos;s education
                  choices. Starting a SIP early eliminates this stress and gives your child the freedom
                  to pursue their dream education.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {[
                  {
                    title: 'IIT Engineering',
                    current: '~\u20B920-25L',
                    future: '~\u20B960-75L',
                    years: '15 years later',
                    color: 'border-t-brand',
                  },
                  {
                    title: 'Private Medical (MBBS)',
                    current: '~\u20B91-1.5 Cr',
                    future: '~\u20B93-4.5 Cr',
                    years: '15 years later',
                    color: 'border-t-teal-500',
                  },
                  {
                    title: 'MBA (Top IIM)',
                    current: '~\u20B925-30L',
                    future: '~\u20B975-90L',
                    years: '18 years later',
                    color: 'border-t-amber-500',
                  },
                  {
                    title: 'MS/MBA Abroad',
                    current: '~\u20B950L-1 Cr',
                    future: '~\u20B91.5-3 Cr',
                    years: '18 years later',
                    color: 'border-t-secondary-500',
                  },
                ].map((item) => (
                  <div key={item.title} className={`card-base p-4 text-center border-t-4 ${item.color}`}>
                    <h3 className="font-bold text-primary-700 text-sm mb-2">{item.title}</h3>
                    <div className="text-sm text-slate-600 mb-1">
                      Today: <span className="font-semibold">{item.current}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-negative" />
                      <span className="text-xs text-slate-400">{item.years}</span>
                    </div>
                    <div className="text-sm font-bold text-negative">{item.future}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> These are approximate cost estimates based on current trends
                    and 8-10% education inflation. Actual costs will vary by institution, city, and course.
                    Abroad education costs also depend on currency exchange rates.
                  </p>
                </div>
              </div>
            </div>

            {/* When to Start Planning */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                When to Start Planning: Birth, Age 5, or Age 10?
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                The sooner you start, the smaller the monthly commitment needed. Here is how
                the required monthly SIP changes based on when you begin, assuming a target
                corpus of {'\u20B9'}50 lakh for a graduation at age 18:
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Start at Birth',
                    icon: Baby,
                    years: '18 years',
                    sip: '\u20B96,000/month',
                    total: '\u20B912.96 lakh invested',
                    growth: '\u20B937.04 lakh in returns',
                    verdict: 'Easiest on your wallet. Maximum compounding benefit.',
                    color: 'border-t-brand bg-brand-50/20',
                  },
                  {
                    title: 'Start at Age 5',
                    icon: GraduationCap,
                    years: '13 years',
                    sip: '\u20B910,500/month',
                    total: '\u20B916.38 lakh invested',
                    growth: '\u20B933.62 lakh in returns',
                    verdict: 'Still very manageable. Good compounding window.',
                    color: 'border-t-amber-500 bg-amber-50/20',
                  },
                  {
                    title: 'Start at Age 10',
                    icon: Clock,
                    years: '8 years',
                    sip: '\u20B921,000/month',
                    total: '\u20B920.16 lakh invested',
                    growth: '\u20B929.84 lakh in returns',
                    verdict: 'Requires significantly higher monthly commitment.',
                    color: 'border-t-secondary-500 bg-secondary-50/20',
                  },
                ].map((scenario) => (
                  <div key={scenario.title} className={`card-base p-5 border-t-4 ${scenario.color}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <scenario.icon className="w-5 h-5 text-primary-700" />
                      <h3 className="font-bold text-primary-700 text-sm">{scenario.title}</h3>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-600 mb-3">
                      <p>Horizon: <span className="font-semibold">{scenario.years}</span></p>
                      <p>Monthly SIP: <span className="font-bold text-brand">{scenario.sip}</span></p>
                      <p>Total invested: {scenario.total}</p>
                      <p>Returns earned: {scenario.growth}</p>
                    </div>
                    <p className="text-xs text-slate-500 italic">{scenario.verdict}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-500 mt-4 text-center italic">
                * Calculations assume 12% expected annual return. Actual returns may vary.
              </p>
            </div>

            {/* Calculating with Inflation */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Calculating Education Corpus with Inflation
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  The biggest mistake parents make in education planning is not accounting for
                  inflation. If you target {'\u20B9'}20 lakh today without inflation adjustment,
                  you will fall severely short when the time comes. Here is the correct approach:
                </p>
              </div>

              <div className="card-base p-6 mt-6 border-l-4 border-l-brand">
                <h3 className="font-bold text-primary-700 mb-4">3-Step Education Corpus Calculation</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-primary-700 text-sm">Identify today&apos;s cost</h4>
                      <p className="text-sm text-slate-500">Research the current total cost of the education you are planning for. Example: IIT B.Tech costs approximately {'\u20B9'}10 lakh in tuition + {'\u20B9'}10 lakh in living expenses = {'\u20B9'}20 lakh total today.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-primary-700 text-sm">Apply education inflation</h4>
                      <p className="text-sm text-slate-500">Use 8-10% education inflation rate. Formula: Future Cost = Current Cost x (1 + inflation rate)^years. For {'\u20B9'}20L at 10% inflation for 15 years: {'\u20B9'}20L x (1.10)^15 = approximately {'\u20B9'}83.5 lakh.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-primary-700 text-sm">Add a 15-20% safety buffer</h4>
                      <p className="text-sm text-slate-500">Account for unforeseen expenses, entrance coaching, accommodation costs, books, and contingencies. Target {'\u20B9'}95 lakh to {'\u20B9'}1 crore instead of just {'\u20B9'}83.5 lakh.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fund Selection */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Fund Selection for Your Child&apos;s Education Goal
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                The fund allocation should change as your child grows and the education
                goal gets closer. This time-based approach balances growth with safety:
              </p>

              <div className="space-y-4">
                {[
                  {
                    phase: '10+ Years Away',
                    allocation: 'Equity 80% | Debt 20%',
                    desc: 'Maximum growth allocation. Invest in diversified equity funds like flexi-cap, large & mid-cap, and index funds. You have ample time to ride out market cycles and benefit from long-term equity growth.',
                    funds: 'Flexi Cap, Large & Mid Cap, Nifty Next 50 Index',
                    color: 'border-l-brand',
                  },
                  {
                    phase: '5-10 Years Away',
                    allocation: 'Equity 60% | Debt 40%',
                    desc: 'Begin de-risking the portfolio. Reduce mid-cap and small-cap exposure. Shift towards large-cap equity and balanced advantage funds. Start building the debt component with corporate bond or dynamic bond funds.',
                    funds: 'Large Cap, Balanced Advantage, Corporate Bond',
                    color: 'border-l-teal-500',
                  },
                  {
                    phase: '2-5 Years Away',
                    allocation: 'Equity 30% | Debt 70%',
                    desc: 'Capital preservation becomes priority. Most of the corpus should be in conservative funds. Only keep a small equity allocation for moderate growth. Begin systematic transfer from equity to debt funds.',
                    funds: 'Conservative Hybrid, Short Duration Debt, Banking & PSU Debt',
                    color: 'border-l-amber-500',
                  },
                  {
                    phase: 'Less Than 2 Years',
                    allocation: 'Equity 0-10% | Debt 90-100%',
                    desc: 'Full capital safety mode. Move entire corpus to liquid funds, ultra-short duration, or money market funds. The goal is to protect every rupee as the education milestone is imminent. Avoid any market risk at this stage.',
                    funds: 'Liquid Fund, Ultra Short Duration, Money Market',
                    color: 'border-l-secondary-500',
                  },
                ].map((phase) => (
                  <div key={phase.phase} className={`card-base p-5 border-l-4 ${phase.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-primary-700 text-sm">{phase.phase}</h3>
                      <span className="text-xs font-semibold text-slate-500">{phase.allocation}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">{phase.desc}</p>
                    <p className="text-xs text-brand font-semibold">
                      Suggested Categories: {phase.funds}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-Up SIP Strategy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Step-Up SIP: The Power Strategy for Education Planning
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  A <strong className="text-primary-700">Step-Up SIP</strong> (also called Top-Up SIP)
                  automatically increases your monthly investment by a fixed percentage or amount each year.
                  This is particularly powerful for education planning because your salary typically grows
                  faster than general inflation, allowing you to invest more each year without reducing
                  your lifestyle.
                </p>
              </div>

              <div className="card-base p-6 mt-6">
                <h3 className="font-bold text-primary-700 mb-4">Step-Up SIP vs Regular SIP Comparison</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-surface-100 rounded-lg p-5">
                    <h4 className="font-semibold text-slate-500 text-sm mb-2">Regular (Flat) SIP</h4>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>Monthly: {'\u20B9'}10,000 (fixed)</p>
                      <p>Duration: 15 years @ 12%</p>
                      <p>Total Invested: {'\u20B9'}18,00,000</p>
                      <p className="font-bold text-primary-700 text-lg mt-2">
                        Corpus: ~{'\u20B9'}50 lakh
                      </p>
                    </div>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-5 border-2 border-brand-200">
                    <h4 className="font-semibold text-brand text-sm mb-2">Step-Up SIP (10% annual increase)</h4>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>Starting: {'\u20B9'}10,000 (grows 10%/year)</p>
                      <p>Duration: 15 years @ 12%</p>
                      <p>Total Invested: {'\u20B9'}38,17,000</p>
                      <p className="font-bold text-brand text-lg mt-2">
                        Corpus: ~{'\u20B9'}95 lakh
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4 bg-brand-50 rounded-lg p-3">
                  <strong className="text-primary-700">Impact:</strong> Step-Up SIP nearly doubles
                  the final corpus compared to a flat SIP with the same starting amount. The extra
                  investment feels manageable because it aligns with your annual salary increments.
                </p>
              </div>
            </div>

            {/* Case Study */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Case Study: Planning for IIT Education
              </h2>
              <div className="card-base p-6 bg-gradient-to-br from-brand-50/50 to-white">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-700">Scenario: Priya Plans for Her Newborn</h3>
                      <p className="text-sm text-slate-500">New mother Priya wants to build a corpus for her child&apos;s IIT education in 18 years.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">Current IIT B.Tech cost</td>
                          <td className="py-2.5 font-semibold text-primary-700">{'\u20B9'}20 lakh (tuition + living)</td>
                        </tr>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">Education inflation assumed</td>
                          <td className="py-2.5 font-semibold text-primary-700">10% per year</td>
                        </tr>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">Cost in 18 years</td>
                          <td className="py-2.5 font-semibold text-negative">{'\u20B9'}1.11 crore</td>
                        </tr>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">Target with 15% buffer</td>
                          <td className="py-2.5 font-bold text-primary-700">{'\u20B9'}1.28 crore</td>
                        </tr>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">SIP strategy</td>
                          <td className="py-2.5 font-semibold text-primary-700">Step-Up SIP with 10% annual increase</td>
                        </tr>
                        <tr className="border-b border-surface-200">
                          <td className="py-2.5 text-slate-500 pr-4">Expected return</td>
                          <td className="py-2.5 font-semibold text-primary-700">12% p.a.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-500 pr-4">Starting monthly SIP needed</td>
                          <td className="py-2.5 font-bold text-brand text-lg">{'\u20B9'}10,500/month</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-brand-50 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600">
                        <strong className="text-primary-700">Key Takeaway:</strong> By starting with just
                        {'\u20B9'}10,500/month and increasing it 10% every year, Priya can build a corpus of
                        {'\u20B9'}1.28 crore in 18 years. By year 18, her monthly SIP would be approximately
                        {'\u20B9'}49,000 &mdash; which is manageable given that her salary would have also grown
                        significantly over 18 years.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ INTERNAL LINKS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-primary-700 mb-6">Plan Your Child&apos;s Future</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/goal-based" className="card-base p-5 hover-lift group">
                <Target className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Goal-Based Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate exact SIP for your education goal</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/step-up-sip" className="card-base p-5 hover-lift group">
                <TrendingUp className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Step-Up SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">See the power of increasing SIP annually</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/inflation-adjusted" className="card-base p-5 hover-lift group">
                <BarChart3 className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Inflation-Adjusted Calculator
                </h3>
                <p className="text-xs text-slate-500">Account for education inflation in planning</p>
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
              <p className="text-slate-500 text-sm">Common questions about SIP for child&apos;s education planning</p>
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
            Give Your Child the Best Education
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Start a dedicated education SIP today. The earlier you begin, the easier it gets
            to build the corpus your child deserves for their dream education.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <TrendingUp className="w-5 h-5" />
              Start Education SIP
            </a>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I want to plan a SIP for my child\'s education. Please help me with a plan.')}`}
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
              <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.mutual_fund}{' '}
              {DISCLAIMER.general} | {COMPANY.mfEntity.name} | {COMPANY.mfEntity.amfiArn}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
