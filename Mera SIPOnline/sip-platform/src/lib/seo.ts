import { Metadata } from 'next';

const BASE_URL = 'https://www.merasip.com';
const SITE_NAME = 'Mera SIP Online by Trustner';

export function generateSEOMetadata({
  title,
  description,
  path = '',
  keywords = [],
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = `${BASE_URL}${path}`;

  return {
    title,
    description,
    keywords: [
      ...keywords,
      'SIP',
      'mutual fund',
      'Trustner',
      'Mera SIP Online',
      'investment calculator',
      'financial planning India',
    ],
    authors: [{ name: 'CFP Ram Shah', url: `${BASE_URL}/about` }],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
}

export function generateCalculatorSchema(name: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${BASE_URL}${url}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    provider: {
      '@type': 'Organization',
      name: 'Trustner Asset Services Pvt. Ltd.',
      url: 'https://www.merasip.com',
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
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

export function generateArticleSchema(
  title: string,
  description: string,
  url: string,
  datePublished: string,
  options?: {
    category?: string;
    tags?: string[];
    wordCount?: number;
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${BASE_URL}${url}`,
    datePublished,
    dateModified: new Date().toISOString(),
    ...(options?.category && { articleSection: options.category }),
    ...(options?.tags && { keywords: options.tags.join(', ') }),
    ...(options?.wordCount && { wordCount: options.wordCount }),
    author: {
      '@type': 'Person',
      name: 'CFP Ram Shah',
      url: `${BASE_URL}/about`,
      jobTitle: 'Certified Financial Planner',
      worksFor: {
        '@type': 'Organization',
        name: 'Trustner Asset Services Pvt. Ltd.',
        url: BASE_URL,
      },
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
      '@id': `${BASE_URL}${url}`,
    },
    isAccessibleForFree: true,
    inLanguage: 'en-IN',
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}
