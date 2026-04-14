import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP Shield Calculator — Let Your SIP Pay Your Premiums & EMIs',
  description:
    "India's first SIP Shield calculator. See how a systematic SIP investment can build corpus to pay your term plan premiums, loan EMIs, and insurance costs — so you never pay from pocket again.",
  path: '/calculators/sip-shield',
  keywords: [
    'SIP shield',
    'premium recovery',
    'SIP for term plan',
    'SIP vs premium',
    'EMI recovery through SIP',
    'SIP payback calculator',
    'SIP for insurance premium',
    'SIP for home loan EMI',
    'mutual fund premium recovery',
    'SIP wealth creation',
  ],
});

export default function SIPShieldLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['sip-shield'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'SIP Shield Calculator', url: '/calculators/sip-shield' },
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
