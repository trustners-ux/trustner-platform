'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { href: '/portal/home',               icon: '🏠', label: 'Home' },
  { href: '/portal/portfolio-review',   icon: '🩺', label: 'Health Check' },
  { href: '/portal/documents',          icon: '📄', label: 'Documents' },
  { href: '/portal/requests',           icon: '📨', label: 'Service requests' },
  { href: '/portal/holdings',           icon: '📈', label: 'Holdings' },
  { href: '/portal/statements',         icon: '📊', label: 'Statements' },
];

interface Props {
  displayName: string;
  clientCode: string;
  children: React.ReactNode;
}

export default function PortalShell({ displayName, clientCode, children }: Props) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function logout() {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      window.location.href = '/portal/login';
    } catch {
      window.location.href = '/portal/login';
    }
  }

  return (
    <div style={shell}>
      {/* Top bar */}
      <div style={topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setMobileNavOpen((v) => !v)} style={hamburgerBtn} className="portal-hamburger" aria-label="Menu">☰</button>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, letterSpacing: 1.5 }}>TRUSTNER · CLIENT PORTAL</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{displayName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={codeChip}>{clientCode}</span>
          <button onClick={logout} style={signOutBtn}>Sign out</button>
        </div>
      </div>

      <div style={layout}>
        {/* Sidebar */}
        <nav style={{ ...sidebar, ...(mobileNavOpen ? mobileNavOpenStyle : {}) }}>
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/portal/home' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileNavOpen(false)}
                style={active ? navItemActive : navItem}
              >
                <span style={{ marginRight: 10, fontSize: 16 }}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={navFooter}>
            ARN-286886 · AMFI Registered<br />
            Not investment advice (SEBI Adv Regs 2013).
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 760px) {
          .portal-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}

const shell: React.CSSProperties = { minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' };
const topBar: React.CSSProperties = { padding: '12px 22px', background: 'linear-gradient(135deg,#0A1628 0%,#1E40AF 70%,#06B6D4 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 };
const hamburgerBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer', display: 'none' };
const codeChip: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 999, fontFamily: 'ui-monospace, monospace' };
const signOutBtn: React.CSSProperties = { padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontWeight: 700, fontSize: 11.5, cursor: 'pointer' };
const layout: React.CSSProperties = { display: 'flex', maxWidth: 1200, margin: '0 auto', padding: 0 };
const sidebar: React.CSSProperties = { width: 200, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', borderRight: '1px solid #E2E8F0', minHeight: 'calc(100vh - 60px)' };
const mobileNavOpenStyle: React.CSSProperties = { position: 'fixed', top: 60, left: 0, bottom: 0, zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,.2)' };
const navItem: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, fontSize: 13, color: '#475569', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center' };
const navItemActive: React.CSSProperties = { ...navItem, background: '#EFF6FF', color: '#1E40AF', fontWeight: 800 };
const navFooter: React.CSSProperties = { padding: '12px 8px', fontSize: 9.5, color: '#94A3B8', lineHeight: 1.5, textAlign: 'center', borderTop: '1px solid #F1F5F9', marginTop: 12 };
const mainArea: React.CSSProperties = { flex: 1, padding: '20px 22px', maxWidth: 880, margin: '0 auto', width: '100%' };
