"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Shield,
  Heart,
  TrendingUp,
  Landmark,
  PiggyBank,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  Pencil,
  Phone,
  Target,
  GraduationCap,
  Home,
  Car,
  Gem,
  Plane,
  Wallet,
  BadgeIndianRupee,
  ChevronRight,
  Sparkles,
  FileText,
  MessageCircle,
  BarChart3,
  Mail,
  Loader2,
  Check,
  Users,
} from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { useAuth } from "@/hooks/useAuth";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import { downloadReport, generateReport, emailReport } from "@/lib/api/plans";
import { generatePlanInsights } from "@/lib/utils/plan-insights";
import { generateBehavioralNudges } from "@/lib/utils/behavioral-nudges";
import InsightEngine from "@/components/insights/InsightEngine";
import NudgeCard from "@/components/dashboard/NudgeCard";
import ScenarioModeler from "@/components/dashboard/ScenarioModeler";
import ExecutionCard from "@/components/dashboard/ExecutionCard";
import type { GoalType, ActionItem } from "@/types/financial-plan";

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  onEdit: () => void;
}

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Constants ───────────────────────────────────────────────────────────────
const ALLOCATION_COLORS: Record<string, string> = {
  equity: "#3B82F6",
  debt: "#10B981",
  gold: "#F59E0B",
  cash: "#6B7280",
  realEstate: "#8B5CF6",
};

const ALLOCATION_LABELS: Record<string, string> = {
  equity: "Equity",
  debt: "Debt",
  gold: "Gold",
  cash: "Cash",
  realEstate: "Real Estate",
};

const PRIORITY_STYLES: Record<
  ActionItem["priority"],
  { bg: string; text: string; border: string; label: string }
> = {
  urgent: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Urgent",
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    label: "High",
  },
  medium: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Medium",
  },
  low: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    label: "Low",
  },
};

const GOAL_ICONS: Record<GoalType, React.ElementType> = {
  retirement: Landmark,
  "child-education": GraduationCap,
  house: Home,
  car: Car,
  wedding: Gem,
  vacation: Plane,
  "emergency-fund": Shield,
  "wealth-creation": TrendingUp,
  custom: Target,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return "#DC2626";
  if (score <= 70) return "#F59E0B";
  return "#059669";
}

function getScoreLabel(score: number): string {
  if (score < 40) return "Needs Attention";
  if (score <= 70) return "Fair";
  return "Excellent";
}

function getScoreBg(score: number): string {
  if (score < 40) return "bg-red-50";
  if (score <= 70) return "bg-amber-50";
  return "bg-emerald-50";
}

function getScoreTextColor(score: number): string {
  if (score < 40) return "text-red-600";
  if (score <= 70) return "text-amber-600";
  return "text-emerald-600";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated SVG circular score gauge */
function CircularScore({
  score,
  size = 180,
  strokeWidth = 12,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Animated score arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-extrabold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs font-medium text-gray-400">out of 100</span>
      </div>
    </div>
  );
}

/** Mini circular progress for score breakdown */
function MiniScore({
  score,
  label,
  icon: Icon,
  description,
}: {
  score: number;
  label: string;
  icon: React.ElementType;
  description?: string;
}) {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.5,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-600">{label}</span>
      </div>
      {description && (
        <p className="mt-0.5 text-center text-[10px] leading-tight text-gray-400">
          {description}
        </p>
      )}
    </motion.div>
  );
}

/** Metric card for the key metrics row */
function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-extrabold text-gray-900 lg:text-2xl">
        {value}
      </p>
      {subtext && (
        <p className="mt-0.5 text-xs font-medium text-gray-400">{subtext}</p>
      )}
    </motion.div>
  );
}

