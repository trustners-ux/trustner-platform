/**
 * One-time script to generate a sample financial health report PDF.
 * Run: npx tsx scripts/generate-sample-report.ts
 * Output: public/sample-financial-health-report.pdf
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { generateFullReport } from '../src/lib/utils/financial-planning-calc';
import { generateFinancialReport } from '../src/lib/utils/financial-planning-pdf';
import type { FinancialPlanningData, FinancialHealthReport } from '../src/types/financial-planning';

// Mock data for a realistic sample investor — "Rahul Sharma", 32, Bangalore
const mockData: FinancialPlanningData = {
  personalProfile: {
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    dateOfBirth: '1993-06-15',
    age: 32,
    gender: 'male',
    maritalStatus: 'married',
    dependents: 2,
    spouseAge: 30,
    childrenAges: [4, 1],
    state: 'KA',
    city: 'Bangalore',
    cityTier: 'metro',
    otherCity: '',
    pincode: '',
    residentialStatus: 'rent',
  },
  careerProfile: {
    employmentType: 'salaried',
    industry: 'IT / Technology',
    yearsInCurrentJob: 5,
    incomeStability: 'stable',
    expectedRetirementAge: 60,
    spouseWorks: true,
    expectedAnnualGrowth: 10,
  },
  incomeProfile: {
    monthlyInHandSalary: 150000,
    annualBonus: 300000,
    rentalIncome: 0,
    businessIncome: 0,
    otherIncome: 5000,
    monthlyHouseholdExpenses: 60000,
    monthlyEMIs: 15000,
    monthlyRent: 30000,
    monthlySIPsRunning: 25000,
    monthlyInsurancePremiums: 5000,
    annualDiscretionary: 100000,
  },
  assetProfile: {
    bankSavings: 300000,
    fixedDeposits: 500000,
    mutualFunds: 1500000,
    stocks: 400000,
    ppfEpf: 800000,
    nps: 200000,
    gold: 300000,
    realEstateInvestment: 0,
    primaryResidenceValue: 0,
    otherAssets: 50000,
  },
  liabilityProfile: {
    homeLoan: { outstanding: 0, emi: 0, remainingYears: 0 },
    carLoan: { outstanding: 300000, emi: 10000, remainingYears: 3 },
    personalLoan: { outstanding: 0, emi: 0, remainingYears: 0 },
    educationLoan: { outstanding: 200000, emi: 5000, remainingYears: 4 },
    creditCardDebt: 0,
    otherLoans: 0,
  },
  insuranceProfile: {
    termInsuranceCover: 10000000,
    lifeInsuranceCover: 500000,
    healthInsuranceCover: 1000000,
    hasCriticalIllnessCover: false,
    hasAccidentalCover: true,
    annualLifePremium: 15000,
    annualHealthPremium: 25000,
  },
  goals: [
    {
      id: 'g1',
      name: "Children's Higher Education",
      type: 'child-education',
      targetAmount: 5000000,
      targetYear: 2040,
      priority: 'critical',
      currentSavingsForGoal: 200000,
    },
    {
      id: 'g2',
      name: 'Buy a Home',
      type: 'house-purchase',
      targetAmount: 10000000,
      targetYear: 2028,
      priority: 'important',
      currentSavingsForGoal: 500000,
    },
    {
      id: 'g3',
      name: 'Family Vacation Fund',
      type: 'vacation',
      targetAmount: 300000,
      targetYear: 2026,
      priority: 'nice-to-have',
      currentSavingsForGoal: 50000,
    },
  ],
  riskProfile: {
    marketDropReaction: 'wait-patiently',
    investmentHorizon: '10-plus',
    primaryObjective: 'balanced-growth',
    pastExperience: 'moderate',
    riskScore: 65,
    riskCategory: 'moderate',
  },
  behavioralProfile: {
    tracksExpensesMonthly: true,
    marketNewsInfluence: 'somewhat',
    investmentDiscipline: 'mostly-disciplined',
    behavioralScore: 72,
  },
  emergencyProfile: {
    hasEmergencyFund: true,
    emergencyFundAmount: 300000,
    monthsOfExpensesCovered: 3,
  },
  taxProfile: {
    taxRegime: 'new',
    annualTaxableIncome: 2100000,
    section80CUsed: 150000,
    section80DUsed: 25000,
    hasHRA: true,
    npsContribution: 50000,
  },
};

// Generate the report
console.log('Generating sample financial health report...');
const coreReport = generateFullReport(mockData);

const sampleNarrative = `Dear Rahul,

Congratulations on taking this important step towards understanding your financial health! Your Financial Health Score of ${coreReport.score.totalScore}/900 places you in the "${coreReport.score.grade}" category, which reflects a solid foundation with room for meaningful improvement.

Your strongest area is Cashflow Health, where your disciplined SIP investments and stable income give you an excellent base. At 32, you are in an ideal position to leverage the power of compounding over the next 28 years until retirement.

However, there are areas that need attention. Your insurance coverage needs strengthening — while you have a term plan and basic health insurance, adding critical illness cover and increasing your health coverage (especially with a young family in a metro city) should be a priority. The gap between your current life cover and your Human Life Value suggests you may want to review your term insurance amount.

For your goals, your children's education fund is on track if you maintain current SIP levels, but your home purchase timeline is tight. Consider a dedicated monthly allocation towards this goal.

Your debt management is healthy with a low debt-to-income ratio. As your car and education loans wind down over the next 3-4 years, redirect those EMI amounts into goal-specific SIPs.

I recommend speaking with a Trustner financial advisor to create a detailed investment plan tailored to your goals. Our team can help you optimise your portfolio allocation and identify the right fund categories for each of your goals.

Warm regards,
Trustner Advisory Team`;

const fullReport: FinancialHealthReport = {
  ...coreReport,
  claudeNarrative: sampleNarrative,
};

const pdfBuffer = generateFinancialReport(fullReport, mockData, 'Rahul Sharma');

// Write to public/
const outputPath = join(__dirname, '..', 'public', 'sample-financial-health-report.pdf');
writeFileSync(outputPath, pdfBuffer);

console.log(`Sample report generated successfully!`);
console.log(`Score: ${coreReport.score.totalScore}/900 (${coreReport.score.grade})`);
console.log(`Output: ${outputPath}`);
console.log(`File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
