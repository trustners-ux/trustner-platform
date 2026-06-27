import { COMPANY } from '@/lib/constants/company';

export default function PrivacyPage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <h1 className="text-display-sm text-primary-700 mb-8">Privacy Policy</h1>
        <div className="prose-sip">
          <p className="text-sm text-slate-500 mb-6">Last updated: April 2026</p>

          <h2>Introduction</h2>
          <p>
            {COMPANY.mfEntity.name} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the Mera SIP Online platform at www.merasip.com.
            This Privacy Policy explains how we collect, use, share, and protect your personal data in compliance with the{' '}
            <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India and applicable regulations.
          </p>

          <h2>Data Fiduciary</h2>
          <p>
            For the purposes of the DPDP Act, {COMPANY.mfEntity.name} is the Data Fiduciary responsible for
            the personal data collected through this platform.
          </p>

          <h2>Information We Collect</h2>
          <p>
            Mera SIP Online is primarily an educational platform. We do not require user registration for accessing
            educational content or calculators. We may collect:
          </p>
          <ul>
            <li><strong>Analytics data</strong> — page views, referrer, browser/device type, approximate location (city-level), and anonymized session data (only after your consent)</li>
            <li><strong>Contact information</strong> — name, email, phone number if you voluntarily submit it through contact or lead forms</li>
            <li><strong>Communication records</strong> — emails, messages, and support conversations when you reach out to us</li>
          </ul>

          <h2>Purpose and Legal Basis</h2>
          <p>
            We process your personal data for the following specified purposes, with your consent or under legitimate
            use as permitted by the DPDP Act:
          </p>
          <ul>
            <li>To respond to inquiries you submit via contact or lead forms</li>
            <li>To provide you educational content and follow-up information you have requested</li>
            <li>To analyze aggregate usage patterns and improve our calculators and content (only with consent for analytics cookies)</li>
            <li>To comply with SEBI, AMFI, and applicable regulatory obligations</li>
          </ul>

          <h2>Cookies and Analytics</h2>
          <p>
            We use <strong>Google Analytics 4 (GA4)</strong> with privacy-preserving settings to understand how visitors
            use our site. GA4 is loaded <strong>only after you explicitly accept analytics cookies</strong> via the
            consent banner.
          </p>
          <p>When enabled, GA4 is configured with:</p>
          <ul>
            <li><strong>IP anonymization</strong> (last octet of your IP is masked before processing)</li>
            <li><strong>Google Signals disabled</strong> (no cross-device tracking, no demographic inference)</li>
            <li><strong>Ad personalization disabled</strong> (data is never used for advertising)</li>
          </ul>
          <p>
            You can change your preference any time using the <strong>&quot;Manage Cookies&quot;</strong> link in the footer.
            Declining analytics does not restrict your access to any part of the site.
          </p>

          <h2>Sharing of Personal Data</h2>
          <p>
            We do not sell, rent, or trade your personal data. We share limited data only with:
          </p>
          <ul>
            <li><strong>Google LLC</strong> (as Data Processor for analytics, only if you consent) — servers located in the US/EU</li>
            <li><strong>Resend / email service providers</strong> — to deliver OTPs and transactional emails you request</li>
            <li><strong>Anthropic PBC</strong> (as Data Processor for AI-assisted features) — when you upload a document for
              KYC or portfolio analysis, or we generate a written report for you, the relevant content may be processed
              on Anthropic&apos;s servers in the United States solely to provide that feature</li>
            <li><strong>Regulators and law enforcement</strong> — where required under applicable law, SEBI, or AMFI rules</li>
          </ul>

          <h2>Cross-Border Data Transfer</h2>
          <p>
            Some personal data is processed outside India by our data processors, under Section 16 of the DPDP Act and
            with appropriate safeguards. Specifically:
          </p>
          <ul>
            <li><strong>Analytics</strong> (Google LLC — US/EU): only anonymized data, and only if you consent to analytics.</li>
            <li><strong>Transactional email</strong> (Resend): the email address and content needed to deliver the OTPs and
              notifications you request.</li>
            <li><strong>AI-assisted document reading &amp; report drafting</strong> (Anthropic PBC — United States): when you
              upload a KYC/portfolio document or we prepare a report, the relevant content may be processed in the US solely
              to provide that feature. This data is not used to train third-party AI models.</li>
          </ul>
          <p>
            We do not transfer your personal data outside India for any purpose other than those listed above, and never
            sell or rent it.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary to fulfill the purpose for which it was collected or
            to meet legal obligations. Analytics data is retained for up to 14 months. Lead/contact form data is retained
            for the period required to serve you and comply with SEBI/AMFI record-keeping rules.
          </p>

          <h2>Your Rights under DPDP Act</h2>
          <p>As a Data Principal, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a summary of your personal data we hold</li>
            <li><strong>Correction &amp; erasure</strong> — request correction or deletion of your data</li>
            <li><strong>Withdraw consent</strong> — withdraw analytics consent any time via the &quot;Manage Cookies&quot; link</li>
            <li><strong>Grievance redressal</strong> — raise a complaint with us; if unresolved, escalate to the Data Protection Board of India</li>
            <li><strong>Nominate</strong> — nominate a person to exercise your rights in case of death or incapacity</li>
          </ul>
          <p>
            To exercise any right, contact our Grievance Officer at the email below. We will respond within the
            timelines prescribed under the DPDP Act and its rules.
          </p>

          <h2>Data Security</h2>
          <p>
            We implement reasonable technical and organizational measures (HTTPS/TLS, encrypted storage, access controls,
            limited employee access on a need-to-know basis) to protect your personal data from unauthorized access,
            disclosure, alteration, or destruction.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Our platform is intended for users aged 18 and above. We do not knowingly collect personal data of children
            without verifiable parental consent as required under the DPDP Act.
          </p>

          <h2>Changes to this Policy</h2>
          <p>
            We may update this policy to reflect changes in law or our practices. The &quot;Last updated&quot; date at the top
            indicates when the policy was last revised. Continued use of the site after updates constitutes acknowledgement
            of the revised policy.
          </p>

          <h2>Grievance Officer / Contact</h2>
          <p>
            Under the DPDP Act 2023, our designated Grievance Officer for privacy-related
            concerns, data-rights requests, and complaints is:
          </p>
          <ul>
            <li><strong>Name:</strong> Ms. Vinita Kabra</li>
            <li><strong>Designation:</strong> Company Secretary &amp; Compliance Officer</li>
            <li><strong>Email:</strong> {COMPANY.contact.grievanceEmail || COMPANY.contact.email}</li>
            <li><strong>Phone:</strong> {COMPANY.contact.phoneDisplay}</li>
            <li><strong>Address:</strong> {COMPANY.address.full}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
