/**
 * GET /api/og/fund/[amfi_code]
 *
 * Per-fund Open Graph image (1200x630). Renders scheme name, AUM, 1Y return,
 * and the Trustner wordmark. Used by social previews when a /funds/[code]
 * link is shared.
 */

import { ImageResponse } from 'next/og';
import { getFundByAmfiCode } from '@/lib/services/pd-fund-detail';

export const runtime = 'nodejs';
export const revalidate = 3600;

const fmtPct = (v: number | null) =>
  v == null || isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

const fmtCr = (v: number | null) => {
  if (v == null || isNaN(v)) return '—';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L Cr`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K Cr`;
  return `₹${v.toFixed(0)} Cr`;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ amfi_code: string }> }
) {
  const { amfi_code } = await params;
  const fund = await getFundByAmfiCode(amfi_code);

  const schemeName = fund?.scheme_name ?? 'Mutual Fund';
  const amcName = fund?.amc_name ?? 'Trustner Research';
  const category = fund?.external_category ?? fund?.amfi_category ?? '';
  const aum = fmtCr(fund?.aum_inr_cr ?? null);
  const ret1y = fmtPct(fund?.returns_1y ?? null);
  const ret1yPositive = (fund?.returns_1y ?? 0) >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0c4a6e 0%, #134e4a 60%, #0f766e 100%)',
          color: 'white',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        {/* Top bar — Trustner wordmark + ARN */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                background: 'white',
                color: '#0c4a6e',
                width: 56,
                height: 56,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              T
            </span>
            <span>Trustner</span>
          </div>
          <div
            style={{
              fontSize: 18,
              opacity: 0.7,
              letterSpacing: '0.04em',
            }}
          >
            Mera SIP Online · ARN-286886
          </div>
        </div>

        {/* Category pill */}
        {category && (
          <div
            style={{
              marginTop: 56,
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '8px 16px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              fontSize: 20,
              letterSpacing: '0.02em',
            }}
          >
            {category}
          </div>
        )}

        {/* Scheme name */}
        <div
          style={{
            marginTop: 24,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '90%',
            display: 'flex',
          }}
        >
          {schemeName}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            opacity: 0.8,
            display: 'flex',
          }}
        >
          {amcName}
        </div>

        {/* KPI row */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            gap: 32,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, opacity: 0.7 }}>AUM</div>
            <div style={{ fontSize: 44, fontWeight: 700 }}>{aum}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, opacity: 0.7 }}>1Y Return</div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: ret1yPositive ? '#86efac' : '#fca5a5',
              }}
            >
              {ret1y}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              alignSelf: 'flex-end',
              fontSize: 16,
              opacity: 0.6,
              display: 'flex',
            }}
          >
            merasip.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
