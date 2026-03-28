import { Metadata } from 'next';
import { getPostBySlug, getAllPosts } from '@/data/blog';

const BASE_URL = 'https://www.merasip.com';

// Author constants for structured data
const AUTHOR_NAME = 'CFP Ram Shah';
const AUTHOR_URL = `${BASE_URL}/about`;
const ORG_NAME = 'Trustner Asset Services Pvt. Ltd.';

// Generate static params for all blog posts (helps Next.js pre-render)
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// Server-side metadata — critical for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  const url = `${BASE_URL}/blog/${post.slug}`;
  const publishDate = new Date(post.date).toISOString();

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [
      ...post.tags,
      post.category,
      'SIP',
      'mutual fund',
      'Trustner',
      'Mera SIP Online',
      'financial planning India',
    ],
    authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
    creator: AUTHOR_NAME,
    publisher: ORG_NAME,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'Mera SIP Online by Trustner',
      locale: 'en_IN',
      publishedTime: publishDate,
      modifiedTime: publishDate,
      authors: [AUTHOR_NAME],
      section: post.category,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      creator: '@trustner',
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

export default function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // We need to resolve params synchronously for the layout render
  // The structured data will be injected via a server component
  return (
    <>
      <BlogPostStructuredData paramsPromise={params} />
      {children}
    </>
  );
}

// Server component that injects JSON-LD structured data
async function BlogPostStructuredData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const post = getPostBySlug(slug);

  if (!post) return null;

  const url = `${BASE_URL}/blog/${post.slug}`;
  const publishDate = new Date(post.date).toISOString();

  // Extract first 160 chars of content for articleBody hint
  const firstParagraph = post.content.find((b) => b.type === 'paragraph');
  const articleBodyHint = firstParagraph?.text?.slice(0, 300) || post.excerpt;

  // Article schema with Person author (Google prefers Person over Organization)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: publishDate,
    dateModified: publishDate,
    articleBody: articleBodyHint,
    articleSection: post.category,
    keywords: post.tags.join(', '),
    wordCount: post.content
      .filter((b) => b.type === 'paragraph' || b.type === 'list')
      .reduce((sum, b) => {
        const text = b.text || '';
        const items = b.items?.join(' ') || '';
        return sum + (text + ' ' + items).split(/\s+/).length;
      }, 0),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      jobTitle: 'Certified Financial Planner',
      worksFor: {
        '@type': 'Organization',
        name: ORG_NAME,
        url: BASE_URL,
      },
      knowsAbout: [
        'Systematic Investment Plans',
        'Mutual Funds',
        'Financial Planning',
        'Investment Strategy',
        'Wealth Management',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    isAccessibleForFree: true,
    inLanguage: 'en-IN',
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
