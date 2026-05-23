'use client';

import { useState, useEffect } from 'react';
import { UserPlus, MessageCircle } from 'lucide-react';
import { COMPANY } from '@/lib/constants/company';

export function FloatingInvestCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappNumber = COMPANY.contact.whatsapp?.replace('+', '') || '916003903737';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Trustner, I want to start SIP investing. Please guide me.')}`;
  const investUrl = 'https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-surface-300 shadow-elevated transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Sign Up Now — 60% width */}
        <a
          href={investUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[3] inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md"
          style={{
            background: 'linear-gradient(135deg, #E8553A 0%, #C4381A 100%)',
          }}
        >
          <UserPlus className="w-4 h-4" />
          Sign Up Now
        </a>

        {/* Talk to Us — 40% width */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[2] inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold border-2 border-brand text-brand bg-transparent transition-all duration-200 hover:bg-brand-50"
        >
          <MessageCircle className="w-4 h-4" />
          Talk to Us
        </a>
      </div>
    </div>
  );
}
