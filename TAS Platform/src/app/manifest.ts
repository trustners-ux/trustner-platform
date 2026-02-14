import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trustner - Mutual Funds & Insurance',
    short_name: 'Trustner',
    description: 'Your trusted partner for mutual funds, insurance, and investments. AMFI registered distributor ARN-286886.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#0052CC',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
