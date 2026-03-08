export default function ComplianceFooter() {
  return (
    <footer style={{
      background: '#1B3A6B', color: 'rgba(255,255,255,0.7)', padding: '32px 24px',
      fontSize: 11, lineHeight: 1.6, marginTop: 48,
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Georgia, serif' }}>
              MeraSIP
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>by Trustner Asset Services</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 12 }}>ARN-286886</div>
            <div>EUIN: E092119</div>
          </div>
        </div>

        <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#fff' }}>Trustner Asset Services Pvt. Ltd.</strong> is an AMFI Registered Mutual Fund Distributor,
            not a SEBI Registered Investment Adviser.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            CIN: U66301AS2023PTC025505
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Sethi Trust, Unit 2, 4th Floor, G S Road, Bhangagarh, Dispur, Guwahati – 781005, Assam
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Email: wecare@finedgeservices.com | Phone: +91 60039 03731 / +91 98640 51214
          </p>
        </div>

        <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#fff' }}>
            Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            We earn distributor commissions from AMCs on investments made through us.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16, fontSize: 10 }}>
          <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>
            SEBI SCORES
          </a>
          <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>
            AMFI India
          </a>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>
            Terms of Use
          </a>
        </div>

        <div style={{ marginTop: 16, fontSize: 10, opacity: 0.5 }}>
          www.merasip.com
        </div>
      </div>
    </footer>
  )
}
