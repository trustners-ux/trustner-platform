import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://trustner.in';
const SITE_NAME = 'Trustner';
const DEFAULT_OG_IMAGE = '/og-image.png';

interface SEOConfig {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

/**
 * Generate consistent metadata for any page.
 * Usage: export const metadata = generateMetadata({ title: '...', description: '...' });
 */
export function generateMetadata({
  title,
  description,
  path = '',
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  keywords = [],
}: SEOConfig): Metadata {
  const url = `${BASE_URL}${path}`;

  const defaultKeywords = [
    'Trustner',
    'mutual fund distributor India',
    'AMFI registered',
    'insurance broker',
    'SIP investment',
    'financial planning',
  ];

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`],
    },
  };
}

/**
 * Generate JSON-LD structured data for financial service pages.
 */
export function generateFinancialServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Trustner Asset Services Pvt. Ltd.',
    alternateName: 'Trustner',
    url: BASE_URL,
    description:
      'AMFI registered mutual fund distributor and IRDAI licensed insurance broker. One platform for investments and insurance.',
    telephone: '+91-1800-XXX-XXXX',
    email: 'hello@trustner.in',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://www.linkedin.com/company/trustner',
      'https://www.instagram.com/trustner',
      'https://twitter.com/trustner',
    ],
  };
}

/**
 * Generate JSON-LD for a blog/article page.
 */
export function generateArticleSchema({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  author = 'Trustner Team',
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${BASE_URL}/blog/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author === 'Trustner Team' ? 'Trustner Asset Services Pvt. Ltd.' : author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trustner Asset Services Pvt. Ltd.',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${slug}`,
    },
  };
}

/**
 * Generate FAQ structured data for SEO.
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList structured data.
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

/**
 * Generate WebApplication structured data for calculators/tools.
 */
export function generateToolSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${BASE_URL}${path}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    provider: {
      '@type': 'Organization',
      name: 'Trustner Asset Services Pvt. Ltd.',
      url: BASE_URL,
    },
  };
}
