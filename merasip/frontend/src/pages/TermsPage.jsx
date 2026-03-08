import ComplianceFooter from '../components/ComplianceFooter'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <header style={{ background: '#1B3A6B', padding: '16px 24px' }}>
        <a href="/review" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          MeraSIP
        </a>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', lineHeight: 1.8, fontSize: 14, color: '#374151' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B3A6B', fontFamily: 'Georgia, serif', marginBottom: 24 }}>
          Terms of Use
        </h1>
        <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 24 }}>
          Last updated: March 2026 | Trustner Asset Services Pvt. Ltd. | ARN-286886
        </p>

        <h2 style={h2}>1. About Trustner Asset Services</h2>
        <p>Trustner Asset Services Pvt. Ltd. is an AMFI Registered Mutual Fund Distributor (ARN-286886),
           not a SEBI Registered Investment Adviser. We operate the MeraSIP S.M.A.R.T platform for portfolio
           review and monitoring purposes.</p>

        <h2 style={h2}>2. Nature of Service</h2>
        <p>MeraSIP provides portfolio analysis, fund categorisation, and rebalancing suggestions based on
           publicly available data and our internal fund shortlist. This does not constitute investment advice.</p>
        <p><strong>Mutual fund investments are subject to market risks. Read all scheme related documents
           carefully before investing.</strong></p>

        <h2 style={h2}>3. Commission Disclosure</h2>
        <p>We earn distributor commissions from Asset Management Companies (AMCs) on investments made through us.
           This is our primary revenue model. Commission structures vary by AMC and scheme type.</p>

        <h2 style={h2}>4. Accuracy of Information</h2>
        <p>Portfolio data is extracted from your CAS PDF using automated parsing. While we strive for accuracy,
           there may be discrepancies due to PDF format variations. Always verify critical data against your
           original statements.</p>

        <h2 style={h2}>5. Rebalancing Suggestions</h2>
        <p>Fund recommendations and action items (HOLD/SWITCH/REVIEW) are based on our internal shortlist
           and algorithmic analysis. These are suggestions, not directives. Past performance does not guarantee
           future returns.</p>

        <h2 style={h2}>6. No Guarantee</h2>
        <p>We do not guarantee any specific returns or outcomes from following our suggestions.
           All investment decisions are ultimately yours.</p>

        <h2 style={h2}>7. Regulatory Compliance</h2>
        <ul>
          <li>AMFI Registration: ARN-286886</li>
          <li>EUIN: E092119</li>
          <li>CIN: U66301AS2023PTC025505</li>
          <li>SEBI SCORES: <a href="https://scores.gov.in" style={{ color: '#1B3A6B' }}>scores.gov.in</a></li>
          <li>AMFI: <a href="https://www.amfiindia.com" style={{ color: '#1B3A6B' }}>amfiindia.com</a></li>
        </ul>

        <h2 style={h2}>8. Limitation of Liability</h2>
        <p>Trustner Asset Services shall not be liable for any losses arising from investment decisions
           made based on information provided through this platform.</p>

        <h2 style={h2}>9. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction
           of courts in Guwahati, Assam.</p>

        <h2 style={h2}>10. Contact</h2>
        <p>Trustner Asset Services Pvt. Ltd.<br />
           Sethi Trust, Unit 2, 4th Floor, G S Road, Bhangagarh, Dispur, Guwahati - 781005, Assam<br />
           Email: wecare@finedgeservices.com | Phone: +91 60039 03731</p>
      </main>
      <ComplianceFooter />
    </div>
  )
}

const h2 = { fontSize: 18, fontWeight: 700, color: '#1B3A6B', marginTop: 32, marginBottom: 8 }
