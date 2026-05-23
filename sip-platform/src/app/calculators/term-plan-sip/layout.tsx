import type { Metadata } from 'next';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = {
  title: 'Term Plan Regular Pay + SIP vs Limited Pay Calculator | Mera SIP Online',
  description:
    'Unique calculator proving Regular Pay Term Plan + SIP beats Limited Pay. See how premium savings invested in SIP can fund future premiums and create a bonus corpus at maturity.',
  keywords: [
    'term plan calculator',
    'regular pay vs limited pay',
    'term insurance SIP',
    'insurance premium calculator',
    'limited pay term plan',
    'SIP vs limited pay insurance',
    'Trustner',
  ],
};

export default function TermPlanSIPLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['term-plan-sip'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Term Plan Regular Pay + SIP vs Limited Pay Calculator', url: '/calculators/term-plan-sip' },
  ]);
  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
