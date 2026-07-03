/**
 * Portfolio Check-Up — self-reported, directional health-signal quiz.
 *
 * IMPORTANT — this is NOT the Portfolio Diagnostic (PD). The PD (at
 * /admin/portfolio-diagnostic) is an RM-mediated tool that reviews a real,
 * uploaded CAS statement. This module powers a much lighter public quiz:
 * a handful of self-reported, bucketed questions that produce a purely
 * directional signal, with the goal of funnelling the prospect into
 * requesting the real Portfolio Diagnostic from their Relationship Manager.
 *
 * It must never claim to analyze actual holdings data, never give a
 * fund-specific or buy/sell/switch instruction, and never disparage Direct
 * or Regular plans. Every flag stays at the structural/behavioral level.
 *
 * Pure, framework-free, unit-testable — no React here.
 */

export interface AnswerOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  question: string;
  options: AnswerOption[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'corpus',
    question: 'Roughly how much do you currently have invested in mutual funds?',
    options: [
      { id: 'under10L', label: 'Under ₹10 lakh' },
      { id: '10to25L', label: '₹10 lakh – ₹25 lakh' },
      { id: '25to50L', label: '₹25 lakh – ₹50 lakh' },
      { id: '50Lto1Cr', label: '₹50 lakh – ₹1 crore' },
      { id: 'over1Cr', label: 'Over ₹1 crore' },
    ],
  },
  {
    id: 'fundCount',
    question: 'How many different mutual fund schemes do you hold?',
    options: [
      { id: '1to3', label: '1 – 3 schemes' },
      { id: '4to7', label: '4 – 7 schemes' },
      { id: '8to15', label: '8 – 15 schemes' },
      { id: '16plus', label: '16 or more schemes' },
    ],
  },
  {
    id: 'concentration',
    question: 'What share of your total investment sits in your single largest fund?',
    options: [
      { id: 'under15', label: 'Under 15%' },
      { id: '15to30', label: '15% – 30%' },
      { id: '30to50', label: '30% – 50%' },
      { id: 'over50', label: 'Over 50%' },
    ],
  },
  {
    id: 'lastReview',
    question: 'When did a professional last review your full portfolio?',
    options: [
      { id: 'withinYear', label: 'Within the last year' },
      { id: 'oneToTwoYears', label: '1 – 2 years ago' },
      { id: 'overTwoYears', label: 'Over 2 years ago' },
      { id: 'never', label: 'Never' },
    ],
  },
  {
    id: 'planAwareness',
    question: 'Do you know whether your funds are in Direct or Regular plans?',
    options: [
      { id: 'yesDirect', label: 'Yes, mine are Direct plans' },
      { id: 'yesRegular', label: 'Yes, mine are Regular plans' },
      { id: 'notSure', label: 'Not sure' },
    ],
  },
  {
    id: 'goalLinked',
    question: "Is this money linked to a specific goal (retirement, child's education, etc.)?",
    options: [
      { id: 'clearlyLinked', label: 'Yes, clearly linked to a goal' },
      { id: 'looselyLinked', label: 'Loosely linked' },
      { id: 'no', label: 'No' },
      { id: 'notSure', label: 'Not sure' },
    ],
  },
  {
    id: 'emergencyFund',
    question: 'Do you have a separate emergency fund (6+ months of expenses) outside these investments?',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'partially', label: 'Partially' },
      { id: 'no', label: 'No' },
    ],
  },
];

export type PortfolioCheckAnswers = Record<string, string>;

export type PortfolioHealthBand = 'green' | 'amber' | 'red';

export interface PortfolioHealthSignal {
  score: number;
  band: PortfolioHealthBand;
  flags: string[];
}

// ---------------------------------------------------------------------------
// Scoring rubric — named constants so every deduction is auditable.
// Starting score is 100; deductions are subtracted per triggered rule below.
// ---------------------------------------------------------------------------

const STARTING_SCORE = 100;

const SCORE_DEDUCTION = {
  HIGH_FUND_COUNT_LOW_CORPUS: 15,
  VERY_HIGH_FUND_COUNT_EXTRA: 10,
  CONCENTRATION_MODERATE: 10,
  CONCENTRATION_HIGH: 25,
  LAST_REVIEW_ONE_TO_TWO_YEARS: 10,
  LAST_REVIEW_OVER_TWO_YEARS: 20,
  LAST_REVIEW_NEVER: 25,
  PLAN_AWARENESS_NOT_SURE: 10,
  GOAL_LINKED_NO: 10,
  GOAL_LINKED_NOT_SURE: 5,
  EMERGENCY_FUND_NONE: 15,
  EMERGENCY_FUND_PARTIAL: 7,
} as const;

