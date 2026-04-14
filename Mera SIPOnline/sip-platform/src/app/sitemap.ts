import { MetadataRoute } from 'next';
import { getAllModules } from '@/data/modules';
import { blogPosts } from '@/data/blog';
import { getAllProfiles } from '@/data/life-plans';

const BASE_URL = 'https://www.merasip.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const modules = getAllModules();
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/learn`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/calculators`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/research`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/funds`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/funds/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/market-pulse`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/risk-disclosure`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/grievance-redressal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/commission-disclosure`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/what-is-sip`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sip-for-beginners`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sip-vs-lumpsum`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sip-for-retirement`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sip-for-child-education`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sip-calculator`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];

  // Calculator pages
  const calculatorPages: MetadataRoute.Sitemap = [
    'sip', 'step-up-sip', 'goal-based', 'inflation-adjusted',
    'retirement', 'swp', 'sip-vs-lumpsum', 'duration-optimizer', 'correction-impact', 'life-stage', 'daily-sip',
    'bucket-strategy', 'sip-shield', 'lumpsum', 'emi', 'fire', 'delay-cost',
    'emergency-fund', 'net-worth', 'income-tax', 'capital-gains-tax', 'tax-saving',
    'health-insurance', 'term-insurance', 'human-life-value',
    'rent-vs-buy', 'home-affordability', 'loan-prepayment', 'fd-vs-loan', 'car-loan-vs-cash',
    'lifestyle-inflation',
  ].map((calc) => ({
    url: `${BASE_URL}/calculators/${calc}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // Research pages
  const researchPages: MetadataRoute.Sitemap = [
    'historical-returns', 'bull-vs-bear', 'rolling-returns',
    'xirr-explained', 'case-studies', 'volatility-simulator',
  ].map((topic) => ({
    url: `${BASE_URL}/research/${topic}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Learning module pages
  const modulePages: MetadataRoute.Sitemap = modules.flatMap((module) => [
    {
      url: `${BASE_URL}/learn/${module.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...module.sections.map((section) => ({
      url: `${BASE_URL}/learn/${module.slug}/${section.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]);

  // Financial planning pages
  const financialPlanningPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/financial-planning`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${BASE_URL}/financial-planning/retirement`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/financial-planning/child-education`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/financial-planning/child-marriage`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/financial-planning/house-purchase`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/financial-planning/emergency-fund`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/financial-planning/tax-saving`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  // Gallery page
  const galleryPage: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
  ];

  // Resources / Taxation pages
  const resourcePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/resources/taxation`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/resources/taxation/nri`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  // Life Plans section — profession-based financial guidance
  const lifePlanProfiles = getAllProfiles();
  const lifePlanPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/life-plans`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.9 },
    ...lifePlanProfiles.map((profile) => ({
      url: `${BASE_URL}/life-plans/${profile.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];

  // Fund explorer & tools
  const fundToolPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/funds/explore`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/funds/screener`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/funds/selection`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  return [...staticPages, ...calculatorPages, ...researchPages, ...blogPages, ...financialPlanningPages, ...galleryPage, ...resourcePages, ...lifePlanPages, ...fundToolPages, ...modulePages];
}
