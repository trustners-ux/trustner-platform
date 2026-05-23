'use client';

import { useEffect, useState } from 'react';

interface WizardStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function WizardStep({ title, description, icon, children }: WizardStepProps) {
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    setVisible(true);
  }, []);

  return (
    <div
      className={
        prefersReducedMotion
          ? 'opacity-100'
          : `transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
      }
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-primary">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        {children}
      </div>
    </div>
  );
}
