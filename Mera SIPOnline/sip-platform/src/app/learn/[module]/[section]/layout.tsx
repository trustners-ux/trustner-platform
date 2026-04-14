import { Metadata } from 'next';
import {
  getAllModules,
  getModuleBySlug,
  getSectionBySlug,
} from '@/data/modules';
import {
  generateSEOMetadata,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from '@/lib/seo';

interface Props {
  params: Promise<{ module: string; section: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string; section: string }>;
}): Promise<Metadata> {
  const { module: moduleSlug, section: sectionSlug } = await params;
  const mod = getModuleBySlug(moduleSlug);
  const section = getSectionBySlug(moduleSlug, sectionSlug);
  if (!mod || !section) return {};

  const description =
    section.content.definition.length > 155
      ? section.content.definition.slice(0, 152) + '...'
      : section.content.definition;

  return generateSEOMetadata({
    title: `${section.title} — ${mod.title} | Learn SIP Investing | MeraSIP`,
    description,
    path: `/learn/${mod.slug}/${section.slug}`,
    keywords: [
      section.title.toLowerCase(),
      mod.title.toLowerCase(),
      `${mod.level} investing`,
      'SIP education',
      'mutual fund concepts',
      ...section.content.keyPoints
        .slice(0, 3)
        .map((kp) => kp.slice(0, 40).toLowerCase()),
    ],
  });
}

export function generateStaticParams() {
  const params: { module: string; section: string }[] = [];
  getAllModules().forEach((mod) => {
    mod.sections.forEach((section) => {
      params.push({ module: mod.slug, section: section.slug });
    });
  });
  return params;
}

export default async function SectionLayout({ params, children }: Props) {
  const { module: moduleSlug, section: sectionSlug } = await params;
  const mod = getModuleBySlug(moduleSlug);
  const section = getSectionBySlug(moduleSlug, sectionSlug);
  if (!mod || !section) return <>{children}</>;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: section.title,
    description: section.content.definition,
    url: `https://www.merasip.com/learn/${mod.slug}/${section.slug}`,
    author: {
      '@type': 'Person',
      name: 'CFP Ram Shah',
      jobTitle: 'Certified Financial Planner',
      worksFor: {
        '@type': 'Organization',
        name: 'Trustner Asset Services Pvt. Ltd.',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trustner Asset Services Pvt. Ltd.',
      url: 'https://www.merasip.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.merasip.com/logo.png',
      },
    },
    isPartOf: {
      '@type': 'Course',
      name: mod.title,
      url: `https://www.merasip.com/learn/${mod.slug}`,
    },
    educationalLevel:
      mod.level.charAt(0).toUpperCase() + mod.level.slice(1),
    learningResourceType: 'Lesson',
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: mod.title, url: `/learn/${mod.slug}` },
    { name: section.title, url: `/learn/${mod.slug}/${section.slug}` },
  ]);

  const schemas: object[] = [articleSchema, breadcrumbSchema];

  // Add FAQ schema if the section has FAQ content
  if (section.content.faq.length > 0) {
    schemas.push(generateFAQSchema(section.content.faq));
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}
