/**
 * /funds/[slug] — Canonical fund-detail route.
 *
 * Numeric slug (4-7 digits) → resolves as AMFI code against pd_fund_master,
 * server-rendered with full SEO metadata + OG image. This is the canonical
 * URL for per-fund pages (e.g. /funds/120503).
 *
 * Non-numeric slug → falls back to the legacy client-side resolver which
 * maps the slug to an MFAPI scheme code (curated Trustner list + MFAPI
 * search). Preserved for backwards-compatibility with existing inbound
 * links from the curated /funds/explore + selection surfaces.
 *
 * Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getFundByAmfiCode,
  getCategoryPeers,
  getCategoryMedianReturns,
} from '@/lib/services/pd-fund-detail';
import { FundHeaderCanonical } from '@/components/funds/detail/FundHeaderCanonical';
import { FundKpiGrid } from '@/components/funds/detail/FundKpiGrid';
import { FundReturnsCanonical } from '@/components/funds/detail/FundReturnsCanonical';
import { FundNavChartCanonical } from '@/components/funds/detail/FundNavChartCanonical';
import { FundCalendarStrip } from '@/components/funds/detail/FundCalendarStrip';
import { FundAllocationBlock } from '@/components/funds/detail/FundAllocationBlock';
import { FundRiskBlock } from '@/components/funds/detail/FundRiskBlock';
import { FundManagerCard } from '@/components/funds/detail/FundManagerCard';
import { FundKeyInfoTable } from '@/components/funds/detail/FundKeyInfoTable';
import { FundPeerCompareCanonical } from '@/components/funds/detail/FundPeerCompareCanonical';
import { FundTalkToTrustnerCta } from '@/components/funds/detail/FundTalkToTrustnerCta';
import { FundDetailLegacy } from './FundDetailLegacy';
import { DISCLAIMER, COMPANY } from '@/lib/constants/company';

export const revalidate = 3600;
export const runtime = 'nodejs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const NUMERIC_AMFI = /^[0-9]{4,7}$/;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Canonical AMFI-code branch — fetch and build rich SEO metadata.
  if (NUMERIC_AMFI.test(slug)) {
    const fund = await getFundByAmfiCode(slug);
    if (!fund) {
      return {
        title: `Fund Not Found — ${COMPANY.platform}`,
        description: 'This mutual fund scheme could not be found.',
      };
    }

    const nav = fund.live_nav != null ? `₹${fund.live_nav.toFixed(2)}` : 'NA';
    const ret1y = fund.returns_1y != null ? `${fund.returns_1y.toFixed(1)}%` : 'NA';
    const cagr3y = fund.returns_3y != null ? `${fund.returns_3y.toFixed(1)}%` : 'NA';

    const title = `${fund.scheme_name} — NAV ${nav}, ${ret1y} 1Y | Trustner Mutual Fund Distributor`;
    const description = `${fund.amc_name ?? 'Mutual Fund'} · ${fund.external_category ?? fund.amfi_category ?? 'Mutual Fund'} · 3Y CAGR ${cagr3y}. Live NAV, returns trail, risk metrics, peer comparison. Talk to Trustner (ARN-286886) about this scheme.`;

    return {
      title,
      description,
      alternates: { canonical: `/funds/${fund.amfi_code}` },
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: COMPANY.platform,
        images: [
          {
            url: `/api/og/fund/${fund.amfi_code}`,
            width: 1200,
            height: 630,
            alt: fund.scheme_name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og/fund/${fund.amfi_code}`],
      },
    };
  }

  // Legacy non-numeric slug → keep prior generic metadata.
  const parts = slug.split('-');
  const nameFromSlug =
    parts.length > 1
      ? parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : slug;
  return {
    title: `${nameFromSlug} — ${COMPANY.platform}`,
    description: `View detailed analysis, NAV history, returns, expense ratio, and peer comparison for ${nameFromSlug}.`,
  };
}

export default async function FundDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Non-numeric slug → legacy client resolver (MFAPI scheme code path).
  if (!NUMERIC_AMFI.test(slug)) {
    return <FundDetailLegacy />;
  }

  // Canonical AMFI-code path.
  const fund = await getFundByAmfiCode(slug);
  if (!fund) {
    notFound();
  }

  // Peer + median in parallel.
  const [peers, median] = await Promise.all([
    fund.external_category
      ? getCategoryPeers(fund.external_category, fund.amfi_code, 8)
      : Promise.resolve([]),
    fund.external_category
      ? getCategoryMedianReturns(fund.external_category)
      : Promise.resolve(null),
  ]);

  // Structured data — helps search engines render a rich result and understand
  // the page is a specific fund scheme distributed by Trustner. Purely
  // descriptive (no rating / "buy" signal) to stay MFD-compliant.
  const SITE = 'https://www.merasip.com';
  const canonicalUrl = `${SITE}/funds/${fund.amfi_code}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: fund.scheme_name,
        category: fund.external_category ?? fund.amfi_category ?? 'Mutual Fund',
        url: canonicalUrl,
        description: `${fund.scheme_name} — ${fund.external_category ?? fund.amfi_category ?? 'mutual fund'} scheme. Live NAV, returns trail, risk metrics and peer comparison from Trustner, an AMFI-registered Mutual Fund Distributor (ARN-286886).`,
        ...(fund.amc_name
          ? { provider: { '@type': 'Organization', name: fund.amc_name } }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Funds', item: `${SITE}/funds` },
          { '@type': 'ListItem', position: 2, name: 'Fund Universe', item: `${SITE}/funds/universe` },
          { '@type': 'ListItem', position: 3, name: fund.scheme_name, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FundHeaderCanonical fund={fund} />
      <FundKpiGrid fund={fund} />
      <FundReturnsCanonical fund={fund} median={median} />
      <FundNavChartCanonical amfiCode={fund.amfi_code} schemeName={fund.scheme_name} />
      <FundCalendarStrip fund={fund} />
      <FundAllocationBlock fund={fund} />
      <FundRiskBlock fund={fund} />
      <FundManagerCard fund={fund} />
      <FundKeyInfoTable fund={fund} />
      <FundPeerCompareCanonical current={fund} peers={peers} />
      <FundTalkToTrustnerCta fundName={fund.scheme_name} amfiCode={fund.amfi_code} />

      {/* Mandatory compliance footer — AMFI ARN + SEBI past-perf disclaimer. */}
      <section className="py-8 bg-surface-200 border-t border-slate-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3 border border-slate-200">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-700">Disclaimer:</strong>{' '}
              The information on this page is for educational and research purposes only and
              does NOT constitute investment advice as defined under SEBI (Investment Advisers)
              Regulations, 2013. Trustner Asset Services Pvt. Ltd. is an AMFI Registered Mutual
              Fund Distributor (ARN-286886) and recommends Regular plans only. Fund data is
              sourced from AMFI / MFAPI and refreshed periodically; verify with the AMC before
              investing.
            </p>
          </div>
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} · {DISCLAIMER.amfi} · {DISCLAIMER.sebi_investor}
          </p>
          <p className="mt-3 text-center">
            <Link
              href="/funds/universe"
              className="text-xs font-semibold text-brand hover:text-brand-700"
            >
              ← Back to Fund Universe
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
