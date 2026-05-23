'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Brain, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import type { RiskProfile, BehavioralProfile } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  riskData: RiskProfile;
  behavioralData: BehavioralProfile;
  onUpdateRisk: (updates: Partial<RiskProfile>) => void;
  onUpdateBehavioral: (updates: Partial<BehavioralProfile>) => void;
}

interface QuestionOption {
  label: string;
  score: number;
}

interface QuestionItem {
  question: string;
  options: QuestionOption[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_QUESTIONS: QuestionItem[] = [
  {
    question:
      'If the stock market drops 30% in one month and your portfolio loses Rs 3 lakh, what would you do?',
    options: [
      { label: 'Sell everything immediately to prevent further losses', score: 1 },
      { label: 'Wait patiently for the market to recover', score: 3 },
      { label: 'Invest more to buy at lower prices', score: 5 },
    ],
  },
  {
    question:
      'What is your primary investment horizon for the majority of your wealth?',
    options: [
      { label: 'Less than 3 years', score: 1 },
      { label: '3 to 5 years', score: 2 },
      { label: '5 to 10 years', score: 4 },
      { label: 'More than 10 years', score: 5 },
    ],
  },
  {
    question: 'What is your primary objective when investing money?',
    options: [
      { label: 'Protect my capital at all costs, even if returns are low', score: 1 },
      { label: 'Balanced growth with moderate ups and downs', score: 3 },
      {
        label: 'Aggressive growth — I can tolerate significant short-term losses',
        score: 5,
      },
    ],
  },
];

const BEHAVIORAL_QUESTIONS: QuestionItem[] = [
  {
    question: 'Do you track your monthly income and expenses regularly?',
    options: [
      { label: 'Yes, I maintain a detailed budget every month', score: 5 },
      { label: 'I have a rough idea but do not track actively', score: 3 },
      { label: 'No, I rarely check my spending', score: 1 },
    ],
  },
  {
    question:
      'When you see negative market news or a friend panic-selling, how does it influence your investment decisions?',
    options: [
      { label: 'It heavily influences me — I tend to follow the crowd', score: 1 },
      { label: 'I get anxious but usually stick to my plan', score: 3 },
      { label: 'It rarely affects me — I follow my long-term strategy', score: 5 },
    ],
  },
  {
    question:
      'How disciplined are you with your SIPs and regular investments during market downturns?',
    options: [
      { label: 'Very disciplined — I never stop or pause my SIPs', score: 5 },
      { label: 'Mostly disciplined — I may pause briefly but restart soon', score: 3 },
      { label: 'I often pause or stop SIPs when markets fall', score: 1 },
    ],
  },
];

const PAST_EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'None', description: 'Never invested before' },
  { value: 'limited', label: 'Limited', description: '1-2 years' },
  { value: 'moderate', label: 'Moderate', description: '3-5 years' },
  { value: 'extensive', label: 'Extensive', description: '5+ years' },
];

/** Map Q1 score -> marketDropReaction value */
const Q1_SCORE_TO_VALUE: Record<number, RiskProfile['marketDropReaction']> = {
  1: 'sell-immediately',
  3: 'wait-patiently',
  5: 'invest-more',
};

/** Map Q2 score -> investmentHorizon value */
const Q2_SCORE_TO_VALUE: Record<number, RiskProfile['investmentHorizon']> = {
  1: 'less-than-3',
  2: '3-to-5',
  4: '5-to-10',
  5: '10-plus',
};

/** Map Q3 score -> primaryObjective value */
const Q3_SCORE_TO_VALUE: Record<number, RiskProfile['primaryObjective']> = {
  1: 'capital-protection',
  3: 'balanced-growth',
  5: 'aggressive-growth',
};

/** Map marketDropReaction value -> score */
const VALUE_TO_Q1_SCORE: Record<RiskProfile['marketDropReaction'], number> = {
  'sell-immediately': 1,
  'wait-patiently': 3,
  'invest-more': 5,
};

/** Map investmentHorizon value -> score */
const VALUE_TO_Q2_SCORE: Record<RiskProfile['investmentHorizon'], number> = {
  'less-than-3': 1,
  '3-to-5': 2,
  '5-to-10': 4,
  '10-plus': 5,
};

