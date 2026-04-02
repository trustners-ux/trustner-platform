'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Shield, Clock,
  CheckCircle2, XCircle, RefreshCw, Edit3, Save, Download,
  Sparkles, AlertTriangle, FileText, Activity, MessageSquare,
  ChevronDown, ChevronRight, Briefcase, Wallet, PiggyBank,
  CreditCard, HeartPulse, Target, Gauge, Landmark, UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReportQueueEntry } from '@/types/report-queue';
import type { FinancialPlanningData, LoanDetail } from '@/types/financial-planning';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending_review: { label: 'Pending Review', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
  approved: { label: 'Approved', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: CheckCircle2 },
  sent: { label: 'Sent to User', bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: XCircle },
};

function gradeColor(grade: string): string {
  const c: Record<string, string> = {
    'Excellent': '#15803d', 'Good': '#0f766e', 'Fair': '#d97706',
    'Needs Improvement': '#ea580c', 'Needs Attention': '#ea580c', 'Critical': '#b91c1c',
  };
  return c[grade] || '#0f766e';
}

function formatAmount(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PILLAR_LABELS: Record<string, string> = {
  cashflow: 'Cashflow Health',
  protection: 'Protection',
  investments: 'Investments',
  debt: 'Debt Management',
  retirementReadiness: 'Retirement',
};

const PILLAR_COLORS: Record<string, string> = {
  cashflow: '#0F766E',
  protection: '#7C3AED',
  investments: '#2563EB',
  debt: '#EA580C',
  retirementReadiness: '#D97706',
};

/* ------------------------------------------------------------------ */
/*  Collapsible Section Component                                      */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        <Icon className="w-4 h-4 text-brand flex-shrink-0" />
        <span className="text-sm font-bold text-slate-700 flex-1">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && <div className="px-4 py-3 border-t border-surface-200">{children}</div>}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value === null || value === undefined || value === '' ? '\u2014' : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700">{display}</span>
    </div>
  );
}

function CurrencyRow({ label, value }: { label: string; value: number | null | undefined }) {
  const display = value === null || value === undefined ? '\u2014' : value === 0 ? '\u2014' : formatAmount(value);
  return <DataRow label={label} value={display} />;
}

function LoanRow({ label, loan }: { label: string; loan: LoanDetail | undefined }) {
  if (!loan || (loan.outstanding === 0 && loan.emi === 0)) {
    return <DataRow label={label} value="\u2014" />;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700">
        {formatAmount(loan.outstanding)} outstanding, {formatAmount(loan.emi)}/mo, {loan.remainingYears}y left
      </span>
    </div>
  );
}

const LABEL_MAP: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Other',
  single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed',
  own: 'Own House', rent: 'Rented', family: 'Living with Family',
  salaried: 'Salaried', 'self-employed': 'Self-employed', business: 'Business Owner', retired: 'Retired', homemaker: 'Homemaker',
  'very-stable': 'Very Stable', stable: 'Stable', variable: 'Variable', 'highly-variable': 'Highly Variable',
  conservative: 'Conservative', moderate: 'Moderate', aggressive: 'Aggressive',
  'sell-immediately': 'Sell immediately', 'wait-patiently': 'Wait patiently', 'invest-more': 'Invest more',
  'less-than-3': 'Less than 3 years', '3-to-5': '3-5 years', '5-to-10': '5-10 years', '10-plus': '10+ years',
  'capital-protection': 'Capital Protection', 'balanced-growth': 'Balanced Growth', 'aggressive-growth': 'Aggressive Growth',
  none: 'None', limited: 'Limited', extensive: 'Extensive',
  old: 'Old Regime', new: 'New Regime',
  heavily: 'Heavily', somewhat: 'Somewhat', rarely: 'Rarely', never: 'Never',
  'very-disciplined': 'Very Disciplined', 'mostly-disciplined': 'Mostly Disciplined', sometimes: 'Sometimes',
  'critical': 'Critical', 'important': 'Important', 'nice-to-have': 'Nice to Have',
  metro: 'Metro', tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3',
};

