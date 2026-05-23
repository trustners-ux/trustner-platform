'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef('');

  useEffect(() => {
    // Avoid double-tracking same path
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    // Skip admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // Fire-and-forget — non-blocking, silent on error
    const track = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || '',
          }),
          keepalive: true,
        });
      } catch {
        // Silent — analytics should never break the user experience
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(track, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
