'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Briefcase, Landmark, CreditCard, Shield,
  Target, Brain, Calculator, Loader2,
} from 'lucide-react';

import { OTPGate } from '@/components/financial-planning/OTPGate';
import WizardShell from '@/components/financial-planning/WizardShell';
import WizardStep from '@/components/financial-planning/WizardStep';
import PersonalProfileStep from '@/components/financial-planning/steps/PersonalProfileStep';
import CareerIncomeStep from '@/components/financial-planning/steps/CareerIncomeStep';
import AssetsInvestmentsStep from '@/components/financial-planning/steps/AssetsInvestmentsStep';
import LiabilitiesStep from '@/components/financial-planning/steps/LiabilitiesStep';
import InsuranceStep from '@/components/financial-planning/steps/InsuranceStep';
import GoalsStep from '@/components/financial-planning/steps/GoalsStep';
import RiskBehaviorStep from '@/components/financial-planning/steps/RiskBehaviorStep';
import EmergencyTaxStep from '@/components/financial-planning/steps/EmergencyTaxStep';
import { DEFAULT_PLANNING_DATA } from '@/lib/constants/financial-planning';
import { INDIA_STATES } from '@/lib/constants/india-locations';

import type {
  FinancialPlanningData,
  AssetProfile,
  LiabilityProfile,
  InsuranceProfile,
  FinancialGoal,
  RiskProfile,
  BehavioralProfile,
  EmergencyProfile,
  TaxProfile,
} from '@/types/financial-planning';

// Storage keys
const STORAGE_KEY = 'fp-wizard-data';

// ─────────────────────────────────────────────────────────────────────────────
// Data helpers
// ─────────────────────────────────────────────────────────────────────────────

type PersonalProfileData = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents: number;
  spouseAge: number | null;
  childrenAges: number[];
  state: string;
  city: string;
  cityTier: string;
  otherCity: string;
  pincode: string;
  residentialStatus: string;
};

type CareerIncomeData = {
  employmentType: string;
  industry: string;
  yearsInCurrentJob: number;
  incomeStability: string;
  expectedRetirementAge: number;
  spouseWorks: boolean;
  expectedAnnualGrowth: number;
  monthlyInHandSalary: number;
  annualBonus: number;
  rentalIncome: number;
  businessIncome: number;
  otherIncome: number;
  monthlyHouseholdExpenses: number;
  monthlyEMIs: number;
  monthlyRent: number;
  monthlySIPsRunning: number;
  monthlyInsurancePremiums: number;
  annualDiscretionary: number;
};

function extractPersonalProfile(d: FinancialPlanningData): PersonalProfileData {
  const p = d.personalProfile;
  return {
    fullName: p.fullName,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    maritalStatus: p.maritalStatus,
    dependents: p.dependents,
    spouseAge: p.spouseAge,
    childrenAges: p.childrenAges,
    state: p.state,
    city: p.city,
    cityTier: p.cityTier,
    otherCity: p.otherCity,
    pincode: p.pincode,
    residentialStatus: p.residentialStatus,
  };
}