function humanize(val: string | undefined | null): string {
  if (!val) return '\u2014';
  return LABEL_MAP[val] || val.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Questionnaire Data Panel                                           */
/* ------------------------------------------------------------------ */

function QuestionnaireDataPanel({ data }: { data: FinancialPlanningData }) {
  const p = data.personalProfile;
  const c = data.careerProfile;
  const inc = data.incomeProfile;
  const a = data.assetProfile;
  const l = data.liabilityProfile;
  const ins = data.insuranceProfile;
  const r = data.riskProfile;
  const b = data.behavioralProfile;
  const e = data.emergencyProfile;
  const t = data.taxProfile;

  return (
    <div className="card-base p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand" />
        Client Questionnaire Data
      </h3>
      <div className="space-y-2">
        {/* Personal Profile */}
        <CollapsibleSection icon={UserCircle} title="Personal Profile" defaultOpen>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <DataRow label="Full Name" value={p?.fullName} />
            <DataRow label="Date of Birth" value={p?.dateOfBirth} />
            <DataRow label="Age" value={p?.age} />
            <DataRow label="Gender" value={humanize(p?.gender)} />
            <DataRow label="Marital Status" value={humanize(p?.maritalStatus)} />
            <DataRow label="Dependents" value={p?.dependents} />
            <DataRow label="Spouse Age" value={p?.spouseAge ?? '\u2014'} />
            <DataRow label="Children Ages" value={p?.childrenAges?.length ? p.childrenAges.join(', ') : '\u2014'} />
            <DataRow label="State" value={p?.state} />
            <DataRow label="City" value={p?.city} />
            <DataRow label="City Tier" value={humanize(p?.cityTier)} />
            <DataRow label="Pincode" value={p?.pincode} />
            <DataRow label="Residential Status" value={humanize(p?.residentialStatus)} />
            <DataRow label="Email" value={p?.email} />
            <DataRow label="Phone" value={p?.phone} />
          </div>
        </CollapsibleSection>

        {/* Income & Expenses */}
        <CollapsibleSection icon={Briefcase} title="Income & Expenses">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <DataRow label="Employment Type" value={humanize(c?.employmentType)} />
            <DataRow label="Industry" value={c?.industry} />
            <DataRow label="Years in Current Job" value={c?.yearsInCurrentJob} />
            <DataRow label="Income Stability" value={humanize(c?.incomeStability)} />
            <DataRow label="Expected Retirement Age" value={c?.expectedRetirementAge} />
            <DataRow label="Spouse Works" value={c?.spouseWorks ? 'Yes' : 'No'} />
            <DataRow label="Expected Annual Growth" value={c?.expectedAnnualGrowth ? `${c.expectedAnnualGrowth}%` : '\u2014'} />
            <div className="col-span-full border-t border-surface-100 my-1" />
            <CurrencyRow label="Monthly In-hand Salary" value={inc?.monthlyInHandSalary} />
            <CurrencyRow label="Annual Bonus" value={inc?.annualBonus} />
            <CurrencyRow label="Rental Income" value={inc?.rentalIncome} />
            <CurrencyRow label="Business Income" value={inc?.businessIncome} />
            <CurrencyRow label="Other Income" value={inc?.otherIncome} />
            <div className="col-span-full border-t border-surface-100 my-1" />
            <CurrencyRow label="Household Expenses" value={inc?.monthlyHouseholdExpenses} />
            <CurrencyRow label="Monthly EMIs" value={inc?.monthlyEMIs} />
            <CurrencyRow label="Monthly Rent" value={inc?.monthlyRent} />
            <CurrencyRow label="Running SIPs" value={inc?.monthlySIPsRunning} />
            <CurrencyRow label="Insurance Premiums" value={inc?.monthlyInsurancePremiums} />
            <CurrencyRow label="Annual Discretionary" value={inc?.annualDiscretionary} />
          </div>
        </CollapsibleSection>

        {/* Assets & Investments */}
        <CollapsibleSection icon={PiggyBank} title="Assets & Investments">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <CurrencyRow label="Bank Savings" value={a?.bankSavings} />
            <CurrencyRow label="Fixed Deposits" value={a?.fixedDeposits} />
            <CurrencyRow label="Mutual Funds" value={a?.mutualFunds} />
            <CurrencyRow label="Stocks" value={a?.stocks} />
            <CurrencyRow label="PPF / EPF" value={a?.ppfEpf} />
            <CurrencyRow label="NPS" value={a?.nps} />
            <CurrencyRow label="Gold" value={a?.gold} />
            <CurrencyRow label="Real Estate (Investment)" value={a?.realEstateInvestment} />
            <CurrencyRow label="Primary Residence" value={a?.primaryResidenceValue} />
            <CurrencyRow label="Other Assets" value={a?.otherAssets} />
          </div>
        </CollapsibleSection>

        {/* Liabilities */}
        <CollapsibleSection icon={CreditCard} title="Liabilities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <LoanRow label="Home Loan" loan={l?.homeLoan} />
            <LoanRow label="Car Loan" loan={l?.carLoan} />
            <LoanRow label="Personal Loan" loan={l?.personalLoan} />
            <LoanRow label="Education Loan" loan={l?.educationLoan} />
            <CurrencyRow label="Credit Card Debt" value={l?.creditCardDebt} />
            <CurrencyRow label="Other Loans" value={l?.otherLoans} />
          </div>
        </CollapsibleSection>

        {/* Insurance */}
        <CollapsibleSection icon={HeartPulse} title="Insurance">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <CurrencyRow label="Term Insurance Cover" value={ins?.termInsuranceCover} />
            <CurrencyRow label="Life Insurance Cover" value={ins?.lifeInsuranceCover} />
            <CurrencyRow label="Health Insurance Cover" value={ins?.healthInsuranceCover} />
            <DataRow label="Critical Illness Cover" value={ins?.hasCriticalIllnessCover ? 'Yes' : 'No'} />
            <DataRow label="Accidental Cover" value={ins?.hasAccidentalCover ? 'Yes' : 'No'} />
            <CurrencyRow label="Annual Life Premium" value={ins?.annualLifePremium} />
            <CurrencyRow label="Annual Health Premium" value={ins?.annualHealthPremium} />
          </div>
        </CollapsibleSection>

        {/* Goals */}
        <CollapsibleSection icon={Target} title={`Goals (${data.goals?.length || 0})`}>
          {data.goals?.length ? (
            <div className="space-y-3">
              {data.goals.map((g, i) => (
                <div key={g.id || i} className="bg-surface-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">{g.name}</span>
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      g.priority === 'critical' ? 'bg-red-50 text-red-600' :
                      g.priority === 'important' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-600'
                    )}>
                      {humanize(g.priority)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                    <DataRow label="Type" value={humanize(g.type)} />
                    <CurrencyRow label="Target Amount" value={g.targetAmount} />
                    <CurrencyRow label="Current Savings" value={g.currentSavingsForGoal} />
                    <DataRow label="Target Year" value={g.targetYear} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No goals added</p>
          )}
        </CollapsibleSection>

        {/* Risk Profile */}
        <CollapsibleSection icon={Gauge} title="Risk Profile">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <DataRow label="Risk Category" value={humanize(r?.riskCategory)} />
            <DataRow label="Risk Score" value={r?.riskScore} />
            <DataRow label="Market Drop Reaction" value={humanize(r?.marketDropReaction)} />
            <DataRow label="Investment Horizon" value={humanize(r?.investmentHorizon)} />
            <DataRow label="Primary Objective" value={humanize(r?.primaryObjective)} />
            <DataRow label="Past Experience" value={humanize(r?.pastExperience)} />
            <div className="col-span-full border-t border-surface-100 my-1" />
            <DataRow label="Tracks Expenses Monthly" value={b?.tracksExpensesMonthly ? 'Yes' : 'No'} />
            <DataRow label="Market News Influence" value={humanize(b?.marketNewsInfluence)} />
            <DataRow label="Investment Discipline" value={humanize(b?.investmentDiscipline)} />
            <DataRow label="Behavioral Score" value={b?.behavioralScore} />
          </div>
        </CollapsibleSection>

        {/* Emergency & Tax */}
        <CollapsibleSection icon={Landmark} title="Emergency & Tax">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <DataRow label="Has Emergency Fund" value={e?.hasEmergencyFund ? 'Yes' : 'No'} />
            <CurrencyRow label="Emergency Fund Amount" value={e?.emergencyFundAmount} />
            <DataRow label="Months of Expenses Covered" value={e?.monthsOfExpensesCovered} />
            <div className="col-span-full border-t border-surface-100 my-1" />
            <DataRow label="Tax Regime" value={humanize(t?.taxRegime)} />
            <CurrencyRow label="Annual Taxable Income" value={t?.annualTaxableIncome} />
            <CurrencyRow label="Section 80C Used" value={t?.section80CUsed} />
            <CurrencyRow label="Section 80D Used" value={t?.section80DUsed} />
            <DataRow label="Has HRA" value={t?.hasHRA ? 'Yes' : 'No'} />
            <CurrencyRow label="NPS Contribution" value={t?.npsContribution} />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<ReportQueueEntry | null>(null);
  const [planningData, setPlanningData] = useState<FinancialPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Narrative editing
  const [editingNarrative, setEditingNarrative] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');

  // Admin notes
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports/${id}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setNarrativeText(data.report.editedNarrative || data.report.claudeNarrative);
        setAdminNotes(data.report.adminNotes || '');
        setPlanningData(data.planningData || null);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ---------- Actions ---------- */
  const handleSaveNarrative = async () => {
    if (!report) return;
    setActionLoading('save');
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedNarrative: narrativeText }),
      });
      if (res.ok) {
        setEditingNarrative(false);
        await fetchReport();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async () => {
    if (!report) return;
    setActionLoading('regenerate');
    try {
      const res = await fetch(`/api/admin/reports/${id}/regenerate`, { method: 'POST' });
      if (res.ok) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!report) return;
    setActionLoading('saveNotes');
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
        await fetchReport();
      }
    } catch (err) {
      console.error('Save notes failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!report) return;
    setActionLoading('approve');
    try {
      const res = await fetch(`/api/admin/reports/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          alert(`Approved with warning: ${data.warning}`);
        }
        await fetchReport();
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!report || !rejectReason.trim()) return;
    setActionLoading('reject');
    try {
      const res = await fetch(`/api/admin/reports/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason('');
        await fetchReport();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Loading State ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-sm text-slate-400">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Report not found</p>
        <button onClick={() => router.push('/admin/reports')} className="mt-4 text-brand text-sm font-semibold">
          ← Back to Reports
        </button>
      </div>
    );
  }

  const isPending = report.status === 'pending_review';
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending_review;
  const StatusIcon = statusCfg.icon;
  const currentNarrative = report.editedNarrative || report.claudeNarrative;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/reports')}
            className="p-2 rounded-lg text-slate-400 hover:bg-surface-100 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-primary-700">{report.userName}</h1>
            <p className="text-xs text-slate-400">{report.id}</p>
          </div>
        </div>
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold', statusCfg.bg, statusCfg.text)}>
          <StatusIcon className="w-4 h-4" />
          {statusCfg.label}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left panel — 3 cols */}
        <div className="lg:col-span-3 space-y-5">
          {/* User Info Card */}
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              User Profile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userPhone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userCity}, Age {report.userAge}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.riskCategory}</span>
              </div>
            </div>
          </div>

          {/* Client Questionnaire Data */}
          {planningData && <QuestionnaireDataPanel data={planningData} />}

          {/* Score + Pillars */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Financial Health Score</h3>
              <div className="text-center">
                <span className="text-3xl font-extrabold" style={{ color: gradeColor(report.grade) }}>
                  {report.totalScore}
                </span>
                <span className="text-slate-400 text-sm">/900</span>
                <div className="text-xs font-semibold mt-0.5" style={{ color: gradeColor(report.grade) }}>
                  {report.grade}
                </div>
              </div>
            </div>

            {/* Pillar bars */}
            <div className="space-y-3">
              {Object.entries(report.pillarScores).map(([key, pillar]) => {
                const percent = Math.round((pillar.score / 180) * 100);
                const color = PILLAR_COLORS[key] || '#0f766e';
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">{PILLAR_LABELS[key] || key}</span>
                      <span className="font-bold" style={{ color }}>
                        {pillar.score}/180 ({pillar.grade})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Net Worth */}
            <div className="mt-4 pt-4 border-t border-surface-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Net Worth</span>
              <span className="text-lg font-extrabold text-primary-700">{formatAmount(report.netWorth)}</span>
            </div>
          </div>

          {/* Top Actions */}
          {report.topActions.length > 0 && (
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Top Action Items</h3>
              <div className="space-y-2">
                {report.topActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-600">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* PDF Preview */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                PDF Report
              </h3>
              <a
                href={report.pdfBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
            <div className="aspect-[3/4] bg-slate-50">
              <iframe
                src={report.pdfBlobUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Section — Full width */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Narrative
            <span className="text-xs font-normal text-slate-400">v{report.narrativeVersion}</span>
            {report.editedNarrative && (
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                Edited
              </span>
            )}
          </h3>
          {isPending && (
            <div className="flex items-center gap-2">
              {!editingNarrative ? (
                <>
                  <button
                    onClick={() => setEditingNarrative(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={actionLoading === 'regenerate'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3 h-3', actionLoading === 'regenerate' && 'animate-spin')} />
                    Regenerate with AI
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveNarrative}
                    disabled={actionLoading === 'save'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNarrative(false);
                      setNarrativeText(currentNarrative);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {editingNarrative ? (
          <div>
            <textarea
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              rows={10}
              className="w-full p-3 text-sm text-slate-700 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
            />
            <div className="text-right mt-1 text-xs text-slate-400">{narrativeText.length} characters</div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{currentNarrative}</p>
        )}
      </div>

      {/* Admin Notes */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Admin Notes / Comments
            {report.adminNotes && !isPending && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Has notes
              </span>
            )}
          </h3>
          {isPending && (
            <button
              onClick={handleSaveNotes}
              disabled={actionLoading === 'saveNotes'}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {notesSaved ? 'Saved!' : actionLoading === 'saveNotes' ? 'Saving...' : 'Save Notes'}
            </button>
          )}
        </div>
        {isPending ? (
          <div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Add review comments or a personalized note for the user. Notes will be included in the report email as a message from the advisor..."
              className="w-full p-3 text-sm text-slate-700 border border-surface-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">
              These notes will appear in the email sent to the user under &quot;A note from your advisor&quot;.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {report.adminNotes ? (
              <span className="text-slate-600">{report.adminNotes}</span>
            ) : (
              <span className="text-slate-400 italic">No admin notes added</span>
            )}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="card-base p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading === 'approve' ? 'Sending...' : 'Approve & Send Report'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={!!actionLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Sent confirmation */}
      {report.status === 'sent' && (
        <div className="card-base p-5 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-700">Report Sent Successfully</p>
              <p className="text-xs text-green-600">
                Approved by {report.approvedBy} on {report.approvedAt ? formatDateTime(report.approvedAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected info */}
      {report.status === 'rejected' && (
        <div className="card-base p-5 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Report Rejected</p>
              <p className="text-xs text-red-600 mt-1">
                Reason: {report.rejectionReason}
              </p>
              <p className="text-xs text-red-500 mt-1">
                Rejected on {report.rejectedAt ? formatDateTime(report.rejectedAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {report.editHistory.length > 0 && (
        <div className="card-base p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Audit Trail
          </h3>
          <div className="space-y-3">
            {report.editHistory.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700">{entry.action.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400"> by {entry.adminEmail}</span>
                  <div className="text-slate-400">{formatDateTime(entry.timestamp)}</div>
                  {entry.details && <div className="text-slate-500 mt-0.5">{entry.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full p-6">
            <h3 className="text-base font-bold text-primary-700 mb-3">Reject Report</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejecting this report. The report will not be sent to the user.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full p-3 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === 'reject'}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
