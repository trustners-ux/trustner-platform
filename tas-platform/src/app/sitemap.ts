import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trustner.in';
  const now = new Date();

  const staticPages = [
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/mutual-funds', changeFrequency: 'daily' as const, priority: 0.9 },
    { url: '/mutual-funds/compare', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/insurance', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/health', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/life', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/motor', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/travel', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/investments', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/investments/nps', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/sgb', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/digital-gold', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/investments/ppf', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/fixed-deposits', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/calculators', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/calculators/sip', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/calculators/lumpsum', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/calculators/swp', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/calculators/stp', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/calculators/tax', changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: '/blog', changeFrequency: 'daily' as const, priority: 0.7 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/gift-city', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/disclaimer', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return staticPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
