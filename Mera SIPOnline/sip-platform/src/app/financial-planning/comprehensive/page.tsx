'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Briefcase, Landmark, CreditCard, Shield,
  Target, Brain, Calculator, Users, Loader2, Crown,
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
import FamilyDetailStep from '@/components/financial-planning/steps/FamilyDetailStep';
import { DEFAULT_PLANNING_DATA } from '@/lib/constants/financial-planning';
import { INDIA_STATES } from '@/lib/constants/india-locations';
import { DEFAULT_COMPREHENSIVE_PROFILE } from '@/types/financial-planning-v2';

import type {
  FinancialPlanningData,
  AssetProfile, LiabilityProfile, InsuranceProfile,
  FinancialGoal, RiskProfile, BehavioralProfile,
  EmergencyProfile, TaxProfile,
} from '@/types/financial-planning';
import type { ComprehensiveProfile } from '@/types/financial-planning-v2';

const STORAGE_KEY = 'fp-comprehensive-data';
const COMP_STORAGE_KEY = 'fp-comprehensive-profile';

// ─── Data helpers (same as assess page) ─────────────────────────────

type PersonalData = {
  fullName: string; dateOfBirth: string; gender: string; maritalStatus: string;
  dependents: number; spouseAge: number | null; childrenAges: number[];
  state: string; city: string; cityTier: string; otherCity: string;
  pincode: string; residentialStatus: string;
};

type CareerIncomeData = {
  employmentType: string; industry: string; yearsInCurrentJob: number;
  incomeStability: string; expectedRetirementAge: number;
  spouseWorks: boolean; expectedAnnualGrowth: number;
  monthlyInHandSalary: number; annualBonus: number; rentalIncome: number;
  businessIncome: number; otherIncome: number;
  monthlyHouseholdExpenses: number; monthlyEMIs: number; monthlyRent: number;
  monthlySIPsRunning: number; monthlyInsurancePremiums: number; annualDiscretionary: number;
};

function extractPersonal(d: FinancialPlanningData): PersonalData {
  const p = d.personalProfile;
  return { fullName: p.fullName, dateOfBirth: p.dateOfBirth, gender: p.gender, maritalStatus: p.maritalStatus, dependents: p.dependents, spouseAge: p.spouseAge, childrenAges: p.childrenAges, state: p.state, city: p.city, cityTier: p.cityTier, otherCity: p.otherCity, pincode: p.pincode, residentialStatus: p.residentialStatus };
}

function extractCareerIncome(d: FinancialPlanningData): CareerIncomeData {
  const c = d.careerProfile; const i = d.incomeProfile;
  return { employmentType: c.employmentType, industry: c.industry, yearsInCurrentJob: c.yearsInCurrentJob, incomeStability: c.incomeStability, expectedRetirementAge: c.expectedRetirementAge, spouseWorks: c.spouseWorks, expectedAnnualGrowth: c.expectedAnnualGrowth, monthlyInHandSalary: i.monthlyInHandSalary, annualBonus: i.annualBonus, rentalIncome: i.rentalIncome, businessIncome: i.businessIncome, otherIncome: i.otherIncome, monthlyHouseholdExpenses: i.monthlyHouseholdExpenses, monthlyEMIs: i.monthlyEMIs, monthlyRent: i.monthlyRent, monthlySIPsRunning: i.monthlySIPsRunning, monthlyInsurancePremiums: i.monthlyInsurancePremiums, annualDiscretionary: i.annualDiscretionary };
}

// ─── Component ──────────────────────────────────────────────────────

