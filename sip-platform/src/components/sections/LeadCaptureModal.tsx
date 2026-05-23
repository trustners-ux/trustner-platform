'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LeadFunnel } from './LeadFunnel';

export function LeadCaptureModal() {
  const [show, setShow] = useState(false);
  const hasShownRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already shown this session
    if (typeof window !== 'undefined' && localStorage.getItem('leadModalShown')) {
      return;
    }

    const showModal = () => {
      if (hasShownRef.current) return;
      hasShownRef.current = true;
      setShow(true);
    };

    // Timer trigger: 20 seconds
    const timer = setTimeout(showModal, 20000);

    // Scroll trigger: 40% of page
    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 40) {
        showModal();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadModalShown', 'true');
    }
    setShow(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  if (!show) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="relative bg-white max-w-lg w-full rounded-2xl shadow-elevated animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lead Funnel */}
        <LeadFunnel isOpen={show} onClose={handleClose} />
      </div>
    </div>
  );
}
