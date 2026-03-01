'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  RefreshCw,
  Shield,
  Heart,
  TrendingUp,
  Landmark,
  Target,
  Receipt,
  PieChart,
  ListChecks,
  AlertTriangle,
  FileText,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Mail,
  Loader2,
  Check,
} from 'lucide-react';
import { useFinancialPlanStore } from '@/store/financial-plan-store';
import { useAuth } from '@/hooks/useAuth';
import { downloadReport, generateReport, emailReport } from '@/lib/api/plans';
import {
  formatINR,
  formatLakhsCrores,
  formatTenure,
} from '@/lib/utils/formatters';
import type { FinancialPlan, ActionItem } from '@/types/financial-plan';

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Critical';
}

function priorityBadge(priority: ActionItem['priority']) {
  const map: Record<ActionItem['priority'], { bg: string; text: string }> = {
    urgent: { bg: 'bg-red-100 text-red-800', text: 'Urgent' },
    high: { bg: 'bg-orange-100 text-orange-800', text: 'High' },
    medium: { bg: 'bg-amber-100 text-amber-800', text: 'Medium' },
    low: { bg: 'bg-blue-100 text-blue-800', text: 'Low' },
  };
  return map[priority];
}

function categoryBadge(category: ActionItem['category']) {
  const map: Record<ActionItem['category'], { bg: string; label: string }> = {
    'emergency-fund': { bg: 'bg-cyan-100 text-cyan-800', label: 'Emergency Fund' },
    insurance: { bg: 'bg-purple-100 text-purple-800', label: 'Insurance' },
    investment: { bg: 'bg-emerald-100 text-emerald-800', label: 'Investment' },
    debt: { bg: 'bg-red-100 text-red-800', label: 'Debt' },
    tax: { bg: 'bg-indigo-100 text-indigo-800', label: 'Tax' },
    retirement: { bg: 'bg-amber-100 text-amber-800', label: 'Retirement' },
    goal: { bg: 'bg-teal-100 text-teal-800', label: 'Goal' },
  };
  return map[category];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function assetCategoryLabel(cat: string) {
  const map: Record<string, string> = {
    cash: 'Cash & Bank',
    equity: 'Equity',
    debt: 'Debt / Fixed Income',
    'real-estate': 'Real Estate',
    gold: 'Gold',
    ppf: 'PPF',
    nps: 'NPS',
    epf: 'EPF',
    other: 'Other',
  };
  return map[cat] || cat;
}

function liabilityTypeLabel(t: string) {
  const map: Record<string, string> = {
    'home-loan': 'Home Loan',
    'car-loan': 'Car Loan',
    'personal-loan': 'Personal Loan',
    'education-loan': 'Education Loan',
    'credit-card': 'Credit Card',
    'gold-loan': 'Gold Loan',
    other: 'Other',
  };
  return map[t] || t;
}

// ─── Section Components ─────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center print:bg-slate-700">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-500 ml-11">{subtitle}</p>}
    </div>
  );
}

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-32 h-32' : 'w-20 h-20';
  const textSize = size === 'lg' ? 'text-4xl' : 'text-xl';
  const labelSize = size === 'lg' ? 'text-sm' : 'text-[10px]';
  return (
    <div
      className={`${dim} rounded-full border-4 ${
        score >= 80
          ? 'border-emerald-500'
          : score >= 60
          ? 'border-amber-500'
          : 'border-red-500'
      } flex flex-col items-center justify-center`}
    >
      <span className={`${textSize} font-bold ${scoreColor(score)}`}>{score}</span>
      <span className={`${labelSize} text-slate-500`}>{scoreLabel(score)}</span>
    </div>
  );
}

function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || scoreBarColor(value);
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main Report ────────────────────────────────────────────────────────────

