'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Verdict {
  code: string;
  label: string;
  color: string;
  description: string;
}

interface Holding {
  id: number;
  fundName: string;
  category: string | null;
  entityName: string;
  investedInr: number;
  currentValueInr: number;
  gainInr: number;
  gainPct: number;
  verdict: Verdict;
  action: string | null;
  qualityVerdict: string | null;
  suitability: string | null;
  riskTier: string | null;
  suggestion: string | null;
}

interface Sip {
  id: number;
  fundName: string;
  monthlyAmountInr: number;
  frequency: string;
  status: string;
  entityName: string;
  fundVerdict: string | null;
  action: string | null;
}

interface ReviewData {
  id: number;
  documentId: string;
  familyName: string;
  status: string;
  createdAt: string;
  riskProfileCaptured: boolean;
  profileLabel: string | null;
  targetEquityPct: number | null;
  clientPosture: string | null;
  summary: {
    numHoldings: number;
    numActiveSips: number;
    numFunds: number;
    numAmcs: number;
    totalInvestedInr: number;
    currentValueInr: number;
    gainInr: number;
    gainPct: number;
    monthlySipFlowInr: number;
    verdicts: { star: number; keep: number; watch: number; swap: number; liquidate: number };
    duplicateFunds: number;
    estimatedTaxInr: number;
  };
  holdings: Holding[];
  sips: Sip[];
}

