import { COMPANY } from '@/lib/constants/company';

export default function PrivacyPage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <h1 className="text-display-sm text-primary-700 mb-8">Privacy Policy</h1>
        <div className="prose-sip">
          <p className="text-sm text-slate-500 mb-6">Last updated: February 2026</p>

          <h2>Introduction</h2>
          <p>
            {COMPANY.mfEntity.name} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the Mera SIP Online platform (sip.wealthyhub.in).
            This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
          </p>

          <h2>Information We Collect</h2>
          <p>
            Mera SIP Online is primarily an educational platform. We do not require user registration for accessing
            educational content or calculators. We may collect:
          </p>
          <ul>
            <li>Usage analytics (pages visited, time spent) through privacy-friendly analytics</li>
            <li>Contact information if you voluntarily submit it through our contact forms</li>
            <li>Browser type and device information for website optimization</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To improve our educational content and calculator tools</li>
            <li>To respond to inquiries submitted through contact forms</li>
            <li>To analyze usage patterns and optimize user experience</li>
          </ul>

          <h2>Data Protection</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information.
            We do not sell, trade, or transfer your personal information to third parties.
          </p>

          <h2>Cookies</h2>
          <p>
            We may use essential cookies for website functionality and analytics cookies to understand usage patterns.
            You can disable cookies through your browser settings.
          </p>

          <h2>Contact Us</h2>
          <p>
            For privacy-related concerns, contact us at:
          </p>
          <ul>
            <li>Email: {COMPANY.contact.email}</li>
            <li>Phone: {COMPANY.contact.phoneDisplay}</li>
            <li>Address: {COMPANY.address.full}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