const FLAG_MESSAGE = {
  HIGH_FUND_COUNT_LOW_CORPUS:
    'A high number of funds relative to your corpus can mean unnecessary overlap.',
  VERY_HIGH_FUND_COUNT_EXTRA:
    '16+ funds is hard to track and often means duplication.',
  CONCENTRATION_MODERATE:
    'Over 30% in one fund is a concentration risk.',
  CONCENTRATION_HIGH:
    'More than half your money is in a single fund — a significant concentration risk.',
  LAST_REVIEW_ONE_TO_TWO_YEARS:
    "It's been over a year since a full review.",
  LAST_REVIEW_OVER_TWO_YEARS:
    'Over 2 years without a review — market and life changes may mean your allocation no longer fits.',
  LAST_REVIEW_NEVER:
    'Your portfolio has never had a professional review.',
  PLAN_AWARENESS_NOT_SURE:
    'Not knowing your plan type is worth checking — it affects who supports you when markets get volatile.',
  GOAL_LINKED_NO:
    'Investments without a linked goal are harder to size and time correctly.',
  GOAL_LINKED_NOT_SURE:
    "It's worth confirming whether this money is linked to a specific goal.",
  EMERGENCY_FUND_NONE:
    'No separate emergency fund means market dips can force you to redeem investments at the wrong time.',
  EMERGENCY_FUND_PARTIAL:
    'A partial emergency fund helps, but may not fully protect your investments from being tapped early.',
} as const;

const BAND_THRESHOLD = {
  GREEN_MIN: 75,
  AMBER_MIN: 45,
} as const;

const LOW_CORPUS_IDS = new Set(['under10L', '10to25L']);
const HIGH_FUND_COUNT_IDS = new Set(['8to15', '16plus']);

/**
 * Compute a purely directional, self-reported health signal from the quiz
 * answers. This is NOT an analysis of actual holdings — it only reflects
 * what the user themselves selected.
 */
export function computePortfolioHealthSignal(
  answers: PortfolioCheckAnswers
): PortfolioHealthSignal {
  let score = STARTING_SCORE;
  const flags: string[] = [];

  const { corpus, fundCount, concentration, lastReview, planAwareness, goalLinked, emergencyFund } =
    answers;

  if (HIGH_FUND_COUNT_IDS.has(fundCount) && LOW_CORPUS_IDS.has(corpus)) {
    score -= SCORE_DEDUCTION.HIGH_FUND_COUNT_LOW_CORPUS;
    flags.push(FLAG_MESSAGE.HIGH_FUND_COUNT_LOW_CORPUS);
  }

  if (fundCount === '16plus') {
    score -= SCORE_DEDUCTION.VERY_HIGH_FUND_COUNT_EXTRA;
    flags.push(FLAG_MESSAGE.VERY_HIGH_FUND_COUNT_EXTRA);
  }

  if (concentration === '30to50') {
    score -= SCORE_DEDUCTION.CONCENTRATION_MODERATE;
    flags.push(FLAG_MESSAGE.CONCENTRATION_MODERATE);
  } else if (concentration === 'over50') {
    score -= SCORE_DEDUCTION.CONCENTRATION_HIGH;
    flags.push(FLAG_MESSAGE.CONCENTRATION_HIGH);
  }

  if (lastReview === 'oneToTwoYears') {
    score -= SCORE_DEDUCTION.LAST_REVIEW_ONE_TO_TWO_YEARS;
    flags.push(FLAG_MESSAGE.LAST_REVIEW_ONE_TO_TWO_YEARS);
  } else if (lastReview === 'overTwoYears') {
    score -= SCORE_DEDUCTION.LAST_REVIEW_OVER_TWO_YEARS;
    flags.push(FLAG_MESSAGE.LAST_REVIEW_OVER_TWO_YEARS);
  } else if (lastReview === 'never') {
    score -= SCORE_DEDUCTION.LAST_REVIEW_NEVER;
    flags.push(FLAG_MESSAGE.LAST_REVIEW_NEVER);
  }

  if (planAwareness === 'notSure') {
    score -= SCORE_DEDUCTION.PLAN_AWARENESS_NOT_SURE;
    flags.push(FLAG_MESSAGE.PLAN_AWARENESS_NOT_SURE);
  }

  if (goalLinked === 'no') {
    score -= SCORE_DEDUCTION.GOAL_LINKED_NO;
    flags.push(FLAG_MESSAGE.GOAL_LINKED_NO);
  } else if (goalLinked === 'notSure') {
    score -= SCORE_DEDUCTION.GOAL_LINKED_NOT_SURE;
    flags.push(FLAG_MESSAGE.GOAL_LINKED_NOT_SURE);
  }

  if (emergencyFund === 'no') {
    score -= SCORE_DEDUCTION.EMERGENCY_FUND_NONE;
    flags.push(FLAG_MESSAGE.EMERGENCY_FUND_NONE);
  } else if (emergencyFund === 'partially') {
    score -= SCORE_DEDUCTION.EMERGENCY_FUND_PARTIAL;
    flags.push(FLAG_MESSAGE.EMERGENCY_FUND_PARTIAL);
  }

  score = Math.max(0, Math.min(100, score));

  const band: PortfolioHealthBand =
    score >= BAND_THRESHOLD.GREEN_MIN ? 'green' : score >= BAND_THRESHOLD.AMBER_MIN ? 'amber' : 'red';

  return { score, band, flags };
}

/**
 * Band-level headline copy — compliance-reviewed wording, do not alter.
 */
export const BAND_HEADLINE: Record<PortfolioHealthBand, string> = {
  green:
    "Your portfolio structure looks reasonably healthy from what you've shared. A full Portfolio Diagnostic with your RM can confirm the details and fine-tune it further.",
  amber:
    'A few things here are worth a closer look. A full Portfolio Diagnostic with your RM — using your actual statement, not just these answers — will show exactly where.',
  red:
    "Several flags came up. This is based only on your own answers, not your actual holdings — but it's a strong signal that a full Portfolio Diagnostic with your RM would be valuable.",
};
