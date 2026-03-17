import Anthropic from '@anthropic-ai/sdk';
import type { FinancialHealthReport, FinancialPlanningData } from '@/types/financial-planning';
import { formatINR } from '@/lib/utils/formatters';

const SYSTEM_PROMPT = `You are a certified financial planner at Trustner Asset Services, writing a personalized financial health assessment narrative for an Indian investor. Write in a warm, encouraging, professional tone. Use Indian financial context (₹, lakh, crore).

RULES:
- Never mention specific mutual fund schemes, fund names, or AMC names
- Never give specific stock, bond, or fund recommendations
- You may recommend asset classes (equity, debt, gold) and broad strategies but not specific products
- Insurance recommendations should say "consult a licensed insurance advisor for the right policy"
- End with a call-to-action to speak with a Trustner financial advisor (call 6003903737 or visit merasip.com)
- Keep between 250-350 words
- Use simple language a non-finance person can understand
- Address the investor by their first name
- Be honest about areas that need improvement but always encouraging
- Structure as 3-4 short paragraphs (no bullet points or headers)
- Never use the phrase "investment advisory" — use "financial wellness assessment" instead`;

function buildUserPrompt(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string
): string {
  const firstName = userName.split(' ')[0];
  const age = data.personalProfile.age || 30;
  const city = data.personalProfile.city === 'other'
    ? (data.personalProfile.otherCity || 'India')
    : (data.personalProfile.city || 'India');
  const dependents = data.personalProfile.dependents || 0;
  const pillars = report.score.pillars;

  return `Write a personalized financial health narrative for the following investor:

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
- Debt-to-Income: ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%

TOP 3 ACTION ITEMS:
${report.actionPlan.slice(0, 3).map((a, i) => `${i + 1}. [${a.impact.toUpperCase()} IMPACT] ${a.action}`).join('\n')}

Write the narrative now.`;
}

function generateFallbackNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  _data: FinancialPlanningData,
  userName: string
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
    ? `Looking at retirement, you currently have a gap of ${formatINR(report.retirementGap.gap)} between your projected corpus and what you will need. Starting a monthly SIP of ${formatINR(report.retirementGap.monthlyToClose)} can help bridge this gap over the next ${report.retirementGap.yearsToRetirement} years.`
    : `On the retirement front, you are tracking well — your current savings trajectory is aligned with your retirement needs.`;

  const closing = `This assessment is your financial roadmap. To turn these insights into a concrete action plan with personalized guidance, speak with a Trustner financial advisor. Call us at 6003903737 or visit merasip.com — we are here to help you build lasting wealth.`;

  return [opening, strengthText, weaknessText, actionText, retirementText, closing]
    .filter(Boolean)
    .join(' ');
}

/**
 * Generate personalized narrative using Claude API with template fallback.
 */
export async function generateClaudeNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[Claude Narrative] ANTHROPIC_API_KEY not set — using fallback narrative');
    return generateFallbackNarrative(report, data, userName);
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(report, data, userName) },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }

    console.warn('[Claude Narrative] No text block in response — using fallback');
    return generateFallbackNarrative(report, data, userName);
  } catch (error) {
    console.error('[Claude Narrative] API error — using fallback:', error);
    return generateFallbackNarrative(report, data, userName);
  }
}
