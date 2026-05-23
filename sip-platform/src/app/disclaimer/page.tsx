import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export default function DisclaimerPage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <h1 className="text-display-sm text-primary-700 mb-8">Disclaimer</h1>
        <div className="prose-sip">
          <h2>General Disclaimer</h2>
          <p>{DISCLAIMER.general}</p>

          <h2>Mutual Fund Investments</h2>
          <p>{DISCLAIMER.mutual_fund}</p>

          <h2>Calculator Disclaimer</h2>
          <p>{DISCLAIMER.calculator}</p>

          <h2>No Financial Advice</h2>
          <p>
            The content, calculators, research data, and educational material on Mera SIP Online (www.merasip.com)
            are provided solely for informational and educational purposes. Nothing on this website constitutes
            financial advice, investment advice, tax advice, or any other form of professional advice.
          </p>
          <p>
            Users should consult qualified financial professionals, tax consultants, or other professionals before
            making any investment decisions. {COMPANY.mfEntity.name} does not provide personalized investment
            recommendations through this platform.
          </p>

          <h2>Risk Factors</h2>
          <p>{DISCLAIMER.risk_factors}</p>
          <p>{DISCLAIMER.no_guarantee}</p>

          <h2>Past Performance</h2>
          <p>
            All references to historical returns, market data, and case studies on this platform are based on
            past performance data. Past performance is not indicative of future results. The value of investments
            can go down as well as up.
          </p>

          <h2>KYC Compliance</h2>
          <p>{DISCLAIMER.kyc}</p>

          <h2>SEBI Investor Notice</h2>
          <p>{DISCLAIMER.sebi_investor}</p>

          <h2>Investor Grievance Redressal</h2>
          <p>{DISCLAIMER.grievance}</p>
          <p>
            Investors can also lodge complaints on SEBI SCORES portal (https://scores.gov.in) —
            a centralized web-based complaint redressal system. SEBI takes up the complaints registered
            against companies listed/intermediaries registered with SEBI.
          </p>

          <h2>Investor Charter</h2>
          <p>
            As per SEBI circular, all intermediaries are required to adopt the Investor Charter. The Investor Charter
            sets forth the rights and responsibilities of investors and intermediaries. Visit the AMFI website
            (www.amfiindia.com) or SEBI website (www.sebi.gov.in) for the complete Investor Charter.
          </p>
          <ul>
            <li>Right to receive fair, transparent, and timely services.</li>
            <li>Right to lodge grievances and receive timely resolution.</li>
            <li>Right to accurate, complete, and timely information about mutual fund products.</li>
            <li>Right to expect that your personal data will be treated securely and confidentially.</li>
          </ul>

          <h2>Third-Party Links</h2>
          <p>
            This website may contain links to external websites including AMC (Asset Management Company) websites.
            {' '}{COMPANY.mfEntity.name} is not responsible for the content, accuracy, or privacy practices
            of third-party websites. Users are advised to read the terms, privacy policies, and scheme-related
            documents on respective AMC websites before making any investment.
          </p>

          <h2>Regulatory Information</h2>
          <p>
            {COMPANY.mfEntity.name} is an AMFI Registered Mutual Fund Distributor ({COMPANY.mfEntity.amfiArn}).
            CIN: {COMPANY.mfEntity.cin}. Registered Office: {COMPANY.address.full}.
          </p>

          <h2>AMFI Guidelines</h2>
          <p>
            As an AMFI registered distributor, {COMPANY.mfEntity.shortName} abides by all AMFI guidelines
            including the AMFI Code of Conduct for intermediaries. We do not guarantee any returns on mutual fund
            investments. All investment decisions should be made after careful consideration of the investor&apos;s
            risk appetite, investment horizon, and financial goals.
          </p>

          <div className="mt-8 p-4 bg-surface-200 rounded-lg">
            <p className="text-sm font-semibold text-primary-700 mb-2">Important Regulatory Links</p>
            <ul className="text-sm space-y-1">
              <li><a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">SEBI — Securities and Exchange Board of India</a></li>
              <li><a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">AMFI — Association of Mutual Funds in India</a></li>
              <li><a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">SCORES — SEBI Complaint Redressal System</a></li>
              <li><a href="https://www.amfiindia.com/investor-corner/knowledge-center/investor-charter.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">AMFI Investor Charter</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
