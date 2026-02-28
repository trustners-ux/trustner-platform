"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import StepProgressBar from "./shared/StepProgressBar";
import WelcomeStep from "./steps/WelcomeStep";
import PersonalStep from "./steps/PersonalStep";
import IncomeStep from "./steps/IncomeStep";
import ExpenseStep from "./steps/ExpenseStep";
import AssetsStep from "./steps/AssetsStep";
import LiabilitiesStep from "./steps/LiabilitiesStep";
import InsuranceStep from "./steps/InsuranceStep";
import GoalsStep from "./steps/GoalsStep";
import RiskStep from "./steps/RiskStep";
import TaxStep from "./steps/TaxStep";
import ReviewStep from "./steps/ReviewStep";
import PlanDashboard from "./results/PlanDashboard";

const TOTAL_STEPS = 11;

export default function PlannerWizard() {
  const { currentStep, setStep, nextStep, prevStep, isComplete } =
    useFinancialPlanStore();

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      nextStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [prevStep]);

  const handleGoToStep = useCallback(
    (step: number) => {
      setStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setStep]
  );

  // If plan is already generated, show results
  if (isComplete && currentStep >= TOTAL_STEPS - 1) {
    return <PlanDashboard onEdit={() => handleGoToStep(0)} />;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <PersonalStep onNext={handleNext} onPrev={handlePrev} />;
      case 2:
        return <IncomeStep onNext={handleNext} onPrev={handlePrev} />;
      case 3:
        return <ExpenseStep onNext={handleNext} onPrev={handlePrev} />;
      case 4:
        return <AssetsStep onNext={handleNext} onPrev={handlePrev} />;
      case 5:
        return <LiabilitiesStep onNext={handleNext} onPrev={handlePrev} />;
      case 6:
        return <InsuranceStep onNext={handleNext} onPrev={handlePrev} />;
      case 7:
        return <GoalsStep onNext={handleNext} onPrev={handlePrev} />;
      case 8:
        return <RiskStep onNext={handleNext} onPrev={handlePrev} />;
      case 9:
        return <TaxStep onNext={handleNext} onPrev={handlePrev} />;
      case 10:
        return <ReviewStep onPrev={handlePrev} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="container-custom py-6 lg:py-10">
      {/* Progress bar (hidden on welcome step) */}
      {currentStep > 0 && (
        <div className="mb-8">
          <StepProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>
      )}

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
