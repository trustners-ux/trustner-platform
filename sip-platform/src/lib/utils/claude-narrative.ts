import Anthropic from '@anthropic-ai/sdk';
import type { FinancialHealthReport, FinancialPlanningData } from '@/types/financial-planning';
import type { PlanTier } from '@/types/financial-planning-v2';
import { formatINR } from '@/lib/utils/formatters';
import { TIER_NARRATIVE_CONFIG } from '@/lib/constants/tier-config';
import { getSupabaseAdmin } from '@/lib/db/supabase';

// ──────────────────────────────────────────────────────────────────────────
// TRUSTNER PREFERRED FUNDS CONTEXT (per-category curated picks)
//
// Pulled from pd_preferred_funds_by_category in production Supabase. We
// fetch this once per server process and memoize for 5 minutes so the
// narrative endpoint isn't pounding the DB on every request. The narrative
// uses category-name signals (e.g. "the Trustner research desk's current
// pick in this category is led by Bandhan Small Cap") — never specific
// AMC promotion, always framed as "for review with your Trustner team".
// ──────────────────────────────────────────────────────────────────────────

interface PreferredFundCacheEntry {
  fetchedAt: number;
  blockText: string;
}
let preferredFundsCache: PreferredFundCacheEntry | null = null;
const PREFERRED_FUNDS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getPreferredFundsContext(): Promise<string> {
  const now = Date.now();
  if (preferredFundsCache && now - preferredFundsCache.fetchedAt < PREFERRED_FUNDS_CACHE_TTL_MS) {
    return preferredFundsCache.blockText;
  }
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return '';

    // Pull preferred picks (primary + secondary AMFI codes) + the
    // matching scheme names from pd_fund_master so the narrative can
    // reference category leaders by name (NOT recommend a switch).
    const { data: prefs } = await supabase
      .from('pd_preferred_funds_by_category')
      .select('category, primary_amfi_code, secondary_amfi_code')
      .not('primary_amfi_code', 'is', null);

    if (!prefs || prefs.length === 0) {
      preferredFundsCache = { fetchedAt: now, blockText: '' };
      return '';
    }

    // Resolve scheme names via pd_fund_master in a single query
    const allCodes = new Set<string>();
    for (const p of prefs) {
      if (p.primary_amfi_code) allCodes.add(p.primary_amfi_code as string);
      if (p.secondary_amfi_code) allCodes.add(p.secondary_amfi_code as string);
    }
    const { data: funds } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, scheme_name')
      .in('amfi_code', Array.from(allCodes));

    const nameByCode = new Map<string, string>();
    for (const f of funds ?? []) {
      nameByCode.set(f.amfi_code as string, (f.scheme_name as string) || '');
    }

    const lines = [
      'TRUSTNER RESEARCH DESK — CURRENT CATEGORY LEADERS (for context, do not advertise specific schemes):',
      'When a goal calls for an asset category, you MAY reference the leader by name as the research desk\'s current pick (e.g. "the desk\'s current Flexi Cap pick is led by Parag Parikh Flexi Cap (Regular)"). Always frame as "for review with your Trustner Relationship Manager", never as a personal recommendation.',
    ];
    for (const p of prefs) {
      const primaryName = nameByCode.get(p.primary_amfi_code as string) || '';
      const secondaryName = p.secondary_amfi_code ? nameByCode.get(p.secondary_amfi_code as string) || '' : '';
      const cleanPrimary = primaryName.replace(/\s*-\s*(REGULAR|Regular)\s*(PLAN\s*-?)?\s*(GROWTH|Growth)?.*$/i, '').trim();
      const cleanSecondary = secondaryName.replace(/\s*-\s*(REGULAR|Regular)\s*(PLAN\s*-?)?\s*(GROWTH|Growth)?.*$/i, '').trim();
      if (cleanSecondary) {
        lines.push(`  - ${p.category}: ${cleanPrimary} (primary) / ${cleanSecondary} (secondary)`);
      } else if (cleanPrimary) {
        lines.push(`  - ${p.category}: ${cleanPrimary}`);
      }
    }

    const blockText = lines.join('\n');
    preferredFundsCache = { fetchedAt: now, blockText };
    return blockText;
  } catch (e) {
    console.warn('[Claude Narrative] Failed to fetch preferred funds context (continuing without):', (e as Error).message);
    return '';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// FINANCE ACT 2024 — the only tax rates allowed anywhere in this engine.
// Locking these as a constant block we paste into every system prompt
// prevents Claude from drifting to pre-FY24 indexation or old slab framing.
// ──────────────────────────────────────────────────────────────────────────

const FINANCE_ACT_2024_RATES = `TAX RATES — Finance Act 2024 ONLY (do not quote any other rates):
- Equity-oriented MF / Hybrid >=65% equity: STCG 20% (under 12 months), LTCG 12.5% on gains above Rs. 1.25 lakh exemption per FY (after 12 months).
- Debt MF (units purchased on/after 1 Apr 2023): all gains taxed at slab rate, no LTCG benefit, no indexation.
- Hybrid <65% equity: LTCG 12.5% after 24 months, STCG at slab below that.
- New tax regime: standard deduction Rs. 75,000. Old regime: standard deduction Rs. 50,000.
- Surcharge slabs as applicable; New regime caps surcharge at 25% (vs 37% in old) for income > Rs. 5 Cr.
- LTCG exemption is Rs. 1.25 lakh per FY (raised from Rs. 1 lakh under Finance Act 2024).
- DO NOT mention indexation on debt funds, pre-FY24 LTCG rates (10%/15%), or the Rs. 1 lakh old exemption.`;

const MFD_DISCLAIMER = `MFD DISTRIBUTOR COMPLIANCE (non-negotiable):
- Trustner Asset Services is an MFD (ARN-286886) — a DISTRIBUTOR, not an investment adviser.
- Never recommend direct plans. Always reference Regular plans through MFD.
- Never name specific fund schemes or AMCs. Reference asset CATEGORIES only
  (Flexi Cap, Large Cap, Mid Cap, Small Cap, ELSS, Balanced Advantage, Hybrid, Arbitrage, Short Duration Debt, Liquid).
- Position MFD value as: behavioural coaching, crash hand-holding, rebalancing
  discipline, goal tracking — funded by the trail commission on Regular plans.
- Never say "choose direct" or "switch from regular to direct".`;

// ──────────────────────────────────────────────────────────────────────────
// LANGUAGE DISCIPLINE — the "considerations for review" framing.
// This block is inserted into every system prompt so Claude reframes
// advisory-tone phrases into distributor-tone phrases automatically.
// ──────────────────────────────────────────────────────────────────────────

const LANGUAGE_DISCIPLINE = `LANGUAGE DISCIPLINE (MFD distributor framing — apply throughout):
- Replace "We recommend X" -> "A consideration worth reviewing with your Trustner Relationship Manager: X"
- Replace "Our advice" / "Our recommendation" -> "A perspective from our research desk for your consideration"
- Replace "You should" / "You must" -> "You may want to evaluate" / "Worth considering"
- Replace "Best fund" / "Right fund" -> "Asset category that tends to fit"
- Replace "investment advisory" / "investment advice" / "financial advice" -> "financial wellness assessment" / "mutual fund distribution"
- The word "advisor" / "adviser" / "advisory" is RESERVED for SEBI-Registered Investment Advisers. Trustner is an AMFI-registered Mutual Fund Distributor (ARN-286886) — never use these words to describe Trustner or its staff.
- Replace "Trustner advisor" -> "Trustner Relationship Manager" (RM) or "the Trustner team"
- Replace "your advisor" (when meaning Trustner) -> "the Trustner team" / "your Relationship Manager"
- "Tax advisor" / "tax consultant" / "Chartered Accountant" remain OK — these are different professional categories
- Every concrete number, percentage, and timeline STAYS — but every directive softens.
- Closing CTA always says "for review with your Trustner Relationship Manager", never "to take this advice".`;

// ──────────────────────────────────────────────────────────────────────────
// LIFE-STAGE SYNTHESIZER — picks one Indian-context archetype based on the
// client's age, dependents, kids' ages, and income trajectory. This single
// string feeds into the main narrative call as LIFE_STAGE_CONTEXT.
// ──────────────────────────────────────────────────────────────────────────

type LifeStage =
  | 'EARLY_ACCUMULATION_SINGLE'
  | 'EARLY_ACCUMULATION_FAMILY'
  | 'PEAK_EARNINGS_FAMILY'
  | 'PEAK_EARNINGS_PROFESSIONAL'
  | 'MID_LIFE_EDUCATION_PRESSURE'
  | 'PRE_RETIREMENT_GLIDE'
  | 'RETIREMENT_BRIDGE';

interface LifeStageBlock {
  stage: LifeStage;
  dominantRisk: string;
  dominantConstraint: string;
  dominantEmotion: string;
  primaryFocus: string;
}

function deriveLifeStage(data: FinancialPlanningData): LifeStageBlock {
  const age = data.personalProfile.age || 30;
  const dependents = data.personalProfile.dependents || 0;
  const childrenAges: number[] = (data.personalProfile as unknown as { childrenAges?: number[] }).childrenAges || [];
  const oldestKid = childrenAges.length > 0 ? Math.max(...childrenAges) : 0;
  const married = (data.personalProfile.maritalStatus || '').toLowerCase() === 'married';

  if (age < 30 && !married && dependents === 0) {
    return {
      stage: 'EARLY_ACCUMULATION_SINGLE',
      dominantRisk: 'Lifestyle creep eating into savings rate before SIPs reach critical mass.',
      dominantConstraint: 'Optionality — career changes / city moves are likely in the next 3-5 years.',
      dominantEmotion: 'FOMO on equity returns vs. anxiety about long horizon.',
      primaryFocus: 'Build the SIP habit at 20-25% of income, keep portfolio liquid and equity-heavy, defer EMI commitments.',
    };
  }
  if (age <= 32 && (married || dependents > 0) && oldestKid < 6) {
    return {
      stage: 'EARLY_ACCUMULATION_FAMILY',
      dominantRisk: 'Underinsurance — life cover often less than 5x annual income.',
      dominantConstraint: 'Cashflow squeeze from young-family expenses (childcare, healthcare, household setup).',
      dominantEmotion: 'Protective instinct to over-allocate to "safe" instruments (FD, traditional life policies).',
      primaryFocus: 'Term life cover = 15-20x income FIRST. Then equity SIP. Health floater Rs. 10-15L base + super top-up.',
    };
  }
  if (age >= 33 && age <= 45 && dependents > 0 && oldestKid >= 6 && oldestKid < 14) {
    return {
      stage: 'PEAK_EARNINGS_FAMILY',
      dominantRisk: 'Goal-stacking — education + house + retirement all compete for the same monthly surplus.',
      dominantConstraint: 'Time-bound education goal (8-12 years out) reduces equity-only horizon flexibility.',
      dominantEmotion: 'Comparison anxiety — peers seem to be doing more.',
      primaryFocus: 'Step-up SIP every appraisal. Separate buckets per goal. Lock-in long-term care for parents.',
    };
  }
  if (age >= 33 && age <= 45 && dependents === 0) {
    return {
      stage: 'PEAK_EARNINGS_PROFESSIONAL',
      dominantRisk: 'Overconfidence in single-asset bets (direct stocks, crypto, real estate concentration).',
      dominantConstraint: 'Tax efficiency — peak earning years mean higher tax burden, regime choice matters.',
      dominantEmotion: 'Optimisation mindset — wants to maximise everything simultaneously.',
      primaryFocus: 'Asset allocation discipline. LTCG harvesting under Finance Act 2024 Rs. 1.25L exemption. NPS for Sec 80CCD(1B).',
    };
  }
  if (age >= 40 && age <= 50 && oldestKid >= 14 && oldestKid < 22) {
    return {
      stage: 'MID_LIFE_EDUCATION_PRESSURE',
      dominantRisk: 'Education corpus shortfall hitting in 2-6 years with no time to compound equity gains.',
      dominantConstraint: 'Cannot take equity risk on the funds needed in 2-3 years; must de-risk now.',
      dominantEmotion: 'Time pressure — late starters\' regret.',
      primaryFocus: 'Move education funds into BAF/Hybrid 24 months before need. Education loan as bridge if gap remains.',
    };
  }
  if (age >= 50 && age <= 58) {
    return {
      stage: 'PRE_RETIREMENT_GLIDE',
      dominantRisk: 'Sequence-of-returns risk — a market drawdown in the 5 years before retirement is hardest to recover.',
      dominantConstraint: 'Equity allocation must glide down systematically without losing growth runway.',
      dominantEmotion: 'Conservation reflex — pull-back from equity often happens too aggressively.',
      primaryFocus: 'Bucket strategy: 3 years expenses in cash/short debt, 7 years in BAF/hybrid, rest in equity. NPS 60% lump-sum + 40% annuity awareness.',
    };
  }
  return {
    stage: 'RETIREMENT_BRIDGE',
    dominantRisk: 'Longevity risk + inflation eroding fixed-income returns over 25-30 retirement years.',
    dominantConstraint: 'SWP must outlast life expectancy while preserving purchasing power.',
    dominantEmotion: 'Anxiety about running out of money; over-conservatism common.',
    primaryFocus: 'SWP discipline. Keep 30-40% in equity for the long retirement. Reverse mortgage / senior-citizen schemes as backup.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// BEHAVIOURAL FLAGS — concrete diagnoses Claude can quote in the narrative.
// ──────────────────────────────────────────────────────────────────────────

function deriveBehaviouralFlags(report: Omit<FinancialHealthReport, 'claudeNarrative'>, data: FinancialPlanningData): string[] {
  const flags: string[] = [];
  const income = (data.incomeProfile.monthlyInHandSalary || 0) +
                 (data.incomeProfile.rentalIncome || 0) +
                 (data.incomeProfile.businessIncome || 0) +
                 (data.incomeProfile.otherIncome || 0);

  if (income > 0) {
    const sipRatio = (data.incomeProfile.monthlySIPsRunning || 0) / income;
    if (sipRatio < 0.10) {
      flags.push(`Low savings rate flag — SIP-to-income ratio is ${(sipRatio * 100).toFixed(0)}%, well below the 20% target. If income is growing but SIP is not stepping up in lockstep, lifestyle creep is the usual culprit.`);
    } else if (sipRatio > 0.30) {
      flags.push(`Healthy savings rate — SIP-to-income at ${(sipRatio * 100).toFixed(0)}%, comfortably above the 20% benchmark. Discipline is the strongest asset visible in this profile.`);
    }
  }

  if (report.debtManagement.debtToIncomeRatio > 0.45) {
    flags.push(`Debt-stress flag — DTI is ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%, above the 40% comfort threshold. The combination of high DTI and any equity-heavy investing tends to amplify behavioural panic in drawdowns.`);
  }

  const efMonths = (data.incomeProfile.monthlyInHandSalary && data.incomeProfile.monthlyInHandSalary > 0)
    ? ((data.assetProfile.bankSavings || 0) + (data.assetProfile.fixedDeposits || 0) * 0.5) / data.incomeProfile.monthlyInHandSalary
    : 0;
  if (efMonths < 3) {
    flags.push(`Liquidity flag — emergency fund covers ~${efMonths.toFixed(1)} months of expenses (target: 6 months). Insufficient buffer is the #1 reason households break SIPs in a crisis.`);
  } else if (efMonths >= 6) {
    flags.push(`Emergency fund is at ~${efMonths.toFixed(1)} months — adequate. The SIP commitment can be defended through a 12-18 month income shock without raiding investments.`);
  }

  if (report.insuranceGap.lifeInsuranceGap > 0) {
    const gapLakhs = Math.round(report.insuranceGap.lifeInsuranceGap / 100000);
    flags.push(`Underinsurance flag — life cover is short by approximately Rs. ${gapLakhs}L. For dependents, term cover of 15-20x annual income is the standard worth reviewing.`);
  }

  if (report.retirementGap.gap > 0 && report.retirementGap.yearsToRetirement < 15) {
    flags.push(`Retirement runway compression — only ${report.retirementGap.yearsToRetirement} years to compound, with a gap of approximately ${formatINR(report.retirementGap.gap)}. Step-up SIP discipline matters more than asset selection at this stage.`);
  }

  return flags.slice(0, 6);
}

// ──────────────────────────────────────────────────────────────────────────
// FAMILY NARRATIVE BLOCK — surfaces names + ages so Claude can address
// people by name instead of "your child" generic.
// ──────────────────────────────────────────────────────────────────────────

interface ComprehensiveProfileLike {
  spouseName?: string;
  childrenDetails?: Array<{ name?: string; age?: number; goalAssociated?: string }>;
  fatherName?: string;
  fatherAge?: number;
  fatherHealthNotes?: string;
  motherName?: string;
  motherAge?: number;
  motherHealthNotes?: string;
}

function buildFamilyNarrativeBlock(data: FinancialPlanningData): string {
  const profile = data.personalProfile;
  const comp = (data as unknown as { comprehensiveProfile?: ComprehensiveProfileLike }).comprehensiveProfile;

  const parts: string[] = [];
  const fname = profile.fullName?.split(' ')[0] || 'Client';

  if (profile.maritalStatus?.toLowerCase() === 'married') {
    const spouseAge = profile.spouseAge ? ` (age ${profile.spouseAge})` : '';
    const spouseName = comp?.spouseName ? `${comp.spouseName}${spouseAge}` : `spouse${spouseAge}`;
    parts.push(`Spouse: ${spouseName}`);
  }

  if (comp?.childrenDetails && comp.childrenDetails.length > 0) {
    const kids = comp.childrenDetails
      .filter(k => k.name || k.age)
      .map(k => `${k.name || 'child'}${k.age ? ` (age ${k.age})` : ''}${k.goalAssociated ? ` — ${k.goalAssociated}` : ''}`)
      .join(', ');
    if (kids) parts.push(`Children: ${kids}`);
  } else if (profile.childrenAges && profile.childrenAges.length > 0) {
    parts.push(`Children ages: ${profile.childrenAges.join(', ')}`);
  }

  if (comp?.fatherName || comp?.fatherAge) {
    const f = `${comp.fatherName || 'father'}${comp.fatherAge ? ` (${comp.fatherAge})` : ''}${comp.fatherHealthNotes ? ` — ${comp.fatherHealthNotes}` : ''}`;
    parts.push(`Father: ${f}`);
  }
  if (comp?.motherName || comp?.motherAge) {
    const m = `${comp.motherName || 'mother'}${comp.motherAge ? ` (${comp.motherAge})` : ''}${comp.motherHealthNotes ? ` — ${comp.motherHealthNotes}` : ''}`;
    parts.push(`Mother: ${m}`);
  }

  if (parts.length === 0) {
    return `Family: ${fname} (individual profile, ${profile.dependents || 0} dependents).`;
  }
  return `Family narrative (REFERENCE PEOPLE BY NAME in the narrative where possible):\n  - Client: ${fname}\n  - ${parts.join('\n  - ')}`;
}

// ──────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────
// STATIC SYSTEM-PROMPT BLOCK (cached via Anthropic prompt caching, ephemeral
// 5-min TTL). Identical across every call regardless of tier — so the API
// reads it from cache at ~0.1× input cost on repeated invocations. Any byte
// change here invalidates the cache, so keep this block FROZEN and put
// per-tier / per-call variation in the tier-specific block below.
// ──────────────────────────────────────────────────────────────────────────

const STATIC_RULES_BLOCK = `You are a senior wealth strategist at Trustner Asset Services writing a personalised financial wellness assessment for an Indian investor. Use Indian financial context (Rs., lakh, crore). Address the investor by their first name.

${MFD_DISCLAIMER}

${FINANCE_ACT_2024_RATES}

${LANGUAGE_DISCIPLINE}

CORE RULES:
- Never recommend specific mutual fund schemes, AMC names, or stock tickers.
- You MAY recommend asset categories (Flexi Cap, Large Cap, Mid Cap, Small Cap, ELSS, Balanced Advantage, Hybrid, Arbitrage, Short Duration Debt, Liquid) and broad strategies.
- Insurance recommendations: "consult a licensed insurance advisor for the right policy and sum assured".
- Use simple language a non-finance person can understand. No jargon without a one-line plain-English explanation.
- Be honest about gaps but always sequence them into actionable, time-bound considerations.
- Reference family members BY NAME where the FAMILY NARRATIVE block names them.
- Quote specific numbers from the data (scores, gaps, percentages) — do not generalise.
- End with a call-to-action to review the document with the Trustner team (call 6003903737 or visit merasip.com). Frame as "review with the Trustner team" or "schedule a conversation with your Trustner Relationship Manager", NEVER "review with your advisor" or "follow this advice".`;

/**
 * Returns a 2-element content-block array for the Anthropic SDK's `system`
 * field: [STATIC_RULES_BLOCK (cached), tier-specific structure (uncached)].
 *
 * Top-level layout reads like the original concatenated string when rendered,
 * but the API caches the first block across calls and only re-tokenises the
 * second. Saves ~70% on input tokens at typical traffic.
 */
type SystemBlock =
  | { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }
  | { type: 'text'; text: string };

function buildSystemPrompt(tier: PlanTier): SystemBlock[] {
  const config = TIER_NARRATIVE_CONFIG[tier];
  const staticBlock: SystemBlock = {
    type: 'text',
    text: STATIC_RULES_BLOCK,
    cache_control: { type: 'ephemeral' },
  };

  if (tier === 'basic') {
    return [
      staticBlock,
      {
        type: 'text',
        text: `TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words — brief and encouraging.
STRUCTURE: 2-3 short paragraphs (no headers/bullets). Score interpretation + top 3 considerations for review.`,
      },
    ];
  }

  if (tier === 'comprehensive') {
    return [
      staticBlock,
      {
        type: 'text',
        text: `TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words — expert depth, but every paragraph must EARN its place.
STRUCTURE — use these markdown headers in order:

## Executive Overview
Open with the client's first name. State the score, grade, life-stage archetype. One sentence on what the data is really saying behind the headline number.

## Where You Are Strong
Name the 1-2 strongest pillars with their scores. Quote behavioural flags that are POSITIVE (high savings rate, adequate emergency fund, etc.). Tell the client what they're getting right and why it matters.

## Where Your Plan Is Working Against You
Name the 1-2 weakest pillars with their scores. Quote behavioural flags that are NEGATIVE. Be honest. Frame each gap with: (a) what it is, (b) why it hurts, (c) one specific lever to close it.

## Goal-by-Goal Considerations
For EACH of the client's stated goals, write ONE paragraph that weaves: the named family member (if any), the inflation assumption, the saved-so-far head-start, the monthly SIP-needed, the Finance-Act-2024 tax math on net-of-tax outcomes, and a 3-move sequence (start today / step up annually / de-risk at threshold).

## Protection, Tax & Liquidity Layer
Cover insurance gaps, income-tax regime suggestion (with the calculation logic), and emergency-fund adequacy. Reference Finance Act 2024 rates explicitly when capital gains are involved.

## A Note from the Trustner Research Desk (Behavioural Coach)
80-120 words written like a senior CFP speaking to a friend. No headers, no bullets. Point out the SINGLE behavioural pattern the data reveals — not a number, a habit. End with a one-line "this is what I'd watch over the next 12 months".

## Carry Into Your Next Conversation
Generate exactly FOUR specific questions the client should bring to their next conversation with the Trustner team, calibrated to the gaps in the data. Format as a numbered list. Each question must be answerable in a 15-minute conversation.

CRITICAL: Use the LIFE_STAGE_CONTEXT, FAMILY NARRATIVE, BEHAVIOURAL FLAGS, and GOAL-TAX CONTEXT blocks in the user prompt as primary inputs. The narrative should feel like it was written for THIS family, with THESE constraints, at THIS life stage — not a template.`,
      },
    ];
  }

  // Standard tier (default)
  return [
    staticBlock,
    {
      type: 'text',
      text: `TONE: ${config.tone}
WORD LIMIT: ${config.minWords}-${config.maxWords} words.
STRUCTURE: 3-4 short paragraphs (no headers/bullets). Cover each pillar briefly, goal feasibility, and 5 key considerations for review.`,
    },
  ];
}

// ──────────────────────────────────────────────────────────────────────────
// PER-GOAL TAX CONTEXT (Finance Act 2024)
// ──────────────────────────────────────────────────────────────────────────

function buildGoalTaxContext(report: Omit<FinancialHealthReport, 'claudeNarrative'>): string {
  if (!report.goalGaps || report.goalGaps.length === 0) return '';
  const lines: string[] = ['GOAL-LEVEL TAX CONTEXT (Finance Act 2024 — quote net-of-tax outcomes per goal):'];
  for (const g of report.goalGaps) {
    // Heuristic: long-horizon goals are likely equity-tilted; short-horizon de-risked.
    const yrs = (g.futureCost > 0 && g.currentProgress > 0)
      ? Math.max(1, Math.ceil(Math.log(g.futureCost / Math.max(g.currentProgress, 1)) / Math.log(1.1)))
      : 5;
    if (yrs >= 8) {
      const expectedGains = g.futureCost - (g.monthlyRequired * yrs * 12);
      const taxable = Math.max(0, expectedGains - 125000);
      const taxAtExit = taxable * 0.125;
      lines.push(`  - ${g.goalName}: equity-tilted horizon (~${yrs} yrs). LTCG @ 12.5% above Rs. 1.25L exemption. Estimated tax at goal: approx ${formatINR(Math.round(taxAtExit))}. Net-of-tax retention approx ${formatINR(Math.round(g.futureCost - taxAtExit))}.`);
    } else if (yrs >= 3) {
      lines.push(`  - ${g.goalName}: medium horizon (~${yrs} yrs). Hybrid/BAF route — LTCG 12.5% after 24 months (>=65% eq), or after 24 months at 12.5% for <65% eq. Plan de-risk into Hybrid/Short Duration Debt 18-24 months before need.`);
    } else {
      lines.push(`  - ${g.goalName}: short horizon (~${yrs} yrs). Liquid / Arbitrage / Short Duration Debt categories. Debt MF gains taxed at slab post-Apr 2023 (Finance Act 2024 — no indexation). Arbitrage taxed as equity (LTCG 12.5% > 12 months).`);
    }
  }
  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────────────────
// USER PROMPT
// ──────────────────────────────────────────────────────────────────────────

function buildUserPrompt(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard',
): string {
  const firstName = userName.split(' ')[0];
  const age = data.personalProfile.age || 30;
  const city = data.personalProfile.city === 'other'
    ? (data.personalProfile.otherCity || 'India')
    : (data.personalProfile.city || 'India');
  const dependents = data.personalProfile.dependents || 0;
  const pillars = report.score.pillars;
  const config = TIER_NARRATIVE_CONFIG[tier];

  if (tier === 'basic') {
    return `Write a brief (${config.minWords}-${config.maxWords} word) financial wellness assessment for:

INVESTOR: ${firstName}, Age ${age}, ${city}, ${dependents} dependents
SCORE: ${report.score.totalScore}/900 (${report.score.grade})
NET WORTH: ${formatINR(report.netWorth.netWorth)}
WEAKEST PILLAR: ${[pillars.cashflow, pillars.protection, pillars.investments, pillars.debt, pillars.retirementReadiness].sort((a, b) => a.score - b.score)[0].name} (${[pillars.cashflow, pillars.protection, pillars.investments, pillars.debt, pillars.retirementReadiness].sort((a, b) => a.score - b.score)[0].score}/180)

TOP 3 CONSIDERATIONS FOR REVIEW:
${report.actionPlan.slice(0, 3).map((a, i) => `${i + 1}. ${a.action}`).join('\n')}

Write the assessment now.`;
  }

  // Standard + Comprehensive
  const lifeStage = deriveLifeStage(data);
  const behaviouralFlags = deriveBehaviouralFlags(report, data);
  const familyBlock = buildFamilyNarrativeBlock(data);
  const goalTaxContext = tier === 'comprehensive' ? buildGoalTaxContext(report) : '';

  const incomeMonthly = data.incomeProfile.monthlyInHandSalary || 0;
  const incomeGrowth = (data as unknown as { comprehensiveProfile?: { incomeGrowthScenario?: string } }).comprehensiveProfile?.incomeGrowthScenario || 'moderate';
  const growthMap: Record<string, string> = { conservative: '5% p.a.', moderate: '8% p.a.', aggressive: '12% p.a.' };
  const growthLabel = growthMap[incomeGrowth] || '8% p.a.';

  let prompt = `Write a personalised financial wellness assessment (${config.minWords}-${config.maxWords} words).

INVESTOR PROFILE:
- Name: ${firstName}
- Age: ${age}
- City: ${city} (city tier matters for inflation assumptions)
- Dependents: ${dependents}
- Risk Category: ${data.riskProfile.riskCategory}
- Monthly in-hand income: ${formatINR(incomeMonthly)}
- Income growth scenario chosen: ${incomeGrowth} (${growthLabel})

${familyBlock}

LIFE-STAGE CONTEXT (anchor the narrative to this stage):
- Stage: ${lifeStage.stage}
- Dominant risk: ${lifeStage.dominantRisk}
- Dominant constraint: ${lifeStage.dominantConstraint}
- Dominant emotional pattern: ${lifeStage.dominantEmotion}
- Primary focus for this stage: ${lifeStage.primaryFocus}

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
- Insurance Gap: Life cover ${report.insuranceGap.lifeInsuranceGap > 0 ? 'short by ' + formatINR(report.insuranceGap.lifeInsuranceGap) : 'adequate'}; Health cover ${report.insuranceGap.healthAdequacy}
- Debt-to-Income: ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%

BEHAVIOURAL FLAGS (diagnoses, quote these in the narrative):
${behaviouralFlags.length > 0 ? behaviouralFlags.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No notable behavioural flags — discipline appears solid across the data.'}`;

  if (tier === 'comprehensive' && report.goalGaps && report.goalGaps.length > 0) {
    prompt += `\n\nGOAL-WISE GAPS (name the family member tied to each goal where applicable):`;
    for (const goal of report.goalGaps) {
      prompt += `\n- ${goal.goalName}: target ${formatINR(goal.futureCost)} (already saved ${formatINR(goal.currentProgress)}), monthly SIP needed ${formatINR(goal.monthlyRequired)} (feasibility: ${goal.feasibility}).`;
    }
    prompt += `\n\n${goalTaxContext}`;
  }

  const actionCount = tier === 'comprehensive' ? 6 : 4;
  prompt += `\n\nTOP ${actionCount} CONSIDERATIONS FOR REVIEW (impact-ranked):
${report.actionPlan.slice(0, actionCount).map((a, i) => `${i + 1}. [${a.impact.toUpperCase()} IMPACT] ${a.action}`).join('\n')}

Now write the assessment. Remember:
- Use ${firstName}'s first name (and any other family names from the FAMILY NARRATIVE block).
- Anchor everything to the LIFE-STAGE CONTEXT — don't drift into generic age-31 advice if the stage says PEAK_EARNINGS_FAMILY.
- Quote BEHAVIOURAL FLAGS verbatim (or close) — they are diagnostic, not decorative.
- Apply Finance Act 2024 rates ONLY. Never mention indexation on debt funds or pre-FY24 LTCG rates.
- Frame every recommendation as "a consideration for review with your Trustner Relationship Manager" — never "we recommend" / "you should".`;

  return prompt;
}

// ──────────────────────────────────────────────────────────────────────────
// FALLBACK NARRATIVE — used when Anthropic API key isn't set.
// Light-touch update: same shape, but with new framing and FY24-only language.
// ──────────────────────────────────────────────────────────────────────────

function generateFallbackNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard',
): string {
  const firstName = userName.split(' ')[0];
  const score = report.score;
  const pillars = score.pillars;
  const lifeStage = deriveLifeStage(data);

  const pillarArr = [pillars.cashflow, pillars.protection, pillars.investments, pillars.debt, pillars.retirementReadiness];
  const sorted = [...pillarArr].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const gradeMessages: Record<string, string> = {
    'Excellent': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 puts you in the Excellent category — a remarkable position that reflects sustained financial discipline.`,
    'Good': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 places you in the Good category. A solid foundation; a few targeted considerations can move you towards excellence.`,
    'Fair': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 places you in the Fair category. The good habits are in place; some important gaps remain for your review.`,
    'Needs Improvement': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 signals meaningful gaps to address. Identifying them clearly — as this assessment does — is the first step.`,
    'Critical': `${firstName}, your Trustner Financial Health Score of ${score.totalScore}/900 calls for thoughtful attention across multiple fronts. Awareness, which this assessment provides, is the starting point.`,
  };

  const opening = gradeMessages[score.grade] || gradeMessages['Fair'];
  const stageLine = `Life-stage context: ${lifeStage.stage.replace(/_/g, ' ').toLowerCase()}. Primary focus at this stage: ${lifeStage.primaryFocus}`;
  const strengthText = `Strongest area: ${strongest.name} (${strongest.score}/180, ${strongest.grade}) — ${strongest.keyInsight.toLowerCase()}`;
  const weaknessText = weakest.score < 90
    ? `Area needing attention: ${weakest.name} (${weakest.score}/180) — ${weakest.keyInsight.toLowerCase()}`
    : `Area for refinement: ${weakest.name} (${weakest.score}/180) — ${weakest.keyInsight.toLowerCase()}`;
  const actionText = report.actionPlan.length > 0
    ? `Consideration for review with your Trustner Relationship Manager: ${report.actionPlan[0].action.toLowerCase()} — this single step carries ${report.actionPlan[0].impact}-impact potential.`
    : '';
  const retirementText = report.retirementGap.gap > 0
    ? `On retirement: a gap of ${formatINR(report.retirementGap.gap)} between projected corpus and target. A monthly SIP of ${formatINR(report.retirementGap.monthlyToClose)} through Regular plans over ${report.retirementGap.yearsToRetirement} years could close it. Equity gains held >12 months attract 12.5% LTCG above the Rs. 1.25L FY exemption under Finance Act 2024 — worth reviewing the tax-efficient drawdown sequence with the Trustner team.`
    : 'On retirement: the current trajectory is broadly aligned with retirement needs.';
  const closing = `This document is a financial wellness assessment, not investment advice. For review and a personalised action plan, speak with the Trustner team at 6003903737 or visit merasip.com.`;

  if (tier === 'basic') {
    const topActions = report.actionPlan.slice(0, 3).map(a => a.action.toLowerCase()).join('; ');
    return `${opening} ${strengthText}. ${weaknessText}.${topActions ? ` Considerations for review: ${topActions}.` : ''} ${closing}`;
  }

  if (tier === 'comprehensive') {
    const pillarDetails = pillarArr.map(p =>
      `${p.name} scored ${p.score}/180 (${p.grade}) — ${p.keyInsight.toLowerCase()}.`,
    ).join(' ');
    const insuranceText = report.insuranceGap.lifeInsuranceGap > 0
      ? `Protection: life cover short by ${formatINR(report.insuranceGap.lifeInsuranceGap)}. Health cover ${report.insuranceGap.healthAdequacy.toLowerCase()}. A consideration to review with a licensed insurance advisor.`
      : `Protection: life cover appears adequate. Health cover ${report.insuranceGap.healthAdequacy.toLowerCase()}.`;
    const debtText = report.debtManagement.debtToIncomeRatio > 0.4
      ? `Debt: DTI of ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}% sits above the 40% comfort threshold. Worth reviewing prepayment priorities.`
      : '';
    const netWorthText = `Current net worth: ${formatINR(report.netWorth.netWorth)}.`;
    return [opening, stageLine, netWorthText, pillarDetails, strengthText, weaknessText, insuranceText, debtText, actionText, retirementText, closing]
      .filter(Boolean).join(' ');
  }

  return [opening, stageLine, strengthText, weaknessText, actionText, retirementText, closing].filter(Boolean).join(' ');
}

/**
 * Generate personalised narrative using Claude API with template fallback.
 */
export async function generateClaudeNarrative(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
  tier: PlanTier = 'standard',
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[Claude Narrative] ANTHROPIC_API_KEY not set — using fallback narrative');
    return generateFallbackNarrative(report, data, userName, tier);
  }

  // Bumped comprehensive ceiling 1200 -> 2000 so the 7-section narrative
  // (Executive Overview, Strengths, Gaps, Goal-by-Goal, Protection/Tax,
  // Behavioural Coach, Carry-Forward Questions) can breathe.
  const maxTokensByTier: Record<PlanTier, number> = {
    basic: 300,
    standard: 700,
    comprehensive: 2000,
  };

  try {
    const client = new Anthropic({ apiKey });

    // Fetch live preferred-funds context (memoized 5 min). When non-empty,
    // we append it to the user-prompt body so Claude can reference category
    // leaders by name in the Goal-by-Goal section.
    const preferredFundsBlock = await getPreferredFundsContext();
    const userPrompt = preferredFundsBlock
      ? `${buildUserPrompt(report, data, userName, tier)}\n\n${preferredFundsBlock}`
      : buildUserPrompt(report, data, userName, tier);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokensByTier[tier],
      // System is an array of content blocks: STATIC_RULES_BLOCK is marked
      // cache_control: ephemeral (90% cheaper on cache reads, 5-min TTL),
      // tier-specific structure is the second block and stays uncached.
      system: buildSystemPrompt(tier),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const usage = message.usage as typeof message.usage & {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    console.log(
      `[Claude Narrative] tier=${tier} | input=${usage.input_tokens} | cache_write=${usage.cache_creation_input_tokens ?? 0} | cache_read=${usage.cache_read_input_tokens ?? 0} | output=${usage.output_tokens}`,
    );

    const textBlock = message.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      console.log(`[Claude Narrative] tier=${tier} wordCount=${textBlock.text.split(/\s+/).length}`);
      return textBlock.text;
    }
    console.warn('[Claude Narrative] No text block in response — using fallback');
    return generateFallbackNarrative(report, data, userName, tier);
  } catch (error) {
    console.error('[Claude Narrative] API error — using fallback:', error);
    return generateFallbackNarrative(report, data, userName, tier);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY GENERATOR (Comprehensive tier)
// ══════════════════════════════════════════════════════════════════════════
//
// Replaces the templated "You want to reach Rs. X" / "We recommend SIP of Rs. Y"
// fallback table with a bespoke per-goal narrative table. Each row is generated
// by Claude with full life-stage + family + Finance-Act-2024 context.
// ══════════════════════════════════════════════════════════════════════════

import type { ExecutiveSummary } from '@/types/financial-planning-v2';

const EXEC_SUMMARY_SYSTEM_PROMPT = `You are a senior wealth strategist at Trustner Asset Services (MFD ARN-286886) constructing the Executive Summary table for a Comprehensive Financial Blueprint. You will be given the client's profile and a list of stated financial goals.

For EACH goal, return ONE object with these four fields:
  area:           Short label, max 15 chars (e.g. "Child Education", "Retirement", "House", "Wealth Creation")
  clientGoal:     ONE humanised sentence weaving (a) the named family member if any, (b) the inflation assumption used, (c) the saved-so-far head-start in Rs lakh/crore. Example: "Funding Aarav's engineering education in 2031 — present cost Rs. 35L inflated to Rs. 56L at 10% education inflation. The existing Rs. 5L is the head-start."
  recommendation: Three sequenced moves in the format "(1) ... (2) ... (3) ...". Move 1 must reference a Regular plan and an asset CATEGORY (Flexi/Large/Mid/Small Cap/BAF/Hybrid/ELSS/Arbitrage/Short Duration Debt/Liquid). Move 2 should be a step-up or rebalancing discipline. Move 3 must include a Finance Act 2024-aware de-risk threshold or tax handling. Every recommendation begins with the literal phrase "Consideration for review:".
  priority:       Exactly one of: "critical" | "important" | "nice-to-have". Critical = at risk of structural failure without action. Important = on track but lever pulls help. Nice-to-have = comfortable cushion.

ALSO return overallMessage: one warm 2-sentence summary across all goals, addressing the client by first name.

${MFD_DISCLAIMER}

${FINANCE_ACT_2024_RATES}

${LANGUAGE_DISCIPLINE}

Return STRICT JSON only. Schema:
{
  "items": [
    { "area": "...", "clientGoal": "...", "recommendation": "Consideration for review: (1) ... (2) ... (3) ...", "priority": "critical" | "important" | "nice-to-have" }
  ],
  "overallMessage": "..."
}

NEVER include any other text, markdown, or commentary outside the JSON.`;

function buildExecSummaryUserPrompt(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
): string {
  const firstName = userName.split(' ')[0];
  const lifeStage = deriveLifeStage(data);
  const familyBlock = buildFamilyNarrativeBlock(data);
  const incomeMonthly = data.incomeProfile.monthlyInHandSalary || 0;

  const goals = report.goalGaps || [];
  const goalLines = goals.map((g, idx) => {
    const yrs = (g.futureCost > 0 && g.currentProgress > 0)
      ? Math.max(1, Math.ceil(Math.log(g.futureCost / Math.max(g.currentProgress, 1)) / Math.log(1.1)))
      : 5;
    return `  Goal ${idx + 1}: ${g.goalName}
    Future cost: ${formatINR(g.futureCost)}
    Currently saved: ${formatINR(g.currentProgress)}
    Monthly SIP needed: ${formatINR(g.monthlyRequired)}
    Approximate horizon: ${yrs} years
    Feasibility (engine-computed): ${g.feasibility}`;
  }).join('\n\n');

  return `Construct the Executive Summary table for this client.

CLIENT: ${firstName}
Age: ${data.personalProfile.age || 30}
City: ${data.personalProfile.city || 'India'}
Monthly in-hand income: ${formatINR(incomeMonthly)}
Risk category: ${data.riskProfile.riskCategory}

${familyBlock}

LIFE STAGE: ${lifeStage.stage.replace(/_/g, ' ').toLowerCase()}
  Dominant risk: ${lifeStage.dominantRisk}
  Primary focus: ${lifeStage.primaryFocus}

GOALS (one row per goal):
${goalLines}

KEY BEHAVIOURAL CONTEXT:
- Retirement gap: ${report.retirementGap.gap > 0 ? formatINR(report.retirementGap.gap) + ' shortfall' : 'on track'}
- Insurance gap: ${report.insuranceGap.lifeInsuranceGap > 0 ? formatINR(report.insuranceGap.lifeInsuranceGap) + ' life cover short' : 'adequate cover'}
- DTI: ${(report.debtManagement.debtToIncomeRatio * 100).toFixed(0)}%

Return STRICT JSON only.`;
}

/**
 * Generate the Executive Summary V2 object (one item per goal + overallMessage).
 * Returns undefined on any error so the PDF renderer falls back to its built-in
 * table (no breakage). Logs the error so we know when to debug.
 */
export async function buildExecutiveSummary(
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  userName: string,
): Promise<ExecutiveSummary | undefined> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Exec Summary] ANTHROPIC_API_KEY not set — skipping (PDF will use fallback)');
    return undefined;
  }
  if (!report.goalGaps || report.goalGaps.length === 0) {
    return undefined;
  }

  try {
    const client = new Anthropic({ apiKey });

    // Append live preferred-funds context so per-goal recommendations can
    // reference the research desk's current category leader by name.
    const preferredFundsBlock = await getPreferredFundsContext();
    const userPrompt = preferredFundsBlock
      ? `${buildExecSummaryUserPrompt(report, data, userName)}\n\n${preferredFundsBlock}`
      : buildExecSummaryUserPrompt(report, data, userName);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      // Cache the entire EXEC_SUMMARY_SYSTEM_PROMPT (all of it is stable
      // across calls — schema + MFD/tax/language rules).
      system: [
        {
          type: 'text',
          text: EXEC_SUMMARY_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const usage = message.usage as typeof message.usage & {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    console.log(
      `[Exec Summary] input=${usage.input_tokens} | cache_write=${usage.cache_creation_input_tokens ?? 0} | cache_read=${usage.cache_read_input_tokens ?? 0} | output=${usage.output_tokens}`,
    );

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return undefined;

    // Strip markdown fences if Claude wrapped it
    let raw = textBlock.text.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(raw) as ExecutiveSummary;

    // Defensive validation — drop malformed items, ensure priority is valid
    const validPriorities = new Set(['critical', 'important', 'nice-to-have']);
    parsed.items = (parsed.items || [])
      .filter(i => i && i.area && i.clientGoal && i.recommendation)
      .map(i => ({
        ...i,
        priority: validPriorities.has(i.priority) ? i.priority : 'important',
      }));

    console.log(`[Exec Summary] generated ${parsed.items.length} items`);
    return parsed;
  } catch (error) {
    console.error('[Exec Summary] generation failed (PDF will use fallback):', error);
    return undefined;
  }
}
