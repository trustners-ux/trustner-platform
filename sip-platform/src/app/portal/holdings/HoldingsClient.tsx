'use client';

/**
 * Client-side holdings dashboard.
 *
 * Renders:
 *   - Hero card: Total AUM, Invested, Returns, last updated
 *   - View toggle: My portfolio ↔ Family consolidated (only when family exists)
 *   - Scheme breakup table (sortable)
 *   - Active SIPs widget
 *   - Disclaimer
 *
 * No vendor brand exposed anywhere — only generic terms.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PortalHoldingsView } from '@/lib/portal/holdings';

const INR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const PCT = (n: number | null) => n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function HoldingsClient({ view, displayName }: { view: PortalHoldingsView | null; displayName: string }) {
  const [scope, setScope] = useState<'self' | 'family'>('self');
  const [sortBy, setSortBy] = useState<'value' | 'return' | 'scheme'>('value');

  const hasFamily = (view?.family_members?.length ?? 0) > 1;
  const summary = view?.summary;
  const familySummary = view?.family_summary;
  const activeSips = view?.active_sips ?? [];

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    const list = [...(view?.holdings ?? [])];
    if (sortBy === 'value') list.sort((a, b) => (b.current_value ?? 0) - (a.current_value ?? 0));
    else if (sortBy === 'return') list.sort((a, b) => (b.absolute_return_pct ?? -Infinity) - (a.absolute_return_pct ?? -Infinity));
    else list.sort((a, b) => a.scheme_name.localeCompare(b.scheme_name));
    return list;
  }, [view?.holdings, sortBy]);

  // Hero numbers — pull from family summary if in family-scope
  const heroAum = scope === 'family' && familySummary ? familySummary.total_aum : (summary?.total_aum ?? 0);
  const heroInvested = scope === 'family' && familySummary ? familySummary.total_invested : (summary?.total_invested ?? 0);
  const heroGain = scope === 'family' && familySummary ? familySummary.absolute_gain : (summary?.absolute_gain ?? 0);
  const heroReturnPct = scope === 'family' && familySummary ? familySummary.absolute_return_pct : (summary?.absolute_return_pct ?? null);
  const lastUpdated = scope === 'family' && familySummary ? familySummary.last_updated_at : (summary?.last_updated_at ?? null);

  const hasAnyData = (summary?.scheme_count ?? 0) > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Holdings</h1>
          <p style={{ fontSize: 12.5, color: '#475569', margin: 0 }}>
            Your mutual-fund portfolio at a glance{hasAnyData ? `, ${summary?.scheme_count} schemes` : ''}.
          </p>
        </div>
        {hasFamily && (
          <div style={toggleWrap}>
            <button
              type="button"
              onClick={() => setScope('self')}
              style={{ ...toggleBtn, ...(scope === 'self' ? toggleBtnActive : {}) }}
            >
              My portfolio
            </button>
            <button
              type="button"
              onClick={() => setScope('family')}
              style={{ ...toggleBtn, ...(scope === 'family' ? toggleBtnActive : {}) }}
            >
              👨‍👩‍👧 Family ({view?.family_members?.length})
            </button>
          </div>
        )}
      </div>

      {!hasAnyData ? (
        <div style={emptyCard}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📈</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0E7490' }}>No holdings on file yet</div>
          <p style={{ fontSize: 13, color: '#0F766E', marginTop: 8, lineHeight: 1.6 }}>
            Your holdings will appear here once we import them. If you believe holdings are missing,
            please <Link href="/portal/requests/new?category=statement_request" style={{ color: '#0E7490', fontWeight: 700 }}>raise a request</Link> and
            our team will reconcile.
          </p>
        </div>
      ) : (
        <>
          {/* Hero numbers */}
          <div style={hero}>
            <div>
              <div style={heroLabel}>{scope === 'family' ? 'Family Total AUM' : 'Total AUM'}</div>
              <div style={heroValue}>{INR(heroAum)}</div>
              <div style={heroSub}>Invested: {INR(heroInvested)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...heroLabel, color: heroGain >= 0 ? '#10B981' : '#EF4444' }}>
                {heroGain >= 0 ? 'Gain' : 'Loss'}
              </div>
              <div style={{ ...heroValue, color: heroGain >= 0 ? '#065F46' : '#991B1B' }}>
                {INR(Math.abs(heroGain))}
              </div>
              <div style={{ ...heroSub, color: heroGain >= 0 ? '#10B981' : '#EF4444' }}>
                {PCT(heroReturnPct)} absolute
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, marginBottom: 18 }}>
              Last updated: {new Date(lastUpdated).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          )}

          {/* Family members list (when scope=family) */}
          {scope === 'family' && view?.family_members && view.family_members.length > 0 && (
            <div style={{ marginBottom: 18, padding: 14, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12 }}>
              <h3 style={sectionTitle}>Family members</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 8 }}>
                {view.family_members.map((m) => (
                  <div key={m.id} style={memberCard}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.4px' }}>{m.relationship}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginTop: 2 }}>{m.display_name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{INR(m.total_aum)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings table — scope=self only (family-consolidated is per-scheme aggregation, deferred) */}
          {scope === 'self' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={sectionTitle}>Scheme breakup ({sortedHoldings.length})</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'value' | 'return' | 'scheme')} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff' }}>
                  <option value="value">By value</option>
                  <option value="return">By return</option>
                  <option value="scheme">By scheme name</option>
                </select>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={th}>Scheme</th>
                      <th style={{ ...th, textAlign: 'right' }}>Units</th>
                      <th style={{ ...th, textAlign: 'right' }}>NAV</th>
                      <th style={{ ...th, textAlign: 'right' }}>Invested</th>
                      <th style={{ ...th, textAlign: 'right' }}>Value</th>
                      <th style={{ ...th, textAlign: 'right' }}>Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.map((h) => {
                      const pctOfPort = heroAum > 0 ? (h.current_value / heroAum) * 100 : 0;
                      return (
                        <tr key={h.id}>
                          <td style={td}>
                            <div style={{ fontWeight: 600, color: '#0A1628' }}>{h.scheme_name}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>
                              {h.amc_name || ''} {h.category ? `· ${h.category}` : ''}
                              {pctOfPort > 0 && ` · ${pctOfPort.toFixed(1)}% of portfolio`}
                            </div>
                          </td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{h.units.toFixed(3)}</td>
                          <td style={{ ...td, textAlign: 'right' }}>{h.current_nav ? `₹${h.current_nav.toFixed(4)}` : '—'}</td>
                          <td style={{ ...td, textAlign: 'right' }}>{INR(h.total_invested)}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#0A1628' }}>{INR(h.current_value)}</td>
                          <td style={{ ...td, textAlign: 'right' }}>
                            <span style={{
                              background: (h.absolute_return_pct ?? 0) >= 0 ? '#ECFDF5' : '#FEE2E2',
                              color: (h.absolute_return_pct ?? 0) >= 0 ? '#065F46' : '#991B1B',
                              padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                            }}>{PCT(h.absolute_return_pct)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active SIPs widget */}
          {scope === 'self' && activeSips.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <h3 style={sectionTitle}>Active SIPs ({activeSips.length})</h3>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {activeSips.map((s) => (
                  <div key={s.id} style={sipCard}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0A1628', lineHeight: 1.3 }}>{s.scheme_name}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1E40AF', marginTop: 4 }}>₹{s.monthly_amount.toLocaleString('en-IN')}<span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>/{s.frequency.replace('_', ' ')}</span></div>
                    {s.next_due_date && (
                      <div style={{ fontSize: 10.5, color: '#475569', marginTop: 4 }}>
                        Next: {new Date(s.next_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {s.step_up_pct && (
                      <div style={{ fontSize: 9.5, color: '#10B981', marginTop: 2, fontWeight: 700 }}>↑ {s.step_up_pct}% step-up</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <Link href="/portal/requests/new?category=statement_request" style={{
          flex: 1, padding: '10px 16px', textAlign: 'center', fontSize: 12.5, fontWeight: 700,
          background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', borderRadius: 10, textDecoration: 'none',
        }}>📄 Request a statement</Link>
        <Link href="/portal/requests/new?category=sip_change" style={{
          flex: 1, padding: '10px 16px', textAlign: 'center', fontSize: 12.5, fontWeight: 700,
          background: '#F1F5F9', color: '#0A1628', borderRadius: 10, textDecoration: 'none',
        }}>⚙️ Change a SIP</Link>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 14, padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11.5, color: '#64748B', lineHeight: 1.55 }}>
        ARN-286886 — Trustner is an AMFI-registered Mutual Fund Distributor. All figures shown reflect data
        last imported on the date above. Latest NAVs may differ. Mutual fund investments are subject to
        market risks. Read all scheme-related documents carefully. Past performance is not indicative
        of future returns.
      </div>
    </div>
  );
}

const toggleWrap: React.CSSProperties = { display: 'inline-flex', background: '#F1F5F9', borderRadius: 8, padding: 2 };
const toggleBtn: React.CSSProperties = { padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer' };
const toggleBtnActive: React.CSSProperties = { background: '#fff', color: '#1E40AF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const hero: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 18, background: 'linear-gradient(135deg, #DBEAFE, #ECFEFF)', border: '1px solid #BFDBFE', borderRadius: 14 };
const heroLabel: React.CSSProperties = { fontSize: 10.5, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 };
const heroValue: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0A1628', marginTop: 4 };
const heroSub: React.CSSProperties = { fontSize: 11.5, color: '#475569', marginTop: 4 };
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', margin: 0 };
const memberCard: React.CSSProperties = { padding: 10, background: '#F8FAFC', borderRadius: 8 };
const sipCard: React.CSSProperties = { padding: 12, background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10 };
const emptyCard: React.CSSProperties = { padding: '32px 24px', background: 'linear-gradient(135deg,#ECFEFF,#CFFAFE)', border: '1px solid #67E8F9', borderRadius: 14, textAlign: 'center' };
const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', padding: '8px 10px', borderBottom: '1px solid #E2E8F0' };
const td: React.CSSProperties = { padding: '10px 10px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
