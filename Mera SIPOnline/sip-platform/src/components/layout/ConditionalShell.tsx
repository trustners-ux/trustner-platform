'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/sections/WhatsAppButton';
import { ChatWidget } from '@/components/sections/ChatWidget';
import { LeadCaptureModal } from '@/components/sections/LeadCaptureModal';
import { FloatingInvestCTA } from '@/components/sections/FloatingInvestCTA';
import { ContentProtection } from '@/components/security/ContentProtection';

/**
 * Wraps children with the public site shell (Header, Footer, widgets)
 * ONLY for public pages. Admin and RM pages get bare children.
 */
export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isRM = pathname.startsWith('/rm');
  const isInternalPage = isAdmin || isRM;

  if (isInternalPage) {
    // Admin/RM pages render their own layout shell — no public chrome
    return <>{children}</>;
  }

  return (
    <>
      <ContentProtection />
      <Header />
      <main className="min-h-screen pt-24 lg:pt-[104px]">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <ChatWidget />
      <LeadCaptureModal />
      <FloatingInvestCTA />
    </>
  );
}