const fmtInr = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)} L`;
  return `${sign}${abs.toLocaleString('en-IN')}`;
};

type SortKey = 'value' | 'gain' | 'verdict';

const VERDICT_ORDER: Record<string, number> = { LIQUIDATE: 0, SWAP: 1, WATCH: 2, KEEP: 3, STAR: 4 };

export default function ReviewClient({ review }: { review: ReviewData }) {
  const [sortBy, setSortBy] = useState<SortKey>('verdict');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const s = review.summary;

  const sorted = [...review.holdings].sort((a, b) => {
    if (sortBy === 'value') return Number(b.currentValueInr) - Number(a.currentValueInr);
    if (sortBy === 'gain') return b.gainPct - a.gainPct;
    return (VERDICT_ORDER[a.verdict.code] ?? 2) - (VERDICT_ORDER[b.verdict.code] ?? 2);
  });

  const needsAction = s.verdicts.swap + s.verdicts.liquidate;
  const healthy = s.verdicts.star + s.verdicts.keep;
  const healthScore = s.numHoldings > 0 ? Math.round((healthy / s.numHoldings) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Portfolio Health Report</h1>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
            {review.familyName} &middot; {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/portal/portfolio-review"
          style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', textDecoration: 'none', padding: '6px 14px', border: '1px solid #BFDBFE', borderRadius: 8, background: '#EFF6FF' }}
        >
          Upload New CAS
        </Link>
      </div>

      {/* Health score hero */}
      <div style={{ background: 'linear-gradient(135deg, #0A1628, #1E40AF)', borderRadius: 16, padding: '24px 28px', color: '#fff', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Portfolio Health</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{healthScore}%</div>
            <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 4 }}>
              {healthy} of {s.numHoldings} funds in good shape
              {needsAction > 0 && <> &middot; <span style={{ color: '#FCA5A5' }}>{needsAction} need action</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <HeroStat label="Invested" value={fmtInr(s.totalInvestedInr)} />
            <HeroStat label="Current" value={fmtInr(s.currentValueInr)} />
            <HeroStat label="Gain" value={`${s.gainPct >= 0 ? '+' : ''}${s.gainPct}%`} sub={fmtInr(s.gainInr)} />
          </div>
        </div>
      </div>

      {/* Verdict summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <VerdictChip count={s.verdicts.star} label="Excellent" color="#059669" bg="#ECFDF5" />
        <VerdictChip count={s.verdicts.keep} label="Good" color="#0D9488" bg="#F0FDFA" />
        <VerdictChip count={s.verdicts.watch} label="Monitor" color="#D97706" bg="#FFFBEB" />
        <VerdictChip count={s.verdicts.swap} label="Needs Change" color="#EA580C" bg="#FFF7ED" />
        <VerdictChip count={s.verdicts.liquidate} label="Exit" color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* Insights strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <InsightCard icon="📊" label="Funds" value={`${s.numFunds}`} sub={`across ${s.numAmcs} AMCs`} />
        <InsightCard icon="💰" label="Monthly SIPs" value={s.monthlySipFlowInr > 0 ? fmtInr(s.monthlySipFlowInr) : 'None'} sub={`${s.numActiveSips} active`} />
        {s.duplicateFunds > 0 && <InsightCard icon="🔄" label="Duplicates" value={`${s.duplicateFunds}`} sub="funds can be consolidated" warn />}
        {s.estimatedTaxInr > 0 && <InsightCard icon="🧾" label="Est. Tax" value={fmtInr(s.estimatedTaxInr)} sub="on recommended exits" />}
      </div>

      {!review.riskProfileCaptured && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#92400E', marginBottom: 18 }}>
          <strong>Risk profile not yet captured.</strong> The verdicts above are based on default assumptions.
          Contact your Trustner advisor to complete your risk assessment for personalized recommendations.
        </div>
      )}

      {/* Holdings table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Fund-by-Fund Analysis</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['verdict', 'value', 'gain'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              style={{
                padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: sortBy === k ? '#1E40AF' : '#fff', color: sortBy === k ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {k === 'verdict' ? 'Priority' : k === 'value' ? 'Value' : 'Gain'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((h) => (
          <div
            key={h.id}
            onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
            style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
              padding: '12px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s',
              borderLeft: `4px solid ${h.verdict.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.fundName}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {h.category || 'Uncategorized'} &middot; {h.entityName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                  color: h.verdict.color,
                  background: h.verdict.code === 'STAR' ? '#ECFDF5' : h.verdict.code === 'KEEP' ? '#F0FDFA' : h.verdict.code === 'WATCH' ? '#FFFBEB' : h.verdict.code === 'SWAP' ? '#FFF7ED' : '#FEF2F2',
                }}>
                  {h.verdict.label}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#475569' }}>
              <span>Invested: <b>{fmtInr(Number(h.investedInr))}</b></span>
              <span>Current: <b>{fmtInr(Number(h.currentValueInr))}</b></span>
              <span style={{ color: h.gainPct >= 0 ? '#059669' : '#DC2626' }}>
                {h.gainPct >= 0 ? '+' : ''}{h.gainPct}%
              </span>
            </div>

            {expandedId === h.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 8px', lineHeight: 1.6 }}>
                  {h.verdict.description}
                </p>
                {h.action && (
                  <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 700, marginBottom: 6 }}>
                    Recommended: {h.action}
                  </div>
                )}
                {h.suggestion && (
                  <div style={{ fontSize: 12, color: '#475569', background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, marginTop: 6 }}>
                    {h.suggestion}
                  </div>
                )}
                {h.riskTier && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                    Fund risk tier: {h.riskTier} {h.suitability && `· Suitability: ${h.suitability}`}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SIPs section */}
      {review.sips.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>Active SIPs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {review.sips.filter((s) => s.status === 'Active').map((s) => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0A1628' }}>{s.fundName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{s.entityName} &middot; {s.frequency}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0A1628' }}>{fmtInr(Number(s.monthlyAmountInr))}/mo</div>
                    {s.fundVerdict && (
                      <div style={{ fontSize: 10, color: s.fundVerdict === 'STAR' || s.fundVerdict === 'KEEP' ? '#059669' : '#D97706', fontWeight: 700, marginTop: 2 }}>
                        Fund: {s.fundVerdict}
                      </div>
                    )}
                  </div>
                </div>
                {s.action && s.action !== 'CONTINUE' && (
                  <div style={{ fontSize: 11.5, color: '#EA580C', fontWeight: 600, marginTop: 6, padding: '4px 8px', background: '#FFF7ED', borderRadius: 6, display: 'inline-block' }}>
                    {s.action === 'REDIRECT' ? 'Consider redirecting — speak with your advisor' : s.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628, #1E3A5F)',
        borderRadius: 16, padding: '24px 28px', color: '#fff', marginTop: 28, textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Want personalized recommendations?</div>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
          Your Trustner advisor can review this report, capture your complete risk profile,
          and recommend specific fund switches optimized for your goals.
        </p>
        <Link
          href="/portal/requests/new?category=portfolio_review"
          style={{
            display: 'inline-block', padding: '12px 28px',
            background: '#06B6D4', color: '#fff', borderRadius: 8,
            fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}
        >
          Request Advisor Review
        </Link>
      </div>

      <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
        Trustner Asset Services Pvt. Ltd. | ARN-286886 | AMFI Registered MFD<br />
        This analysis is for information only and does not constitute investment advice (SEBI Inv Adv Regs 2013).
      </div>
    </div>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function VerdictChip({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  if (count === 0) return null;
  return (
    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, color, background: bg }}>
      {count} {label}
    </span>
  );
}

function InsightCard({ icon, label, value, sub, warn }: { icon: string; label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div style={{ flex: '1 1 140px', background: warn ? '#FFFBEB' : '#F8FAFC', borderRadius: 10, padding: '12px 14px', minWidth: 130 }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: warn ? '#D97706' : '#0A1628', marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