/** Custom tooltip for Recharts pie charts */
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="text-xs font-semibold text-gray-700">
          {item.name}
        </span>
      </div>
      <p className="mt-0.5 text-sm font-bold text-gray-900">
        {item.value.toFixed(1)}%
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PlanDashboard({ onEdit }: Props) {
  const { plan, planDbId } = useFinancialPlanStore();
  const { isAuthenticated } = useAuth();
  const analysis = plan.analysis;

  // AI Insights
  const planInsights = useMemo(
    () =>
      analysis
        ? generatePlanInsights(plan as Parameters<typeof generatePlanInsights>[0], analysis)
        : [],
    [plan, analysis]
  );

  // Behavioral nudges
  const behavioralNudges = useMemo(
    () =>
      analysis
        ? generateBehavioralNudges(plan as Parameters<typeof generateBehavioralNudges>[0], analysis)
        : [],
    [plan, analysis]
  );

  // Sub-score descriptions for enhanced MiniScore cards
  const scoreDescriptions = useMemo(() => {
    if (!analysis) return {} as Record<string, string>;
    const occupation = plan?.personal?.occupation || "salaried";
    const reqMonths =
      occupation === "self-employed" ? 9 : occupation === "business" ? 12 : 6;
    return {
      emergency: `${analysis.emergencyFundMonths.toFixed(1)} months saved. Need ${reqMonths}.`,
      insurance: `Term gap: ${formatLakhsCrores(analysis.termInsuranceGap)}. Health gap: ${formatLakhsCrores(analysis.healthInsuranceGap)}.`,
      investment: `Savings rate: ${analysis.savingsRate.toFixed(0)}%. Target: 20%+.`,
      debt: `EMI-to-income: ${analysis.debtToIncomeRatio.toFixed(0)}%. ${analysis.debtToIncomeRatio <= 10 ? "Healthy" : analysis.debtToIncomeRatio <= 30 ? "Manageable" : "High"}.`,
      retirement: `Score ${analysis.retirementScore}/100. ${analysis.retirementScore >= 70 ? "On track" : "Needs focus"}.`,
      tax: `Unused deductions: ${formatLakhsCrores(analysis.potentialTaxSavings)}. Efficiency: ${analysis.taxEfficiencyScore}/100.`,
    };
  }, [analysis, plan?.personal?.occupation]);

  // Download/Email states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const handleDownloadPDF = useCallback(async () => {
    if (!planDbId || !isAuthenticated) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      // First ensure report is generated
      await generateReport(planDbId);
      // Then download
      const blob = await downloadReport(planDbId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Trustner-Financial-Plan.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [planDbId, isAuthenticated]);

  const handleEmailReport = useCallback(async () => {
    if (!planDbId || !isAuthenticated || !emailAddress) return;
    setIsEmailing(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      await emailReport(planDbId, emailAddress);
      setEmailSuccess(true);
      setShowEmailDialog(false);
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err) {
      setEmailError("Failed to send email. Please try again.");
      console.error("Email failed:", err);
    } finally {
      setIsEmailing(false);
    }
  }, [planDbId, isAuthenticated, emailAddress]);

  // Prepare chart data
  const currentAllocationData = useMemo(() => {
    if (!analysis?.currentAllocation) return [];
    return Object.entries(analysis.currentAllocation)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({
        name: ALLOCATION_LABELS[key] || key,
        value: val,
        fill: ALLOCATION_COLORS[key] || "#94A3B8",
      }));
  }, [analysis?.currentAllocation]);

  const recommendedAllocationData = useMemo(() => {
    if (!analysis?.recommendedAllocation) return [];
    return Object.entries(analysis.recommendedAllocation)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({
        name: ALLOCATION_LABELS[key] || key,
        value: val,
        fill: ALLOCATION_COLORS[key] || "#94A3B8",
      }));
  }, [analysis?.recommendedAllocation]);

  const sortedActions = useMemo(() => {
    if (!analysis?.actionItems) return [];
    const order: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return [...analysis.actionItems].sort(
      (a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
    );
  }, [analysis?.actionItems]);

  const planDate = plan.updatedAt
    ? new Date(plan.updatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  // ─── Guard: No analysis yet ────────────────────────────────────────────────
  if (!analysis) {
    return (
      <div className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <BarChart3 size={28} className="text-blue-500" />
        </div>
        <h2 className="mb-2 text-2xl font-extrabold text-gray-900">
          No Plan Generated Yet
        </h2>
        <p className="mb-6 max-w-md text-sm text-gray-500">
          Complete the financial planning wizard to see your personalized
          dashboard with scores, recommendations, and action items.
        </p>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Start Planning <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-surface-100 pb-20"
    >
      {/* ================================================================== */}
      {/* Section 1 : Gradient Header with Overall Score                     */}
      {/* ================================================================== */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-500 to-secondary-600">
        <div className="container-custom py-10 lg:py-14">
          <motion.div
            variants={cardVariants}
            className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between"
          >
            {/* Left: Heading */}
            <div className="text-center lg:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
                  <Sparkles size={12} />
                  Prepared by Trustner AI
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                  AMFI ARN-286886
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  IRDAI License 1067
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white lg:text-4xl">
                Your Financial Plan
              </h1>
              <p className="mt-1 text-sm text-white/60">{planDate}</p>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Pencil size={14} /> Edit Plan
                </button>
                {isAuthenticated && planDbId ? (
                  <>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : downloadSuccess ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Download size={14} />
                      )}
                      {isDownloading ? "Generating..." : downloadSuccess ? "Downloaded!" : "Download PDF"}
                    </button>
                    <button
                      onClick={() => setShowEmailDialog(true)}
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      {emailSuccess ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Mail size={14} />
                      )}
                      {emailSuccess ? "Email Sent!" : "Email Report"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/report"
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700 transition hover:bg-gray-50"
                  >
                    <FileText size={14} /> View Report
                  </Link>
                )}
              </div>

              {/* Email Dialog */}
              {showEmailDialog && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="mb-2 text-xs font-semibold text-white/80">
                    Send your PDF report to:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:bg-white/30"
                    />
                    <button
                      onClick={handleEmailReport}
                      disabled={isEmailing || !emailAddress}
                      className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-primary-700 transition hover:bg-gray-100 disabled:opacity-60"
                    >
                      {isEmailing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Mail size={12} />
                      )}
                      {isEmailing ? "Sending..." : "Send"}
                    </button>
                    <button
                      onClick={() => setShowEmailDialog(false)}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  {emailError && (
                    <p className="mt-2 text-xs text-red-300">{emailError}</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right: Score Circle */}
            <div className="flex flex-col items-center">
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-sm">
                <CircularScore score={analysis.overallScore} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className={`mt-3 rounded-full px-4 py-1.5 text-xs font-bold ${getScoreBg(analysis.overallScore)} ${getScoreTextColor(analysis.overallScore)}`}
              >
                {getScoreLabel(analysis.overallScore)}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Dashboard Body                                                     */}
      {/* ================================================================== */}
      <div className="container-custom -mt-6 space-y-8">
        {/* ================================================================ */}
        {/* Section 2 : Key Metrics Row                                      */}
        {/* ================================================================ */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <MetricCard
            label="Net Worth"
            value={formatLakhsCrores(plan.netWorth?.netWorth ?? 0)}
            subtext={`Assets: ${formatLakhsCrores(plan.netWorth?.totalAssets ?? 0)}`}
            icon={Wallet}
            color="#3B82F6"
          />
          <MetricCard
            label="Monthly Surplus"
            value={formatINR(plan.expenses?.monthlySurplus ?? 0)}
            subtext="Available for investments"
            icon={TrendingUp}
            color="#059669"
          />
          <MetricCard
            label="Savings Rate"
            value={`${(analysis.savingsRate ?? 0).toFixed(1)}%`}
            subtext="Of monthly income"
            icon={PiggyBank}
            color="#8B5CF6"
          />
          <MetricCard
            label="Emergency Fund"
            value={`${(analysis.emergencyFundMonths ?? 0).toFixed(1)} months`}
            subtext={
              analysis.emergencyFundAdequacy === "excellent"
                ? "Well covered"
                : analysis.emergencyFundAdequacy === "adequate"
                  ? "Adequate coverage"
                  : analysis.emergencyFundAdequacy === "insufficient"
                    ? "Needs improvement"
                    : "Critical - build immediately"
            }
            icon={Shield}
            color={
              analysis.emergencyFundAdequacy === "excellent" ||
              analysis.emergencyFundAdequacy === "adequate"
                ? "#059669"
                : analysis.emergencyFundAdequacy === "insufficient"
                  ? "#F59E0B"
                  : "#DC2626"
            }
          />
        </motion.div>

        {/* ================================================================ */}
        {/* Section 2.5 : AI Analysis — Key Findings                        */}
        {/* ================================================================ */}
        {planInsights.length > 0 && (
          <motion.section variants={cardVariants}>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                <Sparkles size={20} className="text-blue-600" />
                AI Analysis — Key Findings
              </h2>
              <InsightEngine insights={planInsights} />
            </div>
          </motion.section>
        )}

        {/* ================================================================ */}
        {/* Section 3 : Score Breakdown                                      */}
        {/* ================================================================ */}
        <motion.section variants={cardVariants}>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Financial Health Scores
          </h2>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <MiniScore
              score={analysis.emergencyFundScore}
              label="Emergency"
              icon={Shield}
              description={scoreDescriptions.emergency}
            />
            <MiniScore
              score={analysis.insuranceScore}
              label="Insurance"
              icon={Heart}
              description={scoreDescriptions.insurance}
            />
            <MiniScore
              score={analysis.investmentScore}
              label="Investment"
              icon={TrendingUp}
              description={scoreDescriptions.investment}
            />
            <MiniScore
              score={analysis.debtScore}
              label="Debt"
              icon={Receipt}
              description={scoreDescriptions.debt}
            />
            <MiniScore
              score={analysis.retirementScore}
              label="Retirement"
              icon={Landmark}
              description={scoreDescriptions.retirement}
            />
            <MiniScore
              score={analysis.taxEfficiencyScore}
              label="Tax"
              icon={BadgeIndianRupee}
              description={scoreDescriptions.tax}
            />
          </motion.div>
        </motion.section>

        {/* ================================================================ */}
        {/* Section 3b : How You Compare — Behavioral Nudges                 */}
        {/* ================================================================ */}
        {behavioralNudges.length > 0 && (
          <motion.section variants={cardVariants}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
              <Users size={20} className="text-violet-600" />
              How You Compare
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {behavioralNudges.slice(0, 4).map((nudge) => (
                <NudgeCard key={nudge.id} nudge={nudge} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ================================================================ */}
        {/* Section 4 : Insurance Gap Analysis                               */}
        {/* ================================================================ */}
        <motion.section variants={cardVariants}>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Insurance Gap Analysis
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Term Insurance */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border p-6 shadow-sm ${
                analysis.termInsuranceGap > 0
                  ? "border-red-100 bg-red-50/30"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    analysis.termInsuranceGap > 0
                      ? "bg-red-100"
                      : "bg-emerald-100"
                  }`}
                >
                  <Shield
                    size={20}
                    className={
                      analysis.termInsuranceGap > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Term Life Insurance
                  </h3>
                  {analysis.termInsuranceGap > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                      <AlertTriangle size={12} /> Gap detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> Adequately covered
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Recommended Cover</span>
                  <span className="font-bold text-gray-900">
                    {formatLakhsCrores(analysis.recommendedTermCover)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current Cover</span>
                  <span className="font-bold text-gray-900">
                    {formatLakhsCrores(
                      analysis.recommendedTermCover - analysis.termInsuranceGap
                    )}
                  </span>
                </div>
                {analysis.termInsuranceGap > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-red-600">Gap</span>
                    <span className="font-extrabold text-red-600">
                      {formatLakhsCrores(analysis.termInsuranceGap)}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    className={`h-full rounded-full ${
                      analysis.termInsuranceGap > 0
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, analysis.recommendedTermCover > 0 ? ((analysis.recommendedTermCover - analysis.termInsuranceGap) / analysis.recommendedTermCover) * 100 : 0)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>

              {analysis.termInsuranceGap > 0 && (
                <Link
                  href="/insurance/life"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  Get Term Quote <ArrowRight size={14} />
                </Link>
              )}
            </motion.div>

            {/* Health Insurance */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border p-6 shadow-sm ${
                analysis.healthInsuranceGap > 0
                  ? "border-red-100 bg-red-50/30"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    analysis.healthInsuranceGap > 0
                      ? "bg-red-100"
                      : "bg-emerald-100"
                  }`}
                >
                  <Heart
                    size={20}
                    className={
                      analysis.healthInsuranceGap > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Health Insurance
                  </h3>
                  {analysis.healthInsuranceGap > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                      <AlertTriangle size={12} /> Gap detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> Adequately covered
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Recommended Cover</span>
                  <span className="font-bold text-gray-900">
                    {formatLakhsCrores(analysis.recommendedHealthCover)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current Cover</span>
                  <span className="font-bold text-gray-900">
                    {formatLakhsCrores(
                      analysis.recommendedHealthCover -
                        analysis.healthInsuranceGap
                    )}
                  </span>
                </div>
                {analysis.healthInsuranceGap > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-red-600">Gap</span>
                    <span className="font-extrabold text-red-600">
                      {formatLakhsCrores(analysis.healthInsuranceGap)}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    className={`h-full rounded-full ${
                      analysis.healthInsuranceGap > 0
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, analysis.recommendedHealthCover > 0 ? ((analysis.recommendedHealthCover - analysis.healthInsuranceGap) / analysis.recommendedHealthCover) * 100 : 0)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>

              {analysis.healthInsuranceGap > 0 && (
                <Link
                  href="/insurance/health"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  Get Health Quote <ArrowRight size={14} />
                </Link>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* Section 5 : Goal Roadmap                                         */}
        {/* ================================================================ */}
        {analysis.goalFeasibility.length > 0 && (
          <motion.section variants={cardVariants}>
            <h2 className="mb-4 text-lg font-extrabold text-gray-900">
              Goal Roadmap
            </h2>
            <motion.div
              variants={containerVariants}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {analysis.goalFeasibility.map((goal) => {
                const GoalIcon =
                  GOAL_ICONS[goal.goalType] || GOAL_ICONS.custom;

                return (
                  <motion.div
                    key={goal.goalId}
                    variants={cardVariants}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    {/* Goal header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                          <GoalIcon size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900">
                            {goal.goalName}
                          </h4>
                          <span className="text-[11px] font-medium text-gray-400">
                            {goal.yearsRemaining} year
                            {goal.yearsRemaining !== 1 ? "s" : ""} remaining
                          </span>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          goal.isOnTrack
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {goal.isOnTrack ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <XCircle size={10} />
                        )}
                        {goal.isOnTrack ? "On Track" : "Off Track"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Target (inflation-adjusted)
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatLakhsCrores(goal.inflatedTarget)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Required SIP</span>
                        <span className="font-bold text-blue-600">
                          {formatINR(goal.requiredMonthlySIP)}/mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Suggested Fund</span>
                        <span className="font-semibold text-gray-700">
                          {goal.suggestedFundCategory}
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Current projection</span>
                        <span>
                          {goal.inflatedTarget > 0
                            ? `${Math.min(100, Math.round((goal.currentProjection / goal.inflatedTarget) * 100))}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          className={`h-full rounded-full ${goal.isOnTrack ? "bg-emerald-500" : "bg-red-400"}`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, goal.inflatedTarget > 0 ? (goal.currentProjection / goal.inflatedTarget) * 100 : 0)}%`,
                          }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/mutual-funds"
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                    >
                      Start SIP <ChevronRight size={14} />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        )}

        {/* ================================================================ */}
        {/* Section 6 : Asset Allocation                                     */}
        {/* ================================================================ */}
        <motion.section variants={cardVariants}>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Asset Allocation
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current Allocation */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h3 className="mb-1 text-sm font-extrabold text-gray-900">
                Current Allocation
              </h3>
              <p className="mb-4 text-xs text-gray-400">
                Based on your existing portfolio
              </p>
              {currentAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={currentAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {currentAllocationData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<PieTooltip />}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs font-medium text-gray-600">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
                  No allocation data
                </div>
              )}
            </motion.div>

            {/* Recommended Allocation */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h3 className="mb-1 text-sm font-extrabold text-gray-900">
                Recommended Allocation
              </h3>
              <p className="mb-4 text-xs text-gray-400">
                Based on your risk profile & goals
              </p>
              {recommendedAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={recommendedAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {recommendedAllocationData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<PieTooltip />}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs font-medium text-gray-600">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
                  No allocation data
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* Section 7 : Tax Optimization                                     */}
        {/* ================================================================ */}
        <motion.section variants={cardVariants}>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Tax Optimization
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Regime & Savings summary */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  Recommended Regime
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    analysis.recommendedRegime === "old"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {analysis.recommendedRegime === "old"
                    ? "Old Regime"
                    : "New Regime"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  Potential Savings
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  {formatINR(analysis.potentialTaxSavings)}
                </span>
              </div>
            </div>

            {/* Tax Opportunities */}
            {analysis.taxOpportunities.length > 0 && (
              <div className="space-y-4">
                {analysis.taxOpportunities.map((opp, idx) => (
                  <motion.div
                    key={idx}
                    variants={cardVariants}
                    className="rounded-xl border border-gray-50 bg-gray-50/50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {opp.section}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">
                            {opp.description}
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Suggested:{" "}
                          <span className="font-semibold text-gray-700">
                            {opp.suggestedProduct}
                          </span>
                        </p>
                      </div>
                      {opp.productLink && (
                        <Link
                          href={opp.productLink}
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-blue-700"
                        >
                          Invest <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>

                    {/* Usage bar */}
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400">
                        <span>
                          Used: {formatINR(opp.currentUsage)} /{" "}
                          {formatINR(opp.maxLimit)}
                        </span>
                        <span>
                          Unused: {formatINR(opp.unusedLimit)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                          className="h-full rounded-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${opp.maxLimit > 0 ? Math.min(100, (opp.currentUsage / opp.maxLimit) * 100) : 0}%`,
                          }}
                          transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                        />
                      </div>
                    </div>

                    {opp.potentialSaving > 0 && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600">
                        Save up to {formatINR(opp.potentialSaving)} in taxes
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {analysis.taxOpportunities.length === 0 && (
              <p className="text-sm text-gray-400">
                No additional tax optimization opportunities identified. Your
                tax planning appears well-optimized.
              </p>
            )}
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* Section 8 : Action Plan                                          */}
        {/* ================================================================ */}
        {sortedActions.length > 0 && (
          <motion.section variants={cardVariants}>
            <h2 className="mb-4 text-lg font-extrabold text-gray-900">
              Action Plan
            </h2>
            <motion.div variants={containerVariants} className="space-y-3">
              {sortedActions.map((action) => (
                <motion.div key={action.id} variants={cardVariants}>
                  <ExecutionCard action={action} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ================================================================ */}
        {/* Section 8b : What-If Scenario Modeler                            */}
        {/* ================================================================ */}
        <motion.section variants={cardVariants}>
          <ScenarioModeler />
        </motion.section>

        {/* ================================================================ */}
        {/* Section 9 : Bottom CTAs                                          */}
        {/* ================================================================ */}
        <motion.section
          variants={cardVariants}
          className="rounded-2xl bg-gradient-to-r from-primary-700 via-primary-500 to-secondary-600 p-8 lg:p-10"
        >
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-extrabold text-white">
              Ready to take action?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-sm text-white/60">
              Implement your personalized financial plan today. Our advisors are
              here to help you every step of the way.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isAuthenticated && planDbId ? (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 transition hover:bg-gray-50 sm:w-auto disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  {isDownloading ? "Generating PDF..." : "Download Detailed Report"}
                </button>
              ) : (
                <Link
                  href="/report"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 transition hover:bg-gray-50 sm:w-auto"
                >
                  <FileText size={16} /> View Detailed Report
                </Link>
              )}
              <Link
                href="/contact"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
              >
                <MessageCircle size={16} /> Book Free Advisory Session
              </Link>
              <Link
                href="/mutual-funds"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 sm:w-auto"
              >
                <TrendingUp size={16} /> Start Implementing
              </Link>
            </div>

            {/* WhatsApp shortcut */}
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20I%20just%20generated%20my%20financial%20plan%20on%20Trustner%20and%20would%20like%20to%20speak%20with%20an%20advisor."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-white/80"
            >
              <Phone size={12} /> Or message us on WhatsApp
            </a>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
