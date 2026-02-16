import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wealthyhub.in';
  const now = new Date();

  // Blog post slugs for dynamic sitemap entries
  const blogSlugs = [
    'complete-guide-to-sip-investing',
    'elss-vs-ppf-vs-nps-tax-saving',
    'understanding-sebi-risk-o-meter',
    'health-insurance-how-much-coverage',
    'market-volatility-staying-invested',
    'financial-planning-salaried-employees',
  ];

  const staticPages = [
    // Core pages
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },

    // Mutual Funds
    { url: '/mutual-funds', changeFrequency: 'daily' as const, priority: 0.9 },
    { url: '/mutual-funds/compare', changeFrequency: 'weekly' as const, priority: 0.7 },

    // Insurance
    { url: '/insurance', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/health', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/life', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/motor', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/insurance/travel', changeFrequency: 'weekly' as const, priority: 0.7 },

    // Investments
    { url: '/investments', changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: '/investments/nps', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/sgb', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/digital-gold', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/investments/ppf', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/investments/fixed-deposits', changeFrequency: 'weekly' as const, priority: 0.7 },

    // Calculators
    { url: '/calculators', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/calculators/sip', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/calculators/lumpsum', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/calculators/swp', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/calculators/stp', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/calculators/tax', changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: '/calculators/goal', changeFrequency: 'monthly' as const, priority: 0.7 },

    // Lead Capture & Tools
    { url: '/risk-profile', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/financial-health-check', changeFrequency: 'monthly' as const, priority: 0.8 },

    // Blog
    { url: '/blog', changeFrequency: 'daily' as const, priority: 0.7 },

    // Other
    { url: '/gift-city', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/disclaimer', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  // Blog post pages
  const blogPages = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const staticEntries = staticPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  return [...staticEntries, ...blogPages];
}
