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
 * Trustner risk profiler. Each question scores 1-5; the category is derived
 * from the score normalised to the achievable range (see computeRiskCategory),
 * so it stays correct no matter how many questions the questionnaire carries.
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
  {
    code: 'Q03',
    text: 'What is your investment experience?',
    options: [
      { label: 'None — first time investor', score: 1 },
      { label: 'Some — bank deposits, PPF', score: 2 },
      { label: 'Moderate — mutual funds for 2-5 years', score: 3 },
      { label: 'Good — diversified portfolio for 5+ years', score: 4 },
      { label: 'Extensive — multiple asset classes, derivatives', score: 5 },
    ],
  },
  {
    code: 'Q04',
    text: 'What is your primary investment objective?',
    options: [
      { label: 'Preserve capital — safety above all', score: 1 },
      { label: 'Steady income with low volatility', score: 2 },
      { label: 'Balanced growth and income', score: 3 },
      { label: 'Long-term capital appreciation', score: 4 },
      { label: 'Aggressive wealth creation', score: 5 },
    ],
  },
  {
    code: 'Q05',
    text: 'What portion of your savings does this investment represent?',
    options: [
      { label: 'Almost all my savings', score: 1 },
      { label: 'A large portion (>50%)', score: 2 },
      { label: 'About half', score: 3 },
      { label: 'A small portion (<25%)', score: 4 },
      { label: 'Only surplus / disposable funds', score: 5 },
    ],
  },
  {
    code: 'Q06',
    text: 'How would you describe your monthly income stability?',
    options: [
      { label: 'Highly variable / irregular', score: 1 },
      { label: 'Mostly stable with occasional fluctuations', score: 2 },
      { label: 'Stable salary with annual variations', score: 3 },
      { label: 'Very stable salary + side income', score: 4 },
      { label: 'Multiple stable income sources', score: 5 },
    ],
  },
  {
    code: 'Q07',
    text: 'Imagine your ₹10 lakh investment grows to ₹13 lakh in 1 year, then drops to ₹8 lakh in the next year. What do you do?',
    options: [
      { label: 'Exit completely — preserve what is left', score: 1 },
      { label: 'Move to safer instruments', score: 2 },
      { label: 'Stay invested but stop additional investments', score: 3 },
      { label: 'Continue SIP — markets recover', score: 4 },
      { label: 'Invest a lump sum to average down', score: 5 },
    ],
  },
  {
    code: 'Q08',
    text: 'How important is liquidity (ability to withdraw quickly)?',
    options: [
      { label: 'Critical — may need funds in 6 months', score: 1 },
      { label: 'Very important — may need in 1-2 years', score: 2 },
      { label: 'Somewhat important — emergency reserve elsewhere', score: 3 },
      { label: 'Not very important — long-term horizon', score: 4 },
      { label: 'Not at all — funds set aside for 10+ years', score: 5 },
    ],
  },
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

/** Per-question score bounds (every risk question uses a 1-5 option scale). */
export const RISK_MIN_PER_Q = 1;
export const RISK_MAX_PER_Q = 5;
/** Max achievable score on the full questionnaire (sum of each question's top option). */
export const RISK_MAX_SCORE = RISK_QUESTIONS.reduce(
  (s, q) => s + Math.max(...q.options.map((o) => o.score)),
  0
);

/**
 * Map a raw risk score to a category. The bands were originally hard-coded for a
 * 15-question profiler (max 75) but the questionnaire was cut to 8 questions
 * (max 40), which made 'Aggressive'/'Very Aggressive' mathematically unreachable.
 * We now normalise the score to the achievable range so all five categories are
 * reachable regardless of question count.
 *
 * @param maxScore  the max achievable for the answered set (defaults to the full
 *                  questionnaire). Pass `numAnswered * RISK_MAX_PER_Q` when a
 *                  partial set is scored so the normalisation stays honest.
 */
export function computeRiskCategory(
  score: number,
  maxScore: number = RISK_MAX_SCORE
): RiskCategoryName {
  const minScore = (maxScore / RISK_MAX_PER_Q) * RISK_MIN_PER_Q; // proportional floor
  const range = Math.max(1, maxScore - minScore);
  const pct = ((score - minScore) / range) * 100;
  if (pct < 20) return 'Conservative';
  if (pct < 40) return 'Moderate';
  if (pct < 60) return 'Moderately Aggressive';
  if (pct < 80) return 'Aggressive';
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
