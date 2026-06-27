import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async redirects() {
    return [
      // Legacy /legal/* paths circulated in old footers & sitemaps — the real
      // pages live at the root. Permanent so search engines consolidate.
      { source: '/legal/privacy', destination: '/privacy', permanent: true },
      { source: '/legal/disclaimer', destination: '/disclaimer', permanent: true },
      { source: '/legal/:slug', destination: '/:slug', permanent: true },
    ];
  },
  async headers() {
    return [
      // Default — DENY-locked for everything EXCEPT the PDF proxy below.
      // Next.js applies header rules in declared order; later entries win
      // on duplicate keys, so the carve-out below overrides this on its path.
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Permissions-Policy (audit P1-7) — disable device APIs we never use.
          // camera + geolocation stay self-allowed: HR field attendance needs
          // them (geo + selfie capture).
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), autoplay=(self), camera=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), browsing-topics=()',
          },
          // Content-Security-Policy (audit P1-7) — compatible policy: script
          // origins are scoped (so an injected external <script src> can't
          // load), and object/base/form/frame are locked down to kill base-tag,
          // plugin, and form-hijack injection + force HTTPS. 'unsafe-inline' is
          // retained for now (Next hydration + inline styles); tighten to a
          // nonce-based policy in a later pass.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      // PII-bearing API surfaces (audit P2) — never let a browser, shared
      // proxy, or the back/forward cache retain client/staff PII. These routes
      // are all auth-gated and dynamic, so no-store costs nothing.
      {
        source: '/api/:seg(admin|portal|employee|rm|mis)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
        ],
      },
      // PDF proxy route — must come AFTER the broader rule so it overrides
      // X-Frame-Options to SAMEORIGIN, letting the admin page's <iframe>
      // render the PDF preview. Other security headers are preserved.
      {
        source: '/api/admin/reports/:id/pdf',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
