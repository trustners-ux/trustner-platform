'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, IndianRupee, Camera, Loader2 } from 'lucide-react';

import { OTPGate } from '@/components/financial-planning/OTPGate';
import WizardShell from '@/components/financial-planning/WizardShell';
import WizardStep from '@/components/financial-planning/WizardStep';
import PersonalProfileStep from '@/components/financial-planning/steps/PersonalProfileStep';
import BasicMoneyFlowStep from '@/components/financial-planning/steps/BasicMoneyFlowStep';
import BasicSnapshotStep from '@/components/financial-planning/steps/BasicSnapshotStep';
import { DEFAULT_PLANNING_DATA } from '@/lib/constants/financial-planning';
import { INDIA_STATES } from '@/lib/constants/india-locations';

import type { FinancialPlanningData } from '@/types/financial-planning';

const STORAGE_KEY = 'fp-basic-data';

// ─── Data helpers ───────────────────────────────────────────────────

type PersonalData = {
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

type MoneyFlowData = {
  monthlyInHandSalary: number;
  monthlyHouseholdExpenses: number;
  monthlySIPsRunning: number;
  monthlyEMIs: number;
};

type SnapshotData = {
  mutualFunds: number;
  fixedDeposits: number;
  ppfEpf: number;
  termInsuranceCover: number;
  healthInsuranceCover: number;
  hasEmergencyFund: boolean;
  emergencyFundAmount: number;
};

function extractPersonal(d: FinancialPlanningData): PersonalData {
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

function extractMoneyFlow(d: FinancialPlanningData): MoneyFlowData {
  return {
    monthlyInHandSalary: d.incomeProfile.monthlyInHandSalary,
    monthlyHouseholdExpenses: d.incomeProfile.monthlyHouseholdExpenses,
    monthlySIPsRunning: d.incomeProfile.monthlySIPsRunning,
    monthlyEMIs: d.incomeProfile.monthlyEMIs,
  };
}

function extractSnapshot(d: FinancialPlanningData): SnapshotData {
  return {
    mutualFunds: d.assetProfile.mutualFunds,
    fixedDeposits: d.assetProfile.fixedDeposits,
    ppfEpf: d.assetProfile.ppfEpf,
    termInsuranceCover: d.insuranceProfile.termInsuranceCover,
    healthInsuranceCover: d.insuranceProfile.healthInsuranceCover,
    hasEmergencyFund: d.emergencyProfile.hasEmergencyFund,
    emergencyFundAmount: d.emergencyProfile.emergencyFundAmount,
  };
}

// ─── Component ──────────────────────────────────────────────────────

export default function BasicPlanPage() {
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

  const updateData = useCallback(
    (updater: (prev: FinancialPlanningData) => FinancialPlanningData) => {
      setPlanData((prev) => {
        const next = updater(prev);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
        return next;
      });
    },
    []
  );

  // ── OTP ──
  const handleVerified = useCallback(
    (token: string, phone: string, email: string) => {
      setSessionToken(token);
      setVerified(true);
      updateData((prev) => ({
        ...prev,
        personalProfile: { ...prev.personalProfile, phone, email },
      }));
    },
    [updateData]
  );

  // ── Step 1: Personal ──
  const handlePersonalUpdate = useCallback(
    (updates: Partial<PersonalData>) => {
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
          personalProfile: { ...prev.personalProfile, ...updates, age } as FinancialPlanningData['personalProfile'],
        };
      });
    },
    [updateData]
  );

  // ── Step 2: Money Flow ──
  const handleMoneyFlowUpdate = useCallback(
    (updates: Partial<MoneyFlowData>) => {
      updateData((prev) => ({
        ...prev,
        incomeProfile: { ...prev.incomeProfile, ...updates },
      }));
    },
    [updateData]
  );

  // ── Step 3: Quick Snapshot ──
  const handleSnapshotUpdate = useCallback(
    (updates: Partial<SnapshotData>) => {
      updateData((prev) => {
        const next = { ...prev };
        if ('mutualFunds' in updates || 'fixedDeposits' in updates || 'ppfEpf' in updates) {
          next.assetProfile = {
            ...prev.assetProfile,
            ...(updates.mutualFunds !== undefined && { mutualFunds: updates.mutualFunds }),
            ...(updates.fixedDeposits !== undefined && { fixedDeposits: updates.fixedDeposits }),
            ...(updates.ppfEpf !== undefined && { ppfEpf: updates.ppfEpf }),
          };
        }
        if ('termInsuranceCover' in updates || 'healthInsuranceCover' in updates) {
          next.insuranceProfile = {
            ...prev.insuranceProfile,
            ...(updates.termInsuranceCover !== undefined && { termInsuranceCover: updates.termInsuranceCover }),
            ...(updates.healthInsuranceCover !== undefined && { healthInsuranceCover: updates.healthInsuranceCover }),
          };
        }
        if ('hasEmergencyFund' in updates || 'emergencyFundAmount' in updates) {
          next.emergencyProfile = {
            ...prev.emergencyProfile,
            ...(updates.hasEmergencyFund !== undefined && { hasEmergencyFund: updates.hasEmergencyFund }),
            ...(updates.emergencyFundAmount !== undefined && { emergencyFundAmount: updates.emergencyFundAmount }),
          };
        }
        return next;
      });
    },
    [updateData]
  );

  // ── Validation ──
  const validateStep = useCallback(
    (stepIndex: number): string | null => {
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
          if (p.city === 'other' && !(p.otherCity || '').trim()) return 'Please enter your city / town name.';
          if (p.state === 'NRI' && !(p.otherCity || '').trim()) return 'Please enter your current city / country.';
          return null;
        }
        case 1: {
          if (!i.monthlyInHandSalary || i.monthlyInHandSalary <= 0)
            return 'Please enter your monthly in-hand salary.';
          if (!i.monthlyHouseholdExpenses || i.monthlyHouseholdExpenses <= 0)
            return 'Please enter your monthly household expenses.';
          return null;
        }
        default:
          return null;
      }
    },
    [planData]
  );

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
        body: JSON.stringify({ data: planData, tier: 'basic' }),
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
          tier: 'basic',
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

  // ── Wizard Steps ──
  const wizardSteps = useMemo(
    () => [
      {
        id: 1,
        title: 'About You',
        icon: <User className="w-4 h-4" />,
        component: (
          <WizardStep
            title="About You"
            description="Tell us about yourself — takes just 2 minutes"
            icon={<User className="w-5 h-5" />}
          >
            <PersonalProfileStep data={extractPersonal(planData)} onUpdate={handlePersonalUpdate} />
          </WizardStep>
        ),
      },
      {
        id: 2,
        title: 'Money Flow',
        icon: <IndianRupee className="w-4 h-4" />,
        component: (
          <WizardStep
            title="Your Money Flow"
            description="Monthly income and key expenses"
            icon={<IndianRupee className="w-5 h-5" />}
          >
            <BasicMoneyFlowStep data={extractMoneyFlow(planData)} onUpdate={handleMoneyFlowUpdate} />
          </WizardStep>
        ),
      },
      {
        id: 3,
        title: 'Quick Snapshot',
        icon: <Camera className="w-4 h-4" />,
        component: (
          <WizardStep
            title="Quick Financial Snapshot"
            description="Your savings, investments and protection at a glance"
            icon={<Camera className="w-5 h-5" />}
          >
            <BasicSnapshotStep data={extractSnapshot(planData)} onUpdate={handleSnapshotUpdate} />
          </WizardStep>
        ),
      },
    ],
    [planData, handlePersonalUpdate, handleMoneyFlowUpdate, handleSnapshotUpdate]
  );

  // ── Render ──

  if (!verified) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 mb-3">
              FREE • 5 MINUTES
            </span>
            <h1 className="text-2xl font-bold text-primary-700">Financial Health Check</h1>
            <p className="text-sm text-slate-500 mt-1">Get your financial health score in just 3 easy steps</p>
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
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">Analyzing Your Financial Health...</h2>
          <p className="text-slate-500">Calculating your score across 5 pillars</p>
          <p className="text-xs text-slate-400 mt-2">This takes about 15-20 seconds</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-8 px-4 bg-gradient-to-b from-slate-50 to-white">
      {/* Tier Badge */}
      <div className="max-w-2xl mx-auto text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          FINANCIAL HEALTH CHECK • 3 STEPS
        </span>
      </div>

      {submitError && (
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {submitError}
          <button onClick={() => setSubmitError('')} className="ml-3 text-red-900 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <WizardShell
        steps={wizardSteps}
        onComplete={handleComplete}
        storageKey="fp-basic-step"
        validateStep={validateStep}
      />

      {/* Upgrade Nudge */}
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-gradient-to-r from-brand-50 to-teal-50 border border-brand-200 rounded-xl text-center">
        <p className="text-sm text-brand-700 font-medium">
          Want goal-wise SIP recommendations and a detailed action plan?
        </p>
        <a
          href="/financial-planning/standard"
          className="inline-block mt-2 text-xs font-bold text-white bg-brand px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
        >
          Upgrade to Standard Plan →
        </a>
      </div>
    </section>
  );
}
