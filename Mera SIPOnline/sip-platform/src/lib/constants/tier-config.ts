import { User, Briefcase, Landmark, CreditCard, Shield, Target, Brain, Calculator, IndianRupee, Camera, Users } from 'lucide-react';
import type { PlanTier } from '@/types/financial-planning-v2';

// Which wizard steps are shown for each tier
export const TIER_STEPS: Record<PlanTier, number[]> = {
  basic:         [1, 2, 3],              // About You, Money Flow, Quick Snapshot
  standard:      [1, 2, 3, 4, 5, 6],     // Personal, Career/Income, Assets, Debts, Insurance, Goals/Risk
  comprehensive: [1, 2, 3, 4, 5, 6, 7, 8], // All standard + Tax/Emergency + Family Details
};

// Step definitions per tier
export interface TierStepDef {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
}

export const BASIC_STEPS: TierStepDef[] = [
  { id: 1, title: 'About You', shortTitle: 'You', description: 'Tell us about yourself', iconName: 'User' },
  { id: 2, title: 'Money Flow', shortTitle: 'Money', description: 'Your income and expenses', iconName: 'IndianRupee' },
  { id: 3, title: 'Quick Snapshot', shortTitle: 'Snapshot', description: 'Savings, insurance & emergency fund', iconName: 'Camera' },
];

export const STANDARD_STEPS: TierStepDef[] = [
  { id: 1, title: 'Personal Profile', shortTitle: 'Personal', description: 'About you and your family', iconName: 'User' },
  { id: 2, title: 'Career & Income', shortTitle: 'Career', description: 'Employment, income & expenses', iconName: 'Briefcase' },
  { id: 3, title: 'Assets & Investments', shortTitle: 'Assets', description: 'Your savings and investments', iconName: 'Landmark' },
  { id: 4, title: 'Loans & Liabilities', shortTitle: 'Debts', description: 'Outstanding loans and EMIs', iconName: 'CreditCard' },
  { id: 5, title: 'Insurance & Protection', shortTitle: 'Insurance', description: 'Life, health & critical illness cover', iconName: 'Shield' },
  { id: 6, title: 'Goals & Risk Profile', shortTitle: 'Goals', description: 'Your financial goals and risk appetite', iconName: 'Target' },
];

export const COMPREHENSIVE_STEPS: TierStepDef[] = [
  ...STANDARD_STEPS,
  { id: 7, title: 'Tax & Emergency Fund', shortTitle: 'Tax', description: 'Tax regime, deductions & emergency preparedness', iconName: 'Calculator' },
  { id: 8, title: 'Family Details', shortTitle: 'Family', description: 'Detailed family profiles & health history', iconName: 'Users' },
];

export function getStepsForTier(tier: PlanTier): TierStepDef[] {
  switch (tier) {
    case 'basic': return BASIC_STEPS;
    case 'standard': return STANDARD_STEPS;
    case 'comprehensive': return COMPREHENSIVE_STEPS;
  }
}

// Tier display config
export interface TierDisplayConfig {
  tier: PlanTier;
  name: string;
  subtitle: string;
  description: string;
  duration: string;
  steps: number;
  fields: string;
  reportPages: number;
  features: string[];
  badge: string;
  color: string;
  recommended?: boolean;
}

