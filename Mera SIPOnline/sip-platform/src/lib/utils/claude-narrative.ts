import Anthropic from '@anthropic-ai/sdk';
import type { FinancialHealthReport, FinancialPlanningData } from '@/types/financial-planning';
import type { PlanTier } from '@/types/financial-planning-v2';
import { formatINR } from '@/lib/utils/formatters';
import { TIER_NARRATIVE_CONFIG } from '@/lib/constants/tier-config';

const MFD_DISCLAIMER = `IMPORTANT MFD COMPLIANCE:
- Never recommend direct plans. Always recommend Regular plans through MFD.
- Never mention specific fund schemes — only categories like Flexi Cap, Large Cap, ELSS, Balanced Advantage, etc.
- Position mutual fund distribution (MFD) as valuable — behavioral coaching, crash hand-holding, goal planning.
- Never say "choose direct" or "switch from regular to direct".`;

function buildSystemPrompt(tier: PlanTier): string {
  const config = TIER_NARRATIVE_CONFIG[tier];

  const baseRules = `You are a certified financial planner at Trustner Asset Services, writing a personalized financial health assessment narrative for an Indian investor. Use Indian financial context (₹, lakh, crore).

${MFD_DISCLAIMER}

RULES:
- Never mention specific mutual fund schemes, fund names, or AMC names
- Never give specific stock, bond, or fund recommendations
- You may recommend asset categories (Flexi Cap, Large Cap, ELSS, Balanced Advantage, etc.) and broad strategies but not specific products
- Insurance recommendations should say "consult a licensed insurance advisor for the right policy"
- End with a call-to-action to speak with a Trustner financial advisor (call 6003903737 or visit merasip.com)
- Use simple language a non-finance person can understand
- Address the investor by their first name
- Be honest about areas that need improvement but always encouraging
- Never use the phrase "investment advisory" — use "financial wellness assessment" instead`;

  if (tier === 'basic') {
    return `${baseRules}

TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words — keep it brief and encouraging.
STRUCTURE: 2-3 short paragraphs (no bullet points or headers). Focus on score interpretation and top 3 actions. Use phrases like "You're on the right track" or "Here's where to focus first."`;
  }

  if (tier === 'comprehensive') {
    return `${baseRules}

TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words — provide expert-level depth.
STRUCTURE: Use these clearly labeled sections with markdown headers:
## Executive Overview
## Key Strengths
## Areas of Concern
## Goal-wise Recommendations
## Insurance & Protection Strategy
## Next Steps

Reference specific numbers from their data (scores, gaps, amounts). Write in 2nd person POV. This should read like a report from a top-tier CFP professional.`;
  }

  // Standard (default)
  return `${baseRules}

TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words.
STRUCTURE: 3-4 short paragraphs (no bullet points or headers). Cover each pillar briefly, goal feasibility, and 5 key recommendations. Write in 2nd person POV.`;
}

