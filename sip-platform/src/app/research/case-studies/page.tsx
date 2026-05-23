'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, User, IndianRupee, Clock, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const caseStudies = [
  {
    title: 'Fresh Graduate Starting Small',
    persona: 'Ravi, 22, Software Developer',
    salary: '₹30,000/month',
    sipAmount: '₹3,000/month',
    strategy: 'Flexi Cap Fund SIP with 15% annual step-up',
    duration: '30 years',
    result: { invested: '₹54.5L', value: '₹4.2 Cr', multiplier: '7.7x' },
    lesson: 'Starting early with even a small amount, combined with step-up, creates extraordinary wealth. Ravi invested less than ₹55 Lakhs but created ₹4.2 Crore.',
    color: 'border-l-blue-500',
  },
  {
    title: 'Salaried Professional - Retirement Planning',
    persona: 'Neha, 30, IT Manager',
    salary: '₹1,50,000/month',
    sipAmount: '₹25,000/month',
    strategy: 'Diversified portfolio: Large Cap 40%, Flexi Cap 30%, Mid Cap 20%, ELSS 10%',
    duration: '25 years (retire at 55)',
    result: { invested: '₹75L', value: '₹4.74 Cr', multiplier: '6.3x' },
    lesson: 'Systematic diversification across fund categories reduces risk while maintaining strong returns. Neha\'s ELSS SIP also saved her ₹1.5L/year in taxes.',
    color: 'border-l-emerald-500',
  },
  {
    title: 'Business Owner with Variable Income',
    persona: 'Vijay, 35, Textile Trader',
    salary: '₹2-10L/month (variable)',
    sipAmount: '₹30,000/month base + lump sum in good months',
    strategy: 'Balanced Advantage Fund for base SIP + equity for lump sum top-ups',
    duration: '20 years',
    result: { invested: '₹1.2 Cr', value: '₹4.8 Cr', multiplier: '4x' },
    lesson: 'Base SIP provides consistency, while opportunistic lump sum investments during high-income months accelerate wealth creation.',
    color: 'border-l-amber-500',
  },
  {
    title: 'Parent Planning for Child Education',
    persona: 'Priyanka, 28, with 2-year-old daughter',
    salary: '₹90,000/month',
    sipAmount: '₹15,000/month with 12% step-up',
    strategy: 'Equity SIP for first 13 years, gradual shift to debt in last 3 years',
    duration: '16 years (child age 18)',
    result: { invested: '₹72.8L', value: '₹1.86 Cr', multiplier: '2.6x' },
    lesson: 'Starting education SIP at child birth and using step-up covers even inflated education costs. Shifting to debt near goal protects the corpus.',
    color: 'border-l-purple-500',
  },
  {
    title: 'FIRE Aspirant - Early Retirement',
    persona: 'Kiran, 28, saves 60% of income',
    salary: '₹1,50,000/month',
    sipAmount: '₹90,000/month',
    strategy: 'Aggressive equity: Small Cap 30%, Mid Cap 30%, Flexi Cap 25%, International 15%',
    duration: '15 years (retire at 43)',
    result: { invested: '₹1.62 Cr', value: '₹5.25 Cr', multiplier: '3.2x' },
    lesson: 'FIRE is achievable with extreme savings discipline and aggressive equity allocation. The 60% savings rate is the key enabler.',
    color: 'border-l-red-500',
  },
  {
    title: 'Pre-Retiree - Capital Preservation',
    persona: 'Lakshmi, 55, retiring in 5 years',
    salary: '₹2,00,000/month',
    sipAmount: '₹60,000/month in hybrid + debt funds',
    strategy: '60% Balanced Advantage Fund, 40% Short Duration Debt Fund',
    duration: '5 years',
    result: { invested: '₹36L', value: '₹44.5L', multiplier: '1.24x' },
    lesson: 'Near retirement, capital preservation is more important than growth. Hybrid + debt allocation provides stable growth without equity volatility risk.',
    color: 'border-l-teal-500',
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">SIP Case Studies</h1>
          <p className="text-slate-300 max-w-2xl">Real-world scenarios showing SIP outcomes across different life stages, amounts, and strategies.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="space-y-6">
            {caseStudies.map((study, i) => (
              <div key={study.title} className={cn('card-base p-6 border-l-4', study.color)}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-primary-700 mb-3">{study.title}</h2>
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4 text-slate-400" /> {study.persona}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <IndianRupee className="w-4 h-4 text-slate-400" /> Salary: {study.salary}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <TrendingUp className="w-4 h-4 text-slate-400" /> SIP: {study.sipAmount}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" /> Duration: {study.duration}
                      </div>
                    </div>
                    <div className="bg-surface-100 rounded-lg p-3 mb-3">
                      <div className="text-xs text-slate-500 mb-1">Strategy</div>
                      <div className="text-sm text-primary-700 font-medium">{study.strategy}</div>
                    </div>
                    <div className="bg-positive-50 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600">{study.lesson}</p>
                    </div>
                  </div>
                  <div className="lg:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-brand-50 to-secondary-50 rounded-xl p-5 text-center">
                      <div className="text-xs text-slate-500 mb-1">Total Invested</div>
                      <div className="text-lg font-bold text-primary-700">{study.result.invested}</div>
                      <div className="my-2 text-slate-300">→</div>
                      <div className="text-xs text-slate-500 mb-1">Final Value</div>
                      <div className="text-xl font-bold text-positive">{study.result.value}</div>
                      <div className="mt-2 inline-flex items-center gap-1 bg-white/80 text-brand text-xs font-bold px-2.5 py-1 rounded-full">
                        {study.result.multiplier} growth
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-brand-50 rounded-lg p-5 text-center">
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Disclaimer:</strong> These case studies use illustrative data based on historical market performance.
              Actual results will vary. Returns are assumed at 12-13% CAGR for equity, 7-8% for debt, and 10% for hybrid funds. These are for educational purposes only.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
