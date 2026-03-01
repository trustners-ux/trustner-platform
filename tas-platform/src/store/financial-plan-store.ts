import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  FinancialPlan,
  PersonalProfile,
  IncomeDetails,
  ExpenseDetails,
  NetWorthStatement,
  InsuranceCoverage,
  FinancialGoal,
  TaxDetails,
  RiskProfile,
  FinancialAnalysis,
} from "@/types/financial-plan";
import { calculateFinancialHealthScore } from "@/lib/utils/financial-engine";

interface FinancialPlanState {
  plan: Partial<FinancialPlan>;
  currentStep: number;
  isComplete: boolean;
  hasStarted: boolean;

  // Backend sync state
  planDbId: string | null;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Step setters
  setPersonal: (data: PersonalProfile) => void;
  setIncome: (data: IncomeDetails) => void;
  setExpenses: (data: ExpenseDetails) => void;
  setNetWorth: (data: NetWorthStatement) => void;
  setInsurance: (data: InsuranceCoverage) => void;
  setGoals: (goals: FinancialGoal[]) => void;
  setTax: (data: TaxDetails) => void;
  setRiskProfile: (data: RiskProfile) => void;

  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Plan generation
  generateAnalysis: () => FinancialAnalysis | null;
  markComplete: () => void;

  // Backend sync
  savePlanToBackend: () => Promise<void>;
  loadPlanFromBackend: () => Promise<boolean>;

  // Reset
  resetPlan: () => void;
}

const INITIAL_STATE = {
  plan: {},
  currentStep: 0,
  isComplete: false,
  hasStarted: false,
  planDbId: null as string | null,
  isSaving: false,
  lastSavedAt: null as string | null,
};

export const useFinancialPlanStore = create<FinancialPlanState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setPersonal: (data) =>
        set((state) => ({
          plan: { ...state.plan, personal: data },
          hasStarted: true,
        })),

      setIncome: (data) =>
        set((state) => ({
          plan: { ...state.plan, income: data },
        })),

      setExpenses: (data) =>
        set((state) => ({
          plan: { ...state.plan, expenses: data },
        })),

      setNetWorth: (data) =>
        set((state) => ({
          plan: { ...state.plan, netWorth: data },
        })),

      setInsurance: (data) =>
        set((state) => ({
          plan: { ...state.plan, insurance: data },
        })),

      setGoals: (goals) =>
        set((state) => ({
          plan: { ...state.plan, goals },
        })),

      setTax: (data) =>
        set((state) => ({
          plan: { ...state.plan, tax: data },
        })),

      setRiskProfile: (data) =>
        set((state) => ({
          plan: { ...state.plan, riskProfile: data },
        })),

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
        })),

      generateAnalysis: () => {
        const { plan } = get();
        // Verify all required sections are present
        if (
          !plan.personal ||
          !plan.income ||
          !plan.expenses ||
          !plan.netWorth ||
          !plan.insurance ||
          !plan.goals ||
          !plan.tax ||
          !plan.riskProfile
        ) {
          return null;
        }

        const now = new Date().toISOString();
        const completePlan: FinancialPlan = {
          id: plan.id || crypto.randomUUID(),
          createdAt: plan.createdAt || now,
          updatedAt: now,
          personal: plan.personal,
          income: plan.income,
          expenses: plan.expenses,
          netWorth: plan.netWorth,
          insurance: plan.insurance,
          goals: plan.goals,
          tax: plan.tax,
          riskProfile: plan.riskProfile,
          analysis: {} as FinancialAnalysis, // will be computed
        };

        const analysis = calculateFinancialHealthScore(completePlan);
        completePlan.analysis = analysis;

        set({
          plan: completePlan,
          isComplete: true,
        });

        return analysis;
      },

      markComplete: () => set({ isComplete: true }),

      savePlanToBackend: async () => {
        const { plan, isComplete } = get();
        if (!plan.analysis || !isComplete) return;

        set({ isSaving: true });

        try {
          const res = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan }),
          });

          const data = await res.json();

          if (data.success && data.data?.planId) {
            set({
              planDbId: data.data.planId,
              lastSavedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error("Failed to save plan to backend:", err);
        } finally {
          set({ isSaving: false });
        }
      },

      loadPlanFromBackend: async () => {
        try {
          const res = await fetch("/api/plans");
          const data = await res.json();

          if (data.success && data.data?.plan) {
            const backendPlan = data.data.plan as FinancialPlan;
            set({
              plan: backendPlan,
              planDbId: data.data.planId,
              isComplete: true,
              hasStarted: true,
              currentStep: 10, // Review step (completed)
              lastSavedAt: backendPlan.updatedAt,
            });
            return true;
          }
          return false;
        } catch (err) {
          console.error("Failed to load plan from backend:", err);
          return false;
        }
      },

      resetPlan: () => set(INITIAL_STATE),
    }),
    {
      name: "trustner-financial-plan",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plan: state.plan,
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        hasStarted: state.hasStarted,
        planDbId: state.planDbId,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
