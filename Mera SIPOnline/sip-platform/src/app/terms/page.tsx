import { COMPANY } from '@/lib/constants/company';

export default function TermsPage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <h1 className="text-display-sm text-primary-700 mb-8">Terms of Use</h1>
        <div className="prose-sip">
          <p className="text-sm text-slate-500 mb-6">Last updated: February 2026</p>

          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using Mera SIP Online (sip.wealthyhub.in), you agree to be bound by these Terms of Use.
            If you do not agree with any part of these terms, please do not use our platform.
          </p>

          <h2>Educational Purpose</h2>
          <p>
            This platform is designed for educational purposes only. All content, calculators, research data, and
            tools are provided to help users understand SIP investing concepts. Nothing on this platform constitutes
            financial advice or investment recommendations.
          </p>

          <h2>Calculator Tools</h2>
          <p>
            Our calculators provide illustrative results based on user inputs and assumed rates of return.
            Actual investment returns will vary based on market conditions, fund performance, fees, and other factors.
            Calculator results should not be used as the sole basis for investment decisions.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            All content, design, code, and educational material on this platform is the property of {COMPANY.mfEntity.name}
            and is protected by copyright laws. Users may not reproduce, distribute, or create derivative works without
            written permission.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            {COMPANY.mfEntity.name} shall not be liable for any direct, indirect, incidental, or consequential damages
            arising from the use of this platform or reliance on its content.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform after changes
            constitutes acceptance of the modified terms.
          </p>

          <h2>Contact</h2>
          <p>For questions about these terms, contact us at {COMPANY.contact.email}.</p>
        </div>
      </div>
    </section>
  );
}
