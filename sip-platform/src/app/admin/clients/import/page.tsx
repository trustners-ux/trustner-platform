/**
 * /admin/clients/import — REDIRECT to /admin/client-master/import.
 * Original PD CSV import preserved at page.pd-legacy.tsx.bak.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Bulk import — Trustner',
  robots: { index: false, follow: false },
};

export default function ClientsImportRedirect() {
  redirect('/admin/client-master/import');
}