export default function ComprehensivePlanPage() {
  const router = useRouter();

  const [verified, setVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [planData, setPlanData] = useState<FinancialPlanningData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as FinancialPlanningData;
      } catch { /* ignore */ }
    }
    return { ...DEFAULT_PLANNING_DATA };
  });

  const [compProfile, setCompProfile] = useState<ComprehensiveProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(COMP_STORAGE_KEY);
        if (stored) return JSON.parse(stored) as ComprehensiveProfile;
      } catch { /* ignore */ }
    }
    return { ...DEFAULT_COMPREHENSIVE_PROFILE };
  });

  // Check for pre-verified session from landing page
  useEffect(() => {
    if (verified) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === '1') {
        const session = localStorage.getItem('fp-session');
        if (session) {
          const { token, phone, email } = JSON.parse(session);
          if (token && phone && email) {
            setSessionToken(token);
            setVerified(true);
            setPlanData((prev) => ({
              ...prev,
              personalProfile: { ...prev.personalProfile, phone, email },
            }));
            localStorage.removeItem('fp-session');
          }
        }
      }
    } catch { /* ignore */ }
  }, [verified]);

  const updateData = useCallback((updater: (prev: FinancialPlanningData) => FinancialPlanningData) => {
    setPlanData((prev) => {
      const next = updater(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  const updateCompProfile = useCallback((updates: Partial<ComprehensiveProfile>) => {
    setCompProfile((prev) => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(COMP_STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  // ── Handlers ──
  const handleVerified = useCallback((token: string, phone: string, email: string) => {
    setSessionToken(token);
    setVerified(true);
    updateData((prev) => ({ ...prev, personalProfile: { ...prev.personalProfile, phone, email } }));
  }, [updateData]);

  const handlePersonalUpdate = useCallback((updates: Partial<PersonalData>) => {
    updateData((prev) => {
      let age = prev.personalProfile.age;
      const dob = updates.dateOfBirth ?? prev.personalProfile.dateOfBirth;
      if (dob) {
        const bd = new Date(dob); const today = new Date();
        age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        if (age < 0) age = 0;
      }
      return { ...prev, personalProfile: { ...prev.personalProfile, ...updates, age } as FinancialPlanningData['personalProfile'] };
    });
  }, [updateData]);

  const handleCareerIncomeUpdate = useCallback((updates: Partial<CareerIncomeData>) => {
    updateData((prev) => {
      const careerKeys = ['employmentType', 'industry', 'yearsInCurrentJob', 'incomeStability', 'expectedRetirementAge', 'spouseWorks', 'expectedAnnualGrowth'];
      const careerUpdates: Record<string, unknown> = {};
      const incomeUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (careerKeys.includes(k)) careerUpdates[k] = v;
        else incomeUpdates[k] = v;
      }
      return { ...prev, careerProfile: { ...prev.careerProfile, ...careerUpdates }, incomeProfile: { ...prev.incomeProfile, ...incomeUpdates } } as FinancialPlanningData;
    });
  }, [updateData]);

  const handleAssetsUpdate = useCallback((u: Partial<AssetProfile>) => updateData((p) => ({ ...p, assetProfile: { ...p.assetProfile, ...u } })), [updateData]);
  const handleLiabilitiesUpdate = useCallback((u: Partial<LiabilityProfile>) => updateData((p) => ({ ...p, liabilityProfile: { ...p.liabilityProfile, ...u } })), [updateData]);
  const handleInsuranceUpdate = useCallback((u: Partial<InsuranceProfile>) => updateData((p) => ({ ...p, insuranceProfile: { ...p.insuranceProfile, ...u } })), [updateData]);
  const handleGoalsUpdate = useCallback((goals: FinancialGoal[]) => updateData((p) => ({ ...p, goals })), [updateData]);
  const handleRiskUpdate = useCallback((u: Partial<RiskProfile>) => updateData((p) => ({ ...p, riskProfile: { ...p.riskProfile, ...u } })), [updateData]);
  const handleBehavioralUpdate = useCallback((u: Partial<BehavioralProfile>) => updateData((p) => ({ ...p, behavioralProfile: { ...p.behavioralProfile, ...u } })), [updateData]);
  const handleEmergencyUpdate = useCallback((u: Partial<EmergencyProfile>) => updateData((p) => ({ ...p, emergencyProfile: { ...p.emergencyProfile, ...u } })), [updateData]);
  const handleTaxUpdate = useCallback((u: Partial<TaxProfile>) => updateData((p) => ({ ...p, taxProfile: { ...p.taxProfile, ...u } })), [updateData]);

  // ── Validation ──
  const validateStep = useCallback((stepIndex: number): string | null => {
    const p = planData.personalProfile;
    const i = planData.incomeProfile;
    switch (stepIndex) {
      case 0: {
        if (!p.fullName.trim()) return 'Please enter your full name.';
        if (!p.dateOfBirth) return 'Please select your date of birth.';
        if (!p.gender) return 'Please select your gender.';
        if (!p.state) return 'Please select your state.';
        if (p.state && p.state !== 'NRI') {
          const st = INDIA_STATES.find((s) => s.value === p.state);
          if (st && st.cities.length > 0 && !p.city) return 'Please select your city.';
        }
        return null;
      }
      case 1: {
        if (!i.monthlyInHandSalary || i.monthlyInHandSalary <= 0) return 'Please enter your monthly salary.';
        return null;
      }
      default: return null;
    }
  }, [planData]);

  // ── Submit ──
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
        body: JSON.stringify({
          data: planData,
          tier: 'comprehensive',
          comprehensiveProfile: compProfile,
        }),
      });
      const result = await res.json();
      if (!res.ok) { setSubmitError(result.error || 'Submission failed.'); return; }
      localStorage.setItem('fp-teaser-data', JSON.stringify({ teaser: result.teaser, userName: result.userName, userEmail: result.userEmail, tier: 'comprehensive' }));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COMP_STORAGE_KEY);
      router.push('/financial-planning/teaser');
    } catch { setSubmitError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  }, [planData, compProfile, sessionToken, router]);

  // ── 9 Wizard Steps ──
  const wizardSteps = useMemo(() => [
    { id: 1, title: 'Personal', icon: <User className="w-4 h-4" />, component: (
      <WizardStep title="Personal Profile" description="Tell us about yourself and your family" icon={<User className="w-5 h-5" />}>
        <PersonalProfileStep data={extractPersonal(planData)} onUpdate={handlePersonalUpdate} />
      </WizardStep>
    )},
    { id: 2, title: 'Career', icon: <Briefcase className="w-4 h-4" />, component: (
      <WizardStep title="Career & Income" description="Employment, income sources and expenses" icon={<Briefcase className="w-5 h-5" />}>
        <CareerIncomeStep data={extractCareerIncome(planData)} onUpdate={handleCareerIncomeUpdate} maritalStatus={planData.personalProfile.maritalStatus} />
      </WizardStep>
    )},
    { id: 3, title: 'Assets', icon: <Landmark className="w-4 h-4" />, component: (
      <WizardStep title="Assets & Investments" description="Your savings, investments and property" icon={<Landmark className="w-5 h-5" />}>
        <AssetsInvestmentsStep data={planData.assetProfile} onUpdate={handleAssetsUpdate} />
      </WizardStep>
    )},
    { id: 4, title: 'Debts', icon: <CreditCard className="w-4 h-4" />, component: (
      <WizardStep title="Loans & Liabilities" description="Outstanding loans and EMIs" icon={<CreditCard className="w-5 h-5" />}>
        <LiabilitiesStep data={planData.liabilityProfile} onUpdate={handleLiabilitiesUpdate} />
      </WizardStep>
    )},
    { id: 5, title: 'Insurance', icon: <Shield className="w-4 h-4" />, component: (
      <WizardStep title="Insurance & Protection" description="Life, health, and critical illness coverage" icon={<Shield className="w-5 h-5" />}>
        <InsuranceStep data={planData.insuranceProfile} onUpdate={handleInsuranceUpdate} />
      </WizardStep>
    )},
    { id: 6, title: 'Goals', icon: <Target className="w-4 h-4" />, component: (
      <WizardStep title="Financial Goals" description="Define your life goals with target amounts" icon={<Target className="w-5 h-5" />}>
        <GoalsStep goals={planData.goals} onUpdate={handleGoalsUpdate} age={planData.personalProfile.age} />
      </WizardStep>
    )},
    { id: 7, title: 'Risk', icon: <Brain className="w-4 h-4" />, component: (
      <WizardStep title="Risk & Behavior" description="Your risk appetite and investment behavior" icon={<Brain className="w-5 h-5" />}>
        <RiskBehaviorStep riskData={planData.riskProfile} behavioralData={planData.behavioralProfile} onUpdateRisk={handleRiskUpdate} onUpdateBehavioral={handleBehavioralUpdate} />
      </WizardStep>
    )},
    { id: 8, title: 'Tax', icon: <Calculator className="w-4 h-4" />, component: (
      <WizardStep title="Emergency Fund & Tax" description="Tax regime, deductions and emergency preparedness" icon={<Calculator className="w-5 h-5" />}>
        <EmergencyTaxStep emergencyData={planData.emergencyProfile} taxData={planData.taxProfile} onUpdateEmergency={handleEmergencyUpdate} onUpdateTax={handleTaxUpdate} monthlyExpenses={planData.incomeProfile.monthlyHouseholdExpenses} />
      </WizardStep>
    )},
    { id: 9, title: 'Family', icon: <Users className="w-4 h-4" />, component: (
      <WizardStep title="Family Details & Expenses" description="Detailed family profiles, health history and expense breakdown" icon={<Users className="w-5 h-5" />}>
        <FamilyDetailStep data={compProfile} onUpdate={updateCompProfile} maritalStatus={planData.personalProfile.maritalStatus} dependentsCount={planData.personalProfile.dependents} childrenAges={planData.personalProfile.childrenAges} />
      </WizardStep>
    )},
  ], [planData, compProfile, handlePersonalUpdate, handleCareerIncomeUpdate, handleAssetsUpdate, handleLiabilitiesUpdate, handleInsuranceUpdate, handleGoalsUpdate, handleRiskUpdate, handleBehavioralUpdate, handleEmergencyUpdate, handleTaxUpdate, updateCompProfile]);

  // ── Render ──
  if (!verified) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-amber-50/30 to-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 mb-3">
              <Crown className="w-3.5 h-3.5" /> COMPREHENSIVE • CFP-GRADE
            </span>
            <h1 className="text-2xl font-bold text-primary-700">Comprehensive Financial Blueprint</h1>
            <p className="text-sm text-slate-500 mt-1">A complete financial plan with 5-year cashflow projection, asset allocation matrix, and personalized recommendations</p>
          </div>
          <OTPGate onVerified={handleVerified} />
        </div>
      </section>
    );
  }

  if (submitting) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">Building Your Financial Blueprint...</h2>
          <p className="text-slate-500">Generating 16-page comprehensive report with AI analysis</p>
          <p className="text-xs text-slate-400 mt-2">This may take 30-45 seconds</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-8 px-4 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-2xl mx-auto text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
          <Crown className="w-3.5 h-3.5" /> COMPREHENSIVE FINANCIAL BLUEPRINT • 9 STEPS
        </span>
      </div>

      {submitError && (
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {submitError}
          <button onClick={() => setSubmitError('')} className="ml-3 text-red-900 font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      <WizardShell steps={wizardSteps} onComplete={handleComplete} storageKey="fp-comprehensive-step" validateStep={validateStep} />
    </section>
  );
}
