export interface LifePlanProfile {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: string; // Lucide icon name
  coverGradient: string;
  category: ProfileCategory;

  /* ─── Hero section ─── */
  overview: string;
  incomePattern: string;
  keyNumbers: { label: string; value: string }[];

  /* ─── Core content ─── */
  challenges: { title: string; description: string }[];
  considerations: { category: string; items: string[] }[];
  commonMistakes: { mistake: string; impact: string; fix: string }[];
  lifeStages: { stage: string; age: string; priorities: string[] }[];
  checklist: string[];

  /* ─── CTA ─── */
  ctaText: string;
  ctaWhatsApp: string;

  /* ─── SEO ─── */
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

export type ProfileCategory =
  | 'Salaried Professionals'
  | 'Business & Entrepreneurs'
  | 'Life Stage'
  | 'Special Segments';
