import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Step-Up SIP Calculator | Calculate Growing SIP Returns',
  description:
    'Calculate returns on step-up SIP where you increase your monthly investment annually. See how annual SIP top-ups accelerate wealth creation with compounding.',
  path: '/calculators/step-up-sip',
  keywords: [
    'step-up SIP calculator',
    'top-up SIP calculator',
    'increasing SIP calculator',
    'annual step-up SIP',
    'SIP with annual increase',
    'growing SIP returns',
    'SIP top-up returns',
    'progressive SIP calculator',
  ],
});

export default function StepUpSIPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['step-up-sip'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Step-Up SIP Calculator', url: '/calculators/step-up-sip' },
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
