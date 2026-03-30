import { COMPANY } from '@/lib/constants/company';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CommissionDisclosurePage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <Link href="/" className="text-sm text-brand hover:underline mb-6 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-display-sm text-primary-700 mb-8">Commission Disclosure</h1>

        <div className="prose-sip">
          <p className="text-sm text-surface-600">Last updated: March 2026</p>

          <p>
            {COMPANY.mfEntity.name} believes in complete transparency regarding the commissions and fees
            associated with mutual fund distribution. This page explains how mutual fund distribution
            commissions work, what investors pay, and our commitment to fee transparency in compliance
            with SEBI and AMFI guidelines.
          </p>

          <h2>How Mutual Fund Distribution Works</h2>
          <p>
            {COMPANY.mfEntity.shortName} ({COMPANY.mfEntity.amfiArn}) is an AMFI Registered Mutual Fund
            Distributor. As a distributor, we help investors select and invest in mutual fund schemes offered
            by various Asset Management Companies (AMCs). The distributor receives a trail commission from
            the AMC for the services provided to investors, which includes investment guidance, transaction
            facilitation, ongoing portfolio monitoring, and investor support.
          </p>

          <h2>No Additional Charges to Investor</h2>
          <p>
            When you invest in a mutual fund through {COMPANY.mfEntity.shortName}, your entire invested amount
            goes fully towards purchasing mutual fund units. There are no additional charges, fees, or deductions
            from the investor at the time of investment or redemption by the distributor. The distributor does
            not levy any separate advisory fee, transaction charge (beyond SEBI-prescribed transaction charges
            for eligible investments), or service fee on investors.
          </p>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg my-4">
            <p className="text-sm text-green-900">
              <strong>Key Point:</strong> Your full investment amount is invested in the mutual fund scheme.
              No portion of your investment is deducted as distributor commission.
            </p>
          </div>

          <h2>Trail Commission</h2>
          <p>
            Trail commission is an ongoing commission paid by the Asset Management Company (AMC) to the mutual
            fund distributor for as long as the investor remains invested in the scheme. This commission is paid
            by the AMC from its own revenue and is not separately charged to or deducted from the investor&apos;s
            investment.
          </p>
          <p>
            The trail commission rate varies across different AMCs, scheme categories, and plan options. It is
            typically a percentage of the Assets Under Management (AUM) attributable to the distributor and is
            paid on a regular basis (usually monthly or quarterly).
          </p>

          <h2>Expense Ratio and Total Expense Ratio (TER)</h2>
          <p>
            Every mutual fund scheme charges an annual fee known as the Total Expense Ratio (TER), which is
            deducted from the scheme&apos;s assets and reflected in the daily NAV. The TER includes fund management
            fees, administrative costs, marketing expenses, and distributor commissions. SEBI prescribes maximum
            TER limits based on the scheme category and AUM size.
          </p>
          <p>
            The distributor commission is included within the TER of the regular plan. This means the TER of a
            regular plan is higher than the TER of the corresponding direct plan by the amount attributable to
            the distribution commission. Investors can view the current TER of any scheme on the respective
            AMC&apos;s website or on the AMFI website.
          </p>

          <h2>Direct Plans vs Regular Plans</h2>
          <p>
            SEBI mandates that every mutual fund scheme must offer two plan options:
          </p>
          <ul>
            <li>
              <strong>Direct Plan:</strong> Investors invest directly with the AMC without any intermediary.
              No distributor commission is included in the TER, resulting in a lower expense ratio and
              potentially higher returns over time.
            </li>
            <li>
              <strong>Regular Plan:</strong> Investors invest through a registered mutual fund distributor
              (such as {COMPANY.mfEntity.shortName}). The TER includes the distributor&apos;s trail commission,
              resulting in a marginally higher expense ratio compared to the direct plan.
            </li>
          </ul>
          <p>
            By investing through a regular plan, investors receive the benefit of distributor services including
            investment guidance, portfolio review assistance, transaction facilitation, regulatory compliance
            support, and ongoing investor servicing. Investors should evaluate both options and choose based on
            their requirements and preference for advisory support.
          </p>

          <h2>Fee Transparency Commitment</h2>
          <p>
            {COMPANY.mfEntity.shortName} is committed to full transparency in all aspects of mutual fund
            distribution. Our fee transparency practices include:
          </p>
          <ul>
            <li>
              <strong>No Hidden Charges:</strong> We do not charge any hidden or undisclosed fees to investors.
              All applicable charges, if any, are disclosed upfront before any transaction.
            </li>
            <li>
              <strong>Commission Disclosure on Request:</strong> Investors have the right to know the commission
              earned by the distributor on their investments. We will provide commission details upon request.
            </li>
            <li>
              <strong>Account Statements:</strong> Investors receive account statements from the AMC and the
              Registrar &amp; Transfer Agent (RTA) directly, ensuring independent verification of all transactions
              and holdings.
            </li>
            <li>
              <strong>No Churning:</strong> We do not encourage unnecessary switching or churning of investments
              for the purpose of earning additional commissions. All investment recommendations are made in the
              best interest of the investor.
            </li>
            <li>
              <strong>Best Execution:</strong> All transactions are executed at the applicable NAV as per
              SEBI-prescribed cut-off timings, ensuring fair treatment of all investors.
            </li>
          </ul>

          <h2>AMFI Guidelines Compliance</h2>
          <p>
            As an AMFI registered distributor, {COMPANY.mfEntity.shortName} strictly adheres to the AMFI Code
            of Conduct for intermediaries and all applicable AMFI guidelines regarding commission disclosure
            and investor servicing. These guidelines include:
          </p>
          <ul>
            <li>Acting in the best interest of investors at all times.</li>
            <li>Providing accurate and complete information about mutual fund schemes.</li>
            <li>Not guaranteeing or assuring any returns on mutual fund investments.</li>
            <li>Disclosing all commissions received from AMCs to investors upon request.</li>
            <li>Not rebating commission back to investors as per SEBI regulations.</li>
            <li>Maintaining the highest standards of professional conduct and ethics.</li>
          </ul>

          <h2>No Hidden Charges Statement</h2>
          <p>
            {COMPANY.mfEntity.name} categorically states that there are no hidden charges, fees, or deductions
            applied to investor accounts beyond what is disclosed by the AMC in the scheme documents. The only
            charges applicable to investors are those prescribed by SEBI and disclosed in the Scheme Information
            Document (SID) and Key Information Memorandum (KIM) of the respective mutual fund schemes, including
            exit load (if any) and applicable taxes.
          </p>

          <h2>Contact for Commission-Related Queries</h2>
          <p>
            If you have any questions regarding commissions, fees, or charges related to your mutual fund
            investments, please feel free to contact us:
          </p>
          <div className="p-4 bg-surface-200 rounded-lg mb-4">
            <p className="text-sm"><strong>Email:</strong>{' '}
              <a href={`mailto:${COMPANY.contact.email}`} className="text-brand hover:underline">
                {COMPANY.contact.email}
              </a>
            </p>
            <p className="text-sm"><strong>Phone:</strong>{' '}
              <a href={`tel:${COMPANY.contact.phone}`} className="text-brand hover:underline">
                {COMPANY.contact.phone}
              </a>
            </p>
            <p className="text-sm"><strong>Grievance Email:</strong>{' '}
              <a href={`mailto:${COMPANY.contact.grievanceEmail}`} className="text-brand hover:underline">
                {COMPANY.contact.grievanceEmail}
              </a>
            </p>
            <p className="text-sm"><strong>Address:</strong> {COMPANY.address.full}</p>
          </div>

          <h2>Regulatory Information</h2>
          <p>
            {COMPANY.mfEntity.name} | {COMPANY.mfEntity.type} | {COMPANY.mfEntity.amfiArn} |
            EUIN: {COMPANY.mfEntity.euin} | CIN: {COMPANY.mfEntity.cin}
          </p>

          <div className="mt-8 p-4 bg-surface-200 rounded-lg">
            <p className="text-sm font-semibold text-primary-700 mb-2">Important Regulatory Links</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  SEBI — Securities and Exchange Board of India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  AMFI — Association of Mutual Funds in India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  SCORES — SEBI Complaint Redressal System <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.amfiindia.com/investor-corner/knowledge-center/investor-charter.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  AMFI Investor Charter <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
