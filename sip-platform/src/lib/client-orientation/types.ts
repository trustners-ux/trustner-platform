/**
 * Client Orientation Agent — Type Definitions
 *
 * One-time onboarding pack for a new client family: welcome letter,
 * risk profile result, goal statement.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { AgentWorkflowStatus } from '@/lib/trustner-agent-platform/types';

export type GoalType =
  | 'Retirement'
  | 'Child Education'
  | 'Child Marriage'
  | 'House Purchase'
  | 'House Down Payment'
  | 'Vacation'
  | 'Emergency Fund'
  | 'Wealth Creation'
  | 'Business Capital'
  | 'Other';

export type RiskCategoryName =
  | 'Conservative'
  | 'Moderate'
  | 'Moderately Aggressive'
  | 'Aggressive'
  | 'Very Aggressive';

export type CommunicationChannel = 'Email' | 'WhatsApp' | 'Phone' | 'In-Person';
export type ReviewFrequency = 'Quarterly' | 'Half-Yearly' | 'Annual';

// ─────────────────────────────────────────────────────────────────
// RISK QUESTIONNAIRE
// ─────────────────────────────────────────────────────────────────

export interface RiskQuestion {
  code: string;
  text: string;
  options: Array<{ label: string; score: number }>;
}

export interface RiskResponse {
  questionCode: string;
  questionText: string;
  responseText: string;
  responseScore: number;
  responseOrder?: number;
}

/**
 * Standard 15-question Trustner risk profiler. Scoring:
 *   < 25:    Conservative
 *   25-40:   Moderate
 *   40-60:   Moderately Aggressive
 *   60-80:   Aggressive
 *   80+:     Very Aggressive
 */
export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    code: 'Q01',
    text: 'What is your investment horizon?',
    options: [
      { label: 'Less than 1 year', score: 1 },
      { label: '1-3 years', score: 2 },
      { label: '3-5 years', score: 3 },
      { label: '5-10 years', score: 4 },
      { label: '> 10 years', score: 5 },
    ],
  },
  {
    code: 'Q02',
    text: 'How would you react to a 20% drop in portfolio value in 6 months?',
    options: [
      { label: 'Sell everything immediately', score: 1 },
      { label: 'Sell some to limit losses', score: 2 },
      { label: 'Hold and wait', score: 3 },
      { label: 'Use the dip to invest more', score: 4 },
      { label: 'Significantly increase allocation', score: 5 },
    ],
  },
  // ... 13 more questions seeded by the engine
];

// ─────────────────────────────────────────────────────────────────
// FINANCIAL GOALS
// ─────────────────────────────────────────────────────────────────

export interface FinancialGoal {
  id?: number;
  goalType: GoalType;
  customGoalName?: string;
  targetYear: number;
  targetCorpusTodayValueInr: number;
  inflationAssumptionPct: number;
  targetCorpusFutureValueInr?: number;
  expectedReturnPct: number;
  requiredMonthlySipInr?: number;
  existingCorpusInr: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// ORIENTATION (top-level)
// ─────────────────────────────────────────────────────────────────

export interface ClientOrientation {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;

  // Risk profile
  riskScore: number;
  riskCategory: RiskCategoryName;
  riskQuestionnaireCompletedAt?: string;
  riskResponses: RiskResponse[];

  // Cash flow
  monthlyHouseholdIncomeInr?: number;
  monthlyHouseholdExpensesInr?: number;
  monthlyExistingSipsInr?: number;
  monthlyEmisInr?: number;
  emergencyFundMonths?: number;
  surplusForNewSipsInr?: number;

  // Family
  numDependents: number;
  horizonDecisionMaker?: string;
  investmentExperienceYears?: number;
  priorAdvisorExperience?: string;

  // Communication preferences
  prefChannel?: CommunicationChannel;
  prefReviewFrequency?: ReviewFrequency;
  prefLanguage: string;

  // Goals
  goals: FinancialGoal[];

  // Outputs
  welcomePackPdfUrl?: string;
  riskProfilePdfUrl?: string;
  goalStatementPdfUrl?: string;
  clientSignedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────

export interface OrientationListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  riskCategory: RiskCategoryName | null;
  numGoals: number;
  clientSigned: boolean;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// RISK SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────────

export function computeRiskCategory(score: number): RiskCategoryName {
  if (score < 25) return 'Conservative';
  if (score < 40) return 'Moderate';
  if (score < 60) return 'Moderately Aggressive';
  if (score < 80) return 'Aggressive';
  return 'Very Aggressive';
}

// ─────────────────────────────────────────────────────────────────
// GOAL CORPUS MATH
// ─────────────────────────────────────────────────────────────────

/**
 * Future value of a goal corpus after inflation.
 */
export function inflateCorpus(input: {
  todayValueInr: number;
  years: number;
  inflationPct: number;
}): number {
  return Math.round(input.todayValueInr * Math.pow(1 + input.inflationPct / 100, input.years));
}

/**
 * Required monthly SIP to reach a future-value target given
 * expected returns. Uses standard SIP future-value formula:
 *   FV = P × [((1+r)^n − 1) / r] × (1+r)
 * solved for P (monthly SIP).
 */
export function requiredMonthlySip(input: {
  futureValueInr: number;
  years: number;
  expectedReturnPct: number;
  existingCorpusInr?: number;
}): number {
  const r = input.expectedReturnPct / 100 / 12; // monthly rate
  const n = input.years * 12;
  if (r === 0) return Math.ceil(input.futureValueInr / n);

  // FV from existing corpus
  const existingFv = (input.existingCorpusInr ?? 0) * Math.pow(1 + r, n);
  const gap = Math.max(0, input.futureValueInr - existingFv);

  // P = FV / [((1+r)^n − 1) / r × (1+r)]
  const denominator = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return Math.ceil(gap / denominator);
}