export default function ReportContent() {
  const { plan, isComplete, planDbId } = useFinancialPlanStore();
  const { isAuthenticated } = useAuth();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');

  const handleDownload = useCallback(async () => {
    if (!planDbId || !isAuthenticated) return;
    setIsDownloading(true);
    try {
      await generateReport(planDbId);
      const blob = await downloadReport(planDbId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Trustner-Financial-Plan.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [planDbId, isAuthenticated]);

  const handleEmail = useCallback(async () => {
    if (!planDbId || !isAuthenticated || !emailAddr) return;
    setIsEmailing(true);
    try {
      await emailReport(planDbId, emailAddr);
      setEmailDone(true);
      setShowEmailInput(false);
      setTimeout(() => setEmailDone(false), 5000);
    } catch (err) {
      console.error('Email error:', err);
    } finally {
      setIsEmailing(false);
    }
  }, [planDbId, isAuthenticated, emailAddr]);

  // Guard: no plan
  if (
    !isComplete ||
    !plan.personal ||
    !plan.income ||
    !plan.expenses ||
    !plan.netWorth ||
    !plan.insurance ||
    !plan.goals ||
    !plan.tax ||
    !plan.riskProfile ||
    !plan.analysis
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">No Financial Plan Found</h1>
          <p className="text-slate-600">
            No financial plan found. Create your plan first.
          </p>
          <Link
            href="/ai-planner"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            <Target className="w-5 h-5" />
            Create Your Financial Plan
          </Link>
        </div>
      </div>
    );
  }

  const p = plan as FinancialPlan;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* ── Print Controls ───────────────────────────────────────────── */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="relative max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ai-planner"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update Plan
            </Link>
            {isAuthenticated && planDbId && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : downloadDone ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloading ? 'Generating...' : downloadDone ? 'Done!' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {emailDone ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {emailDone ? 'Sent!' : 'Email'}
                </button>
              </>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
          {/* Email Input Dropdown */}
          {showEmailInput && (
            <div className="absolute right-6 top-full mt-1 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <input
                type="email"
                value={emailAddr}
                onChange={(e) => setEmailAddr(e.target.value)}
                placeholder="your@email.com"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={handleEmail}
                disabled={isEmailing || !emailAddr}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isEmailing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Report Body ──────────────────────────────────────────────── */}
      <div className="max-w-[900px] mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none space-y-0">
        {/* ════════════════ COVER PAGE ════════════════ */}
        <section className="print:min-h-[100vh] print:flex print:flex-col print:justify-center py-16 print:py-0">
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Your Financial Plan
              </h1>
              <p className="text-lg text-slate-500">
                A comprehensive analysis and actionable roadmap
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-semibold text-slate-800">
                {p.personal.name}
              </p>
              <p className="text-slate-500">
                Prepared on {formatDate(p.updatedAt || p.createdAt)}
              </p>
            </div>

            <div className="pt-8 border-t border-slate-200 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-slate-700">
                Trustner Asset Services
              </p>
              <p className="text-xs text-slate-400 mt-1">
                WealthyHub.in &nbsp;|&nbsp; ARN-286886 &nbsp;|&nbsp; IRDAI License 1067
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════ EXECUTIVE SUMMARY ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10 first:pt-0">
          <SectionHeader
            icon={Activity}
            title="Executive Summary"
            subtitle="Overall financial health at a glance"
          />

          {/* Overall Score */}
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
            <ScoreRing score={p.analysis.overallScore} />
            <div className="space-y-3 flex-1">
              <h3 className="text-lg font-semibold text-slate-800">
                Financial Health Score
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {p.analysis.overallScore >= 80
                  ? 'Your finances are in excellent shape. Continue your disciplined approach and fine-tune for optimization.'
                  : p.analysis.overallScore >= 60
                  ? 'Your financial health is good with some areas for improvement. Focus on the action items below.'
                  : 'Your financial health needs attention. Prioritize the urgent action items to strengthen your foundation.'}
              </p>
            </div>
          </div>

          {/* Sub-Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Emergency Fund', score: p.analysis.emergencyFundScore, icon: Shield },
              { label: 'Insurance', score: p.analysis.insuranceScore, icon: Heart },
              { label: 'Investments', score: p.analysis.investmentScore, icon: TrendingUp },
              { label: 'Debt', score: p.analysis.debtScore, icon: Landmark },
              { label: 'Retirement', score: p.analysis.retirementScore, icon: Clock },
              { label: 'Tax Efficiency', score: p.analysis.taxEfficiencyScore, icon: Receipt },
            ].map((item) => (
              <div
                key={item.label}
                className={`border rounded-xl p-4 ${scoreBg(item.score)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
                <div className={`text-2xl font-bold ${scoreColor(item.score)}`}>
                  {item.score}
                </div>
                <ProgressBar value={item.score} />
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Net Worth',
                value: formatLakhsCrores(p.netWorth.netWorth),
              },
              {
                label: 'Monthly Surplus',
                value: formatINR(p.expenses.monthlySurplus),
              },
              {
                label: 'Savings Rate',
                value: `${p.expenses.savingsRate.toFixed(1)}%`,
              },
              {
                label: 'Debt-to-Income',
                value: `${(p.analysis.debtToIncomeRatio * 100).toFixed(1)}%`,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center print:border-slate-300"
              >
                <p className="text-xs font-medium text-slate-500 mb-1">{m.label}</p>
                <p className="text-lg font-bold text-slate-900">{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ NET WORTH STATEMENT ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={DollarSign}
            title="Net Worth Statement"
            subtitle="Your assets and liabilities breakdown"
          />

          {/* Assets */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Assets
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600">Name</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600">Category</th>
                    <th className="text-right py-2 pr-4 font-semibold text-slate-600">Value</th>
                    <th className="text-center py-2 font-semibold text-slate-600">Liquidity</th>
                  </tr>
                </thead>
                <tbody>
                  {p.netWorth.assets.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-800">{a.name}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {assetCategoryLabel(a.category)}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium text-slate-900">
                        {formatLakhsCrores(a.currentValue)}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            a.isLiquid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {a.isLiquid ? 'Liquid' : 'Illiquid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300">
                    <td colSpan={2} className="py-2 pr-4 font-bold text-slate-900">
                      Total Assets
                    </td>
                    <td className="py-2 pr-4 text-right font-bold text-slate-900">
                      {formatLakhsCrores(p.netWorth.totalAssets)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Liabilities */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Liabilities
            </h3>
            {p.netWorth.liabilities.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No liabilities recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 pr-4 font-semibold text-slate-600">Name</th>
                      <th className="text-left py-2 pr-4 font-semibold text-slate-600">Type</th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">
                        Outstanding
                      </th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">EMI</th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">Rate</th>
                      <th className="text-right py-2 font-semibold text-slate-600">Tenure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.netWorth.liabilities.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 text-slate-800">{l.name}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {liabilityTypeLabel(l.type)}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-slate-900">
                          {formatLakhsCrores(l.outstandingAmount)}
                        </td>
                        <td className="py-2 pr-4 text-right text-slate-700">
                          {formatINR(l.emi)}
                        </td>
                        <td className="py-2 pr-4 text-right text-slate-700">
                          {l.interestRate.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right text-slate-700">
                          {formatTenure(l.remainingTenureMonths)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300">
                      <td colSpan={2} className="py-2 pr-4 font-bold text-slate-900">
                        Total Liabilities
                      </td>
                      <td className="py-2 pr-4 text-right font-bold text-slate-900">
                        {formatLakhsCrores(p.netWorth.totalLiabilities)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Net Worth Summary */}
          <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between print:bg-slate-800">
            <span className="text-lg font-semibold">Net Worth</span>
            <span className="text-2xl font-bold">{formatLakhsCrores(p.netWorth.netWorth)}</span>
          </div>
        </section>

        {/* ════════════════ CASH FLOW ANALYSIS ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={TrendingUp}
            title="Cash Flow Analysis"
            subtitle="Monthly income and expense breakdown"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Income */}
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">
                Income
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Monthly Salary', value: p.income.monthlySalary },
                  { label: 'Annual Bonus (monthly)', value: Math.round(p.income.bonusAnnual / 12) },
                  { label: 'Rental Income', value: p.income.rentalIncome },
                  { label: 'Business Income', value: p.income.businessIncome },
                  { label: 'Other Income', value: p.income.otherIncome },
                ]
                  .filter((i) => i.value > 0)
                  .map((i) => (
                    <div key={i.label} className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">{i.label}</span>
                      <span className="text-sm font-medium text-slate-900">{formatINR(i.value)}</span>
                    </div>
                  ))}
                <div className="flex justify-between py-2 border-t-2 border-emerald-200 mt-2">
                  <span className="font-bold text-slate-900">Total Monthly Income</span>
                  <span className="font-bold text-emerald-700">
                    {formatINR(p.income.totalMonthlyIncome)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3">
                Expenses
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Housing', value: p.expenses.housing },
                  { label: 'Utilities', value: p.expenses.utilities },
                  { label: 'Groceries', value: p.expenses.groceries },
                  { label: 'Transportation', value: p.expenses.transportation },
                  { label: 'Education', value: p.expenses.education },
                  { label: 'Healthcare', value: p.expenses.healthcare },
                  { label: 'Entertainment', value: p.expenses.entertainment },
                  { label: 'Personal Care', value: p.expenses.personalCare },
                  { label: 'Insurance Premiums', value: p.expenses.insurance },
                  { label: 'EMI Payments', value: p.expenses.emiPayments },
                  { label: 'Domestic Help', value: p.expenses.domesticHelp },
                  { label: 'Other', value: p.expenses.other },
                ]
                  .filter((i) => i.value > 0)
                  .map((i) => (
                    <div key={i.label} className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-600">{i.label}</span>
                      <span className="text-sm font-medium text-slate-900">{formatINR(i.value)}</span>
                    </div>
                  ))}
                <div className="flex justify-between py-2 border-t-2 border-red-200 mt-2">
                  <span className="font-bold text-slate-900">Total Monthly Expenses</span>
                  <span className="font-bold text-red-700">
                    {formatINR(p.expenses.totalMonthlyExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Surplus Highlight */}
          <div
            className={`mt-8 rounded-xl p-6 flex items-center justify-between ${
              p.expenses.monthlySurplus >= 0
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Surplus</p>
              <p className="text-xs text-slate-500">
                Savings Rate: {p.expenses.savingsRate.toFixed(1)}%
              </p>
            </div>
            <span
              className={`text-2xl font-bold ${
                p.expenses.monthlySurplus >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {formatINR(p.expenses.monthlySurplus)}
            </span>
          </div>
        </section>

        {/* ════════════════ INSURANCE GAP ANALYSIS ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={Shield}
            title="Insurance Gap Analysis"
            subtitle="Life and health coverage adequacy"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Term Insurance */}
            <div className="border border-slate-200 rounded-xl p-6 print:border-slate-300">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Term Life Insurance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Current Cover</span>
                  <span className="font-medium text-slate-900">
                    {formatLakhsCrores(p.insurance.totalLifeCover)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Recommended Cover</span>
                  <span className="font-medium text-slate-900">
                    {formatLakhsCrores(p.analysis.recommendedTermCover)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-700">Gap</span>
                    <span
                      className={`text-lg font-bold ${
                        p.analysis.termInsuranceGap > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {p.analysis.termInsuranceGap > 0
                        ? formatLakhsCrores(p.analysis.termInsuranceGap)
                        : 'Adequately covered'}
                    </span>
                  </div>
                </div>
                {/* Bar visual */}
                <div className="mt-2">
                  <div className="flex gap-1 text-[10px] text-slate-400 mb-1">
                    <span>Coverage</span>
                    <span className="ml-auto">Recommended</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.analysis.termInsuranceGap > 0 ? 'bg-red-400' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (p.insurance.totalLifeCover /
                            Math.max(p.analysis.recommendedTermCover, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {p.analysis.termInsuranceGap > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Consider purchasing additional term cover of{' '}
                    {formatLakhsCrores(p.analysis.termInsuranceGap)} to protect your family.
                  </p>
                )}
              </div>
            </div>

            {/* Health Insurance */}
            <div className="border border-slate-200 rounded-xl p-6 print:border-slate-300">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Health Insurance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Current Cover</span>
                  <span className="font-medium text-slate-900">
                    {formatLakhsCrores(p.insurance.totalHealthCover)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Recommended Cover</span>
                  <span className="font-medium text-slate-900">
                    {formatLakhsCrores(p.analysis.recommendedHealthCover)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-700">Gap</span>
                    <span
                      className={`text-lg font-bold ${
                        p.analysis.healthInsuranceGap > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {p.analysis.healthInsuranceGap > 0
                        ? formatLakhsCrores(p.analysis.healthInsuranceGap)
                        : 'Adequately covered'}
                    </span>
                  </div>
                </div>
                {/* Bar visual */}
                <div className="mt-2">
                  <div className="flex gap-1 text-[10px] text-slate-400 mb-1">
                    <span>Coverage</span>
                    <span className="ml-auto">Recommended</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.analysis.healthInsuranceGap > 0 ? 'bg-red-400' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (p.insurance.totalHealthCover /
                            Math.max(p.analysis.recommendedHealthCover, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {p.analysis.healthInsuranceGap > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Consider upgrading health cover by{' '}
                    {formatLakhsCrores(p.analysis.healthInsuranceGap)} with a super top-up plan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ GOAL-WISE INVESTMENT PLAN ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={Target}
            title="Goal-wise Investment Plan"
            subtitle="Projected requirements and suggested SIPs for each goal"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 pr-3 font-semibold text-slate-600">Goal</th>
                  <th className="text-center py-2 pr-3 font-semibold text-slate-600">Year</th>
                  <th className="text-right py-2 pr-3 font-semibold text-slate-600">
                    Today&apos;s Value
                  </th>
                  <th className="text-right py-2 pr-3 font-semibold text-slate-600">
                    Inflated Target
                  </th>
                  <th className="text-right py-2 pr-3 font-semibold text-slate-600">
                    Required SIP
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-slate-600">Category</th>
                  <th className="text-center py-2 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {p.analysis.goalFeasibility.map((g) => (
                  <tr key={g.goalId} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 text-slate-800 font-medium">{g.goalName}</td>
                    <td className="py-2.5 pr-3 text-center text-slate-600">{g.yearsRemaining}y</td>
                    <td className="py-2.5 pr-3 text-right text-slate-700">
                      {formatLakhsCrores(g.targetAmount)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-slate-900 font-medium">
                      {formatLakhsCrores(g.inflatedTarget)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-slate-900">
                      {formatINR(g.requiredMonthlySIP)}/mo
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 text-xs">
                      {g.suggestedFundCategory}
                    </td>
                    <td className="py-2.5 text-center">
                      {g.isOnTrack ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          On Track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Gap: {formatLakhsCrores(g.gap)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════════════ TAX OPTIMIZATION ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={Receipt}
            title="Tax Optimization"
            subtitle="Maximize your tax savings potential"
          />

          {/* Regime comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div
              className={`border rounded-xl p-5 ${
                p.tax.regime === 'old'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">Current Regime</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase font-bold">
                  {p.tax.regime}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tax Payable: <span className="font-medium text-slate-800">{formatINR(p.tax.taxPayable)}</span>
              </p>
              <p className="text-xs text-slate-500">
                Effective Rate: <span className="font-medium text-slate-800">{p.tax.effectiveRate.toFixed(1)}%</span>
              </p>
            </div>
            <div
              className={`border rounded-xl p-5 ${
                p.analysis.recommendedRegime !== p.tax.regime
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">Recommended Regime</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 uppercase font-bold">
                  {p.analysis.recommendedRegime}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Potential Savings:{' '}
                <span className="font-bold text-emerald-700">
                  {formatINR(p.analysis.potentialTaxSavings)}
                </span>
              </p>
            </div>
          </div>

          {/* Unused Deductions */}
          {p.analysis.taxOpportunities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Unused Deduction Opportunities
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 pr-4 font-semibold text-slate-600">Section</th>
                      <th className="text-left py-2 pr-4 font-semibold text-slate-600">
                        Description
                      </th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">Limit</th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">Used</th>
                      <th className="text-right py-2 pr-4 font-semibold text-slate-600">
                        Unused
                      </th>
                      <th className="text-right py-2 font-semibold text-slate-600">
                        Potential Saving
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.analysis.taxOpportunities.map((opp, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-800">{opp.section}</td>
                        <td className="py-2 pr-4 text-slate-600 text-xs">{opp.description}</td>
                        <td className="py-2 pr-4 text-right text-slate-700">
                          {formatINR(opp.maxLimit)}
                        </td>
                        <td className="py-2 pr-4 text-right text-slate-700">
                          {formatINR(opp.currentUsage)}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-amber-700">
                          {formatINR(opp.unusedLimit)}
                        </td>
                        <td className="py-2 text-right font-bold text-emerald-700">
                          {formatINR(opp.potentialSaving)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300">
                      <td colSpan={5} className="py-2 pr-4 font-bold text-slate-900">
                        Total Potential Tax Savings
                      </td>
                      <td className="py-2 text-right font-bold text-emerald-700">
                        {formatINR(p.analysis.potentialTaxSavings)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════ ASSET ALLOCATION ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={PieChart}
            title="Asset Allocation"
            subtitle="Current vs recommended portfolio mix"
          />

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-600">
                    Asset Class
                  </th>
                  <th className="text-right py-2 pr-4 font-semibold text-slate-600">
                    Current %
                  </th>
                  <th className="py-2 pr-4 w-40" />
                  <th className="text-right py-2 pr-4 font-semibold text-slate-600">
                    Recommended %
                  </th>
                  <th className="py-2 w-40" />
                  <th className="text-right py-2 font-semibold text-slate-600">Difference</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { label: 'Equity', current: p.analysis.currentAllocation.equity, recommended: p.analysis.recommendedAllocation.equity, color: 'bg-blue-500' },
                    { label: 'Debt', current: p.analysis.currentAllocation.debt, recommended: p.analysis.recommendedAllocation.debt, color: 'bg-amber-500' },
                    { label: 'Gold', current: p.analysis.currentAllocation.gold, recommended: p.analysis.recommendedAllocation.gold, color: 'bg-yellow-500' },
                    { label: 'Cash', current: p.analysis.currentAllocation.cash, recommended: p.analysis.recommendedAllocation.cash, color: 'bg-emerald-500' },
                    { label: 'Real Estate', current: p.analysis.currentAllocation.realEstate, recommended: 0, color: 'bg-purple-500' },
                  ] as const
                ).map((row) => {
                  const diff = row.recommended - row.current;
                  return (
                    <tr key={row.label} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-800 font-medium">{row.label}</td>
                      <td className="py-2.5 pr-4 text-right text-slate-700">
                        {row.current.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color} opacity-60`}
                            style={{ width: `${row.current}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-slate-900">
                        {row.recommended.toFixed(1)}%
                      </td>
                      <td className="py-2.5">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{ width: `${row.recommended}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`text-sm font-medium ${
                            diff > 0
                              ? 'text-emerald-600'
                              : diff < 0
                              ? 'text-red-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rebalancing note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Rebalancing Suggestions</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
              {p.analysis.recommendedAllocation.equity > p.analysis.currentAllocation.equity && (
                <li>
                  Increase equity allocation by{' '}
                  {(p.analysis.recommendedAllocation.equity - p.analysis.currentAllocation.equity).toFixed(1)}%
                  through SIPs in diversified equity funds.
                </li>
              )}
              {p.analysis.recommendedAllocation.equity < p.analysis.currentAllocation.equity && (
                <li>
                  Reduce equity exposure by{' '}
                  {(p.analysis.currentAllocation.equity - p.analysis.recommendedAllocation.equity).toFixed(1)}%
                  by redirecting future investments to debt instruments.
                </li>
              )}
              {p.analysis.recommendedAllocation.debt > p.analysis.currentAllocation.debt && (
                <li>
                  Increase debt allocation by{' '}
                  {(p.analysis.recommendedAllocation.debt - p.analysis.currentAllocation.debt).toFixed(1)}%
                  through PPF, debt funds, or fixed deposits.
                </li>
              )}
              {p.analysis.recommendedAllocation.gold > p.analysis.currentAllocation.gold && (
                <li>
                  Consider adding{' '}
                  {(p.analysis.recommendedAllocation.gold - p.analysis.currentAllocation.gold).toFixed(1)}%
                  allocation to gold via Sovereign Gold Bonds or Gold ETFs.
                </li>
              )}
              {p.analysis.currentAllocation.cash > p.analysis.recommendedAllocation.cash && (
                <li>
                  Redeploy excess cash of{' '}
                  {(p.analysis.currentAllocation.cash - p.analysis.recommendedAllocation.cash).toFixed(1)}%
                  into growth-oriented investments.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* ════════════════ ACTION PLAN ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={ListChecks}
            title="Action Plan"
            subtitle="Priority-sorted steps to improve your financial health"
          />

          <div className="space-y-3">
            {[...p.analysis.actionItems]
              .sort((a, b) => {
                const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
              })
              .map((item, idx) => {
                const pBadge = priorityBadge(item.priority);
                const cBadge = categoryBadge(item.category);
                return (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-xl p-4 print:border-slate-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pBadge.bg}`}
                          >
                            {pBadge.text}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${cBadge.bg}`}
                          >
                            {cBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                        {item.impact && (
                          <p className="text-xs text-emerald-700 mt-1 font-medium">
                            Impact: {item.impact}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* ════════════════ DISCLAIMERS ════════════════ */}
        <section className="print:break-before-page print:pt-10 py-10">
          <SectionHeader
            icon={AlertTriangle}
            title="Disclaimers & Disclosures"
          />

          <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
            <div className="border border-slate-200 rounded-xl p-5 space-y-3 print:border-slate-300">
              <p>
                <strong className="text-slate-700">AMFI Registered Mutual Fund Distributor</strong>
                <br />
                ARN-286886 | Trustner Asset Services | Valid till: As per AMFI records.
                Mutual fund investments are subject to market risks. Read all scheme-related
                documents carefully before investing. Past performance is not indicative of
                future returns.
              </p>

              <p>
                <strong className="text-slate-700">IRDAI Licensed Insurance Distributor</strong>
                <br />
                License No. 1067 | Category: Composite Corporate Agent. Insurance is a
                subject matter of solicitation. Visitors are hereby informed that their
                information submitted on the website may be shared with insurers. The product
                information is authentic and solely based on the information received from the
                insurers.
              </p>

              <p>
                <strong className="text-slate-700">General Disclaimer</strong>
                <br />
                This financial plan is prepared for illustrative purposes only and should not
                be construed as investment advice. The projections and recommendations are
                based on assumptions that may not reflect actual market conditions. All
                calculations are based on the data provided by the user and standard
                actuarial / financial assumptions. Actual results may vary significantly.
              </p>

              <p>
                <strong className="text-slate-700">Privacy &amp; Data Protection</strong>
                <br />
                Your data is encrypted and stored securely. When authenticated, your plan is
                saved to enable PDF generation, email delivery, and multi-device access.
                We adhere to the Digital Personal Data Protection Act, 2023 (DPDPA) principles.
                You may request deletion of your data at any time by contacting us.
              </p>

              <p>
                <strong className="text-slate-700">Regulatory</strong>
                <br />
                Mutual Fund investments are subject to market risks, read all scheme related
                documents carefully. The NAVs of the schemes may go up or down depending upon
                the factors and forces affecting the securities market including the
                fluctuations in the interest rates. The past performance of the mutual funds
                is not necessarily indicative of future performance of the schemes.
              </p>
            </div>

            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-400">
                Trustner Asset Services &nbsp;|&nbsp; WealthyHub.in &nbsp;|&nbsp; ARN-286886
                &nbsp;|&nbsp; IRDAI License 1067
              </p>
              <p className="text-slate-400 mt-1">
                Report generated on {formatDate(p.updatedAt || p.createdAt)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
