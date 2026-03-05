import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive media query detection
 * Provides utilities to detect device breakpoints
 */

/**
 * Generic media query hook
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQueryGeneric(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR compatibility)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial state
    setMatches(mediaQuery.matches);

    // Create listener for changes
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Use addEventListener for better browser compatibility
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Detect mobile screens (< 768px)
 * @returns {boolean}
 */
export function useIsMobile() {
  return useMediaQueryGeneric('(max-width: 767px)');
}

/**
 * Detect tablet screens (768px - 1024px)
 * @returns {boolean}
 */
export function useIsTablet() {
  return useMediaQueryGeneric(
    '(min-width: 768px) and (max-width: 1023px)'
  );
}

/**
 * Detect desktop screens (> 1024px)
 * @returns {boolean}
 */
export function useIsDesktop() {
  return useMediaQueryGeneric('(min-width: 1024px)');
}

/**
 * Detect small mobile screens (< 640px)
 * @returns {boolean}
 */
export function useIsSmall() {
  return useMediaQueryGeneric('(max-width: 639px)');
}

/**
 * Detect medium screens (640px - 1023px)
 * @returns {boolean}
 */
export function useIsMedium() {
  return useMediaQueryGeneric(
    '(min-width: 640px) and (max-width: 1023px)'
  );
}

/**
 * Detect large screens (> 1023px)
 * @returns {boolean}
 */
export function useIsLarge() {
  return useMediaQueryGeneric('(min-width: 1024px)');
}

/**
 * Detect if device is in portrait orientation
 * @returns {boolean}
 */
export function useIsPortrait() {
  return useMediaQueryGeneric('(orientation: portrait)');
}

/**
 * Detect if device is in landscape orientation
 * @returns {boolean}
 */
export function useIsLandscape() {
  return useMediaQueryGeneric('(orientation: landscape)');
}

/**
 * Detect high pixel density screens (retina/2x+)
 * @returns {boolean}
 */
export function useIsHighDPI() {
  return useMediaQueryGeneric('(min-device-pixel-ratio: 2)');
}

/**
 * Detect touch capability
 * @returns {boolean}
 */
export function useIsTouchDevice() {
  return useMediaQueryGeneric('(hover: none) and (pointer: coarse)');
}

export default {
  useMediaQueryGeneric,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmall,
  useIsMedium,
  useIsLarge,
  useIsPortrait,
  useIsLandscape,
  useIsHighDPI,
  useIsTouchDevice
};
