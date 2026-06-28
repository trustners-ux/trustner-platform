/**
 * Exit interview question set (12 questions).
 *
 * Answers are stored in hr_exit_interview.answers JSONB keyed by question id.
 * Three convenience columns on the table mirror specific answers:
 *   - overall_rating  ← average of q7/q8/q9 OR set explicitly
 *   - would_rejoin    ← q10
 *   - would_recommend ← q11
 */

export type ExitInterviewQuestionType =
  | 'multi_select'
  | 'open_text'
  | 'rating_1_5'
  | 'yes_no'
  | 'yes_no_maybe';

export interface ExitInterviewQuestion {
  id: string;
  order: number;
  type: ExitInterviewQuestionType;
  prompt: string;
  options?: readonly string[];        // for multi_select / yes_no_maybe / yes_no
  required: boolean;
  helpText?: string;
}

export const EXIT_INTERVIEW_QUESTIONS: readonly ExitInterviewQuestion[] = [
  {
    id: 'q1_primary_reason',
    order: 1,
    type: 'multi_select',
    prompt: 'What is the primary reason you are leaving Trustner?',
    required: true,
    options: [
      'better_opportunity',
      'compensation',
      'work_life_balance',
      'growth',
      'manager',
      'role_fit',
      'relocation',
      'family',
      'health',
      'other',
    ],
  },
  {
    id: 'q2_enjoyed_most',
    order: 2,
    type: 'open_text',
    prompt: 'What did you enjoy most about working at Trustner?',
    required: true,
  },
  {
    id: 'q3_frustrated_most',
    order: 3,
    type: 'open_text',
    prompt: 'What frustrated you most? Be candid — this stays with HR + founders only.',
    required: true,
  },
  {
    id: 'q4_role_clarity',
    order: 4,
    type: 'yes_no_maybe',
    prompt: 'Were the expectations of your role made clear to you?',
    required: true,
    options: ['yes', 'no', 'maybe'],
  },
  {
    id: 'q5_learning',
    order: 5,
    type: 'yes_no_maybe',
    prompt: 'Did you get enough opportunities to learn and grow at Trustner?',
    required: true,
    options: ['yes', 'no', 'maybe'],
  },
  {
    id: 'q6_compensation_competitive',
    order: 6,
    type: 'yes_no_maybe',
    prompt: 'Was your compensation competitive vs. similar roles in the industry?',
    required: true,
    options: ['yes', 'no', 'maybe'],
  },
  {
    id: 'q7_rate_management',
    order: 7,
    type: 'rating_1_5',
    prompt: 'Rate your direct manager (1 = poor, 5 = excellent).',
    required: true,
  },
  {
    id: 'q8_rate_culture',
    order: 8,
    type: 'rating_1_5',
    prompt: 'Rate the work culture at Trustner (1 = poor, 5 = excellent).',
    required: true,
  },
  {
    id: 'q9_rate_growth',
    order: 9,
    type: 'rating_1_5',
    prompt: 'Rate your growth opportunity at Trustner (1 = poor, 5 = excellent).',
    required: true,
  },
  {
    id: 'q10_would_rejoin',
    order: 10,
    type: 'yes_no_maybe',
    prompt: 'Would you consider re-joining Trustner if circumstances changed?',
    required: true,
    options: ['yes', 'no', 'maybe'],
  },
  {
    id: 'q11_would_recommend',
    order: 11,
    type: 'yes_no',
    prompt: 'Would you recommend Trustner to a friend as a place to work?',
    required: true,
    options: ['yes', 'no'],
  },
  {
    id: 'q12_open_feedback',
    order: 12,
    type: 'open_text',
    prompt: 'Open feedback to the founders — anything else you want them to know.',
    required: false,
    helpText: 'Optional. Used for systemic improvement; never tied back to your record.',
  },
];

export type ExitInterviewAnswers = Record<string, string | string[] | number | boolean | null>;
