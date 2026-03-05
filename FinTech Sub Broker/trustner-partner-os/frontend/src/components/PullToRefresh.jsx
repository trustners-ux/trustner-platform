import React, { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Pull-to-Refresh Component
 * Mobile-only pull-to-refresh functionality
 * Shows spinner when pulling down and triggers callback on release
 */
function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = useIsMobile();

  const PULL_THRESHOLD = 60; // pixels needed to trigger refresh
  const RESISTANCE = 0.55; // resistance factor when pulling

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      // Only allow pull to refresh at the top of the page
      if (scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startYRef.current);

      // Apply resistance
      const resistedDistance = distance * RESISTANCE;

      if (resistedDistance > 0) {
        e.preventDefault();
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = async () => {
      setIsPulling(false);

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        try {
          if (onRefresh) {
            await onRefresh();
          }
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh, isMobile]);

  if (!isMobile) {
    return children;
  }

  const spinnerRotation = Math.min(pullDistance * 2, 360);
  const shouldShowSpinner = pullDistance > PULL_THRESHOLD * 0.5;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull to Refresh Header */}
      <div
        className="relative transition-all duration-200 overflow-hidden"
        style={{
          height: `${Math.min(pullDistance, PULL_THRESHOLD * 1.5)}px`
        }}
      >
        <div className="absolute left-0 right-0 top-0 flex items-center justify-center pb-2 text-gray-500">
          <div className="flex flex-col items-center gap-2">
            {shouldShowSpinner ? (
              <div
                className="w-6 h-6 border-2 border-transparent border-t-[#D4A843] border-r-[#D4A843] rounded-full"
                style={{
                  transform: `rotate(${
                    isRefreshing ? 360 : spinnerRotation
                  }deg)`,
                  animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none'
                }}
              />
            ) : (
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  style={{
                    transform: `scaleY(${Math.min(pullDistance / PULL_THRESHOLD, 1)})`
                  }}
                />
              </svg>
            )}
            <span className="text-xs font-medium text-gray-500">
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={isRefreshing ? 'opacity-75' : 'opacity-100'}>
        {children}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default PullToRefresh;
