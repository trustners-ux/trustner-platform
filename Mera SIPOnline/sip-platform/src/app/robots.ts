import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Only block the 6 internal MFD business-planning calculators that reveal
        // granular MFD economics (GST, LTV, cost-ratio, valuation, churn, NFO).
        // /mfd landing + /mfd/trail-calculator are intentionally indexable so the
        // Trustner team can surface them during sub-broker onboarding via search.
        disallow: [
          '/api/',
          '/admin/',
          '/mfd/gst-brokerage',
          '/mfd/client-ltv',
          '/mfd/cost-ratio',
          '/mfd/business-valuation',
          '/mfd/sip-churn',
          '/mfd/nfo-tracker',
        ],
      },
      // Block known scraper/cloner bots
      {
        userAgent: ['HTTrack', 'WebCopier', 'WebZIP', 'Teleport', 'SiteSnagger', 'ProWebWalker', 'CheiRank', 'SiteExplorer', 'Offline Explorer', 'BlackWidow', 'Widow', 'Xaldon', 'Zeus', 'CopyRightCheck', 'Bolt', 'WebReaper', 'WebSauger', 'Wget', 'curl'],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.merasip.com/sitemap.xml',
  };
}
