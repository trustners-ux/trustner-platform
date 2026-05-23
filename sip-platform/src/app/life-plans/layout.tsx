import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Life Plans — Financial Guidance by Profession | MeraSIP by Trustner',
  description:
    'Explore tailored financial guidance for doctors, engineers, defense personnel, homemakers, business owners, NRIs, and more. Profession-specific SIP strategies, insurance considerations, tax planning, and life-stage roadmaps for every Indian family.',
  keywords: [
    'financial planning by profession',
    'doctor financial planning',
    'IT engineer investment',
    'defense personnel SIP',
    'homemaker investment India',
    'NRI financial planning',
    'profession wise financial planning',
    'life stage financial planning',
    'career based investment guide',
  ],
  openGraph: {
    title: 'Life Plans — Financial Guidance by Profession | MeraSIP',
    description:
      'Profession-specific financial guidance for 15+ career segments. SIP strategies, tax planning, and life-stage roadmaps tailored to your profession.',
    url: 'https://www.merasip.com/life-plans',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life Plans — Financial Guidance by Profession | MeraSIP',
    description:
      'Profession-specific financial guidance for doctors, engineers, business owners, homemakers & more.',
  },
  alternates: {
    canonical: '/life-plans',
  },
};

export default function LifePlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