/** Map primaryObjective value -> score */
const VALUE_TO_Q3_SCORE: Record<RiskProfile['primaryObjective'], number> = {
  'capital-protection': 1,
  'balanced-growth': 3,
  'aggressive-growth': 5,
};

/** Map pastExperience value -> score */
const EXPERIENCE_SCORE: Record<RiskProfile['pastExperience'], number> = {
  none: 1,
  limited: 2,
  moderate: 4,
  extensive: 5,
};

/** Map behavioral Q2 score -> marketNewsInfluence value */
const BQ2_SCORE_TO_VALUE: Record<number, BehavioralProfile['marketNewsInfluence']> = {
  1: 'heavily',
  3: 'somewhat',
  5: 'never',
};

/** Map behavioral Q3 score -> investmentDiscipline value */
const BQ3_SCORE_TO_VALUE: Record<number, BehavioralProfile['investmentDiscipline']> = {
  5: 'very-disciplined',
  3: 'mostly-disciplined',
  1: 'rarely',
};

/** Map marketNewsInfluence value -> score */
const VALUE_TO_BQ2_SCORE: Record<BehavioralProfile['marketNewsInfluence'], number> = {
  heavily: 1,
  somewhat: 3,
  rarely: 5,
  never: 5,
};

/** Map investmentDiscipline value -> score */
const VALUE_TO_BQ3_SCORE: Record<BehavioralProfile['investmentDiscipline'], number> = {
  'very-disciplined': 5,
  'mostly-disciplined': 3,
  sometimes: 1,
  rarely: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRiskCategory(score: number): RiskProfile['riskCategory'] {
  if (score <= 8) return 'conservative';
  if (score <= 14) return 'moderate';
  return 'aggressive';
}

function getRiskCategoryStyle(category: RiskProfile['riskCategory']) {
  switch (category) {
    case 'conservative':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' };
    case 'moderate':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' };
    case 'aggressive':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' };
  }
}

// ---------------------------------------------------------------------------
// Sub-component: Question Card with radio options
// ---------------------------------------------------------------------------

function QuestionCard({
  questionIndex,
  question,
  options,
  selectedScore,
  onSelect,
}: {
  questionIndex: number;
  question: string;
  options: QuestionOption[];
  selectedScore: number | null;
  onSelect: (score: number) => void;
}) {
  return (
    <div className="border border-surface-300 rounded-xl p-5 bg-white">
      <p className="text-sm font-semibold text-primary-700 mb-4">
        {questionIndex + 1}. {question}
      </p>
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedScore === opt.score;
          return (
            <button
              key={opt.score}
              type="button"
              onClick={() => onSelect(opt.score)}
              className={`w-full flex items-center gap-3 border rounded-lg p-3 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-brand bg-brand-50'
                  : 'border-slate-200 hover:border-brand-300'
              }`}
            >
              {/* Radio indicator */}
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'border-brand' : 'border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-brand" />
                )}
              </span>
              <span className="text-sm text-slate-700">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RiskBehaviorStep({
  riskData,
  behavioralData,
  onUpdateRisk,
  onUpdateBehavioral,
}: Props) {
  // ---- Derive selected scores from current data ----
  const riskQ1Score: number | null =
    riskData.marketDropReaction ? VALUE_TO_Q1_SCORE[riskData.marketDropReaction] : null;
  const riskQ2Score: number | null =
    riskData.investmentHorizon ? VALUE_TO_Q2_SCORE[riskData.investmentHorizon] : null;
  const riskQ3Score: number | null =
    riskData.primaryObjective ? VALUE_TO_Q3_SCORE[riskData.primaryObjective] : null;
  const experienceScore: number =
    riskData.pastExperience ? EXPERIENCE_SCORE[riskData.pastExperience] : 0;

  const behavQ2Score: number | null =
    behavioralData.marketNewsInfluence
      ? VALUE_TO_BQ2_SCORE[behavioralData.marketNewsInfluence]
      : null;
  const behavQ3Score: number | null =
    behavioralData.investmentDiscipline
      ? VALUE_TO_BQ3_SCORE[behavioralData.investmentDiscipline]
      : null;

  // ---- Compute live risk score ----
  const computedRiskScore = useMemo(() => {
    const q1 = riskQ1Score ?? 0;
    const q2 = riskQ2Score ?? 0;
    const q3 = riskQ3Score ?? 0;
    const exp = experienceScore;
    return q1 + q2 + q3 + exp;
  }, [riskQ1Score, riskQ2Score, riskQ3Score, experienceScore]);

  const computedRiskCategory = useMemo(
    () => getRiskCategory(computedRiskScore),
    [computedRiskScore]
  );

  // ---- Derive behavioral Q1 score ----
  // tracksExpensesMonthly is boolean so we reconstruct the 3-valued Q1 score
  // from the stored behavioralScore when possible.
  const behavQ1ScoreLocal = useMemo(() => {
    if (behavioralData.behavioralScore > 0 && behavQ2Score !== null && behavQ3Score !== null) {
      const derived = behavioralData.behavioralScore - behavQ2Score - behavQ3Score;
      if ([1, 3, 5].includes(derived)) return derived;
    }
    if (behavioralData.tracksExpensesMonthly === true) return 5;
    return null;
  }, [behavioralData.behavioralScore, behavioralData.tracksExpensesMonthly, behavQ2Score, behavQ3Score]);

  const computedBehavioralScore = useMemo(() => {
    const q1 = behavQ1ScoreLocal ?? 0;
    const q2 = behavQ2Score ?? 0;
    const q3 = behavQ3Score ?? 0;
    return q1 + q2 + q3;
  }, [behavQ1ScoreLocal, behavQ2Score, behavQ3Score]);

  // ---- Sync computed scores to parent ----
  useEffect(() => {
    if (
      computedRiskScore !== riskData.riskScore ||
      computedRiskCategory !== riskData.riskCategory
    ) {
      onUpdateRisk({ riskScore: computedRiskScore, riskCategory: computedRiskCategory });
    }
  }, [computedRiskScore, computedRiskCategory, riskData.riskScore, riskData.riskCategory, onUpdateRisk]);

  useEffect(() => {
    if (computedBehavioralScore !== behavioralData.behavioralScore) {
      onUpdateBehavioral({ behavioralScore: computedBehavioralScore });
    }
  }, [computedBehavioralScore, behavioralData.behavioralScore, onUpdateBehavioral]);

  // ---- Handlers ----
  const handleRiskQ1 = useCallback(
    (score: number) => {
      const value = Q1_SCORE_TO_VALUE[score];
      if (value) onUpdateRisk({ marketDropReaction: value });
    },
    [onUpdateRisk]
  );

  const handleRiskQ2 = useCallback(
    (score: number) => {
      const value = Q2_SCORE_TO_VALUE[score];
      if (value) onUpdateRisk({ investmentHorizon: value });
    },
    [onUpdateRisk]
  );

  const handleRiskQ3 = useCallback(
    (score: number) => {
      const value = Q3_SCORE_TO_VALUE[score];
      if (value) onUpdateRisk({ primaryObjective: value });
    },
    [onUpdateRisk]
  );

  const handleBehavQ1 = useCallback(
    (score: number) => {
      const tracks = score === 5;
      const q2 = behavQ2Score ?? 0;
      const q3 = behavQ3Score ?? 0;
      onUpdateBehavioral({
        tracksExpensesMonthly: tracks,
        behavioralScore: score + q2 + q3,
      });
    },
    [behavQ2Score, behavQ3Score, onUpdateBehavioral]
  );

  const handleBehavQ2 = useCallback(
    (score: number) => {
      const value = BQ2_SCORE_TO_VALUE[score];
      if (value) onUpdateBehavioral({ marketNewsInfluence: value });
    },
    [onUpdateBehavioral]
  );

  const handleBehavQ3 = useCallback(
    (score: number) => {
      const value = BQ3_SCORE_TO_VALUE[score];
      if (value) onUpdateBehavioral({ investmentDiscipline: value });
    },
    [onUpdateBehavioral]
  );

  // ---- Style for risk badge ----
  const categoryStyle = getRiskCategoryStyle(computedRiskCategory);

  return (
    <div className="space-y-6">
      {/* ================================================================
         A. Risk Tolerance
         ================================================================ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Brain className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider">
            Risk Tolerance
          </h3>
        </div>

        <div className="space-y-4">
          {/* Risk Q1 */}
          <QuestionCard
            questionIndex={0}
            question={RISK_QUESTIONS[0].question}
            options={RISK_QUESTIONS[0].options}
            selectedScore={riskQ1Score}
            onSelect={handleRiskQ1}
          />

          {/* Risk Q2 */}
          <QuestionCard
            questionIndex={1}
            question={RISK_QUESTIONS[1].question}
            options={RISK_QUESTIONS[1].options}
            selectedScore={riskQ2Score}
            onSelect={handleRiskQ2}
          />

          {/* Risk Q3 */}
          <QuestionCard
            questionIndex={2}
            question={RISK_QUESTIONS[2].question}
            options={RISK_QUESTIONS[2].options}
            selectedScore={riskQ3Score}
            onSelect={handleRiskQ3}
          />

          {/* Past Experience — uses RadioCards */}
          <div className="border border-surface-300 rounded-xl p-5 bg-white">
            <RadioCards
              label="4. How much investment experience do you have?"
              value={riskData.pastExperience}
              onChange={(val) =>
                onUpdateRisk({
                  pastExperience: val as RiskProfile['pastExperience'],
                })
              }
              options={PAST_EXPERIENCE_OPTIONS}
              columns={4}
            />
          </div>
        </div>
      </section>

      {/* ================================================================
         B. Investment Behavior
         ================================================================ */}
      <section className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Eye className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider">
            Investment Behavior
          </h3>
        </div>

        <div className="space-y-4">
          {/* Behavioral Q1 */}
          <QuestionCard
            questionIndex={0}
            question={BEHAVIORAL_QUESTIONS[0].question}
            options={BEHAVIORAL_QUESTIONS[0].options}
            selectedScore={behavQ1ScoreLocal}
            onSelect={handleBehavQ1}
          />

          {/* Behavioral Q2 */}
          <QuestionCard
            questionIndex={1}
            question={BEHAVIORAL_QUESTIONS[1].question}
            options={BEHAVIORAL_QUESTIONS[1].options}
            selectedScore={behavQ2Score}
            onSelect={handleBehavQ2}
          />

          {/* Behavioral Q3 */}
          <QuestionCard
            questionIndex={2}
            question={BEHAVIORAL_QUESTIONS[2].question}
            options={BEHAVIORAL_QUESTIONS[2].options}
            selectedScore={behavQ3Score}
            onSelect={handleBehavQ3}
          />
        </div>
      </section>

      {/* ================================================================
         C. Live Summary
         ================================================================ */}
      <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-5">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          Your Profile Summary
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* --- Risk Tolerance Card --- */}
          <div className="rounded-lg bg-white p-4 border border-surface-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Risk Tolerance
                </span>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
              >
                {computedRiskCategory}
              </span>
            </div>

            {/* Score */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-lg font-bold text-primary tabular-nums">
                  {computedRiskScore}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">/ 20</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${categoryStyle.bar}`}
                  style={{ width: `${(computedRiskScore / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* --- Behavioral Score Card --- */}
          <div className="rounded-lg bg-white p-4 border border-surface-300 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Investment Behavior
              </span>
            </div>

            {/* Score */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-lg font-bold text-primary tabular-nums">
                  {computedBehavioralScore}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">/ 15</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-brand"
                  style={{
                    width: `${(computedBehavioralScore / 15) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Behavioral label */}
            <p className="text-[10px] text-slate-400 leading-tight">
              {computedBehavioralScore >= 12
                ? 'Highly disciplined investor'
                : computedBehavioralScore >= 7
                  ? 'Moderately disciplined investor'
                  : computedBehavioralScore > 0
                    ? 'Needs behavioral coaching'
                    : 'Answer questions above to see your score'}
            </p>
          </div>
        </div>

        {/* Empty hint when nothing is answered */}
        {computedRiskScore === 0 && computedBehavioralScore === 0 && (
          <p className="text-xs text-slate-400 italic text-center">
            Answer the questions above to see your live risk and behavior profile.
          </p>
        )}
      </div>
    </div>
  );
}