function buildUserPrompt(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard'
): string {
  const firstName = userName.split(' ')[0];
  const age = data.personalProfile.age || 30;
  const city = data.personalProfile.city === 'other'
    ? (data.personalProfile.otherCity || 'India')
    : (data.personalProfile.city || 'India');
  const dependents = data.personalProfile.dependents || 0;
  const pillars = report.score.pillars;
  const config = TIER_NARRATIVE_CONFIG[tier];

  // Basic tier gets a condensed prompt
  if (tier === 'basic') {
    return `Write a brief (${config.minWords}-${config.maxWords} word) financial health narrative for:

INVESTOR: ${firstName}, Age ${age}, ${city}, ${dependents} dependents
SCORE: ${report.score.totalScore}/900 (${report.score.grade})
NET WORTH: ${formatINR(report.netWorth.netWorth)}
WEAKEST PILLAR: ${[pillars.cashflow, pillars.protection, pillars.investments, pillars.debt, pillars.retirementReadiness].sort((a, b) => a.score - b.score)[0].name} (${[pillars.cashflow, pillars.protection, pillars.investments, pillars.debt, pillars.retirementReadiness].sort((a, b) => a.score - b.score)[0].score}/180)

TOP 3 ACTIONS:
${report.actionPlan.slice(0, 3).map((a, i) => `${i + 1}. ${a.action}`).join('\n')}

Write the narrative now.`;
  }

  // Standard and comprehensive get the full prompt
  let prompt = `Write a personalized financial health narrative (${config.minWords}-${config.maxWords} words) for the following investor:

INVESTOR PROFILE:
- Name: ${firstName}
- Age: ${age}
- City: ${city}
- Dependents: ${dependents}
- Risk Category: ${data.riskProfile.riskCategory}

TRUSTNER FINANCIAL HEALTH SCORE: ${report.score.totalScore}/900 (Grade: ${report.score.grade})

PILLAR SCORES (each out of 180):
1. Cashflow Health: ${pillars.cashflow.score}/180 (${pillars.cashflow.grade}) — ${pillars.cashflow.keyInsight}
2. Protection: ${pillars.protection.score}/180 (${pillars.protection.grade}) — ${pillars.protection.keyInsight}
3. Investments: ${pillars.investments.score}/180 (${pillars.investments.grade}) — ${pillars.investments.keyInsight}
4. Debt Management: ${pillars.debt.score}/180 (${pillars.debt.grade}) — ${pillars.debt.keyInsight}
5. Retirement Readiness: ${pillars.retirementReadiness.score}/180 (${pillars.retirementReadiness.grade}) — ${pillars.retirementReadiness.keyInsight}

KEY NUMBERS:
- Net Worth: ${formatINR(report.netWorth.netWorth)}
- Retirement Gap: ${report.retirementGap.gap > 0 ? formatINR(report.retirementGap.gap) + ' shortfall' : 'On track'}
- Monthly SIP to close retirement gap: ${report.retirementGap.monthlyToClose > 0 ? formatINR(report.retirementGap.monthlyToClose) + '/month' : 'N/A'}
- Years to retirement: ${report.retirementGap.yearsToRetirement}
- Insurance Gap: Life cover ${report.insuranceGap.lifeInsuranceGap > 0 ? 'short by ' + formatINR(report.insuranceGap.lifeInsuranceGap) : 'adequate'}, Health cover ${report.insuranceGap.healthAdequacy}
- Debt-to-Income: ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%`;

  // Comprehensive tier gets goal-level detail
  if (tier === 'comprehensive' && report.goalGaps && report.goalGaps.length > 0) {
    prompt += `\n\nGOAL-WISE GAPS:`;
    for (const goal of report.goalGaps) {
      prompt += `\n- ${goal.goalName}: Target ${formatINR(goal.futureCost)}, Current ${formatINR(goal.currentProgress)}, Gap ${formatINR(goal.gap)}, Monthly SIP needed: ${formatINR(goal.monthlyRequired)}`;
    }
  }

  const actionCount = tier === 'comprehensive' ? 5 : 3;
  prompt += `\n\nTOP ${actionCount} ACTION ITEMS:
${report.actionPlan.slice(0, actionCount).map((a, i) => `${i + 1}. [${a.impact.toUpperCase()} IMPACT] ${a.action}`).join('\n')}

Write the narrative now.`;

  return prompt;
}

function generateFallbackNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  _data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard'
): string {
  const firstName = userName.split(' ')[0];
  const score = report.score;
  const pillars = score.pillars;

  const pillarArr = [
    pillars.cashflow,
    pillars.protection,
    pillars.investments,
    pillars.debt,
    pillars.retirementReadiness,
  ];
  const sorted = [...pillarArr].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const gradeMessages: Record<string, string> = {
    'Excellent': `Congratulations, ${firstName}! Your Trustner Financial Health Score of ${score.totalScore}/900 puts you in the Excellent category. This is a remarkable achievement that reflects strong financial discipline and thoughtful planning.`,
    'Good': `Great work, ${firstName}! Your Trustner Financial Health Score of ${score.totalScore}/900 places you in the Good category. You have built a solid financial foundation, and with a few targeted improvements, you can move towards excellence.`,
    'Fair': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 places you in the Fair category. You have some good financial habits in place, but there are important areas that need attention to secure your family's financial future.`,
    'Needs Improvement': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 indicates that your financial health needs significant attention. The good news is that identifying the gaps is the first step — and that is exactly what this assessment helps you do.`,
    'Critical': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 signals that urgent action is needed on multiple financial fronts. Please do not be discouraged — awareness is the first step towards improvement, and we are here to help you build a stronger financial future.`,
  };

  const opening = gradeMessages[score.grade] || gradeMessages['Fair'];
  const strengthText = `Your strongest area is ${strongest.name} (${strongest.score}/180, ${strongest.grade}), which shows ${strongest.keyInsight.toLowerCase()}.`;
  const weaknessText = weakest.score < 90
    ? `However, ${weakest.name} (${weakest.score}/180) needs immediate attention — ${weakest.keyInsight.toLowerCase()}.`
    : `Your ${weakest.name} pillar (${weakest.score}/180) has room for growth — ${weakest.keyInsight.toLowerCase()}.`;

  const actionText = report.actionPlan.length > 0
    ? `Our analysis suggests your top priority should be: ${report.actionPlan[0].action.toLowerCase()}. This single step can have a ${report.actionPlan[0].impact} impact on your overall financial health.`
    : '';

  const retirementText = report.retirementGap.gap > 0
    ? `Looking at retirement, you currently have a gap of ${formatINR(report.retirementGap.gap)} between your projected corpus and what you will need. Starting a monthly SIP of ${formatINR(report.retirementGap.monthlyToClose)} through a Regular plan can help bridge this gap over the next ${report.retirementGap.yearsToRetirement} years.`
    : `On the retirement front, you are tracking well — your current savings trajectory is aligned with your retirement needs.`;

  const closing = `This assessment is your financial roadmap. To turn these insights into a concrete action plan with personalized guidance, speak with a Trustner financial advisor. Call us at 6003903737 or visit merasip.com — we are here to help you build lasting wealth.`;

  // Basic tier: return condensed version
  if (tier === 'basic') {
    const topActions = report.actionPlan.slice(0, 3).map(a => a.action.toLowerCase()).join(', ');
    return `${opening} ${strengthText} ${weaknessText}${topActions ? ` Your top priorities: ${topActions}.` : ''} To get personalized guidance, speak with a Trustner financial advisor at 6003903737 or visit merasip.com.`;
  }

  // Comprehensive tier: add pillar-by-pillar detail and insurance/debt sections
  if (tier === 'comprehensive') {
    const pillarDetails = pillarArr.map(p =>
      `${p.name} scored ${p.score}/180 (${p.grade}) — ${p.keyInsight.toLowerCase()}.`
    ).join(' ');

    const insuranceText = report.insuranceGap.lifeInsuranceGap > 0
      ? `On the protection front, your life insurance cover is short by ${formatINR(report.insuranceGap.lifeInsuranceGap)}. Health cover is ${report.insuranceGap.healthAdequacy.toLowerCase()}. Consult a licensed insurance advisor for the right policy to close these gaps.`
      : `Your life insurance cover appears adequate. Health cover is ${report.insuranceGap.healthAdequacy.toLowerCase()}.`;

    const debtText = report.debtManagement.debtToIncomeRatio > 0.4
      ? `Your debt-to-income ratio of ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}% is above the recommended 40% threshold. Prioritizing debt reduction will free up capacity for wealth building.`
      : report.debtManagement.debtToIncomeRatio > 0
        ? `Your debt-to-income ratio is ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%, which is manageable.`
        : '';

    const netWorthText = `Your current net worth stands at ${formatINR(report.netWorth.netWorth)}.`;

    const additionalActions = report.actionPlan.slice(1, 5).map((a, i) =>
      `${i + 2}. ${a.action}`
    ).join(' ');

    return [
      opening, netWorthText, pillarDetails, strengthText, weaknessText,
      insuranceText, debtText, actionText,
      additionalActions ? `Additional priorities: ${additionalActions}` : '',
      retirementText, closing
    ].filter(Boolean).join(' ');
  }

  // Standard tier: original format
  return [opening, strengthText, weaknessText, actionText, retirementText, closing]
    .filter(Boolean)
    .join(' ');
}

/**
 * Generate personalized narrative using Claude API with template fallback.
 * @param tier - Plan tier (basic | standard | comprehensive). Defaults to 'standard' for backward compatibility.
 */
export async function generateClaudeNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard'
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[Claude Narrative] ANTHROPIC_API_KEY not set — using fallback narrative');
    return generateFallbackNarrative(report, data, userName, tier);
  }

  // Scale max_tokens by tier
  const maxTokensByTier: Record<PlanTier, number> = {
    basic: 300,
    standard: 600,
    comprehensive: 1200,
  };

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokensByTier[tier],
      system: buildSystemPrompt(tier),
      messages: [
        { role: 'user', content: buildUserPrompt(report, data, userName, tier) },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      console.log(`[Claude Narrative] Generated for tier=${tier} (${textBlock.text.split(/\s+/).length} words)`);
      return textBlock.text;
    }

    console.warn('[Claude Narrative] No text block in response — using fallback');
    return generateFallbackNarrative(report, data, userName, tier);
  } catch (error) {
    console.error('[Claude Narrative] API error — using fallback:', error);
    return generateFallbackNarrative(report, data, userName, tier);
  }
}
