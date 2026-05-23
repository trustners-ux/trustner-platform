import type { Metadata } from 'next';
import AdminLayoutShell from './AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Admin | MeraSIP.com',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