export const TIER_CONFIGS: TierDisplayConfig[] = [
  {
    tier: 'basic',
    name: 'Financial Health Check',
    subtitle: 'Quick Scan',
    description: 'Get your financial health score in 5 minutes. Perfect for a first look at where you stand.',
    duration: '5 minutes',
    steps: 3,
    fields: '~15 fields',
    reportPages: 4,
    features: [
      'Financial Health Score (0-900)',
      '5-Pillar Analysis',
      'Net Worth Estimate',
      'Insurance Gap Flag',
      'Emergency Fund Status',
      'Top 5 Action Items',
    ],
    badge: 'FREE',
    color: 'emerald',
  },
  {
    tier: 'standard',
    name: 'Goal-Based Financial Plan',
    subtitle: 'Recommended',
    description: 'Define your life goals and get personalized SIP recommendations for each. Ideal for focused planning.',
    duration: '15 minutes',
    steps: 6,
    fields: '~35 fields',
    reportPages: 8,
    features: [
      'Everything in Basic, plus:',
      'Goal-wise SIP Recommendations',
      'Detailed Net Worth Statement',
      'Insurance Gap Analysis (HLV)',
      'Asset Allocation Recommendation',
      'Personalized Action Plan',
      'AI-Powered Analysis',
    ],
    badge: 'RECOMMENDED',
    color: 'brand',
    recommended: true,
  },
  {
    tier: 'comprehensive',
    name: 'CFP-Grade Financial Blueprint',
    subtitle: 'Premium',
    description: 'A complete financial blueprint with 5-year cashflow projection, tax optimization, and detailed family planning — on par with what top CFPs charge ₹25,000+ for.',
    duration: '30 minutes',
    steps: 8,
    fields: 'All fields',
    reportPages: 16,
    features: [
      'Everything in Standard, plus:',
      'Executive Summary (Goals vs Recommendations)',
      '5-Year Cashflow Projection',
      'Asset Allocation Matrix by Time Horizon',
      'Tax Optimization Strategy',
      'Debt Management Plan',
      '12-Month Action Timeline',
      'Extended AI Narrative (500+ words)',
      'Family Health & Succession Planning',
    ],
    badge: 'PREMIUM',
    color: 'amber',
  },
];

// Standalone planning modules config
export interface StandalonePlanConfig {
  slug: string;
  title: string;
  description: string;
  goalType: string;
  tier: PlanTier;
  iconName: string;
  steps: number[];
  reportPages: number;
}

export const STANDALONE_PLANS: StandalonePlanConfig[] = [
  {
    slug: 'retirement',
    title: 'Retirement Planning',
    description: 'Calculate your retirement corpus and get a personalized plan to achieve financial independence.',
    goalType: 'retirement',
    tier: 'standard',
    iconName: 'Target',
    steps: [1, 2, 3, 6], // Personal, Income, Assets, Goal
    reportPages: 6,
  },
  {
    slug: 'child-education',
    title: 'Child Education Planning',
    description: 'Plan for your child\'s education from school to post-graduation with inflation-adjusted projections.',
    goalType: 'child-education',
    tier: 'standard',
    iconName: 'GraduationCap',
    steps: [1, 2, 3, 6],
    reportPages: 6,
  },
  {
    slug: 'child-marriage',
    title: 'Child Marriage Planning',
    description: 'Build a dedicated corpus for your child\'s wedding and related expenses.',
    goalType: 'child-marriage',
    tier: 'standard',
    iconName: 'Heart',
    steps: [1, 2, 3, 6],
    reportPages: 6,
  },
  {
    slug: 'house-purchase',
    title: 'Home Purchase Planning',
    description: 'Plan your dream home — down payment, EMI affordability, and investment strategy.',
    goalType: 'house-purchase',
    tier: 'standard',
    iconName: 'Home',
    steps: [1, 2, 3, 4, 6],
    reportPages: 6,
  },
  {
    slug: 'emergency-fund',
    title: 'Emergency Fund Planning',
    description: 'Build a safety net for unexpected expenses. Know how much you need and how to build it.',
    goalType: 'emergency-fund',
    tier: 'basic',
    iconName: 'ShieldAlert',
    steps: [1, 2, 3],
    reportPages: 4,
  },
  {
    slug: 'tax-saving',
    title: 'Tax Saving Strategy',
    description: 'Optimize your tax planning across old and new regimes with smart investment recommendations.',
    goalType: 'custom',
    tier: 'standard',
    iconName: 'Calculator',
    steps: [1, 2, 3, 5, 7],
    reportPages: 6,
  },
];

// PDF page count per tier
export const TIER_PDF_PAGES: Record<PlanTier, number> = {
  basic: 4,
  standard: 8,
  comprehensive: 16,
};

// Claude narrative length per tier
export const TIER_NARRATIVE_CONFIG: Record<PlanTier, { minWords: number; maxWords: number; tone: string }> = {
  basic: { minWords: 100, maxWords: 150, tone: 'encouraging and brief' },
  standard: { minWords: 250, maxWords: 350, tone: 'professional and thorough, 2nd person POV' },
  comprehensive: { minWords: 500, maxWords: 700, tone: 'expert CFP-grade analysis, 2nd person POV, structured sections' },
};
