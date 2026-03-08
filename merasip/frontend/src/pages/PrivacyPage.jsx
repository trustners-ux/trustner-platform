import ComplianceFooter from '../components/ComplianceFooter'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <header style={{ background: '#1B3A6B', padding: '16px 24px' }}>
        <a href="/review" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          MeraSIP
        </a>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', lineHeight: 1.8, fontSize: 14, color: '#374151' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B3A6B', fontFamily: 'Georgia, serif', marginBottom: 24 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 24 }}>
          Last updated: March 2026 | Trustner Asset Services Pvt. Ltd. | ARN-286886
        </p>

        <h2 style={h2}>1. Data Controller</h2>
        <p>Trustner Asset Services Pvt. Ltd. (CIN: U66301AS2023PTC025505), operating under the brand "MeraSIP",
           is the data controller for personal data collected through this platform.</p>

        <h2 style={h2}>2. Information We Collect</h2>
        <p>When you use MeraSIP, we may collect:</p>
        <ul>
          <li>Name, PAN, email address, and mobile number (from CAS upload or manual entry)</li>
          <li>Portfolio data extracted from your CAS PDF (fund names, units, NAV, values)</li>
          <li>Usage data (pages visited, features used)</li>
        </ul>

        <h2 style={h2}>3. CAS PDF Handling</h2>
        <p><strong>We do not store your CAS PDF.</strong> When you upload a CAS PDF:</p>
        <ul>
          <li>It is processed in server memory only</li>
          <li>Text is extracted and structured into portfolio data</li>
          <li>The original PDF file is deleted immediately after processing</li>
          <li>Only the structured portfolio data (JSON) is retained</li>
        </ul>

        <h2 style={h2}>4. How We Use Your Data</h2>
        <ul>
          <li>To generate portfolio review reports</li>
          <li>To provide rebalancing recommendations</li>
          <li>To send reports via email or WhatsApp (only with your consent)</li>
          <li>To improve our services</li>
        </ul>

        <h2 style={h2}>5. Data Sharing</h2>
        <p>We do not sell or share your personal data with third parties, except:</p>
        <ul>
          <li>With your explicit consent</li>
          <li>To comply with legal obligations</li>
          <li>With service providers (Supabase for database, Brevo for email, Interakt for WhatsApp) who process data on our behalf</li>
        </ul>

        <h2 style={h2}>6. Data Retention</h2>
        <p>Portfolio data is retained for as long as your account is active or as needed to provide services.
           You can request deletion at any time.</p>

        <h2 style={h2}>7. Your Rights (DPDP Act 2023)</h2>
        <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
        </ul>
        <p>To exercise these rights, contact us at <strong>wecare@finedgeservices.com</strong>.</p>

        <h2 style={h2}>8. Security</h2>
        <p>We use industry-standard security measures including HTTPS encryption, secure database hosting (Supabase),
           and access controls to protect your data.</p>

        <h2 style={h2}>9. Contact</h2>
        <p>Trustner Asset Services Pvt. Ltd.<br />
           Sethi Trust, Unit 2, 4th Floor, G S Road, Bhangagarh, Dispur, Guwahati - 781005, Assam<br />
           Email: wecare@finedgeservices.com | Phone: +91 60039 03731</p>
      </main>
      <ComplianceFooter />
    </div>
  )
}

const h2 = { fontSize: 18, fontWeight: 700, color: '#1B3A6B', marginTop: 32, marginBottom: 8 }
