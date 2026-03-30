'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, FileText, Download, Mail, Shield } from 'lucide-react';

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 200);
  }, []);

  useEffect(() => {
    // Don't enable on mobile (no mouse leave intent)
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    // Check if already shown this session
    const alreadyShown = localStorage.getItem('exitPopupShown');
    if (alreadyShown) return;

    // 5-second delay before enabling exit intent detection
    const enableTimer = setTimeout(() => {
      setIsEnabled(true);
    }, 5000);

    return () => clearTimeout(enableTimer);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseOut = (e: MouseEvent) => {
      // Detect mouse leaving viewport from the top
      if (e.clientY < 0) {
        setIsVisible(true);
        setIsEnabled(false);
        localStorage.setItem('exitPopupShown', 'true');
      }
    };

    document.addEventListener('mouseout', handleMouseOut);
    return () => document.removeEventListener('mouseout', handleMouseOut);
  }, [isEnabled]);

  // Close on Escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitStatus === 'loading') return;
    setSubmitStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit-popup' }),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => handleClose(), 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary-700/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md bg-white rounded-xl shadow-modal overflow-hidden transition-all duration-300 ${
          isClosing
            ? 'scale-95 opacity-0'
            : 'scale-100 opacity-100 animate-scale-in'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-200 hover:bg-surface-300 text-slate-500 hover:text-primary-700 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gradient Icon Area */}
        <div className="bg-gradient-to-br from-brand via-brand-700 to-secondary px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">
            Free SIP Starter Guide
          </h2>
        </div>

        {/* Content Area */}
        <div className="px-6 pt-5 pb-6">
          <p className="text-sm text-slate-500 leading-relaxed mb-5">
            Download our comprehensive guide to starting your SIP journey. Covers SIP basics,
            fund selection, goal planning, and common mistakes to avoid.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={submitStatus === 'loading' || submitStatus === 'success'}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitStatus === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <Shield className="w-4 h-4" />
                  Subscribed! Check your email ✓
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Get Free Guide
                </>
              )}
            </button>
            {submitStatus === 'error' && (
              <p className="text-xs text-red-500 text-center">Something went wrong. Please try again.</p>
            )}
          </form>

          {/* Privacy Text */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-400">
              We&apos;ll email you the guide instantly. No spam.
            </p>
          </div>

          {/* Alternative Close */}
          <div className="text-center mt-4 pt-3 border-t border-surface-300/50">
            <button
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
            >
              No thanks, I&apos;ll explore on my own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
