import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function RiskDisclosurePage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <Link href="/" className="text-sm text-brand hover:underline mb-6 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-display-sm text-primary-700 mb-8">Risk Disclosure</h1>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
          <p className="text-sm font-semibold text-amber-900">
            {DISCLAIMER.mutual_fund}
          </p>
        </div>

        <div className="prose-sip">
          <p className="text-sm text-surface-600">Last updated: March 2026</p>

          <h2>Risk Factors for Mutual Fund Investments</h2>
          <p>
            Investing in mutual funds involves various types of risks including, but not limited to, market risk,
            interest rate risk, credit risk, liquidity risk, and regulatory risk. Prospective investors should
            carefully consider the risk factors before making any investment decisions. This document outlines the
            key risks associated with mutual fund investments distributed through {COMPANY.mfEntity.name} ({COMPANY.mfEntity.amfiArn}).
          </p>
          <p>{DISCLAIMER.risk_factors}</p>

          <h2>Market Risk</h2>

          <h3>Equity Risk</h3>
          <p>
            Equity mutual funds invest in stocks listed on recognised stock exchanges. The value of these investments
            is directly affected by stock market movements. Factors such as economic conditions, corporate earnings,
            geopolitical events, industry trends, and investor sentiment can cause significant price fluctuations.
            Equity investments carry the highest degree of market risk and are suitable only for investors with a
            long-term investment horizon and higher risk tolerance.
          </p>

          <h3>Debt and Interest Rate Risk</h3>
          <p>
            Debt mutual funds invest in bonds, government securities, debentures, and other fixed-income instruments.
            The value of debt fund investments is inversely related to changes in prevailing interest rates. When
            interest rates rise, the market value of existing bonds falls, and vice versa. Longer-duration debt
            instruments carry higher interest rate sensitivity.
          </p>

          <h3>Credit Risk</h3>
          <p>
            Debt funds are exposed to the risk that a bond issuer may default on interest payments or principal
            repayment. Lower-rated securities offer higher yields but carry greater credit risk. A credit rating
            downgrade of an underlying security can result in a decline in the NAV of the fund.
          </p>

          <h3>Liquidity Risk</h3>
          <p>
            Certain securities held by mutual fund schemes may have limited liquidity in the secondary market.
            During periods of market stress or unusual redemption pressure, the fund may face difficulty in
            liquidating its holdings at fair value, which may impact the NAV and the ability to process
            redemptions in a timely manner.
          </p>

          <h2>No Guarantee of Returns</h2>
          <p>{DISCLAIMER.no_guarantee}</p>
          <p>
            Neither {COMPANY.mfEntity.name}, nor any of its officers, directors, or employees, guarantee any
            specific rate of return or the performance of any mutual fund scheme. The investment value and returns
            are not guaranteed and may fluctuate based on market conditions.
          </p>

          <h2>NAV Fluctuation</h2>
          <p>
            The Net Asset Value (NAV) of mutual fund units is subject to daily fluctuation based on the market
            value of the underlying securities. The NAV may increase or decrease on any given day. Investors may
            receive less than the original amount invested when they redeem their units. All subscriptions and
            redemptions are processed at the applicable NAV as per the cut-off times stipulated by SEBI.
          </p>

          <h2>Past Performance Disclaimer</h2>
          <p>
            Past performance of any mutual fund scheme is not indicative of future results. Historical returns,
            rankings, and ratings displayed on this platform are provided for informational purposes only and
            should not be relied upon as an indicator of future performance. Market conditions and fund performance
            can vary significantly from one period to another.
          </p>

          <h2>Taxation Risks</h2>
          <p>
            The tax treatment of mutual fund investments is subject to changes in tax laws, rules, and regulations.
            Capital gains tax rates, dividend distribution tax provisions, and other applicable taxes may be amended
            by the Government of India from time to time. Investors should consult their tax advisors regarding the
            tax implications specific to their circumstances. The current tax benefits, if any, are as per existing
            laws and may change without prior notice.
          </p>

          <h2>Regulatory Changes</h2>
          <p>
            Mutual fund operations are governed by SEBI (Mutual Funds) Regulations, 1996 as amended from time to
            time. Any changes in regulations, policies, or guidelines by SEBI, AMFI, RBI, or other regulatory bodies
            may impact the operations, valuation, performance, and taxation of mutual fund schemes. Such changes may
            include alterations in categorisation norms, expense ratio limits, commission structures, or reporting
            requirements.
          </p>

          <h2>Risk Mitigation through SIP</h2>
          <p>
            Systematic Investment Plans (SIPs) help mitigate the impact of market volatility through rupee cost
            averaging. By investing a fixed amount at regular intervals, investors buy more units when prices are
            low and fewer units when prices are high, which can potentially reduce the average cost per unit over
            time. However, SIPs do not assure a profit or protect against loss in declining markets. SIPs are
            suitable for investors with a long-term investment horizon.
          </p>
          <p>
            It is important to note that SIP does not guarantee returns or protect the investor against losses
            in any market downturn. SIP is merely a method of investment and does not constitute an investment
            strategy or recommendation.
          </p>

          <h2>Important Investor Information</h2>
          <ul>
            <li>{DISCLAIMER.kyc}</li>
            <li>{DISCLAIMER.sebi_investor}</li>
            <li>
              Investors should read and understand the Scheme Information Document (SID), Statement of Additional
              Information (SAI), and Key Information Memorandum (KIM) of the respective schemes before investing.
            </li>
            <li>
              Investors should assess their risk appetite, investment goals, and financial situation before
              selecting a mutual fund scheme.
            </li>
            <li>
              For any complaints regarding mutual fund investments, investors can approach the SEBI SCORES portal
              at scores.gov.in or call toll-free 1800-22-7575.
            </li>
          </ul>

          <h2>Distributor Information</h2>
          <p>
            {COMPANY.mfEntity.name} is an {COMPANY.mfEntity.type} ({COMPANY.mfEntity.amfiArn},
            EUIN: {COMPANY.mfEntity.euin}). CIN: {COMPANY.mfEntity.cin}.
            Registered Office: {COMPANY.address.full}.
          </p>
          <p>
            As a mutual fund distributor, {COMPANY.mfEntity.shortName} facilitates investment transactions on behalf
            of investors. The distributor does not manage the funds or make investment decisions on behalf of the
            Asset Management Companies (AMCs).
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