function extractCareerIncome(d: FinancialPlanningData): CareerIncomeData {
  const c = d.careerProfile;
  const i = d.incomeProfile;
  return {
    employmentType: c.employmentType,
    industry: c.industry,
    yearsInCurrentJob: c.yearsInCurrentJob,
    incomeStability: c.incomeStability,
    expectedRetirementAge: c.expectedRetirementAge,
    spouseWorks: c.spouseWorks,
    expectedAnnualGrowth: c.expectedAnnualGrowth,
    monthlyInHandSalary: i.monthlyInHandSalary,
    annualBonus: i.annualBonus,
    rentalIncome: i.rentalIncome,
    businessIncome: i.businessIncome,
    otherIncome: i.otherIncome,
    monthlyHouseholdExpenses: i.monthlyHouseholdExpenses,
    monthlyEMIs: i.monthlyEMIs,
    monthlyRent: i.monthlyRent,
    monthlySIPsRunning: i.monthlySIPsRunning,
    monthlyInsurancePremiums: i.monthlyInsurancePremiums,
    annualDiscretionary: i.annualDiscretionary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AssessPage() {
  const router = useRouter();

  // Auth state
  const [verified, setVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Master data
  const [planData, setPlanData] = useState<FinancialPlanningData>(
    () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            return JSON.parse(stored) as FinancialPlanningData;
          }
        } catch { /* ignore */ }
      }
      return { ...DEFAULT_PLANNING_DATA };
    }
  );

  // Persist data on every update
  const updateData = useCallback((updater: (prev: FinancialPlanningData) => FinancialPlanningData) => {
    setPlanData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* quota */ }
      return next;
    });
  }, []);

  // ── OTP Verified ──
  const handleVerified = useCallback((token: string, phone: string, email: string) => {
    setSessionToken(token);
    setVerified(true);
    updateData((prev) => ({
      ...prev,
      personalProfile: { ...prev.personalProfile, phone, email },
    }));
  }, [updateData]);

  // ── Step 1: Personal Profile ──
  const handlePersonalUpdate = useCallback((updates: Partial<PersonalProfileData>) => {
    updateData((prev) => {
      let age = prev.personalProfile.age;
      const dob = updates.dateOfBirth ?? prev.personalProfile.dateOfBirth;
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 0) age = 0;
      }
      return {
        ...prev,
        personalProfile: {
          ...prev.personalProfile,
          ...updates,
          age,
        } as FinancialPlanningData['personalProfile'],
      };
    });
  }, [updateData]);

  // ── Step 2: Career & Income ──
  const handleCareerIncomeUpdate = useCallback((updates: Partial<CareerIncomeData>) => {
    updateData((prev) => {
      const careerKeys = ['employmentType', 'industry', 'yearsInCurrentJob', 'incomeStability', 'expectedRetirementAge', 'spouseWorks', 'expectedAnnualGrowth'] as const;
      const careerUpdates: Record<string, unknown> = {};
      const incomeUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if ((careerKeys as readonly string[]).includes(key)) {
          careerUpdates[key] = value;
        } else {
          incomeUpdates[key] = value;
        }
      }
      return {
        ...prev,
        careerProfile: { ...prev.careerProfile, ...careerUpdates } as FinancialPlanningData['careerProfile'],
        incomeProfile: { ...prev.incomeProfile, ...incomeUpdates } as FinancialPlanningData['incomeProfile'],
      };
    });
  }, [updateData]);

  // ── Step 3: Assets ──
  const handleAssetsUpdate = useCallback((updates: Partial<AssetProfile>) => {
    updateData((prev) => ({
      ...prev,
      assetProfile: { ...prev.assetProfile, ...updates },
    }));
  }, [updateData]);

  // ── Step 4: Liabilities ──
  const handleLiabilitiesUpdate = useCallback((updates: Partial<LiabilityProfile>) => {
    updateData((prev) => ({
      ...prev,
      liabilityProfile: { ...prev.liabilityProfile, ...updates },
    }));
  }, [updateData]);

  // ── Step 5: Insurance ──
  const handleInsuranceUpdate = useCallback((updates: Partial<InsuranceProfile>) => {
    updateData((prev) => ({
      ...prev,
      insuranceProfile: { ...prev.insuranceProfile, ...updates },
    }));
  }, [updateData]);

  // ── Step 6: Goals ──
  const handleGoalsUpdate = useCallback((goals: FinancialGoal[]) => {
    updateData((prev) => ({
      ...prev,
      goals,
    }));
  }, [updateData]);

  // ── Step 7: Risk & Behavior ──
  const handleRiskUpdate = useCallback((updates: Partial<RiskProfile>) => {
    updateData((prev) => ({
      ...prev,
      riskProfile: { ...prev.riskProfile, ...updates },
    }));
  }, [updateData]);

  const handleBehavioralUpdate = useCallback((updates: Partial<BehavioralProfile>) => {
    updateData((prev) => ({
      ...prev,
      behavioralProfile: { ...prev.behavioralProfile, ...updates },
    }));
  }, [updateData]);

  // ── Step 8: Emergency & Tax ──
  const handleEmergencyUpdate = useCallback((updates: Partial<EmergencyProfile>) => {
    updateData((prev) => ({
      ...prev,
      emergencyProfile: { ...prev.emergencyProfile, ...updates },
    }));
  }, [updateData]);

  const handleTaxUpdate = useCallback((updates: Partial<TaxProfile>) => {
    updateData((prev) => ({
      ...prev,
      taxProfile: { ...prev.taxProfile, ...updates },
    }));
  }, [updateData]);

  // ── Step Validation ──
  const validateStep = useCallback((stepIndex: number): string | null => {
    const p = planData.personalProfile;
    const i = planData.incomeProfile;

    switch (stepIndex) {
      case 0: {
        // Personal Profile: name, DOB, gender, state required
        if (!p.fullName.trim()) return 'Please enter your full name.';
        if (!p.dateOfBirth) return 'Please select your date of birth.';
        if (!p.gender) return 'Please select your gender.';
        if (!p.state) return 'Please select your state.';
        // If state has cities, city must be selected
        if (p.state && p.state !== 'NRI') {
          const st = INDIA_STATES.find((s) => s.value === p.state);
          if (st && st.cities.length > 0 && !p.city) return 'Please select your city.';
        }
        // If "Other" city, must type city name
        if (p.city === 'other' && !(p.otherCity || '').trim()) return 'Please enter your city / town name.';
        // If NRI, must type location
        if (p.state === 'NRI' && !(p.otherCity || '').trim()) return 'Please enter your current city / country.';
        return null;
      }
      case 1: {
        // Career & Income: monthly salary required
        if (!i.monthlyInHandSalary && i.monthlyInHandSalary !== 0) return 'Please enter your monthly in-hand salary.';
        if (i.monthlyInHandSalary <= 0) return 'Monthly salary must be greater than zero.';
        return null;
      }
      // Steps 2-7 have reasonable defaults, no strict validation needed
      default:
        return null;
    }
  }, [planData]);

  // ── Wizard Completion ──
  const handleComplete = useCallback(async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/financial-planning/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ data: planData }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || 'Submission failed. Please try again.');
        return;
      }

      localStorage.setItem(
        'fp-teaser-data',
        JSON.stringify({
          teaser: result.teaser,
          userName: result.userName,
          userEmail: result.userEmail,
        })
      );

      localStorage.removeItem(STORAGE_KEY);
      router.push('/financial-planning/teaser');
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [planData, sessionToken, router]);

  // ── Build Wizard Steps (all 8) ──
  const wizardSteps = useMemo(() => [
    {
      id: 1,
      title: 'Personal',
      icon: <User className="w-4 h-4" />,
      component: (
        <WizardStep title="Personal Profile" description="Tell us about yourself and your family" icon={<User className="w-5 h-5" />}>
          <PersonalProfileStep data={extractPersonalProfile(planData)} onUpdate={handlePersonalUpdate} />
        </WizardStep>
      ),
    },
    {
      id: 2,
      title: 'Career',
      icon: <Briefcase className="w-4 h-4" />,
      component: (
        <WizardStep title="Career & Income" description="Your employment, income sources and monthly expenses" icon={<Briefcase className="w-5 h-5" />}>
          <CareerIncomeStep data={extractCareerIncome(planData)} onUpdate={handleCareerIncomeUpdate} maritalStatus={planData.personalProfile.maritalStatus} />
        </WizardStep>
      ),
    },
    {
      id: 3,
      title: 'Assets',
      icon: <Landmark className="w-4 h-4" />,
      component: (
        <WizardStep title="Assets & Investments" description="Your current savings, investments and property" icon={<Landmark className="w-5 h-5" />}>
          <AssetsInvestmentsStep data={planData.assetProfile} onUpdate={handleAssetsUpdate} />
        </WizardStep>
      ),
    },
    {
      id: 4,
      title: 'Debts',
      icon: <CreditCard className="w-4 h-4" />,
      component: (
        <WizardStep title="Loans & Liabilities" description="Outstanding loans, EMIs and credit card debt" icon={<CreditCard className="w-5 h-5" />}>
          <LiabilitiesStep data={planData.liabilityProfile} onUpdate={handleLiabilitiesUpdate} />
        </WizardStep>
      ),
    },
    {
      id: 5,
      title: 'Insurance',
      icon: <Shield className="w-4 h-4" />,
      component: (
        <WizardStep title="Insurance & Protection" description="Your life, health, and critical illness coverage" icon={<Shield className="w-5 h-5" />}>
          <InsuranceStep data={planData.insuranceProfile} onUpdate={handleInsuranceUpdate} />
        </WizardStep>
      ),
    },
    {
      id: 6,
      title: 'Goals',
      icon: <Target className="w-4 h-4" />,
      component: (
        <WizardStep title="Financial Goals" description="Define your life goals with target amounts and timelines" icon={<Target className="w-5 h-5" />}>
          <GoalsStep goals={planData.goals} onUpdate={handleGoalsUpdate} age={planData.personalProfile.age} />
        </WizardStep>
      ),
    },
    {
      id: 7,
      title: 'Risk',
      icon: <Brain className="w-4 h-4" />,
      component: (
        <WizardStep title="Risk & Behavior" description="Understand your risk appetite and investment behavior" icon={<Brain className="w-5 h-5" />}>
          <RiskBehaviorStep
            riskData={planData.riskProfile}
            behavioralData={planData.behavioralProfile}
            onUpdateRisk={handleRiskUpdate}
            onUpdateBehavioral={handleBehavioralUpdate}
          />
        </WizardStep>
      ),
    },
    {
      id: 8,
      title: 'Tax & Fund',
      icon: <Calculator className="w-4 h-4" />,
      component: (
        <WizardStep title="Emergency Fund & Tax" description="Tax regime, deductions and emergency preparedness" icon={<Calculator className="w-5 h-5" />}>
          <EmergencyTaxStep
            emergencyData={planData.emergencyProfile}
            taxData={planData.taxProfile}
            onUpdateEmergency={handleEmergencyUpdate}
            onUpdateTax={handleTaxUpdate}
            monthlyExpenses={planData.incomeProfile.monthlyHouseholdExpenses}
          />
        </WizardStep>
      ),
    },
  ], [
    planData,
    handlePersonalUpdate, handleCareerIncomeUpdate, handleAssetsUpdate, handleLiabilitiesUpdate,
    handleInsuranceUpdate, handleGoalsUpdate, handleRiskUpdate, handleBehavioralUpdate,
    handleEmergencyUpdate, handleTaxUpdate,
  ]);

  // ── Render ──

  if (!verified) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
        <OTPGate onVerified={handleVerified} />
      </section>
    );
  }

  if (submitting) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">Analyzing Your Financial Health...</h2>
          <p className="text-slate-500">Calculating your score across 5 pillars</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-8 px-4 bg-gradient-to-b from-slate-50 to-white">
      {submitError && (
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {submitError}
          <button onClick={() => setSubmitError('')} className="ml-3 text-red-900 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}
      <WizardShell steps={wizardSteps} onComplete={handleComplete} storageKey="fp-wizard-step" validateStep={validateStep} />
    </section>
  );
}
