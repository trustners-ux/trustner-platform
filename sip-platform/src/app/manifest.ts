import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — makes merasip.com installable as an app ("Add to Home
 * Screen") on Android, iOS and desktop. One role-adaptive app: after login the
 * team sees admin / PD / HR, clients see the portal. PWA-first; a Play/App
 * Store wrapper can be added later from this same codebase.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MeraSIP by Trustner',
    short_name: 'MeraSIP',
    description:
      'Trustner workspace — portfolio diagnostics, client portfolios, fund research, learning, and team tools.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#15233B',
    lang: 'en-IN',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
