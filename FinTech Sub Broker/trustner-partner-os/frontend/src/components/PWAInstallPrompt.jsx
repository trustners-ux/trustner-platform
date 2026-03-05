import React, { useState, useEffect } from 'react';
import { canInstall, promptInstall, isStandalone } from '../utils/pwa';

/**
 * PWA Install Prompt Banner Component
 * Shows install banner for mobile users on supported browsers
 * Automatically hides if app is already installed
 */
function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Don't show if app is already installed
    if (isStandalone()) {
      setDismissed(true);
      return;
    }

    // Don't show on desktop screens
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      return;
    }

    // Show prompt if install is available
    if (canInstall()) {
      setShowPrompt(true);
    }

    // Listen for when install becomes available
    const handleInstallPrompt = () => {
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
      setDismissed(true);
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-[#0D1B3E] to-[#1a2a5e] border-t border-[#D4A843] border-opacity-30 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-[#D4A843] rounded-lg flex items-center justify-center">
                <span className="text-[#0D1B3E] font-bold text-lg">T</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                Install Trustner App
              </p>
              <p className="text-gray-300 text-xs">
                Quick access from your home screen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-[#D4A843] text-[#0D1B3E] font-semibold rounded-lg text-xs hover:bg-yellow-400 active:scale-95 transition-all duration-200 whitespace-nowrap"
              aria-label="Install Trustner app"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="Dismiss install prompt"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default PWAInstallPrompt;
