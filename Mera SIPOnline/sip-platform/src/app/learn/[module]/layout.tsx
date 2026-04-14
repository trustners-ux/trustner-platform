import { Metadata } from 'next';
import { getAllModules, getModuleBySlug } from '@/data/modules';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

interface Props {
  params: Promise<{ module: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: moduleSlug } = await params;
  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return {};

  const levelLabel = mod.level.charAt(0).toUpperCase() + mod.level.slice(1);

  return generateSEOMetadata({
    title: `${mod.title} — ${levelLabel} Module | Learn SIP Investing | MeraSIP`,
    description: `${mod.description} Covers ${mod.sections.length} topics with practice MCQs, FAQs, formulas, and real-life examples. Estimated time: ${mod.estimatedTime}. Free course by CFP Ram Shah.`,
    path: `/learn/${mod.slug}`,
    keywords: [
      mod.title.toLowerCase(),
      `${mod.level} mutual fund course`,
      'SIP learning module',
      'investment education',
      'mutual fund course free',
      ...mod.sections.slice(0, 5).map((s) => s.title.toLowerCase()),
    ],
  });
}

export function generateStaticParams() {
  return getAllModules().map((mod) => ({ module: mod.slug }));
}

export default async function ModuleLayout({ params, children }: Props) {
  const { module: moduleSlug } = await params;
  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return <>{children}</>;

  const levelLabel = mod.level.charAt(0).toUpperCase() + mod.level.slice(1);

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: mod.title,
    description: mod.description,
    url: `https://www.merasip.com/learn/${mod.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Trustner Asset Services Pvt. Ltd.',
      url: 'https://www.merasip.com',
    },
    instructor: {
      '@type': 'Person',
      name: 'CFP Ram Shah',
      jobTitle: 'Certified Financial Planner',
    },
    educationalLevel: levelLabel,
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    numberOfLessons: mod.sections.length,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: mod.estimatedTime,
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: mod.title, url: `/learn/${mod.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
